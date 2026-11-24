const menuButton=document.querySelector('.menu-button');
const menu=document.querySelector('#menu');

function setMenu(open){
  menu.classList.toggle('open',open);
  menuButton.setAttribute('aria-expanded',String(open));
  if(open) menu.querySelector('a')?.focus();
}

menuButton?.addEventListener('click',()=>setMenu(menuButton.getAttribute('aria-expanded')!== 'true'));
menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
document.addEventListener('click',event=>{if(!menu?.contains(event.target)&&!menuButton?.contains(event.target))setMenu(false)});
document.addEventListener('keydown',event=>{if(event.key==='Escape')setMenu(false)});

document.getElementById('year').textContent=new Date().getFullYear();

const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target)}
  });
},{threshold:.12,rootMargin:'0px 0px -40px'});

document.querySelectorAll('.reveal').forEach((element,index)=>{
  element.style.setProperty('--reveal-delay',`${Math.min(index%6*.07,.35)}s`);
  revealObserver.observe(element);
});

const cards=document.querySelectorAll('.card');
const motionAllowed=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(motionAllowed){
  cards.forEach(card=>{
    card.addEventListener('pointermove',event=>{
      const rect=card.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width-.5;
      const y=(event.clientY-rect.top)/rect.height-.5;
      card.style.setProperty('--tilt-x',`${y*-4}deg`);
      card.style.setProperty('--tilt-y',`${x*4}deg`);
    });
    card.addEventListener('pointerleave',()=>{card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg')});
  });
}
