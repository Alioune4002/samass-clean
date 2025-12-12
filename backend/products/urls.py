from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceViewSet,
    AvailabilityViewSet,
    BookingViewSet,
    contact_form_submit,
    contact_message_detail,
)

router = DefaultRouter()
router.register(r"services", ServiceViewSet)
router.register(r"availabilities", AvailabilityViewSet)
router.register(r"bookings", BookingViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("contact/", contact_form_submit, name="contact_form_submit"),
    path("contact/<int:pk>/", contact_message_detail, name="contact_message_detail"),
]
