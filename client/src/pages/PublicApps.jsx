import { useEffect, useState } from 'react';
import axios from 'axios';

// 公开应用列表页面
function PublicApps() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // 获取所有已发布的应用
  useEffect(() => {
    console.log('PublicApps组件已加载');
    axios.get('/api/apps/published')
      .then(res => {
        console.log('API响应:', res.data);
        setApps(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('API错误:', err);
        setError('获取应用失败');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="public-apps-container">
      <h2>已发布的应用</h2>
      {error && <div className="error">{error}</div>}
      {apps.length === 0 && !error && <div>暂无已发布的应用</div>}
      <ul className="app-list">
        {apps.map(app => (
          <li key={app._id} className="app-item">
            <div>
              <strong>{app.title}</strong> by {app.userId?.username || '未知用户'}
              <div>链接：<a href={app.url} target="_blank" rel="noopener noreferrer">{app.url}</a></div>
              {app.screenshot && (
                <img 
                  src={`${window.location.origin}/${app.screenshot}`} 
                  alt={`${app.title} 截图`} 
                  style={{width: '100%', maxWidth: '400px', height: 'auto', marginTop: '10px'}}
                  onLoad={(e) => {
                    console.log(`图片加载成功: ${e.target.src}`);
                  }}
                  onError={(e) => {
                    console.error('图片加载失败:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <div>描述：{app.description}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PublicApps; 