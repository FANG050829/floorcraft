/**
 * data/catalog.js — 家具目录（可维护数据层）
 * 所有家具的声明式定义：名称/价格/座位数/类别/尺寸
 * 修改家具属性只需改这里，无需触碰 3D 引擎代码。
 */
export const CATALOG={
  chair:       {name:'咖啡椅',     price:180,  seats:1, cat:'seat',    w:.5,  d:.5},
  diningChair: {name:'木质餐椅',   price:340,  seats:1, cat:'seat',    w:.5,  d:.52},
  armchair:    {name:'单人扶手椅', price:980,  seats:1, cat:'seat',    w:.85, d:.85},
  stool:       {name:'吧台凳',     price:260,  seats:1, cat:'seat',    w:.42, d:.42},
  barStool:    {name:'高脚凳',     price:320,  seats:1, cat:'seat',    w:.4,  d:.4},
  bench:       {name:'双人长凳',   price:560,  seats:2, cat:'seat',    w:1.5, d:.42},
  sofa:        {name:'双人卡座',   price:2400, seats:2, cat:'seat',    w:1.35,d:.68},
  loungeSofa:  {name:'三人沙发',   price:4200, seats:3, cat:'seat',    w:2.0, d:.85},
  officeChair: {name:'人体工学椅', price:720,  seats:1, cat:'seat',    w:.6,  d:.6},
  pouf:        {name:'圆蒲团',     price:220,  seats:1, cat:'seat',    w:.55, d:.55},
  table2:      {name:'双人圆桌',   price:420,  seats:0, cat:'table',   w:.85, d:.85},
  tableR4:     {name:'四人圆桌',   price:980,  seats:0, cat:'table',   w:1.1, d:1.1},
  table4:      {name:'四人方桌',   price:780,  seats:0, cat:'table',   w:1.0, d:1.0},
  sideTable:   {name:'圆形边几',   price:290,  seats:0, cat:'table',   w:.45, d:.45},
  communal:    {name:'六人长桌',   price:2100, seats:0, cat:'table',   w:2.4, d:.9},
  barTable:    {name:'高脚吧桌',   price:680,  seats:0, cat:'table',   w:.7,  d:.7},
  desk:        {name:'单人工位',   price:1400, seats:0, cat:'table',   w:1.4, d:.7},
  standingDesk:{name:'电动升降桌', price:2600, seats:0, cat:'table',   w:1.4, d:.7},
  meeting:     {name:'会议桌',     price:2600, seats:0, cat:'table',   w:2.0, d:1.1},
  counter:     {name:'咖啡吧台',   price:8600, seats:0, cat:'counter', w:3.1, d:.8},
  highCounter: {name:'靠窗吧台',   price:2200, seats:0, cat:'counter', w:2.4, d:.45},
  pastry:      {name:'甜品展示柜', price:5200, seats:0, cat:'counter', w:1.4, d:.7},
  waterBar:    {name:'自助水吧',   price:3800, seats:0, cat:'counter', w:1.6, d:.6},
  kitchenCounter:{name:'开放操作台',price:5400,seats:0, cat:'counter', w:1.8, d:.7},
  register:    {name:'收银台',     price:3200, seats:0, cat:'counter', w:1.2, d:.65},
  reception:   {name:'前台接待',   price:4600, seats:0, cat:'counter', w:1.9, d:.9},
  shelf:       {name:'陈列货架',   price:1500, seats:0, cat:'fixture', w:1.0, d:.4},
  bookshelf:   {name:'开放书架',   price:1250, seats:0, cat:'fixture', w:1.2, d:.35},
  vitrine:     {name:'玻璃高柜',   price:3800, seats:0, cat:'fixture', w:.9,  d:.5},
  drinkFridge: {name:'饮料冷柜',   price:4600, seats:0, cat:'fixture', w:.7,  d:.65},
  rack:        {name:'服装挂杆',   price:860,  seats:0, cat:'fixture', w:1.2, d:.5},
  wineRack:    {name:'木质酒架',   price:1900, seats:0, cat:'fixture', w:1.1, d:.35},
  displayT:    {name:'中岛展示台', price:1900, seats:0, cat:'fixture', w:1.2, d:.8},
  pedestal:    {name:'展示柱台',   price:860,  seats:0, cat:'fixture', w:.45, d:.45},
  locker:      {name:'储物柜',     price:1680, seats:0, cat:'fixture', w:.9,  d:.45},
  phoneBooth:  {name:'隔音电话亭', price:8900, seats:0, cat:'fixture', w:1.1, d:1.1},
  planterTrough:{name:'绿植花槽',  price:980,  seats:0, cat:'fixture', w:1.5, d:.4},
  stairStraight:{name:'直跑楼梯',  price:12800,seats:0, cat:'stair',   w:1.15,d:3.0, stair:true, holeOpen:'n'},
  stairL:      {name:'L形楼梯',    price:16800,seats:0, cat:'stair',   w:2.3, d:2.3, stair:true, holeOpen:'w'},
  stairSpiral: {name:'旋转楼梯',   price:18600,seats:0, cat:'stair',   w:2.0, d:2.0, stair:true, holeOpen:'n'},
  stairFloat:  {name:'悬浮踏步',   price:14200,seats:0, cat:'stair',   w:1.1, d:2.6, stair:true, holeOpen:'n'},
  plant:       {name:'绿植盆栽',   price:160,  seats:0, cat:'deco',    w:.5,  d:.5},
  lamp:        {name:'落地灯',     price:380,  seats:0, cat:'deco',    w:.4,  d:.4},
  arcLamp:     {name:'弧形落地灯', price:1200, seats:0, cat:'deco',    w:.55, d:1.2},
  coatStand:   {name:'衣帽架',     price:340,  seats:0, cat:'deco',    w:.5,  d:.5},
  posterStand: {name:'海报立牌',   price:260,  seats:0, cat:'deco',    w:.6,  d:.4},
  cart:        {name:'移动推车',   price:760,  seats:0, cat:'deco',    w:.8,  d:.5},
  whiteboard:  {name:'移动白板',   price:640,  seats:0, cat:'deco',    w:1.3, d:.5},
  magazineRack:{name:'杂志架',     price:420,  seats:0, cat:'deco',    w:.6,  d:.4},
  sculpture:   {name:'艺术摆件',   price:1500, seats:0, cat:'deco',    w:.5,  d:.5},
  partition:   {name:'屏风隔断',   price:640,  seats:0, cat:'deco',    w:1.6, d:.15},
  rug:         {name:'圆形地毯',   price:420,  seats:0, cat:'deco',    w:1.8, d:1.8},
  mirror:      {name:'全身试衣镜', price:520,  seats:0, cat:'deco',    w:.6,  d:.45},
  waterDispenser:{name:'立式饮水机',price:980, seats:0, cat:'deco',    w:.4,  d:.4},
  /* ── 窗户系列（靠墙薄家具）── */
  windowFloor:  {name:'落地窗',     price:2800, seats:0, cat:'deco', w:1.8, d:.1, h:2.4},
  windowArch:    {name:'拱形窗',     price:2400, seats:0, cat:'deco', w:1.4, d:.1, h:2.2},
  windowRound:   {name:'圆形窗',     price:1800, seats:0, cat:'deco', w:1.0, d:.1, h:1.0},
  windowLouver:  {name:'百叶窗',     price:1600, seats:0, cat:'deco', w:1.2, d:.1, h:1.8},
  windowBay:     {name:'飘窗',       price:4200, seats:0, cat:'deco', w:2.2, d:.6, h:1.6},
  windowSkylight:{name:'天窗',       price:5600, seats:0, cat:'deco', w:2.0, d:1.0, h:.1},
};

export const CATS=[
  ['seat','座位 SEATING'],['table','桌台 TABLES'],['counter','柜台 COUNTERS'],
  ['fixture','货架 FIXTURES'],['stair','楼梯 STAIRS'],['deco','陈设 DECOR']
];

export const BRAND_PRESETS=['#C75B39','#2F5D50','#31456B','#8A4B6B','#B98A2F'];

/** 创作工作室的部件形状中文名 */
export const SHAPE_ZH={box:'方块',cyl:'圆柱',sph:'圆球',cone:'圆锥',wedge:'楔形',torus:'圆环',capsule:'胶囊',prism:'棱柱'};

/** 创作部件预设颜色 */
export const PART_COLORS=[
  ['brand','品牌色','var(--brand)'],['brandSoft','浅品牌','var(--brand-soft)'],
  ['wood','原木','#C09A68'],['woodDark','深木','#6E543A'],['ink','炭黑','#2A2620'],
  ['white','奶白','#F4EFE4'],['oat','燕麦','#DCD2BC'],['metal','金属','#3B3B3B'],
  ['green','植物绿','#4C6B45'],['pot','陶土','#C4B39A'],['glass','玻璃','#C8DCE0']
];

/**
 * 玻璃墙配置 — 每个模板可指定将某面墙的一部分改为玻璃墙（增加采光）
 * wall: 'north'(z=-d/2) | 'south'(z=+d/2) | 'west'(x=-w/2) | 'east'(x=+w/2)
 * from/to: 沿墙方向的起始/结束坐标（米，房间中心为原点）
 *   north/south 墙：from/to 是 x 坐标
 *   west/east 墙：from/to 是 z 坐标
 * bars: 木条数量（竖向分割）
 */
export const GLASS_WALLS={
  cafe:[
    {wall:'east',from:-3.5,to:3.5,bars:4},      /* 东墙大面积玻璃，采光 */
    {wall:'south',from:-2.5,to:2.5,bars:3},     /* 南墙（入口侧）玻璃 */
  ],
  office:[
    {wall:'east',from:-3.5,to:3.5,bars:4},
    {wall:'south',from:-3,to:3,bars:4},
  ],
  retail:[
    {wall:'south',from:-3.5,to:3.5,bars:5},     /* 临街大玻璃橱窗 */
    {wall:'east',from:-2,to:2,bars:3},
  ],
  resto:[
    {wall:'east',from:-3,to:3,bars:4},
    {wall:'south',from:-2,to:2,bars:3},
  ],
  bakery:[
    {wall:'south',from:-3.5,to:3.5,bars:5},     /* 临街橱窗展示烘焙 */
    {wall:'east',from:-2,to:2,bars:3},
  ],
  bookstore:[
    {wall:'east',from:-3.5,to:3.5,bars:4},
    {wall:'south',from:-2,to:2,bars:3},
  ],
  studio:[
    {wall:'east',from:-3.5,to:3.5,bars:4},
    {wall:'south',from:-3,to:3,bars:4},
  ],
  bistro:[
    {wall:'east',from:-3,to:3,bars:4},
    {wall:'south',from:-2,to:2,bars:3},
  ],
};
