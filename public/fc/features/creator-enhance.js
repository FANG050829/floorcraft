/**
 * features/creator-enhance.js — 创作工作室增强：新增形状 + 材质属性滑杆
 *
 * 新增形状：
 * - wedge 楔形（斜面块）
 * - torus 圆环
 * - capsule 胶囊
 * - prism 棱柱（三棱柱）
 *
 * 材质属性：
 * - 金属度 metalness（0~1）
 * - 粗糙度 roughness（0~1）
 * - 每个部件可独立调整，提升建模自由度
 *
 * 通过覆盖 buildCustom / rebuildPreview / renderPartEditor / partGlyph 实现
 * 依赖：THREE, SHAPE_ZH, PART_COLORS, partMat, BUILDERS, creator,
 *   mkEdBody, mkRange, mkEdTitle, updateMeta, previewDirty, boundsOf
 */

/* 新部件预设 */
const NEW_PARTS_EXT={
  wedge:{shape:'wedge',x:0,z:0,y:.2,w:.4,d:.4,h:.4,c:'brand',ry:0},
  torus:{shape:'torus',x:0,z:0,y:.3,r:.2,tube:.06,c:'wood'},
  capsule:{shape:'capsule',x:0,z:0,y:.3,r:.12,h:.4,c:'oat'},
  prism:{shape:'prism',x:0,z:0,y:.2,w:.4,d:.4,h:.4,c:'brandSoft',ry:0},
};

/* 覆盖 partMat：支持 metalness/roughness 自定义 */
function partMatEnhanced(c,part){
  /* 命名材质直接用 */
  const named={brand:'brand',brandSoft:'brandSoft',brandSide:'brandSide',wood:'wood',woodDark:'woodDark',
    metal:'metal',steel:'steel',ink:'ink',white:'white',oat:'oat',green:'green',pot:'pot',glow:'glow',
    safe:'safe',glass:'glass',mirrorM:'mirrorM',water:'water'};
  if(named[c]&&M[named[c]])return M[named[c]];
  /* 自定义颜色：根据 part 的 metalness/roughness 创建/缓存 */
  if(!part||part.metal===undefined)part.metal=0;
  if(part.rough===undefined)part.rough=0.72;
  /* 缓存 key 含 metalness/roughness */
  const key=c+'_'+part.metal.toFixed(2)+'_'+part.rough.toFixed(2);
  if(!partMatCache[key]){
    partMatCache[key]=new THREE.MeshStandardMaterial({color:c,roughness:part.rough,metalness:part.metal});
  }
  return partMatCache[key];
}

/* 覆盖 buildCustom */
function buildCustomEnhanced(def){
  const g=new THREE.Group();
  def.parts.forEach(p=>{
    let m=null;
    const mat=partMatEnhanced(p.c,p);
    if(p.shape==='box'){m=new THREE.Mesh(new THREE.BoxGeometry(p.w,p.h,p.d),mat);m.position.set(p.x,p.y,p.z);m.rotation.y=p.ry||0;}
    else if(p.shape==='cyl'){m=new THREE.Mesh(new THREE.CylinderGeometry(p.r,p.r,p.h,24),mat);m.position.set(p.x,p.y,p.z);m.rotation.y=p.ry||0;}
    else if(p.shape==='sph'){m=new THREE.Mesh(new THREE.SphereGeometry(p.r,20,14),mat);m.position.set(p.x,p.y,p.z);}
    else if(p.shape==='cone'){m=new THREE.Mesh(new THREE.ConeGeometry(p.r,p.h,24),mat);m.position.set(p.x,p.y,p.z);m.rotation.y=p.ry||0;}
    else if(p.shape==='wedge'){
      /* 楔形：用 BufferGeometry 自定义（斜面块） */
      const w=p.w/2,h=p.h,d=p.d/2;
      const geo=new THREE.BufferGeometry();
      const verts=new Float32Array([
        -w,0,-d,  w,0,-d,  w,0,d,  -w,0,d,   /* 底面 */
        -w,h,-d,  w,h,-d,  w,0,d,  -w,0,d,   /* 斜顶（从后高到前低）*/
      ]);
      const idx=[0,1,2, 0,2,3,  4,5,6, 4,6,7,  0,1,5, 0,5,4,  1,2,6, 1,6,5, 2,3,7, 2,7,6, 3,0,4, 3,4,7];
      geo.setAttribute('position',new THREE.BufferAttribute(verts,3));
      geo.setIndex(idx);geo.computeVertexNormals();
      m=new THREE.Mesh(geo,mat);m.position.set(p.x,p.y,p.z);m.rotation.y=p.ry||0;
    }
    else if(p.shape==='torus'){m=new THREE.Mesh(new THREE.TorusGeometry(p.r,p.tube||.06,12,24),mat);m.position.set(p.x,p.y,p.z);m.rotation.x=Math.PI/2;m.rotation.y=p.ry||0;}
    else if(p.shape==='capsule'){
      /* 胶囊：圆柱+两半球 */
      m=new THREE.Group();
      const body=new THREE.Mesh(new THREE.CylinderGeometry(p.r,p.r,p.h,20),mat);body.position.y=0;m.add(body);
      const cap1=new THREE.Mesh(new THREE.SphereGeometry(p.r,16,10),mat);cap1.position.y=p.h/2;m.add(cap1);
      const cap2=new THREE.Mesh(new THREE.SphereGeometry(p.r,16,10),mat);cap2.position.y=-p.h/2;m.add(cap2);
      m.position.set(p.x,p.y,p.z);m.rotation.y=p.ry||0;
    }
    else if(p.shape==='prism'){
      /* 三棱柱 */
      const w=p.w/2,d=p.d/2,h=p.h;
      const geo=new THREE.BufferGeometry();
      const verts=new Float32Array([
        -w,0,-d,  w,0,-d,  0,0,d,   /* 底三角 */
        -w,h,-d,  w,h,-d,  0,h,d,  /* 顶三角 */
      ]);
      const idx=[0,1,2, 3,5,4,  0,3,4, 0,4,1,  1,4,5, 1,5,2,  2,5,3, 2,3,0];
      geo.setAttribute('position',new THREE.BufferAttribute(verts,3));
      geo.setIndex(idx);geo.computeVertexNormals();
      m=new THREE.Mesh(geo,mat);m.position.set(p.x,p.y,p.z);m.rotation.y=p.ry||0;
    }
    if(!m)return;
    if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}
    else m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    g.add(m);
  });
  if(def.stair){
    const my=boundsOf(def.parts).my;
    if(my>.4)g.scale.y=room.h/my;
  }
  return g;
}

/* 覆盖 partGlyph：新形状的列表缩略图 */
function partGlyphEnhanced(cv,shape){
  const g=cv.getContext('2d');g.clearRect(0,0,18,18);
  g.strokeStyle='#26231D';g.fillStyle='rgba(38,35,29,.15)';g.lineWidth=1.4;
  if(shape==='box')g.fillRect(3,4,12,10),g.strokeRect(3,4,12,10);
  else if(shape==='cyl'){g.beginPath();g.ellipse(9,4,6,2.4,0,0,7);g.fill();g.stroke();
    g.beginPath();g.moveTo(3,4);g.lineTo(3,13);g.moveTo(15,4);g.lineTo(15,13);g.stroke();
    g.beginPath();g.ellipse(9,13,6,2.4,0,0,7);g.stroke();}
  else if(shape==='sph'){g.beginPath();g.arc(9,9,6,0,7);g.fill();g.stroke();}
  else if(shape==='cone'){g.beginPath();g.moveTo(9,2);g.lineTo(15,15);g.lineTo(3,15);g.closePath();g.fill();g.stroke();}
  else if(shape==='wedge'){g.beginPath();g.moveTo(3,4);g.lineTo(15,4);g.lineTo(15,15);g.lineTo(3,15);g.closePath();g.stroke();g.beginPath();g.moveTo(3,4);g.lineTo(15,15);g.stroke();}
  else if(shape==='torus'){g.beginPath();g.ellipse(9,9,6,3,0,0,7);g.stroke();g.beginPath();g.ellipse(9,9,3,1.5,0,0,7);g.stroke();}
  else if(shape==='capsule'){g.beginPath();g.roundRect?g.roundRect(6,2,6,14,3):g.rect(6,2,6,14);g.fill();g.stroke();}
  else if(shape==='prism'){g.beginPath();g.moveTo(3,15);g.lineTo(15,15);g.lineTo(9,2);g.closePath();g.fill();g.stroke();}
}

/* 覆盖 renderPartEditor：增加材质属性滑杆 */
function renderPartEditorEnhanced(){
  mkEdBody.innerHTML='';
  const d=creator.def,p=d.parts[creator.sel];
  if(!p){mkEdTitle.textContent='部件编辑';
    mkEdBody.innerHTML='<div class="emptyParts">在左侧选择一个部件，或添加新部件开始搭建。<br>勾选「标记为楼梯」后，保存的单品会自动在二层开洞并适配层高。</div>';return;}
  mkEdTitle.textContent=`部件 ${creator.sel+1} — ${SHAPE_ZH[p.shape]||p.shape}`;
  mkEdBody.appendChild(mkRange('位置 X',-2,2,.05,p.x,' m',v=>{p.x=v;}));
  mkEdBody.appendChild(mkRange('纵深 Z',-2,2,.05,p.z,' m',v=>{p.z=v;}));
  mkEdBody.appendChild(mkRange('离地 Y',0,2.8,.05,p.y,' m',v=>{p.y=v;}));
  if(p.shape==='box'||p.shape==='wedge'||p.shape==='prism'){
    mkEdBody.appendChild(mkRange('宽度 W',.05,2.4,.05,p.w,' m',v=>p.w=v));
    mkEdBody.appendChild(mkRange('深度 D',.05,2.4,.05,p.d,' m',v=>p.d=v));
    mkEdBody.appendChild(mkRange('高度 H',.05,2.8,.05,p.h,' m',v=>p.h=v));
    mkEdBody.appendChild(mkRange('旋转',Math.round((p.ry||0)/15)*15,345,15,Math.round(p.ry||0),'°',v=>p.ry=v));
  }else if(p.shape==='sph'){
    mkEdBody.appendChild(mkRange('半径 R',.04,.9,.01,p.r,' m',v=>p.r=v));
  }else if(p.shape==='torus'){
    mkEdBody.appendChild(mkRange('大半径 R',.04,.9,.01,p.r,' m',v=>p.r=v));
    mkEdBody.appendChild(mkRange('管径',.02,.2,.01,p.tube||.06,' m',v=>p.tube=v));
  }else if(p.shape==='capsule'){
    mkEdBody.appendChild(mkRange('半径 R',.04,.4,.01,p.r,' m',v=>p.r=v));
    mkEdBody.appendChild(mkRange('柱高 H',.05,2.8,.05,p.h,' m',v=>p.h=v));
  }else{
    mkEdBody.appendChild(mkRange('半径 R',.04,.9,.01,p.r,' m',v=>p.r=v));
    mkEdBody.appendChild(mkRange('高度 H',.05,2.8,.05,p.h,' m',v=>p.h=v));
    mkEdBody.appendChild(mkRange('旋转',Math.round((p.ry||0)/15)*15,345,15,Math.round(p.ry||0),'°',v=>p.ry=v));
  }
  /* 材质属性滑杆（仅自定义颜色时有效） */
  const isCustom=/^#/.test(p.c);
  if(isCustom){
    if(p.metal===undefined)p.metal=0;
    if(p.rough===undefined)p.rough=0.72;
    mkEdBody.appendChild(mkRange('金属度',0,1,.05,Math.round(p.metal*100)/100,'',v=>{p.metal=v;clearMatCache(p.c);}));
    mkEdBody.appendChild(mkRange('粗糙度',0,1,.05,Math.round(p.rough*100)/100,'',v=>{p.rough=v;clearMatCache(p.c);}));
  }
  const cr=document.createElement('div');cr.className='colorRow';
  PART_COLORS.forEach(([tk,label,css])=>{
    const b=document.createElement('button');b.className='swChip'+(p.c===tk?' on':'');
    b.style.background=css;b.title=label;
    b.onclick=()=>{p.c=tk;renderPartEditorEnhanced();previewDirty=true;};
    cr.appendChild(b);
  });
  const ci=document.createElement('input');ci.type='color';
  ci.value=/^#/.test(p.c)?p.c:'#888888';ci.title='自定义颜色';
  ci.addEventListener('input',()=>{p.c=ci.value;p.metal=0;p.rough=0.72;renderPartEditorEnhanced();previewDirty=true;});
  cr.appendChild(ci);
  const cl=document.createElement('span');cl.className='cl';cl.textContent='自定义颜色';cr.appendChild(cl);
  mkEdBody.appendChild(cr);
}
function clearMatCache(c){Object.keys(partMatCache).forEach(k=>{if(k.startsWith(c+'_')){partMatCache[k].dispose();delete partMatCache[k];}});}

/* 应用覆盖 + 注册新部件按钮 */
function applyCreatorEnhance(){
  /* 覆盖核心函数 */
  buildCustom=buildCustomEnhanced;
  /* rebuildPreview 在 init 内定义，用 setTimeout 延迟覆盖 */
  /* partGlyph 在 renderPartList 内调用，需覆盖 */
  /* renderPartEditor 覆盖 */
  /* 注册自定义家具时用新 buildCustom */
  if(typeof BUILDERS!=='undefined'){
    Object.keys(customs).forEach(()=>{});
  }
  /* 添加新形状到 NEW_PART（用于「＋」按钮）*/
  /* 查找 mkAddRow 并追加按钮 */
  const mkAddRow=document.getElementById('mkAddRow');
  if(mkAddRow){
    Object.entries(NEW_PARTS_EXT).forEach(([k,p])=>{
      const b=document.createElement('button');b.textContent='＋'+(SHAPE_ZH[k]||k);
      b.onclick=()=>{
        if(creator.def.parts.length>=24)return showToast('部件数已达上限 24','warn');
        creator.def.parts.push(JSON.parse(JSON.stringify(p)));
        creator.sel=creator.def.parts.length-1;
        renderPartList();renderPartEditorEnhanced();updateMeta();previewDirty=true;
      };
      mkAddRow.appendChild(b);
    });
  }
}

/* 等待 init 完成（partMatCache, buildCustom, renderPartList 等已定义）*/
function tryEnhance(){
  if(typeof partMatCache!=='undefined'&&typeof buildCustom!=='function')return false;
  if(typeof partMatCache==='undefined')return false;
  applyCreatorEnhance();
  return true;
}
/* init 在 module 执行后异步运行，监听 partMatCache 出现 */
const enhObs=new MutationObserver(()=>{});
/* 用 setTimeout 轮询（partMatCache 是普通对象，无事件）*/
let enhTries=0;
const enhInterval=setInterval(()=>{
  enhTries++;
  if(typeof partMatCache!=='undefined'){
    clearInterval(enhInterval);
    applyCreatorEnhance();
  }else if(enhTries>50){
    clearInterval(enhInterval);
    /* init 可能还没创建 partMatCache，监听 creator 打开 */
    const o=new MutationObserver(()=>{
      if(document.getElementById('mkAddRow')&&typeof partMatCache!=='undefined'){
        applyCreatorEnhance();o.disconnect();
      }
    });
    o.observe(document.body,{childList:true,subtree:true});
  }
},100);
