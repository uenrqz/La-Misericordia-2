import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ensurePortAvailable, PREFERRED_PORT } from './src/utils/port-manager'

// https://vite.dev/config/
export default defineConfig(async () => {
  // Asegurar que el puerto preferido esté disponible
  const port = await ensurePortAvailable();
  
  return {
    plugins: [react()],
    server: {
      port: port || PREFERRED_PORT,
      strictPort: true, // Forzar el uso del puerto especificado
      open: true, // Abrir navegador automáticamente
    },
  }
})
