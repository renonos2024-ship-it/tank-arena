import fs from 'node:fs';import {performance} from 'node:perf_hooks';import {initPhysics,PusherPhysics,STEP} from '../medal-yokocho/pusher-3d/physics.js';
await initPhysics();const results=[];
for(const mode of ['idle','active']){const p=new PusherPhysics();const started=performance.now();let costs=0,rejected=0,restores=0,maximum=p.coins.length,maxStepMs=0;const samples=[];
 for(let i=0;i<1800/STEP;i++){
  if(mode==='active'&&i%180===0){const cost=[1,3,5][Math.floor(i/180)%3];if(p.insert(cost,Math.sin(i*.003)*2.9))costs+=cost;else rejected++;}
  const t=performance.now();p.step();const ms=performance.now()-t;maxStepMs=Math.max(maxStepMs,ms);if(i%60===0)samples.push(ms);maximum=Math.max(maximum,p.coins.length);
  if(p.inventoryError()!==0)throw Error('Ledger violation');
 }
 const sorted=samples.sort((a,b)=>a-b);results.push({mode,simulatedSeconds:1800,wallSeconds:(performance.now()-started)/1000,inputCosts:costs,rejected,maxBodies:maximum,ledger:p.ledger,remaining:p.coins.length,inventoryError:p.inventoryError(),maxStepMs,p95SampledStepMs:sorted[Math.floor(sorted.length*.95)],note:'Node headless physical simulation, not browser rendering FPS or iPhone 30-minute play.'});p.dispose();
}
fs.writeFileSync('docs/renewal/physics-soak.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
