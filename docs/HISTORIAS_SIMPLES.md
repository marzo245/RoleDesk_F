# Historias de Usuario - RoleDesk

## 📋 Roles de Usuario

- **👤 Usuario** - Persona que participa en salas virtuales
- **👑 Owner** - Dueño/creador de un realm (único con permisos de edición)
- **👁️ Visitante** - Usuario sin autenticar

---

## 🏗️ ÉPICA 1: Autenticación y Gestión de Usuarios

### **Feature 1.1: Autenticación**

#### **US-001: Registro con Google**
**Como** visitante  
**Quiero** registrarme usando mi cuenta de Google  
**Para** acceder rápidamente sin crear credenciales nuevas

**Criterios de Aceptación:**
- Botón "Iniciar sesión con Google" visible
- Creación automática de perfil con datos de Google
- Redirección a dashboard después del registro

#### **US-002: Mantener Sesión**
**Como** usuario autenticado  
**Quiero** que mi sesión se mantenga activa  
**Para** no autenticarme constantemente

**Criterios de Aceptación:**
- Sesión persiste por defecto
- Refresh automático de tokens
- Logout limpia la sesión completamente

---

## 🎥 ÉPICA 2: Sistema de Videochat

### **Feature 2.1: Audio y Video Básico**

#### **US-004: Controlar Mi Audio/Video**
**Como** usuario en una sala  
**Quiero** activar/desactivar mi cámara y micrófono  
**Para** controlar mi presencia audiovisual

**Criterios de Aceptación:**
- Botones toggle claros para cámara y micrófono
- Indicadores visuales del estado
- Manejo de errores de permisos

#### **US-005: Ver Otros Usuarios**
**Como** usuario en una sala  
**Quiero** ver las cámaras de otros participantes  
**Para** tener comunicación visual

**Criterios de Aceptación:**
- Grid de videos dinámico
- Nombres de usuario visibles
- Indicadores de estado por usuario

### **Feature 2.2: Compartir Pantalla**

#### **US-006: Compartir Mi Pantalla**
**Como** usuario en una sala  
**Quiero** compartir mi pantalla  
**Para** mostrar contenido a otros

**Criterios de Aceptación:**
- Botón "Compartir Pantalla" accesible
- Selector de pantalla/ventana
- Transmisión simultánea con cámara

#### **US-007: Ver Pantalla Compartida**
**Como** usuario en una sala  
**Quiero** ver la pantalla compartida en un modal  
**Para** ver mejor el contenido

**Criterios de Aceptación:**
- Modal automático al iniciar screen share
- Layout dual: cámara + pantalla
- Botón de pantalla completa

---

## 🗺️ ÉPICA 3: Editor de Mapas

### **Feature 3.1: Visualización del Mapa**

#### **US-008: Ver Mapa 2D**
**Como** usuario en una sala  
**Quiero** ver el mapa del espacio virtual  
**Para** navegar en el entorno

**Criterios de Aceptación:**
- Renderizado suave del mapa
- Zoom y pan con mouse/touch
- Indicadores de mi posición y otros usuarios

#### **US-009: Mover Mi Avatar**
**Como** usuario en una sala  
**Quiero** mover mi avatar haciendo clic  
**Para** navegar por el espacio

**Criterios de Aceptación:**
- Click mueve el avatar
- Animación suave de movimiento
- Pathfinding evita obstáculos

### **Feature 3.2: Edición de Mapas**

#### **US-010: Editar Mapa**
**Como** owner  
**Quiero** editar el mapa con herramientas  
**Para** personalizar mi espacio

**Criterios de Aceptación:**
- Herramientas: Floor, Wall, Spawn, Teleport, Private, Erase
- Click/drag para colocar tiles
- Auto-save cada 30 segundos

#### **US-011: Edición Colaborativa**
**Como** owner con otros editores  
**Quiero** ver cambios en tiempo real  
**Para** colaborar en el diseño

**Criterios de Aceptación:**
- Cambios visibles instantáneamente
- Indicador de quién hace cambios
- Sincronización automática

---

## 🏠 ÉPICA 4: Gestión de Realms

### **Feature 4.1: Creación de Realms**

#### **US-012: Crear Realm**
**Como** usuario autenticado  
**Quiero** crear mi propio realm  
**Para** tener un espacio para mi equipo

**Criterios de Aceptación:**
- Modal de creación con nombre
- Mapa inicial 25x25 automático
- Configuración básica de privacidad

#### **US-013: Configurar Realm**
**Como** owner  
**Quiero** configurar propiedades del realm  
**Para** personalizar la experiencia

**Criterios de Aceptación:**
- Cambiar nombre del realm
- Generar nuevos links de invitación
- Configuración de acceso público/privado

### **Feature 4.2: Gestión de Usuarios**

#### **US-014: Invitar Usuarios**
**Como** owner  
**Quiero** invitar usuarios al realm  
**Para** construir mi comunidad

**Criterios de Aceptación:**
- Links de invitación con shareId
- Copiar link al portapapeles
- Regenerar links por seguridad

---

## 📱 ÉPICA 5: Experiencia Mobile

### **Feature 5.1: Adaptación Mobile**

#### **US-016: Interface Mobile**
**Como** usuario en móvil  
**Quiero** interface adaptada a pantalla pequeña  
**Para** usar la plataforma cómodamente

**Criterios de Aceptación:**
- Layout responsive
- Controles táctiles optimizados
- Navegación por gestos

#### **US-017: Videochat Mobile**
**Como** usuario móvil  
**Quiero** participar en videollamadas  
**Para** no estar limitado a desktop

---

## 📱 ÉPICA 5: Experiencia Mobile

### **Feature 5.1: Adaptación Mobile**

#### **US-016: Interface Mobile**
**Como** usuario de móvil  
**Quiero** usar la plataforma en mi teléfono  
**Para** participar desde cualquier lugar

**Criterios de Aceptación:**
- Layout responsive en pantallas pequeñas
- Controles touch optimizados
- Navegación adaptada a mobile

#### **US-017: Controles Touch**
**Como** usuario de móvil  
**Quiero** controles touch optimizados  
**Para** navegar fácilmente

**Criterios de Aceptación:**
- Tap para mover avatar
- Pinch to zoom en el mapa
- Botones de video/audio accesibles

#### **US-018: Cámara Mobile**
**Como** usuario de móvil  
**Quiero** usar la cámara de mi teléfono  
**Para** participar en videollamadas

**Criterios de Aceptación:**
- Cambio entre cámara frontal/trasera
- Resolución adaptada (720p máx)
- Manejo de llamadas entrantes

---

## 🔒 ÉPICA 6: Seguridad

### **Feature 6.1: Protección de Datos**

#### **US-019: Datos Seguros**
**Como** usuario  
**Quiero** que mis datos estén protegidos  
**Para** tener confianza en la privacidad

**Criterios de Aceptación:**
- Encriptación HTTPS en tránsito
- No almacenamiento de streams de video
- Autenticación con Google OAuth

---

## 📊 Priorización

### **MVP (Mínimo Producto Viable)**
1. US-001, US-002 (Autenticación)
2. US-008, US-009 (Mapa básico)
3. US-004, US-005 (Video básico)
4. US-012, US-014 (Crear realms e invitar)

### **Diferenciadores Clave**
1. US-006, US-007 (Compartir pantalla)
2. US-010, US-011 (Editor colaborativo)
3. US-016, US-017, US-018 (Mobile)

### **Mejoras y Escalabilidad**
1. US-013 (Configuración de realms)
2. US-015 (Herramientas de moderación - futuro)
3. US-019 (Seguridad avanzada)

---

## 🏃‍♂️ Estimación de Desarrollo

### **Sprints de 2 semanas**

**Sprint 1-2: Base**
- US-001, US-002, US-008 (Auth + Mapa)

**Sprint 3-4: Videochat**
- US-004, US-005, US-009 (Audio/Video + Movimiento)

**Sprint 5-6: Realms**
- US-012, US-014, US-010 (Crear realms + Editor básico)

**Sprint 7-8: Screen Share**
- US-006, US-007, US-011 (Pantalla + Colaboración)

**Sprint 9-10: Mobile + Polish**
- US-016, US-017, US-018, US-013, US-019 (Mobile + Configuración + Seguridad)
