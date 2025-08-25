// Lucide icons
if (window.lucide) window.lucide.createIcons();

// Stars background
(function makeStars(n = 100) {
  const host = document.getElementById('stars');
  if (!host) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const size = Math.random() * 2 + 1;
    const tw = (Math.random() * 2 + 2).toFixed(2) + 's';
    s.style.left = x + '%';
    s.style.top = y + '%';
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.setProperty('--tw', tw);
    host.appendChild(s);
  }
})();

// HUD hover text
document.querySelectorAll('.waypoint').forEach(a => {
  a.addEventListener('mouseenter', () => {
    const t = document.getElementById('hud-title');
    const d = document.getElementById('hud-desc');
    if (t) t.textContent = a.dataset.title || 'Waypoint';
    if (d) d.textContent = a.dataset.desc || '';
  });
});
