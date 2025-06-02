from django.db.models import Q
from django.utils import timezone
from recurrence import Recurrence
from recurrence import Rule
from recurrence.base import Weekday
from rest_framework import status
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from event_scheduler.events.models import Event

from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Get events for the authenticated user
        queryset = Event.objects.filter(user=self.request.user)

        # Filter for specific date if provided
        date = self.request.query_params.get("date", None)
        if date:
            try:
                date = timezone.datetime.strptime(date, "%Y-%m-%d").date()
                queryset = queryset.filter(
                    Q(start_time__date=date)
                    | Q(is_recurring=True, recurrence__dtstart__lte=date),
                )
            except ValueError:
                pass

        # Filter for upcoming events if requested
        upcoming = self.request.query_params.get("upcoming", None)
        if upcoming:
            queryset = queryset.filter(
                Q(start_time__gte=timezone.now()) | Q(is_recurring=True),
            ).order_by("start_time")

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        # Handle recurrence rules
        if data.get("is_recurring", False):
            recurrence = Recurrence(dtstart=data["start_time"])

            if data.get("frequency"):
                rule = Rule(
                    frequency=data["frequency"],
                    interval=int(data.get("interval", 1)),
                )

                # Handle weekdays
                if data.get("weekdays"):
                    weekday_map = {
                        "SU": Weekday.SUNDAY,
                        "MO": Weekday.MONDAY,
                        "TU": Weekday.TUESDAY,
                        "WE": Weekday.WEDNESDAY,
                        "TH": Weekday.THURSDAY,
                        "FR": Weekday.FRIDAY,
                        "SA": Weekday.SATURDAY,
                    }
                    weekdays = data["weekdays"].split(",")
                    rule.byday = [weekday_map[day.upper()] for day in weekdays]

                recurrence.rules.add(rule)

                # Handle end conditions
                if data.get("recurrence_end"):
                    recurrence.until = data["recurrence_end"]
                elif data.get("recurrence_count"):
                    # This is a simplified approach - might need adjustment
                    pass

                data["recurrence"] = recurrence

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )
