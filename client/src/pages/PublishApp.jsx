import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 应用发布页面
function PublishApp() {
  const [form, setForm] = useState({ title: '', description: '', url: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // 处理表单输入变化
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // AI生成描述
  const generateDescription = async () => {
    if (!form.title || !form.url) {
      setError('请先填写应用名称和URL');
      return;
    }

    setAiLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/generate-description', {
        title: form.title,
        url: form.url
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setForm({ ...form, description: response.data.description });
      setSuccess('AI描述生成成功！');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('AI生成描述失败:', err);
      setError(err.response?.data?.message || 'AI生成描述失败');
    } finally {
      setAiLoading(false);
    }
  };

  // 提交应用发布表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await axios.post('/api/apps', form, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('应用发布成功，截图生成中...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publish-app-container">
      <div className="publish-app-card">
        <div className="auth-header">
          <h2>发布新应用</h2>
          <p>分享您的优秀项目</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="title">应用名称</label>
            <input 
              id="title"
              name="title" 
              placeholder="请输入应用名称" 
              value={form.title} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="url">应用URL</label>
            <input 
              id="url"
              name="url" 
              placeholder="https://example.com" 
              value={form.url} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="form-group">
            <div className="description-header">
              <label htmlFor="description">应用描述</label>
              <button 
                type="button" 
                className="ai-button"
                onClick={generateDescription}
                disabled={aiLoading || !form.title || !form.url}
                title={!form.title || !form.url ? '请先填写应用名称和URL' : '使用AI生成描述'}
              >
                {aiLoading ? '🤖 生成中...' : '🤖 AI生成'}
              </button>
            </div>
            <textarea 
              id="description"
              name="description" 
              placeholder="请描述您的应用功能、特色等... 或点击AI生成按钮自动生成" 
              value={form.description} 
              onChange={handleChange}
              rows="4"
              required
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? '发布中...' : '发布应用'}
          </button>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </form>
        
        <div className="auth-footer">
          <p>系统将自动为您的应用生成截图</p>
        </div>
      </div>
    </div>
  );
}

export default PublishApp; 