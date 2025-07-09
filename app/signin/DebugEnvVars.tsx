// Componente temporal para debug de variables de entorno en producción
'use client'

export default function DebugEnvVars() {
  return (
    <div style={{ background: '#ffeeba', color: '#856404', padding: '1rem', margin: '1rem 0', borderRadius: 8 }}>
      <strong>DEBUG ENV VARS</strong>
      <div>NEXT_PUBLIC_SUPABASE_URL: <code>{process.env.NEXT_PUBLIC_SUPABASE_URL as string}</code></div>
      <div>NEXT_PUBLIC_SUPABASE_ANON_KEY: <code>{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[PRESENTE]' : '[VACÍA]'}</code></div>
      <div>NEXT_PUBLIC_BASE_URL: <code>{process.env.NEXT_PUBLIC_BASE_URL as string}</code></div>
      <div>NEXT_PUBLIC_BACKEND_URL: <code>{process.env.NEXT_PUBLIC_BACKEND_URL as string}</code></div>
      <div>NEXT_PUBLIC_TEST: <code>{process.env.NEXT_PUBLIC_TEST as string}</code></div>
    </div>
  )
}
