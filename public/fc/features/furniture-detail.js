/**
 * features/furniture-detail.js — 家具建模精细度大幅优化
 *
 * 覆盖关键家具的 BUILDERS，用高细节几何体重建：
 * - 椅子：坐垫软包缝线、椅背曲线、椅腿锥度、横撑
 * - 桌子：桌面倒角、桌腿细节、连接横档
 * - 柜台/吧台：台面纹理、柜门把手、踢脚
 * - 沙发：扶手曲线、靠垫缝线、坐垫分区
 * - 货架：层板、背板、挡边
 * - 灯具：灯罩、灯杆、底座细节
 * - 植物：多球体树冠、花盆纹理
 *
 * 依赖：THREE, M, BUILDERS, partMat (可选)
 */

/* 几何辅助（高细节版） */
function bxH(g,w,h,d,mat,x,y,z,bevel){
  const geo=new THREE.BoxGeometry(w,h,d,bevel?2:1,bevel?2:1,bevel?2:1);
  /* 倒角：用 EdgesGeometry 不行，用 scale 顶部缩小模拟倒角 */
  const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
}
function cyH(g,rt,rb,h,mat,x,y,z,seg=24){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
}
function sphH(g,r,mat,x,y,z,seg=20){
  const m=new THREE.Mesh(new THREE.SphereGeometry(r,seg,seg*0.7),mat);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;
}
function torH(g,r,tube,mat,x,y,z){
  const m=new THREE.Mesh(new THREE.TorusGeometry(r,tube,12,24),mat);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;
}
/* 软包坐垫：圆角盒子 + 缝线凹槽 */
function cushion(g,w,h,d,mat,x,y,z){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d,4,4,4),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);
  /* 缝线：顶部凹槽（用细条模拟） */
  const seamMat=new THREE.MeshBasicMaterial({color:mat.color?('#'+mat.color.getHexString()):'#888',opacity:0.6,transparent:true});
  const seam=new THREE.Mesh(new THREE.BoxGeometry(w*0.9,0.005,d*0.9),seamMat);
  seam.position.set(x,y+h/2-0.003,z);g.add(seam);
  return m;
}

function applyFurnitureDetail(){
  if(typeof BUILDERS==='undefined'||typeof THREE==='undefined'||typeof M==='undefined')return;

  /* ── 椅子（高细节）── */
  BUILDERS.chair=function(){
    const g=new THREE.Group();
    /* 四腿（锥形，上粗下细） */
    [[-.19,-.19],[.19,-.19],[-.19,.19],[.19,.19]].forEach(([x,z])=>{
      cyH(g,.022,.016,.42,M.woodDark,x,.21,z,12);
    });
    /* 坐垫软包（圆角+缝线） */
    cushion(g,.44,.06,.44,M.brand,0,.45,0);
    /* 椅背曲线（用 2 个倾斜的板模拟人体工学） */
    const back1=bxH(g,.42,.04,.38,M.brand,0,.66,-.2);back1.rotation.x=-0.08;
    const back2=bxH(g,.42,.06,.04,M.woodDark,0,.84,-.22);
    /* 椅腿横撑（结构细节） */
    bxH(g,.34,.02,.02,M.woodDark,0,.12,-.19);
    bxH(g,.34,.02,.02,M.woodDark,0,.12,.19);
    bxH(g,.02,.02,.34,M.woodDark,-.19,.12,0);
    bxH(g,.02,.02,.34,M.woodDark,.19,.12,0);
    return g;
  };

  /* ── 木质餐椅（高细节）── */
  BUILDERS.diningChair=function(){
    const g=new THREE.Group();
    /* 四腿（木方） */
    [[-.2,-.22],[.2,-.22],[-.2,.22],[.2,.22]].forEach(([x,z])=>{
      bxH(g,.04,.82,.04,M.wood,x,.41,z);
    });
    /* 坐面板（倒角） */
    bxH(g,.44,.04,.44,M.wood,0,.445,0);
    /* 坐面贴皮 */
    bxH(g,.42,.012,.42,M.brand,0,.47,0);
    /* 椅背三道横板（经典 Windsor 椅） */
    bxH(g,.4,.05,.035,M.wood,0,.76,-.22);
    bxH(g,.4,.06,.025,M.wood,0,.63,-.22);
    bxH(g,.4,.06,.025,M.wood,0,.52,-.22);
    /* 椅腿横撑 */
    bxH(g,.36,.02,.02,M.wood,0,.2,-.19);
    bxH(g,.36,.02,.02,M.wood,0,.2,.19);
    return g;
  };

  /* ── 双人圆桌（高细节）── */
  BUILDERS.table2=function(){
    const g=new THREE.Group();
    /* 桌面（圆形+倒角边缘） */
    cyH(g,.42,.42,.04,M.wood,0,.75,0,32);
    /* 桌面边缘倒角圈 */
    torH(g,.42,.012,M.woodDark,0,.75,0);
    /* 中心立柱（锥形） */
    cyH(g,.05,.07,.7,M.woodDark,0,.37,0,16);
    /* 底座（圆形十字） */
    cyH(g,.22,.22,.03,M.woodDark,0,.015,0,24);
    bxH(g,.4,.02,.04,M.woodDark,0,.015,0);
    bxH(g,.04,.02,.4,M.woodDark,0,.015,0);
    return g;
  };

  /* ── 四人方桌（高细节）── */
  BUILDERS.table4=function(){
    const g=new THREE.Group();
    /* 桌面 */
    bxH(g,.95,.04,.95,M.wood,0,.74,0,true);
    /* 桌面边缘品牌色细条 */
    bxH(g,.96,.006,.96,M.brand,0,.76,0);
    /* 四腿（方木） */
    [[-.4,-.4],[.4,-.4],[-.4,.4],[.4,.4]].forEach(([x,z])=>{
      bxH(g,.06,.74,.06,M.woodDark,x,.37,z);
    });
    /* 横撑（结构） */
    bxH(g,.8,.04,.04,M.woodDark,0,.2,-.4);
    bxH(g,.8,.04,.04,M.woodDark,0,.2,.4);
    bxH(g,.04,.04,.8,M.woodDark,-.4,.2,0);
    bxH(g,.04,.04,.8,M.woodDark,.4,.2,0);
    return g;
  };

  /* ── 咖啡吧台（高细节）── */
  BUILDERS.counter=function(){
    const g=new THREE.Group();
    /* 主体 */
    bxH(g,3.1,.9,.8,M.woodDark,0,.525,0);
    /* 台面（厚木+倒角） */
    bxH(g,3.2,.06,.9,M.wood,0,1.03,0,true);
    /* 台面边缘金属条 */
    bxH(g,3.22,.008,.92,M.metal,0,1.06,0);
    /* 品牌色前饰板 */
    bxH(g,2.9,.55,.01,M.brand,0,.55,.4);
    /* 踢脚 */
    bxH(g,3.1,.1,.03,M.woodDark,0,.05,.4);
    /* 咖啡机（细节） */
    bxH(g,.4,.32,.4,M.metal,-1,1.2,0);
    bxH(g,.42,.04,.42,M.metal,-1,1.37,0);
    /* 咖啡机出水口 */
    cyH(g,.03,.03,.08,M.metal,-1,1.05,0.15,12);
    /* 蒸汽棒 */
    cyH(g,.015,.015,.25,M.steel,-0.85,1.1,0.2,8);
    /* 磨豆机 */
    cyH(g,.08,.1,.3,M.metal,-0.5,1.18,0,16);
    bxH(g,.2,.04,.2,M.woodDark,-0.5,1.35,0);
    /* 展示柜 */
    bxH(g,.5,.35,.7,M.woodDark,0.9,1.2,0);
    /* 玻璃门 */
    bxH(g,.46,.32,.02,M.glass,0.9,1.2,0.36);
    /* 把手 */
    cyH(g,.02,.02,.08,M.metal,0.9,1.2,0.4,8);
    return g;
  };

  /* ── 双人卡座沙发（高细节）── */
  BUILDERS.sofa=function(){
    const g=new THREE.Group();
    /* 底座 */
    bxH(g,1.35,.2,.68,M.oat,0,.26,0);
    /* 两个独立坐垫（分区+缝线） */
    cushion(g,.6,.13,.5,M.brand,-.32,.42,.05);
    cushion(g,.6,.13,.5,M.brand,.32,.42,.05);
    /* 靠背 */
    bxH(g,1.35,.46,.16,M.oat,0,.58,-.25);
    /* 靠垫（两个，倾斜） */
    const p1=cushion(g,.56,.24,.1,M.brand,-.32,.66,-.18);p1.rotation.x=-0.16;
    const p2=cushion(g,.56,.24,.1,M.brand,.32,.66,-.18);p2.rotation.x=-0.16;
    /* 扶手（曲线用倒角盒） */
    bxH(g,.13,.32,.6,M.oat,-.65,.54,0,true);
    bxH(g,.13,.32,.6,M.oat,.65,.54,0,true);
    /* 四脚 */
    [[-.56,-.24],[.56,-.24],[-.56,.24],[.56,.24]].forEach(([x,z])=>cyH(g,.024,.02,.17,M.woodDark,x,.085,z,10));
    return g;
  };

  /* ── 单人扶手椅（高细节）── */
  BUILDERS.armchair=function(){
    const g=new THREE.Group();
    /* 底座 */
    bxH(g,.72,.3,.72,M.oat,0,.25,0,true);
    /* 坐垫软包 */
    cushion(g,.6,.16,.56,M.brand,0,.44,.04);
    /* 靠背（弧形用 2 板） */
    bxH(g,.72,.52,.15,M.oat,0,.6,-.3,true);
    const back=cushion(g,.5,.3,.1,M.brand,0,.72,-.28);back.rotation.x=-0.16;
    /* 扶手 */
    bxH(g,.13,.32,.6,M.oat,-.33,.54,0,true);
    bxH(g,.13,.32,.6,M.oat,.33,.54,0,true);
    /* 抱枕 */
    sphH(g,.12,M.brandSoft,0.25,.7,-.15);
    /* 四脚 */
    [[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]].forEach(([x,z])=>cyH(g,.02,.02,.12,M.woodDark,x,.06,z,8));
    return g;
  };

  /* ── 陈列货架（高细节）── */
  BUILDERS.shelf=function(){
    const g=new THREE.Group();
    /* 背板 */
    bxH(g,1.0,.02,.4,M.woodDark,0,1.0,-.18);
    /* 5 层板（带挡边） */
    for(let i=0;i<5;i++){
      const y=0.1+i*0.38;
      bxH(g,1.0,.03,.4,M.wood,0,y,0);
      /* 前挡边 */
      bxH(g,1.0,.01,.03,M.woodDark,0,y+.02,.2);
    }
    /* 侧板 */
    bxH(g,.04,1.9,.4,M.wood,-.5,0.95,0);
    bxH(g,.04,1.9,.4,M.wood,.5,0.95,0);
    /* 顶板 */
    bxH(g,1.08,.04,.46,M.woodDark,0,1.93,0);
    /* 底脚 */
    [[-.45,-.15],[.45,-.15],[-.45,.15],[.45,.15]].forEach(([x,z])=>cyH(g,.02,.02,.04,M.woodDark,x,0,z,8));
    return g;
  };

  /* ── 开放书架（高细节）── */
  BUILDERS.bookshelf=function(){
    const g=new THREE.Group();
    /* 侧板 */
    bxH(g,.04,1.9,.35,M.wood,-.6,0.95,0);
    bxH(g,.04,1.9,.35,M.wood,.6,0.95,0);
    /* 背板 */
    bxH(g,1.2,.02,.35,M.woodDark,0,0.95,-.16);
    /* 层板+书 */
    for(let i=0;i<5;i++){
      const y=0.1+i*0.38;
      bxH(g,1.2,.03,.35,M.wood,0,y,0);
      /* 书本（随机色块） */
      const bookColors=[M.brand,M.woodDark,M.oat,M.green,M.ink];
      for(let b=0;b<6;b++){
        const bc=bookColors[(i*6+b)%bookColors.length];
        bxH(g,.08,.28,.25,bc,-0.45+b*0.18,y+.16,0);
      }
    }
    /* 顶板 */
    bxH(g,1.28,.04,.41,M.woodDark,0,1.93,0);
    return g;
  };

  /* ── 落地灯（高细节）── */
  BUILDERS.lamp=function(){
    const g=new THREE.Group();
    /* 底座（圆盘） */
    cyH(g,.18,.2,.03,M.metal,0,.015,0,20);
    /* 灯杆（细金属） */
    cyH(g,.018,.022,1.0,M.steel,0,.53,0,12);
    /* 灯罩（圆锥台） */
    cyH(g,.08,.16,.18,M.oat,0,1.12,0,20);
    /* 灯罩顶部 */
    cyH(g,.08,.08,.02,M.woodDark,0,1.21,0,16);
    /* 灯泡（发光） */
    sphH(g,.04,M.glow,0,1.08,0);
    return g;
  };

  /* ── 弧形落地灯（高细节）── */
  BUILDERS.arcLamp=function(){
    const g=new THREE.Group();
    /* 底座 */
    cyH(g,.2,.22,.04,M.metal,0,-.4,0,20);
    /* 弧形灯杆（用多段圆柱拼接模拟弧线） */
    const pts=[];
    for(let i=0;i<=10;i++){
      const t=i/10;
      const x=0.5*Math.sin(t*Math.PI*0.5);
      const y=-0.35+t*1.5;
      pts.push(new THREE.Vector3(x,y,0));
    }
    /* 用 TubeGeometry 生成弧形杆 */
    const curve=new THREE.CatmullRomCurve3(pts);
    const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,16,0.012,8),M.steel);
    tube.castShadow=true;g.add(tube);
    /* 灯罩 */
    cyH(g,.06,.12,.14,M.oat,0.5,1.2,0,16);
    /* 灯泡 */
    sphH(g,.035,M.glow,0.5,1.15,0);
    return g;
  };

  /* ── 绿植盆栽（高细节：多球树冠）── */
  BUILDERS.plant=function(){
    const g=new THREE.Group();
    /* 花盆（梯形） */
    cyH(g,.16,.2,.28,M.pot,0,.14,0,20);
    /* 盆口边缘 */
    torH(g,.2,.015,M.woodDark,0,.28,0);
    /* 泥土 */
    sphH(g,.16,M.ink,0,.27,0);
    /* 叶冠（多个球叠加，自然感） */
    sphH(g,.18,M.green,0,.45,0);
    sphH(g,.13,M.green,.1,.4,.05);
    sphH(g,.13,M.green,-.1,.42,0);
    sphH(g,.11,M.green,0,.5,.08);
    sphH(g,.1,M.green,.06,.52,0);
    return g;
  };

  /* ── 吧台凳（高细节）── */
  BUILDERS.stool=function(){
    const g=new THREE.Group();
    /* 坐垫（圆+软包） */
    cyH(g,.19,.19,.05,M.brand,0,.66,0,24);
    bxH(g,.38,.01,.38,M.brand,0,.69,0); /* 顶部缝线 */
    /* 立柱（金属） */
    cyH(g,.024,.024,.64,M.metal,0,.32,0,12);
    /* 脚踏圈 */
    torH(g,.12,.011,M.metal,0,.22,0);
    /* 底座圆盘 */
    cyH(g,.15,.16,.02,M.metal,0,.01,0,20);
    return g;
  };

  /* ── 办公工位/桌（高细节）── */
  BUILDERS.desk=function(){
    const g=new THREE.Group();
    /* 桌面 */
    bxH(g,1.4,.04,.7,M.wood,0,.74,0,true);
    /* 桌面贴皮 */
    bxH(g,1.38,.006,.68,M.brand,0,.76,0);
    /* 侧板（箱体结构） */
    bxH(g,.04,.74,.68,M.woodDark,-.7,.37,0);
    bxH(g,.04,.74,.68,M.woodDark,.7,.37,0);
    /* 抽屉 */
    bxH(g,.6,.2,.02,M.wood,0,.5,.35);
    /* 抽屉把手 */
    cyH(g,.03,.03,.04,M.metal,0,.5,.38,8);
    bxH(g,.15,.01,.02,M.metal,0,.5,.38);
    /* 显示器底座 */
    bxH(g,.3,.02,.2,M.metal,0,.78,-.2);
    /* 显示器支架 */
    bxH(g,.04,.15,.04,M.metal,0,.86,-.2);
    /* 显示器屏幕 */
    bxH(g,.5,.3,.03,M.ink,0,.95,-.2);
    /* 屏幕反光（品牌色细边） */
    bxH(g,.48,.28,.01,M.brand,0,.95,-.185);
    return g;
  };

  /* ── 收银台（高细节）── */
  BUILDERS.register=function(){
    const g=new THREE.Group();
    /* 主体 */
    bxH(g,1.2,.65,.65,M.woodDark,0,.325,0);
    /* 台面 */
    bxH(g,1.3,.05,.75,M.wood,0,.66,0,true);
    /* 品牌色前饰 */
    bxH(g,1.15,.4,.01,M.brand,0,.4,.33);
    /* 收银机 */
    bxH(g,.3,.2,.25,M.ink,0,.78,0);
    bxH(g,.28,.15,.02,M.brand,0,.78,.13);
    /* 扫码枪 */
    cyH(g,.03,.03,.15,M.metal,0.3,.75,0.1,8);
    /* 键盘 */
    bxH(g,.25,.02,.15,M.ink,0,.68,-.2);
    return g;
  };

  /* ── 甜品展示柜（高细节）── */
  BUILDERS.pastry=function(){
    const g=new THREE.Group();
    /* 主体 */
    bxH(g,1.4,.6,.7,M.woodDark,0,.3,0);
    /* 玻璃罩（透明） */
    bxH(g,1.3,.5,.6,M.glass,0,.65,0);
    /* 顶层 */
    bxH(g,1.4,.04,.7,M.wood,0,.95,0,true);
    /* 展示层板 */
    bxH(g,1.2,.02,.5,M.wood,0,.45,0);
    /* 甜品（小球阵列） */
    const cakes=[M.brand,M.oat,M.white,M.brandSoft,M.green];
    for(let i=0;i<4;i++){
      sphH(g,.05,cakes[i],-0.45+i*0.3,.5,0.1);
      sphH(g,.05,cakes[(i+1)%5],-0.45+i*0.3,.5,0.25);
    }
    /* 把手 */
    cyH(g,.02,.02,.1,M.metal,0,.65,.35,8);
    return g;
  };

  console.log('[FLOORCRAFT] 家具精细度优化已应用：'+Object.keys(BUILDERS).length+' 个构建器');
}

/* 等待 BUILDERS 和 M 定义后应用 */
function tryApplyDetail(){
  if(typeof BUILDERS==='undefined'||typeof THREE==='undefined'||typeof M==='undefined')return false;
  if(typeof partMatCache==='undefined')return false; /* 确保 init 已运行 */
  applyFurnitureDetail();
  return true;
}
let detailTries=0;
const detailInterval=setInterval(()=>{
  detailTries++;
  if(tryApplyDetail())clearInterval(detailInterval);
  else if(detailTries>80){clearInterval(detailInterval);
    const o=new MutationObserver(()=>{if(tryApplyDetail())o.disconnect();});
    o.observe(document.body,{childList:true,subtree:true});
  }
},100);
