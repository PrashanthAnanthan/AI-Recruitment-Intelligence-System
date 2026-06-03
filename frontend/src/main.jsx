import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A24',
            color: '#E8E8F0',
            border: '1px solid #2A2A38',
            fontFamily: 'DM Sans, sans-serif',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
