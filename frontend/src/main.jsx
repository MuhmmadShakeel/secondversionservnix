import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { Provider } from 'react-redux'
import App from './App.jsx'
import './index.css'
import './styles/dashboard.css'
import './styles/auth.css'
import './styles/services.css'
import './styles/hiring.css'
import './styles/products.css'
import { store } from './redux/store/Store.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4500,
          style: {
            borderRadius: '12px',
            background: '#ffffff',
            color: '#302a45',
            border: '1px solid #e9e4f5',
            boxShadow: '0 12px 35px rgba(45, 29, 95, 0.14)',
            fontSize: '13px',
            fontWeight: 600,
          },
        }}
      />
    </Provider>
  </StrictMode>,
)
