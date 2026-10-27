'use strict';
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
function closeMenu(){ menuButton.setAttribute('aria-expanded','false'); navigation.classList.remove('open'); }
menuButton.addEventListener('click',()=>{ const open=menuButton.getAttribute('aria-expanded')!=='true'; menuButton.setAttribute('aria-expanded',String(open)); navigation.classList.toggle('open',open); });
navigation.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuButton.getAttribute('aria-expanded')==='true'){closeMenu();menuButton.focus();}});
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
const tabs=Array.from(document.querySelectorAll('[role=tab]'));
function selectTab(tab){tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active;});}
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=tabs[(index+1)%tabs.length];if(e.key==='ArrowLeft')next=tabs[(index+tabs.length-1)%tabs.length];if(e.key==='Home')next=tabs[0];if(e.key==='End')next=tabs[tabs.length-1];if(next){e.preventDefault();selectTab(next);next.focus();}});});
const contacts={
 farmacia:{area:'Equipo comercial',title:'Conozcamos tu farmacia.',description:'Contanos el nombre de tu farmacia y la localidad. Podés iniciar la consulta por WhatsApp o correo; el equipo comercial te orientará sobre los próximos pasos.',phone:'5493412809081',email:'ventas@drogueriaeyg.com.ar',message:'Hola, quiero conocer EyG para mi farmacia.'},
 institucion:{area:'Equipo comercial',title:'Hablemos de tu institución.',description:'Contanos qué institución representás, dónde se encuentra y qué necesitás. El equipo comercial te orientará sobre productos, disponibilidad y condiciones.',phone:'5493412809081',email:'ventas@drogueriaeyg.com.ar',message:'Hola, quiero consultar por el abastecimiento de mi institución.'},
 pedido:{area:'Equipo comercial',title:'Veamos tu consulta.',description:'Tené a mano el nombre de tu farmacia o institución y la referencia del pedido. También podés comunicarte directamente con tu asesor comercial.',phone:'5493412809081',email:'ventas@drogueriaeyg.com.ar',message:'Hola, quisiera consultar por un pedido de mi farmacia o institución.'},
 acceso:{area:'Ayuda comercial',title:'Te ayudamos a ingresar.',description:'Contanos a qué farmacia o institución pertenece tu cuenta y qué inconveniente encontraste. No envíes tu contraseña por WhatsApp ni por correo.',phone:'5493412809081',email:'ventas@drogueriaeyg.com.ar',message:'Hola, necesito ayuda para acceder al Portal EyG.'},
 cobranzas:{area:'Cobranzas',title:'Tu cuenta, en contacto directo.',description:'Para consultar el estado de cuenta, vencimientos, pagos o enviar un comprobante, comunicate con el área de Cobranzas.',phone:'5493413934931',email:'cobranzas@drogueriaeyg.com.ar',message:'Hola, necesito consultar con Cobranzas por la cuenta de mi farmacia o institución.'},
 facturacion:{area:'Facturación',title:'Tus comprobantes y datos.',description:'Para consultar por facturas, notas de crédito, remitos o actualización de datos fiscales, comunicate con Facturación.',phone:'5493415474574',email:'facturacion@drogueriaeyg.com.ar',message:'Hola, necesito consultar con Facturación por comprobantes o datos fiscales.'}
};
const reason=document.querySelector('#contact-reason');
function updateContact(key){const contact=contacts[key];if(!contact)return;reason.value=key;document.querySelector('#contact-area').textContent=contact.area;document.querySelector('#contact-result-title').textContent=contact.title;document.querySelector('#contact-result-description').textContent=contact.description;document.querySelector('#contact-whatsapp').href='https://wa.me/'+contact.phone+'?text='+encodeURIComponent(contact.message);const mail=document.querySelector('#contact-email');mail.textContent=contact.email;mail.href='mailto:'+contact.email;}
reason.addEventListener('change',()=>updateContact(reason.value));
document.querySelectorAll('[data-contact]').forEach(a=>a.addEventListener('click',()=>updateContact(a.dataset.contact)));
const credits=document.querySelector('#credits-dialog');
document.querySelector('#credits-open').addEventListener('click',()=>credits.showModal());
credits.querySelector('.dialog-close').addEventListener('click',()=>credits.close());
credits.addEventListener('click',e=>{if(e.target===credits){const box=credits.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)credits.close();}});


// SVG morph: canonical logo at rest, sampled outlines only during transitions.
(()=>{
  const art=document.querySelector('.hero-art'), svg=art.querySelector('.brand-morph');
  const body=svg.querySelector('.morph-body'), blister=svg.querySelector('.detail-blister'), box=svg.querySelector('.detail-box');
  const caption=art.querySelector('.motion-caption'), control=art.querySelector('.motion-toggle');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const shapes=[
    {d:body.getAttribute('d'),label:'El respaldo de EyG',hold:4300},
    {d:'M210 38H110Q82 38 82 66V254Q82 282 110 282H210Q238 282 238 254V66Q238 38 210 38Z',label:'Medicamentos',hold:3000},
    {d:'M160 38 48 98V222L160 282 272 222V98Z',label:'Insumos y descartables',hold:3000}
  ];
  const dots=[art.querySelector('.dot-left'),art.querySelector('.dot-right')];
  const halos=[art.querySelector('.halo-left'),art.querySelector('.halo-right')];
  const glints=art.querySelector('.connection-glints');
  const streaks=Array.from(glints.children);
  // A single clock keeps the contours, travelling dots and glints in harmony.
  function renderConnections(time){
    const still=reduced.matches;
    const phase=(time%7850)/7850;
    const travel=still?0:(1-Math.cos(phase*Math.PI*2))/2;
    const light=still?0:Math.sin(travel*Math.PI)**4;
    dots.forEach((dot,i)=>{
      const x=i===0?36+92*travel:444-92*travel;
      dot.setAttribute('cx',x.toFixed(2));
      dot.setAttribute('r',(4.5+.45*light).toFixed(2));
      halos[i].setAttribute('cx',x.toFixed(2));
      halos[i].setAttribute('r',(7+5*light).toFixed(2));
      halos[i].setAttribute('opacity',(.16*light).toFixed(3));
    });
    glints.setAttribute('opacity',still?'0':'1');
    streaks.forEach((path,i)=>{
      const shifted=(phase+(i<2?0:.22))%1;
      const sweep=(1-Math.cos(shifted*Math.PI*2))/2;
      path.setAttribute('stroke-dashoffset',(16-126*sweep).toFixed(2));
      path.setAttribute('opacity',(.45*Math.sin(sweep*Math.PI)**2).toFixed(3));
    });
  }
  const count=240, duration=1800;
  const probe=document.createElementNS('http://www.w3.org/2000/svg','path');
  probe.setAttribute('visibility','hidden');svg.append(probe);
  shapes.forEach(shape=>{probe.setAttribute('d',shape.d);const length=probe.getTotalLength();shape.points=Array.from({length:count},(_,i)=>{const p=probe.getPointAtLength(i/count*length);return [p.x,p.y];});});
  probe.remove();
  // Align closed outlines to avoid rotational twists while morphing.
  for(let n=1;n<shapes.length;n++){
    const previous=shapes[n-1].points,current=shapes[n].points;
    let best=Infinity, offset=0;
    for(let shift=0;shift<count;shift++){let distance=0;for(let i=0;i<count;i+=4){const p=current[(i+shift)%count],q=previous[i];distance+=(p[0]-q[0])**2+(p[1]-q[1])**2;}if(distance<best){best=distance;offset=shift;}}
    shapes[n].points=current.map((_,i)=>current[(i+offset)%count]);
  }
  const cycle=shapes.reduce((sum,s)=>sum+s.hold+duration,0);
  let elapsed=0, last=0, frame=0, paused=false, visible=true;
  function details(index,opacity){(index===1?blister:index===2?box:null)?.setAttribute('opacity',opacity.toFixed(3));}
  function render(time){
    renderConnections(time);
    let t=time%cycle,index=0;
    while(t>=shapes[index].hold+duration){t-=shapes[index].hold+duration;index++;}
    const current=shapes[index],next=(index+1)%shapes.length;
    blister.setAttribute('opacity','0');box.setAttribute('opacity','0');
    if(t<current.hold){body.setAttribute('d',current.d);details(index,1);caption.textContent=current.label;caption.style.opacity='1';art.dataset.motionState=String(index);return;}
    const progress=(t-current.hold)/duration;
    const eased=progress<.5?4*progress**3:1-(-2*progress+2)**3/2;
    const points=current.points.map((p,i)=>{const q=shapes[next].points[i];return (p[0]+(q[0]-p[0])*eased).toFixed(2)+','+(p[1]+(q[1]-p[1])*eased).toFixed(2);});
    body.setAttribute('d','M'+points.join('L')+'Z');
    details(index,Math.max(0,1-progress*3));details(next,Math.max(0,(progress-.65)/.35));
    caption.textContent=progress<.5?current.label:shapes[next].label;
    caption.style.opacity=String(Math.abs(progress-.5)*2);
    art.dataset.motionState=index+'-'+next;
  }
  function tick(now){if(last)elapsed+=Math.min(now-last,80);last=now;render(elapsed);frame=requestAnimationFrame(tick);}
  function sync(){
    cancelAnimationFrame(frame);last=0;
    if(reduced.matches){elapsed=0;render(0);control.hidden=true;return;}
    control.hidden=false;
    control.setAttribute('aria-label',paused?'Reanudar animación':'Pausar animación');
    control.querySelector('.motion-toggle-text').textContent=paused?'Reanudar':'Pausar';
    control.querySelector('.motion-toggle-icon').textContent=paused?'▷':'Ⅱ';
    if(!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);
  }
  control.addEventListener('click',()=>{paused=!paused;sync();});
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.15}).observe(art);
  render(0);sync();
})();
