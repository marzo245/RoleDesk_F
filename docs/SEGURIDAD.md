# Seguridad - RoleDesk

## 🔐 Autenticación y Autorización

### **Multi-layer Auth Stack**
```
Usuario → Supabase Auth → JWT Token → Next.js Middleware → Validación de Permisos
```

**Supabase Auth Provider:**
- Google OAuth 2.0 con secure redirect flows
- Session management con automatic token refresh
- Secure cookie storage (httpOnly, sameSite, secure)

**JWT Validation Pipeline:**
```typescript
// middleware.ts - Intercepta TODAS las requests
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('supabase-auth-token');
  
  if (!token || !verifyJWT(token)) {
    return redirectToSignIn();
  }
  
  // Validación de permisos específicos por ruta
  if (request.nextUrl.pathname.startsWith('/manage/')) {
    await verifyOwnerPermissions(token, realmId);
  }
}
```

### **Granular Permission System**
```typescript
type Permission = 'realm:read' | 'realm:edit' | 'realm:admin';

// Matriz de permisos por rol
const ROLE_PERMISSIONS = {
  owner: ['realm:read', 'realm:edit', 'realm:admin'],
  user: ['realm:read']  // Solo viewing y participación básica
} as const;
```

---

## 🛡️ Validación de Datos - Defense in Depth

### **Client-Side Validation (Primera línea)**
```typescript
// Zod schemas para type-safe validation
const MapUpdateSchema = z.object({
  x: z.number().int().min(0).max(1000),
  y: z.number().int().min(0).max(1000), 
  tileType: z.enum(['floor', 'wall', 'spawn', 'teleport']),
  realmId: z.string().uuid()
});

// Validación automática en React Hook Form
const { handleSubmit } = useForm({
  resolver: zodResolver(MapUpdateSchema)
});
```

### **Server-Side Validation (Línea definitiva)**
```typescript
// API routes validan TODOS los inputs
export async function POST(request: Request) {
  const body = await request.json();
  
  // Parse + validate con Zod
  const validation = MapUpdateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.issues },
      { status: 400 }
    );
  }
  
  // Validación de negocio: usuario tiene permisos?
  await verifyPermission(userId, realmId, 'realm:edit');
}
```

### **Database Constraints (Última línea)**
```sql
-- PostgreSQL constraints como backup final
CREATE TABLE map_tiles (
  x INTEGER CHECK (x >= 0 AND x <= 1000),
  y INTEGER CHECK (y >= 0 AND y <= 1000),
  tile_type VARCHAR(20) CHECK (tile_type IN ('floor', 'wall', 'spawn', 'teleport')),
  realm_id UUID NOT NULL REFERENCES realms(id) ON DELETE CASCADE
);
```

---

## 🚦 Rate Limiting - DDoS Protection

### **API Rate Limiting**
```typescript
// Límites por endpoint y usuario
const RATE_LIMITS = {
  'map-update': { requests: 30, windowMs: 60000 },    // 30 updates/min
  'join-realm': { requests: 10, windowMs: 300000 },   // 10 joins/5min  
  'create-realm': { requests: 3, windowMs: 3600000 }, // 3 realms/hour
} as const;

// Implementación con sliding window
const rateLimiter = new Map<string, RateLimitEntry>();
```

### **WebSocket Connection Limits**
```typescript
// Máximo 5 conexiones simultáneas por usuario
const userConnections = new Map<string, Set<WebSocket>>();

socket.on('connection', (ws) => {
  const userId = extractUserId(ws);
  const connections = userConnections.get(userId) || new Set();
  
  if (connections.size >= 5) {
    ws.close(1008, 'Too many connections');
    return;
  }
  
  connections.add(ws);
  userConnections.set(userId, connections);
});
```

### **Agora Token Security**
```typescript
// Tokens Agora con TTL limitado y permisos específicos
const generateAgoraToken = (userId: string, realmId: string) => {
  return AgoraAccessToken.build({
    appId: AGORA_APP_ID,
    appCertificate: AGORA_APP_CERTIFICATE,
    channelName: realmId,
    uid: userId,
    role: AgoraAccessToken.Role.PUBLISHER,
    expireTime: Math.floor(Date.now() / 1000) + 86400, // 24h TTL
    privileges: {
      [AgoraAccessToken.Privilege.JOIN_CHANNEL]: Math.floor(Date.now() / 1000) + 86400,
      [AgoraAccessToken.Privilege.PUBLISH_AUDIO_STREAM]: Math.floor(Date.now() / 1000) + 86400,
      [AgoraAccessToken.Privilege.PUBLISH_VIDEO_STREAM]: Math.floor(Date.now() / 1000) + 86400,
    }
  });
};
```

---

## 🔒 Comunicación Segura - Encryption & Privacy

### **End-to-End Encryption Status**
**Audio/Video Streams (Agora):**
- ✅ **TLS 1.3** para signaling plane
- ✅ **DTLS-SRTP** para media encryption en WebRTC
- ✅ **AES-256** symmetric encryption para streams
- ❌ **No E2E**: Agora servers pueden descifrar (para mixing, recording, etc.)

**WebSocket Communication:**
- ✅ **WSS (WebSocket Secure)** con TLS 1.3
- ✅ **Message signing** con HMAC-SHA256 para integridad
- ❌ **No E2E**: Server puede leer mensajes (necesario para sync, validación)

### **Data Minimization**
```typescript
// Solo transmitir datos necesarios
type UserPresence = {
  id: string;
  position: { x: number; y: number };
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  // ❌ NO incluir: email, real name, IP address
};

// Cleanup automático de datos sensibles
const sanitizeUserData = (user: FullUser): PublicUser => ({
  id: user.id,
  displayName: user.display_name,
  avatar: user.avatar_url,
  // Removing: email, created_at, last_seen, etc.
});
```

### **Secure Asset Storage**
```typescript
// URLs firmadas para assets privados
const getSignedAssetUrl = async (assetPath: string, userId: string) => {
  const { data, error } = await supabase.storage
    .from('realm-assets')
    .createSignedUrl(assetPath, 3600, {
      transform: {
        width: 512,  // Limit resolution para privacy
        height: 512,
        quality: 80
      }
    });
    
  return data?.signedUrl;
};
```

---

## 🛠️ Input Sanitization - XSS & Injection Prevention

### **Content Security Policy (CSP)**
```typescript
// next.config.js - Strict CSP headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' https://cdn.agora.io", // Agora SDK needs eval
      "style-src 'self' 'unsafe-inline'", // Tailwind needs inline styles
      "img-src 'self' data: https://lh3.googleusercontent.com", // Google avatars
      "media-src 'self' blob:",
      "connect-src 'self' wss: https://api.agora.io https://*.supabase.co",
      "frame-src 'none'",
    ].join('; ')
  }
];
```

### **User Input Sanitization**
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Limpiar HTML en user-generated content
const sanitizeUserInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML permitido
    ALLOWED_ATTR: []
  });
};

// Validación de nombres de realm
const REALM_NAME_PATTERN = /^[a-zA-Z0-9\s\-_]{3,50}$/;
const validateRealmName = (name: string): boolean => {
  return REALM_NAME_PATTERN.test(sanitizeUserInput(name));
};
```

### **SQL Injection Prevention**
```typescript
// Supabase client usa prepared statements automáticamente
const { data, error } = await supabase
  .from('realms')
  .select('*')
  .eq('owner_id', userId)  // ✅ Parameterized query
  .eq('name', realmName);  // ✅ Safe from injection

// ❌ NUNCA hacer raw SQL con user input:
// const query = `SELECT * FROM realms WHERE name = '${userInput}'`;
```

---

## 🔍 Monitoring & Incident Response

### **Security Event Logging**
```typescript
// Log security-relevant events
const securityLog = {
  failed_auth: (userId: string, ip: string, reason: string) => {
    console.warn(`[SECURITY] Failed auth: ${userId} from ${ip} - ${reason}`);
    // TODO: Send to monitoring service (DataDog, Sentry, etc.)
  },
  
  permission_violation: (userId: string, resource: string, action: string) => {
    console.error(`[SECURITY] Permission violation: ${userId} tried ${action} on ${resource}`);
    // TODO: Alert administrators
  },
  
  rate_limit_exceeded: (userId: string, endpoint: string, count: number) => {
    console.warn(`[SECURITY] Rate limit exceeded: ${userId} hit ${endpoint} ${count} times`);
    // TODO: Consider temporary ban
  }
};
```

### **Automated Threat Detection**
```typescript
// Patrones sospechosos para auto-detection
const suspiciousPatterns = {
  rapidRequests: { threshold: 100, windowMs: 60000 },
  multipleFailedLogins: { threshold: 5, windowMs: 300000 },
  unusualDataAccess: { threshold: 1000, windowMs: 3600000 }, // Too many realm reads
};

// Auto-response actions
const responseActions = {
  temporaryBan: (userId: string, durationMs: number) => {
    bannedUsers.set(userId, Date.now() + durationMs);
  },
  
  requireCaptcha: (userId: string) => {
    captchaRequired.add(userId);
  },
  
  alertAdmins: (incident: SecurityIncident) => {
    // TODO: Slack/email notifications
  }
};
```

### **Regular Security Audits**
**Checklist mensual:**
- [ ] Review user permissions y cleanup cuentas inactivas >90 días
- [ ] Audit Supabase access logs para patrones anómalos  
- [ ] Update dependencies con security patches
- [ ] Review CSP violations en browser console
- [ ] Test rate limiting effectiveness
- [ ] Validate SSL certificate expiration dates

---

[← Volver al README principal](../README.md)
