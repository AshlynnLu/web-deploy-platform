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

// 用户模型 - 匹配本地server.js
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// 应用模型 - 完全匹配本地server.js
const appSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  url: { type: String, required: true },
  screenshot: { type: String }, // 截图文件路径
  isPublished: { type: Boolean, default: false },
  likes: { type: Number, default: 0 }, // 点赞数量
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 收藏模型
const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appId: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
  createdAt: { type: Date, default: Date.now }
});

// 确保用户不能重复收藏同一个应用
favoriteSchema.index({ userId: 1, appId: 1 }, { unique: true });

// 点赞模型
const likeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appId: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
  createdAt: { type: Date, default: Date.now }
});

// 确保用户不能重复点赞同一个应用
likeSchema.index({ userId: 1, appId: 1 }, { unique: true });

// 评论模型
const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appId: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
  content: { type: String, required: true, maxLength: 500 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const App = mongoose.models.App || mongoose.model('App', appSchema);
const Favorite = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);
const Like = mongoose.models.Like || mongoose.model('Like', likeSchema);
const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

// OpenAI配置
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// JWT认证中间件
const authenticateToken = (authHeader) => {
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    throw new Error('访问令牌缺失');
  }
  
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return user;
  } catch (err) {
    throw new Error('无效的访问令牌');
  }
};

// 路由处理器
const handlers = {
  // 健康检查
  'GET /api/test': async () => ({
    message: 'API服务器运行正常',
    timestamp: new Date().toISOString()
  }),

  // 用户注册
  'POST /api/register': async (body) => {
    const { username, email, password } = body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      throw new Error('用户名或邮箱已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
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
    const { email, password } = body;

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error('密码错误');
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
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

  // 发布应用 - 完全匹配本地逻辑
  'POST /api/apps': async (body, query, user) => {
    if (!user) throw new Error('需要认证');
    
    const { title, description, url } = body;

    // 验证URL格式
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) {
      throw new Error('请输入有效的URL');
    }

    // 创建应用记录 - 使用与本地相同的字段
    const app = new App({
      userId: user.userId,
      title,
      description,
      url,
      isPublished: false // 默认未发布，与本地一致
    });

    await app.save();

    // 注意：Netlify Functions不支持puppeteer截图，暂时跳过
    console.log(`应用创建成功: ${app._id}, 截图功能在云端暂不可用`);

    return {
      message: '应用创建成功',
      app: {
        id: app._id,
        title: app.title,
        description: app.description,
        url: app.url,
        isPublished: app.isPublished
      }
    };
  },

  // 获取用户的应用列表
  'GET /api/apps': async (query, params, user) => {
    if (!user) throw new Error('需要认证');
    
    const apps = await App.find({ userId: user.userId })
      .sort({ createdAt: -1 });
    
    return apps;
  },

  // 发布/取消发布应用
  'PATCH /api/apps/:id/publish': async (body, query, user, params) => {
    if (!user) throw new Error('需要认证');
    
    const { id } = params;
    const { isPublished } = body;

    const app = await App.findOneAndUpdate(
      { _id: id, userId: user.userId },
      { isPublished, updatedAt: Date.now() },
      { new: true }
    );

    if (!app) {
      throw new Error('应用不存在');
    }

    return {
      message: isPublished ? '应用已发布' : '应用已取消发布',
      app
    };
  },

  // 获取所有已发布的应用
  'GET /api/apps/published': async (body, query) => {
    console.log('收到获取已发布应用的请求', query);
    
    const { category = 'trending', userId } = query;
    
    // 根据分类确定排序方式
    let sortOptions = {};
    if (category === 'trending') {
      sortOptions = { likes: -1, createdAt: -1 }; // 按点赞数降序，然后按创建时间降序
    } else if (category === 'daily') {
      sortOptions = { createdAt: -1 }; // 按创建时间降序
    } else {
      sortOptions = { updatedAt: -1 }; // 默认按更新时间降序
    }
    
    const apps = await App.find({ isPublished: true })
      .populate('userId', 'username')
      .sort(sortOptions);
    
    // 如果有用户ID，添加用户的点赞和收藏状态
    if (userId) {
      const appsWithUserStatus = await Promise.all(apps.map(async (app) => {
        const [isLiked, isFavorited, commentsCount] = await Promise.all([
          Like.exists({ userId, appId: app._id }),
          Favorite.exists({ userId, appId: app._id }),
          Comment.countDocuments({ appId: app._id })
        ]);
        
        return {
          ...app.toObject(),
          isLikedByCurrentUser: !!isLiked,
          isFavoriteByCurrentUser: !!isFavorited,
          commentsCount
        };
      }));
      
      console.log('找到的应用数量:', appsWithUserStatus.length);
      return appsWithUserStatus;
    }
    
    // 如果没有用户ID，只添加评论数量
    const appsWithCounts = await Promise.all(apps.map(async (app) => {
      const commentsCount = await Comment.countDocuments({ appId: app._id });
      return {
        ...app.toObject(),
        commentsCount
      };
    }));
    
    console.log('找到的应用数量:', appsWithCounts.length);
    return appsWithCounts;
  },

  // 删除应用
  'DELETE /api/apps/:id': async (body, query, user, params) => {
    if (!user) throw new Error('需要认证');
    
    const { id } = params;
    
    const app = await App.findOneAndDelete({ _id: id, userId: user.userId });
    
    if (!app) {
      throw new Error('应用不存在');
    }

    return { message: '应用删除成功' };
  },

  // AI生成描述
  'POST /api/generate-description': async (body, query, user) => {
    if (!user) throw new Error('需要认证');
    
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

  // 收藏/取消收藏应用
  'POST /api/apps/:id/favorite': async (body, query, user, params) => {
    if (!user) throw new Error('需要认证');
    
    const { id: appId } = params;
    const userId = user.userId;

    // 检查应用是否存在
    const app = await App.findById(appId);
    if (!app) {
      throw new Error('应用不存在');
    }

    // 检查是否已经收藏
    const existingFavorite = await Favorite.findOne({ userId, appId });

    if (existingFavorite) {
      // 如果已收藏，则取消收藏
      await Favorite.findByIdAndDelete(existingFavorite._id);
      return {
        message: '已取消收藏',
        isFavorite: false
      };
    } else {
      // 如果未收藏，则添加收藏
      const favorite = new Favorite({ userId, appId });
      await favorite.save();
      return {
        message: '收藏成功',
        isFavorite: true
      };
    }
  },

  // 获取用户收藏列表
  'GET /api/favorites': async (query, params, user) => {
    if (!user) throw new Error('需要认证');
    
    const favorites = await Favorite.find({ userId: user.userId })
      .populate({
        path: 'appId',
        populate: {
          path: 'userId',
          select: 'username'
        }
      })
      .sort({ createdAt: -1 });

    // 过滤掉已删除的应用，并添加收藏时间
    const validFavorites = favorites
      .filter(fav => fav.appId) // 确保应用还存在
      .map(fav => ({
        ...fav.appId.toObject(),
        favoritedAt: fav.createdAt
      }));

    return validFavorites;
  },

  // 点赞/取消点赞应用
  'POST /api/apps/:id/like': async (body, query, user, params) => {
    if (!user) throw new Error('需要认证');
    
    const { id: appId } = params;
    const userId = user.userId;

    // 检查应用是否存在
    const app = await App.findById(appId);
    if (!app) {
      throw new Error('应用不存在');
    }

    // 检查是否已经点赞
    const existingLike = await Like.findOne({ userId, appId });

    if (existingLike) {
      // 如果已点赞，则取消点赞
      await Like.findByIdAndDelete(existingLike._id);
      // 减少应用的点赞数
      await App.findByIdAndUpdate(appId, { $inc: { likes: -1 } });
      
      const updatedApp = await App.findById(appId);
      return {
        message: '已取消点赞',
        isLiked: false,
        likes: updatedApp.likes
      };
    } else {
      // 如果未点赞，则添加点赞
      const like = new Like({ userId, appId });
      await like.save();
      // 增加应用的点赞数
      await App.findByIdAndUpdate(appId, { $inc: { likes: 1 } });
      
      const updatedApp = await App.findById(appId);
      return {
        message: '点赞成功',
        isLiked: true,
        likes: updatedApp.likes
      };
    }
  },

  // 获取应用评论
  'GET /api/apps/:id/comments': async (body, query, user, params) => {
    const { id: appId } = params;

    // 检查应用是否存在
    const app = await App.findById(appId);
    if (!app) {
      throw new Error('应用不存在');
    }

    const comments = await Comment.find({ appId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });

    return {
      comments,
      total: comments.length
    };
  },

  // 添加评论
  'POST /api/apps/:id/comments': async (body, query, user, params) => {
    if (!user) throw new Error('需要认证');
    
    const { id: appId } = params;
    const { content } = body;
    const userId = user.userId;

    if (!content || content.trim().length === 0) {
      throw new Error('评论内容不能为空');
    }

    if (content.length > 500) {
      throw new Error('评论内容不能超过500字符');
    }

    // 检查应用是否存在
    const app = await App.findById(appId);
    if (!app) {
      throw new Error('应用不存在');
    }

    // 创建评论
    const comment = new Comment({
      userId,
      appId,
      content: content.trim()
    });

    await comment.save();

    // 返回带用户信息的评论
    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username');

    return {
      message: '评论成功',
      comment: populatedComment
    };
  },

  // 删除评论
  'DELETE /api/apps/:appId/comments/:commentId': async (body, query, user, params) => {
    if (!user) throw new Error('需要认证');
    
    const { appId, commentId } = params;
    const userId = user.userId;

    // 检查应用是否存在
    const app = await App.findById(appId);
    if (!app) {
      throw new Error('应用不存在');
    }

    // 查找评论并检查权限
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error('评论不存在');
    }

    // 只允许评论作者删除自己的评论
    if (comment.userId.toString() !== userId) {
      throw new Error('您只能删除自己的评论');
    }

    // 删除评论
    await Comment.findByIdAndDelete(commentId);

    return {
      message: '评论删除成功'
    };
  },

  // 获取应用截图（通过文件名）
  'GET /api/apps/uploads/:filename': async (body, query, user, params) => {
    const { filename } = params;
    
    // 验证文件名格式（防止路径遍历攻击）
    if (!filename || !/^screenshot-\d+\.(png|jpg|jpeg|gif|webp)$/i.test(filename)) {
      throw new Error('无效的文件名');
    }
    
    // 返回重定向到实际图片URL
    return {
      redirect: true,
      location: `${process.env.NETLIFY_URL || 'https://bee-alpha-store.netlify.app'}/uploads/${filename}`
    };
  },

  // 获取应用截图（通过应用ID，保留兼容性）
  'GET /api/apps/:id/screenshot': async (body, query, user, params) => {
    const { id: appId } = params;

    // 检查应用是否存在
    const app = await App.findById(appId);
    if (!app) {
      throw new Error('应用不存在');
    }

    if (!app.screenshot) {
      throw new Error('该应用暂无截图');
    }

    // 返回重定向到实际图片URL
    return {
      redirect: true,
      location: `${process.env.NETLIFY_URL || 'https://bee-alpha-store.netlify.app'}/${app.screenshot}`
    };
  }
};

// 主函数
exports.handler = async (event, context) => {
  // 设置CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
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
        body: JSON.stringify({ message: `路由未找到: ${routeKey}` })
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
      'PATCH /api/apps/:id/publish',
      'DELETE /api/apps/:id',
      'POST /api/generate-description',
      'POST /api/apps/:id/favorite',
      'GET /api/favorites',
      'POST /api/apps/:id/like',
      'POST /api/apps/:id/comments',
      'DELETE /api/apps/:appId/comments/:commentId'
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
          body: JSON.stringify({ message: err.message })
        };
      }
    }

    // 调用处理器
    const result = await handler(body, query, user, params);

    // 处理重定向响应
    if (result && result.redirect) {
      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': result.location
        },
        body: ''
      };
    }

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
        message: error.message || '服务器错误' 
      })
    };
  }
}; 