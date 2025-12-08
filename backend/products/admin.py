from django.contrib import admin
from .models import (
    
    Service,
    Availability,
    ContactMessage,
    Booking,
)




@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("title", "get_prices_display", "description")

    def get_prices_display(self, obj):
        return obj.durations_prices

    get_prices_display.short_description = "Prix"


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ("start_datetime", "end_datetime", "is_booked")
    list_filter = ("is_booked",)




@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone", "created_at")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "service",
        "client_name",
        "client_email",
        "status",
        "created_at",
    )
    list_filter = ("status", "service")
