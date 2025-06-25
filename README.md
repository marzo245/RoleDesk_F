# RoleDesk Frontend

Un clon moderno de Gather construido con Next.js, React y PIXI.js que permite espacios virtuales colaborativos con video chat y movimiento en tiempo real.

## 🚀 Características

- **Espacios virtuales interactivos**: Muévete libremente por mapas 2D personalizables
- **Video chat por proximidad**: Activa automáticamente audio y video cuando los usuarios están cerca
- **Movimiento en tiempo real**: Sincronización instantánea del movimiento entre múltiples usuarios
- **Sistema de salas**: Soporte para múltiples salas con teletransporte
- **Editor de mapas**: Herramientas para crear y personalizar espacios virtuales
- **Autenticación**: Sistema de login con Google OAuth
- **Responsive**: Optimizado para diferentes tamaños de pantalla

## �️ Tecnologías

- **Framework**: [Next.js 14](https://nextjs.org/)
- **UI Library**: [React 18](https://reactjs.org/)
- **Renderizado 2D**: [PIXI.js](https://pixijs.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Video Chat**: [Agora.io](https://www.agora.io/)
- **Real-time**: [Socket.IO Client](https://socket.io/)
- **Estado**: React Hooks + Context API
- **Tipos**: [TypeScript](https://www.typescriptlang.org/)
- **Base de datos**: [Supabase](https://supabase.com/) (Cliente)

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase configurada
- Cuenta de Agora.io para video chat
- Backend RoleDesk ejecutándose

## � Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd gather-clone/RoleDesk_F
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
   
   # Agora.io
   NEXT_PUBLIC_AGORA_APP_ID=tu_agora_app_id
   
   # Backend
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
   
   # Google OAuth (opcional)
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_google_client_id
   ```

4. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   # o
   yarn dev
   ```

   La aplicación estará disponible en `http://localhost:3000`

## 🏗️ Estructura del Proyecto

```
RoleDesk_F/
├── app/                    # App Router de Next.js 14
│   ├── auth/              # Páginas de autenticación
│   ├── editor/            # Editor de mapas
│   ├── play/              # Espacios de juego
│   ├── manage/            # Gestión de espacios
│   └── globals.css        # Estilos globales
├── components/            # Componentes reutilizables
│   ├── Layout/           # Componentes de layout
│   ├── Modal/            # Sistema de modales
│   ├── Navbar/           # Navegación
│   └── VideoChat/        # Componentes de video chat
├── utils/                # Utilidades y servicios
│   ├── backend/          # Cliente del backend
│   ├── pixi/             # Lógica de PIXI.js
│   ├── supabase/         # Cliente de Supabase
│   └── video-chat/       # Servicios de video chat
├── public/               # Archivos estáticos
│   ├── sprites/          # Sprites del juego
│   └── fonts/            # Fuentes personalizadas
└── middleware.ts         # Middleware de Next.js
```

## 🎮 Uso

### Crear un Espacio
1. Inicia sesión con tu cuenta de Google
2. Ve a la página principal y haz clic en "Crear Espacio"
3. Personaliza tu espacio con el editor integrado
4. Invita a otros usuarios compartiendo el enlace

### Unirse a un Espacio
1. Usa el enlace de invitación proporcionado por el creador
2. Inicia sesión si es necesario
3. Tu avatar aparecerá en el espacio virtual

### Controles
- **Movimiento**: Haz clic en cualquier lugar del mapa para moverte
- **Video Chat**: Se activa automáticamente cuando te acercas a otros usuarios
- **Chat de Texto**: Usa la barra de chat en la parte inferior
- **Cambiar Skin**: Haz clic en tu avatar para personalizar tu apariencia

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo

# Construcción
npm run build        # Construye la aplicación para producción
npm run start        # Inicia el servidor de producción

# Linting y Formateo
npm run lint         # Ejecuta ESLint
npm run lint:fix     # Corrige automáticamente errores de lint

# Tipos
npm run type-check   # Verifica tipos de TypeScript
```

## 🐛 Solución de Problemas

### Problemas Comunes

**Error: "Failed to connect to server"**
- Verifica que el backend esté ejecutándose en el puerto correcto
- Revisa la variable `NEXT_PUBLIC_BACKEND_URL`

**Video chat no funciona**
- Verifica las credenciales de Agora.io
- Asegúrate de que el navegador tenga permisos de cámara y micrófono

**Sprites no cargan**
- Verifica que los archivos estén en `public/sprites/`
- Revisa la consola del navegador para errores 404

### Logs de Debug

Para habilitar logs detallados, abre las herramientas de desarrollador del navegador y busca:
- `Frontend -` para logs del cliente
- `PIXI -` para logs del renderizador
- `VideoChat -` para logs de video chat

## � Despliegue

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard
3. Despliega automáticamente

### Otros Proveedores
```bash
npm run build
npm run start
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agrega nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

### Estándares de Código
- Usa TypeScript para todo el código nuevo
- Sigue las convenciones de nomenclatura de React
- Mantén los componentes pequeños y reutilizables
- Documenta funciones complejas
- Escribe tests para nueva funcionalidad

## 📝 Licencia

Este proyecto está licenciado bajo la GNU General Public License v3.0 - ver el archivo [LICENSE](LICENSE) para más detalles.

### GPL v3.0
Esta es una licencia de software libre que garantiza:
- ✅ Libertad para usar el software para cualquier propósito
- ✅ Libertad para estudiar y modificar el código fuente
- ✅ Libertad para redistribuir copias
- ✅ Libertad para distribuir versiones modificadas
- ⚠️ Cualquier trabajo derivado debe usar la misma licencia GPL

## 👤 Autor

**Diego Chicuazuque**
- GitHub: [@diego-chicuazuque](https://github.com/diego-chicuazuque)
- Email: diego.chicuazuque@email.com

## � Agradecimientos

- [Gather.town](https://gather.town/) por la inspiración
- La comunidad de Next.js por las herramientas increíbles
- Contribuidores del proyecto open source

## � Estado del Proyecto

🟢 **Activo**: En desarrollo activo con nuevas características siendo agregadas regularmente.

### Roadmap
- [ ] Modo espectador
- [ ] Grabación de sesiones
- [ ] Integraciones con calendarios
- [ ] Aplicación móvil
- [ ] Plugin system para extensiones

---

Made with ❤️ by Diego Chicuazuque

```


