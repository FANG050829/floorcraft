/**
 * features/glass-walls.js — 玻璃墙（整面墙玻璃+木条分割点缀）
 *
 * 功能：
 * - 根据当前模板的 GLASS_WALLS 配置，在指定墙面位置创建玻璃墙面板
 * - 玻璃墙替换原有实墙的对应区段（透光，可见天空）
 * - 木条竖向分割点缀（数量可配）
 * - 非人物模式半透明，人物模式不透明（与 environment.js 墙壁一致）
 *
 * 依赖：THREE, scene, room, GLASS_WALLS, activeTemplate（模板切换时更新）
 */

let glassWallGroup=null;
let curGlassTemplate=null;

/* 玻璃材质（完全透明，物理透射） */
function makeGlassMat(){
  return new THREE.MeshPhysicalMaterial({
    color:'#C8DCE0',transparent:true,opacity:0.0,roughness:0.02,metalness:0.0,
    envMapIntensity:1.5,depthWrite:false,depthTest:true,side:THREE.DoubleSide,
    transmission:1.0,thickness:0.1,ior:1.45,
  });
}
/* 木条材质 */
function makeBarMat(){
  return new THREE.MeshStandardMaterial({color:'#6E543A',roughness:0.6,metalness:0.1});
}
/* 窗框材质 */
function makeFrameMat(){
  return new THREE.MeshStandardMaterial({color:'#3A3633',roughness:0.5,metalness:0.3});
}

/* 构建玻璃墙 */
function buildGlassWalls(){
  /* 清理旧的 */
  if(glassWallGroup){
    scene.remove(glassWallGroup);
    glassWallGroup.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
    glassWallGroup=null;
  }
  if(!GLASS_WALLS||!curGlassTemplate)return;
  const config=GLASS_WALLS[curGlassTemplate];
  if(!config||!config.length)return;

  glassWallGroup=new THREE.Group();
  const w=room.w,d=room.d,h=room.h,H=h*room.floors;
  const glassMat=makeGlassMat();
  const barMat=makeBarMat();
  const frameMat=makeFrameMat();
  const wallT=0.08; /* 玻璃墙厚度 */

  config.forEach(cfg=>{
    const span=cfg.to-cfg.from;
    const bars=cfg.bars||3;
    const cx=(cfg.from+cfg.to)/2;
    if(cfg.wall==='north'||cfg.wall==='south'){
      /* 北/南墙：沿 x 方向，玻璃面板在 z=±d/2 */
      const zPos=cfg.wall==='north'?-d/2-0.04:d/2+0.04;
      /* 玻璃面板 */
      const glass=new THREE.Mesh(new THREE.BoxGeometry(span,H,wallT),glassMat.clone());
      glass.position.set(cx,H/2,zPos);
      glass.userData.glassWall=true;
      glassWallGroup.add(glass);
      /* 顶部窗框 */
      const topFrame=new THREE.Mesh(new THREE.BoxGeometry(span+0.1,0.08,wallT+0.04),frameMat);
      topFrame.position.set(cx,H-0.04,zPos);glassWallGroup.add(topFrame);
      /* 底部窗框（窗台） */
      const sill=new THREE.Mesh(new THREE.BoxGeometry(span+0.15,0.06,wallT+0.1),barMat);
      sill.position.set(cx,0.03,zPos);glassWallGroup.add(sill);
      /* 木条（竖向分割） */
      for(let i=0;i<=bars;i++){
        const t=i/bars;
        const bx=cfg.from+t*span;
        const bar=new THREE.Mesh(new THREE.BoxGeometry(0.04,H-0.1,wallT+0.02),barMat);
        bar.position.set(bx,H/2,zPos);
        glassWallGroup.add(bar);
      }
      /* 横向木条（中部点缀） */
      const midBar=new THREE.Mesh(new THREE.BoxGeometry(span,0.04,wallT+0.02),barMat);
      midBar.position.set(cx,H*0.55,zPos);glassWallGroup.add(midBar);
    }else{
      /* 东/西墙：沿 z 方向，玻璃面板在 x=±w/2 */
      const xPos=cfg.wall==='west'?-w/2-0.04:w/2+0.04;
      /* 玻璃面板 */
      const glass=new THREE.Mesh(new THREE.BoxGeometry(wallT,H,span),glassMat.clone());
      glass.position.set(xPos,H/2,cx);
      glass.userData.glassWall=true;
      glassWallGroup.add(glass);
      /* 顶部窗框 */
      const topFrame=new THREE.Mesh(new THREE.BoxGeometry(wallT+0.04,0.08,span+0.1),frameMat);
      topFrame.position.set(xPos,H-0.04,cx);glassWallGroup.add(topFrame);
      /* 底部窗框 */
      const sill=new THREE.Mesh(new THREE.BoxGeometry(wallT+0.1,0.06,span+0.15),barMat);
      sill.position.set(xPos,0.03,cx);glassWallGroup.add(sill);
      /* 木条 */
      for(let i=0;i<=bars;i++){
        const t=i/bars;
        const bz=cfg.from+t*span;
        const bar=new THREE.Mesh(new THREE.BoxGeometry(wallT+0.02,H-0.1,0.04),barMat);
        bar.position.set(xPos,H/2,bz);
        glassWallGroup.add(bar);
      }
      /* 横向木条 */
      const midBar=new THREE.Mesh(new THREE.BoxGeometry(wallT+0.02,0.04,span),barMat);
      midBar.position.set(xPos,H*0.55,cx);glassWallGroup.add(midBar);
    }
  });
  scene.add(glassWallGroup);
  updateGlassWallsVisibility();
  console.log('[FLOORCRAFT] 玻璃墙已构建：'+curGlassTemplate+' · '+config.length+' 段');
}

/* 切换可见性（玻璃始终完全透明，木条/窗框不透明） */
function updateGlassWallsVisibility(){
  if(!glassWallGroup)return;
  glassWallGroup.traverse(o=>{
    if(!o.isMesh)return;
    if(o.userData.glassWall){
      o.material.transparent=true;
      o.material.opacity=0.0;
      o.material.transmission=1.0;
      o.material.depthWrite=false;
      o.material.needsUpdate=true;
    }
  });
}

/* 监听模板切换：通过 tplSelect 的 change 事件（而非轮询 curTpl，后者在 init 闭包内） */
function hookTemplateChange(){
  /* 初始模板（cafe） */
  curGlassTemplate='cafe';
  buildGlassWalls();
  /* 监听 tplSelect change 事件 */
  const tplSelect=document.getElementById('tplSelect');
  if(tplSelect){
    tplSelect.addEventListener('change',()=>{
      /* 延迟一点等 loadTemplate 执行完 */
      setTimeout(()=>{
        curGlassTemplate=tplSelect.value;
        buildGlassWalls();
      },50);
    });
  }
  /* 监听人物模式切换 */
  let lastCharActive=false;
  setInterval(()=>{
    const cur=typeof charActive!=='undefined'&&charActive;
    if(cur!==lastCharActive){
      lastCharActive=cur;
      updateGlassWallsVisibility();
    }
  },100);
  /* 监听房间尺寸变化 */
  let lastW=0,lastD=0,lastH=0,lastFloors=0;
  setInterval(()=>{
    if(typeof room==='undefined')return;
    if(room.w!==lastW||room.d!==lastD||room.h!==lastH||room.floors!==lastFloors){
      lastW=room.w;lastD=room.d;lastH=room.h;lastFloors=room.floors;
      if(curGlassTemplate)buildGlassWalls();
    }
  },200);
}

function setupGlassWalls(){
  hookTemplateChange();
  console.log('[FLOORCRAFT] 玻璃墙系统已就绪');
}

/* 等待 init 完成 */
function trySetupGlass(){
  if(typeof THREE==='undefined'||typeof scene==='undefined'||typeof room==='undefined')return false;
  if(typeof GLASS_WALLS==='undefined')return false;
  if(document.getElementById('glassInit'))return true;
  const m=document.createElement('div');m.id='glassInit';m.style.display='none';document.body.appendChild(m);
  setupGlassWalls();
  return true;
}
let gwTries=0;
const gwInterval=setInterval(()=>{
  gwTries++;
  if(trySetupGlass())clearInterval(gwInterval);
  else if(gwTries>80){clearInterval(gwInterval);
    const o=new MutationObserver(()=>{if(trySetupGlass())o.disconnect();});
    o.observe(document.body,{childList:true,subtree:true});
  }
},100);
