import React from 'react'
import NotFound from '@/app/not-found'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getPlayRealmData } from '@/utils/supabase/getPlayRealmData'
import { updateVisitedRealms } from '@/utils/supabase/updateVisitedRealms'
import { formatEmailToName } from '@/utils/formatEmailToName'
import { PostgrestError } from '@supabase/supabase-js'
import { AuthError } from '@supabase/supabase-js'
import dynamic from 'next/dynamic'

// 👉 import dinámico para evitar errores SSR (como window is not defined)
const PlayClient = dynamic(() => import('../PlayClient'), { ssr: false })

type RealmData = {
    map_data: any
    owner_id: string
    name: string
}

type ProfileData = {
    skin: string
}

type CustomError = PostgrestError | AuthError

export default async function Play({ params, searchParams }: { params: { id: string }, searchParams: { shareId: string } }) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()

    if (!session || !user) {
        return redirect('/signin')
    }

    let realmData: RealmData | null = null
    let error: CustomError | null = null

    // Si hay un shareId, primero obtenemos el ID del reino correspondiente
    if (searchParams.shareId) {
        const { data: sharedRealmData, error: shareError } = await supabase
            .from('realms')
            .select('id')
            .eq('share_id', searchParams.shareId)
            .single()
        
        if (shareError) {
            return <NotFound specialMessage={shareError.message} />
        }

        // Si el ID del reino compartido no coincide con el ID de la URL, redirigimos
        if (sharedRealmData && sharedRealmData.id !== params.id) {
            return redirect(`/play/${sharedRealmData.id}?shareId=${searchParams.shareId}`)
        }
    }

    // Obtener datos del reino
    if (searchParams.shareId) {
        const result = await getPlayRealmData(session.access_token, searchParams.shareId)
        realmData = result.data
        error = result.error
    } else {
        const { data, error: postgrestError } = await supabase
            .from('realms')
            .select('map_data, owner_id, name')
            .eq('id', params.id)
            .single()
        realmData = data
        error = postgrestError
    }

    if (error) {
        return <NotFound specialMessage={error.message} />
    }

    if (!realmData) {
        return <NotFound specialMessage="No se encontró el mundo solicitado" />
    }

    // Obtener perfil del usuario
    let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('skin')
        .eq('id', user.id)
        .single()

    // Crear perfil si no existe
    if (!profile && !profileError) {
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: user.id, skin: '009' }])
            .select('skin')
            .single()

        if (newProfile) {
            profile = newProfile
        } else {
            profileError = createError
        }
    }

    if (profileError) {
        return <NotFound specialMessage={profileError.message} />
    }

    if (!profile) {
        return <NotFound specialMessage="No se pudo cargar el perfil del usuario" />
    }

    const validSkins = Array.from({ length: 83 }, (_, i) =>
        String(i + 1).padStart(3, '0')
    )

    if (profile && profile.skin && !validSkins.includes(profile.skin)) {
        await supabase
            .from('profiles')
            .update({ skin: '009' })
            .eq('id', user.id)
        profile.skin = '009'
    }

    const realm = realmData
    const map_data = realm.map_data
    const skin = profile.skin

    if (searchParams.shareId && realm.owner_id !== user.id) {
        updateVisitedRealms(session.access_token, searchParams.shareId)
    }

    return (
        <PlayClient
            mapData={map_data}
            username={formatEmailToName(user.user_metadata.email)}
            access_token={session.access_token}
            realmId={params.id}
            uid={user.id}
            shareId={searchParams.shareId || ''}
            initialSkin={skin}
            name={realm.name}
        />
    )
}
