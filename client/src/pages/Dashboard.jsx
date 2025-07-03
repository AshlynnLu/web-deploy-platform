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

  // 获取用户应用列表
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
        setError('获取应用失败');
        setLoading(false);
      });
  }, [token, navigate]);

  // 发布/取消发布应用
  const handlePublish = (id, isPublished) => {
    axios.patch(`/api/apps/${id}/publish`, { isPublished: !isPublished }, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setApps(apps.map(app => app._id === id ? { ...app, isPublished: !isPublished } : app));
      })
      .catch(() => setError('操作失败'));
  };

  // 删除应用
  const handleDelete = (id) => {
    if (!window.confirm('确定要删除该应用吗？')) return;
    axios.delete(`/api/apps/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => setApps(apps.filter(app => app._id !== id)))
      .catch(() => setError('删除失败'));
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
        <h1 className="hero-title">我的应用</h1>
        <p className="hero-subtitle">管理您发布的应用</p>
        <button 
          onClick={() => navigate('/publish')} 
          className="publish-button"
        >
          + 发布新应用
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {apps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📱</div>
          <h3>还没有应用</h3>
          <p>发布您的第一个应用吧！</p>
          <button 
            onClick={() => navigate('/publish')} 
            className="auth-button"
          >
            立即发布
          </button>
        </div>
      ) : (
        <div className="apps-grid">
          {apps.map(app => (
            <div key={app._id} className="app-card">
              <div className="app-screenshot">
                {app.screenshot ? (
                  <img src={`${window.BACKEND_URL}/${app.screenshot}`} alt={app.title} />
                ) : (
                  <div className="screenshot-placeholder">
                    <span>📸</span>
                  </div>
                )}
                <div className="app-status">
                  <span className={`status-badge ${app.isPublished ? 'published' : 'draft'}`}>
                    {app.isPublished ? '已发布' : '草稿'}
                  </span>
                </div>
              </div>
              <div className="app-info">
                <h3 className="app-title">{app.title}</h3>
                <div className="app-url">
                  <a href={app.url} target="_blank" rel="noopener noreferrer">
                    {app.url}
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
                    {app.isPublished ? '取消发布' : '发布'}
                  </button>
                  <button 
                    onClick={() => handleDelete(app._id)}
                    className="action-button delete"
                  >
                    删除
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