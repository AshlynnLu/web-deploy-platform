import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 用户注册页面
function Register({ setIsLoggedIn }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 处理表单输入变化
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 提交注册表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await axios.post('/api/register', form);
      // 注册成功后保存token并更新登录状态
      localStorage.setItem('token', res.data.token);
      setIsLoggedIn(true);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>创建账户</h2>
          <p>加入我们的开发者社区</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input 
              id="username"
              name="username" 
              placeholder="请输入用户名" 
              value={form.username} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">邮箱</label>
            <input 
              id="email"
              name="email" 
              type="email" 
              placeholder="请输入邮箱" 
              value={form.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input 
              id="password"
              name="password" 
              type="password" 
              placeholder="请输入密码" 
              value={form.password} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
          
          {error && <div className="error-message">{error}</div>}
        </form>
        
        <div className="auth-footer">
          <p>已有账号？<a href="/login" className="auth-link">立即登录</a></p>
        </div>
      </div>
    </div>
  );
}

export default Register; 