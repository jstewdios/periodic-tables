let context;
let master;
let active=new Set();
let timers=[];
let generation=0;
let suspension;
let activation=0;
let activationGeneration=0;

export async function enableAudio(){
  const AudioContext=globalThis.AudioContext??globalThis.webkitAudioContext;
  if(!AudioContext)throw new Error('Audio is not supported in this browser.');
  if(!context){context=new AudioContext();master=context.createGain();master.gain.value=.2;master.connect(context.destination);}
  const ctx=context,id=generation,attempt=++activation;
  activationGeneration=id;
  // Request resume while still in the user gesture, even if a pending suspend
  // has not updated state yet. Do not report success until both have settled.
  const pending=suspension;
  if(ctx.state!=='running'||pending)await ctx.resume();
  if(pending)await pending;
  if(ctx===context&&id===generation&&attempt===activation&&ctx.state!=='running')await ctx.resume();
  if(ctx!==context||id!==generation||attempt!==activation){if(ctx===context&&activationGeneration!==generation&&ctx.state==='running')await suspendAudio();return false;}
  return true;
}
export function pitchFor(element,mode){
  if(mode==='pull')return element.electronegativity==null?null:48+(element.electronegativity-.7)/3.3*36;
  if(mode==='number')return 42+(element.number-1)/117*42;
  // Repeated columns have repeated pitches; the detached series has a separate ascending run.
  return 48+(element.group??element.column);
}
export function playElement(element,mode='families'){
  if(!context||context.state!=='running')return;
  const midi=pitchFor(element,mode);if(midi==null)return;
  if(active.size>=8){const oldest=active.values().next().value;oldest.stop();active.delete(oldest);}
  const oscillator=context.createOscillator(),gain=context.createGain(),now=context.currentTime;
  oscillator.type=['Alkali metal','Alkaline earth metal','Transition metal'].includes(element.category)?'triangle':'sine';
  oscillator.frequency.value=440*2**((midi-69)/12);
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.22,now+.025);gain.gain.exponentialRampToValueAtTime(.001,now+.65);
  oscillator.connect(gain);gain.connect(master);active.add(oscillator);
  oscillator.onended=()=>{active.delete(oscillator);oscillator.disconnect();gain.disconnect();};
  oscillator.start(now);oscillator.stop(now+.7);
}
export function stopSequence(){generation++;timers.forEach(clearTimeout);timers=[];for(const oscillator of active){try{oscillator.stop();}catch{}}active.clear();}
export function suspendAudio(){
  stopSequence();
  if(!context)return;
  const pending=context.suspend().catch(()=>{});
  suspension=pending;
  pending.finally(()=>{if(suspension===pending)suspension=null;});
  return pending;
}
export function disposeAudio(){stopSequence();const ctx=context;context=null;master=null;suspension=null;ctx?.close().catch(()=>{});}
export async function playSequence(elements,mode,onNote,onEnd){
  stopSequence();const id=generation;
  if(!await enableAudio()||id!==generation)return;
  elements.forEach((element,i)=>timers.push(setTimeout(()=>{if(id!==generation)return;playElement(element,mode);onNote(element);},i*230)));
  timers.push(setTimeout(()=>{if(id===generation){timers=[];onEnd();}},elements.length*230+300));
}
