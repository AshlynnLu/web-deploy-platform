# WebDeploy - 网站应用发布平台

一个现代化的网站应用发布平台，支持用户注册登录、应用发布、自动截图等功能。

## ✨ 功能特点

- 🚀 **用户认证系统** - 支持用户注册、登录，保持登录状态
- 📱 **应用发布** - 用户可以发布自己的网站应用
- 📸 **自动截图** - 系统自动为发布的应用生成截图
- 🎨 **科技感界面** - 现代化的深色主题设计，具有科技感
- 📱 **响应式设计** - 支持移动端和桌面端
- 🔒 **安全认证** - JWT令牌认证，保护用户数据

## 🛠️ 技术栈

### 后端
- **Node.js** + **Express** - 服务器框架
- **MongoDB** - 数据库
- **ScreenshotAPI** - 网页截图服务
- **JWT** - 用户认证
- **bcryptjs** - 密码加密

### 前端
- **React** + **Vite** - 前端框架
- **React Router** - 路由管理
- **Axios** - HTTP请求
- **CSS3** - 现代化样式

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd web_deploy
```

### 2. 安装依赖
```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

### 3. 配置环境变量
创建 `.env` 文件并配置以下环境变量：

```bash
# 数据库配置
MONGODB_URI=mongodb://127.0.0.1:27017/web-deploy-platform

# JWT密钥
JWT_SECRET=your-secret-key

# OpenAI API密钥（用于AI生成描述）
OPENAI_API_KEY=your-openai-api-key

# ScreenshotAPI 密钥（用于网站截图）
# 请访问 https://app.screenshotapi.net/ 注册并获取API key
SCREENSHOT_API_KEY=your-screenshot-api-key

# Netlify部署URL（可选）
NETLIFY_URL=https://your-app.netlify.app
```

**重要：** 需要在 https://app.screenshotapi.net/ 注册并获取API key，然后设置 `SCREENSHOT_API_KEY` 环境变量。

**📸 截图优化特性：**
- ✅ **智能缓存**：截图只在首次生成时调用API，后续直接从数据库返回，节省API额度
- 🔄 **手动刷新**：支持重新生成截图功能
- ⚡ **快速加载**：缓存的截图加载速度更快

### 4. 启动服务
```bash
# 启动后端服务 (端口 5000)
npm run dev

# 启动前端服务 (端口 5173)
cd client
npm run dev
```

### 5. 测试截图功能（可选）
在启动应用前，可以测试screenshotAPI是否配置正确：

```bash
# 测试截图API
node test-screenshot.js
```

如果测试成功，会显示 "🎉 screenshotAPI集成测试通过！"

### 6. 访问应用
打开浏览器访问 `http://localhost:5173`

## 📖 使用指南

### 用户注册
1. 点击右上角"注册"按钮
2. 填写用户名、邮箱和密码
3. 注册成功后自动登录

### 发布应用
1. 登录后点击"发布应用"
2. 填写应用信息：
   - 应用名称
   - 应用URL（必须以http://或https://开头）
   - 应用描述（可选）
3. 点击"发布应用"
4. 系统会自动生成截图

### 管理应用
1. 点击"我的应用"查看已发布的应用
2. 可以发布/取消发布应用
3. 可以删除应用

### 浏览应用
- 首页显示所有已发布的应用
- 点击应用卡片可以查看详情
- 点击"访问应用"可以跳转到原网站

## 🎨 界面特色

- **深色主题** - 护眼的深色背景
- **渐变色彩** - 蓝色到粉色的渐变效果
- **毛玻璃效果** - 现代化的半透明卡片
- **动画效果** - 流畅的悬停和过渡动画
- **响应式布局** - 适配各种屏幕尺寸

## 🔧 开发说明

### 项目结构
```
web_deploy/
├── server.js          # 后端服务器
├── package.json       # 后端依赖
├── client/            # 前端项目
│   ├── src/
│   │   ├── pages/     # 页面组件
│   │   ├── App.jsx    # 主应用组件
│   │   └── App.css    # 样式文件
│   └── package.json   # 前端依赖
└── README.md          # 项目说明
```

### API接口
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `POST /api/apps` - 发布应用
- `GET /api/apps` - 获取用户应用
- `GET /api/apps/published` - 获取已发布应用
- `PATCH /api/apps/:id/publish` - 发布/取消发布
- `DELETE /api/apps/:id` - 删除应用
- `GET /api/apps/:id/screenshot` - 获取应用截图（智能缓存）
- `POST /api/apps/:id/regenerate-screenshot` - 重新生成截图

## 🐛 故障排除

### 截图失败
- 确保已正确设置 `SCREENSHOT_API_KEY` 环境变量
- 确保目标网站可以正常访问
- 检查网络连接
- 查看ScreenshotAPI服务状态
- 确认API key有效且有足够的配额

### 登录状态丢失
- 检查浏览器localStorage是否被清除
- 确认JWT令牌是否过期

### 数据库连接失败
- 检查MongoDB连接字符串
- 确认网络连接正常

## 📝 更新日志

### v1.2.0
- 💾 **智能缓存**: 截图数据保存到数据库，避免重复API调用
- 🔄 **手动刷新**: 新增重新生成截图API接口
- ⚡ **性能优化**: 缓存截图加载速度更快，节省API额度
- 🛡️ **权限控制**: 只有应用所有者才能重新生成截图

### v1.1.0
- 🔧 **重要更新**: 截图功能从Puppeteer迁移到ScreenshotAPI
- ✨ 改善了云部署环境的兼容性
- 📸 支持通过环境变量配置截图API密钥
- 🛠️ 添加了截图功能测试脚本

### v1.0.0
- 初始版本发布
- 支持用户注册登录
- 支持应用发布和截图
- 现代化UI设计

## 🤝 贡献

欢迎提交Issue和Pull Request！

## �� 许可证

MIT License 