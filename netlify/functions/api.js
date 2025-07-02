require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const OpenAI = require('openai');

// 数据库连接
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/web-deploy-platform';
    await mongoose.connect(mongoURI);
    isConnected = true;
    console.log('MongoDB连接成功');
  } catch (err) {
    console.error('MongoDB连接失败:', err);
    throw err;
  }
};

// 用户模型
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// 应用模型
const appSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  url: { type: String, required: true },
  previewUrl: { type: String },
  screenshot: { type: String },
  category: { type: String, default: '其他' },
  tags: [String],
  isPublic: { type: Boolean, default: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  favorites: { type: Number, default: 0 },
  favoritedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  webpageUpdatedAt: { type: Date },
  lastChecked: { type: Date },
  contentHash: { type: String },
  status: { type: String, enum: ['active', 'checking', 'error'], default: 'active' }
});

// 评论模型
const commentSchema = new mongoose.Schema({
  appId: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const App = mongoose.models.App || mongoose.model('App', appSchema);
const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

// OpenAI配置
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// JWT认证中间件
const authenticateToken = (authHeader) => {
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    throw new Error('需要访问令牌');
  }
  
  try {
    const user = jwt.verify(token, 'your-secret-key');
    return user;
  } catch (err) {
    throw new Error('无效的令牌');
  }
};

// 路由处理器
const handlers = {
  // 健康检查
  'GET /api/health': async () => ({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
  }),

  // 用户注册
  'POST /api/register': async (body) => {
    const { username, email, password } = body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      throw new Error(existingUser.email === email ? '邮箱已被使用' : '用户名已被使用');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    return {
      message: '注册成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    };
  },

  // 用户登录
  'POST /api/login': async (body) => {
    const { username, password } = body;

    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    });
    
    if (!user) {
      throw new Error('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    return {
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    };
  },

  // 发布应用
  'POST /api/apps': async (body, query, user) => {
    if (!user) throw new Error('需要登录');
    
    const { name, description, url, category, tags } = body;

    const existingApp = await App.findOne({ url });
    if (existingApp) {
      throw new Error('该网址已经被发布过了');
    }

    // 简化版本，暂时不包含截图和AI生成描述
    const app = new App({
      name: name || '未命名应用',
      description: description || '暂无描述',
      url,
      category: category || '其他',
      tags: tags || [],
      author: user.userId,
      authorName: user.username,
      isPublic: true
    });

    await app.save();

    return {
      message: '应用发布成功',
      app: {
        id: app._id,
        name: app.name,
        description: app.description,
        url: app.url,
        category: app.category,
        tags: app.tags,
        authorName: app.authorName,
        likes: app.likes,
        favorites: app.favorites,
        views: app.views,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      }
    };
  },

  // 获取用户的应用列表
  'GET /api/apps': async (query, params, user) => {
    if (!user) throw new Error('需要登录');
    
    const apps = await App.find({ author: user.userId })
      .sort({ createdAt: -1 })
      .select('-contentHash');

    return apps;
  },

  // 获取公开应用列表（原 /api/apps/published）
  'GET /api/apps/published': async (query) => {
    const { page = 1, limit = 12, category, search, sort = 'latest', userId } = query;
    const skip = (page - 1) * limit;

    let queryObj = { isPublic: true };
    
    if (category && category !== '全部' && category !== 'trending' && category !== 'daily') {
      queryObj.category = category;
    }
    
    if (search) {
      queryObj.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    let sortQuery = {};
    if (category === 'daily') {
      // 每日推荐：随机排序
      const apps = await App.aggregate([
        { $match: queryObj },
        { $sample: { size: parseInt(limit) } }
      ]);
      return apps;
    } else {
      // 点赞排行等其他排序
      switch (sort) {
        case 'popular':
          sortQuery = { likes: -1, views: -1 };
          break;
        case 'views':
          sortQuery = { views: -1 };
          break;
        case 'updated':
          sortQuery = { webpageUpdatedAt: -1, updatedAt: -1 };
          break;
        default:
          sortQuery = { createdAt: -1 };
      }
    }

    const [apps, total] = await Promise.all([
      App.find(queryObj)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-contentHash'),
      App.countDocuments(queryObj)
    ]);

    // 如果提供了userId，添加用户状态
    if (userId) {
      const appsWithStatus = apps.map(app => ({
        ...app.toObject(),
        isLikedByCurrentUser: app.likedBy.includes(userId),
        isFavoriteByCurrentUser: app.favoritedBy.includes(userId)
      }));
      return appsWithStatus;
    }

    return apps;
  },

  // 点赞应用
  'POST /api/apps/:id/like': async (body, query, user, params) => {
    if (!user) throw new Error('需要登录');
    
    const appId = params.id;
    const app = await App.findById(appId);
    
    if (!app) {
      throw new Error('应用未找到');
    }

    const userId = user.userId;
    const hasLiked = app.likedBy.includes(userId);

    if (hasLiked) {
      app.likedBy.pull(userId);
      app.likes = Math.max(0, app.likes - 1);
    } else {
      app.likedBy.push(userId);
      app.likes += 1;
    }

    await app.save();

    return {
      likes: app.likes,
      isLiked: !hasLiked
    };
  },

  // 收藏应用
  'POST /api/apps/:id/favorite': async (body, query, user, params) => {
    if (!user) throw new Error('需要登录');
    
    const appId = params.id;
    const app = await App.findById(appId);
    
    if (!app) {
      throw new Error('应用未找到');
    }

    const userId = user.userId;
    const hasFavorited = app.favoritedBy.includes(userId);

    if (hasFavorited) {
      app.favoritedBy.pull(userId);
      app.favorites = Math.max(0, app.favorites - 1);
    } else {
      app.favoritedBy.push(userId);
      app.favorites += 1;
    }

    await app.save();

    return {
      favorites: app.favorites,
      hasFavorited: !hasFavorited
    };
  },

  // 获取用户收藏的应用
  'GET /api/favorites': async (query, params, user) => {
    if (!user) throw new Error('需要登录');
    
    const apps = await App.find({ 
      favoritedBy: user.userId,
      isPublic: true
    }).select('-contentHash');

    return apps;
  },

  // 添加评论
  'POST /api/apps/:id/comments': async (body, query, user, params) => {
    if (!user) throw new Error('需要登录');
    
    const { content } = body;
    const appId = params.id;

    if (!content || content.trim().length === 0) {
      throw new Error('评论内容不能为空');
    }

    const app = await App.findById(appId);
    if (!app) {
      throw new Error('应用未找到');
    }

    const comment = new Comment({
      userId: user.userId,
      appId,
      userName: user.username,
      content: content.trim()
    });

    await comment.save();

    return {
      message: '评论添加成功',
      comment
    };
  },

  // 获取应用评论
  'GET /api/apps/:id/comments': async (query, params) => {
    const appId = params.id;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const app = await App.findById(appId);
    if (!app) {
      throw new Error('应用未找到');
    }

    const comments = await Comment.find({ appId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ appId });

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  },

  // AI生成描述
  'POST /api/generate-description': async (body, query, user) => {
    if (!user) throw new Error('需要登录');
    
    const { title, url } = body;

    if (!openai) {
      throw new Error('AI功能未配置');
    }

    if (!title || !url) {
      throw new Error('请提供产品名称和网址');
    }

    const prompt = `请为一个Web应用生成一个简洁、吸引人的产品描述。

产品信息：
- 名称: ${title}
- 网址: ${url}

要求：
1. 描述应该在50-150字之间
2. 突出产品的核心功能和价值
3. 语言简洁明了，吸引用户
4. 避免过度夸张的词汇
5. 使用中文回复

请直接返回描述内容，不需要额外的格式或标题。`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system", 
            content: "你是一个专业的产品文案撰写专家，善于为Web应用撰写简洁有力的产品描述。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      const description = completion.choices[0].message.content.trim();
      
      return {
        message: '描述生成成功',
        description: description
      };

    } catch (error) {
      console.error('AI生成描述错误:', error);
      throw new Error('AI生成描述失败，请稍后重试');
    }
  },

  // 删除应用
  'DELETE /api/apps/:id': async (body, query, user, params) => {
    if (!user) throw new Error('需要登录');
    
    const appId = params.id;
    const app = await App.findById(appId);
    
    if (!app) {
      throw new Error('应用未找到');
    }

    // 检查是否是应用的作者
    if (app.author.toString() !== user.userId) {
      throw new Error('只有应用作者可以删除应用');
    }

    // 删除相关评论
    await Comment.deleteMany({ appId });

    // 删除应用
    await App.findByIdAndDelete(appId);

    return {
      message: '应用删除成功'
    };
  },

  // 更新应用发布状态
  'PATCH /api/apps/:id/publish': async (body, query, user, params) => {
    if (!user) throw new Error('需要登录');
    
    const appId = params.id;
    const { isPublished } = body;
    
    const app = await App.findById(appId);
    
    if (!app) {
      throw new Error('应用未找到');
    }

    // 检查是否是应用的作者
    if (app.author.toString() !== user.userId) {
      throw new Error('只有应用作者可以修改发布状态');
    }

    app.isPublic = isPublished;
    app.updatedAt = new Date();
    await app.save();

    return {
      message: isPublished ? '应用已公开' : '应用已设为私有',
      app: {
        id: app._id,
        isPublic: app.isPublic,
        updatedAt: app.updatedAt
      }
    };
  }
};

// 主函数
exports.handler = async (event, context) => {
  // 设置CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // 连接数据库
    await connectToDatabase();

    // 解析路径和方法
    let path = event.path.replace('/.netlify/functions/api', '');
    const method = event.httpMethod;
    
    // 处理动态路由参数
    const params = {};
    let routeKey = `${method} ${path}`;
    
    // 检查是否是动态路由
    for (const handlerRoute in handlers) {
      if (handlerRoute.includes(':')) {
        const pattern = handlerRoute.replace(/:\w+/g, '([^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        const match = routeKey.match(regex);
        
        if (match) {
          // 提取参数名
          const paramNames = handlerRoute.match(/:(\w+)/g);
          if (paramNames) {
            paramNames.forEach((paramName, index) => {
              const key = paramName.substring(1); // 去掉冒号
              params[key] = match[index + 1];
            });
          }
          routeKey = handlerRoute;
          break;
        }
      }
    }

    console.log(`处理请求: ${routeKey}`, params);

    // 获取处理器
    const handler = handlers[routeKey];
    if (!handler) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `路由未找到: ${routeKey}` })
      };
    }

    // 解析请求体
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        body = {};
      }
    }

    // 解析查询参数
    const query = event.queryStringParameters || {};

    // 处理需要认证的路由
    let user = null;
    const needsAuth = [
      'POST /api/apps',
      'GET /api/apps',
      'POST /api/apps/:id/like',
      'POST /api/apps/:id/favorite',
      'GET /api/favorites',
      'POST /api/apps/:id/comments',
      'POST /api/generate-description',
      'DELETE /api/apps/:id',
      'PATCH /api/apps/:id/publish'
    ];
    
    if (needsAuth.includes(routeKey) || needsAuth.some(route => {
      const pattern = route.replace(/:\w+/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(routeKey);
    })) {
      try {
        user = authenticateToken(event.headers.authorization);
      } catch (err) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: err.message })
        };
      }
    }

    // 调用处理器
    const result = await handler(body, query, user, params);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('API错误:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || '服务器内部错误' 
      })
    };
  }
}; 