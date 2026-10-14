import * as THREE from 'three';
import {initPhysics,PusherPhysics,RADIUS,HALF_HEIGHT,STEP,MAX_BODIES,STAGES} from './physics.js';
import {relativePointer,actionButton} from '../shared/input.js';
import {ArcadeAudio} from '../shared/audio.js';
const $=id=>document.getElementById(id),canvas=$('scene');
let sim,renderer,audio,running=false,failed=false,disposed=false,accumulator=0,last=performance.now(),lastSave=0,lastHud=0,position=0,cost=1,earned=0,spent=0;
const store=window.YoimachiBank;
const settings=store?.read().settings||{bgm:.25,se:.5,quality:'auto'};
const cleanup=[];
function error(e){running=false;failed=true;$('intro').classList.remove('hidden');$('start').disabled=true;$('start').textContent='停止中';$('bootStatus').textContent=e?.message||String(e);$('hint').textContent='データを保護して停止しました。再読み込みで再試行できます。';console.error(e);}
function save(delta=0,refill=false){
 if(!store||!sim)throw Error('保存領域を利用できません');
 store.update(s=>{s.wallet+=delta;s.games.pusher={physics:sim.snapshot(),position,cost,earned,spent};s.settings={...settings};if(refill)s.stats.refills++;});
 $('saveState').textContent='保存済み';lastSave=sim.time;hud();
}
function hud(){$('wallet').textContent=store.balance().toLocaleString('ja-JP');$('earned').textContent=earned;$('spent').textContent=spent;$('inventory').textContent=sim.coins.length;$('side').textContent=sim.ledger.side;}
async function boot(){
 if(!store)throw Error('保存データを読めないため開始できません');
 await initPhysics();const saved=store.read().games.pusher;
 if(saved&&(!Number.isFinite(saved.position)||Math.abs(saved.position)>3.3||![1,3,5].includes(saved.cost)||!Number.isSafeInteger(saved.earned)||!Number.isSafeInteger(saved.spent)))throw Error('保存されたゲーム情報が不正です');
 sim=new PusherPhysics(saved?.physics);position=saved?.position??0;cost=saved?.cost??1;earned=saved?.earned??0;spent=saved?.spent??0;
 audio=new ArcadeAudio(settings);
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setClearColor('#152431');renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
 const scene=new THREE.Scene();scene.fog=new THREE.Fog('#152431',27,50);
 const camera=new THREE.PerspectiveCamera(40,1,.1,80);camera.position.set(0,10.7,13);camera.lookAt(0,.4,-.1);
 scene.add(new THREE.HemisphereLight('#cee6f5','#423123',3.2));const key=new THREE.DirectionalLight('#ffdfa5',3.7);key.position.set(-4,9,6);scene.add(key);const rim=new THREE.DirectionalLight('#76b7dd',2.3);rim.position.set(5,4,-5);scene.add(rim);
 const materials=[];const mat=(color,metalness=.1,roughness=.55,extra={})=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});materials.push(m);return m};
 const wood=mat('#503b32'),steel=mat('#708b99',.7,.3),trim=mat('#c69c5a',.7,.29),deck=mat('#324b58',.4,.36),dark=mat('#07131d'),coinSide=mat('#c08a36',.75,.24),coinFace=mat('#f4cf7c',.7,.3),silver=mat('#afd2dc',.8,.24),glass=mat('#b7e2ef',.1,.12,{transparent:true,opacity:.11,depthWrite:false,side:THREE.DoubleSide});
 const geometries=[];function box(w,h,d,x,y,z,material){const g=new THREE.BoxGeometry(w,h,d);geometries.push(g);const m=new THREE.Mesh(g,material);m.position.set(x,y,z);scene.add(m);return m;}
 box(8.5,.6,9,0,-1.1,-.1,wood);box(7.6,.3,7.6,0,-.15,-.2,deck); // exactly matches physical floor
 for(const x of [-3.9,3.9])box(.2,.6,5.4,x,.3,-1.3,steel);
 box(7.5,.9,.24,0,1.03,-2.08,deck);
 const plate=box(7.5,.5,3,0,.25,-3.6,steel);box(8,.12,.12,0,-.02,3.64,trim);
 box(7.7,.08,1.1,0,-.95,4.1,dark);box(8.25,.13,.18,0,-.48,4.65,trim);
 for(const x of [-4.2,4.2]){box(.24,2.3,8.9,x,.2,-.1,wood);box(.04,1.8,7.9,x*.96,.65,-.2,glass);box(.1,.1,8.6,x,1.4,-.1,trim);box(.38,.05,7.5,x*.94,-.55,-.1,dark);}
 box(8.7,3.3,.3,0,1,-4.5,wood);box(7.8,2.6,.06,0,1.1,-4.31,dark);
 const lightMat=mat('#e3bd76',.25,.5,{emissive:'#daa455',emissiveIntensity:1.1});box(7.9,.07,.08,0,2.5,-4.2,lightMat);
 const cylinder=new THREE.CylinderGeometry(RADIUS,RADIUS,HALF_HEIGHT*2,24);geometries.push(cylinder);
 const medals=new THREE.InstancedMesh(cylinder,[coinSide,coinFace,coinFace],MAX_BODIES);medals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);medals.frustumCulled=false;scene.add(medals);
 const ballGeo=new THREE.SphereGeometry(.34,20,14);geometries.push(ballGeo);const balls=new THREE.InstancedMesh(ballGeo,silver,MAX_BODIES);balls.instanceMatrix.setUsage(THREE.DynamicDrawUsage);balls.frustumCulled=false;scene.add(balls);
 const marker=box(.55,.12,.7,position,2.1,-1.6,trim);const guide=box(.025,1.25,.025,position,1.3,-1.6,lightMat);
 const dummy=new THREE.Object3D();const resize=()=>{const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;renderer.setPixelRatio(settings.quality==='low'?1:Math.min(devicePixelRatio||1,1.6));renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;const distance=Math.max(15,5.1/(Math.tan(THREE.MathUtils.degToRad(20))*camera.aspect));camera.position.set(0,distance*.62,distance*.76);camera.lookAt(0,.25,-.1);camera.updateProjectionMatrix();};
 const observer=new ResizeObserver(resize);observer.observe(canvas);cleanup.push(()=>observer.disconnect());resize();
 function render(){let count=0,ballCount=0;for(const c of sim.coins){dummy.position.copy(c.body.translation());dummy.quaternion.copy(c.body.rotation());dummy.updateMatrix();(c.kind==='ball'?balls:medals).setMatrixAt(c.kind==='ball'?ballCount++:count++,dummy.matrix)}medals.count=count;balls.count=ballCount;medals.instanceMatrix.needsUpdate=true;balls.instanceMatrix.needsUpdate=true;plate.position.copy(sim.pusher.translation());marker.position.x=position;guide.position.x=position;renderer.render(scene,camera);}
 const aim=dx=>{position=THREE.MathUtils.clamp(position+dx/canvas.clientWidth*7.6,-3.3,3.3)};cleanup.push(relativePointer(canvas,aim));
 function launch(){if(!running||failed)return;try{if(store.balance()<cost){$('hint').textContent='メダルが足りません。無料補充で続けられます。';return}if(performance.now()<(launch.next||0))return;if(!sim.insert(cost,position)){$('hint').textContent='盤面がいっぱい。無料で押し板を再稼働します。';save();return}launch.next=performance.now()+350;spent+=cost;save(-cost);$('hint').textContent=cost===5?'重量球が塔の足元を押します。手前落下で1枚。':`${cost}枚を投入。押し板の前進を見てみよう。`;}catch(e){error(e)}}
 cleanup.push(actionButton($('launch'),launch));
 function setCost(value){cost=value;document.querySelectorAll('[data-cost]').forEach(b=>{const selected=+b.dataset.cost===cost;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))})}setCost(cost);
 document.querySelectorAll('[data-cost]').forEach(b=>b.addEventListener('click',()=>{setCost(+b.dataset.cost);try{save()}catch(e){error(e)}}));
 const start=async()=>{if(failed)return;try{await audio.start()}catch{}running=true;last=performance.now();accumulator=0;$('intro').classList.add('hidden');$('pause').textContent='一時停止';$('hint').textContent='左右にドラッグして、投入位置を決めよう。';};
 const pause=()=>{running=false;audio.pause();$('pause').textContent='再開';try{save()}catch(e){error(e)}};
 $('start').addEventListener('click',start);$('pause').addEventListener('click',()=>running?pause():start());
 $('refill').addEventListener('click',()=>{if(failed)return;try{save(30,true);$('hint').textContent='無料で30枚を補充しました。'}catch(e){error(e)}});
 $('stage').value=String(sim.stage);const stageName=()=>{$('stageName').textContent=STAGES[sim.stage].name;};stageName();$('stage').addEventListener('change',()=>{sim.stage=+$('stage').value;stageName();try{save()}catch(e){error(e)}});
 for(const id of ['bgm','se','quality']){$(id).value=settings[id];$(id).addEventListener('input',()=>{settings[id]=id==='quality'?$(id).value:+$(id).value;if(id==='quality')resize();try{save()}catch(e){error(e)}})}
 $('export').addEventListener('click',()=>{try{save();const url=URL.createObjectURL(new Blob([JSON.stringify(store.read(),null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='yoimachi-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){error(e)}});
 const keydown=e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName))return;if(e.code==='ArrowLeft'){aim(-15);e.preventDefault()}if(e.code==='ArrowRight'){aim(15);e.preventDefault()}if(e.code==='Space'){e.preventDefault();launch()}if(e.code==='KeyP')running?pause():start()};addEventListener('keydown',keydown);cleanup.push(()=>removeEventListener('keydown',keydown));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();error(Error('描画が中断しました。保存済みです。ページを再読み込みしてください。'))});
 addEventListener('pagehide',()=>{pause();disposed=true;cleanup.forEach(f=>f());audio.dispose();sim.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose()},{once:true});
 addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
 let fpsStart=performance.now(),frames=0;const measurements=[];
 function frame(now){if(disposed)return;try{const dt=Math.min(.1,(now-last)/1000);last=now;if(running&&!document.hidden){accumulator+=dt;let steps=0;while(accumulator>=STEP&&steps++<6){const events=sim.step();let payout=0;for(const e of events){audio.effect(e.type,e.strength);if(e.type==='front'){payout++;earned++;}if(e.type==='collapse')$('hint').textContent='塔が崩れ始めました。手前へ押し出そう。';}if(payout){save(payout);$('hint').textContent=`手前に${payout}枚落下。獲得しました。`;}accumulator-=STEP;}if(sim.time-lastSave>=3)save();if(sim.time-lastHud>.25){hud();lastHud=sim.time;}}render();frames++;if(now-fpsStart>=1000){const fps=frames*1000/(now-fpsStart);measurements.push({fps,bodies:sim.coins.length,at:sim.time});if(measurements.length>1800)measurements.shift();$('diagnostic').textContent=`表示 ${fps.toFixed(0)}fps · 物理 ${sim.coins.length}体`;frames=0;fpsStart=now;}requestAnimationFrame(frame);}catch(e){error(e)}}
 window.__yoimachiPusher={snapshot:()=>sim.snapshot(),measurements:()=>structuredClone(measurements),inventoryError:()=>sim.inventoryError()};
 hud();render();save();$('start').disabled=false;$('start').textContent=saved?'続きから遊ぶ':'遊びはじめる';$('bootStatus').textContent='相対ドラッグ＋独立した投入ボタン';requestAnimationFrame(frame);
}
boot().catch(error);
