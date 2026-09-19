/**
 * features/character.js — 人物操控功能（增强版）
 *
 * 功能：
 * 1. 3 个预设人物：顾客 / 店员 / 设计师
 * 2. 第一人称：鼠标移动即环顾（无需点击），WASD 移动，空格跳跃
 * 3. 第三人称：相机跟随人物后方，可切换
 * 4. 灵敏度设置（鼠标/移动速度可调）
 * 5. 任何椅子都能坐（接近椅子按 E 坐下，再按 E 起立）
 * 6. 跳跃（空格，含重力与落地）
 * 7. 人物模式下不退出编辑：家具/光源/创作仍可用
 *
 * 依赖：THREE, scene, camera, room, vp, $, clamp, showToast, items,
 *   CATALOG, renderer, applyCamera, ring, itemsGroup
 */

/* ── CSS（注入到 head）── */
(function injectCharCSS(){
  if(document.getElementById('charCSS'))return;
  const s=document.createElement('style');s.id='charCSS';s.textContent=`
#charPop{position:absolute;top:60px;right:230px;z-index:60;background:rgba(252,250,244,.97);border:1px solid var(--ink);padding:14px;width:268px;display:none;box-shadow:6px 6px 0 rgba(38,35,29,.08)}
#charPop.open{display:block;animation:popin .18s ease}
#charPop h5{font-size:11px;letter-spacing:.2em;color:var(--ink2);margin-bottom:10px;font-weight:500;display:flex;justify-content:space-between;align-items:center}
#charPop h5 button{font-size:10px;letter-spacing:.08em;border:1px solid var(--line);padding:3px 8px;color:var(--ink2)}
#charPop h5 button:hover{border-color:var(--brand);color:var(--brand)}
.charList{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.charCard{display:flex;align-items:center;gap:10px;padding:8px;border:1px solid var(--line);background:rgba(255,255,255,.5);cursor:pointer;transition:.15s}
.charCard:hover{border-color:var(--ink);background:#fff}
.charCard.on{border:2px solid var(--brand);background:var(--brand-soft);box-shadow:0 0 0 1px var(--brand) inset,0 2px 8px rgba(199,91,57,.15)}
.charCard.on .nm{color:var(--brand)}
.charCard .av{width:36px;height:36px;border-radius:50%;flex:none;display:grid;place-items:center;font-size:18px}
.charCard .info{flex:1}
.charCard .nm{font-size:12.5px;font-weight:600}
.charCard .desc{font-size:10px;color:var(--ink2)}
.charCtrl{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px}
.charCtrl button{font-size:11px;padding:7px 2px;border:1px solid var(--ink);background:rgba(255,255,255,.5);letter-spacing:.04em;transition:.15s}
.charCtrl button.on{background:var(--ink);color:var(--paper);box-shadow:0 0 0 2px var(--brand) inset;position:relative}
.charCtrl button.on::after{content:'✓';position:absolute;right:4px;top:50%;transform:translateY(-50%);font-size:10px;color:var(--brand)}
.charCtrl button:hover{background:var(--ink);color:var(--paper)}
.charSens{margin-bottom:10px}
.charSens label{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--ink2);margin-bottom:6px}
.charSens label span{width:64px;flex:none;letter-spacing:.06em}
.charSens label input[type=range]{flex:1;accent-color:var(--brand);height:14px}
.charSens label b{width:36px;flex:none;text-align:right;font-size:11px;color:var(--ink)}
.charHint{font-size:10px;color:var(--ink2);line-height:1.7;padding:6px 4px;background:rgba(38,35,29,.04);border-left:2px solid var(--brand)}
.charHint b{color:var(--ink);font-weight:600}
.charExit{margin-top:8px;width:100%;padding:8px;font-size:12px;border:1px solid var(--warn);color:var(--warn);background:transparent;letter-spacing:.1em;transition:.15s}
.charExit:hover{background:var(--warn);color:#fff}
/* 进入人物模式按钮 */
.charEnter{margin-top:8px;width:100%;padding:10px;font-size:13px;font-weight:600;letter-spacing:.12em;border:1px solid var(--line);background:rgba(255,255,255,.4);color:var(--ink2);cursor:not-allowed;transition:.15s;opacity:.6}
.charEnter.ready{border-color:var(--brand);background:var(--brand);color:#fff;cursor:pointer;opacity:1}
.charEnter.ready:hover{filter:brightness(1.08);box-shadow:0 4px 12px rgba(199,91,57,.3)}
/* 第一人称 HUD */
#fpHud{position:absolute;inset:0;z-index:4;pointer-events:none;display:none}
#fpHud.show{display:block}
/* 屏幕中心准星（替代鼠标光标） */
#fpCross{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:32px;height:32px}
#fpCross::before,#fpCross::after{content:'';position:absolute;background:rgba(255,255,255,.85);box-shadow:0 0 4px rgba(0,0,0,.7),0 0 2px rgba(0,0,0,.9)}
#fpCross::before{left:50%;top:0;bottom:0;width:2px;transform:translateX(-50%)}
#fpCross::after{top:50%;left:0;right:0;height:2px;transform:translateY(-50%)}
/* 准星中心点 */
#fpCross .dot{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:4px;height:4px;border-radius:50%;background:var(--brand);box-shadow:0 0 4px rgba(0,0,0,.7)}
/* 准星外环（瞄准感） */
#fpCross .ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:28px;height:28px;border:1.5px solid rgba(255,255,255,.5);border-radius:50%;box-shadow:0 0 3px rgba(0,0,0,.5)}
#fpInfo{position:absolute;bottom:38px;left:14px;font-size:11px;color:rgba(246,242,233,.9);background:rgba(38,35,29,.7);padding:6px 12px;letter-spacing:.05em;border-left:2px solid var(--brand);line-height:1.6}
#fpInfo b{color:var(--brand)}
#fpSit{position:absolute;top:50%;left:50%;transform:translate(-50%,calc(-50% + 40px));font-size:12px;color:var(--paper);background:rgba(38,35,29,.85);padding:6px 14px;border:1px solid var(--brand);letter-spacing:.05em;display:none}
#fpSit.show{display:block;animation:popin .2s ease}
#fpDoor{position:absolute;top:50%;left:50%;transform:translate(-50%,calc(-50% + 70px));font-size:12px;color:var(--paper);background:rgba(38,35,29,.85);padding:6px 14px;border:1px solid var(--safe);letter-spacing:.05em;display:none}
#fpDoor.show{display:block;animation:popin .2s ease}
/* 点击锁定提示 */
#fpLock{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:13px;color:var(--paper);background:rgba(38,35,29,.85);padding:10px 22px;border:1px solid var(--brand);letter-spacing:.05em;display:none;text-align:center;line-height:1.8}
#fpLock.show{display:block}
#fpLock b{color:var(--brand)}
/* 人物模式：隐藏系统鼠标光标，用准星替代 */
body.char-fp-locked{cursor:none}
body.char-fp-locked #viewport{cursor:none}
body.char-fp-locked #topbar{cursor:default}
body.char-fp-locked #charPop{cursor:default}
body.char-fp-locked #costPanel{cursor:default}
body.char-fp-locked #creatorOv{cursor:default}
/* 第三人称指示器 */
#tpHud{position:absolute;bottom:38px;left:14px;z-index:4;display:none;font-size:11px;color:rgba(246,242,233,.9);background:rgba(38,35,29,.7);padding:6px 12px;border-left:2px solid var(--brand);letter-spacing:.05em;line-height:1.6}
#tpHud.show{display:block}
`;
  document.head.appendChild(s);
})();

/* ── 预设人物定义 ── */
const CHARACTERS=[
  {id:'customer',name:'顾客',icon:'🧍',desc:'来访客人 · 暖色休闲装',
   body:'#C75B39',head:'#E8C9A0',hair:'#3A2A1A',legs:'#4A4540'},
  {id:'staff',name:'店员',icon:'👨‍🍳',desc:'工作人员 · 深色围裙',
   body:'#F4EFE4',head:'#E8C9A0',hair:'#1A1A1A',legs:'#2A2620',apron:'#3A3633'},
  {id:'designer',name:'设计师',icon:'👩‍🎨',desc:'空间设计 · 黑色职业装',
   body:'#2A2620',head:'#E8C9A0',hair:'#4A2818',legs:'#1A1A1A'},
];

/* ── 人物状态 ── */
let charGroup=null;
let charActive=false;
let charFPV=true;
let charPos={x:0,z:0,y:0};
let charYaw=0;
let charPitch=0;
let charFloor=0;
let charKeys={};
let charCurrentIdx=-1;
/* 灵敏度（可调） */
let charMouseSens=0.0025;  /* 鼠标灵敏度 */
let charMoveSpeed=2.4;     /* 移动速度 m/s */
/* 跳跃 */
let charVelY=0;            /* 垂直速度 */
let charGroundY=0;         /* 当前地面高度（楼层*层高） */
let charJumping=false;
let charJumpCount=0;    /* 二段跳计数 */
let charJumpPrev=false; /* 空格键上一帧状态（防止连按） */
/* 坐下 */
let charSitting=false;
let charSeatItem=null;     /* 当前坐的椅子 */
/* 鼠标跟随（无需点击） */
let charMouseInCanvas=false;
let charMouseX=0,charMouseY=0;
/* Pointer Lock 状态（第一人称：鼠标锁定到屏幕中心，准星替代光标） */
let charLocked=false;

/* ── 构建人物 3D 模型（高级人体建模） ── */
function buildCharacter(cfg){
  const g=new THREE.Group();
  const M=(color,rough=.7,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});

  /* ── 腿（大腿+小腿+关节+鞋，高细节） ── */
  function leg(x){
    const lg=new THREE.Group();
    /* 髋关节球 */
    const hip=new THREE.Mesh(new THREE.SphereGeometry(0.06,16,12),M(cfg.legs,.7));hip.position.y=0.78;lg.add(hip);
    /* 大腿（锥形，上粗下细） */
    const thigh=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.06,0.35,16),M(cfg.legs,.72));thigh.position.y=0.55;thigh.castShadow=true;lg.add(thigh);
    /* 膝关节 */
    const knee=new THREE.Mesh(new THREE.SphereGeometry(0.058,16,12),M(cfg.legs,.7));knee.position.y=0.37;lg.add(knee);
    /* 小腿（锥形） */
    const shin=new THREE.Mesh(new THREE.CylinderGeometry(0.058,0.045,0.32,16),M(cfg.legs,.68));shin.position.y=0.2;shin.castShadow=true;lg.add(shin);
    /* 脚踝 */
    const ankle=new THREE.Mesh(new THREE.SphereGeometry(0.045,12,10),M(cfg.legs,.7));ankle.position.y=0.04;lg.add(ankle);
    /* 鞋（高细节：鞋身+鞋底） */
    const shoeBody=new THREE.Mesh(new THREE.BoxGeometry(0.11,0.07,0.22),M('#2A2620',.5));shoeBody.position.set(0,0.035,0.04);shoeBody.castShadow=true;lg.add(shoeBody);
    const shoeSole=new THREE.Mesh(new THREE.BoxGeometry(0.115,0.02,0.24),M('#1A1A1A',.6));shoeSole.position.set(0,0.005,0.04);lg.add(shoeSole);
    lg.position.x=x;return lg;
  }
  g.add(leg(-0.11),leg(0.11));

  /* ── 骨盆 ── */
  const pelvis=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.12,0.2),M(cfg.legs,.75));pelvis.position.set(0,0.78,0);pelvis.castShadow=true;g.add(pelvis);

  /* ── 躯干（LatheGeometry 曲线胸腰，更贴合人体） ── */
  const torsoPts=[];
  /* 腰→胸的轮廓点（从下到上） */
  torsoPts.push(new THREE.Vector2(0.0,0));
  torsoPts.push(new THREE.Vector2(0.14,0.02));
  torsoPts.push(new THREE.Vector2(0.13,0.1));
  torsoPts.push(new THREE.Vector2(0.11,0.2));
  torsoPts.push(new THREE.Vector2(0.13,0.3));
  torsoPts.push(new THREE.Vector2(0.15,0.4));
  torsoPts.push(new THREE.Vector2(0.14,0.45));
  torsoPts.push(new THREE.Vector2(0.0,0.46));
  const torsoGeo=new THREE.LatheGeometry(torsoPts,24);
  const torso=new THREE.Mesh(torsoGeo,M(cfg.body,.62));torso.position.set(0,0.78,0);torso.castShadow=true;g.add(torso);

  /* 胸肌/衣领细节 */
  const collar=new THREE.Mesh(new THREE.TorusGeometry(0.12,0.015,8,20,Math.PI),M(cfg.body,.6));collar.position.set(0,1.2,0.04);collar.rotation.x=Math.PI*0.45;g.add(collar);

  /* 腰带 */
  const belt=new THREE.Mesh(new THREE.CylinderGeometry(0.155,0.145,0.05,20),M('#2A2620',.55));belt.position.set(0,0.82,0);g.add(belt);
  /* 腰带扣 */
  const buckle=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.035,0.02),M('#C0A060',.3,0.8));buckle.position.set(0,0.82,0.15);g.add(buckle);

  /* 围裙（店员） */
  if(cfg.apron){
    const apronPts=[new THREE.Vector2(0.0,0),new THREE.Vector2(0.18,0),new THREE.Vector2(0.18,0.55),new THREE.Vector2(0.0,0.55)];
    const apronGeo=new THREE.LatheGeometry(apronPts,1);
    const apron=new THREE.Mesh(new THREE.BoxGeometry(0.38,0.55,0.04),M(cfg.apron,.75));apron.position.set(0,0.95,0.14);g.add(apron);
    /* 围裙带（肩带） */
    const strapL=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.4,8),M(cfg.apron,.7));strapL.position.set(-0.08,1.15,0.13);strapL.rotation.z=0.2;g.add(strapL);
    const strapR=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.4,8),M(cfg.apron,.7));strapR.position.set(0.08,1.15,0.13);strapR.rotation.z=-0.2;g.add(strapR);
    /* 围裙口袋 */
    const pocket=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.1,0.02),M(cfg.apron,.8));pocket.position.set(0,0.95,0.16);g.add(pocket);
  }

  /* ── 肩膀（球） ── */
  const shoulderL=new THREE.Mesh(new THREE.SphereGeometry(0.07,16,12),M(cfg.body,.6));shoulderL.position.set(-0.16,1.18,0);g.add(shoulderL);
  const shoulderR=new THREE.Mesh(new THREE.SphereGeometry(0.07,16,12),M(cfg.body,.6));shoulderR.position.set(0.16,1.18,0);g.add(shoulderR);

  /* ── 手臂（上臂+肘+前臂+腕+手，高细节） ── */
  function arm(x){
    const ag=new THREE.Group();
    /* 上臂（锥形） */
    const upper=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.042,0.28,14),M(cfg.body,.63));upper.position.y=1.0;upper.castShadow=true;ag.add(upper);
    /* 肘关节 */
    const elbow=new THREE.Mesh(new THREE.SphereGeometry(0.042,14,12),M(cfg.body,.65));elbow.position.y=0.85;ag.add(elbow);
    /* 前臂（锥形） */
    const fore=new THREE.Mesh(new THREE.CylinderGeometry(0.042,0.035,0.26,14),M(cfg.head,.6));fore.position.y=0.7;fore.castShadow=true;ag.add(fore);
    /* 手腕 */
    const wrist=new THREE.Mesh(new THREE.SphereGeometry(0.035,12,10),M(cfg.head,.6));wrist.position.y=0.56;ag.add(wrist);
    /* 手（手掌+四指简化） */
    const hand=new THREE.Group();
    const palm=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.08,0.025),M(cfg.head,.55));hand.add(palm);
    /* 四指 */
    for(let i=0;i<4;i++){
      const finger=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.006,0.04,6),M(cfg.head,.55));
      finger.position.set(-0.018+i*0.012,-0.05,0);hand.add(finger);
    }
    /* 拇指 */
    const thumb=new THREE.Mesh(new THREE.CylinderGeometry(0.009,0.007,0.03,6),M(cfg.head,.55));
    thumb.position.set(0.03,-0.01,0.01);thumb.rotation.z=-0.6;hand.add(thumb);
    hand.position.y=0.5;ag.add(hand);
    ag.position.x=x;return ag;
  }
  g.add(arm(-0.17),arm(0.17));

  /* ── 脖子（圆柱+喉结） ── */
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.065,0.1,12),M(cfg.head,.6));neck.position.set(0,1.28,0);g.add(neck);

  /* ── 头（球+下颌轮廓，高细节） ── */
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.14,28,22),M(cfg.head,.55));head.position.set(0,1.43,0);head.castShadow=true;g.add(head);
  /* 下颌 */
  const jaw=new THREE.Mesh(new THREE.SphereGeometry(0.11,20,16,0,Math.PI*2,Math.PI*0.55,Math.PI*0.45),M(cfg.head,.55));jaw.position.set(0,1.38,0.01);jaw.scale.set(1,0.6,1);g.add(jaw);

  /* ── 头发（多层，自然造型） ── */
  const hairTop=new THREE.Mesh(new THREE.SphereGeometry(0.148,24,18,0,Math.PI*2,0,Math.PI*0.6),M(cfg.hair,.85));hairTop.position.set(0,1.45,0);g.add(hairTop);
  /* 刘海 */
  const bangs=new THREE.Mesh(new THREE.SphereGeometry(0.13,16,12,Math.PI*0.3,Math.PI*0.4,0,Math.PI*0.5),M(cfg.hair,.85));bangs.position.set(0,1.5,0.08);g.add(bangs);
  /* 侧发 */
  const sideHairL=new THREE.Mesh(new THREE.SphereGeometry(0.05,12,10),M(cfg.hair,.85));sideHairL.position.set(-0.12,1.42,0.02);g.add(sideHairL);
  const sideHairR=new THREE.Mesh(new THREE.SphereGeometry(0.05,12,10),M(cfg.hair,.85));sideHairR.position.set(0.12,1.42,0.02);g.add(sideHairR);

  /* ── 五官（高细节） ── */
  /* 眉毛 */
  const browMat=new THREE.MeshBasicMaterial({color:cfg.hair});
  const browL=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.008,0.008),browMat);browL.position.set(-0.04,1.48,0.13);browL.rotation.z=0.05;g.add(browL);
  const browR=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.008,0.008),browMat);browR.position.set(0.04,1.48,0.13);browR.rotation.z=-0.05;g.add(browR);
  /* 眼睛（眼白+瞳孔+虹膜） */
  const eyeWhiteMat=new THREE.MeshStandardMaterial({color:'#F8F4EE',roughness:0.3});
  const irisMat=new THREE.MeshStandardMaterial({color:'#5A4A3A',roughness:0.2});
  const pupilMat=new THREE.MeshBasicMaterial({color:'#1A1A1A'});
  function eye(x){
    const eg=new THREE.Group();
    const w=new THREE.Mesh(new THREE.SphereGeometry(0.02,14,10),eyeWhiteMat);eg.add(w);
    const iris=new THREE.Mesh(new THREE.CircleGeometry(0.011,12),irisMat);iris.position.z=0.018;eg.add(iris);
    const p=new THREE.Mesh(new THREE.CircleGeometry(0.006,10),pupilMat);p.position.z=0.02;eg.add(p);
    eg.position.set(x,1.45,0.12);return eg;
  }
  g.add(eye(-0.045),eye(0.045));
  /* 鼻子（锥形） */
  const nose=new THREE.Mesh(new THREE.ConeGeometry(0.022,0.05,10),M(cfg.head,.5));nose.position.set(0,1.43,0.15);nose.rotation.x=Math.PI/2;g.add(nose);
  /* 嘴唇（上下唇） */
  const lipMat=new THREE.MeshStandardMaterial({color:'#B8685A',roughness:0.4});
  const upperLip=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.012,0.01),lipMat);upperLip.position.set(0,1.4,0.14);g.add(upperLip);
  const lowerLip=new THREE.Mesh(new THREE.BoxGeometry(0.045,0.014,0.01),lipMat);lowerLip.position.set(0,1.385,0.14);g.add(lowerLip);
  /* 耳朵 */
  const earMat=M(cfg.head,.55);
  const earL=new THREE.Mesh(new THREE.SphereGeometry(0.025,10,8),earMat);earL.position.set(-0.14,1.44,0);earL.scale.set(0.6,1,0.5);g.add(earL);
  const earR=new THREE.Mesh(new THREE.SphereGeometry(0.025,10,8),earMat);earR.position.set(0.14,1.44,0);earR.scale.set(0.6,1,0.5);g.add(earR);

  g.userData.cfg=cfg;
  return g;
}

/* ── 碰撞检测 ── */
function charCollides(x,z){
  const r=0.22;
  for(const it of items){
    if(it.floor!==charFloor)continue;
    const c=CATALOG[it.type];if(!c)continue;
    if(c.stair){
      const dx=Math.abs(it.group.position.x-x),dz=Math.abs(it.group.position.z-z);
      if(dx<c.w/2&&dz<c.d/2)return {stair:true,item:it};
      continue;
    }
    /* 门不参与碰撞（允许通过门走出） */
    if(it.type==='door')continue;
    const cs=Math.abs(Math.cos(it.rot||0)),sn=Math.abs(Math.sin(it.rot||0));
    const hw=c.w/2*cs+c.d/2*sn+r,hd=c.w/2*sn+c.d/2*cs+r;
    const dx=Math.abs(it.group.position.x-x),dz=Math.abs(it.group.position.z-z);
    if(dx<hw&&dz<hd)return true;
  }
  return false;
}

/* ── 门交互（按 F 开门/关门，门有打开/关闭状态）── */
let doorOpenState={}; /* key: door id, value: true=open */
let exitDoorMeshes=[]; /* 房间入口门的 mesh 引用 */
function findNearestDoor(){
  let best=null,bestD=2.5;
  /* 检查家具中的门 */
  for(const it of items){
    if(it.floor!==charFloor)continue;
    if(it.type!=='door')continue;
    const dx=it.group.position.x-charPos.x,dz=it.group.position.z-charPos.z;
    const d=Math.hypot(dx,dz);
    if(d<bestD){bestD=d;best={type:'furniture',ref:it,label:'门'};}
  }
  /* 检查房间入口门（exitDoor，在 roomGroup 中） */
  if(exitDoorMeshes.length===0&&typeof roomGroup!=='undefined'){
    /* 查找 exitDoor mesh（带 userData.tex 的） */
    roomGroup.traverse(o=>{
      if(o.userData&&o.userData.tex){
        exitDoorMeshes.push(o);
      }
    });
  }
  const w=room.w,d=room.d;
  const fixedDoors=[
    {x:w*0.28,z:d/2-0.05,label:'主入口'},
    {x:w*0.43,z:-d/2+0.05,label:'后门'},
  ];
  exitDoorMeshes.forEach((mesh,i)=>{
    if(i<fixedDoors.length){
      const fd=fixedDoors[i];
      const dx=fd.x-charPos.x,dz=fd.z-charPos.z;
      const dist=Math.hypot(dx,dz);
      if(dist<bestD){bestD=dist;best={type:'exit',ref:mesh,label:fd.label,index:i};}
    }
  });
  return best;
}
function toggleDoor(){
  const door=findNearestDoor();
  if(!door)return showToast('附近没有门，靠近门后按 F','warn');
  if(door.type==='exit'){
    /* 房间入口门：旋转门框打开 */
    const isOpen=doorOpenState['exit_'+door.index];
    if(isOpen){
      door.ref.rotation.y=door.ref.userData.origRot||0;
      doorOpenState['exit_'+door.index]=false;
      showToast(door.label+' 已关闭');
    }else{
      door.ref.userData.origRot=door.ref.rotation.y;
      door.ref.rotation.y+=Math.PI/2;
      doorOpenState['exit_'+door.index]=true;
      showToast(door.label+' 已打开');
    }
  }else{
    /* 家具门：旋转 */
    const it=door.ref;
    const id=it.id;
    const isOpen=doorOpenState[id];
    if(isOpen){
      it.group.rotation.y=it.rot||0;
      doorOpenState[id]=false;
      showToast('门已关闭');
    }else{
      it.group.rotation.y=(it.rot||0)+Math.PI/2;
      doorOpenState[id]=true;
      showToast('门已打开');
    }
  }
}

/* ── 查找最近的椅子（用于坐下） ── */
function findNearestSeat(){
  let best=null,bestD=1.0;
  for(const it of items){
    if(it.floor!==charFloor)continue;
    const c=CATALOG[it.type];if(!c)continue;
    /* 椅子类型：含 seat 的或名称含椅/凳/沙发 */
    const isSeat=(c.cat==='seat')||['chair','stool','barStool','sofa','armchair','diningChair','bench','pouf','officeChair'].includes(it.type);
    if(!isSeat)continue;
    const dx=it.group.position.x-charPos.x,dz=it.group.position.z-charPos.z;
    const d=Math.hypot(dx,dz);
    if(d<bestD){bestD=d;best=it;}
  }
  return best;
}

/* ── 坐下 / 起立 ── */
function toggleSit(){
  if(charSitting){
    /* 起立：先移开椅子位置避免被卡住 */
    charSitting=false;
    charGroup.scale.y=1; /* 恢复身高 */
    /* 起立时向人物朝向前进 0.6m，离开椅子碰撞区 */
    const offX=Math.sin(charYaw)*0.6, offZ=Math.cos(charYaw)*0.6;
    let nx=charPos.x+offX, nz=charPos.z+offZ;
    nx=clamp(nx,-room.w/2+0.3,room.w/2-0.3);
    nz=clamp(nz,-room.d/2+0.3,room.d/2-0.3);
    /* 检查起立目标点是否碰撞（椅子本身允许，避免卡住） */
    const col=charCollidesSkipSeat(nx,nz);
    if(col===true){
      /* 前方有障碍，尝试左右或后退 */
      const sideX=Math.cos(charYaw)*0.6, sideZ=-Math.sin(charYaw)*0.6;
      nx=clamp(charPos.x+sideX,-room.w/2+0.3,room.w/2-0.3);
      nz=clamp(charPos.z+sideZ,-room.d/2+0.3,room.d/2-0.3);
      if(charCollidesSkipSeat(nx,nz)===true){
        /* 后退离开 */
        nx=clamp(charPos.x-offX,-room.w/2+0.3,room.w/2-0.3);
        nz=clamp(charPos.z-offZ,-room.d/2+0.3,room.d/2-0.3);
      }
    }
    charPos.x=nx;charPos.z=nz;
    charPos.y=charGroundY;
    if(charGroup){
      charGroup.visible=!charFPV;
      /* 恢复腿/臂旋转（行走动画状态） */
      resetCharPose();
    }
    charSeatItem=null;
    showToast('已起立');
  }else{
    /* 找最近椅子 */
    const seat=findNearestSeat();
    if(!seat)return showToast('附近没有椅子可坐','warn');
    const c=CATALOG[seat.type];
    charSeatItem=seat;
    charPos.x=seat.group.position.x;
    charPos.z=seat.group.position.z;
    charPos.y=charGroundY+0.45;
    charYaw=seat.rot||0;
    charSitting=true;
    if(charGroup){
      charGroup.position.set(charPos.x,charPos.y,charPos.z);
      charGroup.rotation.y=charYaw;
      charGroup.visible=!charFPV;
      applySitPose(); /* 坐姿：腿弯曲、手臂前放 */
    }
    showToast('已坐下 · 按 E 起立');
  }
  updateCharHUD();
}
/* 碰撞检测但跳过椅子（起立时允许离开椅子区域） */
function charCollidesSkipSeat(x,z){
  const r=0.22;
  for(const it of items){
    if(it.floor!==charFloor)continue;
    if(it===charSeatItem)continue; /* 跳过当前椅子 */
    const c=CATALOG[it.type];if(!c)continue;
    if(c.stair)continue;
    /* 门不参与碰撞（允许通过门走出） */
    if(it.type==='door')continue;
    if(it.type==='door')continue;
    const cs=Math.abs(Math.cos(it.rot||0)),sn=Math.abs(Math.sin(it.rot||0));
    const hw=c.w/2*cs+c.d/2*sn+r,hd=c.w/2*sn+c.d/2*cs+r;
    const dx=Math.abs(it.group.position.x-x),dz=Math.abs(it.group.position.z-z);
    if(dx<hw&&dz<hd)return true;
  }
  return false;
}
/* 坐姿：腿弯曲、手臂前放 */
function applySitPose(){
  if(!charGroup)return;
  /* 腿（children 0,1）向前弯曲 90° */
  if(charGroup.children[0])charGroup.children[0].rotation.x=Math.PI/2.2;
  if(charGroup.children[1])charGroup.children[1].rotation.x=Math.PI/2.2;
  /* 手臂前放（children 6,7 约为手臂）*/
  if(charGroup.children[6])charGroup.children[6].rotation.x=-0.5;
  if(charGroup.children[7])charGroup.children[7].rotation.x=-0.5;
}
function resetCharPose(){
  if(!charGroup)return;
  for(let i=0;i<charGroup.children.length;i++){
    charGroup.children[i].rotation.x=0;
  }
}

/* ── 计算出生点：房间入口正前方的空地 ── */
/* 房间入口在南墙（z=+d/2）中央附近，出生点应在入口内侧的空地，面向房间内部（-z 方向） */
function getSpawnPosition(){
  /* 入口在 z=room.d/2，向内 1m 处，中央偏左（避开吧台） */
  const sx=0;
  const sz=room.d/2-1.2;  /* 入口内侧 1.2m */
  /* 找附近空地（避开家具）：从入口位置向内搜索 */
  for(let step=0;step<8;step++){
    const testZ=sz-step*0.3;
    const testX=sx;
    let blocked=false;
    for(const it of items){
      if(it.floor!==0)continue;
      const c=CATALOG[it.type];if(!c)continue;
      const dx=Math.abs(it.group.position.x-testX),dz=Math.abs(it.group.position.z-testZ);
      if(dx<c.w/2+0.4&&dz<c.d/2+0.4){blocked=true;break;}
    }
    if(!blocked)return{x:testX,z:testZ,y:0};
  }
  return{x:sx,z:sz,y:0};
}
function resetCharPosition(){
  const sp=getSpawnPosition();
  charPos={x:sp.x,z:sp.z,y:charFloor*room.h};
  charGroundY=charFloor*room.h;
  charYaw=0;charPitch=0;charVelY=0;charJumping=false;charJumpCount=0;charJumpPrev=false;charSitting=false;charSeatItem=null;
  if(charGroup){
    charGroup.scale.y=1;
    charGroup.position.set(charPos.x,charPos.y,charPos.z);
    charGroup.rotation.y=charYaw;
  }
  applyCharCamera();
  showToast('已重置到出生点');
}

/* ── 进入人物模式 ── */
function enterCharacter(idx){
  charCurrentIdx=idx;
  const cfg=CHARACTERS[idx];
  if(charGroup){scene.remove(charGroup);charGroup.traverse(o=>{if(o.isMesh)o.geometry.dispose();});}
  charGroup=buildCharacter(cfg);
  scene.add(charGroup);
  /* 出生点：入口正前方空地，面向房间内部 */
  const sp=getSpawnPosition();
  charPos={x:sp.x,z:sp.z,y:0};
  charGroundY=0;
  charFloor=0;
  charYaw=0;charPitch=0;charVelY=0;charJumping=false;charJumpCount=0;charJumpPrev=false;charSitting=false;charSeatItem=null;
  charGroup.position.set(charPos.x,charPos.y,charPos.z);
  charGroup.rotation.y=charYaw;
  charActive=true;
  /* charFPV 由面板预选决定（默认第一人称） */
  if(ring)ring.visible=false;
  updateCharHUD();
  showToast(cfg.name+' · 点击画面锁定鼠标环顾 · WASD 移动 · Shift 加速 · 空格二段跳');
  applyCharCamera();
  renderCharList();
}
function exitCharacter(){
  charActive=false;
  /* 退出 Pointer Lock */
  if(charLocked&&document.exitPointerLock){document.exitPointerLock();}
  charLocked=false;
  document.body.classList.remove('char-fp-locked');
  if(charGroup){scene.remove(charGroup);charGroup.traverse(o=>{if(o.isMesh)o.geometry.dispose();});charGroup=null;}
  charCurrentIdx=-1;charSitting=false;charSeatItem=null;
  if(ring)ring.visible=true;
  updateCharHUD();
  /* 恢复按钮：显示进入，隐藏退出 */
  const enterBtn=document.getElementById('charEnterBtn');
  const exitBtn=document.getElementById('charExitBtn');
  if(enterBtn)enterBtn.style.display='';
  if(exitBtn)exitBtn.style.display='none';
  const maxD=Math.max(room.w,room.d);
  goal.radius=Math.min(50,maxD*1.6);goal.theta=.62;goal.phi=1.02;goal.tx=0;goal.ty=.6;goal.tz=0;
  showToast('已退出人物模式');
  renderCharList();
}

/* ── 人物相机 ── */
let tpLookAt=new THREE.Vector3(0,1.2,0); /* 第三人称视线目标点（由鼠标射线更新） */
function applyCharCamera(){
  if(!charActive||!charGroup)return;
  if(charFPV){
    const eyeY=charSitting?0.95:1.46;
    camera.position.set(charPos.x,charPos.y+eyeY,charPos.z);
    /* yaw=0 面向 -z（房间内部）, forward = (sin(yaw), 0, -cos(yaw)) */
    const lookX=charPos.x+Math.sin(charYaw)*Math.cos(charPitch);
    const lookY=charPos.y+eyeY+Math.sin(charPitch);
    const lookZ=charPos.z-Math.cos(charYaw)*Math.cos(charPitch);
    camera.lookAt(lookX,lookY,lookZ);
  }else{
    const dist=3.4,height=1.5;
    /* 相机在人物后方（+z 方向，因为人物面向 -z） */
    const cx=charPos.x-Math.sin(charYaw)*dist*Math.cos(charPitch);
    const cz=charPos.z+Math.cos(charYaw)*dist*Math.cos(charPitch);
    const cy=charPos.y+height+Math.sin(charPitch)*dist;
    camera.position.set(cx,cy,cz);
    const lookX=charPos.x+Math.sin(charYaw)*Math.cos(charPitch)*2;
    const lookY=charPos.y+1.2+Math.sin(charPitch)*2;
    const lookZ=charPos.z-Math.cos(charYaw)*Math.cos(charPitch)*2;
    camera.lookAt(lookX,lookY,lookZ);
  }
}

/* ── 人物移动 + 跳跃 ── */
function updateCharacter(dt){
  if(!charActive)return;
  /* 坐下时不能移动/跳 */
  if(!charSitting){
    let mx=0,mz=0;
    if(charKeys['w']||charKeys['W']||charKeys['ArrowUp'])mz+=1;
    if(charKeys['s']||charKeys['S']||charKeys['ArrowDown'])mz-=1;
    if(charKeys['a']||charKeys['A']||charKeys['ArrowLeft'])mx-=1;
    if(charKeys['d']||charKeys['D']||charKeys['ArrowRight'])mx+=1;
    /* 快速移动：按住 Shift 加速 */
    const isSprinting=charKeys['Shift']||charKeys['shift'];
    if(mx||mz){
      const len=Math.hypot(mx,mz);mx/=len;mz/=len;
      const speed=charMoveSpeed*(charJumping?0.6:1)*(isSprinting?2.5:1);
      /* 移动方向：W 前进（朝向 -z 即 charYaw 方向），A 左移（相对朝向左侧）
         charYaw=0 时面向 -z；前进 = (sin(yaw), cos(yaw))*-1? 让我们用标准 FPS：
         forward = (sin(yaw), cos(yaw)) 朝向相机看的方向（-z 为前）
         right = (cos(yaw), -sin(yaw)) */
      /* forward = (sin(yaw), 0, -cos(yaw)), yaw=0 → (0,0,-1) = -z (into room) */
      const fx=Math.sin(charYaw), fz=-Math.cos(charYaw); /* 前进方向 */
      /* right = cross(forward, up) = cross((sin,0,-cos), (0,1,0)) = (cos, 0, sin)
         yaw=0 → right = (1,0,0) = +x ✓ (面向-z时右手边是+x) */
      const rx=Math.cos(charYaw), rz=Math.sin(charYaw); /* 右移方向 */
      const nx=charPos.x+(mx*rx+mz*fx)*speed*dt;
      const nz=charPos.z+(mx*rz+mz*fz)*speed*dt;
      /* 放宽边界：允许在房间周围大范围自由活动 */
      const bx=clamp(nx,-room.w/2-30,room.w/2+30);
      const bz=clamp(nz,-room.d/2-30,room.d/2+30);
      /* 仅检测家具碰撞（不检测墙壁，允许自由活动） */
      const col=charCollides(bx,bz);
      if(col===true){/* 撞家具 */}
      else if(col&&col.stair){
        if(charFloor===0&&room.floors===2){charFloor=1;charGroundY=room.h;charPos.y=room.h;showToast('已上到二层');}
      }else{charPos.x=bx;charPos.z=bz;}
    }
    /* 跳跃：空格，二段跳（可连跳两次） */
    if(charKeys[' ']&&!charJumpPrev){
      if(!charJumping){
        /* 第一段跳 */
        charVelY=3.2;charJumping=true;charJumpCount=1;
      }else if(charJumpCount<2){
        /* 二段跳 */
        charVelY=2.8;charJumpCount=2;
      }
      charJumpPrev=true;
    }
    if(!charKeys[' '])charJumpPrev=false;
    if(charJumping){
      charPos.y+=charVelY*dt;
      charVelY-=9.8*dt;
      if(charPos.y<=charGroundY){charPos.y=charGroundY;charVelY=0;charJumping=false;charJumpCount=0;}
    }
  }
  /* 更新人物模型 */
  if(charGroup){
    charGroup.position.set(charPos.x,charPos.y,charPos.z);
    charGroup.rotation.y=charYaw;
    charGroup.visible=!charFPV;
    /* 行走/跳跃动画（仅非坐下时） */
    if(!charSitting){
      const moving=(charKeys['w']||charKeys['s']||charKeys['a']||charKeys['d']||charKeys['ArrowUp']||charKeys['ArrowDown']||charKeys['ArrowLeft']||charKeys['ArrowRight']);
      if(moving&&!charJumping){
        /* 行走动画：腿摆动 + 手臂反向摆动 + 身体轻微上下 */
        if(charGroup.userData.walkT===undefined)charGroup.userData.walkT=0;
        charGroup.userData.walkT+=dt*9;
        const sw=Math.sin(charGroup.userData.walkT);
        const sw2=Math.cos(charGroup.userData.walkT);
        /* 腿（children 0,1）：前后摆动 */
        if(charGroup.children[0])charGroup.children[0].rotation.x=sw*0.5;
        if(charGroup.children[1])charGroup.children[1].rotation.x=-sw*0.5;
        /* 手臂（children 6,7）：反向摆动 */
        if(charGroup.children[6])charGroup.children[6].rotation.x=-sw*0.35;
        if(charGroup.children[7])charGroup.children[7].rotation.x=sw*0.35;
        /* 身体上下浮动（走路弹跳） */
        charGroup.position.y=charPos.y+Math.abs(sw2)*0.03;
        /* 身体左右微晃 */
        charGroup.rotation.z=sw*0.03;
      }else if(charJumping){
        /* 跳跃动画：腿收起、手臂张开 */
        if(charGroup.children[0])charGroup.children[0].rotation.x=0.6;
        if(charGroup.children[1])charGroup.children[1].rotation.x=0.6;
        if(charGroup.children[6])charGroup.children[6].rotation.z=-0.4;
        if(charGroup.children[7])charGroup.children[7].rotation.z=0.4;
        charGroup.rotation.z=0;
      }else{
        /* 站立：恢复 */
        resetCharPose();
      }
    }
  }
}

/* ── HUD ── */
function updateCharHUD(){
  const fpHud=document.getElementById('fpHud');
  const tpHud=document.getElementById('tpHud');
  const fpSit=document.getElementById('fpSit');
  const fpLock=document.getElementById('fpLock');
  /* 第一/第三人称均显示准星 HUD（fpHud 含准星） */
  if(fpHud){
    if(charActive){
      fpHud.classList.add('show');
      const cfg=charCurrentIdx>=0?CHARACTERS[charCurrentIdx]:null;
      const fl=room.floors===2?(charFloor?'二层':'一层'):'一层';
      const view=charFPV?'第一人称':'第三人称';
      document.getElementById('fpInfo').innerHTML=`<b>${cfg?cfg.name:''}</b> · ${view} · ${fl}${charSitting?' · 坐下':''} · WASD · Shift加速 · 空格二段跳 · E坐 · F门 · V切换`;
    }else fpHud.classList.remove('show');
  }
  /* 锁定提示：未锁定时显示"点击画面锁定" */
  if(fpLock){
    if(charActive&&!charLocked)fpLock.classList.add('show');
    else fpLock.classList.remove('show');
  }
  if(fpSit){
    /* 显示"按 E 坐下"提示 */
    if(charActive&&!charSitting){
      const seat=findNearestSeat();
      if(seat)fpSit.classList.add('show');else fpSit.classList.remove('show');
    }else fpSit.classList.remove('show');
  }
  /* 门交互提示 */
  const fpDoor=document.getElementById('fpDoor');
  if(fpDoor){
    if(charActive){
      const door=findNearestDoor();
      if(door){
        const id=door.type==='exit'?'exit_'+door.index:door.ref.id;
        const isOpen=doorOpenState[id];
        fpDoor.textContent=isOpen?'按 F 关门':'按 F 开门';
        fpDoor.classList.add('show');
      }else fpDoor.classList.remove('show');
    }else fpDoor.classList.remove('show');
  }
  if(tpHud){
    if(charActive&&!charFPV){
      tpHud.classList.add('show');
      const cfg=charCurrentIdx>=0?CHARACTERS[charCurrentIdx]:null;
      const fl=room.floors===2?(charFloor?'二层':'一层'):'一层';
      tpHud.innerHTML=`<b>${cfg?cfg.name:''}</b> · 第三人称 · ${fl}${charSitting?' · 坐下':''} · WASD · 空格跳 · E坐 · V切第一人称`;
    }else tpHud.classList.remove('show');
  }
}

/* ── 人物面板：选择人物（仅选中，不进入）── */
let charSelectedIdx=-1;  /* 预选选中的角色（未进入模式） */
function renderCharList(){
  const cl=document.getElementById('charList');if(!cl)return;
  cl.innerHTML='';
  CHARACTERS.forEach((c,i)=>{
    const sel=charCurrentIdx===i||(charCurrentIdx<0&&charSelectedIdx===i);
    const card=document.createElement('div');card.className='charCard'+(sel?' on':'');
    card.innerHTML=`<div class="av" style="background:${c.body}22;color:${c.body}">${c.icon}</div><div class="info"><div class="nm">${c.name}</div><div class="desc">${c.desc}</div></div>`;
    card.onclick=()=>{
      /* 仅选中，不进入模式 */
      charSelectedIdx=i;
      renderCharList();
    };
    cl.appendChild(card);
  });
  const fp=document.querySelector('#charPop .charCtrl button[data-v=fp]');
  const tp=document.querySelector('#charPop .charCtrl button[data-v=tp]');
  if(fp&&tp){fp.classList.toggle('on',charActive&&charFPV);tp.classList.toggle('on',charActive&&!charFPV);}
  /* 灵敏度滑杆同步 */
  const ms=document.getElementById('charMouseSens');if(ms)ms.value=charMouseSens*10000;
  const msv=document.getElementById('charMouseSensV');if(msv)msv.textContent=(charMouseSens*10000).toFixed(1);
  const sp=document.getElementById('charMoveSpeed');if(sp)sp.value=charMoveSpeed;
  const spv=document.getElementById('charMoveSpeedV');if(spv)spv.textContent=charMoveSpeed.toFixed(1);
  /* 「进入人物模式」按钮可用状态 */
  const enterBtn=document.getElementById('charEnterBtn');
  if(enterBtn){
    const ready=charSelectedIdx>=0;
    enterBtn.classList.toggle('ready',ready);
    enterBtn.textContent=charActive?'已进入 · 点击重置位置':'进入人物模式';
  }
}

function setupCharacter(){
  const topbar=document.getElementById('topbar');
  const charBtn=document.createElement('button');charBtn.className='tbtn';charBtn.id='charBtn';
  charBtn.innerHTML='<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="7" r="3.5"/><path d="M5.5 21V14a6.5 6.5 0 0 1 13 0v7"/></svg><span>人物</span>';
  const fireBtn=document.getElementById('fireBtn');
  if(fireBtn)topbar.insertBefore(charBtn,fireBtn);

  const charPop=document.createElement('div');charPop.id='charPop';
  charPop.innerHTML=`
    <h5>人物操控 CHARACTER <button id="charClose">✕</button></h5>
    <div class="charList" id="charList"></div>
    <div class="charCtrl" id="charViewCtrl">
      <button data-v="fp" class="on">第一人称</button>
      <button data-v="tp">第三人称</button>
    </div>
    <div class="charSens">
      <label><span>鼠标灵敏度</span><input type="range" id="charMouseSens" min="5" max="50" step="1" value="25"><b id="charMouseSensV">2.5</b></label>
      <label><span>移动速度</span><input type="range" id="charMoveSpeed" min="1" max="6" step="0.2" value="2.4"><b id="charMoveSpeedV">2.4</b></label>
    </div>
    <button class="charEnter" id="charEnterBtn">进入人物模式</button>
    <button class="charExit" id="charExitBtn" style="display:none">退出人物模式</button>
    <div class="charHint">
      <b>1.</b> 选择人物 · <b>2.</b> 选视角与灵敏度 · <b>3.</b> 点击进入<br>
      <b>操作：</b>点击画面锁定鼠标 → 准星替代光标<br>
      WASD 移动 · <b>Shift</b> 加速 · 鼠标移动环顾 · <b>空格</b>二段跳 · <b>E</b> 坐下/起立<br>
      <b>F</b> 开门/关门 · <b>V</b> 切换第一/第三人称 · <b>Esc</b> 释放鼠标/退出<br>
      人物模式下仍可正常编辑家具、光源、创作
    </div>
  `;
  document.body.appendChild(charPop);

  const fpHud=document.createElement('div');fpHud.id='fpHud';
  fpHud.innerHTML='<div id="fpCross"><div class="ring"></div><div class="dot"></div></div><div id="fpInfo"></div><div id="fpSit">按 E 坐下</div><div id="fpDoor">按 F 开门</div><div id="fpLock"><b>点击画面</b>进入鼠标锁定<br>移动鼠标环顾 · <b>Esc</b> 释放鼠标</div>';
  document.getElementById('viewport').appendChild(fpHud);
  const tpHud=document.createElement('div');tpHud.id='tpHud';
  document.getElementById('viewport').appendChild(tpHud);

  renderCharList();

  charBtn.onclick=e=>{e.stopPropagation();charPop.classList.toggle('open');
    document.getElementById('brandPop')?.classList.remove('open');
    document.getElementById('roomPop')?.classList.remove('open');
    document.getElementById('lightPop')?.classList.remove('open');
    if(charPop.classList.contains('open'))renderCharList();
  };
  document.getElementById('charClose').onclick=()=>charPop.classList.remove('open');
  document.getElementById('charExitBtn').onclick=()=>exitCharacter();
  /* 进入人物模式按钮 */
  document.getElementById('charEnterBtn').onclick=()=>{
    if(charActive){
      /* 已进入时点击 = 重置位置到出生点 */
      resetCharPosition();
      return;
    }
    if(charSelectedIdx<0)return showToast('请先选择一个人物','warn');
    enterCharacter(charSelectedIdx);
    /* 隐藏进入按钮，显示退出按钮 */
    document.getElementById('charEnterBtn').style.display='none';
    document.getElementById('charExitBtn').style.display='';
    charPop.classList.remove('open');
  };
  /* 视角切换：允许预选（未进入时也可选），进入后切换 */
  document.querySelectorAll('#charViewCtrl button').forEach(b=>{
    b.onclick=()=>{
      charFPV=b.dataset.v==='fp';
      /* 更新按钮高亮 */
      document.querySelectorAll('#charViewCtrl button').forEach(x=>x.classList.toggle('on',x===b));
      if(charActive){
        if(!charFPV&&charLocked&&document.exitPointerLock)document.exitPointerLock();
        updateCharHUD();applyCharCamera();
      }
      renderCharList();
    };
  });
  /* 灵敏度滑杆 */
  document.getElementById('charMouseSens').oninput=e=>{
    charMouseSens=+e.target.value/10000;
    document.getElementById('charMouseSensV').textContent=(charMouseSens*10000).toFixed(1);
  };
  document.getElementById('charMoveSpeed').oninput=e=>{
    charMoveSpeed=+e.target.value;
    document.getElementById('charMoveSpeedV').textContent=charMoveSpeed.toFixed(1);
  };
  addEventListener('mousedown',e=>{
    /* 只在点击 charPop 和 charBtn 以外时关闭面板 */
    /* 用 mousedown 而非 click，避免面板内部点击冒泡导致关闭 */
    if(!charPop.contains(e.target)&&!charBtn.contains(e.target))charPop.classList.remove('open');
  });

  /* ── 键盘事件 ── */
  addEventListener('keydown',e=>{
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
    if(!charActive)return;
    charKeys[e.key]=true;
    const k=e.key.toLowerCase();
    if(k==='v'){
      charFPV=!charFPV;updateCharHUD();renderCharList();applyCharCamera();
      /* 切到第三人称时退出 Pointer Lock */
      if(!charFPV&&charLocked&&document.exitPointerLock)document.exitPointerLock();
      showToast(charFPV?'第一人称':'第三人称');e.preventDefault();
    }
    if(k==='e'){toggleSit();e.preventDefault();}
    if(k==='f'){toggleDoor();e.preventDefault();}
    if(k==='escape'){
      /* Esc：若已锁定，先释放 Pointer Lock（不退出人物）；未锁定时退出人物 */
      if(charLocked&&document.exitPointerLock){document.exitPointerLock();}
      else{exitCharacter();}
    }
    if(['w','a','s','d',' ','shift','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
  });
  addEventListener('keyup',e=>{charKeys[e.key]=false;});

  /* ── 鼠标控制：第一人称用 Pointer Lock（准星替代光标），第三人称用拖动 ── */
  const cv=renderer.domElement;
  /* 鼠标进入画布 */
  cv.addEventListener('mouseenter',()=>{charMouseInCanvas=true;});
  cv.addEventListener('mouseleave',()=>{charMouseInCanvas=false;});
  /* Pointer Lock 变化监听 */
  document.addEventListener('pointerlockchange',()=>{
    charLocked=!!document.pointerLockElement;
    if(charLocked){
      /* 已锁定：隐藏系统光标，显示准星 */
      document.body.classList.add('char-fp-locked');
      const lock=document.getElementById('fpLock');if(lock)lock.classList.remove('show');
    }else{
      document.body.classList.remove('char-fp-locked');
      /* 锁定释放：如果仍在人物模式，显示重新锁定提示 */
      if(charActive&&charFPV){
        const lock=document.getElementById('fpLock');
        if(lock)lock.classList.add('show');
      }
    }
    updateCharHUD();
  });
  document.addEventListener('pointerlockerror',()=>{showToast('鼠标锁定失败 · 可用拖动模式','warn');});

  /* 鼠标移动：锁定时用 movementX/Y（第一/第三人称均同），否则用位置偏移 */
  document.addEventListener('mousemove',e=>{
    if(!charActive)return;
    if(charLocked){
      /* Pointer Lock 模式：鼠标右移=yaw增加（顺时针），下移=pitch减小 */
      charYaw+=e.movementX*charMouseSens;
      charPitch=clamp(charPitch-e.movementY*charMouseSens,-1.2,1.2);
      return;
    }
    /* 未锁定时：鼠标在画布内的位置驱动视角 */
    if(charMouseInCanvas){
      const rect=cv.getBoundingClientRect();
      const nx=(e.clientX-rect.left)/rect.width,ny=(e.clientY-rect.top)/rect.height;
      const dx=nx-0.5,dy=ny-0.5;
      charYaw=dx*Math.PI;
      charPitch=clamp(-dy*1.2,-1.2,1.2);
    }
  });
  /* 点击画布：请求 Pointer Lock（第一/第三人称均可用） */
  cv.addEventListener('pointerdown',e=>{
    if(!charActive)return;
    if(e.button!==0)return;
    if(!charLocked){
      if(cv.requestPointerLock){
        cv.requestPointerLock();
      }
    }
    e.stopPropagation();
  },true);
  cv.addEventListener('pointermove',e=>{
    if(!charActive)return;
    e.stopPropagation();
  },true);
  /* 阻止人物模式下的 orbit/pan/item 模式 */
  cv.addEventListener('pointerdown',e=>{
    if(!charActive)return;
    e.stopPropagation();
  },true);
  cv.addEventListener('wheel',e=>{if(charActive)e.stopImmediatePropagation();},{capture:true,passive:false});
  /* 鼠标点击画布时请求焦点（确保键盘事件到 window） */
  cv.addEventListener('pointerdown',()=>{cv.focus&&cv.focus();window.focus();});

  /* ── 相机接管 ── */
  const _origApplyCamera=applyCamera;
  applyCamera=function(){
    if(charActive){applyCharCamera();return;}
    _origApplyCamera();
  };
  let charClock=new THREE.Clock();
  (function charTick(){
    requestAnimationFrame(charTick);
    if(charActive){
      const dt=Math.min(charClock.getDelta(),.05);
      updateCharacter(dt);
      updateCharHUD(); /* 更新坐下提示 */
    }else charClock.getDelta();
  })();
}

/* ── 延迟挂载 ── */
function trySetupChar(){
  if(typeof THREE==='undefined'||typeof scene==='undefined'||typeof room==='undefined')return false;
  if(typeof items==='undefined'||typeof CATALOG==='undefined')return false;
  if(document.getElementById('charBtn'))return true;
  setupCharacter();
  return true;
}
let charTries=0;
const charInterval=setInterval(()=>{
  charTries++;
  if(trySetupChar())clearInterval(charInterval);
  else if(charTries>80){clearInterval(charInterval);
    const o=new MutationObserver(()=>{if(trySetupChar())o.disconnect();});
    o.observe(document.body,{childList:true,subtree:true});
  }
},100);
