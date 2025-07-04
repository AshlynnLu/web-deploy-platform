import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 作品发布页面
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
      setError('请先填写作品名称和链接');
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
      setSuccess('AI描述生成成功！让你的作品更吸引人✨');
      
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('AI生成描述失败:', err);
      setError(err.response?.data?.message || 'AI生成描述失败，你可以手动填写哦');
    } finally {
      setAiLoading(false);
    }
  };

  // 提交作品发布表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await axios.post('/api/apps', form, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('🎉 作品发布成功！系统正在为你的作品生成预览图...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || '发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publish-app-container">
      <div className="publish-app-card">
        <div className="auth-header">
          <h2>🌟 分享你的精彩作品</h2>
          <p>让同龄人看到你的创意和才华，获得更多灵感和鼓励</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="title">作品名称</label>
            <input 
              id="title"
              name="title" 
              placeholder="给你的作品起个有趣的名字" 
              value={form.title} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="url">作品链接</label>
            <input 
              id="url"
              name="url" 
              placeholder="https://你的作品地址.com" 
              value={form.url} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="form-group">
            <div className="description-header">
              <label htmlFor="description">作品介绍</label>
              <button 
                type="button" 
                className="ai-button"
                onClick={generateDescription}
                disabled={aiLoading || !form.title || !form.url}
                title={!form.title || !form.url ? '请先填写作品名称和链接' : '使用AI帮你写介绍'}
              >
                {aiLoading ? '🤖 生成中...' : '🤖 AI写介绍'}
              </button>
            </div>
            <textarea 
              id="description"
              name="description" 
              placeholder="介绍一下你的作品吧～比如：这是什么？有什么特色功能？你是怎么做出来的？遇到了什么有趣的挑战？也可以点击AI按钮帮你写哦！" 
              value={form.description} 
              onChange={handleChange}
              rows="5"
              required
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? '发布中...' : '🚀 分享给大家'}
          </button>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </form>
        
        <div className="auth-footer">
          <p>💡 系统会自动为你的作品生成精美预览图，让作品更有吸引力</p>
        </div>
      </div>
    </div>
  );
}

export default PublishApp; 