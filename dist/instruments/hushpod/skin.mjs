const TAU = Math.PI * 2;
const colors = ['215,190,150', '151,190,174', '189,171,202'];
const clamp = (x,lo,hi) => Math.max(lo,Math.min(hi,x));

export class Skin {
  constructor(canvas, onLayout) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.onLayout = onLayout;
    this.width = 0; this.height = 0; this.hover = null; this.contacts = [];
    this.focus = null; this.activeWaist = -1; this.targets = [1,1];
    this.state = {z:[0,0,0,0,0,0],n:[0,0,0],N:0,C:0,aperture:[1,1],time:0,currents:[0,0]};
  }
  resize(width,height,dpr=1) {
    this.width=width; this.height=height;
    this.dpr=Math.min(dpr,2); this.canvas.width=Math.round(width*this.dpr); this.canvas.height=Math.round(height*this.dpr);
    this.vertical=width<600 && height>width*1.03;
    this.angle=this.vertical?Math.PI/2:0;
    const length=this.vertical?height-112:width-110;
    const cross=this.vertical?width-100:height-(height<320?90:150);
    this.r=Math.max(26, Math.min(112,length/6.6,cross/2.5));
    this.d=this.r*2.27;
    this.cx=width/2; this.cy=height/2+(this.vertical?1:3);
    this.onLayout?.(this);
  }
  screen(u,v) { return this.vertical ? {x:this.cx-v,y:this.cy+u} : {x:this.cx+u,y:this.cy+v}; }
  local(x,y) { return this.vertical ? {u:y-this.cy,v:this.cx-x} : {u:x-this.cx,v:y-this.cy}; }
  pocketCenter(j) { return this.screen((j-1)*this.d,0); }
  waistCenter(j) { return this.screen((j-.5)*this.d,0); }
  hit(x,y) {
    const {u,v}=this.local(x,y), r=this.r;
    // Waists get deliberately generous targets even when completely pinched.
    for(let j=0;j<2;j++) if(Math.abs(u-(j-.5)*this.d)<Math.max(24,r*.39) && Math.abs(v)<r*.78) return {type:'waist',index:j};
    let best=null,dist=Infinity;
    for(let j=0;j<3;j++) {
      const q=(u-(j-1)*this.d)**2 + v*v;
      if(q<(r*1.14)**2 && q<dist){best={type:'pocket',index:j};dist=q;}
    }
    return best;
  }
  radiusAt(u) {
    const r=this.r,d=this.d,a=this.state.aperture;
    if(u<-d) return Math.sqrt(Math.max(0,r*r-(u+d)**2));
    if(u>d) return Math.sqrt(Math.max(0,r*r-(u-d)**2));
    const j=u<0?0:1, t=j===0?(u+d)/d:u/d;
    const neck=r*(.055+.30*a[j]);
    return r-(r-neck)*Math.sin(Math.PI*t)**2;
  }
  bodyPath(expand=0) {
    const c=this.ctx, edge=this.d+this.r;
    c.beginPath();
    for(let k=0;k<=180;k++) {const u=-edge+2*edge*k/180,v=-this.radiusAt(u)-expand;if(k===0)c.moveTo(u,v);else c.lineTo(u,v);}
    for(let k=180;k>=0;k--) {const u=-edge+2*edge*k/180;c.lineTo(u,this.radiusAt(u)+expand);}
    c.closePath();
  }
  draw(now) {
    const c=this.ctx,w=this.width,h=this.height,r=this.r,d=this.d, s=this.state;
    if(!w||!h)return;
    c.setTransform(this.dpr,0,0,this.dpr,0,0); c.clearRect(0,0,w,h);
    c.save();c.translate(this.cx,this.cy);c.rotate(this.angle);
    // Underlying still, soft shadow. Only the actual simulation moves the ridges.
    c.save(); c.translate(0,r*.21); this.bodyPath(4);
    c.shadowColor='#0009';c.shadowBlur=r*.5;c.fillStyle='#030b0d66';c.fill();c.restore();
    this.bodyPath();
    const fill=c.createLinearGradient(0,-r,0,r);
    fill.addColorStop(0,'rgba(175,198,181,.105)');fill.addColorStop(.45,'rgba(105,135,126,.045)');fill.addColorStop(1,'rgba(130,158,143,.11)');
    c.fillStyle=fill;c.fill();c.save();c.clip();
    for(let j=0;j<3;j++) {
      const x=(j-1)*d, amp=Math.sqrt(s.n[j]||0), presence=clamp(amp*2.5,0,1);
      const glow=c.createRadialGradient(x-r*.12,-r*.22,r*.02,x,0,r*1.28);
      glow.addColorStop(0,`rgba(${colors[j]},${.065+.19*presence})`);
      glow.addColorStop(.55,`rgba(${colors[j]},${.035+.08*presence})`);glow.addColorStop(1,`rgba(${colors[j]},0)`);
      c.fillStyle=glow;c.fillRect(x-r*1.4,-r*1.5,r*2.8,r*3);
      const visualPhase=TAU*.72*s.time;
      const wave=this.reducedMotion?0:(s.z[j*2]||0)*Math.cos(visualPhase)+(s.z[j*2+1]||0)*Math.sin(visualPhase);
      const quadrature=this.reducedMotion?0:-(s.z[j*2]||0)*Math.sin(visualPhase)+(s.z[j*2+1]||0)*Math.cos(visualPhase);
      // Fine grain runs across each pocket. Signed displacement reveals opposition.
      for(let ridge=-15;ridge<=15;ridge++) {
        const v=ridge/16*r*.96, side=Math.sqrt(Math.max(0,1-(v/r)**2)), span=r*side;
        c.beginPath();
        for(let k=0;k<=32;k++){
          const u=-span+2*span*k/32;
          const envelope=Math.max(0,1-u*u/(r*r)) * Math.max(0,1-v*v/(r*r));
          const bend=Math.sin(u/r*Math.PI)*r*.035;
          const tremor=clamp(wave,-1.5,1.5)*r*.24*envelope*Math.cos(v/r*1.5);
          const y=v+bend+tremor;
          if(k===0)c.moveTo(x+u,y);else c.lineTo(x+u,y);
        }
        c.strokeStyle=`rgba(${colors[j]},${.10 + presence*.32})`;c.lineWidth=ridge%4===0?.85:.55;c.stroke();
      }
      // A translucent inner fold remains visible even during pickup cancellation.
      c.beginPath();c.ellipse(x+clamp(quadrature,-1,1)*r*.08,clamp(wave,-1.5,1.5)*r*.15,r*(.15+.10*presence),r*.61,0,0,TAU);
      const inner=c.createLinearGradient(x-r*.3,0,x+r*.3,0);
      inner.addColorStop(0,`rgba(${colors[j]},0)`);inner.addColorStop(.5,`rgba(${colors[j]},${.035+presence*.1})`);inner.addColorStop(1,`rgba(${colors[j]},0)`);
      c.fillStyle=inner;c.fill();
      if(this.hover?.type==='pocket'&&this.hover.index===j || this.focus?.type==='pocket'&&this.focus.index===j){
        c.beginPath();c.ellipse(x,0,r*.97,r*.97,0,0,TAU);c.strokeStyle=`rgba(${colors[j]},.26)`;c.lineWidth=1;c.stroke();
      }
    }
    // Contact impressions are direct visual feedback, not additional simulated springs.
    for(const p of this.contacts){
      const {u,v}=this.local(p.x,p.y);
      const halo=c.createRadialGradient(u,v,0,u,v,r*.44);
      halo.addColorStop(0,`rgba(224,230,205,${p.rubbing ? .2 : .11})`);halo.addColorStop(1,'rgba(224,230,205,0)');
      c.fillStyle=halo;c.beginPath();c.arc(u,v,r*.44,0,TAU);c.fill();
      c.beginPath();c.ellipse(u,v,r*.13,r*.08,0,0,TAU);c.strokeStyle='#e0e7cf55';c.lineWidth=.8;c.stroke();
    }
    c.restore();
    this.bodyPath();c.strokeStyle='rgba(190,208,183,.27)';c.lineWidth=.85;c.stroke();
    // A thin highlight travels around no invented motion: a fixed material edge.
    c.save();c.beginPath();c.rect(-d-r,-r*1.1,(d+r)*2,r*1.05);c.clip();this.bodyPath();c.strokeStyle='#c5d4b932';c.lineWidth=1.4;c.stroke();c.restore();
    for(let j=0;j<2;j++) this.drawWaist(j);
    // Pocket marks are quiet, fixed landmarks.
    for(let j=0;j<3;j++) {
      const p=this.screen((j-1)*d,0);
      c.save();c.translate((j-1)*d,r+19);c.rotate(-this.angle);
      c.fillStyle='rgba(161,184,167,.45)';c.font='9px -apple-system, BlinkMacSystemFont, sans-serif';c.textAlign='center';c.textBaseline='middle';
      if(!this.vertical)c.fillText(['I','II','III'][j],0,0);
      c.restore();
    }
    c.restore();
    if(this.vertical){
      for(let j=0;j<3;j++){const p=this.pocketCenter(j);c.fillStyle='rgba(161,184,167,.43)';c.font='9px sans-serif';c.textAlign='center';c.fillText(['I','II','III'][j],p.x+r+20,p.y+3);}
    }
  }
  drawWaist(j) {
    const c=this.ctx,r=this.r,x=(j-.5)*this.d,a=this.state.aperture[j],neck=r*(.055+.30*a);
    const active=this.activeWaist===j || this.hover?.type==='waist'&&this.hover.index===j || this.focus?.type==='waist'&&this.focus.index===j;
    const flow=clamp(Math.abs(this.state.currents[j]||0)*3,0,1);
    c.save();c.translate(x,0);
    // Pinching bands and a small knurled edge signal a draggable neck.
    for(let side of [-1,1]){
      c.beginPath();c.moveTo(-r*.13,side*(neck+5));c.quadraticCurveTo(0,side*(neck+1),r*.13,side*(neck+5));
      c.strokeStyle=active?'#d3ddbfbb':`rgba(171,193,167,${.42+flow*.28})`;c.lineWidth=1.5;c.stroke();
      c.beginPath();c.moveTo(-r*.09,side*(neck+9));c.quadraticCurveTo(0,side*(neck+6),r*.09,side*(neck+9));c.strokeStyle='#9eaf9550';c.lineWidth=.7;c.stroke();
    }
    c.save();c.translate(0,-neck-24);c.rotate(-this.angle);
    c.textAlign='center';c.textBaseline='middle';c.font='10px -apple-system, BlinkMacSystemFont, sans-serif';
    c.fillStyle=active?'#c7d6b8':'#8fa58b88';
    c.fillText(active?(a<.003?'closed':a>.997?'open':`${Math.round(a*100)}%`):(this.vertical?'↔':'↕'),0,0);
    c.restore();c.restore();
  }
}
