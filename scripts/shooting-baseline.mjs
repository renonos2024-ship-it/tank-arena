import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const path='medal-yokocho/shooting-3d/index.html', source=fs.readFileSync(path,'utf8');
const slice=source.slice(source.indexOf('const baseNames='),source.indexOf("const BANK_KEY="));
if(!slice.includes('function resolveHit'))throw Error('Source contract changed');
let seed=20261014;const random=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296};
const ctx=vm.createContext({Math:Object.assign(Object.create(Math),{random}),clamp:(x,a,b)=>Math.max(a,Math.min(b,x))});
vm.runInContext(slice+';globalThis.rules={types,resolveHit,nextPrizeType};',ctx);
const {types,resolveHit,nextPrizeType}=ctx.rules;
const profiles=[{name:'beginner',hit:.45,q:[.2,1]},{name:'standard',hit:.68,q:[.05,.75]},{name:'skilled',hit:.88,q:[0,.4]}];
const rows=[];
for(const model of profiles)for(const cost of [1,3,5]){
 const N=100000;let target=nextPrizeType(),hp=target.hp,paid=0,rare=0,lucky=0,crit=0,bank=120,refills=0,min=120,maximum=120,hits=0;
 const trajectory=[];
 for(let i=0;i<N;i++){
  if(bank<cost){bank+=30;refills++}bank-=cost;
  if(random()<model.hit){hits++;const quality=model.q[0]+random()*(model.q[1]-model.q[0]);const r=resolveHit(target,{cost,power:cost},quality,random);hp-=r.power;if(r.lucky)lucky++;if(r.critical)crit++;if(hp<=0){paid+=target.value;bank+=target.value;if(target.value>=40)rare+=target.value;target=nextPrizeType();hp=target.hp;}}
  min=Math.min(min,bank);maximum=Math.max(maximum,bank);if((i+1)%10000===0)trajectory.push(bank);
 }
 rows.push({profile:model.name,cost,shots:N,input:N*cost,paid,rtp:paid/(N*cost),hits,critical:crit,lucky,rarePayout:rare,refills,endingBank:bank,minBank:min,maxBank:maximum,trajectory,unfinished:{value:target.value,hp}});
}
const perPrize=types.map(t=>({name:t.name,value:t.value,hp:t.hp}));
fs.writeFileSync('docs/renewal/shooting-baseline.json',JSON.stringify({seed:20261014,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),totalShots:900000,assumptions:'Hypothetical fixed hit/precision profiles; source damage and target weights unchanged; target persistence until defeat; no stage geometry, session abandonment, events or JP. Not an observed player RTP or full required economy validation.',profiles,rows,perPrize},null,2)+'\n');
console.table(rows.map(({profile,cost,rtp,refills})=>({profile,cost,rtpPercent:(rtp*100).toFixed(2),refills})));
