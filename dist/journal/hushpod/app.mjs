import { Experiment, DT, INITIAL_ACTION, VERSION } from './experiment.mjs';
import { JournalAudio } from './audio.mjs';
const $=id=>document.getElementById(id);
const experiment=new Experiment();
let state=experiment.snapshot(), listening=false, starting=false, last=0, accumulator=0, lastDraw=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const status=text=>{$('status').textContent=text;};
const audio=new JournalAudio(s=>{state=s;},message=>{stopAudio();state.running=false;experiment.running=false;status(message);render();});
function stopAudio(){audio.stop();listening=false;starting=false;experiment.restore(state);$('sound').textContent='Enable sound';$('sound').setAttribute('aria-pressed','false');$('sound').disabled=false;}
function send(d){
  if(starting)stopAudio();
  // Optimistically mirror controls; subsequent audio reports are authoritative.
  experiment.restore(state);experiment.command(d);state=experiment.snapshot();
  if(listening)audio.send(d);
  render();
}
function reset(degrees=180){
  send({type:'reset',degrees});$('phase').value=degrees;$('phase-value').value=degrees+'°';
  $('reveal').textContent='Narrow left waist';
  status('Fresh state prepared. Press Start to evolve it. Sound is '+(listening?'enabled.':'off.'));
}
$('reset').onclick=()=>reset();
$('phase').oninput=event=>reset(Number(event.target.value));
$('run').onclick=()=>{
  if(state.time>=12-DT)reset(Number($('phase').value));
  send({type:'run',value:!state.running});
  status(state.running?'The actual model is evolving. Try narrowing the left waist.':'Paused. Measurements are held for inspection.');
};
$('reveal').onclick=()=>{
  const value=state.target[0]<.5?1:.2;send({type:'waist',value});
  $('reveal').textContent=value===1?'Narrow left waist':'Reopen left waist';
  status(state.running?'Waist target changed; no action was injected.':'Waist target changed. Press Start to observe exchange.');
};
$('sound').onclick=async()=>{
  if(listening||starting){stopAudio();status('Sound off. The silent model continues from the last audio measurement.');return;}
  starting=true;$('sound').disabled=true;status('Starting sound…');
  // Hold the silent authority during asynchronous audio startup.
  try{
    const ok=await audio.start(state);
    if(!ok)return;
    listening=true;starting=false;$('sound').textContent='Disable sound';$('sound').setAttribute('aria-pressed','true');
    status(state.running?'Sound enabled. The pickup can still be silent through cancellation.':'Sound enabled. Press Start to listen.');
  }catch(error){starting=false;status(error.message+' You can continue without sound.');}
  finally{$('sound').disabled=false;}
};
function pauseForLifecycle(){state.running=false;stopAudio();experiment.running=false;status('Paused while away. Press Start; enable sound again if wanted.');render();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseForLifecycle();});
window.addEventListener('pagehide',pauseForLifecycle);
function render(){
  $('clock').textContent=state.time.toFixed(2)+' s / 12 s';
  $('action').textContent=state.N.toFixed(4);$('pickup').textContent=state.P.toFixed(4);
  $('action-meter').value=state.N;$('pickup-meter').value=state.P;
  $('retained').textContent=(state.N/INITIAL_ACTION*100).toFixed(1)+'%';
  $('fraction').textContent=(state.C*100).toFixed(3)+'%';
  $('aperture').textContent=(state.aperture[0]*100).toFixed(0)+'%';
  $('run').textContent=state.running?'Pause experiment':state.time>=12-DT?'Run again':'Start experiment';
  for(let j=0;j<3;j++){
    const line=$('arrow-'+j);line.setAttribute('x2',120+240*j+state.z[2*j]*120);line.setAttribute('y2',92-state.z[2*j+1]*120);
  }
  $('measurements').textContent=VERSION+'\n'+JSON.stringify({time:state.time,localAction:state.n,totalAction:state.N,pickupSquared:state.P,pickupFraction:state.C,waistOpenness:state.aperture,exchangeCurrents:state.currents,actionLost:state.lost,balanceError:state.balance},null,2);
}
function frame(now){
  const elapsed=last?Math.min((now-last)/1000,.05):0;last=now;
  if(!document.hidden&&!listening&&!starting&&state.running){
    accumulator+=elapsed;
    while(accumulator>=DT){experiment.step();accumulator-=DT;}
    state=experiment.snapshot();
  }else accumulator=0;
  if(now-lastDraw>(reduced.matches?250:33)){render();lastDraw=now;}
  requestAnimationFrame(frame);
}
for(const id of ['run','reveal','reset','sound','phase'])$(id).disabled=false;
status(reduced.matches?'Ready. Reduced motion hides phase arrows; all numerical measurements remain live.':'Ready. Start without sound, or enable sound first.');
render();requestAnimationFrame(frame);
