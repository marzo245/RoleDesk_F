'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function DebugPage() {
    const [user, setUser] = useState<any>(null)
    const [realms, setRealms] = useState<any[]>([])
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [testResults, setTestResults] = useState<any[]>([])

    useEffect(() => {
        async function loadData() {
            const supabase = createClient()
            
            // Obtener usuario
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            console.log('Usuario:', user, 'Error:', userError)
            setUser(user)

            if (user) {
                // Obtener perfil
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                console.log('Perfil:', profile, 'Error:', profileError)
                setProfile(profile)

                // Si no existe el perfil, crear uno
                if (!profile && user) {
                    const { data: newProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert([{ id: user.id, skin: 'base' }])
                        .select()
                        .single()
                    console.log('Perfil creado:', newProfile, 'Error:', createError)
                    setProfile(newProfile)
                }

                // Obtener realms
                const { data: realms, error: realmsError } = await supabase
                    .from('realms')
                    .select('*')
                    .eq('owner_id', user.id)
                console.log('Realms:', realms, 'Error:', realmsError)
                setRealms(realms || [])

                // Probar cada realm
                const tests = []
                for (const realm of realms || []) {
                    const testResult = await testRealm(supabase, realm.id, user.id)
                    tests.push({ realm, ...testResult })
                }
                setTestResults(tests)
            }

            setLoading(false)
        }

        loadData()
    }, [])

    async function testRealm(supabase: any, realmId: string, userId: string) {
        try {
            // Test 1: ¿Existe el realm?
            const { data: realm, error: realmError } = await supabase
                .from('realms')
                .select('map_data, owner_id, name')
                .eq('id', realmId)
                .single()

            // Test 2: ¿Existe el perfil?
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('skin')
                .eq('id', userId)
                .single()

            return {
                realmExists: !!realm,
                realmError: realmError?.message,
                profileExists: !!profile,
                profileError: profileError?.message,
                canAccess: !!realm && !!profile
            }
        } catch (error) {
            return {
                realmExists: false,
                realmError: 'Error de conexión',
                profileExists: false,
                profileError: 'Error de conexión',
                canAccess: false
            }
        }
    }

    async function createTestRealm() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        const { data, error } = await supabase
            .from('realms')
            .insert([{
                name: 'Realm de Prueba',
                description: 'Un realm para testing',
                owner_id: user.id,
                map_data: {
                    "rooms": [
                        {
                            "name": "Sala Principal",
                            "width": 20,
                            "height": 20,
                            "tiles": []
                        }
                    ]
                }
            }])
            .select()
            .single()

        if (data) {
            console.log('Realm creado:', data)
            window.location.reload()
        } else {
            console.error('Error creando realm:', error)
        }
    }

    if (loading) {
        return <div className="p-8">Cargando datos de debug...</div>
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Debug de Supabase - Análisis Completo</h1>
            
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Estado de Autenticación:</h2>
                <div className="bg-gray-100 p-4 rounded">
                    {user ? (
                        <div>
                            <p>✅ Usuario autenticado: {user.email}</p>
                            <p>🆔 ID: {user.id}</p>
                        </div>
                    ) : (
                        <p>❌ No hay usuario autenticado</p>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Estado del Perfil:</h2>
                <div className="bg-gray-100 p-4 rounded">
                    {profile ? (
                        <div>
                            <p>✅ Perfil existe</p>
                            <p>🎨 Skin: {profile.skin}</p>
                        </div>
                    ) : (
                        <p>❌ No existe perfil</p>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Realms Disponibles:</h2>
                <div className="bg-gray-100 p-4 rounded">
                    {realms.length > 0 ? (
                        <div>
                            <p>✅ {realms.length} realm(s) encontrado(s)</p>
                            {realms.map((realm) => (
                                <div key={realm.id} className="mt-2 p-2 bg-white rounded">
                                    <p><strong>{realm.name}</strong></p>
                                    <p>ID: {realm.id}</p>
                                    <p>Share ID: {realm.share_id}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>
                            <p>❌ No hay realms</p>
                            <button 
                                onClick={createTestRealm}
                                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Crear Realm de Prueba
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Test de Acceso:</h2>
                <div className="bg-gray-100 p-4 rounded">
                    {testResults.map((test, index) => (
                        <div key={index} className="mb-4 p-3 bg-white rounded">
                            <h3 className="font-semibold">{test.realm.name}</h3>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                    <p>Realm existe: {test.realmExists ? '✅' : '❌'}</p>
                                    {test.realmError && <p className="text-red-600 text-sm">Error: {test.realmError}</p>}
                                </div>
                                <div>
                                    <p>Perfil existe: {test.profileExists ? '✅' : '❌'}</p>
                                    {test.profileError && <p className="text-red-600 text-sm">Error: {test.profileError}</p>}
                                </div>
                            </div>
                            <div className="mt-2">
                                <p className="font-semibold">
                                    Puede acceder: {test.canAccess ? '✅' : '❌'}
                                </p>
                                {test.canAccess && (
                                    <div className="mt-2">
                                        <Link 
                                            href={`/play/${test.realm.id}`}
                                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mr-2"
                                        >
                                            Probar /play/{test.realm.id}
                                        </Link>
                                        <Link 
                                            href={`/editor/${test.realm.id}`}
                                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                        >
                                            Probar /editor/{test.realm.id}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Enlaces de Navegación:</h2>
                <div className="bg-gray-100 p-4 rounded">
                    <Link href="/app" className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 mr-2">
                        Ir a /app
                    </Link>
                    <Link href="/signin" className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 mr-2">
                        Ir a /signin
                    </Link>
                    <Link href="/" className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600">
                        Ir a inicio
                    </Link>
                </div>
            </div>
        </div>
    )
}
