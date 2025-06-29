# Guía de Desarrollo - RoleDesk

## 🛠️ Configuración del Entorno de Desarrollo

### **Requisitos del Sistema**
```bash
Node.js: 18.17.0 o superior
npm: 9.6.7 o superior
Git: 2.40.0 o superior
```

### **Variables de Entorno**
Crea un archivo `.env.local` en la raíz del proyecto:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Agora Configuration  
NEXT_PUBLIC_AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-app-certificate

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### **Instalación y Desarrollo**
```bash
# Clonar repositorio
git clone https://github.com/your-username/RoleDesk_F.git
cd RoleDesk_F

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Abrir en navegador
open http://localhost:3000
```

---

## 📁 Estructura del Proyecto

### **Organización de Archivos**
```
app/                    # Next.js 13+ App Router
├── auth/              # Autenticación (OAuth callbacks)
├── editor/            # Editor de mapas 
├── play/              # Interface de gameplay
├── manage/            # Administración de realms
├── hooks/             # React hooks personalizados
└── globals.css        # Estilos globales

components/            # Componentes React reutilizables
├── Layout/           # Layout components
├── Modal/            # Sistema de modales  
├── Navbar/           # Navegación
└── VideoChat/        # Componentes de A/V

utils/                # Utilidades y lógica de negocio
├── backend/          # Server-side utilities
├── pixi/             # PixiJS rendering engine
├── supabase/         # Database operations
└── video-chat/       # Agora WebRTC logic

public/               # Assets estáticos
├── sprites/          # Sprites y texturas para mapas
├── fonts/            # Fuentes personalizadas
└── icons/            # Iconos de UI
```

### **Convenciones de Naming**
```typescript
// Componentes: PascalCase
const VideoBar = () => { ... };

// Hooks: camelCase con prefijo 'use'
const useVideoChat = () => { ... };

// Utilities: camelCase
const formatEmailToName = (email: string) => { ... };

// Constants: SCREAMING_SNAKE_CASE
const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

// Types/Interfaces: PascalCase con sufijo 'Type' o sin sufijo
type UserType = { ... };
interface VideoStreamConfig { ... }
```

---

## 🏗️ Arquitectura de Componentes

### **Patrón de Hooks Personalizados**
```typescript
// hooks/useVideoChat.tsx - Estado global de video
export const useVideoChat = () => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const toggleAudio = useCallback(() => {
    videoChatManager.toggleAudio();
    setIsAudioEnabled(prev => !prev);
  }, []);
  
  return {
    isAudioEnabled,
    isVideoEnabled, 
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  };
};

// Uso en componentes
const VideoBar = () => {
  const { isAudioEnabled, toggleAudio } = useVideoChat();
  
  return (
    <button onClick={toggleAudio}>
      {isAudioEnabled ? '🎤' : '🔇'}
    </button>
  );
};
```

### **Sistema de Modales Centralizados**
```typescript
// hooks/useModal.tsx - Gestor global de modales
type ModalType = 'createRealm' | 'deleteRealm' | 'screenShare' | 'teleport';

export const useModal = () => {
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  
  const openModal = (type: ModalType, data?: any) => {
    setActiveModal(type);
    setModalData(data);
  };
  
  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };
  
  return { activeModal, modalData, openModal, closeModal };
};
```

### **Manejo de Estado con Context API**
```typescript
// contexts/RealmContext.tsx
interface RealmContextType {
  currentRealm: Realm | null;
  users: Map<string, User>;
  myPosition: { x: number; y: number };
  updateUserPosition: (userId: string, position: Position) => void;
}

export const RealmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRealm, setCurrentRealm] = useState<Realm | null>(null);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  
  // WebSocket event handlers
  useEffect(() => {
    socket.on('user-moved', ({ userId, position }) => {
      setUsers(prev => new Map(prev).set(userId, { ...prev.get(userId)!, position }));
    });
    
    return () => socket.off('user-moved');
  }, []);
  
  const value = {
    currentRealm,
    users,
    myPosition,
    updateUserPosition
  };
  
  return (
    <RealmContext.Provider value={value}>
      {children}
    </RealmContext.Provider>
  );
};
```

---

## 🎮 Desarrollo del Sistema PixiJS

### **Inicialización del Renderer**
```typescript
// utils/pixi/App.ts
export class PixiApp {
  private app: PIXI.Application;
  private viewport: Viewport;
  private mapContainer: PIXI.Container;
  
  constructor(canvas: HTMLCanvasElement) {
    this.app = new PIXI.Application({
      view: canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x2c3e50,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio
    });
    
    this.setupViewport();
    this.setupMapContainer();
  }
  
  private setupViewport() {
    this.viewport = new Viewport({
      screenWidth: this.app.view.width,
      screenHeight: this.app.view.height,
      worldWidth: 2000,
      worldHeight: 2000,
      interaction: this.app.renderer.plugins.interaction
    });
    
    this.viewport
      .drag()
      .pinch()
      .wheel()
      .decelerate();
      
    this.app.stage.addChild(this.viewport);
  }
}
```

### **Sistema de Tiles Optimizado**
```typescript
// utils/pixi/TileSystem.ts
export class TileSystem {
  private tileSprites: Map<string, PIXI.Sprite> = new Map();
  private visibleTiles: Set<string> = new Set();
  private spritePool: Map<string, PIXI.Sprite[]> = new Map();
  
  // Object pooling para reutilizar sprites
  private getSprite(tileType: string): PIXI.Sprite {
    const pool = this.spritePool.get(tileType) || [];
    
    if (pool.length > 0) {
      return pool.pop()!;
    }
    
    const texture = PIXI.Loader.shared.resources[`${tileType}.png`].texture;
    return new PIXI.Sprite(texture);
  }
  
  // Viewport culling - solo renderizar tiles visibles
  updateVisibleTiles(viewportBounds: PIXI.Rectangle) {
    const newVisibleTiles = new Set<string>();
    
    for (let x = Math.floor(viewportBounds.x / 32); x <= Math.ceil(viewportBounds.right / 32); x++) {
      for (let y = Math.floor(viewportBounds.y / 32); y <= Math.ceil(viewportBounds.bottom / 32); y++) {
        const key = `${x},${y}`;
        newVisibleTiles.add(key);
        
        if (!this.visibleTiles.has(key)) {
          this.renderTile(x, y);
        }
      }
    }
    
    // Remove tiles that are no longer visible
    for (const key of this.visibleTiles) {
      if (!newVisibleTiles.has(key)) {
        this.recycleTile(key);
      }
    }
    
    this.visibleTiles = newVisibleTiles;
  }
}
```

---

## 🔌 Integración de APIs

### **Supabase Database Operations**
```typescript
// utils/supabase/saveRealm.ts
export const saveRealmToDatabase = async (realm: Realm): Promise<void> => {
  const { error } = await supabase
    .from('realms')
    .upsert({
      id: realm.id,
      name: realm.name,
      owner_id: realm.ownerId,
      map_data: realm.mapData,
      updated_at: new Date().toISOString()
    });
    
  if (error) {
    throw new Error(`Failed to save realm: ${error.message}`);
  }
};

// Real-time subscriptions
export const subscribeToRealmChanges = (realmId: string, callback: (change: any) => void) => {
  return supabase
    .channel(`realm-${realmId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'realms',
      filter: `id=eq.${realmId}`
    }, callback)
    .subscribe();
};
```

### **Agora WebRTC Integration**
```typescript
// utils/video-chat/video-chat.ts
class VideoChatManager {
  private primaryClient: IAgoraRTCClient;
  private screenClient: IAgoraRTCClient;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private localScreenTrack: ILocalVideoTrack | null = null;
  
  async joinChannel(channelName: string, userId: string): Promise<void> {
    // Primary client para cámara + audio
    this.primaryClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    
    await this.primaryClient.join(
      AGORA_APP_ID,
      channelName,
      token,
      userId
    );
    
    // Screen client para pantalla compartida
    this.screenClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    
    // Event handlers
    this.primaryClient.on('user-published', this.handleUserPublished);
    this.primaryClient.on('user-unpublished', this.handleUserUnpublished);
    this.screenClient.on('user-published', this.handleScreenPublished);
  }
  
  async startScreenShare(): Promise<void> {
    if (!this.screenClient) return;
    
    this.localScreenTrack = await AgoraRTC.createScreenVideoTrack({
      encoderConfig: {
        width: 1920,
        height: 1080,
        frameRate: 15,
        bitrateMin: 1000,
        bitrateMax: 3000
      }
    });
    
    await this.screenClient.join(
      AGORA_APP_ID,
      channelName,
      screenToken,
      `${userId}_screen`
    );
    
    await this.screenClient.publish(this.localScreenTrack);
  }
}
```

---

## 🧪 Testing Strategy

### **Unit Tests (Jest + React Testing Library)**
```typescript
// __tests__/components/VideoBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoBar } from '@/components/VideoChat/VideoBar';
import { useVideoChat } from '@/hooks/useVideoChat';

// Mock del hook
jest.mock('@/hooks/useVideoChat');
const mockUseVideoChat = useVideoChat as jest.MockedFunction<typeof useVideoChat>;

describe('VideoBar', () => {
  beforeEach(() => {
    mockUseVideoChat.mockReturnValue({
      isAudioEnabled: false,
      isVideoEnabled: false,
      toggleAudio: jest.fn(),
      toggleVideo: jest.fn(),
    });
  });
  
  it('should toggle audio when mic button is clicked', () => {
    const mockToggleAudio = jest.fn();
    mockUseVideoChat.mockReturnValue({
      isAudioEnabled: false,
      toggleAudio: mockToggleAudio,
      ...
    });
    
    render(<VideoBar />);
    
    const micButton = screen.getByRole('button', { name: /microphone/i });
    fireEvent.click(micButton);
    
    expect(mockToggleAudio).toHaveBeenCalledTimes(1);
  });
});
```

### **Integration Tests (Playwright)**
```typescript
// e2e/video-chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Video Chat Integration', () => {
  test('should connect to video chat and share screen', async ({ page, context }) => {
    // Grant permissions
    await context.grantPermissions(['camera', 'microphone']);
    
    await page.goto('/play/test-realm');
    
    // Wait for video chat to initialize
    await expect(page.locator('[data-testid="video-bar"]')).toBeVisible();
    
    // Enable camera
    await page.click('[data-testid="camera-toggle"]');
    await expect(page.locator('[data-testid="local-video"]')).toBeVisible();
    
    // Start screen share
    await page.click('[data-testid="screen-share-button"]');
    await expect(page.locator('[data-testid="screen-share-modal"]')).toBeVisible();
  });
});
```

### **Performance Tests**
```typescript
// __tests__/performance/pixi-rendering.test.ts
describe('PixiJS Performance', () => {
  it('should maintain 60 FPS with 1000+ sprites', async () => {
    const app = new PixiApp(document.createElement('canvas'));
    
    // Add 1000 sprites
    for (let i = 0; i < 1000; i++) {
      app.addTile({ x: i % 50, y: Math.floor(i / 50), type: 'floor' });
    }
    
    const startTime = performance.now();
    
    // Simulate 60 frames
    for (let frame = 0; frame < 60; frame++) {
      app.ticker.update();
    }
    
    const endTime = performance.now();
    const avgFrameTime = (endTime - startTime) / 60;
    
    // Should render each frame in <16.67ms (60 FPS)
    expect(avgFrameTime).toBeLessThan(16.67);
  });
});
```

---

## 🔧 Debugging y Profiling

### **VS Code Debug Configuration**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/next/dist/bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

### **Performance Monitoring**
```typescript
// utils/monitoring/performance.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  startTimer(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
    };
  }
  
  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getAverageMetric(label: string): number {
    const values = this.metrics.get(label) || [];
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}

// Uso en componentes
const VideoBar = () => {
  const monitor = usePerformanceMonitor();
  
  const handleClick = () => {
    const endTimer = monitor.startTimer('video-toggle');
    toggleVideo();
    endTimer();
  };
  
  return <button onClick={handleClick}>Toggle Video</button>;
};
```

---

## 📝 Contribution Guidelines

### **Pull Request Process**
1. **Branch naming**: `feature/video-quality-improvements` o `fix/screen-share-bug`
2. **Commit messages**: Seguir Conventional Commits
   ```
   feat(video): add adaptive quality controls
   fix(pixi): resolve memory leak in tile rendering
   docs(readme): update installation instructions
   ```
3. **Testing**: Todos los PRs deben incluir tests relevantes
4. **Code review**: Mínimo 1 review requerido, 2 para cambios críticos

### **Code Quality Standards**
```typescript
// ESLint configuration (.eslintrc.json)
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-console": "warn"
  }
}

// Prettier configuration (.prettierrc)
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

### **Documentation Requirements**
- Todos los componentes públicos deben tener JSDoc
- Funciones complejas requieren comentarios explicativos
- Cambios en APIs requieren actualización de documentación
- README debe mantenerse actualizado con nuevas features

---

[← Volver al README principal](../README.md)
