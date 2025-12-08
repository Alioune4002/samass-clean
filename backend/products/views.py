import logging
from datetime import timedelta
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

ADMIN_EMAIL = getattr(settings, "DEFAULT_FROM_EMAIL", None)
ADMIN_PORTAL_URL = "https://samassbysam.com/admin"
BOOKING_LOCATION = getattr(
    settings,
    "BOOKING_LOCATION",
    "1 place Guy Ropartz 29000, Quimper",
)
BOOKING_PARKING = getattr(settings, "BOOKING_PARKING", "Place 🅿️ 31")
BOOKING_CODE = getattr(settings, "BOOKING_CODE", "clé3579clé")
BOOKING_FLOOR = getattr(settings, "BOOKING_FLOOR", "RDC, première porte à gauche")
BUFFER_MINUTES = 60  # Pause minimale entre deux massages


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

        try:
            with transaction.atomic():
                availability = Availability.objects.select_for_update().get(
                    pk=availability_id, is_booked=False
                )
                service = Service.objects.get(pk=service_id)

                allowed_durations = [int(d) for d in service.durations_prices.keys()]
                if duration_value not in allowed_durations:
                    return Response(
                        {"error": "Durée non proposée pour ce service."}, status=400
                    )

                slot_minutes = int(
                    (availability.end_datetime - availability.start_datetime).total_seconds()
                    / 60
                )
                required_minutes = duration_value + BUFFER_MINUTES
                if required_minutes > slot_minutes:
                    return Response(
                        {"error": "Le créneau est trop court pour cette durée (pause incluse)."},
                        status=400,
                    )

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

                booking_start = availability.start_datetime
                booking_end = availability.start_datetime + timedelta(minutes=duration_value)
                buffer_end = booking_end + timedelta(minutes=BUFFER_MINUTES)

                # Créneau avant le massage
                if booking_start > availability.start_datetime:
                    Availability.objects.create(
                        start_datetime=availability.start_datetime,
                        end_datetime=booking_start,
                        is_booked=False,
                    )

                # Créneau après le massage (après la pause)
                if buffer_end < availability.end_datetime:
                    Availability.objects.create(
                        start_datetime=buffer_end,
                        end_datetime=availability.end_datetime,
                        is_booked=False,
                    )
        except Availability.DoesNotExist:
            return Response({"error": "Créneau indisponible."}, status=400)
        except Service.DoesNotExist:
            return Response({"error": "Service introuvable."}, status=400)
        except Exception as e:
            logger.error(f"Erreur réservation : {str(e)}")
            return Response({"error": "Erreur serveur."}, status=500)

        # Email texte au client : demande en attente avec délai
        try:
            text_body = (
                f"Bonjour {name},\n\n"
                f"Votre demande de massage {service.title} ({duration_value} min) est enregistrée pour "
                f"{booking_start.strftime('%d/%m/%Y à %H:%M')}.\n\n"
                "Si vous ne recevez pas de confirmation au plus tard 2h avant l'heure du massage, "
                "considérez que la demande est annulée.\n\n"
                "Vous recevrez un email de confirmation ou de refus de la part de Sam.\n\n"
                "À bientôt,\nSAMASS"
            )
            mail = EmailMultiAlternatives(
                subject="Votre demande de réservation – SAMASS",
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
            )
            mail.send()
        except Exception as e:
            logger.warning(f"Email client non envoyé : {e}")

        # Email ADMIN : nouvelle demande
        try:
            admin_recipient = ADMIN_EMAIL or getattr(settings, "EMAIL_HOST_USER", None)
            if admin_recipient:
                admin_html = f"""
                <div style="font-family:Arial,sans-serif;">
                  <h2>Nouvelle demande de réservation</h2>
                  <p><strong>Client :</strong> {name} ({email})</p>
                  <p><strong>Service :</strong> {service.title}</p>
                  <p><strong>Durée :</strong> {duration_value} min</p>
                  <p><strong>Créneau :</strong> {availability.start_datetime} → {availability.end_datetime}</p>
                  <p><a href="{ADMIN_PORTAL_URL}" style="color:#10b981;">Ouvrir l’espace admin</a></p>
                </div>
                """
                admin_mail = EmailMultiAlternatives(
                    subject="Nouvelle demande de réservation – SAMASS",
                    body="Nouvelle demande de réservation.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[admin_recipient],
                )
                admin_mail.attach_alternative(admin_html, "text/html")
                admin_mail.send()
        except Exception as e:
            logger.warning(f"Email admin non envoyé : {e}")

        return Response(BookingSerializer(booking).data, status=201)

    # CONFIRM BOOKING ────────────────
    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        booking = self.get_object()
        booking.status = "confirmed"
        booking.save()

        try:
            start_dt = booking.availability.start_datetime
            mail = EmailMultiAlternatives(
                subject="Votre réservation est confirmée – SAMASS",
                body=(
                    f"Bonjour {booking.client_name},\n\n"
                    f"Je fais suite à votre demande de massage {booking.service.title} "
                    f"de {booking.duration_minutes} minutes.\n\n"
                    f"Je vous attends pour {start_dt.strftime('%H:%M')} le "
                    f"{start_dt.strftime('%d/%m/%Y')}.\n\n"
                    f"L’adresse : {BOOKING_LOCATION}\n"
                    f"Place 🅿️ : {BOOKING_PARKING}\n"
                    f"Code : {BOOKING_CODE}\n"
                    f"Accès : {BOOKING_FLOOR}\n\n"
                    "Merci de me prévenir en cas d’imprévu.\n\n"
                    "Cordialement,\nSam 🍃"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[booking.client_email],
            )
            mail.send()
        except Exception as e:
            logger.warning(f"Email confirmation non envoyé : {e}")

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

        try:
            html_content = html_booking_cancellation(
                booking.client_name,
                booking.service.title,
                availability.start_datetime.date(),
                availability.start_datetime.time(),
            )

            mail = EmailMultiAlternatives(
                subject="Votre réservation a été annulée – SAMASS",
                body="Votre créneau a été libéré.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[booking.client_email],
            )
            mail.attach_alternative(html_content, "text/html")
            mail.send()
        except Exception as e:
            logger.warning(f"Email annulation non envoyé : {e}")

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
