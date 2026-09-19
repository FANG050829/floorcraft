/**
 * features/windows.js — 多种窗户家具的 3D 建模 + 2D 平面符号
 *
 * 6 种窗户：
 * - windowFloor 落地窗：全高玻璃+金属框+把手
 * - windowArch 拱形窗：顶部拱形+十字窗棂
 * - windowRound 圆形窗：圆形玻璃+辐射窗棂
 * - windowLouver 百叶窗：水平百叶+外框
 * - windowBay 飘窗：外凸三面玻璃+窗台
 * - windowSkylight 天窗：顶部水平玻璃+框架
 *
 * 依赖：THREE, M, BUILDERS, drawSymbol（覆盖）
 */

function applyWindows(){
  if(typeof BUILDERS==='undefined'||typeof THREE==='undefined')return;
  /* 使用 partMat（init 闭包内的材质辅助函数，延迟访问 M） */
  const pm=(c)=>typeof partMat==='function'?partMat(c):new THREE.MeshStandardMaterial({color:c,roughness:.7});

  /* 通用：玻璃材质（完全透明，物理透射） */
  const glassWin=new THREE.MeshPhysicalMaterial({
    color:'#C8DCE0',transparent:true,opacity:0.0,roughness:0.02,metalness:0.0,
    envMapIntensity:1.5,depthWrite:false,depthTest:true,side:THREE.DoubleSide,
    transmission:1.0,thickness:0.1,ior:1.45,
  });
  /* 通用：窗框材质 */
  const frameMat=new THREE.MeshStandardMaterial({color:'#3A3633',roughness:0.5,metalness:0.3});
  const frameLiteMat=new THREE.MeshStandardMaterial({color:'#5C5147',roughness:0.55});

  /* ── 落地窗（1.8×2.4m，全高玻璃+金属框+把手）── */
  BUILDERS.windowFloor=function(){
    const g=new THREE.Group();
    /* 外框（上下左右） */
    const f=new THREE.BoxGeometry(1.8,0.06,0.1);const f2=new THREE.BoxGeometry(0.06,2.4,0.1);
    const top=new THREE.Mesh(f,frameMat);top.position.y=1.2;g.add(top);
    const bot=new THREE.Mesh(f,frameMat);bot.position.y=0;g.add(bot);
    const left=new THREE.Mesh(f2,frameMat);left.position.set(-0.87,1.2,0);g.add(left);
    const right=new THREE.Mesh(f2,frameMat);right.position.set(0.87,1.2,0);g.add(right);
    /* 玻璃（大块透明） */
    const glass=new THREE.Mesh(new THREE.BoxGeometry(1.7,2.3,0.02),glassWin);glass.position.set(0,1.2,0.02);g.add(glass);
    /* 中梃（横向分隔） */
    const mid=new THREE.Mesh(new THREE.BoxGeometry(1.7,0.04,0.06),frameMat);mid.position.set(0,1.2,0.04);g.add(mid);
    /* 窗棂（竖向） */
    const mull=new THREE.Mesh(new THREE.BoxGeometry(0.04,2.3,0.04),frameMat);mull.position.set(0,1.2,0.04);g.add(mull);
    /* 把手 */
    const handle=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.1,8),frameMat);handle.position.set(0.1,1.2,0.08);handle.rotation.z=Math.PI/2;g.add(handle);
    /* 窗台（底部突出） */
    const sill=new THREE.Mesh(new THREE.BoxGeometry(2.0,0.06,0.2),frameLiteMat);sill.position.set(0,0.03,0.05);g.add(sill);
    g.userData.windowType='floor';
    return g;
  };

  /* ── 拱形窗（1.4×2.2m，顶部拱形+十字窗棂）── */
  BUILDERS.windowArch=function(){
    const g=new THREE.Group();
    /* 矩形部分外框 */
    const f=new THREE.BoxGeometry(1.4,0.05,0.1);const f2=new THREE.BoxGeometry(0.05,1.6,0.1);
    const top=new THREE.Mesh(f,frameMat);top.position.y=1.4;g.add(top);
    const bot=new THREE.Mesh(f,frameMat);bot.position.y=0;g.add(bot);
    const left=new THREE.Mesh(f2,frameMat);left.position.set(-0.7,0.8,0);g.add(left);
    const right=new THREE.Mesh(f2,frameMat);right.position.set(0.7,0.8,0);g.add(right);
    /* 拱形顶部（用 TorusGeometry 半环） */
    const arch=new THREE.Mesh(new THREE.TorusGeometry(0.7,0.05,12,24,Math.PI),frameMat);
    arch.position.set(0,1.4,0);arch.rotation.z=0;g.add(arch);
    /* 玻璃（矩形+拱形） */
    const glass1=new THREE.Mesh(new THREE.BoxGeometry(1.3,1.4,0.02),glassWin);glass1.position.set(0,0.7,0.02);g.add(glass1);
    const glass2=new THREE.Mesh(new THREE.CircleGeometry(0.65,24,0,Math.PI),glassWin);glass2.position.set(0,1.4,0.02);g.add(glass2);
    /* 十字窗棂 */
    const mh=new THREE.Mesh(new THREE.BoxGeometry(1.3,0.03,0.04),frameMat);mh.position.set(0,0.7,0.04);g.add(mh);
    const mv=new THREE.Mesh(new THREE.BoxGeometry(0.03,1.4,0.04),frameMat);mv.position.set(0,0.7,0.04);g.add(mv);
    /* 拱形窗棂（辐射） */
    for(let i=0;i<3;i++){
      const a=(i+1)*Math.PI/4;
      const bar=new THREE.Mesh(new THREE.BoxGeometry(0.65,0.025,0.03),frameMat);
      bar.position.set(Math.cos(a)*0.32,1.4+Math.sin(a)*0.32,0.04);
      bar.rotation.z=a-Math.PI/2;g.add(bar);
    }
    /* 窗台 */
    const sill=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.06,0.2),frameLiteMat);sill.position.set(0,0.03,0.05);g.add(sill);
    g.userData.windowType='arch';
    return g;
  };

  /* ── 圆形窗（直径1.0m，圆形玻璃+辐射窗棂）── */
  BUILDERS.windowRound=function(){
    const g=new THREE.Group();
    /* 外圈框 */
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.5,0.05,12,32),frameMat);ring.position.set(0,1.0,0);g.add(ring);
    /* 玻璃 */
    const glass=new THREE.Mesh(new THREE.CircleGeometry(0.48,32),glassWin);glass.position.set(0,1.0,0.02);g.add(glass);
    /* 十字窗棂 */
    const h=new THREE.Mesh(new THREE.BoxGeometry(0.96,0.03,0.04),frameMat);h.position.set(0,1.0,0.04);g.add(h);
    const v=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.96,0.04),frameMat);v.position.set(0,1.0,0.04);g.add(v);
    /* 中心小圆 */
    const center=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.04,16),frameMat);center.position.set(0,1.0,0.05);center.rotation.x=Math.PI/2;g.add(center);
    /* 辐射窗棂（45°） */
    for(let i=0;i<2;i++){
      const a=(i*45+45)*Math.PI/180;
      const bar=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.02,0.03),frameMat);
      bar.position.set(0,1.0,0.04);bar.rotation.z=a;g.add(bar);
    }
    g.userData.windowType='round';
    return g;
  };

  /* ── 百叶窗（1.2×1.8m，水平百叶+外框）── */
  BUILDERS.windowLouver=function(){
    const g=new THREE.Group();
    /* 外框 */
    const f=new THREE.BoxGeometry(1.2,0.05,0.1);const f2=new THREE.BoxGeometry(0.05,1.8,0.1);
    const top=new THREE.Mesh(f,frameMat);top.position.y=1.8;g.add(top);
    const bot=new THREE.Mesh(f,frameMat);bot.position.y=0;g.add(bot);
    const left=new THREE.Mesh(f2,frameMat);left.position.set(-0.6,0.9,0);g.add(left);
    const right=new THREE.Mesh(f2,frameMat);right.position.set(0.6,0.9,0);g.add(right);
    /* 背景玻璃 */
    const glass=new THREE.Mesh(new THREE.BoxGeometry(1.1,1.7,0.02),glassWin);glass.position.set(0,0.9,0);g.add(glass);
    /* 水平百叶（12 片，倾斜） */
    for(let i=0;i<12;i++){
      const y=0.1+i*0.14;
      const slat=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.04,0.02),frameLiteMat);
      slat.position.set(0,y,0.05);slat.rotation.x=-0.3;g.add(slat);
    }
    /* 调节杆 */
    const rod=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,1.6,8),frameMat);rod.position.set(0.5,0.9,0.08);g.add(rod);
    g.userData.windowType='louver';
    return g;
  };

  /* ── 飘窗（2.2×0.6m，外凸三面玻璃+窗台）── */
  BUILDERS.windowBay=function(){
    const g=new THREE.Group();
    /* 窗台底座（外凸） */
    const base=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.4,0.6),frameLiteMat);base.position.set(0,0.2,0.2);g.add(base);
    /* 顶板 */
    const top=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.08,0.6),frameLiteMat);top.position.set(0,1.6,0.2);g.add(top);
    /* 正面玻璃（大块） */
    const glassF=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.2,0.02),glassWin);glassF.position.set(0,0.9,0.5);g.add(glassF);
    /* 两侧斜玻璃 */
    const glassL=new THREE.Mesh(new THREE.BoxGeometry(0.5,1.2,0.02),glassWin);glassL.position.set(-0.85,0.9,0.3);glassL.rotation.y=Math.PI/4;g.add(glassL);
    const glassR=new THREE.Mesh(new THREE.BoxGeometry(0.5,1.2,0.02),glassWin);glassR.position.set(0.85,0.9,0.3);glassR.rotation.y=-Math.PI/4;g.add(glassR);
    /* 框架（正面） */
    const fTop=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.04,0.06),frameMat);fTop.position.set(0,1.5,0.5);g.add(fTop);
    const fBot=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.04,0.06),frameMat);fBot.position.set(0,0.4,0.5);g.add(fBot);
    const fL=new THREE.Mesh(new THREE.BoxGeometry(0.04,1.2,0.06),frameMat);fL.position.set(-0.8,0.9,0.5);g.add(fL);
    const fR=new THREE.Mesh(new THREE.BoxGeometry(0.04,1.2,0.06),frameMat);fR.position.set(0.8,0.9,0.5);g.add(fR);
    /* 正面窗棂 */
    const mull=new THREE.Mesh(new THREE.BoxGeometry(0.04,1.2,0.04),frameMat);mull.position.set(0,0.9,0.52);g.add(mull);
    /* 窗台坐垫（飘窗可坐） */
    const cushion=new THREE.Mesh(new THREE.BoxGeometry(2.0,0.08,0.5),new THREE.MeshStandardMaterial({color:'#C9BDA8',roughness:0.8}));cushion.position.set(0,0.44,0.2);g.add(cushion);
    g.userData.windowType='bay';
    return g;
  };

  /* ── 天窗（2.0×1.0m，水平玻璃+框架）── */
  BUILDERS.windowSkylight=function(){
    const g=new THREE.Group();
    /* 框架（水平） */
    const f=new THREE.BoxGeometry(2.0,0.06,0.1);const f2=new THREE.BoxGeometry(0.06,0.06,1.0);
    const f1=new THREE.Mesh(f,frameMat);f1.position.set(0,0,-0.5);g.add(f1);
    const f2m=new THREE.Mesh(f,frameMat);f2m.position.set(0,0,0.5);g.add(f2m);
    const fL=new THREE.Mesh(f2,frameMat);fL.position.set(-1.0,0,0);g.add(fL);
    const fR=new THREE.Mesh(f2,frameMat);fR.position.set(1.0,0,0);g.add(fR);
    /* 玻璃（水平） */
    const glass=new THREE.Mesh(new THREE.BoxGeometry(1.9,0.04,0.9),glassWin);glass.position.set(0,0.03,0);g.add(glass);
    /* 窗棂（十字） */
    const mh=new THREE.Mesh(new THREE.BoxGeometry(1.9,0.04,0.04),frameMat);mh.position.set(0,0.04,0);g.add(mh);
    const mv=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.04,0.9),frameMat);mv.position.set(0,0.04,0);g.add(mv);
    /* 透光（顶部发光面） */
    const glow=new THREE.Mesh(new THREE.PlaneGeometry(1.8,0.8),new THREE.MeshBasicMaterial({color:'#E8F0FF',transparent:true,opacity:0.3}));
    glow.position.set(0,0.06,0);glow.rotation.x=-Math.PI/2;g.add(glow);
    g.userData.windowType='skylight';
    return g;
  };

  /* ── 2D 平面符号（drawSymbol 覆盖）── */
  if(typeof drawSymbol==='function'){
    const _origDrawSymbol=drawSymbol;
    drawSymbol=function(g,type,cx,cz,s,rot){
      const winTypes=['windowFloor','windowArch','windowRound','windowLouver','windowBay','windowSkylight'];
      if(winTypes.includes(type)){
        g.save();g.translate(cx,cz);g.rotate(-rot);
        g.lineWidth=Math.max(1.2,s*.04);g.strokeStyle='#26231D';
        const R=(w,d,x=0,z=0,fill2,rad=0)=>{g.beginPath();const rx=(x-w/2)*s,rz=(z-d/2)*s,rw=w*s,rh=d*s,rr=Math.min(rad*s,rw/2,rh/2);if(g.roundRect)g.roundRect(rx,rz,rw,rh,rr);else g.rect(rx,rz,rw,rh);fill2?g.fill():g.stroke();};
        const C=(r,x=0,z=0,fill2)=>{g.beginPath();g.arc(x*s,z*s,r*s,0,7);fill2?g.fill():g.stroke();};
        const L=(x1,z1,x2,z2)=>{g.beginPath();g.moveTo(x1*s,z1*s);g.lineTo(x2*s,z2*s);g.stroke();};
        switch(type){
          case 'windowFloor':
            g.fillStyle='#C8DCE0';R(1.8,2.4,0,0,1,3);g.strokeStyle='#26231D';
            L(0,-1.2,0,1.2);L(-0.9,0,0.9,0);
            g.fillStyle='#3A3633';R(1.8,0.1,0,1.15,1);break;
          case 'windowArch':
            g.fillStyle='#C8DCE0';R(1.4,1.6,0,0.4,1);
            g.beginPath();g.arc(0,0.4*s,0.7*s,0,Math.PI);g.fill();g.stroke();
            g.strokeStyle='#26231D';L(0,-0.4,0,0.4);L(-0.7,0,0.7,0);
            g.fillStyle='#3A3633';R(1.4,0.1,0,-0.75,1);break;
          case 'windowRound':
            g.fillStyle='#C8DCE0';C(0.5,0,0,1);g.strokeStyle='#26231D';g.stroke();
            L(-0.5,0,0.5,0);L(0,-0.5,0,0.5);break;
          case 'windowLouver':
            R(1.2,1.8);g.fillStyle='#C8DCE0';R(1.1,1.7,0,0,1);
            g.strokeStyle='#5C5147';g.lineWidth=Math.max(0.8,s*.025);
            for(let i=0;i<8;i++){const z=-0.7+i*0.2;L(-0.55,z,0.55,z);}break;
          case 'windowBay':
            g.fillStyle='#C8DCE0';R(2.2,0.6,0,0,1,4);
            g.strokeStyle='#26231D';L(-1.1,0.3,1.1,0.3);
            g.fillStyle='#3A3633';R(2.2,0.1,0,0.25,1);break;
          case 'windowSkylight':
            g.fillStyle='#C8DCE0';R(2.0,1.0,0,0,1,2);
            g.strokeStyle='#26231D';L(0,-0.5,0,0.5);L(-1.0,0,1.0,0);break;
        }
        g.restore();
        return;
      }
      /* 其他类型用原 drawSymbol */
      return _origDrawSymbol.call(this,g,type,cx,cz,s,rot);
    };
  }

  console.log('[FLOORCRAFT] 窗户家具已应用：6 种');
}

/* 本模块在 init 启动序列前注入，BUILDERS（模块级）与 THREE（init 参数）
   均在作用域内可用，直接同步注册窗户 BUILDERS（在模板加载前） */
applyWindows();
