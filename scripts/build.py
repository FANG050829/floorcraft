#!/usr/bin/env python3
"""
build.py — 从模块化源码构建 floorcraft.html

源码结构（可维护的模块）:
  public/fc/data/catalog.js    — 家具目录（名称/价格/尺寸）
  public/fc/data/templates.js   — 场景预设模板（8 种商业空间）
  public/fc/features/*.js       — 功能模块（光源/表面绘画/AI建模等，可选）

构建产物:
  public/floorcraft.html        — 运行时单文件（由本脚本生成，勿手改）

维护方式:
  · 修改家具属性 → 编辑 public/fc/data/catalog.js，重跑本脚本
  · 修改场景预设 → 编辑 public/fc/data/templates.js，重跑本脚本
  · 新增功能     → 在 public/fc/features/ 添加模块，重跑本脚本
  · 运行: python3 scripts/build.py
"""
import re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'public', 'floorcraft.html.bak')   # 基线模板
OUT = os.path.join(ROOT, 'public', 'floorcraft.html')        # 构建产物

with open(SRC, 'r', newline='', encoding='utf-8') as f:
    src = f.read()
LE = '\r\n' if '\r\n' in src else '\n'

def read_module(rel_path):
    p = os.path.join(ROOT, 'public', 'fc', rel_path)
    with open(p, 'r', encoding='utf-8') as f:
        return f.read()

def extract_export(code, name):
    """Extract the value assigned to `export const NAME=` (object or array)."""
    m = re.search(r'export\s+const\s+' + re.escape(name) + r'\s*=', code)
    if not m:
        raise ValueError(f'export {name} not found')
    start = m.end()
    rest = code[start:]
    # find next 'export const ' or 'export function'
    nxt = re.search(r'\nexport\s+(const|function|let|var|default)\b', rest)
    val = rest[:nxt.start()] if nxt else rest
    return val.strip().rstrip(';').strip()

# ── Replace inline CATALOG + CATS with module versions ──
catalog_code = read_module('data/catalog.js')
catalog_inline = (
    'const CATALOG=' + extract_export(catalog_code, 'CATALOG') + ';' + LE +
    'const CATS=' + extract_export(catalog_code, 'CATS') + ';' + LE +
    'const BRAND_PRESETS=' + extract_export(catalog_code, 'BRAND_PRESETS') + ';' + LE +
    'const SHAPE_ZH=' + extract_export(catalog_code, 'SHAPE_ZH') + ';' + LE +
    'const PART_COLORS=' + extract_export(catalog_code, 'PART_COLORS') + ';' + LE +
    'const GLASS_WALLS=' + extract_export(catalog_code, 'GLASS_WALLS') + ';'
)

# Locate original CATALOG..CATS block (by index, robust to nested braces)
cat_start = src.find('const CATALOG={')
assert cat_start >= 0, 'CATALOG not found'
cats_start = src.find('const CATS=', cat_start)
assert cats_start >= 0, 'CATS not found'
cats_end = src.find(';', cats_start)  # end of CATS=[...]; line
assert cats_end >= 0
cats_end += 1  # include ';'
src = src[:cat_start] + catalog_inline + src[cats_end:]

# Remove the now-duplicate standalone BRAND_PRESETS line (kept in catalog_inline)
bp = src.find('const BRAND_PRESETS=[')
if bp >= 0:
    bp_end = src.find(';', bp) + 1
    # also consume trailing newline
    if src[bp_end:bp_end+len(LE)] == LE:
        bp_end += len(LE)
    src = src[:bp] + src[bp_end:]

# Remove the .bak's original SHAPE_ZH and PART_COLORS (the ones inside init, which come AFTER catalog_inline).
# catalog_inline's versions are in module scope (before init); the .bak's are inside init.
# We remove the LAST occurrence (the .bak's, inside init), keeping the first (catalog_inline's).
for pat in ['const SHAPE_ZH={', 'const PART_COLORS=[']:
    idx = src.rfind(pat)
    if idx >= 0:
        end = src.find(';', idx) + 1
        if src[end:end+len(LE)] == LE:
            end += len(LE)
        src = src[:idx] + src[end:]

# ── Replace inline TEMPLATES (keep helper funcs P/c4/etc) ──
tpl_code = read_module('data/templates.js')
templates_inline = 'const TEMPLATES=' + extract_export(tpl_code, 'TEMPLATES') + ';'
# Original block: from "const P=(t,x,z,r=0)=>..." through "const TEMPLATES={...};"
# Strategy: keep helpers up to TEMPLATES, replace TEMPLATES value.
tpl_start = src.find('const TEMPLATES={')
assert tpl_start >= 0, 'TEMPLATES not found'
tpl_end = src.find('};', tpl_start)
assert tpl_end >= 0
tpl_end += 2  # include '};'
src = src[:tpl_start] + templates_inline + src[tpl_end:]

# ── Append feature modules (if any) before startup ──
features_dir = os.path.join(ROOT, 'public', 'fc', 'features')
features_js = ''
if os.path.isdir(features_dir):
    for fn in sorted(os.listdir(features_dir)):
        if fn.endswith('.js'):
            features_js += '/* === feature: ' + fn + ' === */' + LE
            # strip 'export ' keywords so it runs as inline code
            features_js += read_module('features/' + fn).replace('export ', '') + LE + LE

if features_js:
    anchor = '/* ── 启动 ── */'
    ai = src.find(anchor)
    if ai >= 0:
        src = src[:ai] + features_js + src[ai:]

# ── Inject lighting CSS + lightPop HTML + lightBtn (for lighting feature) ──
lighting_path = os.path.join(features_dir, 'lighting.js')
if os.path.isfile(lighting_path):
    # CSS for lighting (3D thumbnails, lightPop, lightGizmo)
    LIGHT_CSS = '''/*lighting-css*/
.lib-item .threed-wrap{position:relative;width:44px;height:44px;flex:none;border-radius:3px;overflow:hidden;background:linear-gradient(160deg,#F1EBDD,#E7DFC9)}
.lib-item .threed-wrap canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block}
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
/*lighting-css-end*/
'''
    src = src.replace('</style>', LIGHT_CSS.replace('\n', LE) + '</style>', 1)

    # Topbar: add 光源 button before 消防疏散
    BTN = ('<button class="tbtn" id="lightBtn">'
           '<svg class="ic" viewBox="0 0 24 24"><path d="M9 21h6M10 17h4M12 3a6 6 0 0 0-4 10.5c.6.7 1 1.5 1 2.5h6c0-1 .4-1.8 1-2.5A6 6 0 0 0 12 3z"/></svg>'
           '<span>光源</span></button>')
    src = src.replace('<button class="tbtn" id="fireBtn">', BTN + '<button class="tbtn" id="fireBtn">', 1)

    # Light popup HTML — after roomPop
    POP = '''<div id="lightPop">
  <h5>场景光源 LIGHTING <button id="lightReset">重置</button></h5>
  <div class="lseg" id="lAmbientSeg"><button data-a="0.4">柔和</button><button data-a="0.7" class="on">日常</button><button data-a="1.0">明亮</button></div>
  <div class="lrow"><span>环境光</span><input type="range" id="lAmb" min="0" max="1.5" step="0.05" value="0.7"><b class="num" id="lAmbV">0.70</b></div>
  <div class="lrow"><span>太阳光</span><input type="range" id="lSun" min="0" max="5" step="0.1" value="3.0"><b class="num" id="lSunV">3.0</b></div>
  <div class="lrow"><span>太阳色</span><input type="color" id="lSunC" value="#fff0dc"><b class="num" id="lSunCV">暖白</b></div>
  <div class="lrow"><span>阴影</span><input type="range" id="lShadow" min="0" max="1" step="0.05" value="1"><b class="num" id="lShadowV">100%</b></div>
  <h5 style="margin-top:6px">点光源 & 聚光灯 LIGHTS</h5>
  <div class="lightList" id="lightList"></div>
  <div class="laddRow" id="lAddRow"><button data-t="warm">＋ 暖光</button><button data-t="cool">＋ 冷光</button><button data-t="brand">＋ 品牌色</button></div>
  <div class="laddRow" id="lAddRow2" style="grid-template-columns:1fr"><button data-t="spot">＋ 聚光灯（可拖动+目标指向地面）</button></div>
  <p class="rnote">点击「＋」新增光源，拖动 3D 视图中的彩色圆点调整位置；聚光灯目标自动指向地面。</p>
</div>
'''
    anchor_room = '<p class="rnote">调整即时生效：墙体 / 地面 / 店招 / 安全出口 / 疏散动线随尺寸重建，家具自动收进新边界；两层时楼梯位置自动开洞并生成护栏。</p>' + LE + '</div>'
    src = src.replace(anchor_room, anchor_room + POP.replace('\n', LE), 1)
    # Bind the spot button in lAddRow2 to addLight('spot')
    # (the lighting feature's addLight handler reads data-t, so we rebind lAddRow2 buttons too)

with open(OUT, 'w', newline='', encoding='utf-8') as f:
    f.write(src)

print(f'Built {OUT}')
print(f'  size: {len(src)} bytes')
print(f'  data modules: catalog.js, templates.js')
features = os.listdir(features_dir) if os.path.isdir(features_dir) else []
print(f'  feature modules: {len([f for f in features if f.endswith(".js")])} files')
