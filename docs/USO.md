# Guía de Uso - RoleDesk

## 🚀 Inicio Rápido

### **Para Usuarios Nuevos**

1. **Crear Cuenta**
   - Visita la plataforma y haz clic en "Iniciar Sesión"
   - Autentícate con tu cuenta de Google
   - Tu perfil se creará automáticamente

2. **Unirse a un Realm**
   - El dueño del realm te enviará un enlace de invitación
   - Haz clic en el enlace → "Unirse al Realm"
   - Espera 5-10 segundos mientras se establecen las conexiones

3. **Configurar Audio/Video**
   - Permite acceso a micrófono y cámara cuando el navegador lo solicite
   - Usa los botones en la barra inferior para activar/desactivar
   - Presiona el botón de pantalla compartida para compartir tu escritorio

---

## 🎮 Navegación en el Mapa

### **Controles Básicos**
- **Mover Avatar**: Haz clic en cualquier parte del mapa
- **Zoom**: Rueda del mouse o pinch en móviles
- **Pan**: Arrastra con botón derecho o two-finger drag
- **Centrar**: Doble clic para centrar en tu avatar

### **Indicadores Visuales**
- **🟢 Punto Verde**: Tu posición actual
- **🔵 Puntos Azules**: Otros usuarios conectados
- **📹 Ícono Cámara**: Usuario con video activo
- **🎤 Ícono Micro**: Usuario con audio activo
- **🖥️ Ícono Pantalla**: Usuario compartiendo pantalla

### **Spawn Points y Teleports**
- **Spawn Point (Verde)**: Donde apareces al unirte
- **Teleport (Púrpura)**: Haz clic para viajar instantáneamente a otra ubicación
- **Tiles Privados (Rojos)**: Solo usuarios autorizados pueden acceder

---

## 🎥 Sistema de Video

### **Audio y Cámara**
```
🎤 Micrófono: Push-to-talk o siempre activo
📹 Cámara: 720p por defecto, se adapta a tu conexión
🔇 Mute: Silencia tu micrófono (otros no te escuchan)
📵 Pause Video: Pausa tu cámara (otros no te ven)
```

### **Pantalla Compartida**
1. **Activar**: Presiona el botón 🖥️ "Compartir Pantalla"
2. **Seleccionar**: Elige ventana específica o pantalla completa
3. **Transmitir**: Tu pantalla se ve en 1080p para otros usuarios
4. **Dual Stream**: Puedes tener cámara Y pantalla activas simultáneamente

### **Ver Pantalla Compartida de Otros**
- **Modal Automático**: Se abre cuando alguien comparte pantalla
- **Layout Dual**: Cámara (izquierda) + Pantalla (derecha) si ambos están activos
- **Pantalla Completa**: Haz clic en el botón para ver en fullscreen
- **Cerrar**: Presiona ESC o el botón X

---

## ⚙️ Configuración de Usuario

### **Perfil**
- **Nombre**: Se toma automáticamente de tu cuenta Google
- **Avatar**: Tu foto de perfil de Google se usa como avatar
- **Configuración**: Accede desde el dropdown en la esquina superior derecha

### **Configuración de A/V**
```
Calidad de Video:
- Alta (1080p): Para conexiones >5 Mbps
- Media (720p): Para conexiones 2-5 Mbps  
- Baja (360p): Para conexiones <2 Mbps (automático)

Configuración de Audio:
- Noise Suppression: Activado por defecto
- Echo Cancellation: Activado por defecto
- Auto Gain Control: Activado por defecto
```

---

## 🏗️ Para Administradores de Realm

### **Crear un Nuevo Realm**
1. Ve a tu dashboard principal
2. Clic en "Crear Nuevo Realm"
3. Nombra tu realm (3-50 caracteres)
4. Se creará con un mapa básico 25x25

### **Editor de Mapas**
**Herramientas disponibles:**
- **🏠 Floor**: Tiles caminables normales  
- **🧱 Wall**: Obstáculos que bloquean movimiento
- **🟢 Spawn**: Puntos donde aparecen nuevos usuarios
- **🟣 Teleport**: Portales entre ubicaciones
- **🔒 Private**: Áreas con acceso restringido
- **🗑️ Erase**: Borrar tiles existentes

**Flujo de trabajo:**
1. Selecciona herramienta en la barra lateral
2. Haz clic/arrastra en el mapa para colocar tiles
3. Cambios se guardan automáticamente cada 30 segundos
4. Otros usuarios ven cambios en tiempo real

### **Gestión de Usuarios**
```
Roles disponibles:
- Owner: Control total del realm (solo 1 por realm)
- Usuario: Puede usar A/V, moverse en el mapa y participar
```

**Funcionalidades del Owner:**
- **Editar Mapa**: Usar herramientas de edición en tiempo real
- **Configurar Realm**: Cambiar nombre y opciones de privacidad
- **Gestionar Links**: Crear y regenerar links de invitación
- **Control Total**: Acceso completo a todas las funciones del realm

---

## 📱 Uso en Móviles

### **Controles Touch Optimizados**
- **Un toque**: Mover avatar
- **Pellizcar**: Zoom in/out
- **Dos dedos arrastrando**: Pan del mapa
- **Toque largo**: Menú contextual

### **Interface Adaptativa**
- **Barra de herramientas**: Se colapsa automáticamente en pantallas pequeñas
- **Video Grid**: Layout vertical para mejor uso del espacio
- **Modal de pantalla**: Optimizado para orientación landscape

### **Consideraciones de Performance**
- **Calidad automática**: Se reduce a 480p en móviles
- **Frame rate**: Limitado a 20fps para ahorrar batería
- **Background pause**: Video se pausa cuando app va a segundo plano

---

## 🔧 Solución de Problemas Comunes

### **"No me escuchan / no me ven"**
1. Verifica permisos de micrófono/cámara en el navegador
2. Revisa que no esté activo el mute/pause en la barra de controles
3. Prueba cerrar y reabrir el navegador
4. En Chrome: Settings → Privacy and Security → Site Settings → Camera/Microphone

### **"El video se ve entrecortado"**
1. Cierra otras aplicaciones que usen internet
2. Verifica tu velocidad de conexión (mínimo 2 Mbps recomendado)
3. Prueba desactivar HD y usar calidad automática
4. Si persiste, usa solo audio sin video

### **"La pantalla compartida no funciona"**
1. Asegúrate de estar usando Chrome, Firefox, o Edge (Safari no soportado)
2. Dale permisos de "compartir pantalla" cuando el navegador lo solicite
3. Prueba compartir una ventana específica en lugar de pantalla completa
4. Si falla, recarga la página e intenta de nuevo

### **"El mapa se ve lento o no responde"**
1. El mapa usa GPU acceleration - verifica que esté activada en tu navegador
2. Cierra otras pestañas para liberar memoria
3. En mapas muy grandes (>100x100), prueba hacer zoom para mejor performance
4. Si persiste, reporta el problema con detalles de tu dispositivo

### **"Perdí la conexión"**
1. La reconexión es automática - espera 10-15 segundos
2. Si no reconecta, recarga la página manualmente
3. Verifica tu conexión a internet
4. Tu progreso en el mapa se guarda automáticamente

---

## 📞 Soporte Técnico

### **Navegadores Soportados**
- ✅ **Chrome 90+** (Recomendado)
- ✅ **Firefox 88+** 
- ✅ **Edge 90+**
- ✅ **Safari 14+** (funcionalidad limitada)
- ❌ Internet Explorer (no soportado)

### **Requisitos del Sistema**
- **Internet**: Mínimo 2 Mbps, recomendado 5+ Mbps
- **RAM**: Mínimo 4GB, recomendado 8GB+
- **CPU**: Cualquier procesador de los últimos 5 años
- **GPU**: Hardware acceleration activada (automático en navegadores modernos)

### **Reportar Problemas**
Si encuentras un bug o tienes sugerencias:
1. Anota los pasos exactos para reproducir el problema
2. Incluye información de tu navegador y sistema operativo
3. Si es posible, toma un screenshot del problema
4. Contacta al administrador del realm con estos detalles

---

[← Volver al README principal](../README.md)
