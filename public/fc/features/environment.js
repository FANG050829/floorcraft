/**
 * features/environment.js — 环境增强：全部墙壁 + 房顶 + 天空
 *
 * 功能：
 * 1. 新增南墙、东墙、房顶（非人物模式时透明，人物模式时显示）
 * 2. 天空（SphereGeometry 天空盒，颜色随氛围预设变化）
 * 3. 天空与环境光效关联（氛围切换时天空色同步）
 *
 * 依赖：THREE, scene, room, roomGroup, sun, hemiLight, MOODS（来自 lighting.js）
 */

/* 天空颜色映射（与 lighting.js 的 MOODS 关联） */
/* sunSize 极小：远处星星般大小的太阳 */
const SKY_COLORS={
  day:    {top:'#5A8AB8',mid:'#9CC4E0',bottom:'#E8E0CC',sun:'#FFFAE0',sunSize:0.0008,sunGlow:0.04,rayIntensity:0.12,cloudColor:'#FFFFFF',cloudOpacity:0.55,cloudDensity:0.5},
  morning:{top:'#6A9AC8',mid:'#B0D8E8',bottom:'#FFF0D8',sun:'#FFFAF0',sunSize:0.0009,sunGlow:0.05,rayIntensity:0.15,cloudColor:'#FFF0E0',cloudOpacity:0.5,cloudDensity:0.45},
  noon:   {top:'#4080B0',mid:'#8AB8D8',bottom:'#E0E8D8',sun:'#FFFEF8',sunSize:0.0008,sunGlow:0.03,rayIntensity:0.08,cloudColor:'#FFFFFF',cloudOpacity:0.45,cloudDensity:0.4},
  dusk:   {top:'#2A1838',mid:'#7A4858',bottom:'#FF9A52',sun:'#FFC080',sunSize:0.0012,sunGlow:0.08,rayIntensity:0.25,cloudColor:'#FFC890',cloudOpacity:0.6,cloudDensity:0.55},
  sunset: {top:'#1A1028',mid:'#5A2838',bottom:'#FF6A20',sun:'#FF9050',sunSize:0.0015,sunGlow:0.1,rayIntensity:0.3,cloudColor:'#FF9050',cloudOpacity:0.65,cloudDensity:0.6},
  night:  {top:'#050810',mid:'#0A1428',bottom:'#1A2438',sun:'#A0B0D0',sunSize:0.0005,sunGlow:0.02,rayIntensity:0.04,cloudColor:'#2A3040',cloudOpacity:0.4,cloudDensity:0.35},
  warmbar:{top:'#1A0C08',mid:'#3A1810',bottom:'#5A3020',sun:'#FFC080',sunSize:0.001,sunGlow:0.06,rayIntensity:0.2,cloudColor:'#6A4020',cloudOpacity:0.45,cloudDensity:0.4},
  cool:   {top:'#1A2028',mid:'#2A3440',bottom:'#4A5560',sun:'#D0E0F0',sunSize:0.0007,sunGlow:0.03,rayIntensity:0.08,cloudColor:'#A0B0C0',cloudOpacity:0.5,cloudDensity:0.45},
  golden: {top:'#4A2838',mid:'#8A5048',bottom:'#FFCAA0',sun:'#FFD8A0',sunSize:0.0011,sunGlow:0.07,rayIntensity:0.22,cloudColor:'#FFD8A0',cloudOpacity:0.55,cloudDensity:0.5},
};

let skyMesh=null;
let envWalls=[];      /* 新增的墙壁+房顶 */
let envCeiling=null;
let curSkyMood='day';
let sunDir=new THREE.Vector3(9,13,7).normalize(); /* 太阳方向（来自 sun 光源位置） */
let skyTime=0; /* 云动画时间 */

/* 创建天空（大球体，背面渲染，含清晰太阳+光线+云） */
function buildSky(){
  if(skyMesh){scene.remove(skyMesh);skyMesh.geometry.dispose();skyMesh.material.dispose();}
  const geo=new THREE.SphereGeometry(80,64,32);
  const mat=new THREE.ShaderMaterial({
    uniforms:{
      topColor:{value:new THREE.Color(SKY_COLORS.day.top)},
      midColor:{value:new THREE.Color(SKY_COLORS.day.mid)},
      bottomColor:{value:new THREE.Color(SKY_COLORS.day.bottom)},
      offset:{value:0.3},
      exponent:{value:0.6},
      sunDir:{value:sunDir.clone()},
      sunColor:{value:new THREE.Color(SKY_COLORS.day.sun)},
      sunSize:{value:SKY_COLORS.day.sunSize},
      sunGlow:{value:SKY_COLORS.day.sunGlow},
      rayIntensity:{value:SKY_COLORS.day.rayIntensity},
      cloudColor:{value:new THREE.Color(SKY_COLORS.day.cloudColor)},
      cloudOpacity:{value:SKY_COLORS.day.cloudOpacity},
      cloudDensity:{value:SKY_COLORS.day.cloudDensity},
      time:{value:0.0},
    },
    vertexShader:`
      varying vec3 vWorldPos;
      varying vec3 vDir;
      void main(){
        vec4 wp=modelMatrix*vec4(position,1.0);
        vWorldPos=wp.xyz;
        vDir=normalize(position);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }
    `,
    fragmentShader:`
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      uniform vec3 sunDir;
      uniform vec3 sunColor;
      uniform float sunSize;
      uniform float sunGlow;
      uniform float rayIntensity;
      uniform vec3 cloudColor;
      uniform float cloudOpacity;
      uniform float cloudDensity;
      uniform float time;
      varying vec3 vWorldPos;
      varying vec3 vDir;

      /* 噪声函数 */
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){
        vec2 i=floor(p);vec2 f=fract(p);
        float a=hash(i);float b=hash(i+vec2(1.0,0.0));
        float c=hash(i+vec2(0.0,1.0));float d=hash(i+vec2(1.0,1.0));
        vec2 u=f*f*(3.0-2.0*f);
        return mix(a,b,u.x)+mix(c,d,u.x)*u.y;
      }
      float fbm(vec2 p){
        float v=0.0;float a=0.5;
        for(int i=0;i<6;i++){v+=a*noise(p);p*=2.1;a*=0.5;}
        return v;
      }

      void main(){
        vec3 dir=normalize(vDir);
        vec3 sunN=normalize(sunDir);
        float sunDot=max(dot(dir,sunN),0.0);

        /* ── 天空：三色渐变（顶/中/底）+ 太阳方向大气散射 ── */
        float h=normalize(vWorldPos+vec3(0.0,offset,0.0)).y;
        float t=max(pow(max(h,0.0),exponent),0.0);
        /* 三段渐变：底→中→顶 */
        vec3 skyLow=mix(bottomColor,midColor,smoothstep(0.0,0.4,t));
        vec3 skyBase=mix(skyLow,topColor,smoothstep(0.3,1.0,t));
        /* 大气散射：太阳方向天空变亮+暖色 */
        float scatter=pow(sunDot,2.0);
        vec3 scatterColor=mix(midColor*0.8,sunColor,0.5);
        vec3 sky=mix(skyBase,skyBase+scatterColor*0.6,scatter*0.5);
        /* 背向太阳的天空略暗 */
        float away=1.0-sunDot;
        sky=mix(sky,sky*0.65,smoothstep(0.5,1.0,away)*0.35);
        /* 地平线雾气（底部更亮，模拟大气透视） */
        sky=mix(sky,sky+mix(bottomColor,sunColor,0.2)*0.15,smoothstep(0.3,0.0,t));

        /* ── 太阳（极小亮点 + 紧凑日冕） ── */
        float sunCore=step(1.0-sunSize,sunDot);
        float sunEdge=smoothstep(1.0-sunSize*1.5,1.0-sunSize,sunDot);
        float corona1=pow(sunDot,1024.0)*sunGlow*2.0;
        float corona2=pow(sunDot,256.0)*sunGlow*0.5;
        float glowWide=pow(sunDot,8.0)*sunGlow*0.03;

        /* ── 云（球面坐标 FBM，带厚度/密度/太阳穿透） ── */
        float cloudMask=smoothstep(-0.15,0.35,dir.y);
        /* 球面坐标 UV（比平面更自然） */
        float phi=asin(dir.y);
        float theta=atan(dir.z,dir.x);
        vec2 cloudUV=vec2(theta/3.14159*2.0,phi)*5.0;
        cloudUV+=vec2(time*0.006,time*0.002);
        /* 三层云（不同速度和尺度，丰富层次） */
        float cloud1=fbm(cloudUV*1.2);
        float cloud2=fbm(cloudUV*2.5+vec2(time*0.01,0.0));
        float cloud3=fbm(cloudUV*5.0+vec2(time*0.015,0.0));
        float cloudNoise=cloud1*0.5+cloud2*0.3+cloud3*0.2;
        /* 云密度阈值（控制云量） */
        float cloudThreshold=1.0-cloudDensity*0.5;
        cloudNoise=smoothstep(cloudThreshold-0.1,cloudThreshold+0.2,cloudNoise)*cloudMask;
        /* 云厚度（中心更厚更亮） */
        float cloudThick=smoothstep(0.3,0.75,cloud1);

        /* 云受太阳照射染色（关联：太阳方向云更亮更暖） */
        float cloudLight=pow(sunDot,1.0)*0.9+0.2;
        vec3 cloudLit=cloudColor*cloudLight;
        /* 云背阳面更暗（关联：背向太阳的云暗） */
        vec3 cloudShadow=cloudColor*0.25;
        vec3 cloudFinal=mix(cloudShadow,cloudLit,smoothstep(0.0,0.6,sunDot));
        /* 云边缘高光（太阳穿透云边缘） */
        float cloudEdge=smoothstep(0.4,0.55,cloud1)*smoothstep(0.65,0.45,cloud1);
        cloudFinal+=sunColor*cloudEdge*pow(sunDot,1.0)*0.6;
        /* 云内部细节（用 cloud3 添加小尺度变化） */
        cloudFinal*=0.8+cloud3*0.4;
        /* 太阳被云遮挡时变暗（关联：云在太阳前时太阳减弱） */
        float sunOcclusion=1.0-cloudNoise*0.8;
        /* 云投下阴影到天空（关联：云下方天空略暗） */
        float cloudShadowSky=1.0-cloudNoise*cloudThick*0.25;

        /* ── 太阳光线（细微，被云遮挡时减弱） ── */
        float rayAngle=atan(dir.z,dir.x);
        float sunAngle=atan(sunN.z,sunN.x);
        float angDiff=abs(mod(rayAngle-sunAngle+3.14159,6.28318)-3.14159);
        float angDist=angDiff/3.14159;
        float rayMask=smoothstep(0.4,0.0,angDist)*smoothstep(0.0,0.3,sunDot);
        float rayNoise=noise(vec2(angDiff*6.0+time*0.2,sunDot*3.0));
        rayNoise=mix(0.5,1.0,rayNoise);
        float rayStrength=rayMask*pow(sunDot,2.0)*rayIntensity*rayNoise*sunOcclusion;
        vec3 rayColor=mix(sunColor,vec3(1.0,0.98,0.92),sunDot*0.5);

        /* ── 混合所有效果 ── */
        vec3 finalColor=sky*cloudShadowSky;
        /* 先画太阳（在云之后，这样云会遮挡太阳） */
        finalColor=mix(finalColor,sunColor*1.5,sunCore*sunOcclusion);
        finalColor=mix(finalColor,sunColor*0.4,sunEdge*0.3*sunOcclusion);
        finalColor+=sunColor*(corona1+corona2)*sunOcclusion;
        finalColor+=sunColor*glowWide*sunOcclusion;
        finalColor+=rayColor*rayStrength*0.3;
        /* 云画在太阳之上（云遮挡太阳，太阳在云后） */
        finalColor=mix(finalColor,cloudFinal,cloudNoise*cloudOpacity*(0.5+cloudThick*0.5));

        gl_FragColor=vec4(finalColor,1.0);
      }
    `,
    side:THREE.BackSide,
    depthWrite:false,
  });
  skyMesh=new THREE.Mesh(geo,mat);
  scene.add(skyMesh);
  /* 更新太阳方向（来自 sun 光源位置） */
  updateSunDirection();
  /* 启动云动画 */
  if(!skyMesh.userData.animating){
    skyMesh.userData.animating=true;
    (function animateSky(){
      requestAnimationFrame(animateSky);
      if(skyMesh&&skyMesh.material&&skyMesh.material.uniforms){
        skyTime+=0.01;
        skyMesh.material.uniforms.time.value=skyTime;
      }
    })();
  }
}

/* 更新太阳方向（从 sun 光源位置） */
function updateSunDirection(){
  if(typeof sun==='undefined')return;
  const p=sun.position;
  sunDir.set(p.x,p.y,p.z).normalize();
  if(skyMesh&&skyMesh.material.uniforms){
    skyMesh.material.uniforms.sunDir.value.copy(sunDir);
  }
}

/* 应用天空氛围 */
function applySkyMood(mood){
  const sc=SKY_COLORS[mood]||SKY_COLORS.day;
  curSkyMood=mood;
  if(skyMesh&&skyMesh.material.uniforms){
    skyMesh.material.uniforms.topColor.value.set(sc.top);
    skyMesh.material.uniforms.midColor.value.set(sc.mid);
    skyMesh.material.uniforms.bottomColor.value.set(sc.bottom);
    skyMesh.material.uniforms.sunColor.value.set(sc.sun);
    skyMesh.material.uniforms.sunSize.value=sc.sunSize;
    skyMesh.material.uniforms.sunGlow.value=sc.sunGlow;
    skyMesh.material.uniforms.rayIntensity.value=sc.rayIntensity;
    skyMesh.material.uniforms.cloudColor.value.set(sc.cloudColor);
    skyMesh.material.uniforms.cloudOpacity.value=sc.cloudOpacity;
    skyMesh.material.uniforms.cloudDensity.value=sc.cloudDensity;
  }
  /* 雾气颜色跟随天空底部 */
  if(scene.fog)scene.fog.color.set(sc.bottom);
  /* 背景色用天空底部 */
  scene.background=new THREE.Color(sc.bottom);
}

/* 构建新增墙壁（南、东）+ 房顶 */
function buildEnvWalls(){
  /* 清理旧的 */
  envWalls.forEach(w=>{scene.remove(w);w.geometry.dispose();w.material.dispose();});
  envWalls=[];
  if(envCeiling){scene.remove(envCeiling);envCeiling.geometry.dispose();envCeiling.material.dispose();envCeiling=null;}
  const w=room.w,d=room.d,h=room.h,H=h*room.floors;
  const wallMat=new THREE.MeshStandardMaterial({
    color:'#F2ECDF',roughness:0.92,
    transparent:true,opacity:0.18, /* 非人物模式透明 */
    depthWrite:false,
  });
  /* 南墙（z=+d/2） */
  const south=new THREE.Mesh(new THREE.BoxGeometry(w+.3,H,.15),wallMat.clone());
  south.position.set(0,H/2,d/2+.075);
  south.userData.envWall=true;
  envWalls.push(south);scene.add(south);
  /* 东墙（x=+w/2） */
  const east=new THREE.Mesh(new THREE.BoxGeometry(.15,H,d),wallMat.clone());
  east.position.set(w/2+.075,H/2,0);
  east.userData.envWall=true;
  envWalls.push(east);scene.add(east);
  /* 房顶 */
  const ceilMat=new THREE.MeshStandardMaterial({
    color:'#F0EAD8',roughness:0.9,
    transparent:true,opacity:0.15,
    depthWrite:false,side:THREE.DoubleSide,
  });
  envCeiling=new THREE.Mesh(new THREE.BoxGeometry(w+.3,.1,d+.3),ceilMat);
  envCeiling.position.set(0,H-0.05,0);
  envCeiling.userData.envWall=true;
  scene.add(envCeiling);
  envWalls.push(envCeiling);
  /* 根据当前人物模式设置可见性 */
  updateEnvWallsVisibility();
}

/* 非人物模式：南墙/东墙/房顶半透明（可透视）；人物模式：不透明 */
function updateEnvWallsVisibility(){
  const charOn=typeof charActive!=='undefined'&&charActive;
  envWalls.forEach(w=>{
    if(charOn){
      /* 人物模式：实体墙不透明 */
      w.material.transparent=false;
      w.material.opacity=1;
      w.material.depthWrite=true;
    }else{
      /* 非人物模式：半透明（可透视内部布局） */
      w.material.transparent=true;
      w.material.opacity=w===envCeiling?0.08:0.1;
      w.material.depthWrite=false;
    }
    w.visible=true;
    w.material.needsUpdate=true;
  });
}

/* .bak 中的北墙/西墙：非人物模式半透明，人物模式不透明 */
function updateAllWallVisibility(){
  const charOn=typeof charActive!=='undefined'&&charActive;
  if(typeof roomGroup==='undefined')return;
  roomGroup.traverse(o=>{
    if(!o.isMesh)return;
    if(o.material&&o.material.color){
      const hex=o.material.color.getHexString();
      if(hex==='f2ecdf'){
        if(charOn){
          o.material.transparent=false;
          o.material.opacity=1;
          o.material.depthWrite=true;
        }else{
          o.material.transparent=true;
          o.material.opacity=0.1;
          o.material.depthWrite=false;
        }
        o.material.needsUpdate=true;
      }
    }
  });
}

/* 监听人物模式切换 */
function hookCharModeChange(){
  /* 轮询 charActive 状态变化 */
  let lastCharActive=false;
  setInterval(()=>{
    const cur=typeof charActive!=='undefined'&&charActive;
    if(cur!==lastCharActive){
      lastCharActive=cur;
      updateEnvWallsVisibility();
      updateAllWallVisibility();
    }
  },100);
  /* 监听氛围切换（通过 MutationObserver 监听 --brand 变化触发天空更新不可行，
     直接 hook lighting 的 applyMood）*/
  if(typeof applyMood==='function'){
    const _orig=applyMood;
    applyMood=function(key){
      _orig(key);
      applySkyMood(key);
    };
  }
}

/* .bak 中的北墙和西墙：非人物模式半透明，人物模式不透明（已在上面的 updateAllWallVisibility 中定义） */
/* 此函数为占位，实际逻辑在上方 294 行的 updateAllWallVisibility 中 */

/* 房间尺寸变化时重建墙壁 */
function hookRoomChange(){
  /* buildRoom 在 init 内定义，无法直接 hook。
     用 MutationObserver 监听 roomGroup 变化 */
  const obs=new MutationObserver(()=>{});
  /* 轮询 room 尺寸变化 */
  let lastW=0,lastD=0,lastH=0,lastFloors=0;
  setInterval(()=>{
    if(typeof room==='undefined')return;
    if(room.w!==lastW||room.d!==lastD||room.h!==lastH||room.floors!==lastFloors){
      lastW=room.w;lastD=room.d;lastH=room.h;lastFloors=room.floors;
      buildEnvWalls();
    }
  },200);
}

function setupEnvironment(){
  buildSky();
  buildEnvWalls();
  hookCharModeChange();
  hookRoomChange();
  /* 默认应用白天氛围：设置太阳位置（远处低角度，非正上方） */
  if(typeof MOODS!=='undefined'&&MOODS.day&&MOODS.day.sunPos&&typeof sun!=='undefined'){
    sun.position.set(MOODS.day.sunPos[0],MOODS.day.sunPos[1],MOODS.day.sunPos[2]);
    if(!sun.target.parent)scene.add(sun.target);
    sun.target.position.set(0,0,0);sun.target.updateMatrixWorld();
    updateSunDirection();
  }
  applySkyMood('day');
  updateAllWallVisibility();
  console.log('[FLOORCRAFT] 环境增强已应用：全部墙壁+房顶+天空');
}

/* 等待 init 完成后挂载 */
function trySetupEnv(){
  if(typeof THREE==='undefined'||typeof scene==='undefined'||typeof room==='undefined')return false;
  if(document.getElementById('envInit'))return true;
  const m=document.createElement('div');m.id='envInit';m.style.display='none';document.body.appendChild(m);
  setupEnvironment();
  return true;
}
let envTries=0;
const envInterval=setInterval(()=>{
  envTries++;
  if(trySetupEnv())clearInterval(envInterval);
  else if(envTries>80){clearInterval(envInterval);
    const o=new MutationObserver(()=>{if(trySetupEnv())o.disconnect();});
    o.observe(document.body,{childList:true,subtree:true});
  }
},100);
