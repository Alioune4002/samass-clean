import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response

from .models import Service, Availability, Booking, ContactMessage
from .serializers import (
    ServiceSerializer,
    AvailabilitySerializer,
    BookingSerializer,
    ContactMessageSerializer,
)

# Import des templates HTML
from .utils.email_templates import (
    html_contact_notification,
    html_contact_confirmation,
    html_booking_confirmation,
    html_booking_cancellation,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# SERVICES
# ─────────────────────────────────────────────
class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer


# ─────────────────────────────────────────────
# AVAILABILITIES
# ─────────────────────────────────────────────
class AvailabilityViewSet(viewsets.ModelViewSet):
    queryset = Availability.objects.all()
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        date_param = self.request.query_params.get("date")

        if date_param:
            qs = qs.filter(start_datetime__date=date_param, is_booked=False)

        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response({"message": "Disponibilité ajoutée."}, status=201)
        return Response(serializer.errors, status=400)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            self.perform_update(serializer)
            return Response({"message": "Disponibilité mise à jour."})
        return Response(serializer.errors, status=400)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({"message": "Disponibilité supprimée."})


# ─────────────────────────────────────────────
# BOOKINGS
# ─────────────────────────────────────────────
class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related("service", "availability").all()
    serializer_class = BookingSerializer

    def create(self, request, *args, **kwargs):
        try:
            data = request.data
            service_id = data.get("service") or data.get("service_id")
            availability_id = data.get("availability") or data.get("availability_id")
            duration_minutes = data.get("duration_minutes")
            name = data.get("client_name")
            email = data.get("client_email")
            phone = data.get("client_phone", "")

            if not all([service_id, availability_id, name, email, duration_minutes]):
                return Response({"error": "Champs manquants."}, status=400)

            try:
                duration_value = int(duration_minutes)
            except (TypeError, ValueError):
                return Response({"error": "Durée invalide."}, status=400)

            with transaction.atomic():
                availability = Availability.objects.select_for_update().get(pk=availability_id, is_booked=False)
                service = Service.objects.get(pk=service_id)

                # Vérifie que la durée demandée existe pour le service
                allowed_durations = [int(d) for d in service.durations_prices.keys()]
                if duration_value not in allowed_durations:
                    return Response({"error": "Durée non proposée pour ce service."}, status=400)

                slot_minutes = int((availability.end_datetime - availability.start_datetime).total_seconds() / 60)
                if duration_value > slot_minutes:
                    return Response({"error": "Durée supérieure au créneau disponible."}, status=400)

                booking = Booking.objects.create(
                    service=service,
                    availability=availability,
                    client_name=name,
                    client_email=email,
                    client_phone=phone,
                    duration_minutes=duration_value,
                    status="pending",
                )

                availability.is_booked = True
                availability.save()

            # Email HTML au client : demande en attente
            html_content = html_booking_confirmation(
                name,
                service.title,
                availability.start_datetime.date(),
                availability.start_datetime.time(),
            )

            mail = EmailMultiAlternatives(
                subject="Votre demande de réservation – SAMASS",
                body="Email HTML requis.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
            )
            mail.attach_alternative(html_content, "text/html")
            mail.send()

            return Response(BookingSerializer(booking).data, status=201)

        except Availability.DoesNotExist:
            return Response({"error": "Créneau indisponible."}, status=400)
        except Exception as e:
            logger.error(f"Erreur réservation : {str(e)}")
            return Response({"error": "Erreur serveur."}, status=500)

    # CONFIRM BOOKING ────────────────
    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        booking = self.get_object()
        booking.status = "confirmed"
        booking.save()

        html_content = html_booking_confirmation(
            booking.client_name,
            booking.service.title,
            booking.availability.start_datetime.date(),
            booking.availability.start_datetime.time(),
        )

        mail = EmailMultiAlternatives(
            subject="Votre réservation est confirmée – SAMASS",
            body="Email HTML requis.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[booking.client_email],
        )
        mail.attach_alternative(html_content, "text/html")
        mail.send()

        return Response({"message": "Réservation confirmée."})

    # CANCEL BOOKING ────────────────
    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        booking.status = "canceled"
        booking.save()

        availability = booking.availability
        availability.is_booked = False
        availability.save()

        html_content = html_booking_cancellation(
            booking.client_name,
            booking.service.title,
            availability.start_datetime.date(),
            availability.start_datetime.time(),
        )

        mail = EmailMultiAlternatives(
            subject="Votre réservation a été annulée – SAMASS",
            body="Email HTML requis.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[booking.client_email],
        )
        mail.attach_alternative(html_content, "text/html")
        mail.send()

        return Response({"message": "Réservation annulée et créneau libéré."})


# ─────────────────────────────────────────────
# CONTACT FORM
# ─────────────────────────────────────────────
@api_view(["GET", "POST"])
def contact_form_submit(request):
    if request.method == "GET":
        messages = ContactMessage.objects.all().order_by("-created_at")
        return Response(ContactMessageSerializer(messages, many=True).data)

    try:
        name = request.data.get("name")
        email = request.data.get("email")
        phone = request.data.get("phone", "")
        message = request.data.get("message")

        if not all([name, email, message]):
            return Response({"error": "Champs requis manquants."}, status=400)

        ContactMessage.objects.create(
            name=name, email=email, phone=phone, message=message
        )

        admin_email = getattr(settings, "EMAIL_HOST_USER", None)

        # Email ADMIN (HTML)
        if admin_email:
            html_admin = html_contact_notification(name, email, phone, message)

            mail_admin = EmailMultiAlternatives(
                subject=f"Nouveau message – {name}",
                body="HTML email required.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[admin_email],
            )
            mail_admin.attach_alternative(html_admin, "text/html")
            mail_admin.send()

        # Email CLIENT (HTML)
        html_client = html_contact_confirmation(name)

        mail_client = EmailMultiAlternatives(
            subject="Votre message a bien été reçu – SAMASS",
            body="HTML email required.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
        )
        mail_client.attach_alternative(html_client, "text/html")
        mail_client.send()

        return Response({"message": "Message envoyé avec succès."}, status=200)

    except Exception as e:
        logger.error(f"Erreur contact : {str(e)}")
        return Response({"error": "Erreur serveur."}, status=500)
