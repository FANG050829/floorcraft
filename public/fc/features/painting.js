/**
 * features/painting.js — 表面绘画功能（在任意家具模型的任意面涂色/擦除）
 *
 * 工作原理：
 * - 选中家具后，点击工具条的「表面绘画」按钮进入绘画模式
 * - 鼠标在 3D 视图中按下并拖动时，用 Raycaster 命中家具的 mesh
 * - 命中点的 UV 坐标 → 映射到一个 256×256 的 CanvasTexture
 * - 在该 canvas 上绘制圆形笔触，实时更新贴图
 * - 擦除模式用 destination-out 合成模式恢复底色
 *
 * 依赖：THREE, items, renderer, camera, $, objTools, showToast, BRAND
 */

/* ── CSS（注入到 head）── */
(function injectPaintCSS(){
  if(document.getElementById('paintCSS'))return;
  const s=document.createElement('style');s.id='paintCSS';s.textContent=`
#paintTools{display:none;position:absolute;left:50%;bottom:40px;transform:translateX(-50%);z-index:9;
  background:var(--ink);border:1px solid #000;box-shadow:3px 3px 0 rgba(38,35,29,.25);padding:6px;gap:4px;align-items:center}
#paintTools.show{display:flex}
#paintTools .pl{font-size:10px;color:var(--paper);opacity:.7;letter-spacing:.1em;padding:0 4px}
#paintTools .psw{width:22px;height:22px;border:2px solid transparent;cursor:pointer;flex:none}
#paintTools .psw.on{border-color:#fff}
#paintTools .psw.cust{position:relative;background:conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)}
#paintTools .psw.cust input{position:absolute;inset:0;opacity:0;cursor:pointer}
#paintTools .psz{display:flex;align-items:center;gap:3px;padding:0 4px}
#paintTools .psz button{width:20px;height:20px;border:1px solid rgba(255,255,255,.2);background:transparent;color:var(--paper);font-size:9px}
#paintTools .psz button.on{background:var(--brand);border-color:var(--brand)}
#paintTools .pmode{display:flex;border:1px solid rgba(255,255,255,.2)}
#paintTools .pmode button{padding:4px 8px;font-size:10px;color:var(--paper);background:transparent}
#paintTools .pmode button.on{background:var(--brand)}
#paintTools .exit{font-size:10px;color:var(--paper);opacity:.7;padding:0 6px;border-left:1px solid rgba(255,255,255,.15);cursor:pointer}
#paintTools .exit:hover{opacity:1;color:var(--brand)}
#paintSwatches{display:flex;gap:2px}
`;
  document.head.appendChild(s);
})();

/* ── 等待 DOM 中出现 objTools 后注入绘画按钮 ── */
function setupPainting(){
  const paintTools=document.createElement('div');paintTools.id='paintTools';
  paintTools.innerHTML=`
    <span class="pl">表面绘画</span>
    <div class="pmode" id="paintMode">
      <button data-m="paint" class="on">涂色</button>
      <button data-m="erase">擦除</button>
    </div>
    <div id="paintSwatches"></div>
    <div class="psw cust" title="自定义颜色"><input type="color" id="paintCust" value="#C75B39"></div>
    <div class="psz" id="paintSize">
      <button data-s="6">小</button>
      <button data-s="14" class="on">中</button>
      <button data-s="26">大</button>
    </div>
    <span class="exit" id="paintExit">退出 ✕</span>
  `;
  document.body.appendChild(paintTools);

  const paintSwatches=$('paintSwatches');
  const paintCust=$('paintCust');
  const paintExit=$('paintExit');
  let paintMode='paint',paintColor=BRAND,paintSize=14,paintActive=false;
  const PAINT_PRESETS=['#C75B39','#26231D','#C09A68','#6E543A','#F4EFE4','#4C6B45','#3B3B3B','#FFFFFF','#1F7A4D','#D4A017','#8A4B6B','#C8DCE0'];
  PAINT_PRESETS.forEach((c,i)=>{
    const b=document.createElement('div');b.className='psw'+(i===0?' on':'');b.style.background=c;b.dataset.c=c;
    b.onclick=()=>{paintColor=c;paintSwatches.querySelectorAll('.psw').forEach(x=>x.classList.remove('on'));b.classList.add('on');paintMode='paint';updatePaintMode();};
    paintSwatches.appendChild(b);
  });
  paintCust.addEventListener('input',()=>{paintColor=paintCust.value;paintSwatches.querySelectorAll('.psw').forEach(x=>x.classList.remove('on'));paintMode='paint';updatePaintMode();});
  $('paintSize').querySelectorAll('button').forEach(b=>b.onclick=()=>{
    paintSize=+b.dataset.s;
    $('paintSize').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
  });
  $('paintMode').querySelectorAll('button').forEach(b=>b.onclick=()=>{paintMode=b.dataset.m;updatePaintMode();});
  function updatePaintMode(){$('paintMode').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.m===paintMode));}
  paintExit.onclick=exitPaint;

  function enterPaint(){
    paintActive=true;paintTools.classList.add('show');
    const vpEl=$('viewport');if(vpEl)vpEl.style.cursor='crosshair';
    showToast('绘画模式：在 3D 视图中按住左键涂抹家具表面');
  }
  function exitPaint(){
    paintActive=false;paintTools.classList.remove('show');
    const vpEl=$('viewport');if(vpEl)vpEl.style.cursor='';
  }

  /* 在选中工具条添加「表面绘画」按钮 */
  const objToolsEl=$('objTools');
  if(objToolsEl){
    const pb=document.createElement('button');pb.id='otPaint';pb.title='表面绘画';
    pb.innerHTML='<svg class="ic" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7L12 2.5 7.5 6 6 13l12 6"/></svg>';
    pb.onclick=()=>{if(paintActive)exitPaint();else enterPaint();};
    objToolsEl.insertBefore(pb,objToolsEl.firstChild);
  }

  /* 绘画射线投射 */
  const paintRay=new THREE.Raycaster();
  const paintUV=new THREE.Vector2();
  let paintDown=false;
  const canvasEl=renderer.domElement;
  canvasEl.addEventListener('pointerdown',e=>{if(!paintActive)return;paintDown=true;doPaintAt(e);});
  canvasEl.addEventListener('pointermove',e=>{if(paintActive&&paintDown)doPaintAt(e);});
  canvasEl.addEventListener('pointerup',()=>paintDown=false);
  canvasEl.addEventListener('pointerleave',()=>paintDown=false);
  function doPaintAt(e){
    const rect=canvasEl.getBoundingClientRect();
    paintUV.x=((e.clientX-rect.left)/rect.width)*2-1;
    paintUV.y=-((e.clientY-rect.top)/rect.height)*2+1;
    paintRay.setFromCamera(paintUV,camera);
    const objs=[];
    items.forEach(it=>it.group.traverse(o=>{if(o.isMesh)objs.push(o);}));
    const hits=paintRay.intersectObjects(objs,false);
    if(!hits.length)return;
    const hit=hits[0];
    if(!hit.uv)return;
    const mesh=hit.object;
    if(!mesh.userData.paintTex){
      const mat=mesh.material;
      const cv=document.createElement('canvas');cv.width=cv.height=256;
      const g=cv.getContext('2d');
      const baseColor=mat.color?('#'+mat.color.getHexString()):'#cccccc';
      g.fillStyle=baseColor;g.fillRect(0,0,256,256);
      const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
      mat.map=tex;mat.needsUpdate=true;
      mesh.userData.paintTex={cv,g,tex};
    }
    const {cv,g,tex}=mesh.userData.paintTex;
    const u=hit.uv.x,v=hit.uv.y;
    const px=u*cv.width, py=(1-v)*cv.height;
    g.globalCompositeOperation=paintMode==='erase'?'destination-out':'source-over';
    g.fillStyle=paintColor;g.strokeStyle=paintColor;
    g.beginPath();g.arc(px,py,paintSize/2,0,Math.PI*2);g.fill();
    g.globalCompositeOperation='source-over';
    tex.needsUpdate=true;
  }
}

/* objTools 在 init 中已创建，这里延迟到 init 完成后挂载 */
if(document.getElementById('objTools')){
  setupPainting();
}else{
  /* init 尚未创建 objTools，监听 DOM 插入 */
  const obs=new MutationObserver(()=>{if(document.getElementById('objTools')){setupPainting();obs.disconnect();}});
  obs.observe(document.body,{childList:true,subtree:true});
}
