from django.conf import settings
from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

from .views import CalendarView
from .views import EventViewSet
from .views import UpcomingEventsView

# Use DefaultRouter in debug mode for the browsable API; otherwise, use SimpleRouter
router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register(r"events", EventViewSet, basename="event")

urlpatterns = router.urls

urlpatterns += [
    path("calendar/", CalendarView.as_view(), name="calendar-view"),
    path("upcoming/", UpcomingEventsView.as_view(), name="upcoming-events"),
]
