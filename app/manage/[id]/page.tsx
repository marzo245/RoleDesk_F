import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ManageChild from '../ManageChild'
import NotFound from '../../not-found'
import { request } from '@/utils/backend/requests'
import { Navbar } from '@/components/Navbar/Navbar'

export default async function Manage({ params }: { params: { id: string } }) {

    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()

    if (!user || !session) {
        return redirect('/signin')
    }

    const { data, error } = await supabase.from('realms').select('id, name, owner_id, map_data, share_id, only_owner').eq('id', params.id)
    // Show not found page if no data is returned
    if (!data || data.length === 0) {
        return <NotFound />
    }
    const realm = data[0]

    // Solo el owner puede acceder
    if (realm.owner_id !== user.id) {
        return <NotFound specialMessage='only owner' />
    }

    return (
        <div>
            <Navbar />
            <ManageChild 
                realmId={realm.id} 
                startingShareId={realm.share_id} 
                startingOnlyOwner={realm.only_owner} 
                startingName={realm.name}
                ownerId={realm.owner_id}
            />
        </div>
    )
}