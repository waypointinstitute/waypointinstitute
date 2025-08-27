(function(){
  if (window.lucide) window.lucide.createIcons();
  const CFG = window.PORTAL_CONFIG || {};
  const gLink = document.getElementById('portal-gform-link');
  if (gLink && CFG.externalFormUrl) gLink.href = CFG.externalFormUrl;

  // Panels
  const panels = ['consent','survey','narrative','complete'];
  let current = 'consent';

  const $ = (sel) => document.querySelector(sel);
  const panel = (id) => document.querySelector(`.panel[data-panel="${id}"]`);
  const pill  = (id) => document.querySelector(`.step-pill[data-step-pill="${id}"]`);

  // Form state
  const state = {
    consent_research_use: false,
    consent_public_excerpt: false,
    age_bracket: "",
    sex: "",
    religiosity: "",
    tradition: "",
    context: "",
    intensity: "",
    duration_minutes: "",
    country: "",
    narrative_text: ""
  };

  // Wire inputs
  const bindCheck = (id, key) => {
    const el = document.getElementById(id);
    el?.addEventListener('change', () => {
      state[key] = !!el.checked;
      validate();
    });
  };
  const bindInput = (id, key) => {
    const el = document.getElementById(id);
    el?.addEventListener('input', () => { state[key] = el.value.trim(); validate(); });
    el?.addEventListener('change', () => { state[key] = el.value.trim(); validate(); });
  };

  bindCheck('consent_research_use','consent_research_use');
  bindCheck('consent_public_excerpt','consent_public_excerpt');
  ['age_bracket','sex','religiosity','tradition','context','country','intensity','duration_minutes','narrative_text']
    .forEach(k => bindInput(k, k));

  // Navigation
  function show(id){
    panels.forEach(p => panel(p).hidden = (p !== id));
    current = id;
    // progress pills
    const idx = panels.indexOf(id);
    panels.forEach((p,i) => {
      const el = pill(p);
      el?.classList.toggle('active', i === idx);
      el?.classList.toggle('done',   i <  idx);
    });
  }

  $('#next-to-survey')?.addEventListener('click', () => show('survey'));
  $('#back-to-consent')?.addEventListener('click', () => show('consent'));
  $('#next-to-narrative')?.addEventListener('click', () => show('narrative'));
  $('#back-to-survey')?.addEventListener('click', () => show('survey'));

  // Validation
  function validate(){
    // consent gate
    const canConsent = !!state.consent_research_use;
    $('#next-to-survey').disabled = !canConsent;

    // survey gate (min required)
    const canSurvey = !!(state.age_bracket && state.sex && state.religiosity);
    $('#next-to-narrative').disabled = !canSurvey;

    // narrative gate (length > 50 chars)
    const canSubmit = (state.narrative_text || '').trim().length > 50;
    $('#submit-experience').disabled = !canSubmit;
  }
  validate();

  // Submit
  $('#submit-experience')?.addEventListener('click', async () => {
    // normalize
    const payload = {
      ...state,
      intensity: state.intensity ? parseInt(state.intensity,10) : null,
      duration_minutes: state.duration_minutes ? parseInt(state.duration_minutes,10) : null,
      created_date: new Date().toISOString()
    };

   // build payload object above this as you already do…
const endpoint = (window.PORTAL_CONFIG && window.PORTAL_CONFIG.endpoint) || "";
const method   = (window.PORTAL_CONFIG && window.PORTAL_CONFIG.method)   || "POST";

if (endpoint) {
  // prepare fetch options
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
  // allow config to override/extend (e.g., { mode: "no-cors" })
  if (window.PORTAL_CONFIG && window.PORTAL_CONFIG.fetchOptions) {
    Object.assign(opts, window.PORTAL_CONFIG.fetchOptions);
  }

  let delivered = false;
  try {
    const res = await fetch(endpoint, opts);

    // In no-cors mode, responses are "opaque" (no status/ok). Treat that as success.
    const opaque = res && res.type === "opaque";
    if (opaque || (res && res.ok)) {
      delivered = true;
    } else {
      // If we can read it and it's not ok, consider it a fail.
      delivered = false;
    }
  } catch (e) {
    delivered = false;
  }

  if (delivered) {
    // advance to Thank You panel without showing the "fall back" alert
    gotoPanel("complete");
    updateStepper("complete");
    return;
  }

  // If delivery failed, drop through to CSV fallback…
}

// existing CSV fallback logic continues here (unchanged)
