import { Experiment, DT } from './experiment.mjs';
class JournalProcessor extends AudioWorkletProcessor {
  constructor() {
    super(); this.experiment = new Experiment(); this.clock = 0; this.phase = 0;
    this.previous = [0,0]; this.next = [0,0]; this.report = 0;
    this.port.onmessage = ({data}) => {
      this.experiment.command(data);
      if (data.type === 'reset' || data.type === 'restore') {
        this.previous = this.experiment.snapshot().pickup;
        this.next = [...this.previous]; this.clock = 0;
      }
      this.port.postMessage(this.experiment.snapshot());
    };
  }
  process(_inputs, outputs) {
    const channels = outputs[0]; if (!channels?.length) return true;
    for (let i = 0; i < channels[0].length; i++) {
      if (this.clock <= 0) {
        this.previous = this.next;
        this.experiment.step();
        const z = this.experiment.pod.z, w = this.experiment.pod.material.middleWeight;
        this.next = [z[0]+w*z[2]+z[4], z[1]+w*z[3]+z[5]];
        this.clock += DT;
      }
      const t = 1-this.clock/DT;
      const re = this.previous[0]+(this.next[0]-this.previous[0])*t;
      const im = this.previous[1]+(this.next[1]-this.previous[1])*t;
      const pickup = re*Math.cos(this.phase)+im*Math.sin(this.phase);
      const value = this.experiment.running ? .78*Math.tanh(1.4*pickup) : 0;
      for (const channel of channels) channel[i] = value;
      this.phase = (this.phase + 2*Math.PI*220/sampleRate) % (2*Math.PI);
      this.clock -= 1/sampleRate;
    }
    this.report += channels[0].length/sampleRate;
    if (this.report >= 1/30) { this.port.postMessage(this.experiment.snapshot()); this.report = 0; }
    return true;
  }
}
registerProcessor('hushpod-journal', JournalProcessor);
