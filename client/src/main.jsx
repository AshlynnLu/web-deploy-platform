import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// 配置API和静态资源的不同baseURL
const isDevelopment = import.meta.env.DEV
const apiBaseURL = isDevelopment 
  ? 'http://localhost:3000' 
  : `${window.location.origin}/api`

const staticBaseURL = isDevelopment 
  ? 'http://localhost:3000' 
  : window.location.origin

axios.defaults.baseURL = apiBaseURL
window.BACKEND_URL = staticBaseURL

console.log('Environment:', isDevelopment ? 'development' : 'production')
console.log('API Base URL:', apiBaseURL)
console.log('Static Base URL:', staticBaseURL)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
