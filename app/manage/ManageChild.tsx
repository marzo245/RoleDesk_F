'use client'
import React, { useState, useEffect } from 'react'
import Dropdown from '@/components/Dropdown'
import BasicButton from '@/components/BasicButton'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'react-toastify'
import revalidate from '@/utils/revalidate'
import { useModal } from '../hooks/useModal'
import { Copy } from '@phosphor-icons/react'
import { v4 as uuidv4 } from 'uuid'
import BasicInput from '@/components/BasicInput'
import { removeExtraSpaces } from '@/utils/removeExtraSpaces'
import { copyWithNotification } from '@/utils/copyToClipboard'
import { server } from '@/utils/backend/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import Link from 'next/link'

type ManageChildProps = {
    realmId: string
    startingShareId: string
    startingOnlyOwner: boolean
    startingName: string
    ownerId: string
}

const ManageChild:React.FC<ManageChildProps> = ({ realmId, startingShareId, startingOnlyOwner, startingName, ownerId }) => {

    const [selectedTab, setSelectedTab] = useState(0)
    const [shareId, setShareId] = useState(startingShareId)
    const [onlyOwner, setOnlyOwner] = useState(startingOnlyOwner)
    const [name, setName] = useState(startingName)
    const { setModal, setLoadingText } = useModal()

    const supabase = createClient()

    // Solo el owner puede gestionar
    const [userId, setUserId] = useState<string | null>(null)
    useEffect(() => {
        async function getUser() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id || null)
        }
        getUser()
    }, [])

    if (userId && userId !== ownerId) {
        return (
            <div className='flex flex-col items-center pt-24'>
                <div className='text-xl text-red-500'>Solo el owner puede gestionar este espacio.</div>
            </div>
        )
    }

    async function save() {
        if (name.trim() === '') {
            toast.error('Name cannot be empty!')
            return
        }

        setModal('Loading')
        setLoadingText('Saving...')

        const { error } = await supabase
            .from('realms')
            .update({ 
                    only_owner: onlyOwner,
                    name: name,
                })
            .eq('id', realmId)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Saved!')
        }

        revalidate('/manage/[id]')
        setModal('None')
    }

    function copyLink() {
        const link = process.env.NEXT_PUBLIC_BASE_URL + '/play/' + realmId + '?shareId=' + shareId
        copyWithNotification(link, 'Link copied!', 'Error al copiar enlace', toast)
    }

    async function generateNewLink() {
        setModal('Loading')
        setLoadingText('Generating new link...')

        const newShareId = uuidv4()
        const { error } = await supabase
            .from('realms')
            .update({ 
                share_id: newShareId
                })
            .eq('id', realmId)

        if (error) {
            toast.error(error.message)
        } else {
            setShareId(newShareId)
            const link = process.env.NEXT_PUBLIC_BASE_URL + '/play/' + realmId + '?shareId=' + newShareId
            copyWithNotification(link, 'New link copied!', 'Error al copiar enlace', toast)
        }

        revalidate('/manage/[id]')
        setModal('None')
    }

    function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = removeExtraSpaces(e.target.value)
        setName(value)
    }

    const [connected, setConnected] = useState<any[]>([])
    const [rooms, setRooms] = useState<any[]>([])
    const [members, setMembers] = useState<any[]>([])
    const [loadingMembers, setLoadingMembers] = useState(false)
    const [owner, setOwner] = useState<string>(ownerId)
    const [joinedMembers, setJoinedMembers] = useState<any[]>([])

    // Obtener rooms del realm al cargar la pestaña de miembros
    useEffect(() => {
        if (selectedTab === 2) {
            fetchMembers()
            fetchRoomsAndConnected()
            fetchJoinedMembers()
        }
        // eslint-disable-next-line
    }, [selectedTab])

    async function fetchMembers() {
        setLoadingMembers(true)
        // Obtener datos del realm para el shareId y owner
        const { data: realm, error: realmError } = await supabase
            .from('realms')
            .select('share_id, owner_id')
            .eq('id', realmId)
            .single()
        if (!realm) {
            setLoadingMembers(false)
            return
        }
        setOwner(realm.owner_id)
        // Buscar todos los perfiles que tengan el shareId en visited_realms
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, skin, visited_realms')
        if (!profiles) {
            setMembers([])
            setLoadingMembers(false)
            return
        }
        // Filtrar los que tienen el shareId
        const filtered = profiles.filter((p: any) => Array.isArray(p.visited_realms) && p.visited_realms.includes(realm.share_id) || p.id === realm.owner_id)
        setMembers(filtered)
        setLoadingMembers(false)
    }

    async function fetchRoomsAndConnected() {
        // Obtener datos del realm para los rooms
        const { data: realm, error: realmError } = await supabase
            .from('realms')
            .select('map_data')
            .eq('id', realmId)
            .single()
        if (!realm || !realm.map_data || !Array.isArray(realm.map_data.rooms)) {
            setRooms([])
            setConnected([])
            return
        }
        setRooms(realm.map_data.rooms)
        // Para cada room, obtener conectados
        let allConnected: any[] = []
        for (let i = 0; i < realm.map_data.rooms.length; i++) {
            const res = await server.getPlayersInRoom(i)
            if (res.data && Array.isArray(res.data.players)) {
                allConnected = allConnected.concat(res.data.players.map((p: any) => ({...p, roomIndex: i, roomName: realm.map_data.rooms[i].name})))
            }
        }
        setConnected(allConnected)
    }

    async function kickPlayer(uid: string) {
        // Emitir evento de kick por WebSocket (requiere implementación en el cliente)
        // Aquí solo ejemplo de llamada:
        if (server.socket && server.socket.emit) {
            server.socket.emit('kickPlayer', { uid })
            toast.success('Usuario expulsado')
            fetchRoomsAndConnected()
        } else {
            toast.error('No se pudo expulsar al usuario (WebSocket no conectado)')
        }
    }

    async function removeMember(userId: string) {
        setModal('Loading')
        setLoadingText('Removing member...')

        const { error } = await supabase
            .from('visited_realms')
            .delete()
            .eq('user_id', userId)
            .eq('realm_share_id', shareId)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Member removed!')
            fetchJoinedMembers() // Refresh joined members list
        }

        revalidate('/manage/[id]')
        setModal('None')
    }

    async function fetchJoinedMembers() {
        // Obtener todos los usuarios que han visitado el realm (joined)
        const { data: visited, error: visitedError } = await supabase
            .from('visited_realms')
            .select('user_id')
            .eq('realm_share_id', shareId)
        if (!visited || visited.length === 0) {
            setJoinedMembers([])
            return
        }
        // Obtener perfiles de los usuarios unidos
        const userIds = visited.map((v: any) => v.user_id)
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, skin')
            .in('id', userIds)
        setJoinedMembers(profiles || [])
    }

    return (
        <div className='flex flex-col items-center pt-24'>
            <div className='flex flex-row gap-8 relative w-full max-w-4xl'>
                {/* Botón Volver */}
                <div className='absolute right-0 top-[-40px]'>
                    <Link href='/app'>
                        <BasicButton className='bg-primary text-white'>Volver</BasicButton>
                    </Link>
                </div>
                <div className='flex flex-col h-[500px] w-[200px] border-white border-r-2 pr-4 gap-2'>
                    <h1 className={`${selectedTab === 0 ? 'font-bold underline' : ''} cursor-pointer`} onClick={() => setSelectedTab(0)}>General</h1> 
                    <h1 className={`${selectedTab === 1 ? 'font-bold underline' : ''} cursor-pointer`} onClick={() => setSelectedTab(1)}>Sharing Options</h1> 
                    <h1 className={`${selectedTab === 2 ? 'font-bold underline' : ''} cursor-pointer`} onClick={() => setSelectedTab(2)}>Miembros</h1>
                </div>
                <div className='flex flex-col w-[300px]'>
                    {selectedTab === 0 && (
                        <div className='flex flex-col gap-2'>
                            Name
                            <BasicInput value={name} onChange={onNameChange} maxLength={32}/>
                        </div>
                    )}
                    {selectedTab === 1 && (
                        <div className='flex flex-col gap-2'>
                            <BasicButton className='flex flex-row items-center gap-2 text-sm max-w-max' onClick={copyLink}>
                                Copy Link <Copy />
                            </BasicButton>
                            <BasicButton className='flex flex-row items-center gap-2 text-sm max-w-max' onClick={generateNewLink}>
                                Generate New Link <Copy />
                            </BasicButton>
                        </div>
                    )}
                    {selectedTab === 2 && (
                        <div className='flex flex-col gap-2'>
                            <div className='font-bold'>Conectados ahora:</div>
                            {connected.length === 0 && <div>No hay usuarios conectados.</div>}
                            {connected.map((user: any) => (
                                <div key={user.uid} className='flex flex-row items-center justify-between p-2 rounded bg-blue-900 text-white'>
                                    <div>
                                        {user.username || user.uid} <span className='text-xs'>({user.roomName})</span>
                                    </div>
                                    {user.uid !== ownerId && (
                                        <BasicButton className='text-xs py-1 px-2' onClick={() => kickPlayer(user.uid)}>
                                            Expulsar
                                        </BasicButton>
                                    )}
                                </div>
                            ))}
                            <div className='font-bold mt-4'>Miembros unidos:</div>
                            {joinedMembers.length === 0 && <div>No hay miembros unidos a este realm.</div>}
                            {joinedMembers.map((member: any) => (
                                <div key={member.id} className={`flex flex-row items-center justify-between p-2 rounded bg-gray-800 text-white`}>
                                    <div>
                                        {member.username || member.email || member.id}
                                        {member.id === ownerId && <span className='ml-2 text-xs'>(Owner)</span>}
                                    </div>
                                    {member.id !== ownerId && (
                                        <BasicButton className='text-xs py-1 px-2' onClick={() => removeMember(member.id)}>
                                            Eliminar acceso
                                        </BasicButton>
                                    )}
                                </div>
                            ))}
                            <div className='font-bold mt-4'>Miembros históricos:</div>
                        </div>
                    )}
                    </div>
                <BasicButton className='absolute bottom-[-50px] right-0' onClick={save}>
                    Save
                </BasicButton>
            </div>
        </div>
    )
}

export default ManageChild