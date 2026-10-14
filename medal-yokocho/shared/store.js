/* Shared versioned save. Legacy balance is read only during first migration. */
(function(root){
'use strict';
const KEY='yoimachi_save_v2', BACKUP=KEY+'_backup', LEGACY='yoimachi_medal_bank_v1';
const valid=x=>x&&x.version===2&&Number.isSafeInteger(x.wallet)&&x.wallet>=0&&x.wallet<=1e12&&x.games&&typeof x.games==='object'&&!Array.isArray(x.games)&&x.settings&&typeof x.settings==='object'&&x.stats&&typeof x.stats==='object';
function create(storage,onError=()=>{}){
 function read(){
  const raw=storage.getItem(KEY);
  if(raw!==null){try{const x=JSON.parse(raw);if(valid(x))return x}catch{} const backup=storage.getItem(BACKUP);try{const x=JSON.parse(backup);if(valid(x)){onError('バックアップから復元しました');return x}}catch{} throw Error('保存データを読み込めません。元データを保護するため停止しました。');}
  const legacy=storage.getItem(LEGACY), n=legacy!==null&&legacy.trim()!==''?Number(legacy):120;
  return {version:2,revision:0,wallet:Number.isSafeInteger(n)&&n>=0?n:120,games:{},settings:{bgm:.25,se:.5,quality:'auto'},stats:{refills:0},collection:{}};
 }
 function update(fn){const current=read(),next=structuredClone(current);fn(next);if(!valid(next))throw Error('Invalid save transaction');next.revision=current.revision+1;const raw=JSON.stringify(next);if(storage.getItem(KEY)!==null)storage.setItem(BACKUP,JSON.stringify(current));storage.setItem(KEY,raw);return next;}
 return {read,update,balance:()=>read().wallet,adjust:(delta)=>{if(!Number.isSafeInteger(delta))throw Error('Invalid medal delta');return update(s=>{s.wallet+=delta}).wallet},saveGame:(id,data)=>update(s=>{s.games[id]=data})};
}
root.YoimachiStore={create,KEY,BACKUP};
if(typeof window!=='undefined'){
 const error=message=>{let el=document.getElementById('save-warning');if(!el){el=document.createElement('div');el.id='save-warning';el.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#6d2535;color:white;padding:12px;z-index:99999;font:13px system-ui';document.body.append(el)}el.textContent=message};
 try{root.YoimachiBank=create(localStorage,error);root.YoimachiBank.read()}catch(e){error(e.message);root.YoimachiBank=null;}
 root.YoimachiSaveError=error;
 // One interactive game tab at a time; holds a browser-managed origin lock.
 if(navigator.locks&&!location.pathname.includes('arcade-3d')){
  let release,held=false,generation=0;
  const blocker=document.createElement('div');blocker.style.cssText='position:fixed;inset:0;background:#0a1527ee;z-index:99998;display:grid;place-items:center;color:#ffe2aa;font:16px system-ui;text-align:center;padding:32px';blocker.textContent='ほかのタブでプレイ中です。そちらを閉じると、この台で再開できます。';
  const acquire=()=>{const token=++generation;document.body.append(blocker);navigator.locks.request('yoimachi-play',async()=>{if(token!==generation)return;held=true;blocker.remove();await new Promise(r=>release=r);held=false})};
  acquire();addEventListener('pagehide',()=>{generation++;release?.()});addEventListener('pageshow',e=>{if(e.persisted&&!held)acquire()});
 }
}
})(globalThis);
