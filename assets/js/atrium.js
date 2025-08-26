(function(){
  if (window.lucide) window.lucide.createIcons();
  const data = Array.isArray(window.ATRIUM_EXPERIENCES) ? window.ATRIUM_EXPERIENCES : [];

  // ---- Stats
  const total = data.length;
  const avgIntensity = total ? (data.reduce((s,e)=> s + (+e.intensity || 0), 0) / total).toFixed(1) : 0;
  const publicConsent = data.filter(e => !!e.consent_public_excerpt).length;
  const traditions = new Set(data.map(e => e.tradition).filter(Boolean)).size;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-avg-intensity').textContent = avgIntensity;
  document.getElementById('stat-public').textContent = publicConsent;
  document.getElementById('stat-traditions').textContent = traditions;

  // ---- Aggregations
  const counts = (arr, key) => {
    const m = new Map();
    arr.forEach(e => {
      const v = e[key];
      if (!v) return;
      m.set(v, (m.get(v) || 0) + 1);
    });
    return Array.from(m, ([name, value]) => ({ name, value }));
  };

  const religiosityLabel = (v) => v === 'not' ? 'Not Religious' : v === 'somewhat' ? 'Somewhat Religious' : v === 'very' ? 'Very Religious' : String(v);

  const dataReligiosity = (() => {
    const raw = counts(data, 'religiosity');
    return raw.map((d,i) => ({ name: religiosityLabel(d.name), value: d.value }));
  })();

  const dataIntensity = (() => {
    const m = new Map();
    data.forEach(e => {
      const lvl = +e.intensity || 0;
      if (!lvl) return;
      const name = 'Level ' + lvl;
      m.set(name, (m.get(name) || 0) + 1);
    });
    return Array.from(m, ([name, value]) => ({ name, value }));
  })();

  const dataContexts = counts(data, 'context').map(d => ({ name: String(d.name).replace('_',' '), value: d.value }));
  const dataTraditions = counts(data, 'tradition');

  // ---- Charts (Chart.js)
  const palette = ['#5AA5FF','#D4AF37','#8E806A','#E7D7B1','#301C4D','#F6F1E8','#60A5FA','#A78BFA','#10B981'];

  const ctxRel = document.getElementById('chart-religiosity');
  const ctxInt = document.getElementById('chart-intensity');
  const ctxCtx = document.getElementById('chart-contexts');
  const ctxTrad= document.getElementById('chart-traditions');

  if (ctxRel) new Chart(ctxRel, {
    type: 'pie',
    data: {
      labels: dataReligiosity.map(d=>d.name),
      datasets: [{ data: dataReligiosity.map(d=>d.value), backgroundColor: palette }]
    },
    options: {
      plugins: { legend: { position: 'bottom', labels: { color: '#e8e8ec' } } }
    }
  });

  if (ctxInt) new Chart(ctxInt, {
    type: 'bar',
    data: {
      labels: dataIntensity.map(d=>d.name),
      datasets: [{ label: 'Count', data: dataIntensity.map(d=>d.value), backgroundColor: '#5AA5FF' }]
    },
    options: {
      scales: {
        x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,.08)' } },
        y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,.08)' }, beginAtZero:true, precision:0 }
      },
      plugins: { legend: { display:false } }
    }
  });

  if (ctxCtx) new Chart(ctxCtx, {
    type: 'bar',
    data: {
      labels: dataContexts.map(d=>d.name),
      datasets: [{ label: 'Count', data: dataContexts.map(d=>d.value), backgroundColor: '#D4AF37' }]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,.08)' }, beginAtZero:true, precision:0 },
        y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,.08)' } }
      },
      plugins: { legend: { display:false } }
    }
  });

  if (ctxTrad) new Chart(ctxTrad, {
    type: 'bar',
    data: {
      labels: dataTraditions.map(d=>d.name),
      datasets: [{ label: 'Count', data: dataTraditions.map(d=>d.value), backgroundColor: '#8E806A' }]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,.08)' }, beginAtZero:true, precision:0 },
        y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,.08)' } }
      },
      plugins: { legend: { display:false } }
    }
  });

  // ---- Tabs
  document.querySelectorAll('.tabbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tabbtn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tabpanel').forEach(p => {
        p.style.display = (p.dataset.panel === tab) ? '' : 'none';
      });
    });
  });

  // ---- Downloads
  function toCSV(rows){
    if (!rows.length) return '';
    const keys = Object.keys(rows[0]);
    const esc = v => String(v ?? '').replace(/"/g,'""');
    return [keys.join(','), ...rows.map(r => keys.map(k => `"${esc(r[k])}"`).join(','))].join('\n');
  }

  document.getElementById('atrium-dl-full')?.addEventListener('click', (e)=>{
    e.preventDefault();
    const rows = data.map(exp => ({
      timestamp: exp.created_date,
      age_bracket: exp.age_bracket,
      sex: exp.sex,
      religiosity: exp.religiosity,
      tradition: exp.tradition,
      context: exp.context,
      intensity: exp.intensity,
      duration_minutes: exp.duration_minutes,
      country: exp.country,
      narrative_excerpt: exp.anonymized_excerpt || 'Not available',
      consent_public: !!exp.consent_public_excerpt
    }));
    const blob = new Blob([toCSV(rows)], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: 'spiritual-experiences-full-' + new Date().toISOString().slice(0,10) + '.csv'
    });
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('atrium-dl-summary')?.addEventListener('click', (e)=>{
    e.preventDefault();
    const rows = [
      { metric: 'total_experiences', value: total },
      { metric: 'avg_intensity', value: avgIntensity },
      { metric: 'public_consent', value: publicConsent },
      { metric: 'unique_traditions', value: traditions }
    ];
    const blob = new Blob([toCSV(rows)], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: 'spiritual-experiences-summary-' + new Date().toISOString().slice(0,10) + '.csv'
    });
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  });
})();
