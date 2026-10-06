import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { Provider } from 'react-redux'
import App from './App.jsx'
import './index.css'
import { store } from './redux/store/Store.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: '#301a28',
            color: '#ffffff',
          },
        }}
      />
    </Provider>
  </StrictMode>,
)
