const nodemailer = require('nodemailer');

/* Lead notifications for emersonq.com.
   Sends through the site's own Private Email mailbox so a form enquiry lands in
   the same inbox a hand-typed one would, and never mixes with another brand.
   Requires SMTP_PASSWORD in the Vercel project environment. SMTP_USER and
   LEAD_RECIPIENT default to info@emersonq.com. */

/* The subject is chosen here, from a fixed set, so a caller cannot supply its
   own subject line and turn this into an open relay for someone else's spam. */
const SUBJECTS = {
  tour: 'Tour request — Emerson Quarters',
  apply: 'Application — Emerson Quarters',
  reserve: 'Reservation hold — Emerson Quarters',
  contact: 'Message — Emerson Quarters',
};

const RECIPIENT = process.env.LEAD_RECIPIENT || 'info@emersonq.com';
const SMTP_HOST = process.env.SMTP_HOST || 'mail.privateemail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || RECIPIENT;

const ALLOWED_ORIGINS = ['https://emersonq.com', 'https://www.emersonq.com'];

/* Blocks another site posting from a visitor's browser, without blocking our
   own. Same-origin has to be allowed by host comparison rather than a fixed
   list, or local development and every Vercel preview deployment would be
   rejected — and the browser would be told the message sent anyway. */
function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch (e) {
    return false;
  }
}

const MAX_FIELDS = 25;
const MAX_VALUE = 5000;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* A single header value must not carry a newline, or it can be used to inject
   extra headers (Bcc, and so on) into the outgoing message. */
function headerSafe(s) {
  return String(s).replace(/[\r\n]+/g, ' ').trim();
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
}

function render(fields) {
  const rows = Object.keys(fields)
    .map(
      (k) =>
        `<tr>` +
        `<td style="padding:8px 14px;border-bottom:1px solid #e8e2da;` +
        `color:#6b6259;font:14px/1.5 -apple-system,Segoe UI,sans-serif;` +
        `white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td>` +
        `<td style="padding:8px 14px;border-bottom:1px solid #e8e2da;` +
        `color:#1a1a1a;font:14px/1.5 -apple-system,Segoe UI,sans-serif">` +
        `${escapeHtml(fields[k]).replace(/\n/g, '<br>')}</td>` +
        `</tr>`
    )
    .join('');

  const text = Object.keys(fields)
    .map((k) => `${k}: ${fields[k]}`)
    .join('\n');

  const html =
    `<div style="background:#f5f0eb;padding:24px">` +
    `<table style="border-collapse:collapse;background:#fff;border-radius:8px;` +
    `overflow:hidden;max-width:640px;width:100%">${rows}</table></div>`;

  return { text, html };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  if (!originAllowed(req)) {
    return res.status(403).json({ ok: false, error: 'forbidden_origin' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};

  /* Honeypot. Real people never fill this in; bots fill everything. Answer as
     though it worked so the bot has nothing to learn from. */
  if (body.company) return res.status(200).json({ ok: true });

  const kind = String(body.kind || '').toLowerCase();
  if (!SUBJECTS[kind]) {
    return res.status(400).json({ ok: false, error: 'unknown_form' });
  }

  const incoming = body.fields && typeof body.fields === 'object' ? body.fields : {};
  const fields = {};
  for (const key of Object.keys(incoming).slice(0, MAX_FIELDS)) {
    const value = incoming[key];
    if (value === null || value === undefined || value === '') continue;
    fields[String(key).slice(0, 80)] = String(value).slice(0, MAX_VALUE);
  }
  if (!Object.keys(fields).length) {
    return res.status(400).json({ ok: false, error: 'empty_submission' });
  }

  const SMTP_PASS = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  if (!SMTP_PASS) {
    // Loud in the logs, quiet to the caller.
    console.error('lead: SMTP_PASSWORD is not set — cannot send notification');
    return res.status(500).json({ ok: false, error: 'mail_not_configured' });
  }

  const replyTo = isEmail(body.replyTo) ? headerSafe(body.replyTo) : null;
  const { text, html } = render(fields);

  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000,
    });

    await transport.sendMail({
      // From must be the authenticated mailbox or Private Email rejects it.
      from: `"Emerson Quarters website" <${SMTP_USER}>`,
      to: RECIPIENT,
      subject: SUBJECTS[kind],
      replyTo: replyTo || undefined,
      text,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('lead: send failed', err && err.message);
    return res.status(502).json({ ok: false, error: 'send_failed' });
  }
};

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch (e) {
    return {};
  }
}
