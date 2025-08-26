(function(){
  if (window.lucide) window.lucide.createIcons();

  const DATA = Array.isArray(window.CONCEPTS_DATA) ? window.CONCEPTS_DATA : [];
  const $grid  = document.getElementById('cl-grid');
  const $q     = document.getElementById('cl-search');
  const $stat  = document.getElementById('cl-status');
  const $tag   = document.getElementById('cl-tag');

  // Build tag options
  const tags = Array.from(new Set(DATA.flatMap(c => (c.tags || [])))).sort();
  tags.forEach(t => {
    const opt = document.createElement('option'); opt.value = t; opt.textContent = t;
    $tag.appendChild(opt);
  });

  // Status badge styles
  const statusBadge = (s) => {
    if (s === 'published') return 'badge badge--green';
    if (s === 'draft')     return 'badge badge--amber';
    return 'badge';
  };

  // Card
  const card = (c) => {
    const el = document.createElement('div');
    el.className = 'card';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.innerHTML = `
      <div class="card-head">
        <span class="${statusBadge(c.status)}">${c.status || 'status'}</span>
        <span class="muted" style="display:flex;align-items:center;gap:.35rem;font-size:.95rem">
          <i data-lucide="check-circle-2" style="width:16px;height:16px"></i>${(c.tags||[]).length} tags
        </span>
      </div>
      <h3 class="font-serif" style="margin:.25rem 0 .35rem;font-size:1.15rem">${c.title}</h3>
      ${c.summary ? `<p class="muted" style="margin:0 0 .75rem">${c.summary}</p>` : ''}
      <div style="margin-top:auto;display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.5rem">
        ${(c.tags||[]).slice(0,3).map(t => `<span class="badge badge--blue"><i data-lucide="tag" style="width:14px;height:14px"></i>${t}</span>`).join('')}
        ${ (c.tags||[]).length > 3 ? `<span class="badge" style="opacity:.8">+${(c.tags||[]).length - 3} more</span>` : '' }
      </div>
      <div style="display:flex;gap:.6rem">
        <a href="#" class="btn" data-open="${c.id}" style="display:inline-flex;align-items:center;gap:.5rem">Open Concept <i data-lucide="external-link" style="width:16px;height:16px"></i></a>
      </div>
    `;
    // wire open
    setTimeout(() => {
      el.querySelector(`[data-open="${c.id}"]`)?.addEventListener('click', (e) => {
        e.preventDefault(); openModal(c);
      });
      if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 }});
    }, 0);
    return el;
  };

  // Filters
  let q = '';
  function matches(c){
    const hay = [c.title||'', c.summary||'', c.content_html||'', (c.tags||[]).join(' ')].join(' ').toLowerCase();
    const okQ  = !q || hay.includes(q);
    const okS  = ($stat.value === 'all') || c.status === $stat.value;
    const okT  = ($tag.value === 'all') || (c.tags||[]).includes($tag.value);
    return okQ && okS && okT;
  }

  function render(){
    $grid.innerHTML = '';
    const list = DATA.filter(matches);
    if (!list.length){
      const empty = document.createElement('div');
      empty.className = 'card'; empty.style.textAlign='center'; empty.style.padding='2rem';
      empty.innerHTML = `<i data-lucide="file-text" style="width:42px;height:42px;opacity:.6"></i>
        <h3 style="margin:.5rem 0 0">No Concepts Found</h3>
        <p class="muted">Try adjusting your filters.</p>`;
      $grid.appendChild(empty);
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    list.forEach(c => $grid.appendChild(card(c)));
  }

  $q.addEventListener('input', e => { q = (e.target.value||'').toLowerCase(); render(); });
  $stat.addEventListener('change', render);
  $tag.addEventListener('change', render);
  render();

   // Modal
  const $modal = document.getElementById('cl-modal');
  const $title = document.getElementById('cl-title');
  const $tags  = document.getElementById('cl-tags');
  const $body  = document.getElementById('cl-body');
  const $close = document.getElementById('cl-close');
  const $back  = document.querySelector('.cl-modal__backdrop');

  // belt-and-suspenders: ensure modal starts hidden
  if ($modal) $modal.hidden = true;

  function openModal(c){
    if (!$modal) return;
    $title.textContent = c.title || '';
    $tags.innerHTML = (c.tags||[]).map(t => `<span class="badge badge--blue"><i data-lucide="tag" style="width:14px;height:14px"></i>${t}</span>`).join(' ');
    $body.innerHTML = c.content_html || '<p class="muted">No content yet.</p>';
    $modal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (window.lucide) window.lucide.createIcons();
  }

  function closeModal(){
    if (!$modal) return;
    $modal.hidden = true;
    document.body.style.overflow = '';
  }

  if ($close) $close.addEventListener('click', closeModal);
  if ($back)  $back.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $modal && !$modal.hidden) closeModal(); });
