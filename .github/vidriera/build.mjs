// Motor de vidriera — corre en GitHub Actions (diario). Lee ventas + stock de Odoo
// vía la edge function odoo-rpc, arma las fichas públicas (sin precios) y el sitemap.
// Nunca borra páginas ya publicadas (URLs estables para SEO); solo refresca contenido y stock.
import fs from 'node:fs';

const RPC='https://yxotopoklgjowcudveoj.supabase.co/functions/v1/odoo-rpc';
const BASE='https://www.drogueriaeyg.com.ar';
const ODOO_IMG='https://drogueriaeyg.odoo.com/web/image/product.product/';
const LOGIN='https://drogueriaeyg.odoo.com/web/login';
const WA='https://wa.me/5493412809081?text='+encodeURIComponent('Hola, quiero solicitar acceso al portal mayorista de Droguería EyG para ver precios y hacer pedidos.');
const TOPN=20;                 // top 20 más vendidos
const SINCE='2025-08-21';      // ventana de ventas (~12 meses; se puede mover)
const OUT='productos', IMGDIR=OUT+'/img';
const COPY=JSON.parse(fs.readFileSync('.github/vidriera/copy.json','utf8'));

fs.mkdirSync(IMGDIR,{recursive:true});

async function rpc(model,method,args,kwargs={}){
  const r=await fetch(RPC,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,method,args,kwargs})});
  const j=await r.json(); if(!j.ok) throw new Error(JSON.stringify(j).slice(0,300)); return j.result;
}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function slugify(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,70);}
function titlecase(s){return String(s).toLowerCase().replace(/\b([a-zñáéíóú])/g,(m,c)=>c.toUpperCase()).replace(/\bMg\b/g,'mg').replace(/\bMl\b/g,'ml').replace(/\bCc\b/g,'cc');}

// Genera copy automática básica para productos nuevos que aún no tienen entrada curada
function autoEnrich(name,categ,code){
  const base=name.replace(/\([^)]*\)/g,'').replace(/["“”]/g,'').replace(/\s+-\s*$/,'').trim();
  const parts=base.split(' - ').map(s=>s.trim()).filter(Boolean);
  const fab=parts.length>=2?parts[parts.length-1]:'—';
  const m=name.match(/\(([^)]*)\)/); const pres=m?m[1].trim():'Consultar presentación';
  let tipo='Insumo médico / farmacéutico';
  if(/AMPOLLA/i.test(categ+name)) tipo='Medicamento inyectable (ampolla)';
  else if(/COMPRIMIDO/i.test(categ+name)) tipo='Medicamento en comprimidos';
  else if(/JERINGA/i.test(categ+name)) tipo='Jeringa hipodérmica descartable estéril';
  else if(/BARBIJO/i.test(categ+name)) tipo='Barbijo descartable';
  else if(/GUANTE/i.test(categ+name)) tipo='Guantes descartables';
  else if(categ){const leaf=categ.split('/').pop().trim(); tipo=titlecase(leaf);}
  const catParts=(categ||'').split('/').map(s=>s.trim()).filter(x=>x&&x.toUpperCase()!=='ALL');
  const cat=catParts.length?catParts.map(titlecase).join(' · '):'Productos';
  return {s:slugify(base+'-'+fab)||('producto-'+code), t:titlecase(base), tipo, pres, fab, cat, auto:true};
}

async function dlImg(id,code){
  for(const x of ['png','jpg']){ if(fs.existsSync(IMGDIR+'/'+code+'.'+x)) return code+'.'+x; }
  try{
    const r=await fetch(ODOO_IMG+id+'/image_512'); const buf=Buffer.from(await r.arrayBuffer());
    let ext = (buf[0]===0xFF&&buf[1]===0xD8)?'jpg':'png';
    fs.writeFileSync(IMGDIR+'/'+code+'.'+ext,buf); return code+'.'+ext;
  }catch(e){ return null; }
}

function metaDesc(e){
  const b=e.mono?(e.mono+' · '+e.tipo):e.tipo;
  return (b+'. '+e.pres+'. Venta mayorista para farmacias e instituciones de salud — Droguería EyG, Rosario.').replace(/\s+/g,' ').trim();
}

const GTAG=`<script async src="https://www.googletagmanager.com/gtag/js?id=AW-600728287"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','AW-600728287');gtag('config','G-4WQRZ32R4B');</script>`;

const CSS=`*{box-sizing:border-box}body{margin:0;font-family:'Archivo','Helvetica Neue',Arial,sans-serif;color:#0E1F1D;background:#FBFCFB;-webkit-font-smoothing:antialiased}
a{color:inherit}img{max-width:100%;display:block}
.wrap{max-width:1040px;margin:0 auto;padding:0 20px}
.top{background:#06413E;color:#fff}.top .wrap{display:flex;align-items:center;justify-content:space-between;height:60px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff;font-weight:800;letter-spacing:-.2px;font-size:16px}
.brand .mono{font-family:Georgia,serif;font-size:22px;line-height:1}.brand .mono .y{color:#7FD4CD}
.btn{display:inline-block;background:#048782;color:#fff;text-decoration:none;font-weight:700;font-size:13.5px;padding:9px 16px;border-radius:999px;transition:background .15s}
.btn:hover{background:#03b0a8}.btn.ghost{background:transparent;border:1.5px solid rgba(255,255,255,.35)}.btn.ghost:hover{background:rgba(255,255,255,.12)}
.bc{font-size:12.5px;color:#5F716E;padding:16px 0 4px}.bc a{text-decoration:none;color:#04635F;font-weight:600}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin:10px 0 30px;align-items:start}
.ph{background:#F4F9F8;border:1px solid #E4EEEB;border-radius:18px;padding:22px;display:flex;align-items:center;justify-content:center;min-height:320px;position:relative}
.ph img{max-height:360px;object-fit:contain;mix-blend-mode:multiply}
.chip{display:inline-block;background:#E2F1EF;color:#04635F;font-weight:700;font-size:11.5px;letter-spacing:.3px;text-transform:uppercase;padding:5px 11px;border-radius:999px}
.soldout{display:inline-block;background:#FBE9E7;color:#B23A2E;font-weight:700;font-size:11.5px;letter-spacing:.3px;text-transform:uppercase;padding:5px 11px;border-radius:999px;margin-left:6px}
h1{font-size:26px;line-height:1.2;margin:12px 0 6px;letter-spacing:-.4px;color:#06413E}
.sub{color:#5F716E;font-size:14.5px;margin:0 0 16px}
.spec{list-style:none;padding:0;margin:0 0 18px;border-top:1px solid #EEF3F2}
.spec li{display:flex;gap:14px;padding:10px 2px;border-bottom:1px solid #EEF3F2;font-size:14px}
.spec .k{color:#5F716E;min-width:118px;font-weight:600}.spec .v{color:#0E1F1D;font-weight:600}
.cta{background:#F4F9F8;border:1px solid #DCEBE8;border-radius:16px;padding:18px 20px;margin:6px 0 16px}
.cta .t{font-weight:800;color:#06413E;font-size:16px;margin-bottom:3px}.cta .d{color:#5F716E;font-size:13px;margin-bottom:13px}
.cta .row{display:flex;flex-wrap:wrap;gap:10px}
.wa{display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;text-decoration:none;font-weight:700;font-size:13.5px;padding:10px 17px;border-radius:999px}.wa svg{width:16px;height:16px;fill:#fff}
.note{font-size:12px;color:#8698A0;line-height:1.6;margin:2px 0 0}
.footer{background:#06413E;color:#cfe0dd;margin-top:20px;padding:34px 0}.footer .wrap{display:flex;flex-wrap:wrap;gap:24px;justify-content:space-between;font-size:13.5px;line-height:1.7}
.footer a{color:#fff;text-decoration:none}.footer h4{color:#fff;font-size:13px;text-transform:uppercase;letter-spacing:.4px;margin:0 0 8px}
.rel{margin:8px 0 34px}.rel h3{font-size:15px;color:#06413E;margin:0 0 12px}
.rel .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.rc{background:#fff;border:1px solid #E4EEEB;border-radius:14px;padding:12px;text-decoration:none;color:#0E1F1D;transition:box-shadow .15s,transform .15s;position:relative}
.rc:hover{box-shadow:0 10px 24px rgba(6,65,62,.10);transform:translateY(-2px)}
.rc .ri{background:#F4F9F8;border-radius:9px;height:96px;display:flex;align-items:center;justify-content:center;margin-bottom:9px}.rc .ri img{max-height:82px;object-fit:contain;mix-blend-mode:multiply}
.rc .rn{font-size:12.5px;font-weight:700;line-height:1.3;color:#06413E}.rc.off{opacity:.62}
.rc .tag{position:absolute;top:8px;right:8px;background:#FBE9E7;color:#B23A2E;font-size:9.5px;font-weight:700;text-transform:uppercase;padding:3px 7px;border-radius:999px}
@media(max-width:760px){.grid{grid-template-columns:1fr}.rel .cards{grid-template-columns:1fr 1fr}.top .btn{display:none}h1{font-size:22px}}`;

const WAICON='<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.4-1.1-2.7 0-1.3.7-1.9.9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.1.2-.2.3-.3.5l-.5.5c-.2.2-.3.3-.1.6.2.3.9 1.4 1.9 2.3 1.3 1.1 2.3 1.5 2.6 1.6.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.7.9.3.1.4.2.5.3.1.2.1.7-.1 1.2z"></path></svg>';
const header=()=>`<div class="top"><div class="wrap"><a class="brand" href="/"><span class="mono">E<span class="y">y</span>G</span> Droguería EyG</a><a class="btn ghost" href="${LOGIN}">Ingresar a la tienda</a></div></div>`;
const footer=()=>`<div class="footer"><div class="wrap">
<div><h4>Droguería EyG</h4>El respaldo detrás de la salud.<br>Distribución mayorista para farmacias e instituciones.<br>Rosario, Santa Fe · desde 2019.</div>
<div><h4>Contacto</h4>Av. San Martín 3035, Rosario<br>WhatsApp: <a href="${WA}">341 280-9081</a><br><a href="mailto:contacto@drogueriaeyg.com.ar">contacto@drogueriaeyg.com.ar</a></div>
<div><h4>Accesos</h4><a href="/">Inicio</a><br><a href="/productos/">Productos</a><br><a href="${LOGIN}">Portal mayorista</a></div>
</div></div>`;

function productPage(e,code,imgfn,hasStock,rel){
  const url=BASE+'/productos/'+e.s+'/', img=BASE+'/productos/img/'+imgfn, desc=metaDesc(e);
  const spec=[]; if(e.mono)spec.push(['Monodroga',e.mono]);
  spec.push(['Tipo',e.tipo]); spec.push(['Presentación',e.pres]); spec.push(['Marca / Fabricante',e.fab]);
  spec.push(['Disponibilidad', hasStock?'En stock':'Sin stock por el momento']); spec.push(['Código EyG',code]);
  const ctrlNote=e.ctrl?'<p class="note"><strong>Medicamento sujeto a control especial.</strong> Su comercialización se realiza conforme a la normativa vigente, exclusivamente a instituciones y profesionales habilitados.</p>':'';
  const jsonld={"@context":"https://schema.org","@type":"Product","name":e.t,"image":[img],"sku":code,"category":e.cat,"brand":{"@type":"Brand","name":e.fab},"description":desc,"manufacturer":{"@type":"Organization","name":e.fab}};
  const bread={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":BASE+"/"},{"@type":"ListItem","position":2,"name":"Productos","item":BASE+"/productos/"},{"@type":"ListItem","position":3,"name":e.t,"item":url}]};
  const relcards=rel.map(r=>`<a class="rc${r.hasStock?'':' off'}" href="/productos/${r.s}/">${r.hasStock?'':'<span class="tag">Sin stock</span>'}<div class="ri"><img src="/productos/img/${r.imgfn}" alt="${esc(r.t)}" loading="lazy"></div><div class="rn">${esc(r.t)}</div></a>`).join('');
  return `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(e.t)} | Droguería EyG</title>
<meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#06413E">
<meta property="og:type" content="product"><meta property="og:site_name" content="Droguería EyG">
<meta property="og:title" content="${esc(e.t)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${img}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
${GTAG}
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<script type="application/ld+json">${JSON.stringify(bread)}</script>
<style>${CSS}</style></head><body>
${header()}
<div class="wrap">
<div class="bc"><a href="/">Inicio</a> › <a href="/productos/">Productos</a> › ${esc(e.cat)}</div>
<div class="grid">
<div class="ph"><img src="${img}" alt="${esc(e.t)}" width="360" height="360"></div>
<div>
<span class="chip">${esc(e.cat)}</span>${hasStock?'':'<span class="soldout">Sin stock por el momento</span>'}
<h1>${esc(e.t)}</h1>
<p class="sub">${esc(e.mono?e.mono+' · ':'')}${esc(e.tipo)}</p>
<ul class="spec">${spec.map(([k,v])=>`<li><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></li>`).join('')}</ul>
<div class="cta">
<div class="t">Precio exclusivo para clientes</div>
<div class="d">${hasStock?'Los precios mayoristas se muestran dentro del portal. Iniciá sesión o solicitá tu acceso.':'Producto temporalmente sin stock. Consultá reposición o dejanos tu contacto.'}</div>
<div class="row"><a class="btn" href="${LOGIN}">Ver precio · Iniciar sesión</a><a class="wa" href="${WA}" target="_blank" rel="noopener">${WAICON}${hasStock?'Solicitar acceso':'Consultar reposición'}</a></div>
</div>
<p class="note">Producto de venta exclusiva a farmacias, sanatorios, clínicas e instituciones de salud habilitadas. La información publicada tiene fines comerciales y no reemplaza la indicación ni el asesoramiento profesional.</p>
${ctrlNote}
</div></div>
<div class="rel"><h3>Otros productos de Droguería EyG</h3><div class="cards">${relcards}</div></div>
</div>
${footer()}
</body></html>`;
}

function indexPage(withStock,noStock){
  const url=BASE+'/productos/';
  const desc='Catálogo mayorista de Droguería EyG: medicamentos, ampollas, comprimidos, jeringas, barbijos y descartables para farmacias e instituciones de salud en Rosario. Solicitá acceso para ver precios.';
  const card=x=>`<a class="rc${x.hasStock?'':' off'}" href="/productos/${x.s}/">${x.hasStock?'':'<span class="tag">Sin stock</span>'}<div class="ri"><img src="/productos/img/${x.imgfn}" alt="${esc(x.t)}" loading="lazy"></div><div class="rn">${esc(x.t)}</div><div style="font-size:11px;color:#5F716E;margin-top:4px">${esc(x.cat)}</div></a>`;
  const jsonld={"@context":"https://schema.org","@type":"CollectionPage","name":"Productos — Droguería EyG","url":url,"description":desc};
  const sinBloque = noStock.length? `<div class="rel"><h3 style="margin-top:26px">Temporalmente sin stock</h3><div class="cards">${noStock.map(card).join('')}</div></div>`:'';
  return `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Productos mayoristas | Droguería EyG</title>
<meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><meta name="theme-color" content="#06413E">
<meta property="og:type" content="website"><meta property="og:title" content="Productos mayoristas | Droguería EyG"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${BASE}/og.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
${GTAG}
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}.hd{padding:26px 0 6px}.hd h1{margin:0 0 8px}.hd p{color:#5F716E;font-size:15px;max-width:640px;margin:0}</style></head><body>
${header()}
<div class="wrap">
<div class="bc"><a href="/">Inicio</a> › Productos</div>
<div class="hd"><h1>Productos mayoristas</h1><p>Una selección de lo más pedido por farmacias e instituciones. Para ver precios y hacer pedidos, ingresá al portal o solicitá tu acceso.</p></div>
<div class="rel" style="margin-top:18px"><div class="cards">${withStock.map(card).join('')}</div></div>
${sinBloque}
</div>
${footer()}
</body></html>`;
}

// ---- 1) ranking de más vendidos (publicados) ----
const g=await rpc('sale.order.line','read_group',
  [[['state','in',['sale','done']],['order_id.date_order','>=',SINCE],['product_id.is_published','=',true]],
   ['product_uom_qty:sum'],['product_id']],
  {context:{lang:'es_AR'}, limit:TOPN+15, orderby:'product_uom_qty desc'});
const ranked=g.map(r=>Array.isArray(r.product_id)?r.product_id[0]:r.product_id).slice(0,TOPN);

// ---- 2) datos + stock de esos productos ----
const rows=await rpc('product.product','read',[ranked,['name','default_code','categ_id','qty_available','is_published']],{context:{lang:'es_AR'}});
const byId={}; rows.forEach(r=>byId[r.id]=r);

// ---- 3) construir items ----
const items=[];
for(const id of ranked){
  const r=byId[id]; if(!r||!r.is_published) continue;
  const code=String(r.default_code||id);
  const categ=Array.isArray(r.categ_id)?r.categ_id[1]:'';
  const e = COPY[code] ? {...COPY[code]} : autoEnrich(r.name,categ,code);
  const imgfn=await dlImg(id,code); if(!imgfn) continue;
  items.push({...e,code,id,imgfn,hasStock:(r.qty_available||0)>0});
}

// ---- 4) render fichas (nunca borra: refresca las del top y deja vivas las viejas) ----
for(let i=0;i<items.length;i++){
  const e=items[i];
  const rel=[]; let j=(i+1)%items.length; while(rel.length<Math.min(4,items.length-1)){ if(j!==i)rel.push(items[j]); j=(j+1)%items.length; }
  fs.mkdirSync(OUT+'/'+e.s,{recursive:true});
  fs.writeFileSync(OUT+'/'+e.s+'/index.html',productPage(e,e.code,e.imgfn,e.hasStock,rel));
}

// ---- 5) índice ----
fs.writeFileSync(OUT+'/index.html',indexPage(items.filter(x=>x.hasStock),items.filter(x=>!x.hasStock)));

// ---- 6) sitemap: TODAS las fichas existentes (URLs estables) ----
const dirs=fs.readdirSync(OUT,{withFileTypes:true}).filter(d=>d.isDirectory()&&d.name!=='img'&&fs.existsSync(OUT+'/'+d.name+'/index.html')).map(d=>d.name).sort();
const today=new Date().toISOString().slice(0,10);
const urls=[{loc:BASE+'/',pr:'1.0',cf:'monthly'},{loc:BASE+'/productos/',pr:'0.9',cf:'daily'}];
for(const d of dirs)urls.push({loc:BASE+'/productos/'+d+'/',pr:'0.8',cf:'weekly'});
const sm=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`+urls.map(u=>`  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.cf}</changefreq>\n    <priority>${u.pr}</priority>\n  </url>`).join('\n')+`\n</urlset>\n`;
fs.writeFileSync('sitemap.xml',sm);

console.log('vidriera OK — top:'+items.length+' | con stock:'+items.filter(x=>x.hasStock).length+' | sin stock:'+items.filter(x=>!x.hasStock).length+' | sitemap urls:'+urls.length);
