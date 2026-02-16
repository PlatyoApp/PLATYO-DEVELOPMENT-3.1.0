# Configuración de Recuperación de Contraseña en Supabase

## Problema Actual
El flujo de recuperación de contraseña falla con error 403 porque Supabase no está enviando el token de autenticación en el enlace de recuperación.

## Solución: Configurar URLs Permitidas

### Paso 1: Acceder a la Configuración de URLs
1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/eyynbezhtalnylmkeyef
2. Navega a **Authentication > URL Configuration**
3. O ve directamente a: https://supabase.com/dashboard/project/eyynbezhtalnylmkeyef/auth/url-configuration

### Paso 2: Configurar Site URL
En el campo **"Site URL"**, ingresa:
```
https://platyoapp-platyo-dev-6h2h.bolt.host
```

### Paso 3: Configurar Redirect URLs
En la sección **"Redirect URLs"**, agrega las siguientes URLs (una por línea):
```
https://platyoapp-platyo-dev-6h2h.bolt.host/reset-password
https://platyoapp-platyo-dev-6h2h.bolt.host/login
http://localhost:5173/reset-password
http://localhost:5173/login
```

### Paso 4: Guardar Cambios
1. Haz clic en el botón **"Save"**
2. Espera a que Supabase confirme que los cambios se guardaron

## Cómo Funciona el Flujo

### 1. Usuario Solicita Recuperación
- El usuario ingresa su email en el modal "Olvidé mi contraseña"
- La aplicación llama a `supabase.auth.resetPasswordForEmail(email, { redirectTo: '...' })`

### 2. Supabase Envía Email
- Supabase envía un email con un enlace como:
  ```
  https://platyoapp-platyo-dev-6h2h.bolt.host/reset-password#access_token=xxx&refresh_token=yyy&type=recovery
  ```

### 3. Usuario Hace Click en el Enlace
- El navegador abre la página `/reset-password`
- La aplicación extrae los tokens del hash de la URL
- Se establece una sesión temporal usando `supabase.auth.setSession()`

### 4. Usuario Cambia su Contraseña
- Con la sesión temporal, el usuario puede llamar a `supabase.auth.updateUser()`
- La contraseña se actualiza exitosamente
- El usuario es redirigido al login

## Verificar que Funciona

1. Solicita recuperación de contraseña con un email válido
2. Revisa tu bandeja de entrada
3. Abre las herramientas de desarrollador (F12)
4. Ve a la pestaña "Console"
5. Haz click en el enlace del email
6. Deberías ver logs como:
   ```
   Current URL: https://platyoapp-platyo-dev-6h2h.bolt.host/reset-password#access_token=...
   URL params: { hasAccessToken: true, hasRefreshToken: true, type: 'recovery' }
   Session set successfully: {...}
   ```

## Si Sigue Sin Funcionar

### Verificar Variables de Entorno
Asegúrate de que el archivo `.env` tenga las variables correctas:
```
VITE_SUPABASE_URL=https://eyynbezhtalnylmkeyef.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_key
```

### Verificar Configuración de Email
1. Ve a **Authentication > Email Templates**
2. Selecciona "Reset Password"
3. Verifica que el template incluya el token: `{{ .ConfirmationURL }}`

### Limpiar Cache
1. En tu navegador, presiona `Ctrl + Shift + Delete` (o `Cmd + Shift + Delete` en Mac)
2. Limpia las cookies y el caché
3. Intenta nuevamente

## Contacto de Soporte
Si después de seguir todos estos pasos el problema persiste, contacta al soporte de Supabase con:
- ID del proyecto: eyynbezhtalnylmkeyef
- Error específico: "Auth session missing when trying to reset password"
- URLs configuradas
