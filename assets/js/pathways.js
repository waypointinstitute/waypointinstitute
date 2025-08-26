(function(){
  if (window.lucide) window.lucide.createIcons();

  const DATA = Array.isArray(window.PATHWAYS_DATA) ? window.PATHWAYS_DATA : [];
  const $grid = document.getElementById('pw-grid');
  const $search = document.getElementById('pw-search');
  const $diff = document.getElementById('pw-difficulty');
  const $theme = document.getElementById('pw-theme');

  // Build theme options
  const themes = Array.from(new Set(DATA.map(p => (p.theme||'').trim()).filter(Boolean))).sort();
  themes.forEach(t => {
    const opt = document.createElement('option'); opt.value = t; opt.textContent = t;
    $theme.appendChild(opt);
  });

  // Difficulty badge styles
  const diffStyle = (d) => {
    if (d === 'intro') return 'badge badge--green';
    if (d === 'intermediate') return 'badge badge--blue';
    if (d === 'advanced') return 'badge badge--purple';
    return 'badge';
  };

  // Render one card
  const card = (p, idx) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';

    div.innerHTML = `
      <div class="card-head">
        <div class="badges">
          <span class="${diffStyle(p.difficulty)}">${p.difficulty || 'Level'}</span>
          ${p.theme ? `<span class="badge badge--amber"><i data-lucide="tag" style="width:14px;height:14px"></i> ${p.theme}</span>` : ''}
        </div>
        <div class="muted" style="display:flex;align-items:center;gap:.35rem">
          <i data-lucide="timer" style="width:16px;height:16px"></i>${p.estimated_minutes || 0} min
        </div>
      </div>
      <h3 class="font-serif" style="margin:.25rem 0 .35rem;font-size:1.15rem">${p.title}</h3>
      ${p.summary ? `<p class="muted" style="margin:0 0 .75rem">${p.summary}</p>` : ''}
      <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center">
        <div class="muted" style="display:flex;align-items:center;gap:.35rem;font-size:.95rem">
          <i data-lucide="list" style="width:16px;height:16px"></i>${Array.isArray(p.steps) ? p.steps.length : 0} steps
        </div>
        <a href="#" class="btn" data-open="${p.id}" style="display:inline-flex;align-items:center;gap:.5rem">Explore <i data-lucide="arrow-right" style="width:16px;height:16px"></i></a>
      </div>
    `;
    // Attach handler after adding
    setTimeout(() => {
      div.querySelector(`[data-open="${p.id}"]`)?.addEventListener('click', (e) => {
        e.preventDefault(); openModal(p);
      });
      if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 }});
    }, 0);
    return div;
  };

  // Filters
  let q = '';
  const matches = (p) => {
    const hay = [p.title||'', p.summary||'', p.theme||''].join(' ').toLowerCase();
    const okQ = !q || hay.includes(q);
    const okD = ($diff.value === 'all') || p.difficulty === $diff.value;
    const okT = ($theme.value === 'all') || (p.theme || '') === $theme.value;
    return okQ && okD && okT;
  };

  const render = () => {
    $grid.innerHTML = '';
    const list = DATA.filter(matches);
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'card';
      empty.style.textAlign = 'center';
      empty.style.padding = '2rem';
      empty.innerHTML = `<i data-lucide="map" style="width:42px;height:42px;opacity:.6"></i>
      <h3 style="margin:.5rem 0 0">No Pathways Found</h3>
      <p class="muted">Try different filters or search terms.</p>`;
      $grid.appendChild(empty);
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    list.forEach((p,i) => $grid.appendChild(card(p,i)));
  };

  $search.addEventListener('input', e => { q = (e.target.value||'').toLowerCase(); render(); });
  $diff.addEventListener('change', render);
  $theme.addEventListener('change', render);

  render();

  // -------- Modal ----------
  const $modal = document.getElementById('pw-modal');
  const $title = document.getElementById('pw-title');
  const $meta  = document.getElementById('pw-meta');
  const $body  = document.getElementById('pw-body');
  const $close = document.getElementById('pw-close');

  function openModal(p){
    $title.textContent = p.title;
    const steps = Array.isArray(p.steps) ? p.steps.length : 0;
    $meta.textContent = `${steps} steps • ${p.estimated_minutes || 0} minutes total`;

    $body.innerHTML = '';
    (p.steps || []).forEach((s, i) => {
      const row = document.createElement('div');
      row.className = 'pw-step';
      row.innerHTML = `
        <div class="pw-step__head">
          <span class="badge">${i+1}</span>
          <strong>${s.title || 'Step ' + (i+1)}</strong>
          ${s.estimated_minutes ? `<span class="muted" style="margin-left:auto;display:inline-flex;gap:.35rem;align-items:center"><i data-lucide="timer" style="width:16px;height:16px"></i>${s.estimated_minutes} min</span>` : ''}
        </div>
        ${s.content_html ? `<div class="pw-step__body">${s.content_html}</div>` : ''}
        ${(Array.isArray(s.book_references) && s.book_references.length)
            ? `<div class="pw-step__refs">${s.book_references.map(ref => `<span class="badge badge--blue"><i data-lucide="book-open" style="width:14px;height:14px"></i> ${ref}</span>`).join(' ')}</div>`
            : ''}
      `;
      $body.appendChild(row);
    });

    $modal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (window.lucide) window.lucide.createIcons();
  }

  function closeModal(){
    $modal.hidden = true;
    document.body.style.overflow = '';
  }

  $close.addEventListener('click', closeModal);
  $modal.querySelector('.pw-modal__backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$modal.hidden) closeModal(); });
})();
