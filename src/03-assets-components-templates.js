// -----------------------------------
// FONTS
// -----------------------------------
let importedFonts=[];
function triggerFontImport(){document.getElementById('fi-font').click();}
function importFonts(e){
  const s=st();if(!s)return;
  [...e.target.files].forEach(file=>{
    const r=new FileReader();
    r.onload=ev=>{
      const name=file.name.replace(/\.[^.]+$/,'');
      const fontFace=new FontFace(name,`url(${ev.target.result})`);
      fontFace.load().then(ff=>{
        document.fonts.add(ff);
        if(!s.fonts)s.fonts=[];
        const existing=s.fonts.find(f=>f.name===name);
        if(!existing){s.fonts.push({name,src:ev.target.result,fileName:file.name});}
        importedFonts=s.fonts.map(f=>f.name);
        rebuildFontOptions();saveLs();toast('Fonte importada: '+name);
      }).catch(()=>toast('Erro ao carregar fonte'));
    };
    r.readAsDataURL(file);
  });
  e.target.value='';
}
function applyImportedFonts(){
  const s=st();if(!s||!s.fonts)return;
  s.fonts.forEach(f=>{
    const ff=new FontFace(f.name,`url(${f.src})`);
    ff.load().then(loaded=>{document.fonts.add(loaded);}).catch(()=>{});
  });
  importedFonts=(s.fonts||[]).map(f=>f.name);
  rebuildFontOptions();
}
function rebuildFontOptions(){
  const sel=document.getElementById('pfont');if(!sel)return;
  const cur=sel.value;
  sel.innerHTML='<option>system-ui</option><option>serif</option><option>monospace</option><option>Arial</option><option>Georgia</option><option>Verdana</option>';
  importedFonts.forEach(name=>{const o=document.createElement('option');o.value=name;o.textContent=name+' ?';sel.appendChild(o);});
  if(cur)sel.value=cur;
}

// -----------------------------------
// IMPORT
// -----------------------------------
function triggerImport(){document.getElementById('fi').click();}
function importFiles(e){const s=st();if(!s)return;pushUndo();[...e.target.files].forEach(file=>{const ext=file.name.split('.').pop().toLowerCase();if(ext==='obj'){const r=new FileReader();r.onload=ev=>{const el=mkEl(file.name.replace(/\.[^.]+$/,''),file.name,null,'obj');el.objText=ev.target.result;finishImport(el);};r.readAsText(file);return;}const r=new FileReader();r.onload=ev=>{finishImport(mkEl(file.name.replace(/\.[^.]+$/,''),file.name,ev.target.result,file.type==='image/svg+xml'?'svg':ext==='gif'?'gif':'img'));};r.readAsDataURL(file);});e.target.value='';}
function finishImport(el){const s=st();if(!s)return;s.elements.push(el);renderEl(el);selOne(el.id);updateLayers();renderAssets();buildTL();cv().classList.add('has-el');drawMM();saveLs();}
function renderAssets(){
  const list=document.getElementById('assets-list');if(!list)return;
  const s=st();if(!s){list.innerHTML='';return;}
  const assets=s.elements.filter(el=>el.fileName||['text','note','shape','brush'].includes(el.type));
  if(!assets.length){list.innerHTML='<div class="empty-mini">Nenhum asset</div>';return;}
  list.innerHTML='';
  assets.forEach(el=>{
    const row=document.createElement('div');row.className='asset-item';row.title=el.fileName||el.name;
    const badge=el.type==='obj'?'3D':el.type==='gif'?'GIF':el.type==='svg'?'SVG':el.type==='text'?'TXT':el.type==='note'?'NTE':el.type==='shape'?'SHP':el.type==='brush'?'BRU':'IMG';
    row.innerHTML=`<span class="lbadge">${badge}</span><span class="lname">${escH(el.fileName||el.name)}</span>`;
    row.onclick=()=>selOne(el.id);
    list.appendChild(row);
  });
}
function renderBasicComponents(){
  const list=document.getElementById('basic-components-list');if(!list)return;
  list.innerHTML='';
  const q=(document.getElementById('basic-component-search')?.value||'').trim().toLowerCase();
  const hit=comp=>q&&[comp.kind,comp.label,comp.badge].join(' ').toLowerCase().includes(q);
  const items=q?[...BASIC_COMPONENTS].sort((a,b)=>(hit(b)?1:0)-(hit(a)?1:0)||a.label.localeCompare(b.label)):BASIC_COMPONENTS;
  items.forEach(comp=>{
    const row=document.createElement('div');row.className='asset-item preset-item'+(hit(comp)?' search-hit':'');row.draggable=true;row.title='Arraste para o canvas';
    row.innerHTML=`<span class="lbadge">${comp.badge}</span><span class="lname">${escH(comp.label)}</span>`;
    row.onclick=()=>insertBasicComponent(comp.kind);
    row.addEventListener('dragstart',e=>{e.dataTransfer.setData('application/layout-builder-component',comp.kind);e.dataTransfer.effectAllowed='copy';});
    list.appendChild(row);
  });
  list.scrollTop=0;
}
function ensureBasicComponents(){
  const list=document.getElementById('basic-components-list');if(!list)return;
  if(list.children.length<BASIC_COMPONENTS.length)renderBasicComponents();
}
function insertBasicComponent(kind,x=null,y=null){
  const s=st();if(!s)return;pushUndo();
  const gx=x??Math.max(24,Math.round((cW()-360)/2)),gy=y??Math.max(24,Math.round((cH()-220)/2));
  const group='component-'+kind+'-'+Date.now();
  const made=[];
  const add=(name,dx,dy,w,h,text,role='',variant='',style={})=>{const el=mkEl(name,'',null,'shape');el.x=snp(gx+dx);el.y=snp(gy+dy);el.w=w;el.h=h;el.textContent=text;el.group=group;el.componentName=kind;el.semanticRole=role;el.shapeVariant=variant||role;el.shapeStyle=style;el.fontSize=style.fontSize||14;el.fontWeight=style.fontWeight||'500';el.fontColor=style.color||'#111111';el.fontFamily=style.fontFamily||'system-ui';el.z=100+s.elements.length;el.desc='Preset component: '+kind;s.elements.push(el);renderEl(el);made.push(el.id);return el;};
  if(kind==='button'){add('Button',0,0,168,44,'Button','button','button',{background:'#111111',color:'#ffffff'});}
  else if(kind==='input'){add('Input label',0,0,240,22,'Label','text','',{background:'transparent',border:'0'});add('Input',0,28,280,44,'Placeholder','input','input',{background:'#ffffff'});}
  else if(kind==='card'){add('Card',0,0,320,200,'','card','card',{background:'#ffffff'});add('Card title',20,18,220,34,'Title','text','',{background:'transparent',border:'0',fontSize:18,fontWeight:'700'});add('Card body',20,62,260,82,'Supporting content','text','',{background:'transparent',border:'0',color:'#555555'});add('Card action',20,154,120,32,'Action','button','button',{background:'#111111',color:'#ffffff'});}
  else if(kind==='navbar'){add('Navbar',0,0,720,64,'Logo | Link | Link | Link | CTA','nav','nav',{background:'#ffffff'});}
  else if(kind==='hero'){add('Hero copy',0,0,420,260,'Headline\nSupporting copy\nCTA','hero','',{background:'#ffffff',fontSize:28,fontWeight:'700'});add('Hero media',456,0,360,260,'Image / media','media','media');}
  else if(kind==='modal'){add('Modal panel',0,0,360,240,'Modal title\n\nContent area','modal','modal',{background:'#ffffff',fontSize:18,fontWeight:'700'});add('Modal close',324,12,24,24,'x','button','button',{background:'#f3f3f3',color:'#111111'});add('Modal action',220,190,112,34,'Confirm','button','button',{background:'#111111',color:'#ffffff'});}
  else if(kind==='table'){add('Table',0,0,520,260,'Header A | Header B | Header C\nRow 1 | Active | Today\nRow 2 | Draft | Yesterday\nRow 3 | Done | Monday','table','table',{background:'#ffffff'});}
  else if(kind==='dashboard-card'){add('Metric card',0,0,240,128,'Metric\n12,480\n+8.2%','card','metric',{background:'#ffffff'});}
  else if(COMPONENT_PRESETS[kind]){
    const p=COMPONENT_PRESETS[kind];
    add(BASIC_COMPONENTS.find(c=>c.kind===kind)?.label||kind,0,0,p.w,p.h,p.text,p.role,kind,{background:'#ffffff',fontSize:p.fontSize||14,fontWeight:p.fontWeight||'500',color:p.color||'#111111'});
  }
  sel=made;cv().classList.add('has-el');updateSelVisuals();updateLayers();renderAssets();buildTL();saveLs();toast('Componente: '+kind);
}

// -----------------------------------
// mkEl / createText / createNote
// -----------------------------------
function inferName(name,type){const n=(name||type||'element').replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ').trim();const low=n.toLowerCase();if(type==='text')return'Text';if(type==='note')return'Note';if(low.includes('hero'))return'Hero Image';if(low.includes('logo'))return'Logo';if(low.includes('icon'))return'Icon';if(low.includes('button')||low.includes('btn'))return'Button';if(low.includes('bg')||low.includes('background'))return'Background';return n.replace(/\b\w/g,c=>c.toUpperCase())||'Element';}
function mkEl(name,fileName,src,type){const s=st();return{id:'e'+(s?s.nextId++:Date.now()),name:inferName(name,type),fileName,src,type,x:snp(20+(Math.random()*60|0)),y:snp(20+(Math.random()*60|0)),w:200,h:150,z:100+(s?s.elements.length:0),...mkElDefaults(),semanticRole:type==='text'?'text':type==='note'?'note':'',frameOut:(s?s.tlTotal:120)-1};}
function mkText(x,y){const s=st();if(!s)return;pushUndo();const el=mkEl('Texto','',null,'text');el.x=x;el.y=y;el.w=200;el.h=50;el.textContent='Texto';finishImport(el);}
function mkNote(x,y){const s=st();if(!s)return;pushUndo();const el=mkEl('Nota','',null,'note');el.x=x;el.y=y;el.w=180;el.h=80;el.textContent='Nota';finishImport(el);}
const TEMPLATE_PRESETS={
  'desktop-app':{label:'Desktop app',screen:'desktop',w:1920,h:1080,bg:'#f4f6f6',items:[
    ['Application topbar','topbar.png',100,34,1720,72,'application-toolbar','AppTopbar','Main app toolbar with logo, menu commands and export actions.'],
    ['Tool rail','tool-rail.png',40,110,72,900,'tool-palette','ToolRail','Vertical Photoshop-style tool rail.'],
    ['Project sidebar','sidebar.png',130,110,260,900,'navigation-panel','ProjectSidebar','Screens, layers, assets and components navigation.'],
    ['Main canvas panel','canvas-panel.png',430,190,980,640,'workspace','WorkspaceCanvas','Central canvas/artboard editing area.'],
    ['Inspector panel','inspector.png',1460,190,330,640,'properties-panel','InspectorPanel','Right panel for layout, visual and AI metadata.'],
    ['Timeline strip','timeline.png',430,860,980,150,'timeline','Timeline','Timeline strip with frames and keyframes.']
  ]},
  'landing-page':{label:'Landing page',screen:'desktop',w:1920,h:1400,bg:'#f4f6f6',items:[
    ['Navigation header','nav.png',120,40,1680,88,'navigation','Header','Top navigation with JUST logo, links and primary CTA.'],
    ['Hero copy and CTA','hero.png',120,190,720,420,'hero','HeroSection','Hero copy, supporting text and two CTA buttons.'],
    ['Product preview','product-preview.png',980,170,760,520,'product-preview','ProductPreview','Product mockup showing canvas, JSON and prompt workflow.'],
    ['Feature grid','feature-grid.png',120,760,760,260,'feature-list','FeatureGrid','Three feature cards explaining the product value.'],
    ['Signup form','signup-form.png',1160,760,430,360,'form','SignupForm','Lead capture form with fields and submit action.'],
    ['Footer','footer.png',120,1240,1680,78,'footer','Footer','Footer with documentation and repository links.']
  ]},
  'mobile-app':{label:'Mobile app',screen:'mobile',w:393,h:852,bg:'#f4f6f6',items:[
    ['Mobile header','status-header.png',0,0,393,92,'header','MobileHeader','Mobile app header with logo and profile action.'],
    ['Hero card','hero-card.png',22,120,349,238,'hero','MobileHeroCard','Main mobile CTA card.'],
    ['Activity card','activity-card.png',22,386,349,308,'list','RecentLayoutsCard','Recent layouts list.'],
    ['Bottom navigation','bottom-nav.png',0,772,393,80,'navigation','BottomNavigation','Mobile bottom navigation.']
  ]},
  dashboard:{label:'Dashboard',screen:'desktop',w:1920,h:1080,bg:'#f4f6f6',items:[
    ['Dashboard sidebar','sidebar.png',0,0,280,1080,'navigation','DashboardSidebar','Primary dashboard navigation.'],
    ['Dashboard topbar','topbar.png',320,36,1480,72,'header','DashboardTopbar','Dashboard title and search area.'],
    ['KPI row','kpi-row.png',320,148,1480,150,'metrics','KpiRow','Four KPI cards.'],
    ['Chart panel','chart-panel.png',320,338,900,470,'chart','ChartPanel','Main analytics chart panel.'],
    ['Projects table','table-panel.png',1260,338,540,470,'table','ProjectsTable','Recent projects table.'],
    ['Activity panel','activity-panel.png',320,846,1480,150,'status','ValidationPanel','Schema validation status panel.']
  ]}
};
function openTemplateModal(){
  const options=Object.entries(TEMPLATE_PRESETS).map(([id,t])=>`<option value="${id}">${escH(t.label)}</option>`).join('');
  openM('Templates',`<label>Preset</label><select id="tmpl">${options}</select>`,()=>applyTemplate(document.getElementById('tmpl').value));
}
function applyTemplate(kind){
  const preset=TEMPLATE_PRESETS[kind];const s=st();if(!s||!preset)return;
  pushUndo();s.elements=[];document.querySelectorAll('.el,.onion,.gbox').forEach(d=>d.remove());
  setScreen(preset.screen);
  s.screenW=preset.w;s.screenH=preset.h;
  s.screens=[{id:1,name:preset.label,type:preset.h>s.screenH?'page':'page',w:preset.w,h:preset.h}];
  applyCS();buildSdivs();buildScrPanel();document.getElementById('sz').textContent=cW()+' x '+cH();
  const bg=mkEl(preset.label+' background','',null,'shape');
  Object.assign(bg,{x:0,y:0,w:preset.w,h:preset.h,textContent:'',semanticRole:'background',componentName:'TemplateBackground',shapeVariant:'background',shapeStyle:{background:preset.bg,border:'0'},z:1,desc:'Template background color.'});
  s.elements.push(bg);renderEl(bg);
  preset.items.forEach((item,i)=>{
    const [name,file,x,y,w,h,role,component,desc]=item;
    const el=mkEl(name,file,`templates/${kind}/assets/${file}`,'img');
    Object.assign(el,{x,y,w,h,semanticRole:role,componentName:component,z:100+i,desc,visible:true,locked:false});
    el.constraints={x:x>preset.w*.55?'right':x<80?'left':'center',y:y>preset.h*.65?'bottom':'top'};
    el.states={normal:true,hover:false,active:false,disabled:false,loading:false,error:false};
    s.elements.push(el);renderEl(el);
  });
  cv().classList.add('has-el');sel=[];updateLayers();renderAssets();buildTL();saveLs();fitCanvas();toast('Template aplicado: '+preset.label);
}


