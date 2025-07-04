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
function Navbar({ isLoggedIn, onLogout, username }) {
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
          <span className="nav-logo">🐝</span>
          <span className="nav-title">Bee Store</span>
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
        {isMobileMenuOpen && (
          <button className="close-menu-btn" onClick={closeMobileMenu} aria-label="关闭菜单">✖</button>
        )}
        <a href="/" className="nav-link" onClick={closeMobileMenu}>首页</a>
        {isLoggedIn ? (
          <>
            <a href="/dashboard" className="nav-link" onClick={closeMobileMenu}>我的作品</a>
            <a href="/publish" className="nav-link" onClick={closeMobileMenu}>发布作品</a>
            <a href="/favorites" className="nav-link" onClick={closeMobileMenu}>我的收藏</a>
            {username && (
              <div className="user-info">
                <span className="username">👋 {username}</span>
              </div>
            )}
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

// 首页组件 - 显示所有已发布的作品
function HomePage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('trending'); // 'trending' 或 'daily'
  const [selectedApp, setSelectedApp] = useState(null); // 选中的作品（用于查看评论）
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const fetchApps = (category = 'trending') => {
    console.log(`开始获取作品数据... 类别: ${category}`);
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
        console.log('获取到的作品数据:', res.data);
        setApps(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('获取作品失败:', err);
        setError('获取作品失败: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      });
  };

  // 获取作品评论
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

  // 删除评论
  const handleDeleteComment = async (commentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }

    if (!window.confirm('确定要删除这条评论吗？')) {
      return;
    }

    try {
      await axios.delete(`/api/apps/${selectedApp._id}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 从评论列表中移除已删除的评论
      setComments(comments.filter(comment => comment._id !== commentId));
      
      // 更新评论数量
      setApps(apps.map(app => 
        app._id === selectedApp._id 
          ? { ...app, commentsCount: Math.max((app.commentsCount || 1) - 1, 0) }
          : app
      ));
    } catch (err) {
      console.error('删除评论失败:', err);
      alert(err.response?.data?.message || '删除评论失败');
    }
  };

  useEffect(() => {
    fetchApps(activeTab);
  }, [activeTab]);

  // 切换标签页
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleViewComments = (app) => {
    setSelectedApp(app);
    fetchComments(app._id);
  };

  const handleLike = async (appId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }

    try {
      await axios.post(`/api/apps/${appId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 更新本地状态
      setApps(prevApps => prevApps.map(app => {
        if (app._id === appId) {
          const wasLiked = app.isLikedByCurrentUser;
          return {
            ...app,
            likes: wasLiked ? app.likes - 1 : app.likes + 1,
            isLikedByCurrentUser: !wasLiked
          };
        }
        return app;
      }));
    } catch (err) {
      console.error('点赞失败:', err);
      alert('操作失败');
    }
  };

  const handleFavorite = async (appId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }

    try {
      await axios.post(`/api/apps/${appId}/favorite`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 更新本地状态
      setApps(prevApps => prevApps.map(app => {
        if (app._id === appId) {
          return {
            ...app,
            isFavoriteByCurrentUser: !app.isFavoriteByCurrentUser
          };
        }
        return app;
      }));
    } catch (err) {
      console.error('收藏失败:', err);
      alert('操作失败');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>正在加载精彩作品...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">🐝 发现精彩作品</h1>
        <p className="hero-subtitle">在Bee Store分享自己的创意项目，互相学习，共同成长</p>
      </div>
      
      <div className="category-tabs">
        <button 
          className={`tab-button ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => handleTabChange('trending')}
        >
          🔥 热门作品
        </button>
        <button 
          className={`tab-button ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => handleTabChange('daily')}
        >
          ⭐ 今日推荐
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="apps-grid">
        {apps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎨</div>
            <h3>还没有作品</h3>
            <p>成为第一个分享作品的同学吧！</p>
          </div>
        ) : (
          apps.map(app => (
            <div key={app._id} className="app-card">
              <div className="app-screenshot">
                {app.screenshot ? (
                  <img src={`/api/apps/${app._id}/screenshot`} alt={app.title} />
                ) : (
                  <div className="screenshot-placeholder">
                    <span>📸</span>
                  </div>
                )}
              </div>
              <div className="app-info">
                <h3 className="app-title">{app.title}</h3>
                <p className="app-author">作者：{app.userId?.username || '匿名同学'}</p>
                {app.description && (
                  <p className="app-description">{app.description}</p>
                )}
                
                <div className="app-stats">
                  <span className="likes-count">❤️ {app.likes || 0}</span>
                  <span className="comments-count">💬 {app.commentsCount || 0}</span>
                  <span className="created-time">🕒 {new Date(app.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="app-actions">
                  <div className="interaction-buttons">
                    <a 
                      href={app.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-btn"
                      title="查看作品"
                    >
                      🔗
                    </a>
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
                    <button 
                      onClick={() => handleViewComments(app)}
                      className="like-btn"
                      title="查看评论"
                    >
                      💬
                    </button>
                  </div>
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
                placeholder="写下你的想法，给作者一些鼓励吧..."
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
                    <span className="comment-author">{comment.userId?.username || '匿名同学'}</span>
                    <div className="comment-meta">
                      <span className="comment-time">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                      {currentUserId && comment.userId?._id === currentUserId && (
                        <button 
                          onClick={() => handleDeleteComment(comment._id)}
                          className="delete-comment-btn"
                          title="删除评论"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
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
  const [username, setUsername] = useState('');

  useEffect(() => {
    // 检查登录状态并获取用户名
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsLoggedIn(true);
        setUsername(payload.username || '同学');
      } catch (e) {
        console.error('解析token失败:', e);
        setIsLoggedIn(false);
      }
    }
    setIsLoaded(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUsername('');
    window.location.href = '/';
  };

  const handleLogin = (userInfo) => {
    setIsLoggedIn(true);
    setUsername(userInfo.username || '同学');
  };

  if (!isLoaded) {
    return <div className="loading-container">加载中...</div>;
  }

  return (
    <div className="app-container">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} username={username} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register setIsLoggedIn={handleLogin} />} />
          <Route path="/login" element={<Login setIsLoggedIn={handleLogin} />} />
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
