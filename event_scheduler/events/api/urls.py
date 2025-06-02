from django.conf import settings
from rest_framework.routers import DefaultRouter
from rest_framework.routers import SimpleRouter

from .views import EventViewSet

# Use DefaultRouter in debug mode for the browsable API; otherwise, use SimpleRouter
router = DefaultRouter() if settings.DEBUG else SimpleRouter()

router.register(r"events", EventViewSet, basename="event")

urlpatterns = router.urls
