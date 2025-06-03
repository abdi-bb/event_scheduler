from dateutil.rrule import rruleset
from dateutil.rrule import rrulestr
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

User = get_user_model()


class Event(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    start = models.DateTimeField()
    end = models.DateTimeField()
    description = models.TextField(blank=True)
    is_recurring = models.BooleanField(default=False)
    recurrence_rule = models.TextField(blank=True, null=True)  # noqa: DJ001

    # For recurrence exceptions
    exceptions = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def get_occurrences(self, start_dt, end_dt):
        """Generate event occurrences between two dates"""
        if not self.is_recurring:
            if start_dt <= self.start <= end_dt:
                return [
                    {
                        "start": self.start,
                        "end": self.end,
                        "cancelled": False,
                    },
                ]
            return []

        try:
            # Clean the RRULE string before parsing
            rule_str = self.recurrence_rule.strip()
            if not rule_str.startswith("RRULE:"):
                rule_str = "RRULE:" + rule_str

            # Parse recurrence rule
            ruleset = rruleset()
            rule = rrulestr(rule_str, dtstart=self.start)
            ruleset.rrule(rule)

            # Add exceptions
            for ex_date in self.exceptions:
                if isinstance(ex_date, str):
                    ex_date = timezone.datetime.fromisoformat(ex_date)  # noqa: PLW2901
                ruleset.exdate(ex_date)

            occurrences = []
            duration = self.end - self.start

            for dt in ruleset.between(start_dt, end_dt, inc=True):
                occurrences.append(  # noqa: PERF401
                    {
                        "start": dt,
                        "end": dt + duration,
                        "cancelled": False,
                    },
                )

            return occurrences  # noqa: TRY300

        except Exception as e:
            # Log the error and return empty list
            import logging

            logging.exception(
                f"Error parsing recurrence rule {self.recurrence_rule}: {e!s}",  # noqa: G004, TRY401
            )
            return []
