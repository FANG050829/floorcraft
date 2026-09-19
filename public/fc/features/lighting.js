/**
 * features/lighting.js — 光源系统 + 3D 家具缩略图 + 材质质感升级
 *
 * 功能：
 * 1. 左侧家具库预览图升级为 3D 实时渲染（共享 WebGL 渲染器）
 * 2. 顶栏「光源」按钮：氛围预设 + 环境光/太阳光/太阳色/阴影滑杆 + 可拖拽点光源/聚光灯
 * 3. 木质材质添加程序化木纹纹理 + 环境贴图增强金属反射
 * 4. 6 种氛围预设（白天/黄昏/夜晚/暖光吧/晨光/冷调）一键营造光线氛围
 *
 * 依赖：THREE, M, BUILDERS, scene, sun, renderer, room, vp, $, clamp,
 *   showToast, BRAND, libThumbs, customThumbs, redrawThumbs, _v3, camera, brandPop, roomPop
 */

/* ── 材质质感大幅升级：512px 纹理 + 法线贴图 + PMREM 环境贴图 + 各向异性 ── */
(function(){
  /* ── 512px 高分辨率木纹纹理（含木节、年轮、纤维、光泽变化） ── */
  function woodTex(baseColor,dark){
    const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
    g.fillStyle=baseColor;g.fillRect(0,0,512,512);
    /* 底色渐变（自然色调变化） */
    const baseGrad=g.createLinearGradient(0,0,512,512);
    baseGrad.addColorStop(0,'rgba(0,0,0,0.04)');
    baseGrad.addColorStop(0.5,'rgba(255,255,255,0.03)');
    baseGrad.addColorStop(1,'rgba(0,0,0,0.05)');
    g.fillStyle=baseGrad;g.fillRect(0,0,512,512);
    /* 主纹理：纵向木纹纤维（高频） */
    for(let i=0;i<48;i++){
      const x=i*11+Math.random()*4;
      g.strokeStyle='rgba('+(dark?'40,28,18':'80,55,30')+','+(0.03+Math.random()*0.09)+')';
      g.lineWidth=0.4+Math.random()*1.2;
      g.beginPath();g.moveTo(x,0);
      for(let y=0;y<512;y+=6){g.lineTo(x+Math.sin(y*0.04+i)*3+Math.cos(y*0.12+i)*1.5,y);}
      g.stroke();
    }
    /* 木节（深色椭圆，带辐射纹） */
    for(let i=0;i<6;i++){
      const kx=Math.random()*512,ky=Math.random()*512;
      const kr=6+Math.random()*14;
      const grd=g.createRadialGradient(kx,ky,0,kx,ky,kr);
      grd.addColorStop(0,'rgba('+(dark?'14,10,6':'40,26,14')+',0.6)');
      grd.addColorStop(0.5,'rgba('+(dark?'20,14,8':'50,32,18')+',0.3)');
      grd.addColorStop(1,'rgba('+(dark?'20,14,8':'50,32,18')+',0)');
      g.fillStyle=grd;g.beginPath();g.ellipse(kx,ky,kr,kr*0.7,Math.random()*Math.PI,0,7);g.fill();
      /* 木节辐射纹 */
      g.strokeStyle='rgba('+(dark?'30,20,12':'60,40,22')+',0.12)';g.lineWidth=0.3;
      for(let a=0;a<8;a++){const ang=a/8*Math.PI*2;g.beginPath();g.moveTo(kx+Math.cos(ang)*kr*0.3,ky+Math.sin(ang)*kr*0.3);g.lineTo(kx+Math.cos(ang)*kr*1.5,ky+Math.sin(ang)*kr*1.5);g.stroke();}
    }
    /* 年轮线（低频大波） */
    g.globalAlpha=0.12;
    for(let i=0;i<8;i++){g.strokeStyle=dark?'#3a2818':'#6a4828';g.lineWidth=0.5;
      g.beginPath();g.moveTo(0,30+i*55);for(let x=0;x<512;x+=5){g.lineTo(x,30+i*55+Math.sin(x*0.03)*2.5+Math.cos(x*0.08)*1.2);}g.stroke();}
    /* 高光斑点（光泽变化） */
    g.globalAlpha=0.08;
    for(let i=0;i<30;i++){g.fillStyle=dark?'#8a6a4a':'#d0b080';g.beginPath();g.ellipse(Math.random()*512,Math.random()*512,1+Math.random()*3,0.5+Math.random()*1.5,0,0,7);g.fill();}
    g.globalAlpha=1;
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=16;return t;
  }
  /* 法线贴图（模拟木纹凹凸，高分辨率） */
  function woodNormalTex(){
    const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
    g.fillStyle='#8080ff';g.fillRect(0,0,512,512); /* 法线基准（中性） */
    /* 纤维凹凸（高频条纹→法线偏移） */
    for(let i=0;i<48;i++){const x=i*11;
      const grad=g.createLinearGradient(x-2,0,x+2,0);
      grad.addColorStop(0,'rgba(128,100,200,0.8)'); /* 左斜面 */
      grad.addColorStop(0.5,'rgba(128,180,200,0.8)'); /* 右斜面 */
      grad.addColorStop(1,'rgba(128,100,200,0.8)');
      g.strokeStyle=grad;g.lineWidth=1.2;g.beginPath();g.moveTo(x,0);
      for(let y=0;y<512;y+=6)g.lineTo(x+Math.sin(y*0.04+i)*3,y);g.stroke();
    }
    /* 木节凹陷 */
    for(let i=0;i<6;i++){const kx=Math.random()*512,ky=Math.random()*512,kr=8+Math.random()*12;
      const grd=g.createRadialGradient(kx,ky,0,kx,ky,kr);
      grd.addColorStop(0,'rgba(100,80,180,0.6)');grd.addColorStop(1,'rgba(128,128,255,0)');
      g.fillStyle=grd;g.beginPath();g.arc(kx,ky,kr,0,7);g.fill();}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=16;return t;
  }
  /* 粗糙度贴图（木纹粗糙度变化） */
  function woodRoughTex(){
    const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
    g.fillStyle='#888';g.fillRect(0,0,512,512);
    for(let i=0;i<48;i++){const x=i*11;g.strokeStyle='rgba(0,0,0,0.35)';g.lineWidth=1;g.beginPath();g.moveTo(x,0);for(let y=0;y<512;y+=6)g.lineTo(x+Math.sin(y*0.04+i)*3,y);g.stroke();}
    /* 木节处更粗糙 */
    for(let i=0;i<6;i++){const kx=Math.random()*512,ky=Math.random()*512,kr=10;
      const grd=g.createRadialGradient(kx,ky,0,kx,ky,kr);
      grd.addColorStop(0,'rgba(20,20,20,0.5)');grd.addColorStop(1,'rgba(136,136,136,0)');
      g.fillStyle=grd;g.beginPath();g.arc(kx,ky,kr,0,7);g.fill();}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=16;return t;
  }
  /* 金属拉丝纹理（高分辨率，方向性） */
  function metalTex(color){
    const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
    g.fillStyle=color;g.fillRect(0,0,256,256);
    /* 拉丝纹（水平方向，高密度） */
    for(let i=0;i<200;i++){g.strokeStyle='rgba(255,255,255,'+(0.015+Math.random()*0.06)+')';g.lineWidth=0.3+Math.random()*0.4;g.beginPath();g.moveTo(0,Math.random()*256);g.lineTo(256,Math.random()*256+Math.random()*4-2);g.stroke();}
    /* 暗纹（增加层次） */
    for(let i=0;i<100;i++){g.strokeStyle='rgba(0,0,0,'+(0.02+Math.random()*0.04)+')';g.lineWidth=0.3;g.beginPath();g.moveTo(0,Math.random()*256);g.lineTo(256,Math.random()*256);g.stroke();}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=16;return t;
  }
  /* 金属法线贴图（拉丝凹凸） */
  function metalNormalTex(){
    const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
    g.fillStyle='#8080ff';g.fillRect(0,0,256,256);
    for(let i=0;i<200;i++){const y=Math.random()*256;
      g.strokeStyle='rgba(128,'+(100+Math.random()*80)+',200,0.5)';g.lineWidth=0.6;
      g.beginPath();g.moveTo(0,y);g.lineTo(256,y+Math.random()*4-2);g.stroke();}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=16;return t;
  }
  /* 布料纹理（高分辨率，含编织纹） */
  function fabricTex(color){
    const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
    g.fillStyle=color;g.fillRect(0,0,128,128);
    /* 编织纹（十字交叉） */
    g.strokeStyle='rgba(0,0,0,0.08)';g.lineWidth=0.5;
    for(let i=0;i<32;i++){g.beginPath();g.moveTo(0,i*4);g.lineTo(128,i*4);g.stroke();g.beginPath();g.moveTo(i*4,0);g.lineTo(i*4,128);g.stroke();}
    /* 细微噪点 */
    for(let i=0;i<400;i++){g.fillStyle='rgba(0,0,0,'+(0.015+Math.random()*0.04)+')';g.fillRect(Math.random()*128,Math.random()*128,1,1);}
    for(let i=0;i<200;i++){g.fillStyle='rgba(255,255,255,'+(0.015+Math.random()*0.03)+')';g.fillRect(Math.random()*128,Math.random()*128,1,1);}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,4);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=16;return t;
  }
  /* 石材纹理（用于水磨石地面） */
  function stoneTex(){
    const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
    g.fillStyle='#D8D0BE';g.fillRect(0,0,256,256);
    const cols=['#C75B39','#8A9B7C','#6E543A','#B98A2F','#4C6B45','#FFFFFF'];
    for(let i=0;i<300;i++){g.fillStyle=cols[(Math.random()*cols.length)|0];g.globalAlpha=.3+Math.random()*.4;
      g.beginPath();g.ellipse(Math.random()*256,Math.random()*256,1+Math.random()*5,1+Math.random()*5,Math.random()*3,0,7);g.fill();}
    g.globalAlpha=1;
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=16;return t;
  }

  /* ── PMREM 环境贴图（为金属/玻璃提供真实反射）── */
  let envMap=null;
  if(typeof THREE.PMREMGenerator==='function'){
    try{
      const pmrem=new THREE.PMREMGenerator(renderer);
      /* 用 RoomEnvironment 生成室内环境贴图 */
      if(typeof THREE.RoomEnvironment==='function'){
        envMap=pmrem.fromScene(new THREE.RoomEnvironment(),0.04).texture;
      }else{
        /* 没有 RoomEnvironment，用简单天空 */
        envMap=pmrem.fromScene(new THREE.Scene(),0.04).texture;
      }
      scene.environment=envMap;
    }catch(e){console.warn('PMREM 环境贴图失败',e);}
  }

  /* ── 应用材质升级 ── */
  if(M.wood){
    const t=woodTex('#C09A68');t.repeat.set(2,2);
    M.wood.map=t;
    const nt=woodNormalTex();nt.repeat.set(2,2);M.wood.normalMap=nt;M.wood.normalScale=new THREE.Vector2(0.6,0.6);
    const rt=woodRoughTex();rt.repeat.set(2,2);M.wood.roughnessMap=rt;
    M.wood.roughness=0.55;M.wood.metalness=0.0;M.wood.envMapIntensity=1.2;M.wood.needsUpdate=true;
  }
  if(M.woodDark){
    const t=woodTex('#6E543A',true);t.repeat.set(2,2);
    M.woodDark.map=t;
    const nt=woodNormalTex();nt.repeat.set(2,2);M.woodDark.normalMap=nt;M.woodDark.normalScale=new THREE.Vector2(0.5,0.5);
    M.woodDark.roughness=0.5;M.woodDark.metalness=0.05;M.woodDark.envMapIntensity=1.0;M.woodDark.needsUpdate=true;
  }
  if(M.metal){
    const t=metalTex('#3B3B3B');M.metal.map=t;
    const nt=metalNormalTex();M.metal.normalMap=nt;M.metal.normalScale=new THREE.Vector2(0.3,0.3);
    M.metal.envMapIntensity=1.8;M.metal.roughness=0.25;M.metal.metalness=0.9;M.metal.needsUpdate=true;
  }
  if(M.steel){
    const t=metalTex('#B8BCC0');M.steel.map=t;
    const nt=metalNormalTex();M.steel.normalMap=nt;M.steel.normalScale=new THREE.Vector2(0.25,0.25);
    M.steel.envMapIntensity=2.5;M.steel.roughness=0.18;M.steel.metalness=0.95;M.steel.needsUpdate=true;
  }
  if(M.brand){
    const t=fabricTex('#'+M.brand.color.getHexString());
    M.brand.map=t;M.brand.roughness=0.72;M.brand.metalness=0.0;M.brand.envMapIntensity=0.6;M.brand.needsUpdate=true;
  }
  if(M.brandSoft){
    const t=fabricTex('#'+M.brandSoft.color.getHexString());
    M.brandSoft.map=t;M.brandSoft.roughness=0.82;M.brandSoft.envMapIntensity=0.5;M.brandSoft.needsUpdate=true;
  }
  if(M.oat){M.oat.roughness=0.82;M.oat.envMapIntensity=0.8;M.oat.metalness=0.0;}
  if(M.white){M.white.roughness=0.75;M.white.envMapIntensity=0.6;M.white.metalness=0.0;}
  if(M.glass){M.glass=new THREE.MeshPhysicalMaterial({color:'#C8DCE0',transparent:true,opacity:0.0,roughness:0.02,metalness:0.0,envMapIntensity:2.0,depthWrite:false,depthTest:true,side:THREE.DoubleSide,transmission:1.0,thickness:0.3,ior:1.45});M.glass.needsUpdate=true;}
  if(M.mirrorM){M.mirrorM.envMapIntensity=3.0;M.mirrorM.roughness=0.05;M.mirrorM.metalness=0.95;M.mirrorM.needsUpdate=true;}
  if(M.ink){M.ink.roughness=0.7;M.ink.envMapIntensity=0.4;M.ink.metalness=0.1;}
  if(M.green){M.green.roughness=0.85;M.green.envMapIntensity=0.6;}

  /* ── 渲染器升级：软阴影 + 高质量色调映射 + 各向异性 ── */
  /* VSM 软阴影（更平滑） */
  try{renderer.shadowMap.type=THREE.VSMShadowMap;}catch(e){renderer.shadowMap.type=THREE.PCFSoftShadowMap;}
  if(sun&&sun.shadow){
    sun.shadow.mapSize.set(2048,2048); /* 高质量阴影贴图 */
    sun.shadow.radius=5;
    sun.shadow.bias=-0.0001;
    sun.shadow.normalBias=0.02;
  }
  /* 色调映射：电影级 ACES + 适度曝光 */
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.1;
  /* 全局各向异性过滤 */
  const maxAniso=renderer.capabilities?renderer.capabilities.getMaxAnisotropy():1;
  /* 应用到所有现有纹理 */
  scene.traverse(o=>{if(o.isMesh&&o.material&&o.material.map){o.material.map.anisotropy=maxAniso;}});
  console.log('[FLOORCRAFT] 渲染升级：PMREM环境+法线贴图+2K阴影+VSM+各向异性'+maxAniso+'x');
})();

/* ── 3D 家具库缩略图（单一共享 WebGL 渲染器） ── */
const thumbScene=new THREE.Scene();
thumbScene.background=new THREE.Color('#EFE9DB');
const thumbCam=new THREE.PerspectiveCamera(34,1,0.05,30);
const thumbSun=new THREE.DirectionalLight(0xfff0dc,2.2);thumbSun.position.set(2,3,2);thumbScene.add(thumbSun);
thumbScene.add(new THREE.HemisphereLight(0xfff4e2,0x8b8578,0.9));
const thumbGnd=new THREE.Mesh(new THREE.CircleGeometry(2,32),new THREE.MeshStandardMaterial({color:'#E7DFC9',roughness:.95}));
thumbGnd.rotation.x=-Math.PI/2;thumbGnd.position.y=-0.001;thumbGnd.receiveShadow=true;thumbScene.add(thumbGnd);
const thumbGroup=new THREE.Group();thumbScene.add(thumbGroup);
const thumbHidden=document.createElement('canvas');thumbHidden.width=88;thumbHidden.height=88;
const thumbR=new THREE.WebGLRenderer({canvas:thumbHidden,antialias:true,alpha:false,preserveDrawingBuffer:true});
thumbR.setPixelRatio(1);thumbR.shadowMap.enabled=true;thumbR.shadowMap.type=THREE.PCFShadowMap;
thumbR.outputColorSpace=THREE.SRGBColorSpace;
thumbR.toneMapping=THREE.ACESFilmicToneMapping;thumbR.toneMappingExposure=1.1;
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
redrawThumbs=function(){
  const draw=list=>list.forEach(({t,cv})=>queueThumb(t,cv));
  draw(libThumbs);draw(customThumbs);
  scheduleThumbs();
};

/* ── 氛围预设（一键营造光线氛围）── */
/* sunPos: 太阳方向（归一化前），太阳在远处低角度（地平线附近），非正上方 */
/* fillColor/fillIntensity: 补光（阴影填充）, rimColor/rimIntensity: 边缘光（轮廓）, bounceColor/bounceIntensity: 反弹光（暖色漫反射） */
const MOODS={
  day:    {name:'白天', amb:0.45, sun:3.5, sunC:'#fff4e0', ambC:'#eaf2ff', ambGround:'#8b8578', shadow:1.0, shadowSoft:0.4, fog:'#EDE7D9', fogNear:30, fogFar:70, bg:'#EDE7D9', exp:1.15, sunPos:[16,3,5], fillColor:'#c8d0d8', fillIntensity:0.2, rimColor:'#fff8e0', rimIntensity:0.15, bounceColor:'#e0d8c8', bounceIntensity:0.1, desc:'明亮自然光 · 方向性阳光'},
  morning:{name:'晨光', amb:0.4, sun:3.0, sunC:'#fff8e8', ambC:'#d8e8f0', ambGround:'#a0a8a0', shadow:0.95, shadowSoft:0.5, fog:'#e8ecf0', fogNear:25, fogFar:60, bg:'#eef2f5', exp:1.1, sunPos:[14,2.5,8], fillColor:'#d0e0f0', fillIntensity:0.18, rimColor:'#fff0d8', rimIntensity:0.2, bounceColor:'#e0d8c8', bounceIntensity:0.08, desc:'柔和晨光 · 低角度斜射'},
  noon:   {name:'正午', amb:0.5, sun:4.0, sunC:'#fffcf0', ambC:'#f0f4ff', ambGround:'#909090', shadow:1.0, shadowSoft:0.3, fog:'#F0EBE0', fogNear:35, fogFar:75, bg:'#F0EBE0', exp:1.2, sunPos:[8,7,4], fillColor:'#d8d8d8', fillIntensity:0.25, rimColor:'#ffffff', rimIntensity:0.1, bounceColor:'#d8d0c8', bounceIntensity:0.12, desc:'强烈顶光 · 清晰明亮'},
  dusk:   {name:'黄昏', amb:0.25, sun:2.8, sunC:'#ff8a3c', ambC:'#5a3848', ambGround:'#4a2838', shadow:0.85, shadowSoft:0.55, fog:'#5a3a4e', fogNear:20, fogFar:55, bg:'#6a4858', exp:1.0, sunPos:[18,2,4], fillColor:'#3a2840', fillIntensity:0.12, rimColor:'#ff8a3c', rimIntensity:0.4, bounceColor:'#5a3828', bounceIntensity:0.15, desc:'暖橙夕照 · 低角度方向光'},
  sunset: {name:'日落', amb:0.2, sun:2.2, sunC:'#ff6a20', ambC:'#4a2040', ambGround:'#3a1828', shadow:0.8, shadowSoft:0.6, fog:'#3a2030', fogNear:18, fogFar:50, bg:'#4a2838', exp:0.95, sunPos:[20,1.5,3], fillColor:'#2a1830', fillIntensity:0.1, rimColor:'#ff5a10', rimIntensity:0.6, bounceColor:'#4a2018', bounceIntensity:0.18, desc:'低角度夕阳 · 戏剧性暖光'},
  night:  {name:'夜晚', amb:0.15, sun:0.9, sunC:'#6a8ad0', ambC:'#1a2438', ambGround:'#0a1020', shadow:0.5, shadowSoft:0.7, fog:'#1a2030', fogNear:18, fogFar:52, bg:'#222838', exp:0.85, sunPos:[-14,3,-10], fillColor:'#101828', fillIntensity:0.06, rimColor:'#4a6aa0', rimIntensity:0.15, bounceColor:'#0a1020', bounceIntensity:0.05, desc:'冷调月光 · 安静私密的晚间模式'},
  warmbar:{name:'暖光吧', amb:0.18, sun:0.6, sunC:'#ffb060', ambC:'#4a2818', ambGround:'#2a1808', shadow:0.7, shadowSoft:0.65, fog:'#3a2418', fogNear:16, fogFar:45, bg:'#4a3020', exp:0.95, sunPos:[10,2,8], fillColor:'#2a1808', fillIntensity:0.08, rimColor:'#ffc080', rimIntensity:0.5, bounceColor:'#4a2010', bounceIntensity:0.2, desc:'吧台暖光 · 微醺与小聚氛围'},
  cool:   {name:'冷调', amb:0.3, sun:2.2, sunC:'#c8dcf0', ambC:'#2a3848', ambGround:'#1a2838', shadow:0.8, shadowSoft:0.5, fog:'#2a3440', fogNear:22, fogFar:55, bg:'#384450', exp:1.05, sunPos:[14,3,-8], fillColor:'#1a2838', fillIntensity:0.15, rimColor:'#a0c0e0', rimIntensity:0.2, bounceColor:'#1a2030', bounceIntensity:0.08, desc:'工业冷调 · 现代克制'},
  golden: {name:'黄金时刻', amb:0.28, sun:3.0, sunC:'#ffcaa0', ambC:'#6a4858', ambGround:'#4a3828', shadow:0.9, shadowSoft:0.55, fog:'#5a4038', fogNear:20, fogFar:52, bg:'#6a5048', exp:1.05, sunPos:[17,2.5,5], fillColor:'#3a2030', fillIntensity:0.1, rimColor:'#ffd8a0', rimIntensity:0.45, bounceColor:'#5a3020', bounceIntensity:0.15, desc:'黄金时段 · 电影级暖光'},
};

/* ── 光源系统 ── */
const lightPop=$('lightPop'),lightBtn=$('lightBtn'),lightList=$('lightList');
const lAmb=$('lAmb'),lAmbV=$('lAmbV'),lSun=$('lSun'),lSunV=$('lSunV');
const lSunC=$('lSunC'),lSunCV=$('lSunCV'),lShadow=$('lShadow'),lShadowV=$('lShadowV');
let pointLights=[],selLight=null;
let curMood='day';
const SUN_NAMES={'#fff0dc':'暖白','#ffffff':'纯白','#fff5e6':'米黄','#e8f0ff':'冷白','#ffd9a8':'夕阳','#cfe0ff':'月光','#ff9a52':'黄昏橙','#5a7ab0':'夜蓝','#c8dcf0':'冷白','#fff8e8':'晨光'};

/* 边缘光（rim light，从太阳反方向打来，勾勒轮廓） */
let rimLight=null;
function ensureRimLight(){
  if(rimLight)return;
  rimLight=new THREE.DirectionalLight(0xffffff,0.3);
  rimLight.position.set(-10,8,-10);
  scene.add(rimLight);
}
/* 反弹光（bounce light，从地面方向打来，模拟漫反射） */
let bounceLight=null;
function ensureBounceLight(){
  if(bounceLight)return;
  bounceLight=new THREE.HemisphereLight(0xffffff,0x000000,0.2);
  bounceLight.position.set(0,0,0);
  scene.add(bounceLight);
}
ensureRimLight();
ensureBounceLight();

/* 环境光（用 HemisphereLight 模拟，带天地色） */
let hemiLight=scene.children.find(o=>o.isHemisphereLight&&o!==bounceLight);
function applyAmbient(v,ambC){
  if(hemiLight){
    hemiLight.intensity=v;
    if(ambC)hemiLight.color.set(ambC);
  }
  lAmbV.textContent=v.toFixed(2);
}
function applySun(v){sun.intensity=v;lSunV.textContent=v.toFixed(1);}
function applySunColor(c){sun.color.set(c);lSunCV.textContent=SUN_NAMES[c.toLowerCase()]||c.toUpperCase();}
function applyShadow(v,soft){
  renderer.shadowMap.enabled=v>0.05;sun.castShadow=v>0.05;
  /* 阴影柔和度：soft 越大阴影越柔和 */
  if(sun.shadow){
    try{sun.shadow.radius=Math.max(1,(soft||0.7)*v*10);}catch(e){}
  }
  lShadowV.textContent=Math.round(v*100)+'%';
}

lAmb.addEventListener('input',()=>{applyAmbient(+lAmb.value);});
lSun.addEventListener('input',()=>{applySun(+lSun.value);});
lSunC.addEventListener('input',()=>{applySunColor(lSunC.value);});
lShadow.addEventListener('input',()=>{applyShadow(+lShadow.value);});
$('lAmbientSeg').querySelectorAll('button').forEach(b=>b.onclick=()=>{
  $('lAmbientSeg').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
  lAmb.value=b.dataset.a;applyAmbient(+b.dataset.a);
});

/* 氛围预设按钮（注入到 lightPop 顶部，在 ambientSeg 之前）*/
const moodRow=document.createElement('div');moodRow.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-bottom:10px';
Object.entries(MOODS).forEach(([key,m])=>{
  const b=document.createElement('button');
  b.dataset.mood=key;b.textContent=m.name;
  b.style.cssText='font-size:10.5px;padding:6px 2px;border:1px solid var(--ink);background:'+(key==='day'?'var(--ink)':'rgba(255,255,255,.5)')+';color:'+(key==='day'?'var(--paper)':'var(--ink2)')+';letter-spacing:.03em;transition:.15s;cursor:pointer';
  if(key==='day')b.classList.add('on');
  b.onclick=()=>{applyMood(key);};
  b.onmouseenter=()=>{b.title=m.desc;};
  moodRow.appendChild(b);
});
/* 插入到 lightPop 的第一个子元素（h5）之后 */
const lpH5=lightPop.querySelector('h5');
if(lpH5&&lpH5.nextSibling)lightPop.insertBefore(moodRow,lpH5.nextSibling);
else lightPop.appendChild(moodRow);

/* 氛围描述行 */
const moodDesc=document.createElement('p');moodDesc.style.cssText='font-size:10px;color:var(--ink2);line-height:1.5;margin:0 0 10px;padding:0 2px';
moodDesc.textContent=MOODS.day.desc;
moodRow.parentNode.insertBefore(moodDesc,moodRow.nextSibling);

function applyMood(key){
  const m=MOODS[key];if(!m)return;
  curMood=key;
  /* 更新预设按钮高亮 */
  moodRow.querySelectorAll('button').forEach(b=>{const on=b.dataset.mood===key;b.style.background=on?'var(--ink)':'rgba(255,255,255,.5)';b.style.color=on?'var(--paper)':'var(--ink2)';});
  moodDesc.textContent=m.desc;
  /* 应用光照参数 */
  lAmb.value=m.amb;applyAmbient(m.amb,m.ambC);
  if(m.ambGround&&hemiLight)hemiLight.groundColor.set(m.ambGround);
  lSun.value=m.sun;applySun(m.sun);
  lSunC.value=m.sunC;applySunColor(m.sunC);
  lShadow.value=m.shadow;applyShadow(m.shadow,m.shadowSoft);
  /* 环境预设段同步 */
  $('lAmbientSeg').querySelectorAll('button').forEach(x=>x.classList.toggle('on',false));
  /* 太阳位置随氛围变化（黄昏低角度、夜晚月亮方向） */
  if(m.sunPos&&sun){
    sun.position.set(m.sunPos[0],m.sunPos[1],m.sunPos[2]);
    if(!sun.target.parent)scene.add(sun.target);
    sun.target.position.set(0,0,0);sun.target.updateMatrixWorld();
    if(typeof updateSunDirection==='function')updateSunDirection();
  }
  /* ── 边缘光（rim light）：从太阳反方向打来，勾勒轮廓 ── */
  if(rimLight&&m.rimColor){
    rimLight.color.set(m.rimColor);
    rimLight.intensity=m.rimIntensity||0.3;
    /* rim 光位置 = 太阳反方向 */
    if(m.sunPos){
      rimLight.position.set(-m.sunPos[0]*0.8,-m.sunPos[1]*0.5+5,-m.sunPos[2]*0.8);
    }
  }
  /* ── 反弹光（bounce light）：模拟地面漫反射 ── */
  if(bounceLight&&m.bounceColor){
    bounceLight.color.set(m.bounceColor);
    bounceLight.groundColor.set(m.bounceColor);
    bounceLight.intensity=m.bounceIntensity||0.2;
  }
  /* ── fill 补光：跟随氛围调色（阴影填充） ── */
  if(typeof fill!=='undefined'){
    fill.color.set(m.fillColor||m.ambC);
    fill.intensity=m.fillIntensity||m.sun*0.25;
    /* fill 光位置 = 太阳反方向（填充阴影面） */
    if(m.sunPos){
      fill.position.set(-m.sunPos[0]*0.6,6,-m.sunPos[2]*0.6);
    }
  }
  /* 雾气：近远距离 + 颜色（体积感） */
  if(scene.fog){
    scene.fog.color.set(m.fog);
    scene.fog.near=m.fogNear||20;
    scene.fog.far=m.fogFar||55;
  }
  scene.background=new THREE.Color(m.bg);
  /* 渲染器曝光（电影级） */
  renderer.toneMappingExposure=m.exp||1.15;
  showToast('氛围：'+m.name);
}

function resetLights(){
  pointLights.forEach(pl=>{scene.remove(pl.light);scene.remove(pl.helper);});
  pointLights=[];selLight=null;renderLightList();updateLightGizmos();
  applyMood('day');
  showToast('光照已重置为默认（白天）');
}
$('lightReset').onclick=resetLights;

/* 点光源 / 聚光灯预设 */
const LIGHT_PRESETS={
  warm:{type:'point',color:'#FFD79A',intensity:8,distance:6,name:'暖光'},
  cool:{type:'point',color:'#C8E0FF',intensity:8,distance:6,name:'冷光'},
  brand:{type:'point',color:BRAND,intensity:10,distance:6,name:'品牌色光'},
  spot:{type:'spot',color:'#FFFFFF',intensity:12,distance:8,angle:0.5,penumbra:0.4,name:'聚光灯'},
};

function addLight(preset){
  const cfg=LIGHT_PRESETS[preset];
  let light,helper;
  const x=(Math.random()-0.5)*room.w*0.5,z=(Math.random()-0.5)*room.d*0.5,y=room.h*0.75;
  if(cfg.type==='spot'){
    light=new THREE.SpotLight(cfg.color,cfg.intensity,cfg.distance,cfg.angle,cfg.penumbra,1.2);
    light.position.set(x,y,z);
    light.target.position.set(x,0,z);
    light.castShadow=true;
    light.shadow.mapSize.set(512,512);light.shadow.bias=-0.001;
    scene.add(light);scene.add(light.target);
    /* helper: 小锥体 */
    helper=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.2,12),new THREE.MeshBasicMaterial({color:cfg.color}));
    helper.position.copy(light.position);
  }else{
    light=new THREE.PointLight(cfg.color,cfg.intensity,cfg.distance,1.5);
    light.position.set(x,y,z);
    light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.bias=-0.001;
    scene.add(light);
    helper=new THREE.Mesh(new THREE.SphereGeometry(0.08,16,12),new THREE.MeshBasicMaterial({color:cfg.color}));
    helper.position.copy(light.position);scene.add(helper);
  }
  const id='L'+Date.now().toString(36)+Math.random().toString(36).slice(2,4);
  const pl={id,light,helper,color:cfg.color,_wasBrand:preset==='brand',intensity:cfg.intensity,distance:cfg.distance,type:cfg.type,x,y,z,name:cfg.name};
  pointLights.push(pl);renderLightList();updateLightGizmos();
  showToast('已添加 '+cfg.name+(cfg.type==='spot'?'（聚光，可拖动+目标指向地面）':''));
}
/* 绑定添加按钮（lAddRow 中的按钮含 data-t）*/
$('lAddRow').querySelectorAll('button').forEach(b=>b.onclick=()=>addLight(b.dataset.t));
/* 聚光灯按钮（lAddRow2）*/
const lAddRow2=$('lAddRow2');
if(lAddRow2)lAddRow2.querySelectorAll('button').forEach(b=>b.onclick=()=>addLight(b.dataset.t));

function renderLightList(){
  lightList.innerHTML='';
  pointLights.forEach(pl=>{
    const row=document.createElement('div');row.className='litRow'+(selLight===pl?' on':'');
    const dot=document.createElement('span');dot.className='swDot';dot.style.background=pl.color;row.appendChild(dot);
    const nm=document.createElement('span');nm.textContent=pl.name+' · '+pl.intensity.toFixed(1)+(pl.type==='spot'?' [聚]':'');row.appendChild(nm);
    const del=document.createElement('button');del.innerHTML='×';del.title='删除';
    del.onclick=e=>{e.stopPropagation();scene.remove(pl.light);if(pl.light.target)scene.remove(pl.light.target);scene.remove(pl.helper);pointLights=pointLights.filter(x=>x!==pl);if(selLight===pl)selLight=null;renderLightList();updateLightGizmos();};
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
      /* 聚光灯目标跟随 */
      if(dragLight.light.target){dragLight.light.target.position.set(dragLight.x,0,dragLight.z);dragLight.light.target.updateMatrixWorld();}
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
(function extraTick(){requestAnimationFrame(extraTick);positionLightGizmos();})();
