import { ImapFlow } from "imapflow";
import crypto from "node:crypto";

export type BookingStatus = "pending" | "confirmed" | "canceled";

export type StoredBooking = {
  kind: "booking";
  id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_comment?: string;
  service_id?: number;
  service_title: string;
  duration_minutes: number;
  requested_datetime: string;
  requested_label?: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type StoredContactMessage = {
  kind: "contact";
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

const BOOKING_FOLDER = "SAMASS-Bookings";
const MESSAGE_FOLDER = "SAMASS-Messages";

function getMailConfig() {
  const user = process.env.EMAIL_HOST_USER;
  const pass = process.env.EMAIL_HOST_PASSWORD;
  const from = process.env.DEFAULT_FROM_EMAIL || user;
  const adminEmail = process.env.ADMIN_EMAIL || user;

  if (!user || !pass || !from || !adminEmail) {
    throw new Error("Configuration email SAMASS manquante.");
  }

  return { user, pass, from, adminEmail };
}

async function createImapClient() {
  const { user, pass } = getMailConfig();
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });
  await client.connect();
  return client;
}

async function ensureMailbox(client: ImapFlow, path: string) {
  try {
    await client.mailboxCreate(path);
  } catch {
    // Le libellé existe déjà.
  }
}

function encodeRecord(record: StoredBooking | StoredContactMessage) {
  const subject =
    record.kind === "booking"
      ? `SAMASS_BOOKING:${record.id}`
      : `SAMASS_CONTACT:${record.id}`;

  const payload = JSON.stringify(record);
  return [
    `From: SAMASS <${getMailConfig().from}>`,
    `To: ${getMailConfig().adminEmail}`,
    `Subject: ${subject}`,
    "Content-Type: application/json; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    payload,
  ].join("\r\n");
}

function parseRecord(source: Buffer | string) {
  const text = Buffer.isBuffer(source) ? source.toString("utf8") : source;
  const separator = text.indexOf("\r\n\r\n");
  const body = separator >= 0 ? text.slice(separator + 4) : text;
  try {
    return JSON.parse(body.trim()) as StoredBooking | StoredContactMessage;
  } catch {
    return null;
  }
}

async function appendRecord(
  folder: string,
  record: StoredBooking | StoredContactMessage
) {
  const client = await createImapClient();
  try {
    await ensureMailbox(client, folder);
    await client.append(folder, Buffer.from(encodeRecord(record), "utf8"), ["\\Seen"]);
  } finally {
    await client.logout().catch(() => undefined);
  }
}

async function readLatestRecords<T extends StoredBooking | StoredContactMessage>(
  folder: string,
  kind: T["kind"]
): Promise<T[]> {
  const client = await createImapClient();
  try {
    await ensureMailbox(client, folder);
    const lock = await client.getMailboxLock(folder);
    try {
      const latest = new Map<string, T>();
      const mailbox = client.mailbox;
      if (!mailbox || mailbox.exists === 0) return [];

      for await (const message of client.fetch("1:*", {
        source: true,
        internalDate: true,
      })) {
        if (!message.source) continue;
        const record = parseRecord(message.source);
        if (!record || record.kind !== kind) continue;

        const current = latest.get(record.id);
        if (
          !current ||
          new Date(record.updated_at).getTime() >=
            new Date(current.updated_at).getTime()
        ) {
          latest.set(record.id, record as T);
        }
      }

      return [...latest.values()]
        .filter((record) => !record.deleted_at)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => undefined);
  }
}

async function sendMail(message: {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}) {
  const config = getMailConfig();
  const nodemailerModule = (await import("nodemailer")) as any;
  const transporter = nodemailerModule.default.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT || 587) === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: config.from,
    ...message,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function mailShell(title: string, body: string) {
  return `
    <div style="max-width:600px;margin:0 auto;padding:28px;font-family:Arial,sans-serif;background:#fbfaf5;border:1px solid #e7e2d4;border-radius:22px;color:#17352d;">
      <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#9a6b2f;margin-bottom:12px;">SAMASS · Revenir à soi</div>
      <h1 style="font-size:24px;line-height:1.2;margin:0 0 20px;color:#17352d;">${title}</h1>
      <div style="font-size:14px;line-height:1.75;color:#42514c;">${body}</div>
      <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e7e2d4;font-size:12px;color:#7b817e;">SAMASS · Massage & bien-être · Quimper</div>
    </div>`;
}

export async function createBooking(input: {
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_comment?: string;
  service_id?: number;
  service_title: string;
  duration_minutes: number;
  requested_datetime: string;
  requested_label?: string;
}) {
  const now = new Date().toISOString();
  const booking: StoredBooking = {
    kind: "booking",
    id: crypto.randomUUID(),
    ...input,
    status: "pending",
    created_at: now,
    updated_at: now,
  };

  await appendRecord(BOOKING_FOLDER, booking);

  const safeName = escapeHtml(booking.client_name);
  const safeService = escapeHtml(booking.service_title);
  const safeWhen = escapeHtml(
    booking.requested_label || booking.requested_datetime
  );

  await Promise.all([
    sendMail({
      to: booking.client_email,
      subject: "Votre demande de massage a bien été reçue – SAMASS",
      text:
        `Bonjour ${booking.client_name},\n\nVotre demande pour ${booking.service_title} (${booking.duration_minutes} min) a bien été reçue.\nHoraire souhaité : ${booking.requested_label || booking.requested_datetime}.\n\nCe créneau n'est pas encore confirmé. Sam vous répondra rapidement pour le valider ou vous proposer une alternative.\n\nÀ bientôt,\nSam · SAMASS`,
      html: mailShell(
        "Votre demande est bien partie",
        `<p>Bonjour ${safeName},</p><p>J’ai bien reçu votre demande pour <strong>${safeService}</strong> · ${booking.duration_minutes} min.</p><p>Horaire souhaité : <strong>${safeWhen}</strong>.</p><p>Le rendez-vous n’est pas encore confirmé. Je reviens vers vous rapidement pour valider ce créneau ou vous proposer une alternative.</p><p>À très bientôt,<br><strong>Sam</strong></p>`
      ),
    }),
    sendMail({
      to: getMailConfig().adminEmail,
      replyTo: booking.client_email,
      subject: `Nouvelle demande · ${booking.service_title} · ${booking.client_name}`,
      text:
        `Nouvelle demande SAMASS\n\nNom : ${booking.client_name}\nEmail : ${booking.client_email}\nTéléphone : ${booking.client_phone || "—"}\nMassage : ${booking.service_title}\nDurée : ${booking.duration_minutes} min\nHoraire souhaité : ${booking.requested_label || booking.requested_datetime}\n\nMessage :\n${booking.client_comment || "Aucun commentaire."}`,
      html: mailShell(
        "Nouvelle demande de réservation",
        `<p><strong>${safeName}</strong> souhaite réserver.</p><p><strong>Massage :</strong> ${safeService}<br><strong>Durée :</strong> ${booking.duration_minutes} min<br><strong>Horaire souhaité :</strong> ${safeWhen}</p><p><strong>Email :</strong> ${escapeHtml(booking.client_email)}<br><strong>Téléphone :</strong> ${escapeHtml(booking.client_phone || "—")}</p><p><strong>Message :</strong><br>${escapeHtml(booking.client_comment || "Aucun commentaire.")}</p>`
      ),
    }),
  ]);

  return booking;
}

export async function listBookings() {
  return readLatestRecords<StoredBooking>(BOOKING_FOLDER, "booking");
}

export async function getBooking(id: string) {
  const items = await listBookings();
  return items.find((item) => item.id === id) || null;
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const current = await getBooking(id);
  if (!current) return null;

  const updated: StoredBooking = {
    ...current,
    status,
    updated_at: new Date().toISOString(),
  };
  await appendRecord(BOOKING_FOLDER, updated);

  const statusText =
    status === "confirmed"
      ? "Votre rendez-vous est confirmé."
      : "Votre demande de rendez-vous a été annulée.";

  await sendMail({
    to: updated.client_email,
    subject:
      status === "confirmed"
        ? "Votre rendez-vous est confirmé – SAMASS"
        : "Mise à jour de votre demande – SAMASS",
    text: `Bonjour ${updated.client_name},\n\n${statusText}\n\nMassage : ${updated.service_title}\nDurée : ${updated.duration_minutes} min\nHoraire : ${updated.requested_label || updated.requested_datetime}\n\nSam · SAMASS`,
    html: mailShell(
      status === "confirmed" ? "Votre rendez-vous est confirmé" : "Mise à jour de votre demande",
      `<p>Bonjour ${escapeHtml(updated.client_name)},</p><p>${statusText}</p><p><strong>${escapeHtml(updated.service_title)}</strong> · ${updated.duration_minutes} min<br>${escapeHtml(updated.requested_label || updated.requested_datetime)}</p><p>À bientôt,<br><strong>Sam</strong></p>`
    ),
  });

  return updated;
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  const now = new Date().toISOString();
  const record: StoredContactMessage = {
    kind: "contact",
    id: crypto.randomUUID(),
    ...input,
    is_read: false,
    created_at: now,
    updated_at: now,
  };
  await appendRecord(MESSAGE_FOLDER, record);

  await Promise.all([
    sendMail({
      to: record.email,
      subject: "Votre message a bien été reçu – SAMASS",
      text: `Bonjour ${record.name},\n\nMerci pour votre message. Je vous répondrai rapidement.\n\nSam · SAMASS`,
      html: mailShell(
        "Votre message est bien arrivé",
        `<p>Bonjour ${escapeHtml(record.name)},</p><p>Merci pour votre message. Je vous répondrai rapidement.</p><p>À bientôt,<br><strong>Sam</strong></p>`
      ),
    }),
    sendMail({
      to: getMailConfig().adminEmail,
      replyTo: record.email,
      subject: `Nouveau message · ${record.name}`,
      text: `Nom : ${record.name}\nEmail : ${record.email}\nTéléphone : ${record.phone || "—"}\n\n${record.message}`,
      html: mailShell(
        "Nouveau message",
        `<p><strong>${escapeHtml(record.name)}</strong><br>${escapeHtml(record.email)}<br>${escapeHtml(record.phone || "—")}</p><p>${escapeHtml(record.message).replaceAll("\n", "<br>")}</p>`
      ),
    }),
  ]);

  return record;
}

export async function listContactMessages() {
  return readLatestRecords<StoredContactMessage>(MESSAGE_FOLDER, "contact");
}

export async function markContactRead(id: string) {
  const items = await listContactMessages();
  const current = items.find((item) => item.id === id);
  if (!current) return null;
  const updated = {
    ...current,
    is_read: true,
    updated_at: new Date().toISOString(),
  };
  await appendRecord(MESSAGE_FOLDER, updated);
  return updated;
}

export async function deleteContactMessage(id: string) {
  const items = await listContactMessages();
  const current = items.find((item) => item.id === id);
  if (!current) return false;
  await appendRecord(MESSAGE_FOLDER, {
    ...current,
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  return true;
}
