from django.utils import timezone
from rest_framework import serializers

from event_scheduler.events.models import Event


class EventSerializer(serializers.ModelSerializer):
    """
    Serializer for Event model with special handling for:
    - Recurrence rule creation and validation
    - Occurrence-specific modifications

    Fields:
    - id: Read-only unique identifier
    - title: Event title (required)
    - start: Event start datetime (required, ISO format)
    - end: Event end datetime (required, ISO format)
    - description: Optional event description
    - is_recurring: Boolean indicating if event recurs
    - recurrence_rule: Read-only RRULE string
    - recurrence: Write-only recurrence configuration
    - occurrence_date: Write-only for modifying specific occurrences

    Recurrence Configuration (when is_recurring=True):
    {
        "frequency": "daily|weekly|monthly|yearly",
        "interval": Number (default: 1),
        "days": [0-6] (for weekly, 0=Monday),
        "until": ISO datetime (optional end date),
        "count": Number (optional max occurrences)
    }

    recurrence_params: Read-only parsed version of recurrence_rule
    Contains: {
        frequency: "daily|weekly|monthly|yearly",
        interval: int,
        days?: [int] (for weekly),
        byday?: "MO|TU|..." (for monthly/yearly),
        bysetpos?: int (for monthly/yearly),
        until?: datetime,
        count?: int
    }
    """

    recurrence = serializers.JSONField(required=False, write_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "start",
            "end",
            "description",
            "is_recurring",
            "recurrence_rule",
            "recurrence",
        ]
        read_only_fields = ["id", "recurrence_rule"]

    def validate(self, data):  # noqa: C901, PLR0912
        """
        Validate event data including:
        - Time range (end must be after start)
        - Recurrence rules when is_recurring=True
        - Proper RRULE string generation
        """
        # Validate time range
        start = data.get("start")
        end = data.get("end")

        if start is not None and end is not None:
            if end <= start:
                msg = "End time must be after start time"
                raise serializers.ValidationError(
                    {
                        "end": msg,
                    },
                )

        # Handle recurrence rules
        if data.get("is_recurring"):
            recurrence = data.get("recurrence")
            if not recurrence:
                msg = "Recurrence rules required for recurring events"
                raise serializers.ValidationError(
                    {
                        "recurrence": msg,
                    },
                )

            try:
                freq_map = {
                    "daily": "DAILY",
                    "weekly": "WEEKLY",
                    "monthly": "MONTHLY",
                    "yearly": "YEARLY",
                }

                rrule_parts = [
                    f"FREQ={freq_map[recurrence['frequency']]}",
                    f"INTERVAL={recurrence.get('interval', 1)}",
                ]

                # Add weekday rules if present
                if recurrence["frequency"] == "weekly" and recurrence.get("days"):
                    weekday_map = {
                        0: "SU",
                        1: "MO",
                        2: "TU",
                        3: "WE",
                        4: "TH",
                        5: "FR",
                        6: "SA",
                    }
                    days = [weekday_map[day] for day in recurrence["days"]]
                    rrule_parts.append(f"BYDAY={','.join(days)}")

                # Add direct byday/bysetpos if present (for monthly/yearly)
                if recurrence.get("byday"):
                    rrule_parts.append(f"BYDAY={recurrence['byday']}")
                if recurrence.get("bysetpos"):
                    rrule_parts.append(f"BYSETPOS={recurrence['bysetpos']}")

                # Add end conditions
                if recurrence.get("until"):
                    try:
                        # Parse the string to datetime if needed
                        if isinstance(recurrence["until"], str):
                            until_dt = timezone.datetime.fromisoformat(
                                recurrence["until"].replace("Z", "+00:00"),
                            )
                        else:
                            until_dt = recurrence["until"]

                        # Format for RRULE (in UTC)
                        rrule_parts.append(
                            f"UNTIL={until_dt.strftime('%Y%m%dT%H%M%SZ')}",
                        )
                    except (ValueError, AttributeError) as e:
                        raise serializers.ValidationError(f"Invalid until date: {e!s}")  # noqa: B904, EM102, TRY003
                elif recurrence.get("count"):
                    rrule_parts.append(f"COUNT={recurrence['count']}")

                data["recurrence_rule"] = f"RRULE:{';'.join(rrule_parts)}"

            except Exception as e:  # noqa: BLE001
                raise serializers.ValidationError(f"Invalid recurrence rule: {e!s}")  # noqa: B904, EM102, TRY003

        return data

    def create(self, validated_data):
        # Remove temporary fields
        validated_data.pop("recurrence", None)
        return super().create(validated_data)
