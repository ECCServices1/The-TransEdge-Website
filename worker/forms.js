/**
 * The website's three forms: contact, the Life-Link finder, and prayer requests.
 *
 * Each submission is checked, emailed to the church through Cloudflare's own
 * email service, and forgotten. Nothing is written anywhere: no database, no
 * log line carrying what somebody wrote. For a prayer request in particular the
 * email that lands in the inbox is the only copy that exists.
 *
 * WHY CLOUDFLARE SENDS THE EMAIL
 *
 * The forms were designed so that personal information never passes through a
 * third-party form service. Cloudflare already carries every request to this
 * site, and Google already holds the church's mail, so sending through
 * Cloudflare to the church's own Google inbox adds no new company to the path.
 * Sending to addresses verified in the church's own Cloudflare account is free
 * on every plan.
 *
 * WHAT THE BINDING CAN AND CANNOT DO
 *
 * env.EMAIL is locked, in wrangler.jsonc, to one sender and two recipients:
 * frontdesk@ and admin@. Even a bug in this file could not make the Worker
 * email anybody else.
 *
 * HOW A VISITOR EXPERIENCES IT
 *
 * The forms are plain HTML forms. The browser checks required fields and
 * lengths before anything is sent, using limits read from the same settings
 * file as this one, and the Worker answers with a redirect to a thank-you page
 * or a "did not go through" page. If something does fail, the Back button
 * returns them to the form with what they typed still in it.
 */
import { FORMS, FORM_SENDER, NOT_SENT, LIMITS } from '../src/data/forms.mjs';

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Longer than any legitimate submission, short of anything abusive. */
const MAX_BODY_BYTES = 32_000;

/** The finder's older hidden field, still honoured if a cached page sends it. */
const LIFE_LINK_SUBJECT = 'Life-Link group enquiry';

const EMAIL_SHAPE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

/**
 * @typedef {{ field: string, label: string, max: number, required?: boolean, email?: boolean, multiline?: boolean }} Rule
 * @type {Record<string, Rule[]>}
 */
const RULES = {
  contact: [
    { field: 'name', label: 'Name', max: LIMITS.name, required: true },
    { field: 'email', label: 'Email', max: LIMITS.email, required: true, email: true },
    { field: 'message', label: 'Message', max: LIMITS.message, required: true, multiline: true },
  ],
  'life-link': [
    { field: 'suburb', label: 'Suburb', max: LIMITS.suburb, required: true },
    { field: 'email', label: 'Email or phone', max: LIMITS.contact, required: true },
  ],
  prayer: [
    { field: 'request', label: 'Prayer request', max: LIMITS.message, required: true, multiline: true },
    { field: 'name', label: 'Name', max: LIMITS.name },
    { field: 'contact', label: 'Email or phone', max: LIMITS.contact },
  ],
};

/**
 * A 303 to a page on this site. 303 rather than 302 so the browser follows with
 * a GET, and a reload of the thank-you page cannot resubmit the form.
 * @param {Request} request
 * @param {string} path
 */
const go = (request, path) =>
  new Response(null, {
    status: 303,
    headers: { location: new URL(path, request.url).toString(), 'cache-control': 'no-store' },
  });

/**
 * Read the body, giving up past `cap` bytes rather than reading an abusive
 * upload to the end first.
 * @param {Request} request
 * @param {number} cap
 * @returns {Promise<string|null>} null when the body is over the cap
 */
async function readCapped(request, cap) {
  if (Number(request.headers.get('content-length') ?? '0') > cap) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  /** @type {Uint8Array[]} */
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > cap) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const joined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(joined);
}

/**
 * Tidy one field. Single-line fields lose every control character, so nothing a
 * visitor types can break a subject line; multi-line fields keep their line
 * breaks and tabs and lose the rest.
 * @param {string|null} value
 * @param {boolean} multiline
 */
function tidy(value, multiline) {
  if (typeof value !== 'string') return '';
  const text = value.normalize('NFC');
  return (
    multiline
      ? text.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
      : text.replace(/[\u0000-\u001F\u007F]+/g, ' ')
  ).trim();
}

/**
 * Apply a form's rules. Problems name the field and the reason, never the
 * value, because they are logged.
 * @param {URLSearchParams} data
 * @param {Rule[]} rules
 */
function readFields(data, rules) {
  /** @type {Record<string, string>} */
  const values = {};
  /** @type {string[]} */
  const problems = [];
  for (const rule of rules) {
    const value = tidy(data.get(rule.field), Boolean(rule.multiline));
    if (rule.required && !value) problems.push(`${rule.field}:missing`);
    else if (value.length > rule.max) problems.push(`${rule.field}:too-long`);
    else if (rule.email && value && !EMAIL_SHAPE.test(value)) problems.push(`${rule.field}:not-an-email`);
    values[rule.field] = value;
  }
  return { values, problems };
}

/**
 * Ask Turnstile whether the token is genuine, unused, and was solved on this
 * very host. The host check stops a token earned on some other site from being
 * replayed here.
 * @param {string} token
 * @param {string} secret
 * @param {Request} request
 * @param {string} hostname
 */
async function verifyTurnstile(token, secret, request, hostname) {
  if (!token || token.length > 2048) return { success: false, reason: 'missing-token' };
  const body = new URLSearchParams({ secret, response: token });
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) body.set('remoteip', ip);

  /** @type {any} */
  let outcome;
  try {
    const response = await fetch(SITEVERIFY, { method: 'POST', body });
    outcome = await response.json();
  } catch {
    return { success: false, reason: 'siteverify-unreachable' };
  }
  if (outcome?.success !== true) {
    return { success: false, reason: (outcome?.['error-codes'] ?? []).join(',') || 'rejected' };
  }
  if (outcome.hostname !== hostname) return { success: false, reason: 'hostname-mismatch' };
  return { success: true, reason: '' };
}

const sydneyNow = () =>
  new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());

/**
 * The email itself. Plain text, because it is read by a person in an inbox,
 * and plain text cannot carry anything a visitor typed as markup.
 * @param {string} kind
 * @param {Record<string, string>} f
 * @param {string} host
 * @returns {{ subject: string, text: string, replyTo?: string }}
 */
function compose(kind, f, host) {
  const when = sydneyNow();
  const reachable = (value) => (EMAIL_SHAPE.test(value) ? value : undefined);

  if (kind === 'life-link') {
    const replyTo = reachable(f.email);
    return {
      subject: `Life-Link enquiry: ${f.suburb}`,
      replyTo,
      text: [
        'Someone would like to find a Life-Link group near them.',
        '',
        `Suburb: ${f.suburb}`,
        `Contact: ${f.email}`,
        '',
        '----',
        `Sent through the Life-Link finder at ${host} on ${when}, Sydney time.`,
        replyTo
          ? 'Reply to this email to answer them directly.'
          : 'They left a phone number rather than an email address.',
      ].join('\n'),
    };
  }

  if (kind === 'prayer') {
    /* Nothing personal in the subject line. Subjects show on lock screens and
       in notification previews, and a prayer request is nobody else's
       business. */
    return {
      subject: 'Prayer request from the website',
      replyTo: reachable(f.contact),
      text: [
        'A prayer request came through the website.',
        '',
        f.request,
        '',
        `Name: ${f.name || 'not given'}`,
        `Contact: ${f.contact || 'not given, so they are not expecting a reply'}`,
        '',
        '----',
        `Sent through the prayer request form at ${host} on ${when}, Sydney time.`,
        'It was not stored on the website. This email is the only copy.',
      ].join('\n'),
    };
  }

  return {
    subject: `Website message from ${f.name}`,
    replyTo: f.email,
    text: [
      `From: ${f.name} <${f.email}>`,
      '',
      f.message,
      '',
      '----',
      `Sent through the contact form at ${host} on ${when}, Sydney time.`,
      `Reply to this email to answer ${f.name} directly.`,
    ].join('\n'),
  };
}

/**
 * @param {Request} request
 * @param {Record<string, any>} env
 * @param {'contact'|'prayer'} endpoint
 */
export async function handleForm(request, env, endpoint) {
  if (request.method !== 'POST') {
    return new Response('Use POST.', { status: 405, headers: { allow: 'POST' } });
  }

  const here = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin && origin !== here.origin) return new Response('Not allowed from there.', { status: 403 });

  if (!(request.headers.get('content-type') ?? '').startsWith('application/x-www-form-urlencoded')) {
    return go(request, NOT_SENT);
  }

  const raw = await readCapped(request, MAX_BODY_BYTES);
  if (raw === null) return go(request, NOT_SENT);
  const data = new URLSearchParams(raw);

  const kind =
    endpoint === 'prayer'
      ? 'prayer'
      : data.get('form') === 'life-link' || data.get('subject') === LIFE_LINK_SUBJECT
        ? 'life-link'
        : 'contact';
  const settings = FORMS[kind];

  /* The honeypot is a field people never see. A bot that fills it is told it
     succeeded, so it learns nothing, and nothing is sent. */
  if (tidy(data.get('website'), false)) return go(request, settings.sent);

  if (!env.TURNSTILE_SECRET_KEY || !env.EMAIL) {
    console.warn('form not configured', kind, {
      turnstileSecret: Boolean(env.TURNSTILE_SECRET_KEY),
      emailBinding: Boolean(env.EMAIL),
    });
    return go(request, NOT_SENT);
  }

  const { values, problems } = readFields(data, RULES[kind]);
  if (problems.length) {
    console.warn('form rejected', kind, problems.join(' '));
    return go(request, NOT_SENT);
  }

  const check = await verifyTurnstile(
    data.get('cf-turnstile-response') ?? '',
    env.TURNSTILE_SECRET_KEY,
    request,
    here.hostname
  );
  if (!check.success) {
    console.warn('form failed the spam check', kind, check.reason);
    return go(request, NOT_SENT);
  }

  const message = compose(kind, values, here.host);
  try {
    await env.EMAIL.send({
      to: settings.to,
      from: FORM_SENDER,
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
      subject: message.subject,
      text: message.text,
    });
  } catch (error) {
    /* The error is logged by kind and code only. Its message can echo the
       recipient, which is fine, but never anything the visitor wrote. */
    const e = /** @type {any} */ (error);
    console.error('form could not be sent', kind, e?.code ?? e?.name ?? 'Error');
    return go(request, NOT_SENT);
  }

  return go(request, settings.sent);
}
