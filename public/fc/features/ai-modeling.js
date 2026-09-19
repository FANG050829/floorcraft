/**
 * features/ai-modeling.js — AI 智能建模（集成在创作工作室界面内）
 *
 * 设计：
 * - 不再使用顶栏按钮 + 弹出面板
 * - 在创作工作室左侧栏「基础信息」下方新增「AI 智能建模」区
 * - 上传/拖拽家具图片 → 5 步分析 → 生成基于创作组件的部件结构
 * - 「应用部件」直接将 AI 生成的部件载入当前创作（保留可编辑结构）
 *
 * 依赖：$, openCreator, creator, mkName, renderPartList, renderPartEditor,
 *   updateMeta, previewDirty, showToast, BRAND, SHAPE_ZH
 */

/* ── CSS（注入到 head）── */
(function injectAICSS(){
  if(document.getElementById('aiCSS'))return;
  const s=document.createElement('style');s.id='aiCSS';s.textContent=`
/* 创作工作室内的 AI 建模区 */
.aiSec{margin-top:14px;padding-top:12px;border-top:1px dashed var(--line)}
.aiSec h6{font-size:10px;letter-spacing:.26em;color:var(--ink2);font-weight:600;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
.aiSec h6 .aiBadge{font-size:9px;background:var(--brand);color:#fff;padding:1px 6px;letter-spacing:.08em;border-radius:2px}
.aiDrop{border:1.5px dashed var(--line);border-radius:4px;padding:14px 8px;text-align:center;font-size:11px;color:var(--ink2);cursor:pointer;transition:.18s;margin-bottom:8px;background:rgba(255,255,255,.3)}
.aiDrop:hover{border-color:var(--brand);color:var(--brand);background:var(--brand-soft)}
.aiDrop.has{border-style:solid;border-color:var(--brand);padding:6px}
.aiDrop img{max-width:100%;max-height:70px;display:block;margin:0 auto 4px}
.aiDrop .hint{font-size:10px;color:var(--ink2)}
.aiDrop .aiIcon{width:26px;height:26px;margin:0 auto 5px;display:block;color:var(--ink2)}
.aiAnalyzing{display:none;flex-direction:column;gap:5px;padding:6px 0}
.aiAnalyzing.show{display:flex}
.aiStep{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--ink2)}
.aiStep .sdot{width:7px;height:7px;border-radius:50%;background:var(--oat);flex:none;transition:.3s}
.aiStep.done{color:var(--ink)}
.aiStep.done .sdot{background:var(--safe)}
.aiStep.active .sdot{background:var(--brand);animation:ailglow 1s ease-in-out infinite}
@keyframes ailglow{0%,100%{box-shadow:0 0 0 0 var(--brand);opacity:.85}50%{box-shadow:0 0 7px 1px var(--brand);opacity:1}}
.aiResult{display:none;margin-top:6px;padding:9px;border:1px solid var(--brand);background:var(--brand-soft)}
.aiResult.show{display:block}
.aiResult .nm{font-size:12px;font-weight:600;margin-bottom:3px;color:var(--ink)}
.aiResult .desc{font-size:10px;color:var(--ink2);line-height:1.6;margin-bottom:8px}
.aiResult .acts{display:flex;gap:5px}
.aiResult .acts button{flex:1;padding:6px 3px;font-size:11px;border:1px solid var(--ink);background:rgba(255,255,255,.6)}
.aiResult .acts .ok{background:var(--brand);color:#fff;border-color:var(--brand);font-weight:600}
.aiResult .acts .ok:hover{filter:brightness(1.08)}
.aiResult .acts .gh:hover{background:var(--ink);color:var(--paper)}
.aiNote{font-size:9.5px;color:var(--ink2);line-height:1.6;margin-top:6px;padding:0 2px}
`;
  document.head.appendChild(s);
})();

function setupAIModeling(){
  /* 在创作工作室左侧栏插入「AI 智能建模」区（在「从起点开始」之前）*/
  const mkStarters=document.getElementById('mkStarters');
  if(!mkStarters)return; /* 创作工作室 DOM 尚未就绪 */
  /* 避免重复注入 */
  if(document.getElementById('aiSec'))return;

  const aiSec=document.createElement('div');aiSec.className='aiSec cb-sec';
  aiSec.id='aiSec';
  aiSec.innerHTML=`
    <h6>AI 智能建模 <span class="aiBadge">AI</span></h6>
    <div class="aiDrop" id="aiDrop">
      <svg class="aiIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/></svg>
      <div>上传家具图片</div>
      <div class="hint">AI 分析轮廓生成部件 · 可继续编辑</div>
      <input type="file" id="aiFile" accept="image/*" style="display:none">
    </div>
    <div class="aiAnalyzing" id="aiAnalyzing">
      <div class="aiStep" id="as1"><span class="sdot"></span>读取图像…</div>
      <div class="aiStep" id="as2"><span class="sdot"></span>识别主体轮廓与比例…</div>
      <div class="aiStep" id="as3"><span class="sdot"></span>拆解为几何部件…</div>
      <div class="aiStep" id="as4"><span class="sdot"></span>匹配材质与配色…</div>
      <div class="aiStep" id="as5"><span class="sdot"></span>组装可编辑模型…</div>
    </div>
    <div class="aiResult" id="aiResult">
      <div class="nm" id="aiNm">AI 创作模型</div>
      <div class="desc" id="aiDesc"></div>
      <div class="acts">
        <button class="gh" id="aiRetry">重新生成</button>
        <button class="ok" id="aiUse">应用部件</button>
      </div>
    </div>
    <p class="aiNote">AI 基于图片宽高比与主色推断家具类型，生成用基础部件搭建的可编辑结构——与手动创作完全兼容，可继续调整每个部件。</p>
  `;
  /* 插入到「从起点开始」区之前 */
  const startersSec=mkStarters.closest('.cb-sec');
  if(startersSec&&startersSec.parentNode){
    startersSec.parentNode.insertBefore(aiSec,startersSec);
  }else{
    mkStarters.parentNode.appendChild(aiSec);
  }

  const aiDrop=$('aiDrop'),aiFile=$('aiFile'),aiAnalyzing=$('aiAnalyzing');
  const aiResult=$('aiResult'),aiNm=$('aiNm'),aiDesc=$('aiDesc');
  let aiLastImage=null,aiLastParts=null;
  const AI_STEPS=['as1','as2','as3','as4','as5'];

  /* 文件上传交互 */
  let fileInput=aiFile;
  aiDrop.onclick=()=>fileInput.click();
  aiDrop.ondragover=e=>{e.preventDefault();aiDrop.style.borderColor='var(--brand)';};
  aiDrop.ondragleave=()=>aiDrop.style.borderColor='';
  aiDrop.ondrop=e=>{e.preventDefault();aiDrop.style.borderColor='';if(e.dataTransfer.files[0])handleAIFile(e.dataTransfer.files[0]);};
  fileInput.onchange=e=>{if(e.target.files[0])handleAIFile(e.target.files[0]);};

  function handleAIFile(file){
    if(!file.type.startsWith('image/'))return showToast('请上传图片文件','warn');
    const reader=new FileReader();
    reader.onload=()=>{
      aiLastImage=reader.result;
      aiDrop.classList.add('has');
      aiDrop.innerHTML='<img src="'+reader.result+'"><div class="hint">已读取 · 点击更换图片</div>';
      /* 重建 file input（innerHTML 清空了）*/
      const ni=document.createElement('input');ni.type='file';ni.accept='image/*';ni.style.display='none';
      ni.onchange=ev=>{if(ev.target.files[0])handleAIFile(ev.target.files[0]);};
      aiDrop.appendChild(ni);
      aiDrop.onclick=()=>ni.click();
      fileInput=ni;
      runAIAnalysis(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function setAIStep(i){
    AI_STEPS.forEach((id,idx)=>{
      const el=$(id);if(!el)return;
      el.classList.remove('done','active');
      if(idx<i)el.classList.add('done');
      else if(idx===i)el.classList.add('active');
    });
  }

  function runAIAnalysis(imgSrc){
    const img=new Image();
    img.onload=()=>{
      const cv=document.createElement('canvas');cv.width=80;cv.height=80;
      const g=cv.getContext('2d');
      const aspect=img.width/img.height;
      g.drawImage(img,0,0,80,80);
      const data=g.getImageData(0,0,80,80).data;
      let r=0,gg=0,b=0,n=0;
      const hueBuckets={};
      for(let i=0;i<data.length;i+=4){
        r+=data[i];gg+=data[i+1];b+=data[i+2];n++;
        const h=rgbHue(data[i],data[i+1],data[i+2]);
        const bk=Math.floor(h/30)%12;
        hueBuckets[bk]=(hueBuckets[bk]||0)+1;
      }
      r=Math.round(r/n);gg=Math.round(gg/n);b=Math.round(b/n);
      aiAnalyzing.classList.add('show');aiResult.classList.remove('show');
      setAIStep(0);
      let step=0;
      const iv=setInterval(()=>{
        step++;setAIStep(step);
        if(step>=5){clearInterval(iv);finishAI();}
      },420);
      function finishAI(){
        const avgHex='#'+[r,gg,b].map(v=>v.toString(16).padStart(2,'0')).join('');
        let parts=[],name='AI 创作家具',desc='';
        const isTall=aspect<0.8, isWide=aspect>1.6;
        if(isWide){
          /* 沙发/长凳 */
          const w=Math.min(2.0,Math.max(1.2,aspect*0.7));
          parts=[
            {shape:'box',x:0,z:0,y:0.25,w:w,d:0.55,h:0.4,c:avgHex,ry:0},
            {shape:'box',x:0,z:-0.22,y:0.55,w:w-0.1,d:0.12,h:0.35,c:avgHex,ry:0},
            {shape:'box',x:-w/2+0.05,z:0,y:0.15,w:0.1,d:0.5,h:0.3,c:'woodDark',ry:0},
            {shape:'box',x:w/2-0.05,z:0,y:0.15,w:0.1,d:0.5,h:0.3,c:'woodDark',ry:0},
            {shape:'box',x:0,z:0,y:0.02,w:w+0.1,d:0.6,h:0.04,c:'woodDark',ry:0},
          ];
          name='AI · 沙发椅';desc=`宽长比 ${aspect.toFixed(2)} · 主色 ${avgHex.toUpperCase()} · 推断沙发/长凳（底座+靠背+扶手+底板，5 部件）`;
        }else if(isTall){
          /* 高柜 */
          const h=Math.min(2.2,Math.max(1.4,1/aspect*1.5));
          const shelfCount=Math.max(2,Math.floor(h/0.4));
          parts=[
            {shape:'box',x:0,z:0,y:h/2,w:0.7,d:0.35,h:h,c:avgHex,ry:0},
            {shape:'box',x:0,z:0,y:h-0.03,w:0.75,d:0.4,h:0.05,c:'woodDark',ry:0},
            {shape:'box',x:0,z:0,y:0.03,w:0.75,d:0.4,h:0.05,c:'woodDark',ry:0},
          ];
          /* 添加层板 */
          for(let i=1;i<shelfCount;i++){
            parts.push({shape:'box',x:0,z:0,y:h*i/shelfCount,w:0.68,d:0.36,h:0.03,c:'woodDark',ry:0});
          }
          name='AI · 高柜';desc=`宽长比 ${aspect.toFixed(2)}（竖向）· 主色 ${avgHex.toUpperCase()} · 推断书柜/展示柜（主体+顶底板+${shelfCount-1}层板，${parts.length} 部件）`;
        }else{
          /* 单椅 */
          parts=[
            {shape:'box',x:0,z:0,y:0.45,w:0.45,d:0.45,h:0.05,c:avgHex,ry:0},
            {shape:'box',x:0,z:-0.18,y:0.7,w:0.45,d:0.06,h:0.4,c:avgHex,ry:0},
            {shape:'box',x:-0.18,z:0.18,y:0.22,w:0.05,d:0.05,h:0.45,c:'woodDark',ry:0},
            {shape:'box',x:0.18,z:0.18,y:0.22,w:0.05,d:0.05,h:0.45,c:'woodDark',ry:0},
            {shape:'box',x:-0.18,z:-0.18,y:0.22,w:0.05,d:0.05,h:0.45,c:'woodDark',ry:0},
            {shape:'box',x:0.18,z:-0.18,y:0.22,w:0.05,d:0.05,h:0.45,c:'woodDark',ry:0},
          ];
          name='AI · 单椅';desc=`宽长比 ${aspect.toFixed(2)}（方正）· 主色 ${avgHex.toUpperCase()} · 推断座椅（坐面+靠背+四腿，6 部件）`;
        }
        aiLastParts=parts;
        aiNm.textContent=name;aiDesc.textContent=desc;
        aiResult.classList.add('show');
      }
    };
    img.src=imgSrc;
  }

  function rgbHue(r,g,b){
    r/=255;g/=255;b/=255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b);
    let h=0;
    if(max===min)h=0;
    else if(max===r)h=60*((g-b)/(max-min));
    else if(max===g)h=60*(2+(b-r)/(max-min));
    else h=60*(4+(r-g)/(max-min));
    if(h<0)h+=360;return h;
  }

  $('aiRetry').onclick=()=>{if(aiLastImage)runAIAnalysis(aiLastImage);};
  $('aiUse').onclick=()=>{
    if(!aiLastParts)return showToast('请先生成模型','warn');
    /* 直接将部件载入当前创作（已在创作工作室内）*/
    creator.def.parts=JSON.parse(JSON.stringify(aiLastParts));
    creator.def.name=aiNm.textContent.replace('AI · ','AI ');
    creator.sel=0;
    mkName.value=creator.def.name;
    renderPartList();renderPartEditor();updateMeta();previewDirty=true;
    showToast('AI 部件已载入 · 可继续编辑后保存');
    aiResult.classList.remove('show');
    aiAnalyzing.classList.remove('show');
  };
}

/* 创作工作室 DOM 在 init 中创建，用 MutationObserver 等待 mkStarters 出现 */
function trySetup(){
  if(document.getElementById('mkStarters')){
    setupAIModeling();
    return true;
  }
  return false;
}
if(!trySetup()){
  const obs=new MutationObserver(()=>{if(trySetup())obs.disconnect();});
  obs.observe(document.body,{childList:true,subtree:true});
  /* 也监听创作工作室打开事件（openCreator 会被调用）*/
  setTimeout(()=>{if(!document.getElementById('aiSec'))trySetup();},3000);
}
