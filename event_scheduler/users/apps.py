import contextlib

from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class UsersConfig(AppConfig):
    name = "event_scheduler.users"
    verbose_name = _("Users")

    def ready(self):
        with contextlib.suppress(ImportError):
            import event_scheduler.users.signals  # noqa: F401
