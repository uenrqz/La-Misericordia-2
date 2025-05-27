# Sistema LA MISERICORDIA 2 - Manual de Usuario

## Mejoras Implementadas para la Estabilidad del Sistema

Este manual describe las nuevas funcionalidades implementadas para mejorar la estabilidad del sistema LA MISERICORDIA 2, concentrándose en la resolución de los errores 401 (problemas de autenticación) y 500 (errores del servidor).

### Índice
1. [Introducción](#introducción)
2. [Sistema de Notificaciones](#sistema-de-notificaciones)
3. [Herramienta de Diagnóstico del Sistema](#herramienta-de-diagnóstico-del-sistema)
4. [Manejo de Errores de Autenticación](#manejo-de-errores-de-autenticación)
5. [Recuperación de Errores del Servidor](#recuperación-de-errores-del-servidor)
6. [Preguntas Frecuentes](#preguntas-frecuentes)

## Introducción

El sistema LA MISERICORDIA 2 ahora cuenta con mejoras significativas para:
- Detectar y manejar errores de forma automática
- Informar claramente al usuario sobre problemas del sistema
- Ofrecer opciones de recuperación cuando sea posible
- Proporcionar herramientas de diagnóstico para el personal técnico

## Sistema de Notificaciones

El nuevo sistema muestra distintos tipos de notificaciones según la situación:

### Notificación de Error del Servidor (500)
Cuando se produce un error interno, el sistema:
- Muestra una notificación en la parte superior de la pantalla
- Ofrece un botón para reintentar la operación
- Intenta diagnosticar y resolver el problema automáticamente

![Error 500](https://ejemplo.com/error500.png)

### Notificación de Desconexión
Si se pierde la conexión con el servidor:
- Se muestra una alerta de desconexión
- Se ofrecen opciones para reconectar
- El sistema intenta restablecer la conexión automáticamente

![Desconexión](https://ejemplo.com/desconexion.png)

### Notificación de Sesión Expirada
Cuando el token de autenticación expira:
- Se muestra un aviso amigable
- Se ofrece un botón para volver a iniciar sesión
- Se evitan mensajes técnicos confusos

![Sesión Expirada](https://ejemplo.com/sesion-expirada.png)

## Herramienta de Diagnóstico del Sistema

Se ha implementado una nueva página de diagnóstico del sistema para el personal técnico y administradores:

### Cómo acceder
1. Iniciar sesión como administrador
2. Navegar al menú lateral
3. Seleccionar "Diagnóstico del Sistema"

### Funcionalidades disponibles
- **Estado actual del sistema**: Visualización del estado de los componentes (frontend, BFF, backend)
- **Pruebas de manejo de errores**: Herramientas para simular diferentes tipos de errores
- **Diagnóstico detallado**: Información técnica sobre el estado de cada componente

### Ejemplo de uso
Para simular un error 500 y comprobar el funcionamiento:
1. Ir a la página de diagnóstico
2. Hacer clic en "Simular Error 500"
3. Navegar a cualquier página de la aplicación
4. Observar cómo se muestra la notificación y las opciones de recuperación

## Manejo de Errores de Autenticación

El sistema ahora maneja los errores de autenticación de forma más robusta:

- **Detección automática**: Se identifica cuando un token ha expirado o es inválido
- **Redirección inteligente**: El usuario es llevado a la pantalla de login automáticamente
- **Conservación del contexto**: Se mantiene la información sobre la página que estaba visitando
- **Mensajes claros**: Explicación comprensible del problema de autenticación

### ¿Qué hace el sistema cuando detecta un error 401?
1. Identifica que el token es inválido o ha expirado
2. Limpia los datos de sesión locales
3. Muestra una notificación explicando la situación
4. Redirige al usuario a la pantalla de login
5. Después del login exitoso, lleva al usuario a la página que estaba visitando

## Recuperación de Errores del Servidor

El sistema implementa las siguientes estrategias para recuperarse de errores 500:

- **Reintentos automáticos**: Las peticiones fallidas se reintentan automáticamente
- **Diagnóstico proactivo**: Se analiza el origen del error y posibles soluciones
- **Verificación de conectividad**: Se comprueba el estado de los diferentes componentes
- **Límite de reintentos**: Para evitar sobrecargar el servidor, se limitan los reintentos

### ¿Cómo funciona el proceso de recuperación?
1. Se detecta un error 500 en una petición
2. Se realiza un diagnóstico para determinar la causa probable
3. Se intenta recuperar la conexión con el servidor
4. Si es posible, se reintenta la operación automáticamente
5. Si persiste el error, se ofrece al usuario opciones para resolver el problema

## Preguntas Frecuentes

### ¿Qué debo hacer si veo un mensaje de "Error del servidor"?
Esperar un momento y hacer clic en "Reintentar". El sistema intentará recuperarse automáticamente. Si el error persiste, contactar al soporte técnico.

### ¿Por qué me devuelve a la pantalla de login?
Esto ocurre cuando tu sesión ha expirado por seguridad. Simplemente inicia sesión nuevamente para continuar.

### ¿Cómo sé si hay problemas de conexión?
El sistema muestra un indicador de estado en la parte superior de la pantalla cuando detecta problemas de conexión.

### ¿Los datos se pierden cuando ocurre un error?
No. El sistema está diseñado para preservar los datos y el estado de la aplicación incluso durante errores.

---

Para más información o soporte técnico, contacta al administrador del sistema o revisa el informe técnico completo en el archivo `INFORME_MEJORAS.md`.
