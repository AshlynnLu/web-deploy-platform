import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 用户登录页面
function Login({ setIsLoggedIn }) {
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 处理表单输入变化
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 提交登录表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await axios.post('/api/login', form);
      // 登录成功后保存token并更新登录状态
      localStorage.setItem('token', res.data.token);
      
      // 解析token获取用户信息
      try {
        const payload = JSON.parse(atob(res.data.token.split('.')[1]));
        setIsLoggedIn({ username: payload.username });
      } catch (e) {
        setIsLoggedIn({ username: '同学' });
      }
      
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>欢迎回到Bee Store！🐝</h2>
          <p>登录你的账户，继续展示你的创意作品</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="loginId">邮箱/用户名</label>
            <input 
              id="loginId"
              name="loginId" 
              type="text" 
              placeholder="请输入邮箱或用户名" 
              value={form.loginId} 
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
            {loading ? '登录中...' : '开始展示你的才华'}
          </button>
          
          {error && <div className="error-message">{error}</div>}
        </form>
        
        <div className="auth-footer">
          <p>还没有账号？<a href="/register" className="auth-link">立即加入我们</a></p>
        </div>
      </div>
    </div>
  );
}

export default Login; 