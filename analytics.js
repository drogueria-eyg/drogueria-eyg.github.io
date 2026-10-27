/* Existing Google Ads/GA4 identifiers retained from the previously published site. */
(()=>{
  if(!['www.drogueriaeyg.com.ar','drogueriaeyg.com.ar'].includes(location.hostname))return;
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer.push(arguments);};
  const tag=document.createElement('script');tag.async=true;tag.src='https://www.googletagmanager.com/gtag/js?id=AW-600728287';document.head.append(tag);
  gtag('js',new Date());gtag('config','AW-600728287');gtag('config','G-4WQRZ32R4B');
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');if(!link)return;
    const href=link.getAttribute('href')||'';
    if(href.includes('wa.me/')||href.startsWith('tel:')){
      gtag('event','generate_lead',{method:href.startsWith('tel:')?'telefono':'whatsapp'});
      gtag('event','conversion',{send_to:'AW-600728287/qI3lCNWO1OUcEN_FuZ4C'});
    }else if(href.includes('drogueriaeyg.odoo.com'))gtag('event','portal_click');
  },true);
})();
