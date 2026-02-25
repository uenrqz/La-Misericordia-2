# Sistema La Misericordia 2

## Instrucciones para inicio rápido

Hemos creado un script simplificado para iniciar todo el sistema con un solo comando. Este script inicia automáticamente:

1. Base de datos PostgreSQL
2. Servidor backend (API)
3. BFF (Backend for Frontend)
4. Aplicación frontend (React)

### Usuarios administradores disponibles

El sistema incluye tres usuarios administradores predefinidos:

| Usuario | Contraseña | Descripción |
|---------|-----------|-------------|
| admin   | Admin2025! | Administrador principal del sistema |
| u.enrqz | Admin2025! | Usuario administrador (Ulises Enriquez) |
| Ulises  | Telephono.98 | Usuario administrador para pruebas |

### Cómo iniciar el sistema

1. Abre una terminal en el directorio raíz del proyecto
2. Ejecuta el siguiente comando:

```bash
./iniciar_sistema_simple.sh
```

3. El script verificará e iniciará todos los componentes del sistema
4. Una vez completado, podrás acceder a la aplicación en: http://localhost:5174
5. Inicia sesión con cualquiera de los usuarios administradores mencionados arriba

### Cómo detener el sistema

Para detener todos los componentes del sistema:

```bash
./detener_sistema.sh
```

### Logs del sistema

Los logs de cada componente se guardan en la carpeta `logs`:

- Backend: `logs/backend.log`
- BFF: `logs/bff.log`
- Frontend: `logs/frontend.log`

### Resolución de problemas

Si encuentras algún problema al iniciar el sistema:

1. Verifica que PostgreSQL esté instalado y funcionando
2. Asegúrate de que los puertos 3000, 4000 y 5174 estén disponibles
3. Revisa los archivos de log en la carpeta `logs` para identificar errores específicos
4. Intenta detener el sistema con `./detener_sistema.sh` e iniciarlo nuevamente

En caso de problemas persistentes, contacta al administrador del sistema.
