// Original oscillator composition; no sampled commercial recordings.
export class ArcadeAudio{
 constructor(settings){this.settings=settings;this.ctx=null;this.timer=null;this.index=0;this.active=false;this.lastContact=0;}
 async start(){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;this.ctx??=new Audio();await this.ctx.resume();this.active=true;if(!this.timer)this.timer=setInterval(()=>this.music(),220);}
 note(freq,duration,volume,type='triangle',bus='se',delay=0){if(!this.active||!this.ctx||this.ctx.state!=='running')return;const level=this.settings[bus]??.3;if(!level)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0001,volume*level),t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(this.ctx.destination);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect()};}
 music(){if(!this.active)return;const notes=[196,0,293.66,329.63,0,246.94,220,0,196,293.66,392,0,329.63,293.66,220,0];const n=notes[this.index++%notes.length];if(n)this.note(n,.2,.04,'triangle','bgm');}
 effect(type,strength=1){if(type==='contact'){const now=this.ctx?.currentTime||0;if(now-this.lastContact<.07)return;this.lastContact=now;this.note(1400,.055,Math.min(.06,.015*strength),'sine');this.note(2100,.035,.012,'sine');}else if(type==='front'){[659,880,1175].forEach((f,i)=>this.note(f,.14,.055,'triangle','se',i*.045));}else if(type==='collapse'){this.note(130,.18,.05,'triangle');this.note(920,.1,.045,'sine');}else if(type==='insert')this.note(420,.08,.05);}
 pause(){this.active=false;this.ctx?.suspend().catch(()=>{});}
 dispose(){clearInterval(this.timer);this.ctx?.close().catch(()=>{});}
}
