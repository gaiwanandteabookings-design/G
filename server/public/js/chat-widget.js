(function () {
  const widget = document.getElementById('chat-widget');
  if (!widget) return;

  const launcher = document.getElementById('chat-launcher');
  const panel = document.getElementById('chat-panel');
  const closeBtn = document.getElementById('chat-close');
  const body = document.getElementById('chat-body');

  const STEPS = [
    {
      key: 'equipmentType',
      bot: "Hi! 👋 What kind of equipment needs attention?",
      type: 'choice',
      options: [
        { label: 'Refrigeration', value: 'refrigeration' },
        { label: 'HVAC / AC', value: 'hvac' },
        { label: 'Ice Machine', value: 'ice-machine' },
        { label: 'Kitchen Equipment', value: 'kitchen-equipment' },
        { label: 'Mixer', value: 'mixer' },
        { label: 'Exhaust Hood', value: 'exhaust-hood' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      key: 'urgency',
      bot: 'Got it. How urgent is this?',
      type: 'choice',
      options: [
        { label: 'Emergency — down right now', value: 'emergency' },
        { label: 'Needs attention this week', value: 'this-week' },
        { label: 'Just scheduling maintenance', value: 'scheduled' },
      ],
    },
    { key: 'issueDescription', bot: "Briefly, what's happening with it?", type: 'text', placeholder: 'e.g. walk-in cooler not holding temp' },
    { key: 'name', bot: "What's your name?", type: 'text', placeholder: 'Full name' },
    { key: 'phone', bot: 'Best phone number to reach you?', type: 'tel', placeholder: '(305) 555-0100' },
    { key: 'address', bot: "Last thing — what's the service address?", type: 'text', placeholder: 'Street, city' },
  ];

  const answers = {};
  let stepIndex = 0;
  let started = false;
  let submitted = false;

  function addMsg(text, who) {
    const el = document.createElement('div');
    el.className = `chat-msg chat-msg-${who}`;
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function clearInputArea() {
    const existing = body.querySelector('.chat-options, .chat-input-row');
    if (existing) existing.remove();
  }

  function renderStep() {
    clearInputArea();
    const step = STEPS[stepIndex];
    if (!step) return submitLead();

    addMsg(step.bot, 'bot');

    if (step.type === 'choice') {
      const wrap = document.createElement('div');
      wrap.className = 'chat-options';
      step.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chat-option-btn';
        btn.textContent = opt.label;
        btn.addEventListener('click', () => {
          answers[step.key] = opt.value;
          addMsg(opt.label, 'user');
          clearInputArea();
          stepIndex += 1;
          renderStep();
        });
        wrap.appendChild(btn);
      });
      body.appendChild(wrap);
    } else {
      const row = document.createElement('div');
      row.className = 'chat-input-row';
      const input = document.createElement(step.key === 'issueDescription' ? 'textarea' : 'input');
      if (step.key !== 'issueDescription') input.type = step.type;
      else input.rows = 2;
      input.placeholder = step.placeholder || '';

      const sendBtn = document.createElement('button');
      sendBtn.type = 'button';
      sendBtn.textContent = 'Send';

      function submit() {
        const value = input.value.trim();
        if (!value) return;
        answers[step.key] = value;
        addMsg(value, 'user');
        clearInputArea();
        stepIndex += 1;
        renderStep();
      }

      sendBtn.addEventListener('click', submit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submit();
        }
      });

      row.appendChild(input);
      row.appendChild(sendBtn);
      body.appendChild(row);
      input.focus();
    }
    body.scrollTop = body.scrollHeight;
  }

  async function submitLead() {
    if (submitted) return;
    submitted = true;
    addMsg('Sending your request…', 'bot');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: answers.name,
          phone: answers.phone,
          email: '',
          businessName: '',
          address: answers.address,
          equipmentType: answers.equipmentType,
          issueDescription: answers.issueDescription,
          urgency: answers.urgency,
          preferredDate: '',
          preferredTime: '',
        }),
      });
      const data = await res.json();
      const last = body.querySelector('.chat-msg-bot:last-child');
      if (res.ok && data.ok) {
        if (last) last.textContent = `Thanks, ${answers.name}! Your request (#${data.id}) was received — our dispatch team will call you shortly at ${answers.phone}.`;
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', { transaction_id: String(data.id), source: 'chat_widget' });
        }
      } else if (last) {
        last.textContent = data.error || `Something went wrong — please call us directly instead.`;
        submitted = false;
      }
    } catch (err) {
      const last = body.querySelector('.chat-msg-bot:last-child');
      if (last) last.textContent = 'Network error — please call us directly instead.';
      submitted = false;
    }
  }

  function openPanel() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    if (!started) {
      started = true;
      renderStep();
    }
  }

  function closePanel() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
  }

  launcher.addEventListener('click', () => {
    if (panel.hidden) openPanel();
    else closePanel();
  });
  closeBtn.addEventListener('click', closePanel);
})();
