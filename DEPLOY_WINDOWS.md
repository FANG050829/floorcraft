# FLOORCRAFT · 铺面工坊 — Windows 部署指南

## 一、环境准备

### 1.1 安装 Node.js
- 下载 [Node.js v20 LTS](https://nodejs.org/)（或更高版本）
- 安装时勾选 "Add to PATH"
- 验证：打开 PowerShell，运行 `node -v`，应显示 `v20.x.x`

### 1.2 安装 Bun（可选，推荐）
```powershell
# PowerShell 管理员模式运行
powershell -c "irm bun.sh/install.ps1 | iex"
```
- 验证：`bun -v`，应显示 `1.x.x`
- 如果不装 Bun，可用 npm 替代（见下文）

### 1.3 安装 Python 3（构建脚本需要）
- 下载 [Python 3.12+](https://www.python.org/downloads/)
- 安装时勾选 "Add Python to PATH"
- 验证：`python --version`

### 1.4 安装 Git
- 下载 [Git for Windows](https://git-scm.com/download/win)
- 安装后验证：`git --version`

## 二、获取代码

### 2.1 克隆/复制项目
```powershell
# 方式1：Git 克隆（如有远程仓库）
git clone <your-repo-url> floorcraft
cd floorcraft

# 方式2：直接复制项目文件夹
# 将整个项目目录复制到 Windows，例如 C:\floorcraft
cd C:\floorcraft
```

## 三、安装依赖

### 3.1 使用 Bun（推荐）
```powershell
cd C:\floorcraft
bun install
```

### 3.2 或使用 npm（无 Bun 时）
```powershell
cd C:\floorcraft
npm install
```

## 四、配置环境变量

### 4.1 创建 .env 文件
```powershell
# 在项目根目录创建 .env 文件
echo DATABASE_URL=file:./db/custom.db > .env
```

> 注意：Windows 路径用相对路径 `file:./db/custom.db`，不要用绝对路径

### 4.2 创建 db 目录
```powershell
mkdir db -Force
```

## 五、构建

### 5.1 构建模块化源码（生成 floorcraft.html）
```powershell
python scripts/build.py
```
- 输出 `public/floorcraft.html`
- 如果报错 `python` 找不到，尝试 `python3 scripts/build.py`

### 5.2 初始化数据库
```powershell
# 使用 Bun
bun run db:push

# 或使用 npm
npx prisma db push --accept-data-loss
```

## 六、开发模式运行

### 6.1 启动开发服务器
```powershell
# 使用 Bun
bun run dev

# 或使用 npm
npm run dev
```

### 6.2 访问
- 浏览器打开 `http://localhost:3000`
- 应看到 FLOORCRAFT 3D 空间规划器界面

## 七、生产部署

### 7.1 构建生产版本
```powershell
# 使用 Bun
bun run build

# 或使用 npm
npm run build
```

### 7.2 启动生产服务器
```powershell
# 使用 Bun
bun run start

# 或使用 npm
npm run start
```

### 7.3 使用 PM2 守护进程（推荐生产环境）
```powershell
# 安装 PM2
npm install -g pm2

# 启动
pm2 start npm --name floorcraft -- start

# 查看状态
pm2 status

# 设置开机自启
pm2 startup
pm2 save
```

## 八、Windows 服务化（可选）

### 8.1 使用 nssm 注册为 Windows 服务
```powershell
# 下载 nssm: https://nssm.cc/download
# 安装为服务
nssm install FloorCraft "C:\Program Files\nodejs\node.exe" "C:\floorcraft\.next\standalone\server.js"
nssm set FloorCraft AppDirectory "C:\floorcraft"
nssm set FloorCraft AppEnvironmentExtra NODE_ENV=production
nssm start FloorCraft
```

### 8.2 或使用 PM2 Windows Service
```powershell
npm install -g pm2-windows-service
pm2-service-install
```

## 九、Nginx 反向代理（可选，用于域名/HTTPS）

### 9.1 安装 Nginx for Windows
- 下载 [Nginx](http://nginx.org/en/download.html)
- 解压到 `C:\nginx`

### 9.2 配置 nginx.conf
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 9.3 启动 Nginx
```powershell
cd C:\nginx
nginx.exe
```

## 十、常见问题

### Q1: `bun` 命令找不到
- 确认 Bun 已安装并添加到 PATH
- 重启 PowerShell
- 或改用 `npm` 替代

### Q2: `python` 命令找不到
- Windows 上可能需要用 `python3`
- 或在 Python 安装时勾选 "Add to PATH"
- 在 Microsoft Store 安装 Python 也行

### Q3: Three.js 加载失败
- `floorcraft.html` 从 CDN 加载 Three.js
- 确保服务器能访问 `cdn.jsdelivr.net`
- 或修改 `floorcraft.html` 中的 CDN 地址

### Q4: 端口 3000 被占用
```powershell
# 查找占用进程
netstat -ano | findstr :3000
# 终止进程（替换 PID）
taskkill /PID <PID> /F
```

### Q5: Prisma 数据库错误
```powershell
# 重新生成 Prisma Client
bun run db:generate
# 重新推送 schema
bun run db:push
```

### Q6: 构建脚本 build.py 报错
```powershell
# 确认 Python 3 已安装
python --version
# 确认 scripts/build.py 存在
dir scripts\build.py
# 运行
python scripts\build.py
```

## 十一、目录结构

```
floorcraft/
├── public/
│   ├── floorcraft.html       # 构建产物（由 build.py 生成）
│   └── fc/                   # 模块化源码
│       ├── data/
│       │   ├── catalog.js    # 家具目录
│       │   └── templates.js  # 场景预设模板
│       └── features/
│           ├── lighting.js       # 光源系统+材质+3D缩略图
│           ├── painting.js      # 表面绘画
│           ├── ai-modeling.js   # AI建模
│           ├── character.js     # 人物操控
│           ├── creator-enhance.js # 创作工作室增强
│           ├── furniture-detail.js # 家具精细建模
│           ├── windows.js        # 窗户家具
│           ├── glass-walls.js    # 玻璃墙
│           └── environment.js    # 天空+墙壁+太阳+云朵
├── scripts/
│   └── build.py              # 构建脚本
├── src/
│   └── app/
│       ├── page.tsx          # 主页（iframe 加载 floorcraft.html）
│       ├── layout.tsx        # 布局
│       └── globals.css       # 全局样式
├── prisma/
│   └── schema.prisma        # 数据库 schema
├── public/                  # 静态资源
├── .env                     # 环境变量
├── package.json
└── next.config.ts
```

## 十二、快速启动清单

```powershell
# 1. 安装依赖
cd C:\floorcraft
bun install        # 或 npm install

# 2. 配置环境
echo DATABASE_URL=file:./db/custom.db > .env
mkdir db -Force

# 3. 构建源码
python scripts/build.py

# 4. 初始化数据库
bun run db:push   # 或 npx prisma db push --accept-data-loss

# 5. 启动开发服务器
bun run dev        # 或 npm run dev

# 6. 浏览器访问
# http://localhost:3000
```

---

**FLOORCRAFT · 铺面工坊** — 3D 商业空间规划器  
版本: 1.0 | 平台: Windows 10/11 | Node.js 20+ | Python 3.12+
