# RoleDesk Frontend 🎛️

**Interfaz web moderna** construida en **React** y **Tailwind CSS** para la plataforma **RoleDesk**, una oficina virtual en tiempo real. Este cliente ofrece funcionalidades como representación visual de salas, chat, compartir pantalla y control remoto, todo en una experiencia fluida y responsive.

---

## 🚀 Comenzando

Sigue estos pasos para levantar el entorno de desarrollo local del frontend de RoleDesk.

### ✅ Requisitos previos

```bash
Node.js >= 18.x
npm o yarn
Git
````

---

## 💻 Instalación

Clona el repositorio y navega al directorio del frontend:

```bash
git clone https://github.com/marzo245/roledesk-frontend.git
cd roledesk-frontend
npm install
```

Inicia la aplicación local:

```bash
npm run dev
```

Accede a la app desde:
📍 `http://localhost:5173` (si usas Vite)

---

## 🧠 Estructura del Proyecto

```
src/
├── components/       # Componentes reutilizables (Navbar, Avatar, ChatBox)
├── pages/            # Vistas principales (Home, Sala, Login)
├── hooks/            # Hooks personalizados (uso de WebSocket, presencia, etc.)
├── services/         # Cliente API y lógica para backend (Axios, REST)
├── context/          # Contextos globales (auth, presencia, sala)
├── assets/           # Imágenes, íconos y estilos estáticos
├── App.jsx           # Componente raíz
└── main.jsx          # Punto de entrada
```

---

## 🌐 Funcionalidades clave

* 🧑‍💻 Representación visual de la oficina (tipo mapa interactivo)
* 💬 Chat en tiempo real (individual y grupal)
* 🖥️ Compartir pantalla con WebRTC
* 🤝 Solicitud y concesión de control remoto
* 🔐 Autenticación y manejo de sesión
* 📡 Actualización en tiempo real vía WebSocket

---

## 🧪 Pruebas

El frontend se acompaña de pruebas automatizadas con **Jest + React Testing Library**.

Para ejecutarlas:

```bash
npm test
```

Casos cubiertos:

* Renderizado de componentes clave
* Flujos de login y navegación
* Comportamiento de botones y formularios
* Mock de WebSocket y eventos visuales

Consulta [`FRONTEND-TESTS.md`](FRONTEND-TESTS.md) para más detalles.

---

## 📐 Diseño UI

Consulta [`FRONTEND-DESIGN.md`](FRONTEND-DESIGN.md) para:

* Estructura visual de salas
* Composición de avatares y estados
* Responsive design con Tailwind
* Experiencia de usuario (UX)

---

## 🔌 Comunicación con Backend

La app consume:

* API REST (login, registro, salas)
* WebSocket (presencia, chat)
* WebRTC (streaming pantalla/control remoto)

Ver detalles técnicos en [`API-INTERFACES.md`](API-INTERFACES.md)

---

## ☁️ Despliegue en AWS

La aplicación será desplegada en:

* **S3**: hosting del frontend como sitio estático
* **CloudFront**: CDN y HTTPS
* **Route 53**: dominio personalizado
* **IAM**: control de acceso

Consulta [`DEPLOYMENT.md`](DEPLOYMENT.md) para el proceso completo.

---

## 👤 Autor

**Diego Chicuazuque**
GitHub: [marzo245](https://github.com/marzo245)

---

## 📄 Licencia

MIT License – ver archivo [LICENSE](LICENSE) para más detalles.

---

## 🙌 Agradecimientos

* A las comunidades de React y Tailwind.
* A la documentación oficial de WebRTC, Socket.IO y Vite.
* A los profesores y compañeros que guiaron este proceso.

```


