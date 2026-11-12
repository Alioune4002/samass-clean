import crypto from "node:crypto";
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { getBooking } from "@/lib/server/samassStore";

const FOLDER = "SAMASS-Reviews";

export type ReviewRecord = {
  kind: "review" | "invitation";
  id: string;
  name: string;
  email: string;
  comment?: string;
  rating?: number;
  public_name?: string;
  consent?: boolean;
  status: "pending" | "published" | "hidden" | "rejected" | "sent" | "failed" | "used";
  invitation_hash?: string;
  invitation_expires_at?: string;
  invitation_id?: string;
  booking_id?: string;
  created_at: string;
  updated_at: string;
};

function config() {
  const user = process.env.EMAIL_HOST_USER;
  const password = process.env.EMAIL_HOST_PASSWORD;
  const from = process.env.DEFAULT_FROM_EMAIL || user;
  if (!user || !password || !from) throw new Error("Messagerie indisponible.");
  return { user, password, from };
}

function cleanName(value: unknown) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 70) throw new Error("Nom invalide.");
  return name;
}

function cleanEmail(value: unknown) {
  const email = String(value || "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Adresse e-mail invalide.");
  }
  return email;
}

async function withClient<T>(work: (client: ImapFlow) => Promise<T>) {
  const { user, password } = config();
  const client = new ImapFlow({
    host: "imap.gmail.com", port: 993, secure: true,
    auth: { user, pass: password }, logger: false,
  });
  await client.connect();
  try {
    try { await client.mailboxCreate(FOLDER); } catch { /* Dossier existant */ }
    return await work(client);
  } finally {
    await client.logout().catch(() => undefined);
  }
}

function encode(item: ReviewRecord) {
  return [
    "From: SAMASS <contact@samassbysam.com>",
    "To: contact@samassbysam.com",
    `Subject: SAMASS_REVIEW:${item.id}`,
    "Content-Type: application/json; charset=utf-8",
    "Content-Transfer-Encoding: 8bit", "",
    JSON.stringify(item),
  ].join("\r\n");
}

async function append(item: ReviewRecord) {
  await withClient(async (client) => {
    await client.append(FOLDER, Buffer.from(encode(item), "utf8"), ["\\Seen"]);
  });
}

export async function getAllReviews() {
  return withClient(async (client) => {
    const lock = await client.getMailboxLock(FOLDER);
    try {
      if (!client.mailbox || client.mailbox.exists === 0) return [] as ReviewRecord[];
      const latest = new Map<string, ReviewRecord>();
      for await (const message of client.fetch("1:*", { source: true })) {
        if (!message.source) continue;
        const text = message.source.toString("utf8");
        const separator = text.indexOf("\r\n\r\n");
        if (separator < 0) continue;
        try {
          const item = JSON.parse(text.slice(separator + 4).trim()) as ReviewRecord;
          if (!["review", "invitation"].includes(item.kind) || !item.id) continue;
          const previous = latest.get(item.id);
          if (!previous || previous.updated_at <= item.updated_at) latest.set(item.id, item);
        } catch { /* Ignore non-review mailbox data */ }
      }
      return [...latest.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
    } finally {
      lock.release();
    }
  });
}

export async function createPublicReview(input: Record<string, unknown>) {
  const name = cleanName(input.name);
  const email = cleanEmail(input.email);
  const comment = String(input.comment || "").trim();
  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Choisissez une note entre 1 et 5.");
  }
  if (comment.length < 20 || comment.length > 1400) {
    throw new Error("Votre avis doit contenir entre 20 et 1 400 caractères.");
  }
  if (input.consent !== true && input.consent !== false) {
    throw new Error("Précisez si vous acceptez la publication de votre avis.");
  }
  const publicName = input.consent ? cleanName(input.public_name || name.split(" ")[0]) : "";
  const previous = await getAllReviews();
  const rawInvitation = String(input.invitation || "").trim();
  let invitation: ReviewRecord | undefined;
  if (rawInvitation) {
    if (!/^[A-Za-z0-9_-]{30,70}$/.test(rawInvitation)) {
      throw new Error("Ce lien d'invitation n'est pas valide.");
    }
    const invitationHash = crypto.createHash("sha256").update(rawInvitation).digest("hex");
    invitation = previous.find((item) =>
      item.kind === "invitation" && item.status === "sent" &&
      item.invitation_hash === invitationHash &&
      item.invitation_expires_at && Date.parse(item.invitation_expires_at) > Date.now()
    );
    if (!invitation || invitation.email !== email) {
      throw new Error("Cette invitation a expiré ou ne correspond pas à votre adresse email.");
    }
  }

  if (previous.some((item) => item.kind === "review" && item.email === email &&
    new Date(item.created_at).getTime() > Date.now() - 7 * 86400_000)) {
    throw new Error("Un avis a déjà été soumis avec cette adresse récemment.");
  }
  const now = new Date().toISOString();
  const item: ReviewRecord = {
    kind: "review", id: crypto.randomUUID(), name, email, comment, rating,
    public_name: publicName, consent: input.consent, status: "pending",
    invitation_id: invitation?.id,
    created_at: now, updated_at: now,
  };
  await append(item);
  if (invitation) {
    // Lien à usage unique, avec historique de réception dans l'administration.
    await append({ ...invitation, status: "used", updated_at: new Date().toISOString() })
      .catch((error) => console.error("SAMASS review invitation update failed", error));
  }
  return { received: true };
}

export async function getPublishedReviews() {
  const all = await getAllReviews();
  return all.filter((item) => item.kind === "review" &&
    item.status === "published" && item.consent === true &&
    item.comment && item.rating && item.public_name)
    .map((item) => ({
      id: item.id, name: item.public_name!, rating: item.rating!,
      comment: item.comment!, created_at: item.created_at,
    }));
}

export async function changeReviewStatus(id: string, action: "publish" | "hide" | "reject") {
  const all = await getAllReviews();
  const item = all.find((entry) => entry.kind === "review" && entry.id === id);
  if (!item) throw new Error("Avis introuvable.");
  if (action === "publish" && (!item.consent || !item.public_name)) {
    throw new Error("La personne n'a pas autorisé l'affichage public.");
  }
  const updated: ReviewRecord = {
    ...item,
    status: action === "publish" ? "published" : action === "reject" ? "rejected" : "hidden",
    updated_at: new Date().toISOString(),
  };
  await append(updated);
  return updated;
}

export async function sendReviewInvitation(input: Record<string, unknown>) {
  let name = "";
  let email = "";
  let bookingId: string | undefined;
  if (input.booking_id) {
    const booking = await getBooking(String(input.booking_id));
    if (!booking || booking.status !== "confirmed") {
      throw new Error("Cette réservation doit être confirmée.");
    }

    // Le créneau est exprimé en heure locale de Quimper ; comparer sans
    // transformer les horaires d'été en fuseau UTC fixe.
    const request = booking.requested_datetime;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(request)) {
      throw new Error("L'heure de cette réservation est invalide.");
    }
    const sessionEnd = new Date(request.slice(0, 16) + ":00.000Z");
    sessionEnd.setUTCMinutes(sessionEnd.getUTCMinutes() + booking.duration_minutes);
    const paris = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());
    const val = (key: string) => paris.find((part) => part.type === key)?.value || "";
    const nowParis = `${val("year")}-${val("month")}-${val("day")}T${val("hour")}:${val("minute")}`;
    if (Number.isNaN(sessionEnd.getTime()) ||
        sessionEnd.toISOString().slice(0, 16) > nowParis) {
      throw new Error("Attendez la fin de la séance pour demander un avis.");
    }

    bookingId = booking.id;
    name = cleanName(booking.client_name);
    email = cleanEmail(booking.client_email);
  } else {
    name = cleanName(input.name);
    email = cleanEmail(input.email);
  }

  const all = await getAllReviews();
  if (all.some((item) => item.kind === "invitation" && item.email === email &&
    item.status === "sent" && Date.parse(item.created_at) > Date.now() - 7 * 86400_000)) {
    throw new Error("Une invitation a déjà été envoyée à cette adresse récemment.");
  }

  const now = new Date().toISOString();
  const token = crypto.randomBytes(32).toString("base64url");
  const record: ReviewRecord = {
    kind: "invitation", id: crypto.randomUUID(), name, email, booking_id: bookingId,
    invitation_hash: crypto.createHash("sha256").update(token).digest("hex"),
    invitation_expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
    status: "sent", created_at: now, updated_at: now,
  };
  const { user, password, from } = config();
  const mailer = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT || 587) === 465,
    auth: { user, pass: password },
  });
  const url = `https://samassbysam.com/avis?code=${encodeURIComponent(token)}`;
  const firstname = name.split(" ")[0];
  await append(record);
  try {
    await mailer.sendMail({
    from, replyTo: "contact@samassbysam.com", to: email,
    subject: "Votre expérience chez SAMASS",
    text:
      `Bonjour ${firstname},\n\nMerci pour votre visite chez SAMASS. Comment vous êtes-vous senti pendant et après votre séance ? Si vous le souhaitez, partagez librement votre expérience, qu'elle ait été positive, mitigée ou négative :\n\n${url}\n\nCe lien est personnel et valable 30 jours. Votre avis sera lu par Sam et ne sera affiché publiquement qu'avec votre accord et après validation.\n\nÀ bientôt,\nSam · SAMASS`,
    html:
      `<div style="font-family:Arial,sans-serif;color:#1c4537;background:#faf7ee;padding:28px;border-radius:18px">\n` +
      `<p style="font-size:11px;letter-spacing:2px">SAMASS · QUIMPER</p><h2 style="font-family:Georgia,serif;font-weight:normal">Votre expérience compte.</h2>\n` +
      `<p>Bonjour ${firstname.replace(/[<>&"']/g, "")},</p><p>Comment vous êtes-vous senti après votre séance ? Partagez librement votre expérience, positive ou négative, si vous le souhaitez.</p>\n` +
      `<p><a href="${url}" style="display:inline-block;background:#1f5a49;color:white;text-decoration:none;padding:12px 20px;border-radius:30px">Donner mon avis</a></p>\n` +
      `<p style="font-size:12px;color:#657069">Lien personnel valable 30 jours. Votre avis ne sera publié qu'avec votre accord et après validation.</p>\n` +
      `<p>À bientôt,<br>Sam · SAMASS</p></div>`,
    });
  } catch (error) {
    await append({ ...record, status: "failed", updated_at: new Date().toISOString() })
      .catch((storageError) => console.error("SAMASS invitation status failed", storageError));
    throw error;
  }
  return { sent: true };
}
