import logging
import os
from datetime import datetime, timedelta
from django.utils import timezone
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

ADMIN_EMAIL = getattr(settings, "ADMIN_EMAIL", None) or getattr(settings, "DEFAULT_FROM_EMAIL", None)
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


def render_email(title: str, paragraphs: list[str]) -> str:
    """Construit un HTML simple et lisible pour limiter le spam."""
    paras_html = "".join(f"<p style='margin:0 0 12px;color:#1f2937;font-size:14px;'>{p}</p>" for p in paragraphs)
    return f"""
    <div style="max-width:540px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;border-radius:12px;border:1px solid #e2e8f0;">
      <h2 style="margin:0 0 16px;font-size:20px;color:#047857;">{title}</h2>
      {paras_html}
      <p style='margin:18px 0 0;font-size:12px;color:#6b7280;'>SAMASS — Massages à Quimper</p>
    </div>
    """


def send_email(to_emails, subject: str, text: str, html: str | None = None):
    """
    Envoi via l'API SendGrid si la clé est présente, sinon fallback SMTP (EmailBackend).
    """
    api_key = os.environ.get("SENDGRID_API_KEY")
    if api_key:
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail

            message = Mail(
                from_email=settings.DEFAULT_FROM_EMAIL,
                to_emails=to_emails,
                subject=subject,
                plain_text_content=text,
                html_content=html or text,
            )
            sg = SendGridAPIClient(api_key)
            sg.send(message)
            return True
        except Exception as exc:
            logger.warning(f"SendGrid API error: {exc}")

    # Fallback SMTP (Gmail ou autre backend configuré)
    try:
        mail = EmailMultiAlternatives(
            subject=subject,
            body=text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=to_emails if isinstance(to_emails, list) else [to_emails],
        )
        if html:
            mail.attach_alternative(html, "text/html")
        mail.send()
        return True
    except Exception as exc:
        logger.warning(f"SMTP fallback error: {exc}")
        return False


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
        qs = qs.filter(end_datetime__gte=timezone.now())

        if date_param:
            qs = qs.filter(start_datetime__date=date_param, is_booked=False)

        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            start = serializer.validated_data["start_datetime"]
            end = serializer.validated_data["end_datetime"]
            # Supprime les créneaux qui se chevauchent pour éviter les doublons incohérents
            Availability.objects.filter(
                start_datetime__lt=end,
                end_datetime__gt=start,
            ).delete()
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
        start_datetime_raw = data.get("start_datetime")
        name = data.get("client_name")
        email = data.get("client_email")
        phone = data.get("client_phone", "")
        comment = data.get("client_comment", "")

        if not all([service_id, availability_id, name, email, duration_minutes]):
            return Response({"error": "Champs manquants."}, status=400)

        try:
            duration_value = int(duration_minutes)
        except (TypeError, ValueError):
            return Response({"error": "Durée invalide."}, status=400)

        try:
            start_override = (
                datetime.fromisoformat(start_datetime_raw)
                if start_datetime_raw
                else None
            )
            if start_override and settings.USE_TZ and start_override.tzinfo is None:
                start_override = timezone.make_aware(
                    start_override, timezone.get_default_timezone()
                )
        except Exception:
            return Response({"error": "Format de date invalide."}, status=400)

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
                if duration_value > slot_minutes:
                    return Response(
                        {"error": "Durée supérieure au créneau disponible."},
                        status=400,
                    )

                slot_start = availability.start_datetime
                slot_end = availability.end_datetime

                booking_start = start_override or slot_start
                booking_end = booking_start + timedelta(minutes=duration_value)
                buffer_end = booking_end + timedelta(minutes=BUFFER_MINUTES)

                # Refus si la demande est à moins de 2h du début
                if booking_start < timezone.now() + timedelta(hours=2):
                    return Response(
                        {"error": "Sam n'accepte pas les rendez-vous réservés à moins de 2h."},
                        status=400,
                    )

                # Vérifie que la demande est dans la fenêtre
                if booking_start < slot_start or booking_end > slot_end:
                    return Response(
                        {"error": "Créneau incompatible avec ces horaires."},
                        status=400,
                    )

                # Créneau avant le massage
                if booking_start > slot_start:
                    Availability.objects.create(
                        start_datetime=slot_start,
                        end_datetime=booking_start,
                        is_booked=False,
                    )

                # Créneau après le massage (après la pause)
                if buffer_end < slot_end:
                    Availability.objects.create(
                        start_datetime=buffer_end,
                        end_datetime=slot_end,
                        is_booked=False,
                    )

                # Créneau réservé (exactement sur la durée du massage)
                booked_availability = Availability.objects.create(
                    start_datetime=booking_start,
                    end_datetime=booking_end,
                    is_booked=True,
                )

                # Supprime le bloc original
                availability.delete()

                booking = Booking.objects.create(
                    service=service,
                    availability=booked_availability,
                    client_name=name,
                    client_email=email,
                    client_phone=phone,
                    client_comment=comment or "",
                    duration_minutes=duration_value,
                    status="pending",
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
            local_start = timezone.localtime(booking_start)
            text_body = (
                f"Bonjour {name},\n\n"
                f"Votre demande de massage {service.title} ({duration_value} min) est enregistrée pour "
                f"{local_start.strftime('%d/%m/%Y à %H:%M')}.\n\n"
                "Si vous ne recevez pas de confirmation au plus tard 2h avant l'heure du massage, "
                "considérez que la demande est annulée.\n\n"
                "Vous recevrez un email de confirmation ou de refus de la part de Sam. "
                "Pensez à vérifier vos spams pour ne rien manquer.\n\n"
                "À bientôt,\nSAMASS"
            )
            html_body = render_email(
                "Demande de réservation reçue",
                [
                    f"Votre demande de massage <strong>{service.title}</strong> ({duration_value} min) est enregistrée pour <strong>{local_start.strftime('%d/%m/%Y à %H:%M')}</strong>.",
                    "Si vous ne recevez pas de confirmation au plus tard 2h avant l'heure du massage, considérez la demande annulée.",
                    "Vous recevrez un email de confirmation ou de refus. Pensez à vérifier vos spams.",
                ],
            )
            send_email([email], "Votre demande de réservation – SAMASS", text_body, html_body)
        except Exception as e:
            logger.warning(f"Email client non envoyé : {e}")

        # Email ADMIN : nouvelle demande
        try:
            admin_recipient = ADMIN_EMAIL or getattr(settings, "DEFAULT_FROM_EMAIL", None)
            if admin_recipient:
                local_start = timezone.localtime(booking_start)
                local_end = timezone.localtime(booking_end)
                admin_html = render_email(
                    "Nouvelle demande de réservation",
                    [
                        f"<strong>Client :</strong> {name} ({email})",
                        f"<strong>Service :</strong> {service.title}",
                        f"<strong>Durée :</strong> {duration_value} min",
                        f"<strong>Créneau :</strong> {local_start.strftime('%d/%m/%Y %H:%M')} → {local_end.strftime('%H:%M')}",
                        f"<strong>Commentaire :</strong> {comment or '—'}",
                        f"<a href='{ADMIN_PORTAL_URL}' style='color:#047857;'>Ouvrir l’espace admin</a>",
                    ],
                )
                send_email([admin_recipient], "Nouvelle demande de réservation – SAMASS", "Nouvelle demande de réservation.", admin_html)
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
            start_dt = timezone.localtime(booking.availability.start_datetime)
            text_body = (
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
            )
            html_body = render_email(
                "Réservation confirmée",
                [
                    f"Massage <strong>{booking.service.title}</strong> ({booking.duration_minutes} min).",
                    f"Rendez-vous le <strong>{start_dt.strftime('%d/%m/%Y')}</strong> à <strong>{start_dt.strftime('%H:%M')}</strong>.",
                    f"Adresse : {BOOKING_LOCATION}",
                    f"Place 🅿️ : {BOOKING_PARKING} • Code : {BOOKING_CODE} • Accès : {BOOKING_FLOOR}",
                    "Merci de prévenir en cas d’imprévu.",
                ],
            )
            send_email([booking.client_email], "Votre réservation est confirmée – SAMASS", text_body, html_body)
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
            start_dt = timezone.localtime(availability.start_datetime)
            html_content = render_email(
                "Réservation annulée",
                [
                    f"Votre réservation pour <strong>{booking.service.title}</strong> le <strong>{start_dt.strftime('%d/%m/%Y')}</strong> à <strong>{start_dt.strftime('%H:%M')}</strong> n’a pas été confirmée.",
                    "Sam a décliné pour raisons personnelles. Vous pouvez choisir un autre créneau ou lui écrire directement pour en savoir plus.",
                    "<a href='https://samassbysam.com/contact' style='color:#047857;'>Contacter Sam</a>",
                ],
            )
            send_email(
                [booking.client_email],
                "Votre réservation a été annulée – SAMASS",
                (
                    f"Votre créneau pour {booking.service.title} a été libéré. "
                    "Sam a décliné pour raisons personnelles. "
                    "Vous pouvez choisir un autre créneau ou le contacter : https://samassbysam.com/contact"
                ),
                html_content,
            )
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

    # POST
    name = request.data.get("name")
    email = request.data.get("email")
    phone = request.data.get("phone", "")
    message = request.data.get("message")

    if not all([name, email, message]):
        return Response({"error": "Champs requis manquants."}, status=400)

    try:
        contact = ContactMessage.objects.create(
            name=name, email=email, phone=phone, message=message
        )
    except Exception as e:
        logger.error(f"Erreur enregistrement contact : {e}")
        return Response({"error": "Erreur serveur."}, status=500)

    admin_email = getattr(settings, "ADMIN_EMAIL", None) or getattr(settings, "DEFAULT_FROM_EMAIL", None)

    # Email ADMIN (HTML) — on ignore les erreurs d'envoi
    html_admin = render_email(
        "Nouveau message de contact",
        [
            f"<strong>Nom :</strong> {name}",
            f"<strong>Email :</strong> {email}",
            f"<strong>Téléphone :</strong> {phone or '—'}",
            f"<strong>Message :</strong><br/>{message}",
        ],
    )
    if admin_email:
        sent = send_email(
            [admin_email],
            f"Nouveau message – {name}",
            f"Message de {name} ({email}) : {message}",
            html_admin,
        )
        if not sent:
            logger.warning("Email admin contact non envoyé (SendGrid)")

    # Email CLIENT (HTML) — on ignore les erreurs d'envoi
    html_client = render_email(
        "Votre message a bien été reçu",
        [
            f"Bonjour {name},",
            "Merci pour votre message. Je reviens vers vous rapidement.",
            "Pensez à vérifier vos spams pour ne rien manquer.",
        ],
    )
    sent_client = send_email(
        [email],
        "Votre message a bien été reçu – SAMASS",
        "Merci pour votre message. Je reviens vers vous rapidement.",
        html_client,
    )
    if not sent_client:
        logger.warning("Email client contact non envoyé (SendGrid)")

    return Response(ContactMessageSerializer(contact).data, status=200)


@api_view(["DELETE", "PATCH"])
def contact_message_detail(request, pk: int):
    """
    DELETE: supprime un message
    PATCH : marque comme lu (is_read = True)
    """
    try:
        message = ContactMessage.objects.get(pk=pk)
    except ContactMessage.DoesNotExist:
        return Response({"error": "Message introuvable."}, status=404)

    if request.method == "DELETE":
        message.delete()
        return Response(status=204)

    if request.method == "PATCH":
        message.is_read = True
        message.save(update_fields=["is_read"])
        return Response(ContactMessageSerializer(message).data, status=200)
