import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// 配置axios默认baseURL
axios.defaults.baseURL = 'http://localhost:3000'

// 配置后端URL，用于图片等静态资源
window.BACKEND_URL = 'http://localhost:3000'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
