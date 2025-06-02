from django.urls import include
from django.urls import path

urlpatterns = [
    path("", include("event_scheduler.users.api.urls")),
    # Your stuff: custom urls includes go here
    path("events/", include("event_scheduler.events.api.urls")),
]
