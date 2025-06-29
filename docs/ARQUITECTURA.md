# Arquitectura Técnica - RoleDesk

## ⚙️ Visión General

RoleDesk utiliza una **arquitectura híbrida moderna** que combina múltiples tecnologías especializadas para crear una experiencia de colaboración en tiempo real optimizada.

---

## 🎤 Sistema de Audio/Video - Doble Stream Simultáneo

### **¿Cómo se logra cámara + pantalla compartida al mismo tiempo?**

**Problema técnico:** Agora RTC tradicionalmente permite UN stream de video por usuario. ¿Cómo transmitir cámara Y pantalla simultáneamente?

**Solución implementada:** **Arquitectura de doble cliente**
- **Cliente Principal** (UID: `user_12345`): Transmite cámara + micrófono
- **Cliente Secundario** (UID: `user_12345_screen`): Transmite solo pantalla compartida

**Beneficios técnicos:**
- Canales independientes eliminan conflictos de bandwidth
- Calidad adaptativa per-stream (cámara 720p, pantalla 1080p)
- Fallo independiente (si pantalla falla, cámara sigue funcionando)

### **Dual Stream: Calidad Adaptativa Automática**
Cada stream se envía en DOS calidades simultáneamente:
- **High**: 1080p 30fps (usuarios con buena conexión)
- **Low**: 360p 15fps (usuarios con conexión limitada)

Agora decide automáticamente cuál enviar a cada receptor basado en su bandwidth.

### **Control Granular de Tracks**
- **Micrófono**: Mute/unmute sin desconectar (`.muted = true/false`)
- **Cámara**: Pause/resume para ahorrar CPU (`.enabled = true/false`) 
- **Pantalla**: Start/stop completo (crear/destruir MediaStreamTrack)

---

## 🗺️ Sistema de Mapas - Renderizado 2D de Alto Performance

### **¿Cómo se renderizan mapas grandes sin lag?**

**Motor de renderizado:** PixiJS 8.1 con WebGL
- **GPU Acceleration**: Rendering en tarjeta gráfica, no CPU
- **Sprite Batching**: Múltiples tiles se dibujan en una sola llamada GPU
- **Viewport Culling**: Solo se renderizan elementos visibles en pantalla

**Estructura de datos optimizada:**
- Mapa = Grid 2D con coordenadas hash: `Map<"x,y", TileData>`
- Lookup O(1) para cualquier posición
- Memory footprint mínimo (solo tiles ocupados se almacenan)

### **Editor en Tiempo Real Multi-usuario**
**Desafío:** Múltiples personas editando el mismo mapa sin conflictos.

**Solución:** **Operational Transformation simplificado**
1. Usuario hace cambio → Se aplica localmente (feedback inmediato)
2. Cambio se envía via WebSocket → Se propaga a otros usuarios
3. Auto-save cada 30s → Persistencia en Supabase PostgreSQL
4. Conflictos se resuelven por "último escritor gana" + timestamp

### **Pathfinding A* Optimizado**
- Algoritmo A* con heurística diagonal
- Grid preprocessing: obstáculos se pre-calculan
- Performance target: <5ms para rutas de 50+ tiles
- Fallback: si pathfinding falla, movimiento directo

---

## 🚪 Flujo de Conexión - Arquitectura de Microservicios

### **Desde click "Unirse" hasta estar en la sala (8-12 segundos típicos):**

**Fase 1: Autenticación & Autorización (0.5s)**
- Middleware Next.js intercepta request
- Valida JWT de Supabase Auth
- Verifica permisos de sala en PostgreSQL

**Fase 2: Preparación de Servicios (2-4s)**
- **Token Generation**: Servidor genera token Agora firmado (válido 24h)
- **Map Loading**: Descarga JSON del mapa desde Supabase (típicamente 5-50KB)
- **Asset Preloading**: PixiJS pre-carga sprites necesarios

**Fase 3: Conexión Paralela (3-5s)**
- **Agora RTC**: Conexión UDP a servidores edge más cercanos
- **WebSocket**: Conexión persistente TCP para eventos
- **PixiJS**: Inicialización de canvas WebGL + renderizado inicial

**Fase 4: Sincronización (1-2s)**
- Descarga estado actual: usuarios conectados, posiciones, estados A/V
- Posicionamiento en spawn point libre
- Primera sincronización de presencia

---

## 🎬 Modal de Pantalla Compartida - Sistema de Correlación de Streams

### **Problema técnico complejo:** 
Usuario compartiendo pantalla puede tener cámara activa simultáneamente. ¿Cómo mostrar AMBOS streams correlacionados en un modal?

**Solución - Sistema de Signal Correlation:**
1. **Stream Detection**: Modal recibe stream de pantalla (`user_12345_screen`)
2. **UID Extraction**: Extrae baseUID → `user_12345`
3. **Camera Search**: Sistema de signals busca stream de cámara matching
4. **Dual Layout**: Cámara (izquierda) + Pantalla (derecha) con aspect ratios independientes

**Manejo de Edge Cases:**
- Usuario local vs remoto (diferentes fuentes de datos)
- Cámara se activa/desactiva mientras modal está abierto
- Cleanup de estilos CSS al cerrar (evita videos negros residuales)

---

## 📡 Comunicación en Tiempo Real - Hybrid Architecture

### **¿Por qué dos sistemas de comunicación diferentes?**

**WebSocket (Socket.IO) - Control Plane:**
- Eventos de aplicación: join/leave, movement, map changes
- Garantías: delivery confirmado, reconexión automática
- Latencia típica: 50-100ms
- Ancho de banda: <1KB/s por usuario

**WebRTC (Agora) - Data Plane:**  
- Streams de media: audio, video, screen share
- UDP directo peer-to-peer cuando es posible
- Latencia típica: 100-300ms  
- Ancho de banda: 500KB-2MB/s por stream

### **Sincronización Cross-Protocol:**
Los dos sistemas deben mantenerse sincronizados:
- WebSocket notifica "usuario activó cámara" 
- WebRTC stream aparece 200-500ms después
- UI debe manejar este delay gracefully

---

## 🔄 Persistencia - Eventually Consistent Architecture

### **Estrategias de guardado por tipo de datos:**

**Críticos (Inmediato):**
- Autenticación, permisos, metadatos de sala

**Semi-críticos (Auto-save 30s):**
- Cambios de mapa, configuraciones de usuario

**Ephemeral (Session only):**
- Posiciones de avatares, estados de A/V

**Recuperación ante Fallos:**
- **Graceful degradation**: si WebSocket falla, UI sigue funcionando
- **State reconciliation**: al reconectar, sincronización delta
- **Local persistence**: cambios críticos se guardan en localStorage como backup

---

[← Volver al README principal](../README.md)
