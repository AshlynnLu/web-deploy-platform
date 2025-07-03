import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PublishApp from './pages/PublishApp';
import PublicApps from './pages/PublicApps';
import Favorites from './pages/Favorites';
import './App.css';

// 导航栏组件
function Navbar({ isLoggedIn, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <a href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="nav-logo">🚀</span>
          <span className="nav-title">WebDeploy</span>
        </a>
      </div>
      
      {/* 移动端菜单按钮 */}
      <button 
        className="mobile-menu-btn"
        onClick={toggleMobileMenu}
        aria-label="菜单"
        aria-expanded={isMobileMenuOpen}
      >
        <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
      
      <div className={`nav-links ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
        <a href="/" className="nav-link" onClick={closeMobileMenu}>首页</a>
        {isLoggedIn ? (
          <>
            <a href="/dashboard" className="nav-link" onClick={closeMobileMenu}>我的应用</a>
            <a href="/publish" className="nav-link" onClick={closeMobileMenu}>发布应用</a>
            <a href="/favorites" className="nav-link" onClick={closeMobileMenu}>我的收藏</a>
            <button onClick={() => { onLogout(); closeMobileMenu(); }} className="nav-link logout-btn">退出</button>
          </>
        ) : (
          <>
            <a href="/login" className="nav-link" onClick={closeMobileMenu}>登录</a>
            <a href="/register" className="nav-link register-btn" onClick={closeMobileMenu}>注册</a>
          </>
        )}
      </div>
      
      {/* 移动端菜单遮罩 */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
      )}
    </nav>
  );
}

// 首页组件 - 显示所有已发布的应用
function HomePage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('trending'); // 'trending' 或 'daily'
  const [selectedApp, setSelectedApp] = useState(null); // 选中的应用（用于查看评论）
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const fetchApps = (category = 'trending') => {
    console.log(`开始获取应用数据... 类别: ${category}`);
    setLoading(true);
    setError('');
    
    // 检查用户是否登录
    const token = localStorage.getItem('token');
    let userId = null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId;
        setCurrentUserId(userId);
      } catch (e) {
        console.error('解析token失败:', e);
      }
    }
    
    // 传递分类和用户ID参数
    const params = { category };
    if (userId) params.userId = userId;
    
    axios.get('/api/apps/published', { params })
      .then(res => {
        console.log('获取到的应用数据:', res.data);
        setApps(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('获取应用失败:', err);
        setError('获取应用失败: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      });
  };

  // 获取应用评论
  const fetchComments = async (appId) => {
    setLoadingComments(true);
    try {
      const response = await axios.get(`/api/apps/${appId}/comments`);
      setComments(response.data.comments);
    } catch (err) {
      console.error('获取评论失败:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  // 添加评论
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }

    try {
      const response = await axios.post(`/api/apps/${selectedApp._id}/comments`, {
        content: newComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setComments([response.data.comment, ...comments]);
      setNewComment('');
      
      // 更新评论数量
      setApps(apps.map(app => 
        app._id === selectedApp._id 
          ? { ...app, commentsCount: (app.commentsCount || 0) + 1 }
          : app
      ));
    } catch (err) {
      console.error('添加评论失败:', err);
      alert('添加评论失败');
    }
  };

  useEffect(() => {
    fetchApps(activeTab);
  }, [activeTab]);

  // 切换标签页
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedApp(null); // 关闭评论面板
  };

  // 查看应用详情和评论
  const handleViewComments = (app) => {
    setSelectedApp(app);
    fetchComments(app._id);
  };

  // 处理点赞
  const handleLike = async (appId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }

    try {
      const response = await axios.post(`/api/apps/${appId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 更新应用列表中的点赞状态
      setApps(apps.map(app => 
        app._id === appId 
          ? { 
              ...app, 
              likes: response.data.likes,
              isLikedByCurrentUser: response.data.isLiked
            }
          : app
      ));
    } catch (err) {
      console.error('点赞失败:', err);
      alert('点赞失败');
    }
  };

  // 处理收藏
  const handleFavorite = async (appId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }

    try {
      const response = await axios.post(`/api/apps/${appId}/favorite`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 更新应用列表中的收藏状态
      setApps(apps.map(app => 
        app._id === appId 
          ? { 
              ...app, 
              isFavoriteByCurrentUser: response.data.isFavorite
            }
          : app
      ));
    } catch (err) {
      console.error('收藏失败:', err);
      alert('收藏失败');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">发现优秀的网站应用</h1>
        <p className="hero-subtitle">探索开发者们分享的精彩项目</p>
        
        {/* 分类标签页 */}
        <div className="category-tabs">
          <button 
            className={`tab-button ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => handleTabChange('trending')}
          >
            🔥 点赞排行
          </button>
          <button 
            className={`tab-button ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => handleTabChange('daily')}
          >
            🎲 每日推荐
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="apps-grid">
        {apps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📱</div>
            <h3>暂无应用</h3>
            <p>成为第一个发布应用的用户吧！</p>
          </div>
        ) : (
          apps.map(app => (
            <div key={app._id} className="app-card">
              <div className="app-screenshot">
                {app.screenshot ? (
                  <img src={`${window.BACKEND_URL}/${app.screenshot}`} alt={app.title} />
                ) : (
                  <div className="screenshot-placeholder">
                    <span>📸</span>
                  </div>
                )}
              </div>
              <div className="app-info">
                <h3 className="app-title">{app.title}</h3>
                <p className="app-author">by {app.userId?.username || '未知用户'}</p>
                {app.description && (
                  <p className="app-description">{app.description}</p>
                )}
                
                <div className="app-stats">
                  <span className="likes-count">❤️ {app.likes || 0}</span>
                  <span className="comments-count">💬 {app.commentsCount || 0}</span>
                  <span className="created-time">🕒 {new Date(app.createdAt).toLocaleDateString()}</span>
                  {(() => {
                    // 优先显示网页真实更新时间，其次显示系统更新时间
                    const displayTime = app.webpageUpdatedAt || app.updatedAt;
                    const timeType = app.webpageUpdatedAt ? '网页更新' : '系统更新';
                    const showUpdate = displayTime && displayTime !== app.createdAt;
                    
                    return showUpdate && (
                      <span className="updated-time" title={`${timeType}时间`}>
                        🔄 {new Date(displayTime).toLocaleDateString()}
                      </span>
                    );
                  })()}
                </div>

                <div className="app-actions">
                  <a 
                    href={app.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="app-link"
                  >
                    访问应用 →
                  </a>
                  
                  <button 
                    onClick={() => handleViewComments(app)}
                    className="comments-btn"
                    title="查看评论"
                  >
                    💬 评论
                  </button>
                  
                  {currentUserId && (
                    <div className="interaction-buttons">
                      <button 
                        onClick={() => handleLike(app._id)}
                        className={`like-btn ${app.isLikedByCurrentUser ? 'liked' : ''}`}
                        title={app.isLikedByCurrentUser ? '取消点赞' : '点赞'}
                      >
                        {app.isLikedByCurrentUser ? '❤️' : '🤍'} {app.likes || 0}
                      </button>
                      
                      <button 
                        onClick={() => handleFavorite(app._id)}
                        className={`favorite-btn ${app.isFavoriteByCurrentUser ? 'favorited' : ''}`}
                        title={app.isFavoriteByCurrentUser ? '取消收藏' : '收藏'}
                      >
                        {app.isFavoriteByCurrentUser ? '⭐' : '☆'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* 评论面板 */}
      {selectedApp && (
        <div className="comments-panel">
          <div className="comments-header">
            <h3>💬 {selectedApp.title} - 评论</h3>
            <button 
              onClick={() => setSelectedApp(null)}
              className="close-btn"
            >
              ❌
            </button>
          </div>
          
          {/* 添加评论 */}
          {currentUserId && (
            <div className="add-comment">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的评论..."
                maxLength={500}
                rows={3}
              />
              <div className="comment-actions">
                <span className="char-count">{newComment.length}/500</span>
                <button 
                  onClick={handleAddComment}
                  className="submit-comment-btn"
                  disabled={!newComment.trim()}
                >
                  发表评论
                </button>
              </div>
            </div>
          )}
          
          {/* 评论列表 */}
          <div className="comments-list">
            {loadingComments ? (
              <div className="loading-comments">加载评论中...</div>
            ) : comments.length === 0 ? (
              <div className="no-comments">还没有评论，来发表第一条吧！</div>
            ) : (
              comments.map(comment => (
                <div key={comment._id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">{comment.userId?.username || '匿名用户'}</span>
                    <span className="comment-time">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="comment-content">{comment.content}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    setIsLoaded(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  if (!isLoaded) {
    return <div className="loading-container">加载中...</div>;
  }

  return (
    <div className="app-container">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/publish" element={<PublishApp />} />
          <Route path="/apps" element={<PublicApps />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
