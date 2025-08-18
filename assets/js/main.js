// Simple IntersectionObserver reveals
document.addEventListener('DOMContentLoaded', ()=>{
  const els = document.querySelectorAll('.card, .item, section');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('reveal-in');
        io.unobserve(e.target);
      }
    });
  }, {root:null, threshold:0.08});
  els.forEach(el=>{ el.classList.add('reveal'); io.observe(el); });
  console.debug("Waypoint main.js ready");
});
