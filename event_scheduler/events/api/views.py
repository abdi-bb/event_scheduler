from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import generics
from rest_framework import serializers
from rest_framework import status
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from event_scheduler.events.models import Event

from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows events to be viewed or edited.

    Supports standard CRUD operations for events, with special handling for:
    - Recurring events
    - Modifying specific occurrences of recurring events

    Endpoint: /api/events/
    """

    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only events belonging to the authenticated user"""
        return Event.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically associate new events with the current user"""
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        """
        Update an entire event series or a specific occurrence.

        To update a specific occurrence of a recurring event:
        - Include 'occurrence_date' in the payload
        - The original occurrence will be cancelled
        - A new one-time event will be created with the updates

        Example payload for occurrence update:
        {
            "title": "Updated Title",
            "occurrence_date": "2023-06-14T09:00:00Z"
        }

        occurrence_date:
         "ISO8601 datetime string with timezone (required format: YYYY-MM-DDTHH:MM:SSZ)"
        """
        occurrence_date = request.data.get("occurrence_date")
        if occurrence_date:
            return self.handle_occurrence_update(request, *args, **kwargs)
        return super().update(request, *args, **kwargs)

    def handle_occurrence_update(self, request, *args, **kwargs):
        """Handle updating a specific occurrence of a recurring event"""
        instance = self.get_object()

        try:
            # Parse the occurrence date properly
            occurrence_date_str = request.data.get("occurrence_date")
            if not occurrence_date_str:
                raise serializers.ValidationError(
                    {"occurrence_date": "This field is required"},
                )

            # Convert to datetime (handles both naive and aware datetimes)
            if isinstance(occurrence_date_str, str):
                occurrence_date = timezone.datetime.fromisoformat(
                    occurrence_date_str.replace("Z", "+00:00"),
                )
            else:
                occurrence_date = occurrence_date_str

            # Ensure we have a timezone-aware datetime
            if timezone.is_naive(occurrence_date):
                occurrence_date = timezone.make_aware(occurrence_date)

            # Verify the occurrence date is valid
            if occurrence_date < timezone.now():
                return Response(
                    {"error": "Cannot modify past events"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Add exception to recurrence
            if "exceptions" not in instance.exceptions:
                instance.exceptions = []

            # Store as ISO string to avoid serialization issues
            instance.exceptions.append(occurrence_date.isoformat())
            instance.save()

            # Create new event for the modified occurrence
            new_event_data = request.data.copy()
            new_event_data["is_recurring"] = False
            new_event_data["start"] = occurrence_date
            new_event_data["end"] = occurrence_date + (instance.end - instance.start)

            serializer = self.get_serializer(data=new_event_data)
            serializer.is_valid(raise_exception=True)
            serializer.save(user=request.user)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ValueError as e:
            return Response(
                {"error": f"Invalid date format: {e!s}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, *args, **kwargs):
        """
        Delete an event or specific occurrence of a recurring event.

        Usage:
        1. Delete specific occurrence:
        DELETE /api/events/{id}/?occurrence_date={ISO8601_datetime}
        Example: /api/events/42/?occurrence_date=2023-06-14T10:00:00Z

        2. Delete entire event (all occurrences):
        DELETE /api/events/{id}/
        Example: /api/events/42/

        Responses:
        - 204 No Content: Success
        - 400 Bad Request: Invalid date format or invalid operation
        - 404 Not Found: Event not found

        Notes:
        - For recurring events, deleting a specific occurrence adds it to exceptions
        - The occurrence_date must be in ISO8601 format (UTC recommended)
        - Cannot delete past occurrences
        """

        occurrence_date = request.query_params.get(
            "occurrence_date",
        )  # Changed from request.data
        instance = self.get_object()

        if occurrence_date:
            try:
                # Handle both naive and aware datetime strings
                if "Z" in occurrence_date:
                    occurrence_date = occurrence_date.replace("Z", "+00:00")

                # Parse directly to timezone-aware datetime
                occurrence_date = timezone.datetime.fromisoformat(occurrence_date)

                if not timezone.is_aware(occurrence_date):
                    occurrence_date = timezone.make_aware(occurrence_date)

                if not instance.is_recurring:
                    return Response(
                        {"error": "Cannot delete occurrence from non-recurring event"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                instance.exceptions = instance.exceptions or []
                instance.exceptions.append(occurrence_date.isoformat())
                instance.save()
                return Response(status=status.HTTP_204_NO_CONTENT)

            except ValueError as e:
                return Response(
                    {"error": f"Invalid date format: {e!s}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Default: delete entire event
        return super().destroy(request, *args, **kwargs)


class CalendarView(generics.ListAPIView):
    """
    API endpoint for retrieving events in calendar view format.

    Returns all events and their occurrences within a specified date range.

    Query Parameters:
    - start: Start date (ISO format, default: start of current month)
    - end: End date (ISO format, default: end of current month)

    Example: /api/calendar/?start=2023-06-01&end=2023-06-30

    Response includes:
    - All one-time events in range
    - All occurrences of recurring events in range
    - Properly handles cancelled occurrences
    """

    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    queryset = Event.objects.none()  # Add this line to satisfy DRF requirements

    def list(self, request, *args, **kwargs):
        start_str = request.query_params.get("start")
        end_str = request.query_params.get("end")

        # Default to current month
        start_dt = (
            timezone.now().replace(day=1, hour=0, minute=0, second=0)
            if not start_str
            else timezone.make_aware(timezone.datetime.fromisoformat(start_str))
        )
        end_dt = (
            (start_dt + timedelta(days=31)).replace(day=1)
            if not end_str
            else timezone.make_aware(timezone.datetime.fromisoformat(end_str))
        )

        events = Event.objects.filter(
            Q(user=request.user)
            & (
                Q(start__range=(start_dt, end_dt))
                | Q(end__range=(start_dt, end_dt))
                | Q(is_recurring=True)
            ),
        )

        occurrences = []
        for event in events:
            for occ in event.get_occurrences(start_dt, end_dt):
                if not occ["cancelled"]:
                    occurrences.append(  # noqa: PERF401
                        {
                            "id": event.id,
                            "title": event.title,
                            "start": occ["start"],
                            "end": occ["end"],
                            "description": event.description,
                            "is_recurring": event.is_recurring,
                        },
                    )

        return Response(sorted(occurrences, key=lambda x: x["start"]))


class UpcomingEventsView(generics.ListAPIView):
    """
    API endpoint for retrieving upcoming events in list view format.

    Returns all events and their occurrences within the next 30 days.
    Limited to 50 occurrences for performance.

    Example: /api/upcoming/

    Response includes:
    - All one-time events in next 30 days
    - All occurrences of recurring events in next 30 days
    - Properly handles cancelled occurrences
    - Sorted by start time
    """

    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    queryset = Event.objects.none()  # Add this line to satisfy DRF requirements

    def list(self, request, *args, **kwargs):
        now = timezone.now()
        end_dt = now + timedelta(days=30)

        events = Event.objects.filter(
            Q(user=request.user) & (Q(end__gte=now) | Q(is_recurring=True)),
        )

        occurrences = []
        for event in events:
            for occ in event.get_occurrences(now, end_dt):
                if not occ["cancelled"]:
                    occurrences.append(  # noqa: PERF401
                        {
                            "id": event.id,
                            "title": event.title,
                            "start": occ["start"],
                            "end": occ["end"],
                            "description": event.description,
                            "is_recurring": event.is_recurring,
                        },
                    )

        # Sort and limit to 50 occurrences
        sorted_occ = sorted(occurrences, key=lambda x: x["start"])
        return Response(sorted_occ[:50])
