import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// 配置axios默认baseURL
const isDevelopment = import.meta.env.DEV
const baseURL = isDevelopment 
  ? 'http://localhost:5000' 
  : window.location.origin

axios.defaults.baseURL = baseURL
window.BACKEND_URL = baseURL

console.log('Environment:', isDevelopment ? 'development' : 'production')
console.log('API Base URL:', baseURL)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
