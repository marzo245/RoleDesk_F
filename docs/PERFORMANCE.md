# Optimizaciones de Performance - RoleDesk

## ⚡ Rendering Performance - GPU Optimization

### **PixiJS WebGL Pipeline**
**Target:** Mantener 60 FPS constantes con mapas de 1000+ tiles

**Optimizaciones implementadas:**
- **Sprite Batching**: Tiles con mismo texture se agrupan en single draw call
- **Viewport Culling**: Solo renderizar tiles visibles + margen de 100px
- **Texture Atlasing**: Múltiples sprites en single texture para reducir GPU texture switches
- **Object Pooling**: Reutilización de sprites para evitar GC pressure

**Benchmark típico (map 50x50 = 2500 tiles):**
- **Sin optimizaciones**: 15-25 FPS, 2500 draw calls
- **Con optimizaciones**: 55-60 FPS, 50-80 draw calls

### **Memory Management Estratégico**
```typescript
// Object pooling para evitar instantiation overhead
const spritePool: Map<string, PIXI.Sprite[]> = new Map();

// Cleanup automático al cambiar de viewport
viewport.on('moved', () => {
  cullAndPoolOffscreenSprites();
});
```

---

## 🎥 Video Performance - Adaptive Quality

### **Multi-Resolution Encoding**
Cada stream se codifica simultáneamente en:
- **High**: 1080p 30fps @ 2.5Mbps (conexiones >5Mbps)
- **Low**: 360p 15fps @ 500Kbps (conexiones <2Mbps)

**Algoritmo de switching automático:**
1. Agora mide RTT, packet loss, bandwidth cada 2s
2. Si calidad baja por >5s → switch automático a Low
3. Si calidad mejora por >10s → intenta upgrade a High

### **CPU Load Balancing**
```typescript
// Priorización dinámica de tracks por uso de CPU
const cpuThresholds = {
  high: 80,    // Pause non-essential video tracks
  critical: 90 // Emergency: disable local video preview
};
```

### **Bandwidth Optimization**
- **Screen Share**: VP8 optimizado para texto (sharp mode)
- **Camera**: VP8 optimizado para faces (smooth mode)  
- **Audio**: Opus 32kbps con noise suppression
- **Simulcast**: Múltiples resoluciones simultáneas sin CPU overhead adicional

---

## 🔄 State Management - Efficient Updates

### **Granular State Updates**
En lugar de sync completo, updates incrementales:
```typescript
// ❌ Malo: Re-render todo el estado
setUsers(allUsers);

// ✅ Bueno: Update solo lo que cambió  
setUsers(prev => ({
  ...prev,
  [userId]: { ...prev[userId], position: newPos }
}));
```

### **Debounced Critical Operations**
```typescript
// Map auto-save: máximo cada 30s, mínimo cada cambio significativo
const debouncedSave = useMemo(
  () => debounce(saveMapToSupabase, 30000, {
    leading: false,
    trailing: true,
    maxWait: 60000  // Force save máximo cada 60s
  }), []
);
```

### **Virtual Scrolling para Large Lists**
- Solo render elementos visibles + buffer de 10 items arriba/abajo
- Aplicado en: lista de usuarios (100+), asset browser (500+ items)

---

## 🌐 Network Performance - Connection Optimization

### **WebSocket Connection Pooling**
```typescript
// Reutilizar conexiones existentes para múltiples salas
const globalSocketPool = new Map<string, Socket>();

// Heartbeat cada 25s para mantener conexión alive
setInterval(() => socket.emit('ping'), 25000);
```

### **Agora Edge Optimization**
- **Server Selection**: Auto-connect al edge server más cercano
- **Fallback Cascade**: Si edge falla → regional → global
- **Connection Monitoring**: Auto-switch si latencia >500ms por >10s

### **Asset Loading Strategy**
```typescript
// Preload crítico: <2s en load inicial
const criticalAssets = [
  'spritesheet/characters.json',
  'sprites/spawn-tile.png', 
  'fonts/nunito.ttf'
];

// Lazy load secundario: en background después
const secondaryAssets = [
  'sprites/special-tiles/*',
  'effects/particles/*'
];
```

---

## 📱 Mobile Performance - Cross-Device Optimization

### **Responsive Video Quality**
```typescript
const getOptimalVideoConfig = (deviceType: DeviceType) => {
  if (deviceType === 'mobile') {
    return { width: 640, height: 480, frameRate: 20 };
  }
  return { width: 1280, height: 720, frameRate: 30 };
};
```

### **Touch Input Optimization**
- **Touch Debouncing**: Prevenir double-tap accidental en mobile
- **Gesture Recognition**: Pinch-to-zoom optimizado para mapas grandes  
- **Haptic Feedback**: Confirmación táctil en acciones críticas

### **Battery Life Considerations**
- **Background Tab**: Auto-pause video rendering cuando tab inactivo
- **Low Power Mode**: Reducir frame rate y resolución automáticamente
- **Wake Lock**: Prevenir screen sleep durante videollamadas

---

## 💾 Database Performance - Supabase Optimization

### **Query Optimization**
```sql
-- ✅ Optimizado: Single query con JOIN
SELECT r.*, array_agg(u.user_id) as participants
FROM realms r 
LEFT JOIN realm_participants rp ON r.id = rp.realm_id
LEFT JOIN users u ON rp.user_id = u.id  
WHERE r.owner_id = $1;

-- ❌ Evitado: N+1 queries
-- SELECT * FROM realms WHERE owner_id = $1;
-- Para cada realm: SELECT * FROM participants...
```

### **Connection Pooling**
- **Max Connections**: 20 concurrent (Supabase free tier limit)
- **Idle Timeout**: 30s para liberar conexiones unused
- **Query Timeout**: 15s para prevenir hanging queries

### **Caching Strategy**
```typescript
// Redis-style caching en cliente para datos frecuentes
const cache = new Map<string, { data: any, ttl: number }>();

// Cache realm metadata por 5 minutos
// Cache user profiles por 30 minutos  
// Cache map data por 2 minutos (porque cambia frecuentemente)
```

---

## 🎯 Performance Monitoring

### **Real-time Metrics**
```typescript
const performanceMetrics = {
  renderFPS: 0,        // Target: >55 FPS
  networkLatency: 0,   // Target: <200ms
  memoryUsage: 0,      // Target: <500MB
  cpuUsage: 0,         // Target: <60%
  activeConnections: 0 // Monitor: websocket + webrtc
};
```

### **Automatic Degradation**
Si performance < thresholds por >10s:
1. **Nivel 1**: Reducir video quality (1080p → 720p)
2. **Nivel 2**: Pause non-essential animations  
3. **Nivel 3**: Disable video effects y particles
4. **Nivel 4**: Emergency mode: audio-only

---

[← Volver al README principal](../README.md)
