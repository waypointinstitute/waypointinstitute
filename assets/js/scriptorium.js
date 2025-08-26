(function(){
  if (window.lucide) window.lucide.createIcons();

  const BOOKS = Array.isArray(window.SCRIPTORIUM_BOOKS) ? window.SCRIPTORIUM_BOOKS : [];
  const $grid = document.getElementById('sc-grid');
  const $q = document.getElementById('sc-search');
  const $diff = document.getElementById('sc-difficulty');
  const $tag = document.getElementById('sc-tag');

  const PLACEHOLDER = 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop';

  // Build tag options
  const tags = Array.from(new Set(BOOKS.flatMap(b => (b.topic_tags || [])))).sort();
  tags.forEach(t => {
    const opt = document.createElement('option'); opt.value = t; opt.textContent = t;
    $tag.appendChild(opt);
  });

  // Difficulty badge class
  const diffBadge = (d) => {
    if (d === 'beginner') return 'badge badge--green';
    if (d === 'intermediate') return 'badge badge--blue';
    if (d === 'advanced') return 'badge badge--purple';
    return 'badge';
    };

  // Card
  const card = (b) => {
    const el = document.createElement('div');
    el.className = 'card';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.overflow = 'hidden';

    el.innerHTML = `
      <div class="cover" style="position:relative;height:160px;width:100%;overflow:hidden">
        <img src="${b.cover_image_url || PLACEHOLDER}" alt="${(b.title||'').replace(/"/g,'&quot;')}" style="object-fit:cover;width:100%;height:100%;opacity:.9">
      </div>
      <div class="card-section">
        <div class="card-head">
          <span class="${diffBadge(b.difficulty)}">${b.difficulty || 'Level'}</span>
        </div>
        <h3 class="font-serif" style="margin:.35rem 0 .15rem;font-size:1.15rem">${b.title}</h3>
        <p class="muted" style="margin:0 0 .6rem">by ${b.author || '—'}</p>
        ${b.annotation ? `<p class="muted" style="margin:0 0 .75rem">${b.annotation}</p>` : ''}
        ${(b.topic_tags || []).length
          ? `<div style="display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.6rem">
               ${(b.topic_tags || []).slice(0,3).map(t => `<span class="badge badge--blue"><i data-lucide="tag" style="width:14px;height:14px"></i>${t}</span>`).join('')}
               ${(b.topic_tags || []).length > 3 ? `<span class="badge" style="opacity:.8">+${(b.topic_tags.length - 3)} more</span>` : ''}
             </div>`
          : ''
        }
        ${b.amazon_url
          ? `<a class="btn" href="${b.amazon_url}" target="_blank" rel="noopener">
               View on Amazon <i data-lucide="external-link" style="width:16px;height:16px"></i>
             </a>`
          : ''
        }
      </div>
    `;
    // refresh icons in this card
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
    return el;
  };

  // Filtering
  let q = '';
  function matches(b){
    const hay = [b.title||'', b.author||'', b.annotation||'', (b.topic_tags||[]).join(' ')].join(' ').toLowerCase();
    const okQ = !q || hay.includes(q);
    const okD = ($diff.value === 'all') || b.difficulty === $diff.value;
    const okT = ($tag.value === 'all') || (b.topic_tags || []).includes($tag.value);
    return okQ && okD && okT;
  }

  function render(){
    $grid.innerHTML = '';
    const list = BOOKS.filter(matches);
    if (!list.length){
      const empty = document.createElement('div');
      empty.className = 'card'; empty.style.textAlign='center'; empty.style.padding='2rem';
      empty.innerHTML = `<i data-lucide="book-open" style="width:42px;height:42px;opacity:.6"></i>
        <h3 style="margin:.5rem 0 0">No Books Found</h3>
        <p class="muted">Try different filters or search terms.</p>`;
      $grid.appendChild(empty);
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    list.forEach(b => $grid.appendChild(card(b)));
  }

  $q.addEventListener('input', e => { q = (e.target.value||'').toLowerCase(); render(); });
  $diff.addEventListener('change', render);
  $tag.addEventListener('change', render);

  render();
})();
