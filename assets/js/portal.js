(function(){
  if (window.lucide) window.lucide.createIcons();

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

    const { endpoint, method } = (window.PORTAL_CONFIG || {});
    if (endpoint) {
      try {
        const res = await fetch(endpoint, {
          method: method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Bad response');
        show('complete');
      } catch (e) {
        alert('Submission failed. Falling back to file download.');
        downloadCSV(payload);
        show('complete');
      }
    } else {
      downloadCSV(payload);
      show('complete');
    }
  });

  function downloadCSV(row){
    const keys = [
      'created_date','age_bracket','sex','religiosity','tradition','context',
      'intensity','duration_minutes','country','narrative_text',
      'consent_research_use','consent_public_excerpt'
    ];
    const esc = v => String(v ?? '').replace(/"/g,'""');
    const csv = [keys.join(','), keys.map(k => `"${esc(row[k])}"`).join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: 'spiritual-experience-' + new Date().toISOString().slice(0,10) + '.csv'
    });
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  }

  // init
  show('consent');
})();
