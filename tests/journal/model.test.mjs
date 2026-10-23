import test from 'node:test';
import assert from 'node:assert/strict';
import { Experiment, DT } from '../../dist/journal/hushpod/experiment.mjs';
const advance=(e,t)=>{e.command({type:'run',value:true});for(let i=0;i<Math.round(t/DT);i++)e.step();return e.snapshot();};
test('phase changes pickup, not prepared action; reset is reproducible',()=>{
 const e=new Experiment();const quiet=e.snapshot();assert.equal(quiet.N,.5);assert.ok(quiet.P<1e-30);
 for(const degrees of [0,45,90,170,180]){e.reset(degrees);const s=e.snapshot();assert.ok(Math.abs(s.N-.5)<1e-15);assert.ok(Math.abs(s.P-(.5+.5*Math.cos(degrees*Math.PI/180)))<1e-14);}
 advance(e,1);e.reset();assert.deepEqual(e.snapshot(),quiet);
});
test('quiet state stays active and nearly cancels through eight seconds',()=>{
 const e=new Experiment(),s=advance(e,8);assert.ok(Math.abs(s.N-.5*Math.exp(-.09*8))<1e-10);assert.ok(s.C<1e-20);assert.ok(s.n[1]<1e-20);assert.ok(Math.abs(s.balance)<1e-10);
});
test('narrowing one waist reveals retained action without injection',()=>{
 const e=new Experiment();advance(e,1);e.command({type:'waist',value:.2});let peak=0;
 for(let i=0;i<4000;i++){e.step();peak=Math.max(peak,e.snapshot().C);}
 const s=e.snapshot();assert.ok(peak>.03);assert.equal(s.injected,.5);assert.ok(Math.abs(s.N-.5*Math.exp(-.09*2))<1e-10);assert.ok(s.n[1]>0);
});
test('pause, resume, finite duration, and authority handoff preserve state',()=>{
 const e=new Experiment();advance(e,1);e.command({type:'run',value:false});const s=e.snapshot();e.step();assert.deepEqual(e.snapshot(),s);
 const copy=new Experiment();copy.restore(s);assert.deepEqual(copy.snapshot(),s);advance(copy,20);assert.equal(copy.running,false);assert.ok(Math.abs(copy.pod.time-12)<1e-9);
});
test('configured non-symmetric trajectory converges when timestep halves',()=>{
 const solve=dt=>{const e=new Experiment();e.reset(90);e.pod.waist(0,.2);for(let i=0;i<2/dt;i++)e.pod.step(dt);return e.pod.z;};
 const a=solve(DT),b=solve(DT/2),c=solve(DT/4);
 const distance=(x,y)=>Math.hypot(...x.map((v,i)=>v-y[i]));
 assert.ok(distance(a,b)<.001);assert.ok(distance(b,c)<distance(a,b));
});
