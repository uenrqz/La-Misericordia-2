const puppeteer = require('puppeteer');

async function debugFrontend() {
  console.log('🔍 Iniciando debug del frontend...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  const page = await browser.newPage();
  
  // Capturar logs de consola
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[BROWSER ${type.toUpperCase()}]:`, text);
  });
  
  // Capturar errores de página
  page.on('pageerror', (err) => {
    console.log('❌ [PAGE ERROR]:', err.message);
  });
  
  // Capturar fallos de requests
  page.on('requestfailed', (request) => {
    console.log('❌ [REQUEST FAILED]:', request.url(), request.failure().errorText);
  });
  
  try {
    console.log('📱 Navegando a la aplicación...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    
    console.log('📸 Tomando captura inicial...');
    await page.screenshot({ path: 'debug-initial.png', fullPage: true });
    
    // Verificar si estamos en login
    const isLoginPage = await page.evaluate(() => {
      return window.location.pathname === '/login' || document.querySelector('input[type="email"]') !== null;
    });
    
    console.log('🔐 ¿Estamos en la página de login?', isLoginPage);
    
    if (isLoginPage) {
      console.log('📝 Realizando login...');
      
      // Llenar formulario de login
      await page.type('input[type="email"]', 'admin@example.com');
      await page.type('input[type="password"]', 'Admin2025!');
      
      // Hacer click en submit
      await page.click('button[type="submit"]');
      
      // Esperar navegación
      console.log('⏳ Esperando navegación después del login...');
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
      
      console.log('📍 URL después del login:', await page.url());
      
      // Tomar captura después del login
      await page.screenshot({ path: 'debug-after-login.png', fullPage: true });
      
      // Verificar estado de la página
      const pageContent = await page.evaluate(() => {
        return {
          url: window.location.href,
          pathname: window.location.pathname,
          title: document.title,
          bodyHTML: document.body.innerHTML.substring(0, 500),
          hasToken: localStorage.getItem('token') !== null,
          tokenValue: localStorage.getItem('token')?.substring(0, 20) + '...',
          user: JSON.parse(localStorage.getItem('user') || '{}'),
          reactRoot: document.getElementById('root')?.innerHTML.substring(0, 500)
        };
      });
      
      console.log('📊 Estado de la página después del login:');
      console.log('- URL:', pageContent.url);
      console.log('- Pathname:', pageContent.pathname);
      console.log('- Title:', pageContent.title);
      console.log('- Has Token:', pageContent.hasToken);
      console.log('- Token Preview:', pageContent.tokenValue);
      console.log('- User:', pageContent.user);
      console.log('- React Root Content Preview:', pageContent.reactRoot);
      
      // Esperar un poco más para ver si React renderiza algo
      console.log('⏳ Esperando 3 segundos para que React termine de renderizar...');
      await page.waitForTimeout(3000);
      
      // Tomar captura final
      await page.screenshot({ path: 'debug-final.png', fullPage: true });
      
      // Verificar elementos específicos del dashboard
      const dashboardElements = await page.evaluate(() => {
        const elements = {
          sidebar: document.querySelector('[class*="sidebar"]') !== null,
          mainContent: document.querySelector('main') !== null,
          outlet: document.querySelector('[class*="outlet"]') !== null,
          dashboard: document.querySelector('[class*="dashboard"]') !== null || document.textContent.includes('Dashboard'),
          loading: document.textContent.includes('Cargando') || document.textContent.includes('Loading'),
          error: document.textContent.includes('Error') || document.textContent.includes('error'),
        };
        
        return elements;
      });
      
      console.log('🔍 Elementos encontrados en la página:');
      Object.entries(dashboardElements).forEach(([key, value]) => {
        console.log(`- ${key}: ${value}`);
      });
      
    } else {
      console.log('ℹ️ No estamos en la página de login, verificando estado actual...');
      
      const currentState = await page.evaluate(() => {
        return {
          url: window.location.href,
          hasToken: localStorage.getItem('token') !== null,
          bodyText: document.body.textContent.substring(0, 200)
        };
      });
      
      console.log('📊 Estado actual:', currentState);
    }
    
  } catch (error) {
    console.error('❌ Error durante el debugging:', error);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  }
  
  console.log('✅ Debug completado. Revisa las capturas generadas.');
  console.log('🖼️ Capturas guardadas: debug-initial.png, debug-after-login.png, debug-final.png');
  
  // Mantener el navegador abierto para inspección manual
  console.log('🔍 Navegador mantenido abierto para inspección manual...');
  console.log('💡 Presiona Ctrl+C para cerrar cuando termines de inspeccionar.');
  
  // No cerrar el navegador automáticamente
  // await browser.close();
}

debugFrontend().catch(console.error);
