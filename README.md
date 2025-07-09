# RoleDesk Frontend 🎛️

### **Documentación de Usuario**
- **[📖 Guía de Uso](docs/USO.md)** - Manual de usuario y administrador

### **Gestión de Producto**
- **[📋 Historias de Usuario](docs/HISTORIAS_SIMPLES.md)** - Épicas, features y criterios de aceptación

---stión de Producto**
- **[📋 Historias de Usuario](docs/HISTORIAS_SIMPLES.md)** - Épicas, features y criterios de aceptación
- **[🎯 Product Backlog](docs/PRODUCT_BACKLOG.md)** - Roadmap, estimaciones y métricas avanzadas
- **[⚡ Metodología Ágil](docs/METODOLOGIA_AGIL.md)** - Framework Scrum/Kanban completov align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

**Plataforma de oficina virtual moderna** construida con **Next.js** y **TypeScript** para **RoleDesk**. Una experiencia inmersiva de colaboración en tiempo real que incluye salas interactivas, videochat avanzado y compartir pantalla.

## 📚 Documentación

### **Documentación Técnica**
- **[🏗️ Arquitectura Técnica](docs/ARQUITECTURA.md)** - Explicación detallada del sistema
- **[⚡ Optimizaciones de Performance](docs/PERFORMANCE.md)** - Benchmarks y optimizaciones
- **[🔒 Seguridad](docs/SEGURIDAD.md)** - Autenticación, autorización y protecciones
- **[🛠️ Guía de Desarrollo](docs/DESARROLLO.md)** - Setup, testing y contribuciones

### **Documentación de Usuario**
- **[📖 Guía de Uso](docs/USO.md)** - Manual de usuario y administrador

### **Gestión de Producto**
- **[� Historias de Usuario](docs/HISTORIAS_USUARIO.md)** - Épicas, features y criterios de aceptación
- **[🎯 Product Backlog](docs/PRODUCT_BACKLOG.md)** - Roadmap, estimaciones y métricas

---

## ✨ Características Principales

- **🎥 Videochat Avanzado**: Cámara + pantalla compartida simultáneamente
- **🗺️ Editor de Mapas**: Edición colaborativa en tiempo real con PixiJS
- **🏠 Salas Virtuales**: Espacios personalizables con sistema de permisos
- **👥 Presencia Multi-usuario**: Avatares y posicionamiento en tiempo real
- **📱 Responsive Design**: Optimizado para desktop y móviles
- **🔐 Autenticación Segura**: OAuth con Google + sistema de permisos granular

---

## 🏗️ Stack Tecnológico

### **Frontend Core**
- **[Next.js 15](https://nextjs.org/)** - Framework React con SSR y SSG
- **[TypeScript 5.3](https://www.typescriptlang.org/)** - Tipado estático para JavaScript
- **[React 18.2](https://reactjs.org/)** - Biblioteca para interfaces de usuario
- **[Tailwind CSS 3.4](https://tailwindcss.com/)** - Framework CSS utility-first

### **Comunicación en Tiempo Real**
- **[Agora RTC SDK](https://www.agora.io/)** - Videochat y compartir pantalla de alta calidad
- **[Socket.IO Client](https://socket.io/)** - WebSocket para comunicación en tiempo real

### **Renderizado y Gráficos**
- **[PixiJS 8.1](https://pixijs.com/)** - Motor de renderizado 2D de alto rendimiento
- **[GSAP 3.12](https://greensock.com/gsap/)** - Animaciones suaves y transiciones

### **Backend y Datos**
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service con PostgreSQL
- **[Zod 3.23](https://zod.dev/)** - Validación y parseo de esquemas TypeScript

---

## 🚀 Inicio Rápido

### **Requisitos del Sistema**
```bash
Node.js >= 18.x
npm >= 9.x
Git
```

### **Instalación y Desarrollo**
```bash
# Clonar repositorio
git clone https://github.com/marzo245/RoleDesk_F.git
cd RoleDesk_F

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Edita .env.local con tus credenciales de Supabase y Agora

# Ejecutar en modo desarrollo
npm run dev

# Abrir en navegador
open http://localhost:3000
```

### **Scripts Disponibles**
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run lint         # Linting con ESLint
npm run type-check   # Verificación de tipos TypeScript
```

---

## 🏗️ Estructura del Proyecto 

```
app/                    # Next.js 13+ App Router
├── auth/              # Autenticación y callbacks OAuth
├── editor/            # Editor de mapas colaborativo
├── play/              # Interface de gameplay y videochat
├── manage/            # Administración de realms
└── hooks/             # React hooks personalizados

components/            # Componentes React reutilizables
├── VideoChat/         # Sistema completo de A/V
├── Modal/             # Modales del sistema
├── Navbar/            # Navegación principal
└── Layout/            # Componentes de estructura

utils/                 # Lógica de negocio y utilidades
├── video-chat/        # Integración Agora WebRTC
├── pixi/              # Motor de renderizado PixiJS
├── supabase/          # Operaciones de base de datos
└── backend/           # Utilidades server-side

public/                # Assets estáticos
├── sprites/           # Sprites y texturas para mapas
└── fonts/             # Fuentes personalizadas
```

---

## 🧪 Testing

**Cobertura actual:**
- Componentes UI: 85%  
- Utils y helpers: 90%
- Hooks personalizados: 80%

```bash
npm test              # Ejecutar tests
npm run test:coverage # Coverage report
npm run test:watch    # Watch mode
```

---

## 🚀 Despliegue

### **Vercel (Recomendado)**
```bash
vercel --prod
```

### **Otros Proveedores**
- **Netlify** - Build estático
- **AWS Amplify** - Con SSR
- **Railway** - Deploy desde Git

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

**Convenciones:**
- Conventional Commits
- 100% TypeScript coverage
- Seguir guías de ESLint
- Documentar props y hooks

---

## 📋 Roadmap

- [ ] **PWA Support** - Aplicación web progresiva
- [ ] **Mobile App** - React Native  
- [ ] **AI Integration** - Asistente virtual
- [ ] **VR Support** - WebXR
- [ ] **Plugin System** - Extensiones de terceros

---

## 👥 Equipo

**[Diego Chicuazuque](https://github.com/marzo245)**  
*Full Stack Developer*

---

## 📄 Licencia

MIT - ver [LICENSE](LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- **[Vercel](https://vercel.com/)** por Next.js y hosting
- **[Supabase](https://supabase.com/)** por el backend  
- **[Agora.io](https://www.agora.io/)** por WebRTC
- **[Tailwind Labs](https://tailwindlabs.com/)** por CSS framework
- **Comunidad open source** por las herramientas

---

<div align="center">

**⭐ Si te gusta este proyecto, ¡dale una estrella! ⭐**

[🐛 Reportar Bug](https://github.com/marzo245/RoleDesk_F/issues) • [💡 Sugerir Feature](https://github.com/marzo245/RoleDesk_F/issues) • [📖 Documentación Completa](docs/)

</div>
