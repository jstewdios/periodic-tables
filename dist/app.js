import { elements, bySymbol } from './elements.js';
import { families, elementNotes, compounds, compoundById, MAX_ATOMS, atomCount, formulaText, matchCompound, suggestions, everyday, trails } from './chemistry.js';
import { enableAudio, playElement, playSequence, stopSequence } from './audio.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formula = text => escape(text).replace(/(\d+)/g,'<sub>$1</sub>');
const storageKey = 'periodic-tables.collection.v1';
const routes = ['table','workbench','everyday','trails','collection'];
function readCollection(){
  try {
    const saved=JSON.parse(localStorage.getItem(storageKey)??'{}');
    return {compounds:Array.isArray(saved.compounds)?[...new Set(saved.compounds.filter(id=>compoundById[id]))]:[],trails:Array.isArray(saved.trails)?[...new Set(saved.trails.filter(id=>trails.some(t=>t.id===id)))]:[]};
  }catch{return {compounds:[],trails:[]};}
}
const state = {route:routes.includes(location.hash.slice(1))?location.hash.slice(1):'table',selected:'O',mode:'families',family:null,sound:false,playing:false,row:2,atoms:{},collection:readCollection(),object:'leaf',trail:null,storageAvailable:true};
const modes = {
  families:{label:'Families',title:'What belongs together?',intro:'Follow a color. Notice a column. Find a family resemblance.',description:'Color groups elements by a conventional chemical category. Select a label below to trace a family.'},
  pull:{label:'Electron pull',title:'Where is the strongest pull?',intro:'Reveal how strongly an atom attracts shared electrons in a bond.',description:'Brighter means greater electronegativity on the Pauling scale. Hatched tiles have no value in this dataset; they do not mean zero.'},
  state:{label:'State of matter',title:'What is solid, liquid, or gas?',intro:'Look at the elements near room temperature. Can you spot the two liquids?',description:'States near room temperature and ordinary pressure. Bulk states of elements 104–118 are marked unknown rather than displaying predictions as measurements.'},
  number:{label:'Atomic number',title:'What changes, one proton at a time?',intro:'Read the table as a sequence. Every step adds one proton.',description:'Atomic number is the number of protons in the nucleus. The detached rows continue periods 6 and 7.'},
};
const stateColors={Solid:'#8faedf',Liquid:'#75dcc9',Gas:'#e4ba83',Unknown:'#8d95a8'};
function colorOf(element){
  if(state.mode==='pull')return element.electronegativity==null?'#818b9d':`hsl(${205-(element.electronegativity-.7)/3.3*125} 65% ${43+(element.electronegativity-.7)/3.3*30}%)`;
  if(state.mode==='number')return `hsl(${210-(element.number-1)/117*115} 60% ${42+(element.number-1)/117*30}%)`;
  if(state.mode==='state')return stateColors[element.state];
  return families[element.category].color;
}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),3200);}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state.collection));state.storageAvailable=true;}catch{state.storageAvailable=false;toast('Kept for this visit. This browser could not save the collection.');}updateCount();}
function updateCount(){$('#collection-count').textContent=state.collection.compounds.length+state.collection.trails.length;}
function go(route){if(state.route===route){render();return;}location.hash=route;}
function heading(kicker,title,description,aside=''){return `<div class="section-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${description}</p></div>${aside}</div>`;}
function badge(label){return `<span class="badge">${label}</span>`;}
function render(){
  const focused=document.activeElement?.id;
  document.querySelectorAll('[data-nav]').forEach(el=>{const active=el.dataset.nav===state.route;el.classList.toggle('active',active);active?el.setAttribute('aria-current','page'):el.removeAttribute('aria-current');});
  $('#main').innerHTML=({table:renderTable,workbench:renderWorkbench,everyday:renderEveryday,trails:renderTrails,collection:renderCollection})[state.route]();
  updateCount();
  if(focused && document.getElementById(focused))document.getElementById(focused).focus({preventScroll:true});
}

function renderTable(){
  const mode=modes[state.mode];
  return heading('01 / THE TABLE',mode.title,mode.intro,`<button id="sound-toggle" class="sound-button ${state.sound?'on':''}" data-action="sound" aria-pressed="${state.sound}"><span aria-hidden="true">${state.sound?'♫':'♪'}</span> Sound ${state.sound?'on':'off'}</button>`)+renderTrailBanner()+`
    <div class="table-toolbar"><div class="segmented" role="group" aria-label="View the table by">${Object.entries(modes).map(([id,m])=>`<button id="mode-${id}" data-action="mode" data-mode="${id}" aria-pressed="${state.mode===id}" class="${state.mode===id?'chosen':''}">${m.label}</button>`).join('')}</div><span class="table-hint">118 elements. Endless connections.</span></div>
    <div class="table-layout"><section class="table-surface" aria-label="Interactive periodic table"><div class="scroll-hint">Swipe or scroll the table to explore all columns.</div><div class="table-scroll" tabindex="0" role="region" aria-label="Periodic table, horizontally scrollable on small screens"><div class="periodic-grid">
      ${Array.from({length:18},(_,i)=>`<span class="group-label" style="grid-column:${i+1};grid-row:1" aria-label="Group ${i+1}">${i+1}</span>`).join('')}
      <div class="table-invitation"><span class="eyebrow">A SMALL INVITATION</span><h2>${state.mode==='pull'?'Follow the pull<br>from Li to F.':state.mode==='state'?'Two liquids.<br>Can you find them?':state.mode==='number'?'Every element starts<br>with a number.':'Same column.<br>Something in common.'}</h2><button class="text-button" data-action="start-trail" data-id="${state.mode==='pull'?'pull':'family'}">Follow a trail <span aria-hidden="true">↗</span></button></div>
      ${elements.map(elementTile).join('')}
      <span class="series-placeholder" style="grid-row:7;grid-column:3">57–71<span>↓</span></span><span class="series-placeholder" style="grid-row:8;grid-column:3">89–103<span>↓</span></span>
      <span class="series-label" style="grid-row:10;grid-column:1 / span 2">6 / Lanthanides</span><span class="series-label" style="grid-row:11;grid-column:1 / span 2">7 / Actinides</span>
    </div></div>${renderLegend()}<p class="chart-note">${mode.description}</p></section><aside id="element-detail" class="element-detail" aria-label="Selected element">${renderElementDetail()}</aside></div>
    <div class="table-bottom"><div><span class="eyebrow">TRY ANOTHER INSTRUMENT</span><h3>What could these elements become?</h3><p>Take a few atoms to the workbench. Change the counts. See what fits.</p></div><a class="primary-button" href="#workbench">Open the workbench <span aria-hidden="true">↗</span></a></div>`;
}
function elementTile(e){
  const secondary=state.mode==='pull'?(e.electronegativity??'—'):state.mode==='state'?e.state:e.name;
  const dim=state.family&&e.category!==state.family;
  return `<button id="element-${e.symbol}" class="element-tile ${state.selected===e.symbol?'selected':''} ${dim?'dimmed':''} ${state.mode==='pull'&&e.electronegativity==null?'unknown':''}" data-action="select-element" data-symbol="${e.symbol}" style="--element:${colorOf(e)};grid-column:${e.column};grid-row:${e.row+1}" aria-pressed="${state.selected===e.symbol}" aria-label="${e.number}. ${e.name}, ${e.symbol}. ${escape(e.category)}${e.predicted?', predicted category':''}${state.mode==='pull'?`, electronegativity ${e.electronegativity??'unavailable'}`:''}${state.mode==='state'?`, ${e.state}`:''}" title="${e.name}"><span class="atomic-number">${e.number}</span><strong>${e.symbol}</strong><span class="tile-caption">${secondary}</span></button>`;
}
function renderLegend(){
  if(state.mode==='families')return `<div class="family-legend" aria-label="Highlight an element family">${Object.entries(families).map(([id,f])=>`<button id="family-${id.replaceAll(' ','-')}" data-action="family" data-family="${id}" class="${state.family===id?'chosen':''}" aria-pressed="${state.family===id}"><i style="background:${f.color}" aria-hidden="true"></i>${f.label}</button>`).join('')}</div>${state.family?`<p class="family-explanation">${families[state.family].note} <button class="text-button" data-action="family" data-family="${state.family}">Show all</button></p>`:''}`;
  if(state.mode==='state')return `<div class="state-legend">${Object.entries(stateColors).map(([name,color])=>`<span><i style="background:${color}"></i>${name}</span>`).join('')}</div>`;
  return `<div class="scale-legend"><span>${state.mode==='pull'?'Lower · 0.7':'1 · Hydrogen'}</span><span class="scale-bar ${state.mode}"></span><span>${state.mode==='pull'?'Higher · 3.98':'118 · Oganesson'}</span></div>`;
}
function renderElementDetail(){
  const e=bySymbol[state.selected],color=families[e.category].color;
  const rscName=({Al:'aluminium',Cs:'caesium'})[e.symbol]??e.name.toLowerCase();
  return `<div class="detail-top"><span class="eyebrow">ELEMENT / ${String(e.number).padStart(3,'0')}</span><span class="category-dot" style="background:${color}" aria-hidden="true"></span></div><div class="element-specimen" style="--element:${color}"><span>${e.number}</span><strong>${e.symbol}</strong><span>${e.mass}</span></div><h2>${e.name}</h2><p class="detail-category">${families[e.category].label}${e.predicted?' · predicted':''}</p><p class="element-story">${elementNotes[e.symbol]??families[e.category].note}</p>
    <dl class="properties"><div><dt>Atomic number</dt><dd>${e.number} protons</dd></div><div><dt>Period / group</dt><dd>${e.period} / ${e.group??'inner series'}</dd></div><div><dt>Electron pull</dt><dd>${e.electronegativity??'Not listed'}${e.electronegativity!=null?' <small>Pauling</small>':''}</dd></div><div><dt>Room-temp. state</dt><dd>${e.state}</dd></div></dl>
    <details class="electron-details"><summary>Electron configuration</summary><p>${escape(e.configuration)||'Not listed'}</p><small>Neutral atom, ground state. Superscript counts are shown inline.</small></details>
    <button class="primary-button full-width" data-action="take-element" data-symbol="${e.symbol}">+ Add ${e.symbol} to workbench</button><a class="source-link" href="https://periodic-table.rsc.org/element/${e.number}/${rscName}" target="_blank" rel="noopener noreferrer">Explore ${e.name.toLowerCase()} at the RSC ↗</a>
    <div class="listen-panel"><div><span aria-hidden="true">♫</span><strong>Hear a pattern</strong></div><div class="listen-controls"><label class="sr-only" for="play-row">Period to play</label><select id="play-row">${[1,2,3,4,5,6,7].map(n=>`<option value="${n}" ${state.row===n?'selected':''}>Period ${n}</option>`).join('')}</select><button id="play-sequence" class="secondary-button" data-action="play-row">${state.playing?'■ Stop':'▷ Play'}</button></div><p>${state.mode==='pull'?'Higher electron pull → higher pitch. Missing values are silent.':state.mode==='number'?'More protons → higher pitch.':'Columns repeat pitches. Listen for a family resemblance.'} Designed sounds, not atomic recordings.</p></div>`;
}
function selectElement(symbol){
  if(!bySymbol[symbol])return;
  state.selected=symbol;
  if(state.sound)playElement(bySymbol[symbol],state.mode);
  recordTrail('select',symbol);
  document.querySelectorAll('.element-tile').forEach(el=>{const active=el.dataset.symbol===symbol;el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active));});
  if($('#element-detail'))$('#element-detail').innerHTML=renderElementDetail();
  updateTrailBanner();
}

function renderWorkbench(){
  const match=matchCompound(state.atoms),count=atomCount(state.atoms),near=suggestions(state.atoms);
  return heading('02 / COMPOUND WORKBENCH','A few atoms. New possibilities.','Add elements. Change the proportions. Explore the structures they can describe.',badge(`${compounds.length} compounds to explore`))+renderTrailBanner()+`
    <div class="workbench-layout"><section class="atom-shelf"><div class="panel-heading"><h2>Your elements</h2><span>Tap or drag to add</span></div><div class="atom-palette">${['H','O','C','N','Na','Cl','Ca','Si','Mg','Fe','K','S'].map(s=>`<button id="palette-${s}" draggable="true" data-action="add-atom" data-symbol="${s}" class="palette-tile" style="--element:${families[bySymbol[s].category].color}" aria-label="Add ${bySymbol[s].name}"><span>${bySymbol[s].number}</span><strong>${s}</strong><small>${bySymbol[s].name}</small></button>`).join('')}</div><a class="text-button" href="#table">Find another element on the table ↗</a><div class="shelf-invitation"><span class="eyebrow">START WITH A QUESTION</span><h3>What makes water, water?</h3><p>Try two hydrogens and one oxygen. Then add one more oxygen.</p><button class="secondary-button" data-action="start-trail" data-id="one-oxygen">Follow this trail ↗</button></div></section>
    <section id="drop-zone" class="bench-surface ${count?'has-atoms':''}" aria-label="Compound assembly workbench"><div class="bench-top"><span class="eyebrow">${match?(match.kind==='molecule'?'MOLECULAR MODEL':'COMPOSITION MODEL'):'YOUR COMPOSITION'}</span><button class="text-button" data-action="clear-atoms" ${count?'':'disabled'}>Clear</button></div>
      <div class="model-stage">${count?(match?compoundDiagram(match):compositionDiagram(state.atoms)):`<div class="empty-bench"><div class="empty-formula" aria-hidden="true"><span>H</span><b>+</b><span>O</span><b>?</b></div><h2>Bring something together.</h2><p>Add an element from the shelf.<br>There’s no timer. Follow your curiosity.</p><button class="secondary-button" data-action="add-atom" data-symbol="H">+ Begin with hydrogen</button></div>`}</div>
      ${count?`<div class="composition-title"><div class="large-formula">${formula(match?.formula??formulaText(state.atoms))}</div><span>${match?.modelNote??'Composition only · no bonding or stability implied'}</span></div>`:''}
      <div class="atom-controls" aria-label="Atoms in the workbench">${Object.entries(state.atoms).map(([s,n])=>`<div class="atom-counter" style="--element:${families[bySymbol[s].category].color}"><strong>${s}</strong><button id="minus-${s}" data-action="remove-atom" data-symbol="${s}" aria-label="Remove one ${bySymbol[s].name}">−</button><span aria-label="${n} atoms">${n}</span><button id="plus-${s}" data-action="add-atom" data-symbol="${s}" aria-label="Add one ${bySymbol[s].name}" ${count>=MAX_ATOMS?'disabled':''}>+</button></div>`).join('')}</div>
      <div class="bench-foot"><span>${count} / ${MAX_ATOMS} atoms</span><span>Models of matter. No reactions simulated.</span></div></section>
    <aside class="compound-detail" aria-label="Composition result" aria-live="polite">${match?renderCompoundDetail(match):`<span class="eyebrow">${count?'KEEP EXPLORING':'A LITTLE DIRECTION'}</span><h2>${count?'A question worth asking.':'What could you discover?'}</h2><p>${count?'This exact composition isn’t in our small collection. That doesn’t mean it is impossible. Counts alone cannot establish a substance’s identity, structure, or stability.':'Here are three starting points. Load one, then change something and notice the difference.'}</p><div class="suggestions">${near.length?near.map(c=>`<button data-action="load-compound" data-id="${c.id}"><strong>${formula(c.formula)}</strong><span>${c.name}<small>${Object.entries(c.atoms).map(([s,n])=>`${n} ${s}`).join(' · ')}</small></span><span aria-hidden="true">↗</span></button>`).join(''):'<p class="muted">Try H + O, Na + Cl, or Si + O to explore a supported composition.</p>'}</div><p class="small-note">${count?'Molecular matches use exact counts. Solid formulas use the listed simplest ratio.':'A formula records composition. Structure tells another part of the story.'}</p>`}</aside></div>
    <div class="workbench-note"><span aria-hidden="true">◇</span><p>Assembling atoms here matches a known composition. Making a real substance depends on bonding, energy, conditions, and much more.</p></div>`;
}
function atomColor(s){return ({H:'#edf2f8',O:'#ef939a',C:'#94b4d8',N:'#a6a3ed',Na:'#e8a2b2',Cl:'#dfd982',Si:'#71cab4',Ca:'#dfbd78',Mg:'#dfbd78',Fe:'#91b9e6',K:'#e8a2b2'})[s]??families[bySymbol[s].category].color;}
function atomNode(s,x,y,r=29){return `<g class="model-atom"><circle cx="${x}" cy="${y}" r="${r}" fill="${atomColor(s)}"/><circle cx="${x-7}" cy="${y-9}" r="${r*.28}" fill="white" opacity=".13"/><text x="${x}" y="${y+1}" text-anchor="middle" dominant-baseline="middle" fill="#15202d" font-size="${r*.65}" font-weight="650">${s}</text></g>`;}
function compoundDiagram(c){
  if(c.kind!=='molecule')return compositionDiagram(c.atoms,c.name);
  const bonds=c.bonds.map(([a,b,n])=>{const [,x1,y1]=c.nodes[a],[,x2,y2]=c.nodes[b],length=Math.hypot(x2-x1,y2-y1),dx=-(y2-y1)/length,dy=(x2-x1)/length;return Array.from({length:n},(_,i)=>{const offset=(i-(n-1)/2)*7;return `<line x1="${x1+dx*offset}" y1="${y1+dy*offset}" x2="${x2+dx*offset}" y2="${y2+dy*offset}" stroke="#9faaba" stroke-width="${n===1?8:4}" stroke-linecap="round"/>`;}).join('');}).join('');
  return `<svg class="compound-model" viewBox="0 0 360 240" role="img" aria-label="${escape(c.name)}: ${escape(c.modelNote)}"><title>${escape(c.name)} — ${escape(c.modelNote)}</title>${bonds}${c.nodes.map(([s,x,y])=>atomNode(s,x,y,s==='H'?23:33)).join('')}</svg>`;
}
function compositionDiagram(atoms,name='Unmatched composition'){
  const entries=Object.entries(atoms),columns=Math.min(4,entries.length),rows=Math.ceil(entries.length/4),height=Math.max(240,rows*140+40);
  return `<svg class="compound-model ratio-model" viewBox="0 0 400 ${height}" role="img" aria-label="${escape(name)}. Atom ratio: ${entries.map(([s,n])=>`${n} ${bySymbol[s].name}`).join(', ')}. No bonds drawn."><title>Atom counts only; no bonds or spatial arrangement implied</title>${entries.map(([s,n],i)=>{const x=400/(columns+1)*(i%4+1),y=rows===1?105:Math.floor(i/4)*140+75;return atomNode(s,x,y,30)+`<text x="${x}" y="${y+60}" fill="#d2dbea" text-anchor="middle" font-size="22">× ${n}</text>`;}).join('')}</svg>`;
}
function renderCompoundDetail(c){
  const kept=state.collection.compounds.includes(c.id);
  return `<div class="match-label"><span aria-hidden="true">✧</span> COMPOSITION MATCH</div><h2>${c.name}</h2><div class="compound-formula">${formula(c.formula)}</div><p>${c.description}</p><div class="found-in"><span class="eyebrow">OUT IN THE WORLD</span><p>${c.where}</p></div><button id="keep-${c.id}" class="primary-button full-width ${kept?'kept':''}" data-action="keep-compound" data-id="${c.id}" ${kept?'disabled':''}>${kept?'✓ In your collection':'+ Keep this discovery'}</button><a class="source-link" href="https://pubchem.ncbi.nlm.nih.gov/compound/${c.source}" target="_blank" rel="noopener noreferrer">Explore the compound at PubChem ↗</a><div class="next-question"><span class="eyebrow">NOTICE SOMETHING</span><h3>${c.question}</h3>${c.next?`<button class="text-button" data-action="load-compound" data-id="${c.next}">Compare with ${compoundById[c.next].name.toLowerCase()} ↗</button>`:'<p>Try changing the counts on your workbench.</p>'}</div>`;
}
function changeAtom(symbol,amount){
  if(!bySymbol[symbol])return;
  if(amount>0&&atomCount(state.atoms)>=MAX_ATOMS){toast(`The workbench holds ${MAX_ATOMS} atoms. Remove one to make room.`);return;}
  const next=(state.atoms[symbol]??0)+amount;
  if(next>0)state.atoms[symbol]=next;else delete state.atoms[symbol];
  const match=matchCompound(state.atoms);if(match)recordTrail('build',match.id);
  if(state.route==='workbench')render();
}
function loadCompound(id){const c=compoundById[id];if(!c)return;state.atoms={...c.atoms};recordTrail('build',c.id);go('workbench');}

function renderEveryday(){
  const object=everyday.find(o=>o.id===state.object);
  return heading('03 / EVERYDAY MATTER','The extraordinary in the ordinary.','Start with something familiar. Follow its ingredients back to the table.')+`
    <div class="object-tabs" role="group" aria-label="Explore an everyday object">${everyday.map((o,i)=>`<button id="object-${o.id}" data-action="object" data-id="${o.id}" class="${state.object===o.id?'chosen':''}" aria-pressed="${state.object===o.id}"><span>0${i+1}</span>${o.label}</button>`).join('')}</div>
    <section class="everyday-feature"><div class="everyday-story"><span class="eyebrow">LOOK CLOSER / ${object.label.toUpperCase()}</span><h2>${object.title}</h2><p>${object.lead}</p><div class="object-symbols">${object.symbols.map(s=>`<button style="--element:${families[bySymbol[s].category].color}" data-action="visit-element" data-symbol="${s}" aria-label="Explore ${bySymbol[s].name}">${s}</button>`).join('')}</div>${object.compound?`<button class="primary-button" data-action="load-compound" data-id="${object.compound}">Explore ${compoundById[object.compound].name.toLowerCase()} ↗</button>`:`<button class="primary-button" data-action="visit-element" data-symbol="Si">Meet silicon ↗</button>`}<a class="source-link" href="${object.source}" target="_blank" rel="noopener noreferrer">Read more about the chemistry ↗</a></div>
    <div class="matter-breakdown"><div class="eyebrow">A FEW OF THE CONNECTIONS</div>${object.parts.map(([s,title,description])=>`<button class="matter-part" data-action="visit-element" data-symbol="${s}"><span class="part-symbol" style="--element:${families[bySymbol[s].category].color}">${s}</span><span><strong>${title}</strong><span>${description}</span></span><span aria-hidden="true">↗</span></button>`).join('')}<p class="small-note">Examples, not a complete ingredient list. An element can appear in many chemical forms.</p></div></section>
    <div class="table-bottom"><div><span class="eyebrow">A QUESTION TO TAKE WITH YOU</span><h3>What else around you is hiding a periodic table?</h3><p>A guitar string. A ceramic cup. The air between them.</p></div><a href="#table" class="secondary-button">Back to the elements ↗</a></div>`;
}
function renderTrails(){
  return heading('04 / ELEMENT TRAILS','Follow a question.','Small, hands-on invitations. No scores, no clock, no wrong turns.')+renderTrailBanner()+`
    <div class="trails-grid">${trails.map((t,i)=>`<article class="trail-card" style="--trail:${t.accent}"><div class="trail-card-top"><span class="eyebrow">TRAIL / 0${i+1}</span><span>${state.collection.trails.includes(t.id)?'✓ Explored':'3 small steps'}</span></div><div class="trail-visual" aria-hidden="true">${t.id==='one-oxygen'?'<span>H₂O</span><span class="trail-operator">+ O</span><span>?</span>':t.id==='family'?'<span>Li</span><span>Na</span><span>K</span>':t.id==='pull'?'<span class="pull-step">Li</span><span class="pull-step">C</span><span class="pull-step">F</span>':'<span>CO₂</span><span class="trail-operator">/</span><span>SiO₂</span>'}</div><span class="eyebrow">${t.label}</span><h2>${t.question}</h2><p>${t.steps[0].text}</p><button class="secondary-button" data-action="start-trail" data-id="${t.id}">${state.trail?.id===t.id?'Continue exploring':'Follow this trail'} ↗</button></article>`).join('')}</div>`;
}
function activeStep(){const trail=trails.find(t=>t.id===state.trail?.id);return trail?{trail,step:trail.steps[state.trail.index]}:null;}
function stepComplete(){const active=activeStep();if(!active)return false;const {step}=active;return step.kind==='reflect'||step.kind==='build'&&state.trail.done||step.kind==='mode'&&state.mode===step.mode||step.kind==='select'&&step.symbols.every(s=>state.trail.visited.includes(s));}
function renderTrailBanner(){
  const active=activeStep();if(!active)return '';const {trail,step}=active,complete=stepComplete();
  return `<section class="trail-banner" id="trail-banner" aria-label="Current trail"><div class="trail-progress" aria-label="Step ${state.trail.index+1} of ${trail.steps.length}">${trail.steps.map((_,i)=>`<i class="${i<=state.trail.index?'filled':''}"></i>`).join('')}</div><div class="trail-instruction"><span class="eyebrow">${trail.label} / STEP ${state.trail.index+1} OF 3</span><h2>${step.title}</h2><p>${step.text}</p>${step.kind==='select'?`<div class="trail-checks">${step.symbols.map(s=>`<span class="${state.trail.visited.includes(s)?'done':''}">${state.trail.visited.includes(s)?'✓ ':''}${s}</span>`).join('')}</div>`:''}</div><div class="trail-actions">${complete?`<button class="primary-button" data-action="next-trail">${state.trail.index===2?'Finish trail ✓':'Next discovery →'}</button>`:`<button class="secondary-button" data-action="open-trail-step">${step.kind==='build'?'Open workbench':'Explore the table'} ↗</button>`}<button class="text-button" data-action="leave-trail">Leave trail</button></div></section>`;
}
function updateTrailBanner(){if($('#trail-banner'))$('#trail-banner').outerHTML=renderTrailBanner();}
function recordTrail(kind,value){
  const active=activeStep();if(!active)return;
  if(kind==='select'&&active.step.kind==='select'&&!state.trail.visited.includes(value))state.trail.visited.push(value);
  if(kind==='build'&&active.step.kind==='build'&&value===active.step.compound)state.trail.done=true;
}
function openTrailStep(){const active=activeStep();if(!active)return;go(active.step.kind==='build'?'workbench':active.step.kind==='reflect'?'trails':'table');}
function startTrail(id){
  if(!trails.some(t=>t.id===id))return;
  if(state.trail?.id!==id){state.trail={id,index:0,visited:[],done:false};if(id==='family'){state.mode='families';state.family=null;}}
  const active=activeStep();if(active.step.kind==='build'&&matchCompound(state.atoms)?.id===active.step.compound)state.trail.done=true;
  openTrailStep();
}
function nextTrail(){
  if(!stepComplete())return;
  const active=activeStep();
  if(state.trail.index===active.trail.steps.length-1){
    if(!state.collection.trails.includes(active.trail.id))state.collection.trails.push(active.trail.id);
    state.trail=null;persist();go('collection');toast('A question explored. Your trail is in the collection.');return;
  }
  state.trail.index++;state.trail.done=false;state.trail.visited=[];
  const next=activeStep();if(next.step.kind==='build'&&matchCompound(state.atoms)?.id===next.step.compound)state.trail.done=true;
  openTrailStep();
}
function renderCollection(){
  const saved=state.collection.compounds.map(id=>compoundById[id]);
  return heading('05 / YOUR COLLECTION','Little discoveries, kept.','A place for the compounds and questions you have explored.',badge(`${saved.length} / ${compounds.length} compounds`))+`
    <div class="collection-note"><span aria-hidden="true">▧</span> ${state.storageAvailable?'Kept in this browser, on this device. Clearing browser data removes this collection.':'Available for this visit. Persistent browser storage is unavailable.'}</div>
    ${!saved.length&&!state.collection.trails.length?`<div class="empty-collection"><span class="empty-collection-mark" aria-hidden="true">✧</span><h2>A collection begins with curiosity.</h2><p>Find a compound on the workbench and choose “Keep this discovery,” or follow a trail to its end.</p><a class="primary-button" href="#workbench">Make your first discovery ↗</a></div>`:''}
    <div class="collection-grid">${saved.map(c=>`<article class="discovery-card"><div class="discovery-card-top"><span class="eyebrow">${c.kind==='molecule'?'MOLECULE':c.kind==='network'?'NETWORK SOLID':'IONIC SOLID'}</span><button class="icon-button" data-action="forget-compound" data-id="${c.id}" aria-label="Remove ${c.name} from collection">×</button></div><div class="discovery-formula">${formula(c.formula)}</div><h2>${c.name}</h2><p>${c.question}</p><button class="text-button" data-action="load-compound" data-id="${c.id}">Explore again ↗</button></article>`).join('')}${state.collection.trails.map(id=>{const t=trails.find(t=>t.id===id);return `<article class="discovery-card trail-keepsake"><span class="eyebrow">TRAIL EXPLORED ✓</span><div class="discovery-formula" aria-hidden="true">?</div><h2>${t.label}</h2><p>${t.question}</p><button class="text-button" data-action="start-trail" data-id="${t.id}">Follow it again ↗</button></article>`;}).join('')}</div>
    ${saved.length||state.collection.trails.length?'<a href="#trails" class="secondary-button collection-more">Find another question ↗</a>':''}`;
}

$('#sources-content').innerHTML=`<p>Periodic Tables is a collection of learning instruments. Its models help you explore composition and patterns.</p><h3>Element data</h3><p>All 118 element records come from a bundled <a href="https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON" target="_blank" rel="noopener noreferrer">PubChem periodic-table dataset</a>, retrieved September 6, 2026. You can also explore the <a href="https://iupac.org/what-we-do/periodic-table-of-elements/" target="_blank" rel="noopener noreferrer">IUPAC periodic table</a> and the <a href="https://periodic-table.rsc.org/" target="_blank" rel="noopener noreferrer">Royal Society of Chemistry’s element guides</a>.</p><p>Categories follow the source’s conventional grouping, including its broad d-block category. Superheavy classifications may be predicted. Bulk states for elements 104–118 are shown as unknown. Missing electronegativity values stay missing. Element mass values reproduce the source and may represent an isotope where no standard atomic weight exists.</p><h3>Compounds and models</h3><p>The workbench recognizes ${compounds.length} curated compositions. Each result links to PubChem. Molecular diagrams show simplified connectivity; solid diagrams show ratios. Neither predicts reactions, structure from a formula alone, nor the existence of an unmatched composition. In particular, H₂O₂ is not reduced to HO.</p><h3>Sound</h3><p>Sound starts only when you turn it on or press Play. In Families and State views, columns map to repeated pitches; the detached series has an ascending sequence. In Electron pull, greater electronegativity makes a higher note and missing values are silent. In Atomic number, more protons make a higher note. Broad categories vary the timbre. These are designed sonifications, not measured sounds or spectra.</p><h3>Your collection</h3><p>Discoveries are saved only in this browser’s local storage. There are no app accounts, analytics scripts, or uploads in this experience. The site host handles ordinary page requests. External resource links take you to other websites.</p><p class="small-note">Made to ask better questions. Keep exploring.</p>`;

document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
  const {action,symbol,id}=button.dataset;
  switch(action){
    case 'select-element':selectElement(symbol);break;
    case 'visit-element':state.selected=symbol;recordTrail('select',symbol);go('table');break;
    case 'mode':stopSequence();state.playing=false;state.mode=button.dataset.mode;state.family=null;render();break;
    case 'family':state.family=state.family===button.dataset.family?null:button.dataset.family;render();break;
    case 'sound':
      if(state.sound){state.sound=false;state.playing=false;stopSequence();render();break;}
      try{await enableAudio();state.sound=true;playElement(bySymbol[state.selected],state.mode);render();}catch{toast('Sound could not start in this browser. The visual instruments are still available.');}break;
    case 'play-row':
      if(state.playing){stopSequence();state.playing=false;render();break;}
      state.sound=true;state.playing=true;render();
      try{await playSequence(elements.filter(e=>e.period===state.row),state.mode,e=>{document.querySelectorAll('.sounding').forEach(el=>el.classList.remove('sounding'));document.getElementById(`element-${e.symbol}`)?.classList.add('sounding');},()=>{state.playing=false;document.querySelectorAll('.sounding').forEach(el=>el.classList.remove('sounding'));if(state.route==='table')$('#element-detail').innerHTML=renderElementDetail();});}
      catch{state.sound=false;state.playing=false;render();toast('Sound could not start in this browser.');}break;
    case 'take-element':changeAtom(symbol,1);go('workbench');break;
    case 'add-atom':changeAtom(symbol,1);break;
    case 'remove-atom':changeAtom(symbol,-1);break;
    case 'clear-atoms':state.atoms={};render();break;
    case 'load-compound':loadCompound(id);break;
    case 'keep-compound':if(compoundById[id]&&!state.collection.compounds.includes(id)){state.collection.compounds.push(id);persist();render();if(state.storageAvailable)toast(`${compoundById[id].name} kept in your collection.`);}break;
    case 'forget-compound':state.collection.compounds=state.collection.compounds.filter(saved=>saved!==id);persist();render();toast('Removed from your collection. You can discover it again.');break;
    case 'object':state.object=id;render();break;
    case 'start-trail':startTrail(id);break;
    case 'open-trail-step':openTrailStep();break;
    case 'next-trail':nextTrail();break;
    case 'leave-trail':state.trail=null;render();break;
    case 'sources':$('#sources-dialog').showModal();break;
    case 'close-sources':$('#sources-dialog').close();break;
  }
});
document.addEventListener('change',event=>{if(event.target.id==='play-row'){stopSequence();state.playing=false;state.row=Number(event.target.value);$('#element-detail').innerHTML=renderElementDetail();$('#play-row').focus({preventScroll:true});}});
document.addEventListener('keydown',event=>{
  const tile=event.target.closest('.element-tile');if(!tile)return;
  const e=bySymbol[tile.dataset.symbol];let candidates;
  if(event.key==='ArrowRight')candidates=elements.filter(n=>n.row===e.row&&n.column>e.column).sort((a,b)=>a.column-b.column);
  else if(event.key==='ArrowLeft')candidates=elements.filter(n=>n.row===e.row&&n.column<e.column).sort((a,b)=>b.column-a.column);
  else if(event.key==='ArrowDown')candidates=elements.filter(n=>n.column===e.column&&n.row>e.row).sort((a,b)=>a.row-b.row);
  else if(event.key==='ArrowUp')candidates=elements.filter(n=>n.column===e.column&&n.row<e.row).sort((a,b)=>b.row-a.row);
  else return;
  event.preventDefault();if(candidates.length){const next=candidates[0];document.getElementById(`element-${next.symbol}`).focus();selectElement(next.symbol);}
});
document.addEventListener('dragstart',event=>{const tile=event.target.closest('[draggable][data-symbol]');if(tile){event.dataTransfer.setData('application/x-periodic-element',tile.dataset.symbol);event.dataTransfer.effectAllowed='copy';}});
document.addEventListener('dragover',event=>{const zone=event.target.closest('#drop-zone');if(zone&&Array.from(event.dataTransfer.types).includes('application/x-periodic-element')){event.preventDefault();event.dataTransfer.dropEffect='copy';zone.classList.add('drag-over');}});
document.addEventListener('dragleave',event=>{const zone=event.target.closest('#drop-zone');if(zone&&!zone.contains(event.relatedTarget))zone.classList.remove('drag-over');});
document.addEventListener('drop',event=>{const zone=event.target.closest('#drop-zone');if(zone){event.preventDefault();zone.classList.remove('drag-over');const symbol=event.dataTransfer.getData('application/x-periodic-element');if(bySymbol[symbol])changeAtom(symbol,1);}});
window.addEventListener('hashchange',()=>{stopSequence();state.playing=false;state.route=routes.includes(location.hash.slice(1))?location.hash.slice(1):'table';render();$('#main').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopSequence();state.playing=false;}else if(state.route==='table'&&$('#element-detail')){$('#element-detail').innerHTML=renderElementDetail();document.querySelectorAll('.sounding').forEach(el=>el.classList.remove('sounding'));}});
window.addEventListener('pagehide',stopSequence);
window.addEventListener('storage',event=>{if(event.key===storageKey||event.key===null){state.collection=readCollection();render();}});
$('#sources-dialog').addEventListener('click',event=>{if(event.target===$('#sources-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
render();
