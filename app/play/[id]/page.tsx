import React from 'react'
import NotFound from '@/app/not-found'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getPlayRealmData } from '@/utils/supabase/getPlayRealmData'
import { updateVisitedRealms } from '@/utils/supabase/updateVisitedRealms'
import { formatEmailToName } from '@/utils/formatEmailToName'
import dynamic from 'next/dynamic'

// 👉 import dinámico para evitar errores SSR (como window is not defined)
const PlayClient = dynamic(() => import('../PlayClient'), { ssr: false })

export default async function Play({ params, searchParams }: { params: { id: string }, searchParams: { shareId: string } }) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()

    if (!session || !user) {
        return redirect('/signin')
    }

    const { data, error } = !searchParams.shareId
        ? await supabase.from('realms').select('map_data, owner_id, name').eq('id', params.id).single()
        : await getPlayRealmData(session.access_token, searchParams.shareId)

    let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('skin')
        .eq('id', user.id)
        .single()

    if (!profile && user) {
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: user.id, skin: '009' }])
            .select('skin')
            .single()

        if (newProfile) {
            profile = newProfile
            profileError = null
        } else {
            profileError = createError
        }
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

    if (!data || !profile) {
        const message = error?.message || profileError?.message
        return <NotFound specialMessage={message} />
    }

    const realm = data
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
