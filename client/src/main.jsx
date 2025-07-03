import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// 配置axios默认baseURL
const isDevelopment = import.meta.env.DEV
const baseURL = isDevelopment 
  ? 'http://localhost:3000' 
  : window.location.origin

// 图片服务器URL - 开发环境使用本地服务器，生产环境使用Netlify静态文件服务
const imageBaseURL = isDevelopment 
  ? 'http://localhost:3000' 
  : window.location.origin // 生产环境使用当前域名

axios.defaults.baseURL = baseURL
window.BACKEND_URL = imageBaseURL
window.IS_PRODUCTION = !isDevelopment

console.log('Environment:', isDevelopment ? 'development' : 'production')
console.log('API Base URL:', baseURL)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
