#!/usr/bin/env python3
"""Add 3D library thumbnails + custom lighting system + material upgrades to floorcraft.html.
Preserves CRLF line endings. Idempotent: checks if already applied."""
import sys

PATH = 'public/floorcraft.html'
with open(PATH, 'r', newline='', encoding='utf-8') as f:
    src = f.read()

LE = '\r\n' if '\r\n' in src else '\n'
MARK = '<!--ENH_V2-->'

if MARK in src:
    print("Already applied. Skipping.")
    sys.exit(0)

# ─────────────────────────────────────────────────────────
# CSS additions
# ─────────────────────────────────────────────────────────
CSS = '''/*ENH_V2*/
/* ====== 3D 缩略图 ====== */
.lib-item .threed-wrap{position:relative;width:44px;height:44px;flex:none;border-radius:3px;overflow:hidden;background:linear-gradient(160deg,#F1EBDD,#E7DFC9)}
.lib-item .threed-wrap canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block}

/* ====== 光源面板 ====== */
#lightPop{position:absolute;top:60px;right:70px;z-index:60;background:rgba(252,250,244,.97);border:1px solid var(--ink);padding:14px;width:268px;display:none;box-shadow:6px 6px 0 rgba(38,35,29,.08)}
#lightPop.open{display:block;animation:popin .18s ease}
#lightPop h5{font-size:11px;letter-spacing:.2em;color:var(--ink2);margin-bottom:10px;font-weight:500;display:flex;justify-content:space-between;align-items:center}
#lightPop h5 button{font-size:10px;letter-spacing:.08em;border:1px solid var(--line);padding:3px 8px;color:var(--ink2)}
#lightPop h5 button:hover{border-color:var(--brand);color:var(--brand)}
.lrow{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--ink2);margin-bottom:9px}
.lrow span{width:42px;flex:none;letter-spacing:.06em}
.lrow input[type=range]{flex:1;accent-color:var(--brand);height:16px}
.lrow b{width:48px;flex:none;text-align:right;font-size:11px;color:var(--ink)}
.lrow input[type=color]{width:30px;height:22px;border:1px solid var(--line);background:none;padding:0;cursor:pointer;flex:none}
.lseg{display:flex;border:1px solid var(--line);margin-bottom:9px}
.lseg button{flex:1;padding:6px 2px;font-size:11px;letter-spacing:.05em;color:var(--ink2)}
.lseg button.on{background:var(--ink);color:var(--paper)}
.lightList{max-height:130px;overflow-y:auto;border:1px solid var(--line);background:rgba(255,255,255,.4);margin-bottom:8px}
.lightList:empty::before{content:'还没有添加光源 · 下方可新增';display:block;padding:14px;text-align:center;font-size:11px;color:var(--ink2)}
.litRow{display:flex;align-items:center;gap:7px;padding:6px 8px;cursor:pointer;border-left:2px solid transparent;font-size:11px}
.litRow:hover{background:rgba(38,35,29,.05)}
.litRow.on{background:rgba(38,35,29,.07);border-left-color:var(--brand)}
.litRow .swDot{width:12px;height:12px;border:1px solid rgba(0,0,0,.2);flex:none}
.litRow span{flex:1}
.litRow button{width:18px;height:18px;padding:2px;border:1px solid transparent;color:var(--ink2)}
.litRow button:hover{border-color:var(--warn);color:var(--warn)}
.laddRow{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:8px}
.laddRow button{font-size:10.5px;padding:6px 2px;border:1px solid var(--ink);background:rgba(255,255,255,.5);letter-spacing:.03em;transition:.15s}
.laddRow button:hover{background:var(--ink);color:var(--paper)}
.lightGizmo{position:absolute;width:14px;height:14px;transform:translate(-50%,-50%);pointer-events:none;z-index:6}
.lightGizmo .ring{position:absolute;inset:0;border:2px solid currentColor;border-radius:50%;animation:lglow 1.6s ease-in-out infinite}
.lightGizmo .core{position:absolute;inset:4px;border-radius:50%;background:currentColor}
@keyframes lglow{0%,100%{box-shadow:0 0 0 0 currentColor;opacity:.85}50%{box-shadow:0 0 8px 2px currentColor;opacity:1}}
/*ENH_V2_END*/
'''
# Insert before the LAST </style>
last_style = src.rfind('</style>')
src = src[:last_style] + CSS + src[last_style:]

# ─────────────────────────────────────────────────────────
# Topbar: add 光源 button before 消防疏散
# ─────────────────────────────────────────────────────────
BTN = ('<button class="tbtn" id="lightBtn">'
       '<svg class="ic" viewBox="0 0 24 24"><path d="M9 21h6M10 17h4M12 3a6 6 0 0 0-4 10.5c.6.7 1 1.5 1 2.5h6c0-1 .4-1.8 1-2.5A6 6 0 0 0 12 3z"/></svg>'
       '<span>光源</span></button>')
src = src.replace('<button class="tbtn" id="fireBtn">', BTN + '<button class="tbtn" id="fireBtn">', 1)

# ─────────────────────────────────────────────────────────
# Light popup HTML — after roomPop
# ─────────────────────────────────────────────────────────
POP = '''
<div id="lightPop">
  <h5>场景光源 LIGHTING <button id="lightReset">重置</button></h5>
  <div class="lseg" id="lAmbientSeg"><button data-a="0.4">柔和</button><button data-a="0.7" class="on">日常</button><button data-a="1.0">明亮</button></div>
  <div class="lrow"><span>环境光</span><input type="range" id="lAmb" min="0" max="1.5" step="0.05" value="0.7"><b class="num" id="lAmbV">0.70</b></div>
  <div class="lrow"><span>太阳光</span><input type="range" id="lSun" min="0" max="5" step="0.1" value="3.0"><b class="num" id="lSunV">3.0</b></div>
  <div class="lrow"><span>太阳色</span><input type="color" id="lSunC" value="#fff0dc"><b class="num" id="lSunCV">暖白</b></div>
  <div class="lrow"><span>阴影</span><input type="range" id="lShadow" min="0" max="1" step="0.05" value="1"><b class="num" id="lShadowV">100%</b></div>
  <h5 style="margin-top:6px">点光源 POINTS</h5>
  <div class="lightList" id="lightList"></div>
  <div class="laddRow" id="lAddRow">
    <button data-t="warm">＋ 暖光</button>
    <button data-t="cool">＋ 冷光</button>
    <button data-t="brand">＋ 品牌色</button>
  </div>
  <p class="rnote">点击「＋」新增点光源，拖动 3D 视图中的彩色圆点调整位置；点击光源项可编辑强度/颜色/范围。</p>
</div>
'''
anchor = '<p class="rnote">调整即时生效：墙体 / 地面 / 店招 / 安全出口 / 疏散动线随尺寸重建，家具自动收进新边界；两层时楼梯位置自动开洞并生成护栏。</p>' + LE + '</div>'
src = src.replace(anchor, anchor + POP.replace('\n', LE), 1)

# ─────────────────────────────────────────────────────────
# JS block (3D thumbnails + lighting + material upgrades)
# ─────────────────────────────────────────────────────────
JS = r'''
/* ═══════ 增量功能 V2 ════════ */
/* ── 材质质感升级：为木质添加程序化纹理 ── */
(function(){
  function woodTex(baseColor){
    const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
    g.fillStyle=baseColor;g.fillRect(0,0,128,128);
    for(let i=0;i<60;i++){g.strokeStyle='rgba(0,0,0,'+(0.03+Math.random()*0.06)+')';g.lineWidth=0.5+Math.random();
      const y=Math.random()*128;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(32,y+Math.random()*8-4,96,y+Math.random()*8-4,128,y);g.stroke();}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  if(M.wood){const t=woodTex('#C09A68');t.repeat.set(2,2);M.wood.map=t;M.wood.needsUpdate=true;}
  if(M.woodDark){const t=woodTex('#6E543A');t.repeat.set(2,2);M.woodDark.map=t;M.woodDark.needsUpdate=true;}
})();

/* ── 3D 家具库缩略图（单一共享 WebGL 渲染器，避免 context 耗尽） ── */
const thumbScene=new THREE.Scene();
thumbScene.background=new THREE.Color('#EFE9DB');
const thumbCam=new THREE.PerspectiveCamera(34,1,0.05,30);
const thumbSun=new THREE.DirectionalLight(0xfff0dc,2.2);thumbSun.position.set(2,3,2);thumbScene.add(thumbSun);
thumbScene.add(new THREE.HemisphereLight(0xfff4e2,0x8b8578,0.9));
const thumbGnd=new THREE.Mesh(new THREE.CircleGeometry(2,32),new THREE.MeshStandardMaterial({color:'#E7DFC9',roughness:.95}));
thumbGnd.rotation.x=-Math.PI/2;thumbGnd.position.y=-0.001;thumbGnd.receiveShadow=true;thumbScene.add(thumbGnd);
const thumbGroup=new THREE.Group();thumbScene.add(thumbGroup);
/* 共享渲染器：渲染到一个隐藏 canvas，再用 drawImage 拷到每个缩略图 canvas */
const thumbHidden=document.createElement('canvas');thumbHidden.width=88;thumbHidden.height=88;
const thumbR=new THREE.WebGLRenderer({canvas:thumbHidden,antialias:true,alpha:false,preserveDrawingBuffer:true});
thumbR.setPixelRatio(1);thumbR.shadowMap.enabled=true;thumbR.shadowMap.type=THREE.PCFShadowMap;
thumbR.outputColorSpace=THREE.SRGBColorSpace;
let thumbQueue=[];
function renderThumb(t,cv){
  while(thumbGroup.children.length){const m=thumbGroup.children[0];thumbGroup.remove(m);if(m.isMesh)m.geometry.dispose();}
  try{
    const g=BUILDERS[t]();
    const box=new THREE.Box3().setFromObject(g);
    const size=box.getSize(new THREE.Vector3());
    const center=box.getCenter(new THREE.Vector3());
    const maxDim=Math.max(size.x,size.y,size.z)||1;
    const scl=1.1/maxDim;
    g.scale.setScalar(scl);
    g.position.set(-center.x*scl,-box.min.y*scl,-center.z*scl);
    thumbGroup.add(g);
    thumbCam.position.set(1.6,1.2,1.9);thumbCam.lookAt(0,0.35,0);
    thumbCam.aspect=1;thumbCam.updateProjectionMatrix();
    thumbR.render(thumbScene,thumbCam);
    /* copy from hidden canvas to visible 2D thumbnail canvas */
    const ctx2=cv.getContext('2d');
    ctx2.clearRect(0,0,cv.width,cv.height);
    ctx2.drawImage(thumbHidden,0,0,88,88,0,0,cv.width,cv.height);
    g.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
    g.scale.setScalar(1);
  }catch(e){console.warn('thumb fail',t,e);}
}
function queueThumb(t,cv){
  cv.dataset.rid=cv.dataset.rid||('tr'+Math.random().toString(36).slice(2,8));
  thumbQueue.push({t,cv});
}
let thumbRAF=null;
function processThumbQueue(){
  thumbRAF=null;
  const batch=thumbQueue.splice(0,4);
  batch.forEach(({t,cv})=>renderThumb(t,cv));
  if(thumbQueue.length)thumbRAF=requestAnimationFrame(processThumbQueue);
}
function scheduleThumbs(){if(!thumbRAF)thumbRAF=requestAnimationFrame(processThumbQueue);}
/* override redrawThumbs */
redrawThumbs=function(){
  const draw=list=>list.forEach(({t,cv})=>queueThumb(t,cv));
  draw(libThumbs);draw(customThumbs);
  scheduleThumbs();
};

/* ── 光源系统 ── */
const lightPop=$('lightPop'),lightBtn=$('lightBtn'),lightList=$('lightList');
const lAmb=$('lAmb'),lAmbV=$('lAmbV'),lSun=$('lSun'),lSunV=$('lSunV');
const lSunC=$('lSunC'),lSunCV=$('lSunCV'),lShadow=$('lShadow'),lShadowV=$('lShadowV');
let pointLights=[],selLight=null;
const SUN_NAMES={'#fff0dc':'暖白','#ffffff':'纯白','#fff5e6':'米黄','#e8f0ff':'冷白','#ffd9a8':'夕阳','#cfe0ff':'月光'};
function applyAmbient(v){const hl=scene.children.find(o=>o.isHemisphereLight);if(hl)hl.intensity=v;lAmbV.textContent=v.toFixed(2);}
function applySun(v){sun.intensity=v;lSunV.textContent=v.toFixed(1);}
function applySunColor(c){sun.color.set(c);lSunCV.textContent=SUN_NAMES[c.toLowerCase()]||c.toUpperCase();}
function applyShadow(v){renderer.shadowMap.enabled=v>0.05;sun.castShadow=v>0.05;lShadowV.textContent=Math.round(v*100)+'%';}
lAmb.addEventListener('input',()=>applyAmbient(+lAmb.value));
lSun.addEventListener('input',()=>applySun(+lSun.value));
lSunC.addEventListener('input',()=>applySunColor(lSunC.value));
lShadow.addEventListener('input',()=>applyShadow(+lShadow.value));
$('lAmbientSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{
  $('lAmbientSeg').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
  lAmb.value=b.dataset.a;applyAmbient(+b.dataset.a);
});
function resetLights(){
  pointLights.forEach(pl=>{scene.remove(pl.light);scene.remove(pl.helper);});
  pointLights=[];selLight=null;renderLightList();updateLightGizmos();
  lAmb.value=0.7;applyAmbient(0.7);lSun.value=3.0;applySun(3.0);
  lSunC.value='#fff0dc';applySunColor('#fff0dc');lShadow.value=1;applyShadow(1);
  $('lAmbientSeg').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.a==='0.7'));
  showToast('光照已重置为默认');
}
$('lightReset').onclick=resetLights;
const LIGHT_PRESETS={warm:{color:'#FFD79A',intensity:8,distance:6},cool:{color:'#C8E0FF',intensity:8,distance:6},brand:{color:BRAND,intensity:10,distance:6}};
function addLight(preset){
  const cfg=LIGHT_PRESETS[preset];
  const color=cfg.color;
  const light=new THREE.PointLight(color,cfg.intensity,cfg.distance,1.5);
  const x=(Math.random()-0.5)*room.w*0.6,z=(Math.random()-0.5)*room.d*0.6,y=room.h*0.7;
  light.position.set(x,y,z);light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.bias=-0.001;
  scene.add(light);
  const helper=new THREE.Mesh(new THREE.SphereGeometry(0.08,16,12),new THREE.MeshBasicMaterial({color:color}));
  helper.position.copy(light.position);scene.add(helper);
  const id='L'+Date.now().toString(36)+Math.random().toString(36).slice(2,4);
  const pl={id,light,helper,color,_wasBrand:preset==='brand',intensity:cfg.intensity,distance:cfg.distance,x,y,z};
  pointLights.push(pl);renderLightList();updateLightGizmos();
  showToast('已添加 '+({warm:'暖光',cool:'冷光',brand:'品牌色光'}[preset])+' 点光源');
}
$('lAddRow').querySelectorAll('button').forEach(b=>b.onclick=()=>addLight(b.dataset.t));
function renderLightList(){
  lightList.innerHTML='';
  pointLights.forEach(pl=>{
    const row=document.createElement('div');row.className='litRow'+(selLight===pl?' on':'');
    const dot=document.createElement('span');dot.className='swDot';dot.style.background=pl.color;row.appendChild(dot);
    const nm=document.createElement('span');nm.textContent='点光源 · '+pl.intensity.toFixed(1);row.appendChild(nm);
    const del=document.createElement('button');del.innerHTML='×';del.title='删除';
    del.onclick=e=>{e.stopPropagation();scene.remove(pl.light);scene.remove(pl.helper);pointLights=pointLights.filter(x=>x!==pl);if(selLight===pl)selLight=null;renderLightList();updateLightGizmos();};
    row.appendChild(del);
    row.onclick=()=>{selLight=pl;renderLightList();updateLightGizmos();};
    lightList.appendChild(row);
  });
}
const gizmoLayer=document.createElement('div');gizmoLayer.style.cssText='position:absolute;inset:0;z-index:6;pointer-events:none';vp.appendChild(gizmoLayer);
function updateLightGizmos(){
  gizmoLayer.innerHTML='';
  pointLights.forEach(pl=>{
    const el=document.createElement('div');el.className='lightGizmo';el.style.color=pl.color;
    const ring=document.createElement('div');ring.className='ring';el.appendChild(ring);
    const core=document.createElement('div');core.className='core';el.appendChild(core);
    gizmoLayer.appendChild(el);pl._gizmo=el;
  });
}
function positionLightGizmos(){
  const w=vp.clientWidth,h=vp.clientHeight;
  pointLights.forEach(pl=>{
    if(!pl._gizmo)return;
    _v3.copy(pl.light.position).project(camera);
    if(_v3.z>1){pl._gizmo.style.display='none';return;}
    pl._gizmo.style.display='';
    pl._gizmo.style.left=((_v3.x*.5+.5)*w)+'px';
    pl._gizmo.style.top=((-_v3.y*.5+.5)*h)+'px';
  });
}
(function lightDrag(){
  let dragLight=null;
  vp.addEventListener('pointerdown',e=>{
    if(e.button!==0||pointLights.length===0)return;
    const rect=vp.getBoundingClientRect();
    const mx=e.clientX-rect.left,my=e.clientY-rect.top;
    let best=null,bestD=24;
    pointLights.forEach(pl=>{
      if(!pl._gizmo||pl._gizmo.style.display==='none')return;
      const gx=parseFloat(pl._gizmo.style.left),gy=parseFloat(pl._gizmo.style.top);
      const d=Math.hypot(gx-mx,gy-my);
      if(d<bestD){bestD=d;best=pl;}
    });
    if(best){dragLight=best;selLight=best;renderLightList();e.stopPropagation();}
  },true);
  const rayL=new THREE.Raycaster(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  addEventListener('pointermove',e=>{
    if(!dragLight)return;
    const rect=renderer.domElement.getBoundingClientRect();
    const nx=((e.clientX-rect.left)/rect.width)*2-1;
    const ny=-((e.clientY-rect.top)/rect.height)*2+1;
    rayL.setFromCamera({x:nx,y:ny},camera);
    const hit=new THREE.Vector3();
    if(rayL.ray.intersectPlane(groundPlane,hit)){
      dragLight.x=clamp(hit.x,-room.w/2+.2,room.w/2-.2);
      dragLight.z=clamp(hit.z,-room.d/2+.2,room.d/2-.2);
      dragLight.light.position.x=dragLight.x;dragLight.light.position.z=dragLight.z;
      dragLight.helper.position.x=dragLight.x;dragLight.helper.position.z=dragLight.z;
    }
  });
  addEventListener('pointerup',()=>dragLight=null);
})();
lightBtn.onclick=e=>{e.stopPropagation();lightPop.classList.toggle('open');brandPop.classList.remove('open');roomPop.classList.remove('open');};
addEventListener('click',e=>{if(!lightPop.contains(e.target)&&!lightBtn.contains(e.target))lightPop.classList.remove('open');});
/* brand color change syncs brand lights */
const mo=new MutationObserver(()=>{
  const bc=getComputedStyle(document.documentElement).getPropertyValue('--brand').trim();
  pointLights.forEach(pl=>{if(pl._wasBrand){pl.color=bc;pl.light.color.set(bc);pl.helper.material.color.set(bc);if(pl._gizmo)pl._gizmo.style.color=bc;}});
  renderLightList();
});
mo.observe(document.documentElement,{attributes:true,attributeFilter:['style']});
/* extra tick for gizmo positioning */
(function extraTick(){requestAnimationFrame(extraTick);positionLightGizmos();})();
'''
# Insert INSIDE init(), BEFORE the startup sequence (so redrawThumbs override
# takes effect before setColor(BRAND) runs).
# Anchor: the "/* ── 启动 ── */" comment that precedes resize(); setColor(BRAND);
anchor = "/* ── 启动 ── */"
ai = src.find(anchor)
assert ai >= 0, "startup anchor not found"
src = src[:ai] + JS.replace('\n', LE) + src[ai:]

with open(PATH, 'w', newline='', encoding='utf-8') as f:
    f.write(src)

print("OK — V2 features applied (3D thumbnails + lighting + material upgrades).")
print(f"Size: {len(src)} bytes")
