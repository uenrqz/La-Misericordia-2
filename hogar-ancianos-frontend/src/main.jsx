import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'

// Importación de estilos
import './index.css'
import 'flowbite/dist/flowbite.css'
import 'flowbite'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
