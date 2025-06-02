from django.contrib.auth import get_user_model
from django.db import models
from recurrence.fields import RecurrenceField

User = get_user_model()


class Event(models.Model):
    FREQUENCY_CHOICES = [
        ("DAILY", "Daily"),
        ("WEEKLY", "Weekly"),
        ("MONTHLY", "Monthly"),
        ("YEARLY", "Yearly"),
    ]

    MONTHLY_PATTERN_CHOICES = [
        ("SAME_DAY", "Same day each month"),
        ("RELATIVE_DAY", "Relative day in month"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="events")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    # Recurrence fields
    is_recurring = models.BooleanField(default=False)
    recurrence = RecurrenceField(blank=True, null=True)
    recurrence_end = models.DateTimeField(blank=True, null=True)
    recurrence_count = models.PositiveIntegerField(blank=True, null=True)

    # For custom recurrence patterns
    frequency = models.CharField(  # noqa: DJ001
        max_length=10,
        choices=FREQUENCY_CHOICES,
        blank=True,
        null=True,
    )
    interval = models.PositiveIntegerField(default=1)
    weekdays = models.CharField(  # noqa: DJ001
        max_length=13,
        blank=True,
        null=True,
    )  # Comma-separated weekdays (e.g., "MO,WE,FR")
    monthly_pattern = models.CharField(  # noqa: DJ001
        max_length=12,
        choices=MONTHLY_PATTERN_CHOICES,
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.start_time})"
