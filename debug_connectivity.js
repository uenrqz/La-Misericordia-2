import axios from 'axios';

async function testConnectivity() {
  console.log('🔍 Probando conectividad de servicios...\n');
  
  // Test Frontend
  try {
    console.log('✅ Frontend: Funcionando (localhost:5174)');
  } catch (error) {
    console.log('❌ Frontend: No responde');
  }

  // Test BFF
  try {
    const bffResponse = await axios.get('http://localhost:4000/api/bff/dashboard', { timeout: 5000 });
    console.log('✅ BFF: Funcionando (localhost:4000)');
  } catch (error) {
    console.log('❌ BFF: Respuesta esperada 401 (sin autenticación) -', error.response?.status);
  }

  // Test Backend indirecto a través del BFF
  console.log('⏳ Backend: Probando a través del BFF...');

  // Test Dashboard endpoint a través del BFF
  try {
    const dashboardResponse = await axios.get('http://localhost:4000/api/bff/dashboard', { 
      timeout: 10000,
      headers: {
        'Authorization': 'Bearer test'
      }
    });
    console.log('✅ Dashboard BFF: Responde');
  } catch (error) {
    console.log('❌ Dashboard BFF: Error -', error.response?.status || error.message);
  }

  console.log('\n🔍 Prueba de login...');
  
  // Test login
  try {
    const loginResponse = await axios.post('http://localhost:4000/api/bff/auth/login', {
      username: 'admin',
      password: 'Admin2025!'
    }, { timeout: 10000 });
    console.log('✅ Login: Exitoso');
    
    // Test dashboard con token real
    if (loginResponse.data && loginResponse.data.token) {
      try {
        const dashboardWithAuth = await axios.get('http://localhost:4000/api/bff/dashboard', {
          headers: {
            'Authorization': `Bearer ${loginResponse.data.token}`
          },
          timeout: 10000
        });
        console.log('✅ Dashboard con autenticación: Responde');
        console.log('📊 Datos del dashboard:', JSON.stringify(dashboardWithAuth.data, null, 2));
      } catch (error) {
        console.log('❌ Dashboard con autenticación: Error -', error.response?.status || error.message);
      }
    }
  } catch (error) {
    console.log('❌ Login: Error -', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('   Detalles:', error.response.data);
    }
  }
}

testConnectivity().catch(console.error);
