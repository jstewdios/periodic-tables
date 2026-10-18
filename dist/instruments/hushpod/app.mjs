import { Sound } from './audio.mjs';
import { Skin } from './skin.mjs';

const $ = id => document.getElementById(id);
const stage = $('stage'), canvas = $('pod'), help = $('help');
const pocketTargets = [...document.querySelectorAll('.pocket-target')];
const waistTargets = [...document.querySelectorAll('.waist-target')];
const clamp = (n,a,b) => Math.min(b,Math.max(a,n));
const pointers = new Map(), heldKeys = new Set();
const waists = [1,1], history = [], gestures = [];
const emptyState = () => ({z:[0,0,0,0,0,0],n:[0,0,0],N:0,C:0,aperture:[1,1],currents:[0,0],time:0,rms:0,peak:0,balance:0});
let current = emptyState(), previous = current, receivedAt = 0, dirty = true;
let lastFrame = performance.now(), lastSend = 0, lastRead = 0, lastLog = 0;
let pointerUsed = false, lastNote = '', manualNote = '', manualUntil = 0, resetPendingUntil = 0;
let soundStatus = 'idle';
let frameId = null;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const skin = new Skin(canvas, geometry => {
  pocketTargets.forEach((el,j) => {
    const p=geometry.pocketCenter(j), r=geometry.r;
    Object.assign(el.style,{left:`${p.x-r}px`,top:`${p.y-r}px`,width:`${r*2}px`,height:`${r*2}px`});
    el.setAttribute('aria-label',`${(geometry.vertical?['Top','Middle','Bottom']:['Left','Middle','Right'])[j]} pocket. Tap to ring. Hold Shift and ${j+1} to damp.`);
  });
  waistTargets.forEach((el,j) => {
    const p=geometry.waistCenter(j), r=geometry.r;
    Object.assign(el.style,{left:`${p.x-(geometry.vertical?r*.7:24)}px`,top:`${p.y-(geometry.vertical?24:r*.7)}px`,width:`${geometry.vertical?r*1.4:48}px`,height:`${geometry.vertical?48:r*1.4}px`});
    el.setAttribute('aria-orientation',geometry.vertical?'horizontal':'vertical');
  });
});
skin.reducedMotion = reducedMotion.matches;
reducedMotion.addEventListener('change',event=>{skin.reducedMotion=event.matches;dirty=true;});

const sound = new Sound(state => {
  previous = current; current = state; receivedAt = performance.now(); dirty = true;
  if (receivedAt-lastLog>200) {
    history.push({at:Math.round(receivedAt),...state}); if(history.length>900)history.shift(); lastLog=receivedAt;
  }
}, (status, error) => {
  soundStatus = status;
  if (status === 'paused' || status === 'error') clearContacts();
  $('begin').disabled = status === 'starting';
  $('begin').hidden = status === 'running';
  $('volume-group').hidden = status !== 'running';
  $('begin').querySelector('span').textContent = status==='starting'?'Waking the sound…':status==='paused'?'Resume listening':status==='error'?'Try sound again':'Begin listening';
  if(error){$('audio-error').textContent=error;$('audio-error').hidden=false;}
  else $('audio-error').hidden=true;
  dirty=true;
});

function record(type, detail={}) {
  gestures.push({at:Math.round(performance.now()),type,...detail});if(gestures.length>600)gestures.shift();
}
function ensureSound() {
  // Each call originates from a user action. A failed attempt stays visibly retryable.
  if (document.hidden) return Promise.resolve();
  return sound.start().catch(()=>{});
}
function controls(now=performance.now()) {
  const rub=[0,0,0],hold=[0,0,0];
  if(now<resetPendingUntil)return {type:'controls',rub,hold,waists};
  for(const p of pointers.values()) {
    if(p.type!=='pocket'||p.index===null)continue;
    const age=now-p.lastMotion;
    if(p.rubbing&&age<165) {
      const speed=p.speed*Math.exp(-age/110)/(skin.r*2);
      rub[p.index]=Math.max(rub[p.index],clamp((speed-.035)/1.1,0,1));
    }
    if(now-p.started>180 && age>165)hold[p.index]=Math.max(hold[p.index],clamp((age-165)/60,0,1));
  }
  for(const j of heldKeys)hold[j]=1;
  return {type:'controls',rub,hold,waists:[...waists]};
}
function sendControls() {sound.send(controls());lastSend=performance.now();}
function setWaist(j,value) {
  waists[j]=clamp(value,0,1); if(waists[j]<.008)waists[j]=0;if(waists[j]>.992)waists[j]=1;
  waistTargets[j].setAttribute('aria-valuenow',String(Math.round(waists[j]*100)));
  waistTargets[j].setAttribute('aria-valuetext',waists[j]===0?'Closed':waists[j]===1?'Fully open':`${Math.round(waists[j]*100)} percent open`);
  skin.targets=[...waists];
  if(!sound.ready){current={...current,aperture:[...waists]};previous=current;}
  sendControls();dirty=true;
}
function clearContacts() {
  for(const id of pointers.keys()) {try{stage.releasePointerCapture(id);}catch{}}
  pointers.clear();heldKeys.clear();skin.activeWaist=-1;skin.contacts=[];
  sound.send({type:'release'});sendControls();dirty=true;
}
function tap(j,strength=1) {
  if(performance.now()<resetPendingUntil)return;
  ensureSound();sound.send({type:'tap',pocket:j,strength});record('tap',{pocket:j,strength});pointerUsed=true;dirty=true;
}
function note(text,duration=2400){manualNote=text;manualUntil=performance.now()+duration;dirty=true;}
function point(e){const b=stage.getBoundingClientRect();return{x:e.clientX-b.left,y:e.clientY-b.top};}

stage.addEventListener('pointerdown', e => {
  if(e.pointerType==='mouse'&&e.button!==0 || performance.now()<resetPendingUntil)return;
  const p=point(e),hit=skin.hit(p.x,p.y);if(!hit)return;
  e.preventDefault();ensureSound();pointerUsed=true;
  const now=performance.now();
  const entry={...p,...hit,started:now,lastAt:now,lastMotion:now,startX:p.x,startY:p.y,speed:0,rubbing:false,seeded:new Set(),pointerType:e.pointerType};
  if(hit.type==='waist') {
    entry.startAperture=waists[hit.index];entry.startV=skin.local(p.x,p.y).v;
    skin.activeWaist=hit.index;
    // Give keyboard focus without scrolling or a native gesture over the canvas.
    waistTargets[hit.index].focus({preventScroll:true});
  }
  pointers.set(e.pointerId,entry);stage.setPointerCapture(e.pointerId);
  record('contact-start',{target:hit.type,index:hit.index});sendControls();dirty=true;
});

stage.addEventListener('pointermove',e=>{
  const pos=point(e),p=pointers.get(e.pointerId),now=performance.now();
  if(!p){skin.hover=e.pointerType==='mouse'?skin.hit(pos.x,pos.y):null;stage.style.cursor=skin.hover?.type==='waist'?(skin.vertical?'ew-resize':'ns-resize'):skin.hover?'pointer':'default';dirty=true;return;}
  e.preventDefault();
  const dx=pos.x-p.x,dy=pos.y-p.y,travel=Math.hypot(dx,dy),dt=Math.max(.004,(now-p.lastAt)/1000);
  if(travel>.5){p.speed=.35*p.speed+.65*travel/dt;p.lastMotion=now;}
  p.x=pos.x;p.y=pos.y;p.lastAt=now;
  if(p.type==='waist') {
    const v=skin.local(pos.x,pos.y).v;
    setWaist(p.index,p.startAperture+(p.startV-v)/Math.max(88,skin.r*1.2));
  } else {
    const hit=skin.hit(pos.x,pos.y);
    if(Math.hypot(pos.x-p.startX,pos.y-p.startY)>(p.pointerType==='mouse'?4:7))p.rubbing=true;
    p.index=hit?.type==='pocket'?hit.index:null;
    if(p.rubbing&&p.index!==null&&!p.seeded.has(p.index)){
      sound.send({type:'tap',pocket:p.index,strength:.65});p.seeded.add(p.index);record('stroke-start',{pocket:p.index});
    }
  }
  sendControls();dirty=true;
});

function endPointer(e,cancelled=false){
  const p=pointers.get(e.pointerId);if(!p)return;
  pointers.delete(e.pointerId);try{stage.releasePointerCapture(e.pointerId);}catch{}
  if(!cancelled&&p.type==='pocket'&&!p.rubbing&&p.index!==null&&performance.now()-p.started<=180)tap(p.index);
  if(p.type==='waist'){record('waist',{index:p.index,aperture:waists[p.index]});skin.activeWaist=-1;}
  record(cancelled?'contact-cancel':'contact-end',{target:p.type,index:p.index});
  if(e.pointerType!=='mouse')skin.hover=null;
  sendControls();dirty=true;
}
stage.addEventListener('pointerup',e=>endPointer(e));
stage.addEventListener('pointercancel',e=>endPointer(e,true));
stage.addEventListener('lostpointercapture',e=>endPointer(e,true));
stage.addEventListener('pointerleave',()=>{skin.hover=null;dirty=true;});
stage.addEventListener('contextmenu',e=>e.preventDefault());

pocketTargets.forEach((el,j)=>{
  el.addEventListener('click',e=>{if(e.detail===0)tap(j);});
  el.addEventListener('focus',()=>{skin.focus={type:'pocket',index:j};dirty=true;});
  el.addEventListener('blur',()=>{skin.focus=null;dirty=true;});
});
waistTargets.forEach((el,j)=>{
  el.addEventListener('focus',()=>{skin.focus={type:'waist',index:j};dirty=true;});
  el.addEventListener('blur',()=>{skin.focus=null;dirty=true;});
  el.addEventListener('keydown',e=>{
    let v=waists[j];
    if(e.key==='Home')v=0;else if(e.key==='End')v=1;
    else if(['ArrowUp','ArrowRight'].includes(e.key))v+=e.shiftKey ? .01 : .1;
    else if(['ArrowDown','ArrowLeft'].includes(e.key))v-=e.shiftKey ? .01 : .1;
    else return;
    e.preventDefault();e.stopPropagation();ensureSound();setWaist(j,v);record('waist',{index:j,aperture:waists[j]});
  });
});

$('begin').addEventListener('click',()=>{ensureSound().then(sendControls);note('Tap any pocket. See where it goes.');});
function setMute(value){sound.muted=value;sound.setGain();$('mute').setAttribute('aria-pressed',String(value));$('mute').setAttribute('aria-label',value?'Unmute sound':'Mute sound');$('sound-icon').style.opacity=value?'.35':'1';note(value?'Sound muted. The motion is still there.':'Listen to what remains.',1800);}
$('mute').addEventListener('click',()=>setMute(!sound.muted));
$('volume').addEventListener('input',e=>{sound.volume=Number(e.target.value)/100;sound.setGain();});
function reset(){clearContacts();waists[0]=waists[1]=1;waistTargets.forEach(e=>{e.setAttribute('aria-valuenow','100');e.setAttribute('aria-valuetext','Fully open');});skin.targets=[1,1];resetPendingUntil=performance.now()+80;sound.reset();sendControls();current=emptyState();previous=current;record('reset');note('A fresh beginning.',1600);dirty=true;}
$('reset').addEventListener('click',reset);
function inspect(force){const visible=force??$('inspector').hidden;$('inspector').hidden=!visible;$('inspect-toggle').setAttribute('aria-pressed',String(visible));}
$('inspect-toggle').addEventListener('click',()=>inspect());$('inspect-close').addEventListener('click',()=>inspect(false));
function showHelp(){clearContacts();if(!help.open)help.showModal();}
$('help-open').addEventListener('click',showHelp);
$('help-close').addEventListener('click',()=>help.close());$('help-play').addEventListener('click',()=>{help.close();ensureSound().then(sendControls);});
help.addEventListener('click',e=>{if(e.target===help){const b=help.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)help.close();}});

window.addEventListener('keydown',e=>{
  if(help.open||e.metaKey||e.ctrlKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(['1','2','3'].includes(e.key) || ['Digit1','Digit2','Digit3'].includes(e.code)){
    const j=Number(e.code?.slice(-1)||e.key)-1;
    if(j<0||j>2)return;e.preventDefault();if(e.repeat)return;ensureSound();
    if(e.shiftKey){heldKeys.add(j);sendControls();record('key-hold',{pocket:j});}else tap(j);
  } else if(e.key.toLowerCase()==='m'){setMute(!sound.muted);}
  else if(e.key.toLowerCase()==='r'){reset();}
  else if(e.key.toLowerCase()==='d'){inspect();}
  else if(e.key==='?'){showHelp();}
});
window.addEventListener('keyup',e=>{if(e.key==='Shift')heldKeys.clear();else if(['Digit1','Digit2','Digit3'].includes(e.code))heldKeys.delete(Number(e.code.slice(-1))-1);sendControls();});
window.addEventListener('blur',clearContacts);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){clearContacts();stopFrames();sound.suspend().catch(()=>{});}
  else{dirty=true;resize();startFrames();}
});
// Each instrument is a separate document. Close the engine even when the browser
// keeps this document in its back/forward cache; restoration starts silently.
window.addEventListener('pagehide',()=>{
  clearContacts();stopFrames();observer.disconnect();sound.dispose();
  current=emptyState();current.aperture=[...waists];previous=current;dirty=true;
});
window.addEventListener('pageshow',()=>{observer.observe(stage);resize();startFrames();});

$('export-log').addEventListener('click',()=>{
  const data={instrument:'Hushpod',version:1,exported:new Date().toISOString(),sampleRate:sound.ctx?.sampleRate??null,volume:sound.volume,muted:sound.muted,gestures,states:history};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='hushpod-diagnostics.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});

function resize(){
  const b=stage.getBoundingClientRect();
  if(b.width!==skin.width||b.height!==skin.height)clearContacts();
  skin.resize(b.width,b.height,window.devicePixelRatio||1);dirty=true;
}
const observer=new ResizeObserver(resize);observer.observe(stage);
window.addEventListener('orientationchange',clearContacts);

function updateReadings(now) {
  const vibrating=current.N>1e-6;
  $('motion-caption').textContent=vibrating?(current.C<.004?'quiet, still moving':'motion inside'):'at rest';
  const bright=clamp(Math.sqrt(current.N)*2.5,.2,1);
  $('motion-light').style.opacity=String(bright);
  $('motion-light').style.boxShadow=vibrating?`0 0 ${bright*12}px #b7c9a866`:'none';
  let text='A small touch is enough.';
  if(soundStatus==='paused')text='The pod is resting. Tap to resume.';
  else if(sound.muted&&sound.ready)text='Muted. The motion is still there.';
  else if(now<manualUntil)text=manualNote;
  else if(current.N>1e-5&&current.C<.004)text='Quiet is not the same as empty.';
  else if([...pointers.values()].some(p=>p.type==='waist'))text='A little opening changes where it goes.';
  else if(controls(now).hold[1]>.5)text='Let the middle settle.';
  else if(current.N>.6)text='A stronger vibration changes its own path.';
  else if(vibrating)text='Catch it. Let it go. Find it again.';
  else if(pointerUsed)text='Nothing lost. Another small touch.';
  if(text!==lastNote){$('interaction-note').textContent=text;lastNote=text;}
  if(!$('inspector').hidden){
    current.n.forEach((n,j)=>$('bar-'+j).style.width=`${Math.min(100,100*Math.sqrt(n/1.6))}%`);
    $('read-n').textContent=current.N.toFixed(5);
    $('read-c').textContent=current.N>1e-9?`${Math.max(-120,10*Math.log10(Math.max(current.C,1e-12))).toFixed(1)} dB`:'—';
    $('read-k').textContent=current.aperture.map(x=>Math.round(100*x)+'%').join(' / ');
    $('read-j').textContent=current.currents.map(x=>x.toFixed(3)).join(' / ');
    $('read-error').textContent=(current.balance||0).toExponential(1);
  }
}

function frame(now){
  if(now-lastSend>45&&sound.ready&&soundStatus==='running')sendControls();
  if(now-lastRead>150){updateReadings(now);lastRead=now;}
  const shouldDraw=dirty||current.N>1e-7||pointers.size>0;
  if(shouldDraw&&now-lastFrame>(skin.reducedMotion?100:16)){
    const blend=clamp((now-receivedAt)/(1000/30),0,1);
    const mix=(a,b)=>a+(b-a)*blend;
    skin.state={...current,z:current.z.map((x,i)=>mix(previous.z[i],x)),n:current.n.map((x,i)=>mix(previous.n[i],x)),aperture:current.aperture.map((x,i)=>mix(previous.aperture[i],x)),time:mix(previous.time,current.time)};
    skin.contacts=[...pointers.values()].filter(p=>p.type==='pocket'&&p.index!==null);
    skin.draw(now);dirty=false;lastFrame=now;
  }
  frameId=requestAnimationFrame(frame);
}
function stopFrames(){cancelAnimationFrame(frameId);frameId=null;}
function startFrames(){if(frameId===null&&!document.hidden)frameId=requestAnimationFrame(frame);}
resize();startFrames();
