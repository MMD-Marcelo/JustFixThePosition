// -----------------------------------
// INIT
// -----------------------------------
loadLs();initInspectorSections();renderTabs();applyUI();ensureBasicComponents();
window.addEventListener('resize',()=>{fitCanvas();drawMM();});
window.addEventListener('load',()=>{
  ensureBasicComponents();
  [0,50,150,350,800].forEach(ms=>setTimeout(ensureBasicComponents,ms));
  const q=document.getElementById('basic-component-search');if(q){q.addEventListener('focus',ensureBasicComponents);q.addEventListener('pointerdown',ensureBasicComponents);}
  const panel=document.querySelector('.basic-components-panel');if(panel)panel.addEventListener('pointerenter',ensureBasicComponents);
  const list=document.getElementById('basic-components-list');if(list)new MutationObserver(()=>{if(!list.children.length)setTimeout(ensureBasicComponents,0);}).observe(list,{childList:true});
});





