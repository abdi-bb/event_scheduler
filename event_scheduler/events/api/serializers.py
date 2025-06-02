from recurrence import deserialize
from recurrence import serialize
from rest_framework import serializers

from event_scheduler.events.models import Event


class RecurrenceSerializerField(serializers.Field):
    def to_representation(self, value):
        if value is None:
            return None
        return serialize(value)

    def to_internal_value(self, data):
        if not data:
            return None
        try:
            return deserialize(data)
        except ValueError as e:
            raise serializers.ValidationError(str(e)) from e


class EventSerializer(serializers.ModelSerializer):
    recurrence = RecurrenceSerializerField(required=False, allow_null=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "description",
            "start_time",
            "end_time",
            "is_recurring",
            "recurrence",
            "recurrence_end",
            "recurrence_count",
            "frequency",
            "interval",
            "weekdays",
            "monthly_pattern",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, data):
        if data["start_time"] > data["end_time"]:
            msg = "End time must be after start time."
            raise serializers.ValidationError(msg)

        if data.get("is_recurring") and not data.get("recurrence"):
            msg = "Recurrence pattern is required for recurring events."
            raise serializers.ValidationError(msg)

        return data
