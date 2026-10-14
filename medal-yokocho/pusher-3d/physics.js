import RAPIER from '@dimforge/rapier3d-compat';
export const STAGES=[{name:'夜の横丁',speed:1.25},{name:'黄金の押し板',speed:1.6},{name:'静かな水路',speed:1.05},{name:'倍速フェス',speed:2.25},{name:'宵まち大祭',speed:1.85}];
export const STEP=1/60, RADIUS=.265, HALF_HEIGHT=.06, MAX_BODIES=260;
let initialized;
export function initPhysics(){return initialized??=(RAPIER.init().then(()=>RAPIER));}
const vec=v=>({x:v.x,y:v.y,z:v.z});
const quat=q=>({x:q.x,y:q.y,z:q.z,w:q.w});
export class PusherPhysics{
 constructor(saved=null){
  this.world=new RAPIER.World({x:0,y:-9.81,z:0});this.queue=new RAPIER.EventQueue(true);this.world.timestep=STEP;this.world.numSolverIterations=8;
  this.coins=[];this.time=0;this.phase=0;this.cycles=0;this.nextId=1;this.pending=[];this.events=[];this.stage=0;
  this.ledger={initial:0,inserted:0,front:0,side:0};
  this.box(3.8,.15,3.8,0,-.15,-.2); // lower deck: front z=3.6, sides x=+-3.8
  for(const x of [-3.9,3.9])this.box(.1,.3,2.7,x,.3,-1.3);
  this.box(3.75,.45,.12,0,1.03,-2.08); // stationary stripper above moving plate
  this.box(4.0,1,.15,0,.8,-4.15); // rear guard
  this.pusher=this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0,.25,-3.6));
  this.world.createCollider(RAPIER.ColliderDesc.cuboid(3.75,.25,1.5).setFriction(.42).setRestitution(0),this.pusher);
  try{if(saved)this.restore(saved);else this.seed();}catch(e){this.dispose();throw e;}
 }
 box(hx,hy,hz,x,y,z){const b=this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));this.world.createCollider(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setFriction(.38).setRestitution(0),b);return b;}
 add({x,y,z,kind='coin',origin='input',id=null,rotation=null,velocity=null,angular=null,exit=null,tower=false,sleeping=false}){
  const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x,y,z).setLinearDamping(.12).setAngularDamping(.18).setCcdEnabled(true));
  const shape=kind==='ball'?RAPIER.ColliderDesc.ball(.34).setMass(.16):RAPIER.ColliderDesc.cylinder(HALF_HEIGHT,RADIUS).setMass(.025);
  this.world.createCollider(shape.setFriction(.38).setRestitution(.04).setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS).setContactForceEventThreshold(1.2),body);
  if(rotation)body.setRotation(rotation,true);if(velocity)body.setLinvel(velocity,true);if(angular)body.setAngvel(angular,true);if(sleeping)body.sleep();
  const coin={id:id??this.nextId++,kind,origin,body,exit,tower};this.coins.push(coin);return coin;
 }
 seed(){
  for(let row=0;row<8;row++)for(let col=0;col<12;col++)this.add({x:(col-5.5)*.56,z:-.95+row*.55,y:.063,origin:'initial'});
  for(let side of [-1,1])for(let n=0;n<12;n++)this.add({x:side*1.4,z:1.25,y:.19+n*.121,origin:'initial',tower:true});
  
  this.ledger.initial=this.coins.length;
 }
 canInsert(cost){return [1,3,5].includes(cost)&&this.coins.length+this.pending.length+(cost===3?3:1)<=MAX_BODIES;}
 insert(cost,x){if(![1,3,5].includes(cost))return false;if(!this.canInsert(cost)){this.cycles=Math.max(this.cycles,2);return false;}for(let i=0;i<(cost===3?3:1);i++)this.pending.push({at:this.time+i*.22,x:Math.max(-3.3,Math.min(3.3,x)),kind:cost===5?'ball':'coin'});this.pending.sort((a,b)=>a.at-b.at);this.cycles=Math.min(4,this.cycles+2);return true;}
 step(){
  this.events=[];this.time+=STEP;
  if(this.cycles>0){this.phase+=STEP*STAGES[this.stage].speed;if(this.phase>=Math.PI*2){this.phase-=Math.PI*2;this.cycles--;if(this.cycles===0)this.phase=0;}}
  const z=-3.6+1.15*(1-Math.cos(this.phase))/2;this.pusher.setNextKinematicTranslation({x:0,y:.25,z});
  while(this.pending.length&&this.pending[0].at<=this.time){const s=this.pending.shift();this.add({x:s.x,y:1.5,z:-1.6,kind:s.kind,velocity:{x:0,y:-.35,z:.25}});this.ledger.inserted++;this.events.push({type:'insert',x:s.x});}
  this.world.step(this.queue);
  let contacts=0;this.queue.drainContactForceEvents(e=>{if(contacts++<2)this.events.push({type:'contact',strength:Math.min(4,e.totalForceMagnitude()/3)});});
  for(let i=this.coins.length-1;i>=0;i--){const c=this.coins[i],p=c.body.translation();
   if(![p.x,p.y,p.z].every(Number.isFinite))throw Error('Non-finite body position');
   if(!c.exit&&p.y<-.12){if(Math.abs(p.x)>3.8)c.exit='side';else if(p.z>3.6)c.exit='front';else if(p.z<-4)c.exit='side';}
   if(c.tower&&p.y<.105){c.tower=false;this.events.push({type:'collapse',x:p.x,z:p.z});}
   if(p.y<-.8){const exit=c.exit||'side';this.ledger[exit]++;this.events.push({type:exit,id:c.id,origin:c.origin,x:p.x,z:p.z});this.world.removeRigidBody(c.body);this.coins.splice(i,1);}
  }
  return this.events;
 }
 snapshot(){return {schema:1,time:this.time,phase:this.phase,cycles:this.cycles,nextId:this.nextId,stage:this.stage,pending:structuredClone(this.pending),ledger:{...this.ledger},coins:this.coins.map(c=>({id:c.id,kind:c.kind,origin:c.origin,...vec(c.body.translation()),rotation:quat(c.body.rotation()),velocity:vec(c.body.linvel()),angular:vec(c.body.angvel()),exit:c.exit,tower:c.tower,sleeping:c.body.isSleeping()}))};}
 restore(s){
  if(s.schema!==1||!Array.isArray(s.coins)||s.coins.length>MAX_BODIES||!Array.isArray(s.pending)||s.pending.length>12)throw Error('Invalid pusher save');
  for(const c of s.coins)if(![c.x,c.y,c.z,c.rotation?.x,c.rotation?.y,c.rotation?.z,c.rotation?.w,c.velocity?.x,c.velocity?.y,c.velocity?.z,c.angular?.x,c.angular?.y,c.angular?.z].every(Number.isFinite))throw Error('Invalid saved body');
  for(const key of ['time','phase','cycles','nextId','stage']){if(!Number.isFinite(s[key]))throw Error('Invalid saved timing');this[key]=s[key];}
  if(!['initial','inserted','front','side'].every(k=>Number.isSafeInteger(s.ledger?.[k])&&s.ledger[k]>=0))throw Error('Invalid ledger');
  if(s.stage<0||s.stage>=STAGES.length||!Number.isInteger(s.stage)||s.cycles<0||s.cycles>4||s.phase<0||s.phase>=Math.PI*2)throw Error('Invalid saved phase');
  for(const item of s.pending)if(!Number.isFinite(item.at)||!Number.isFinite(item.x)||Math.abs(item.x)>3.3||!['coin','ball'].includes(item.kind))throw Error('Invalid pending input');
  if(new Set(s.coins.map(c=>c.id)).size!==s.coins.length)throw Error('Duplicate body id');
  this.ledger={...s.ledger};this.pending=structuredClone(s.pending);s.coins.forEach(c=>this.add(c));
  this.pusher.setTranslation({x:0,y:.25,z:-3.6+1.15*(1-Math.cos(this.phase))/2},true);
  if(this.inventoryError()!==0)throw Error('Inventory mismatch');
 }
 inventoryError(){return this.ledger.initial+this.ledger.inserted-this.ledger.front-this.ledger.side-this.coins.length;}
 dispose(){this.queue.free();this.world.free();}
}
