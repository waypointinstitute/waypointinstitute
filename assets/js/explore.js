(function () {
  const container = document.getElementById('starfield');
  const tip = document.getElementById('waypoint-tooltip');
  if (!container) return;

  const items = (window.WAYPOINT_ITEMS || []).filter(Boolean);
  const visited = new Set(JSON.parse(localStorage.getItem('wp_visited') || '[]'));

  const PADDING = 24, MIN_R = 6, MAX_R = 18, MAX_TRIES = 1500, GRID = 40;
  const kindClass = { essays:'orb-essays', research:'orb-research', projects:'orb-projects', people:'orb-people', publications:'orb-publications' };

  const grid = new Map();
  const keyFor = (x,y)=>`${Math.floor(x/GRID)}:${Math.floor(y/GRID)}`;
  const placed = [];
  const { width, height } = container.getBoundingClientRect();

  function collides(x,y,r){
    const [gx,gy] = keyFor(x,y).split(':').map(Number);
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
      const bucket = grid.get(`${gx+dx}:${gy+dy}`)||[];
      for(const p of bucket){
        const rr=p.r+r+8, dxp=p.x-x, dyp=p.y-y;
        if(dxp*dxp + dyp*dyp < rr*rr) return true;
      }
    }
    return false;
  }
  function addToGrid(pt){ const k=keyFor(pt.x,pt.y); const arr=grid.get(k)||[]; arr.push(pt); grid.set(k,arr); }
  function place(n){
    let tries=0, placedN=0;
    while(placedN<n && tries<MAX_TRIES){
      tries++;
      const r = MIN_R + Math.random()*(MAX_R-MIN_R);
      const x = PADDING + r + Math.random()*(width - 2*(PADDING + r));
      const y = PADDING + r + Math.random()*(height - 2*(PADDING + r));
      if(!collides(x,y,r)){ const pt={x,y,r}; placed.push(pt); addToGrid(pt); placedN++; }
    }
  }

  const N = Math.min(items.length, 120);
  place(N);

  for(let i=0;i<placed.length;i++){
    const item = items[i % items.length], pt = placed[i];
    const a = document.createElement('a');
    a.className = `orb ${kindClass[item.t]||''} ${visited.has(item.url)?'orb-visited':''}`;
    a.href = item.url;
    a.style.left = `${pt.x}px`; a.style.top = `${pt.y}px`;
    a.style.width = a.style.height = `${pt.r*2}px`;
    a.dataset.title = item.title; a.dataset.url = item.url; a.dataset.kind = item.t;

    a.addEventListener('mouseenter', ()=>showTip(a));
    a.addEventListener('mouseleave', hideTip);
    a.addEventListener('mousemove', moveTip);
    a.addEventListener('click', ()=>{ visited.add(item.url); localStorage.setItem('wp_visited', JSON.stringify([...visited])); });

    a.addEventListener('mousemove', (e)=>{
      const rect=a.getBoundingClientRect(), cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
      const dx=(e.clientX-cx)/rect.width, dy=(e.clientY-cy)/rect.height;
      a.style.transform = `translate(${dx*6}px, ${dy*6}px)`;
    });
    a.addEventListener('mouseleave', ()=>{ a.style.transform='translate(0,0)'; });

    container.appendChild(a);
  }

  function showTip(el){
    tip.hidden=false;
    tip.innerHTML = `<div class="tip-kind">${el.dataset.kind}</div><div class="tip-title">${el.dataset.title}</div>`;
  }
  function moveTip(e){ const pad=12; tip.style.left=`${e.clientX+pad}px`; tip.style.top=`${e.clientY+pad}px`; }
  function hideTip(){ tip.hidden=true; }

  setInterval(()=>{
    const orbs = container.querySelectorAll('.orb');
    if(!orbs.length) return;
    const o = orbs[Math.floor(Math.random()*orbs.length)];
    o.classList.add('orb-twinkle'); setTimeout(()=>o.classList.remove('orb-twinkle'),1200);
  }, 350);
})();
