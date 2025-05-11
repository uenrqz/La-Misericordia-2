// Configuración para la integración con SOUT (Sistema Oficial Universitario de Autenticación)
module.exports = {
  clientId: process.env.SOUT_CLIENT_ID,
  clientSecret: process.env.SOUT_CLIENT_SECRET,
  authUrl: 'https://sout.university.edu/auth',
  tokenUrl: 'https://sout.university.edu/token',
  userInfoUrl: 'https://sout.university.edu/userinfo',
  redirectUri: process.env.SOUT_REDIRECT_URI || 'http://localhost:3000/api/auth/sout/callback'
};