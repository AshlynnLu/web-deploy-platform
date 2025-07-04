import { useEffect, useState } from 'react';
import axios from 'axios';

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 获取收藏列表
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('请先登录');
          setLoading(false);
          return;
        }

        const response = await axios.get('/api/favorites', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setFavorites(response.data);
        setLoading(false);
      } catch (err) {
        console.error('获取收藏列表失败:', err);
        setError('获取收藏列表失败');
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  // 取消收藏
  const handleUnfavorite = async (appId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/apps/${appId}/favorite`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 从列表中移除该作品
      setFavorites(favorites.filter(app => app._id !== appId));
    } catch (err) {
      console.error('取消收藏失败:', err);
      alert('取消收藏失败');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>正在加载收藏的作品...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">💖 我的收藏夹</h1>
        <p className="hero-subtitle">收藏那些让你眼前一亮的同学作品</p>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💝</div>
          <h3>收藏夹还是空的</h3>
          <p>去首页发现一些让你惊艳的同学作品吧！</p>
          <a href="/" className="auth-button">🔍 发现精彩作品</a>
        </div>
      ) : (
        <div className="apps-grid">
          {favorites.map(app => (
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
                  <span className="favorite-date">
                    💫 收藏于 {new Date(app.favoritedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="app-actions">
                  <a 
                    href={app.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="auth-button"
                  >
                    🌟 查看作品
                  </a>
                  <button 
                    onClick={() => handleUnfavorite(app._id)}
                    className="action-button delete"
                  >
                    💔 取消收藏
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites; 