const db = require('./db');
const { notifyNewBooking } = require('./mailer');
const { PHONE_DISPLAY } = require('./views/layout');

const EQUIPMENT_OPTIONS = [
  { key: '1', value: 'refrigeration', label: 'Refrigeration' },
  { key: '2', value: 'hvac', label: 'HVAC / AC' },
  { key: '3', value: 'ice-machine', label: 'Ice Machine' },
  { key: '4', value: 'kitchen-equipment', label: 'Kitchen Equipment' },
  { key: '5', value: 'mixer', label: 'Mixer' },
  { key: '6', value: 'exhaust-hood', label: 'Exhaust Hood' },
  { key: '7', value: 'other', label: 'Other' },
];

const URGENCY_OPTIONS = [
  { key: '1', value: 'emergency', label: 'Emergency — down right now' },
  { key: '2', value: 'this-week', label: 'Needs attention this week' },
  { key: '3', value: 'scheduled', label: 'Just scheduling maintenance' },
];

function menuText(options) {
  return options.map((o) => `${o.key}. ${o.label}`).join('\n');
}

const STEPS = [
  { key: 'equipmentType', options: EQUIPMENT_OPTIONS, prompt: `What kind of equipment needs attention? Reply with a number:\n${menuText(EQUIPMENT_OPTIONS)}` },
  { key: 'urgency', options: URGENCY_OPTIONS, prompt: `How urgent is this? Reply with a number:\n${menuText(URGENCY_OPTIONS)}` },
  { key: 'issueDescription', prompt: "Briefly, what's happening? (mention the specific unit if you can)" },
  { key: 'name', prompt: "What's your name?" },
  { key: 'email', prompt: 'Your email? (for a confirmation and invoice)' },
  { key: 'address', prompt: "Last thing — what's the service address?" },
];

const GREETING =
  "Hi! This is the ProFix305 booking assistant. I'll ask a few quick questions to get your repair request started. Msg & data rates may apply.\n\n";

function cleanText(value, maxLen) {
  return String(value ?? '').trim().slice(0, maxLen);
}

// Drives one turn of the SMS conversation for a given phone number. Session state
// (which step we're on, answers so far) lives in the DB — see sms_sessions in db.js —
// so an in-progress conversation survives a redeploy instead of leaving the customer
// stuck mid-flow. Returns the plain-text reply to send back.
async function handleMessage(fromPhone, rawBody) {
  const body = cleanText(rawBody, 500);
  let session = await db.getSmsSession(fromPhone);

  if (!session) {
    session = { step: 0, answers: {} };
    await db.saveSmsSession(fromPhone, session);
    return GREETING + STEPS[0].prompt;
  }

  const step = STEPS[session.step];
  if (!step) {
    // Shouldn't normally happen (session should've been cleared on completion), but
    // guard against a stale/corrupt session rather than throwing.
    await db.clearSmsSession(fromPhone);
    return "Sorry, something reset on our end. Text anything to start a new request, or just call us directly.";
  }

  let value;
  if (step.options) {
    const match = step.options.find((o) => o.key === body);
    if (!match) {
      return `Sorry, I didn't catch that — please reply with just the number:\n${menuText(step.options)}`;
    }
    value = match.value;
  } else if (step.key === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body)) {
      return "That doesn't look like a valid email — please try again (e.g. name@email.com).";
    }
    value = body;
  } else {
    if (!body) return "Sorry, I didn't get that — could you try again?";
    value = cleanText(body, step.key === 'issueDescription' ? 2000 : 200);
  }

  session.answers[step.key] = value;
  session.step += 1;

  const nextStep = STEPS[session.step];
  if (!nextStep) {
    await db.clearSmsSession(fromPhone);

    const data = {
      name: session.answers.name,
      phone: fromPhone,
      email: session.answers.email,
      businessName: '',
      address: session.answers.address,
      equipmentType: session.answers.equipmentType,
      equipmentDetail: '',
      issueDescription: session.answers.issueDescription,
      urgency: session.answers.urgency,
      preferredDate: '',
      preferredTime: '',
    };

    const id = await db.insertBooking(data);
    const booking = await db.getBooking(id);
    if (process.env.NOTIFY_EMAIL) {
      notifyNewBooking(booking)
        .then((result) => db.updateNotifyStatus(id, result?.ok ? 'sent' : 'failed'))
        .catch(() => db.updateNotifyStatus(id, 'failed').catch(() => {}));
    } else {
      db.updateNotifyStatus(id, 'skipped').catch(() => {});
    }

    return `Thanks, ${data.name}! Your request (#${id}) was received — our dispatch team will call you shortly at this number to confirm. If this is an active emergency, call us directly at ${PHONE_DISPLAY}.`;
  }

  await db.saveSmsSession(fromPhone, session);
  return nextStep.prompt;
}

module.exports = { handleMessage };
