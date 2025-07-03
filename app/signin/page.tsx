'use client'
import { createClient } from '@/utils/supabase/client'
import GoogleSignInButton from './GoogleSignInButton'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
    const searchParams = useSearchParams()
    const realmId = searchParams.get('realmId')
    const shareId = searchParams.get('shareId')

    const signInWithGoogle = async () => {
        const supabase = createClient()
        
        // Construir la URL de callback con los parámetros si existen
        let callbackUrl = process.env.NEXT_PUBLIC_BASE_URL + '/auth/callback'
        if (realmId && shareId) {
            callbackUrl += `?realmId=${realmId}&shareId=${shareId}`
        }
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: callbackUrl
            }
        })
    }

    return (
        <div className='flex flex-col items-center w-full pt-56'>
            <GoogleSignInButton onClick={signInWithGoogle}/>
        </div>
    )
}

export default function Login() {
    return (
        <Suspense fallback={<div className='flex flex-col items-center w-full pt-56'>Loading...</div>}>
            <LoginContent />
        </Suspense>
    )
}
