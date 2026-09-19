/**
 * data/templates.js — 场景预设模板（可维护数据层）
 * 8 个商业空间预设：咖啡店/联合办公/精品零售/餐厅/烘焙坊/独立书店/设计工作室/小酒馆
 * 每个模板的家具坐标已校核避免穿模（坐标基于 12×8 房间）。
 *
 * 辅助函数 P / c4 / c2x / c2z / boothW / commChairs / desk4 / meetingT / barSet
 * 用于生成成组的家具（桌+椅组合），保持模板简洁可读。
 */
const P=(t,x,z,r=0)=>({t,x,z,r});
const c4=(x,z)=>[P('chair',x-.95,z,Math.PI/2),P('chair',x+.95,z,-Math.PI/2),P('chair',x,z-.95,0),P('chair',x,z+.95,Math.PI)];
const c2x=(x,z)=>[P('chair',x-.85,z,Math.PI/2),P('chair',x+.85,z,-Math.PI/2)];
const c2z=(x,z)=>[P('chair',x,z-.85,0),P('chair',x,z+.85,Math.PI)];
const c4r=(x,z)=>[P('chair',x-.85,z,Math.PI/2),P('chair',x+.85,z,-Math.PI/2),P('chair',x,z-.85,0),P('chair',x,z+.85,Math.PI)];
const boothW=z=>[P('sofa',-5.55,z,Math.PI/2),P('table2',-4.78,z),P('chair',-4.05,z,-Math.PI/2)];
const commChairs=(x,z)=>[P('chair',x-.75,z-.8,0),P('chair',x,z-.8,0),P('chair',x+.75,z-.8,0),
  P('chair',x-.75,z+.8,Math.PI),P('chair',x,z+.8,Math.PI),P('chair',x+.75,z+.8,Math.PI)];
const desk4=(x,z)=>[P('desk',x-.73,z-.38,Math.PI),P('desk',x+.73,z-.38,Math.PI),
  P('officeChair',x-.73,z-1.13,0),P('officeChair',x+.73,z-1.13,0),
  P('desk',x-.73,z+.38,0),P('desk',x+.73,z+.38,0),
  P('officeChair',x-.73,z+1.13,Math.PI),P('officeChair',x+.73,z+1.13,Math.PI)];
const meetingT=(x,z)=>[P('meeting',x,z),P('officeChair',x,z-.95,0),P('officeChair',x-1.3,z,Math.PI/2),
  P('officeChair',x+1.3,z,-Math.PI/2),P('officeChair',x,z+.95,Math.PI)];
const barSet=(x,z)=>[P('barTable',x,z),P('barStool',x-.65,z),P('barStool',x,z+.65)];

export const TEMPLATES={
  cafe:{name:'咖啡店',items:[
    P('counter',-4.35,-3.5),P('pastry',-2.05,-3.55),P('register',-0.75,-3.45),
    P('shelf',0.45,-3.7),P('shelf',1.55,-3.7),P('waterBar',2.95,-3.55),P('drinkFridge',4.18,-3.55),
    P('stool',-5.1,-2.55),P('stool',-4.4,-2.55),P('stool',-3.7,-2.55),P('stool',-3.0,-2.55),
    ...boothW(-1.6),...boothW(0.4),
    P('communal',0.2,-0.6),...commChairs(0.2,-0.6),
    P('table2',2.9,-0.5),...c2x(2.9,-0.5),
    P('table2',-3.3,1.35),...c2z(-3.3,1.35),
    P('table4',1.9,1.7),...c4(1.9,1.7),
    P('highCounter',-1.2,3.68),P('barStool',-2.0,3.05),P('barStool',-1.2,3.05),P('barStool',-0.4,3.05),
    P('rug',-4.95,2.5),P('armchair',-4.6,2.75,-Math.PI/2),P('pouf',-3.72,2.5),
    P('sideTable',-5.45,1.35),P('arcLamp',-5.5,3.4),P('plant',-5.5,1.0),
    P('posterStand',2.55,3.55),P('plant',4.65,3.5),P('plant',0.1,-2.2),
    /* 窗户：北墙落地窗+东墙拱形窗+天窗 */
    P('windowFloor',2.5,-3.9),P('windowFloor',4.5,-3.9),P('windowArch',5.9,1.5,Math.PI/2),
    P('windowSkylight',0,0),
  ]},
  office:{name:'联合办公',items:[
    P('reception',-0.5,-3.35),
    P('locker',1.6,-3.65),P('locker',2.5,-3.65),P('locker',3.4,-3.65),
    P('whiteboard',-2.9,-3.6),P('coatStand',-1.75,-3.55),P('plant',-3.9,-3.55),
    ...desk4(-3.2,-1.0),...desk4(0.6,-1.0),
    P('bookshelf',-5.75,-2.2,Math.PI/2),P('bookshelf',-5.75,-0.8,Math.PI/2),P('bookshelf',-5.75,0.6,Math.PI/2),
    ...meetingT(4.05,-1.5),
    P('phoneBooth',5.35,0.3),
    P('rug',-4.9,2.5),P('sofa',-5.55,2.5,Math.PI/2),P('table2',-4.9,2.5),P('armchair',-4.2,2.5,-Math.PI/2),
    P('lamp',-5.5,3.5),P('plant',-4.15,3.45),P('magazineRack',-3.55,3.55),
    P('communal',0.3,2.6),P('bench',0.3,1.75),P('bench',0.3,3.45),
    P('standingDesk',2.4,2.9),P('officeChair',2.4,3.6),
    P('waterBar',5.1,1.7),P('stool',4.55,1.05),P('waterDispenser',5.45,2.85),
    P('plant',-0.5,0.7),P('plant',2.4,0.6),
    /* 窗户：北墙百叶窗+东墙圆形窗 */
    P('windowLouver',2.0,-3.9),P('windowRound',5.9,0,Math.PI/2),
  ]},
  retail:{name:'精品零售',items:[
    P('shelf',-5.68,-2.6,Math.PI/2),P('shelf',-5.68,-1.2,Math.PI/2),P('shelf',-5.68,0.2,Math.PI/2),
    P('vitrine',-4.25,0.7),P('vitrine',-4.25,1.95),
    P('rack',-3.6,-3.55),P('rack',-2.3,-3.55),
    P('bookshelf',-0.9,-3.62),P('bookshelf',0.5,-3.62),
    P('displayT',2.4,-3.5),P('register',3.95,-3.45),
    P('rug',-0.6,0.4),P('displayT',-1.6,0.4),P('displayT',0.4,0.4),P('pedestal',1.8,0.4),
    P('sculpture',2.7,0.7),
    P('rack',5.5,-1.6,Math.PI/2),P('stool',4.75,-0.85),P('stool',4.75,-1.6),
    P('sofa',5.55,0.6,-Math.PI/2),
    P('partition',4.55,2.9,Math.PI/2),P('mirror',5.6,3.3,-Math.PI/2),P('stool',5.0,3.3),
    P('planterTrough',-5.15,3.55),P('plant',-5.5,-3.5),P('plant',2.0,1.9),P('plant',3.3,2.0),P('lamp',-0.6,-1.6),
    /* 窗户：南墙飘窗+东墙落地窗 */
    P('windowBay',-2.5,3.7),P('windowFloor',5.9,2.5,Math.PI/2),
  ]},
  resto:{name:'餐厅',items:[
    P('counter',-4.35,-3.5),P('pastry',-2.05,-3.55),P('register',-0.65,-3.45),
    P('shelf',0.35,-3.7),P('shelf',1.4,-3.7),P('waterBar',2.7,-3.55),P('plant',3.85,-3.6),
    P('stool',-5.1,-2.55),P('stool',-4.4,-2.55),P('stool',-3.7,-2.55),P('stool',-3.0,-2.55),
    ...boothW(-1.8),...boothW(0.2),...boothW(2.2),
    P('tableR4',-1.6,-0.6),...c4r(-1.6,-0.6),
    P('tableR4',1.4,-0.6),...c4r(1.4,-0.6),
    P('table4',-0.4,1.8),...c4(-0.4,1.8),
    P('communal',3.3,1.8),...commChairs(3.3,1.8),
    ...barSet(5.5,-1.7),
    P('table2',5.15,0.6),...c2z(5.15,0.6),
    P('wineRack',5.6,2.3,Math.PI/2),
    P('kitchenCounter',-5.05,3.5),
    P('lamp',0.9,3.5),P('plant',-1.6,3.5),P('plant',1.7,-1.7),P('lamp',5.5,3.45),
  ]},
  bakery:{name:'烘焙坊',items:[
    P('counter',-4.35,-3.5),P('pastry',-2.1,-3.55),P('pastry',-0.55,-3.55),P('register',0.75,-3.45),
    P('shelf',1.95,-3.7),P('shelf',3.05,-3.7),P('drinkFridge',4.05,-3.55),
    P('stool',-5.1,-2.55),P('stool',-4.4,-2.55),P('stool',-3.7,-2.55),
    P('displayT',-1.8,-0.6),P('displayT',0.4,-0.6),P('cart',1.75,-0.55),
    ...barSet(5.5,-2.0),
    P('table2',-1.4,1.7),...c2x(-1.4,1.7),
    P('table2',0.9,1.7),...c2x(0.9,1.7),
    P('table4',3.3,1.9),...c4(3.3,1.9),
    P('rug',-4.85,2.5),P('table2',-4.9,2.55),P('chair',-4.9,1.7,0),P('bench',-4.9,3.5),
    P('armchair',-5.5,1.3,Math.PI/2),P('arcLamp',-5.5,0.35),
    P('posterStand',2.5,3.55),P('bench',0.4,3.5),
    P('plant',-5.5,-3.5),P('plant',5.5,0.9),P('lamp',5.45,3.45),P('plant',-2.9,3.5),
    /* 窗户：北墙拱形窗+东墙落地窗 */
    P('windowArch',3.5,-3.9),P('windowFloor',5.9,-1.5,Math.PI/2),
  ]},
  bookstore:{name:'独立书店',items:[
    P('bookshelf',-3.3,-3.7),P('bookshelf',-1.9,-3.7),P('bookshelf',-0.5,-3.7),P('bookshelf',0.9,-3.7),
    P('bookshelf',-5.75,-2.2,Math.PI/2),P('bookshelf',-5.75,-0.8,Math.PI/2),P('bookshelf',-5.75,0.6,Math.PI/2),
    P('magazineRack',1.7,-3.6),P('rack',2.8,-3.55),P('register',3.95,-3.45),
    P('displayT',-1.2,-0.7),P('displayT',0.8,-0.7),
    P('communal',3.4,1.5),...commChairs(3.4,1.5),
    P('rug',-4.9,2.3),P('sofa',-5.55,2.3,Math.PI/2),P('table2',-4.95,2.3),P('armchair',-4.3,2.3,-Math.PI/2),P('arcLamp',-5.5,3.4),
    P('rug',0.9,2.6),P('bench',0.9,3.5),P('pouf',0.0,2.2),P('pouf',1.9,2.2),P('plant',2.4,3.45),
    P('stool',2.3,0.2),P('waterDispenser',5.45,-1.3),
    P('plant',-5.5,-3.5),P('plant',5.5,3.4),P('lamp',2.6,-0.5),
    /* 窗户：北墙落地窗+东墙圆形窗 */
    P('windowFloor',3.0,-3.9),P('windowRound',5.9,3.0,Math.PI/2),
  ]},
  studio:{name:'设计工作室',items:[
    ...desk4(-3.4,-1.2),...desk4(0.4,-1.2),
    P('bookshelf',-5.75,-1.6,Math.PI/2),P('bookshelf',-5.75,-0.2,Math.PI/2),P('bookshelf',-5.75,1.2,Math.PI/2),
    P('shelf',-2.7,-3.7),P('shelf',-1.6,-3.7),P('plant',-0.7,-3.6),
    P('locker',0.5,-3.65),P('locker',1.4,-3.65),P('locker',2.3,-3.65),P('plant',3.3,-3.6),
    P('partition',2.9,-2.7,Math.PI/2),
    ...meetingT(4.05,-1.6),
    P('phoneBooth',5.35,0.3),
    P('communal',1.7,2.5),P('stool',0.15,2.5),P('stool',3.25,2.5),
    P('standingDesk',-2.3,2.9),P('officeChair',-2.3,3.6),
    P('rug',-4.9,2.6),P('sofa',-5.55,2.6,Math.PI/2),P('table2',-4.95,2.6),P('armchair',-4.25,2.6,-Math.PI/2),
    P('lamp',-5.5,3.5),P('plant',-4.2,3.45),
    P('waterBar',5.1,1.8),P('stool',4.55,1.15),P('waterDispenser',3.7,3.55),
    P('whiteboard',5.6,3.2,Math.PI/2),P('posterStand',-0.55,3.6),
    P('plant',-1.6,0.6),P('plant',-5.5,-3.5),
    /* 窗户：北墙百叶窗+南墙飘窗 */
    P('windowLouver',4.0,-3.9),P('windowBay',1.5,3.7),
  ]},
  bistro:{name:'小酒馆',items:[
    P('counter',-4.35,-3.5),P('register',-2.2,-3.45),P('plant',-0.9,-3.6),
    P('shelf',0.0,-3.7),P('wineRack',1.85,-3.62),P('displayT',3.0,-3.5),P('plant',4.2,-3.6),
    P('stool',-5.1,-2.55),P('stool',-4.4,-2.55),P('stool',-3.7,-2.55),P('stool',-3.0,-2.55),
    ...boothW(-1.9),...boothW(0.1),
    P('tableR4',-1.7,1.6),...c4r(-1.7,1.6),
    P('tableR4',1.2,1.9),...c4r(1.2,1.9),
    P('table4',4.3,0.5),...c4(4.3,0.5),
    P('highCounter',2.4,3.7),P('barStool',1.6,3.05),P('barStool',2.4,3.05),P('barStool',3.2,3.05),
    ...barSet(5.5,2.6),
    P('coatStand',-5.55,3.45),P('pouf',4.0,2.1),P('plant',0.35,3.3),
    P('plant',-5.5,1.8),P('lamp',5.5,-1.0),
    /* 窗户：北墙拱形窗+东墙落地窗 */
    P('windowArch',3.5,-3.9),P('windowFloor',5.9,-2.5,Math.PI/2),
  ]},
};
