export function translateSupabaseError(error: any): string {
  if (!error) return 'Ha ocurrido un error desconocido';

  const errorMessage = error.message || error.msg || String(error);
  const lowerMessage = errorMessage.toLowerCase();

  const errorMap: Record<string, string> = {
    'new password should be different from the old password':
      'La nueva contraseña debe ser diferente a la contraseña anterior',
    'password is too weak':
      'La contraseña es muy débil. Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números',
    'weak password':
      'La contraseña es muy débil. Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números',
    'password should be at least':
      'La contraseña debe tener al menos 8 caracteres',
    'invalid login credentials':
      'Credenciales de inicio de sesión inválidas',
    'email not confirmed':
      'Correo electrónico no confirmado',
    'user already registered':
      'El usuario ya está registrado',
    'user not found':
      'Usuario no encontrado',
    'invalid email':
      'Correo electrónico inválido',
    'email address is invalid':
      'El correo electrónico es inválido',
    'signup requires a valid password':
      'El registro requiere una contraseña válida',
    'password should contain':
      'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales',
    'session expired':
      'La sesión ha expirado',
    'refresh token not found':
      'Token de sesión no encontrado. Por favor, inicia sesión nuevamente',
    'invalid refresh token':
      'Sesión inválida. Por favor, inicia sesión nuevamente',
    'email rate limit exceeded':
      'Se ha excedido el límite de correos electrónicos. Por favor, intenta más tarde',
    'too many requests':
      'Demasiadas solicitudes. Por favor, intenta más tarde',
    'network request failed':
      'Error de conexión. Por favor, verifica tu internet',
    'failed to fetch':
      'Error de conexión. Por favor, verifica tu internet',
    'password does not match':
      'Las contraseñas no coinciden',
    'passwords do not match':
      'Las contraseñas no coinciden',
    'email already exists':
      'Este correo electrónico ya está registrado',
    'email already registered':
      'Este correo electrónico ya está registrado',
    'for security purposes':
      'Por razones de seguridad, debes iniciar sesión nuevamente',
    'unauthorized':
      'No autorizado. Por favor, inicia sesión',
    'access denied':
      'Acceso denegado',
    'forbidden':
      'No tienes permisos para realizar esta acción',
    'not found':
      'Recurso no encontrado',
    'internal server error':
      'Error del servidor. Por favor, intenta más tarde',
    'service unavailable':
      'Servicio no disponible. Por favor, intenta más tarde',
    'database error':
      'Error de base de datos. Por favor, intenta más tarde',
    'validation error':
      'Error de validación. Verifica los datos ingresados',
  };

  for (const [key, translation] of Object.entries(errorMap)) {
    if (lowerMessage.includes(key)) {
      return translation;
    }
  }

  if (lowerMessage.includes('weak') || lowerMessage.includes('easy to guess')) {
    return 'La contraseña es muy débil o común. Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y no ser una contraseña común';
  }

  if (lowerMessage.includes('password')) {
    return 'Error con la contraseña. Por favor, verifica e intenta nuevamente';
  }

  if (lowerMessage.includes('email') || lowerMessage.includes('correo')) {
    return 'Error con el correo electrónico. Por favor, verifica e intenta nuevamente';
  }

  if (lowerMessage.includes('login') || lowerMessage.includes('sign in')) {
    return 'Error al iniciar sesión. Por favor, verifica tus credenciales';
  }

  if (lowerMessage.includes('register') || lowerMessage.includes('sign up')) {
    return 'Error al registrarse. Por favor, intenta nuevamente';
  }

  return errorMessage.includes('Error')
    ? errorMessage
    : `Error: ${errorMessage}`;
}
