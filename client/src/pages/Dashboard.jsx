import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 用户个人中心页面
function Dashboard() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 获取token
  const token = localStorage.getItem('token');

  // 获取用户作品列表
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    axios.get('/api/apps', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setApps(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('获取作品失败');
        setLoading(false);
      });
  }, [token, navigate]);

  // 发布/取消发布作品
  const handlePublish = (id, isPublished) => {
    axios.patch(`/api/apps/${id}/publish`, { isPublished: !isPublished }, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setApps(apps.map(app => app._id === id ? { ...app, isPublished: !isPublished } : app));
      })
      .catch(() => setError('操作失败'));
  };

  // 删除作品
  const handleDelete = (id) => {
    if (!window.confirm('确定要删除这个作品吗？删除后无法恢复哦')) return;
    axios.delete(`/api/apps/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => setApps(apps.filter(app => app._id !== id)))
      .catch(() => setError('删除失败'));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>正在加载你的作品...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">🎨 我的作品展示台</h1>
        <p className="hero-subtitle">管理和分享你的创意项目，让才华被更多人看见</p>
        <div style={{ marginTop: '2rem' }}>
          <button 
            onClick={() => navigate('/publish')} 
            className="auth-button"
          >
            ✨ 分享新作品
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {apps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>还没有作品呢</h3>
          <p>快来分享你的第一个作品，展示你的创意和才华吧！</p>
          <button 
            onClick={() => navigate('/publish')} 
            className="auth-button"
          >
            🚀 立即分享
          </button>
        </div>
      ) : (
        <div className="apps-grid">
          {apps.map(app => (
            <div key={app._id} className="app-card">
              <div className="app-screenshot">
                {app.screenshot ? (
                  <img src={`/api/apps/${app._id}/screenshot`} alt={app.title} />
                ) : (
                  <div className="screenshot-placeholder">
                    <span>📸</span>
                  </div>
                )}
                <div className="app-status">
                  <span className={`status-badge ${app.isPublished ? 'published' : 'draft'}`}>
                    {app.isPublished ? '🌟 已发布' : '📝 草稿'}
                  </span>
                </div>
              </div>
              <div className="app-info">
                <h3 className="app-title">{app.title}</h3>
                <div className="app-url">
                  <a href={app.url} target="_blank" rel="noopener noreferrer">
                    查看作品 →
                  </a>
                </div>
                {app.description && (
                  <p className="app-description">{app.description}</p>
                )}
                <div className="app-actions">
                  <button 
                    onClick={() => handlePublish(app._id, app.isPublished)}
                    className={`action-button ${app.isPublished ? 'unpublish' : 'publish'}`}
                  >
                    {app.isPublished ? '暂时下线' : '✨ 发布展示'}
                  </button>
                  <button 
                    onClick={() => handleDelete(app._id)}
                    className="action-button delete"
                  >
                    🗑️ 删除
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

export default Dashboard; 