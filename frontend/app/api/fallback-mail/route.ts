import { NextResponse } from "next/server";

export const runtime = "nodejs";

type BookingPayload = {
  type: "booking";
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_comment?: string;
  service: string;
  duration_minutes?: number;
  date_time?: string;
};

type ContactPayload = {
  type: "contact";
  name: string;
  email: string;
  phone?: string;
  message: string;
};

type FallbackMailPayload = BookingPayload | ContactPayload;

function getSmtpConfig() {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_HOST_USER;
  const pass = process.env.EMAIL_HOST_PASSWORD;
  const from = process.env.DEFAULT_FROM_EMAIL || user;
  const adminEmail = process.env.ADMIN_EMAIL || from;

  if (!user || !pass || !from || !adminEmail) {
    throw new Error("Configuration email manquante.");
  }

  return {
    host,
    port,
    secure: port === 465,
    user,
    pass,
    from,
    adminEmail,
  };
}

function createTransporter() {
  const config = getSmtpConfig();
  const transporterFactory = async () => {
    const nodemailerModule = (await import("nodemailer")) as {
      default: {
        createTransport: (options: Record<string, unknown>) => {
          sendMail: (message: Record<string, unknown>) => Promise<unknown>;
        };
      };
    };

    return nodemailerModule.default.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  };

  return {
    transporterFactory,
    config,
  };
}

function wrapTextHtml(title: string, paragraphs: string[]) {
  const htmlParagraphs = paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;color:#1f2937;font-size:14px;line-height:1.65;">${paragraph.replace(/\n/g, "<br />")}</p>`
    )
    .join("");

  return `
    <div style="max-width:560px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;color:#111827;">
      <h1 style="margin:0 0 18px;font-size:22px;color:#065f46;">${title}</h1>
      ${htmlParagraphs}
      <p style="margin:20px 0 0;color:#6b7280;font-size:12px;">SAMASS – Massage & Bien-être</p>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildMessages(payload: FallbackMailPayload) {
  if (payload.type === "booking") {
    const clientText = [
      "Bonjour,",
      "",
      "Merci pour votre demande de réservation chez SAMASS.",
      "",
      "Votre message a bien été reçu. Je vous recontacterai rapidement pour confirmer le créneau ou vous proposer un horaire adapté.",
      "",
      "Chaque séance étant personnalisée, je prends le temps de vous répondre avec attention.",
      "",
      "En attendant, n’hésitez pas à vérifier vos emails (y compris les spams) afin de ne pas manquer ma réponse.",
      "",
      "À très bientôt,",
      "",
      "Sam",
      "SAMASS – Massage & Bien-être",
    ].join("\n");

    const adminText = [
      "Nouvelle demande de réservation reçue :",
      "",
      `Nom : ${payload.client_name}`,
      `Email : ${payload.client_email}`,
      `Téléphone : ${payload.client_phone || "Non renseigné"}`,
      "",
      `Service : ${payload.service}`,
      `Durée : ${payload.duration_minutes ? `${payload.duration_minutes} min` : "Non précisée"}`,
      `Date / créneau : ${payload.date_time || "À convenir avec Sam"}`,
      "",
      "Message :",
      payload.client_comment || "Aucun commentaire.",
      "",
      "⚠️ Cette demande a été envoyée en mode secours car le serveur est momentanément indisponible.",
      "",
      "Pense à répondre rapidement au client.",
    ].join("\n");

    return {
      client: {
        subject: "Votre demande de massage – SAMASS",
        text: clientText,
        html: wrapTextHtml("Votre demande de massage – SAMASS", [
          "Bonjour,",
          "Merci pour votre demande de réservation chez SAMASS.",
          "Votre message a bien été reçu. Je vous recontacterai rapidement pour confirmer le créneau ou vous proposer un horaire adapté.",
          "Chaque séance étant personnalisée, je prends le temps de vous répondre avec attention.",
          "En attendant, n’hésitez pas à vérifier vos emails (y compris les spams) afin de ne pas manquer ma réponse.",
          "À très bientôt,<br /><br />Sam<br />SAMASS – Massage & Bien-être",
        ]),
      },
      admin: {
        subject: "Nouvelle demande de réservation – SAMASS",
        text: adminText,
        html: wrapTextHtml("Nouvelle demande de réservation – SAMASS", [
          "Nouvelle demande de réservation reçue :",
          `<strong>Nom :</strong> ${escapeHtml(payload.client_name)}`,
          `<strong>Email :</strong> ${escapeHtml(payload.client_email)}`,
          `<strong>Téléphone :</strong> ${escapeHtml(
            payload.client_phone || "Non renseigné"
          )}`,
          `<strong>Service :</strong> ${escapeHtml(payload.service)}`,
          `<strong>Durée :</strong> ${
            payload.duration_minutes ? `${payload.duration_minutes} min` : "Non précisée"
          }`,
          `<strong>Date / créneau :</strong> ${escapeHtml(
            payload.date_time || "À convenir avec Sam"
          )}`,
          `<strong>Message :</strong><br />${escapeHtml(
            payload.client_comment || "Aucun commentaire."
          )}`,
          "⚠️ Cette demande a été envoyée en mode secours car le serveur est momentanément indisponible.",
          "Pense à répondre rapidement au client.",
        ]),
      },
      successMessage:
        "Votre demande a bien été envoyée. Sam vous recontactera rapidement.",
    };
  }

  const clientText = [
    "Bonjour,",
    "",
    "Merci pour votre message.",
    "",
    "Je vous répondrai dans les plus brefs délais.",
    "",
    "Si votre demande est urgente, vous pouvez également me contacter directement par téléphone.",
    "",
    "À bientôt,",
    "",
    "Sam",
    "SAMASS – Massage & Bien-être",
  ].join("\n");

  const adminText = [
    "Nouveau message reçu :",
    "",
    `Nom : ${payload.name}`,
    `Email : ${payload.email}`,
    `Téléphone : ${payload.phone || "Non renseigné"}`,
    "",
    "Message :",
    payload.message,
    "",
    "Message secours",
  ].join("\n");

  return {
    client: {
      subject: "Votre message a bien été reçu – SAMASS",
      text: clientText,
      html: wrapTextHtml("Votre message a bien été reçu – SAMASS", [
        "Bonjour,",
        "Merci pour votre message.",
        "Je vous répondrai dans les plus brefs délais.",
        "Si votre demande est urgente, vous pouvez également me contacter directement par téléphone.",
        "À bientôt,<br /><br />Sam<br />SAMASS – Massage & Bien-être",
      ]),
    },
    admin: {
      subject: "Nouveau message – SAMASS",
      text: adminText,
      html: wrapTextHtml("Nouveau message – SAMASS", [
        "Nouveau message reçu :",
        `<strong>Nom :</strong> ${escapeHtml(payload.name)}`,
        `<strong>Email :</strong> ${escapeHtml(payload.email)}`,
        `<strong>Téléphone :</strong> ${escapeHtml(
          payload.phone || "Non renseigné"
        )}`,
        `<strong>Message :</strong><br />${escapeHtml(payload.message)}`,
        "⚠️ Message reçu via fallback frontend (backend indisponible).",
      ]),
    },
    successMessage:
      "Votre message a bien été reçu. Sam vous répondra rapidement.",
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as FallbackMailPayload;

    if (!payload?.type) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    if (
      payload.type === "booking" &&
      (!payload.client_name || !payload.client_email || !payload.service)
    ) {
      return NextResponse.json(
        { error: "Demande de réservation incomplète." },
        { status: 400 }
      );
    }

    if (
      payload.type === "contact" &&
      (!payload.name || !payload.email || !payload.message)
    ) {
      return NextResponse.json(
        { error: "Message de contact incomplet." },
        { status: 400 }
      );
    }

    const { transporterFactory, config } = createTransporter();
    const transporter = await transporterFactory();
    const messages = buildMessages(payload);
    const clientEmail =
      payload.type === "booking" ? payload.client_email : payload.email;

    await Promise.all([
      transporter.sendMail({
        from: config.from,
        to: clientEmail,
        subject: messages.client.subject,
        text: messages.client.text,
        html: messages.client.html,
      }),
      transporter.sendMail({
        from: config.from,
        to: config.adminEmail,
        replyTo: clientEmail,
        subject: messages.admin.subject,
        text: messages.admin.text,
        html: messages.admin.html,
      }),
    ]);

    return NextResponse.json({
      message: messages.successMessage,
      mode: "fallback",
    });
  } catch (error) {
    console.error("Fallback mail error:", error);
    return NextResponse.json(
      {
        error:
          "L'envoi d'email est momentanément indisponible. Merci de contacter SAMASS directement via son numéro de téléphone ( 07 45 55 87 31 ) ou l'un de ses adresses email ( samassbysam@gmail.com / contact@samass.com ).",
      },
      { status: 500 }
    );
  }
}
