import axios from 'axios';

async function testFullFlow() {
  console.log('🔄 Probando flujo completo de login y dashboard...\n');
  
  try {
    // 1. Login
    console.log('1️⃣ Intentando login...');
    const loginResponse = await axios.post('http://localhost:4000/api/bff/auth/login', {
      username: 'admin',
      password: 'Admin2025!'
    });
    
    console.log('✅ Login exitoso');
    console.log('🎫 Token:', loginResponse.data.token.substring(0, 20) + '...');
    console.log('👤 Usuario:', loginResponse.data.user.nombre);
    console.log('🔑 Rol:', loginResponse.data.user.role);
    
    // 2. Verificar token
    console.log('\n2️⃣ Verificando token...');
    const verifyResponse = await axios.get('http://localhost:4000/api/bff/auth/verify', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });
    
    console.log('✅ Token válido');
    console.log('🔒 Autenticado:', verifyResponse.data.authenticated);
    
    // 3. Obtener datos del dashboard
    console.log('\n3️⃣ Obteniendo datos del dashboard...');
    const dashboardResponse = await axios.get('http://localhost:4000/api/bff/dashboard', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });
    
    console.log('✅ Dashboard cargado correctamente');
    console.log('📊 Residentes activos:', dashboardResponse.data.residentes.activos);
    console.log('💰 Total donaciones:', dashboardResponse.data.totalDonaciones);
    console.log('📈 Balance:', dashboardResponse.data.finanzas.netBalance);
    
    // 4. Simular redirección según rol
    console.log('\n4️⃣ Simulando redirección...');
    const userRole = loginResponse.data.user.role;
    if (userRole === 'medico') {
      console.log('👨‍⚕️ Debería redirigir a: /app/medicos');
    } else if (userRole === 'enfermera') {
      console.log('👩‍⚕️ Debería redirigir a: /app/enfermeria');
    } else {
      console.log('👑 Debería redirigir a: /app/dashboard');
    }
    
    console.log('\n✅ Flujo completo exitoso - El backend está funcionando correctamente');
    console.log('🔍 El problema debe estar en el frontend');
    
  } catch (error) {
    console.log('❌ Error en el flujo:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('📋 Detalles:', error.response.data);
    }
  }
}

testFullFlow().catch(console.error);
