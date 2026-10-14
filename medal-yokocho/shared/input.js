export function relativePointer(element,onMove){
 let pointer=null,last=null;
 const down=e=>{if(pointer!==null||(e.pointerType==='mouse'&&e.button!==0))return;pointer=e.pointerId;last={x:e.clientX,y:e.clientY};element.setPointerCapture(pointer);e.preventDefault()};
 const move=e=>{if(e.pointerId!==pointer)return;const dx=e.clientX-last.x,dy=e.clientY-last.y;last={x:e.clientX,y:e.clientY};onMove(dx,dy);e.preventDefault()};
 const end=e=>{if(e.pointerId===pointer){pointer=null;last=null}};
 element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);for(const name of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(name,end);
 return ()=>{element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);for(const name of ['pointerup','pointercancel','lostpointercapture'])element.removeEventListener(name,end)};
}
export function actionButton(button,act){let last=-Infinity;const down=e=>{if(e.pointerType==='mouse'&&e.button!==0)return;last=performance.now();e.preventDefault();act()};const click=()=>{if(performance.now()-last>600)act()};button.addEventListener('pointerdown',down);button.addEventListener('click',click);return ()=>{button.removeEventListener('pointerdown',down);button.removeEventListener('click',click)}}
