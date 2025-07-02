/**
 * Función robusta para copiar texto al portapapeles
 * Funciona tanto en contextos seguros (HTTPS) como inseguros (HTTP)
 * @param text - El texto a copiar
 * @returns Promise<boolean> - true si se copió exitosamente, false en caso contrario
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Método 1: Intentar usar la API moderna del portapapeles (requiere HTTPS)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Método 2: Fallback usando el método clásico (funciona en HTTP)
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Hacer que el elemento sea invisible pero seleccionable
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.setAttribute('readonly', '');
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    // Intentar copiar usando el comando execCommand
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Error al copiar al portapapeles:', error);
    return false;
  }
}

/**
 * Función de conveniencia para copiar y mostrar notificación
 * @param text - El texto a copiar
 * @param successMessage - Mensaje a mostrar en caso de éxito
 * @param errorMessage - Mensaje a mostrar en caso de error
 * @param toast - Función toast para mostrar notificaciones
 */
export async function copyWithNotification(
  text: string, 
  successMessage: string = 'Copiado al portapapeles!',
  errorMessage: string = 'Error al copiar. Intenta copiar manualmente.',
  toast?: { success: (msg: string) => void; error: (msg: string) => void }
) {
  const success = await copyToClipboard(text);
  
  if (toast) {
    if (success) {
      toast.success(successMessage);
    } else {
      toast.error(errorMessage);
    }
  }
  
  return success;
}
