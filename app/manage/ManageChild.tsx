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

    // Polling automático para refrescar conectados cada 5 segundos en la pestaña de miembros
    useEffect(() => {
        if (selectedTab === 2) {
            fetchRoomsAndConnected();
            const interval = setInterval(() => {
                fetchRoomsAndConnected();
            }, 1000); // cada 1 segundo
            return () => clearInterval(interval);
        }
    }, [selectedTab]);

    useEffect(() => {
        async function connectSocketIfNeeded() {
            if (selectedTab === 2 && userId === ownerId && server.socket && !server.socket.connected) {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;
                await server.connect(realmId, userId, shareId, session.access_token);
            }
        }
        connectSocketIfNeeded();
        // eslint-disable-next-line
    }, [selectedTab, userId, ownerId, realmId, shareId]);

    async function fetchMembers() {
        setLoadingMembers(true);
        // Obtener el owner del realm
        const { data: realm, error: realmError } = await supabase
            .from('realms')
            .select('owner_id, share_id')
            .eq('id', realmId)
            .single();
        if (!realm) {
            setLoadingMembers(false);
            return;
        }
        setOwner(realm.owner_id);
        // Obtener todos los user_id y visited_at que han visitado el realm
        const { data: visited, error: visitedError } = await supabase
            .from('visited_realms')
            .select('user_id, visited_at')
            .eq('realm_share_id', realm.share_id);
        let userIds = visited ? visited.map((v: any) => v.user_id) : [];
        // Asegurarse de incluir al owner (sin visited_at)
        if (!userIds.includes(realm.owner_id)) {
            userIds.push(realm.owner_id);
        }
        let profiles: any[] = [];
        if (userIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, email, username')
                .in('id', userIds);
            profiles = profilesData || [];
        }
        // Unir perfiles con visited_at
        const members = profiles.map((profile: any) => {
            const visit = visited?.find((v: any) => v.user_id === profile.id);
            return {
                ...profile,
                visited_at: visit ? visit.visited_at : null
            };
        });
        setMembers(members);
        setLoadingMembers(false);
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
            .select('user_id, visited_at')
            .eq('realm_share_id', shareId)
        if (!visited || visited.length === 0) {
            setJoinedMembers([])
            return
        }
        // Obtener perfiles de los usuarios unidos
        const userIds = visited.map((v: any) => v.user_id)
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds)
        // Unir perfiles con visited_at
        const members = userIds.map((id: string) => {
            const profile = profiles?.find((p: any) => p.id === id) as { username?: string } || {};
            const visit = visited.find((v: any) => v.user_id === id);
            return {
                id,
                username: profile.username,
                visited_at: visit ? visit.visited_at : null
            };
        });
        setJoinedMembers(members)
    }

    return (
        <div className='flex flex-col items-center pt-24'>
            <div className='flex flex-row gap-8 relative w-full max-w-4xl bg-opacity-80 rounded-xl shadow-lg p-8' style={{background: 'rgba(20, 30, 60, 0.85)'}}> 
                {/* Botón Volver */}
                <div className='absolute right-0 top-[-40px]'>
                    <Link href='/app'>
                        <BasicButton className='bg-primary text-white shadow-md'>Volver</BasicButton>
                    </Link>
                </div>
                {/* Pestañas */}
                <div className='flex flex-col h-[500px] w-[220px] border-white border-r-2 pr-6 gap-4'>
                    <h1 className={`text-2xl font-bold mb-2 text-white`}>Administración</h1>
                    <div className='flex flex-col gap-2'>
                        <button className={`text-lg py-2 px-3 rounded transition-all ${selectedTab === 0 ? 'bg-blue-700 text-white font-bold' : 'bg-transparent text-blue-200 hover:bg-blue-800'}`} onClick={() => setSelectedTab(0)}>General</button>
                        <button className={`text-lg py-2 px-3 rounded transition-all ${selectedTab === 1 ? 'bg-blue-700 text-white font-bold' : 'bg-transparent text-blue-200 hover:bg-blue-800'}`} onClick={() => setSelectedTab(1)}>Opciones de Compartir</button>
                        <button className={`text-lg py-2 px-3 rounded transition-all ${selectedTab === 2 ? 'bg-blue-700 text-white font-bold' : 'bg-transparent text-blue-200 hover:bg-blue-800'}`} onClick={() => setSelectedTab(2)}>Miembros</button>
                    </div>
                </div>
                {/* Contenido de la pestaña */}
                <div className='flex flex-col w-[350px] gap-6'>
                    {selectedTab === 0 && (
                        <div className='flex flex-col gap-4'>
                            <h2 className='text-xl font-semibold text-blue-100 mb-2'>General</h2>
                            <label className='text-blue-200 mb-1'>Nombre del espacio</label>
                            <BasicInput value={name} onChange={onNameChange} maxLength={32}/>
                        </div>
                    )}
                    {selectedTab === 1 && (
                        <div className='flex flex-col gap-4'>
                            <h2 className='text-xl font-semibold text-blue-100 mb-2'>Opciones de Compartir</h2>
                            <BasicButton className='flex flex-row items-center gap-2 text-sm max-w-max bg-blue-600 hover:bg-blue-700 text-white shadow' onClick={copyLink}>
                                Copiar enlace <Copy />
                            </BasicButton>
                            <BasicButton className='flex flex-row items-center gap-2 text-sm max-w-max bg-blue-600 hover:bg-blue-700 text-white shadow' onClick={generateNewLink}>
                                Generar nuevo enlace <Copy />
                            </BasicButton>
                        </div>
                    )}
                    {selectedTab === 2 && (
                        <div className='flex flex-col gap-4'>
                            <h2 className='text-xl font-semibold text-blue-100 mb-2'>Miembros conectados</h2>
                            {connected.length === 0 && <div className='text-blue-300 italic'>No hay usuarios conectados.</div>}
                            {connected.map((user: any) => (
                                <div
                                    key={user.uid}
                                    className={`flex items-center justify-between p-3 mb-2 rounded-lg shadow transition-all bg-gradient-to-r from-blue-900 to-blue-700 text-white border-l-4 ${user.uid === ownerId ? 'border-yellow-400' : 'border-blue-500'}`}
                                >
                                    <div className='flex items-center gap-3'>
                                        <span className='inline-block bg-blue-800 rounded-full p-2'>
                                            <svg width='24' height='24' fill='currentColor'><circle cx='12' cy='12' r='10' /></svg>
                                        </span>
                                        <div>
                                            <div className='font-semibold text-lg'>
                                                {user.username || user.uid}
                                                {user.uid === ownerId && (
                                                    <span className='ml-2 px-2 py-1 text-xs rounded bg-yellow-400 text-black font-bold'>Owner</span>
                                                )}
                                            </div>
                                            <div className='text-xs text-blue-200'>{user.roomName}</div>
                                        </div>
                                    </div>
                                    {user.uid !== ownerId && (
                                        <BasicButton
                                            className='text-xs py-1 px-3 bg-red-600 hover:bg-red-700 rounded shadow'
                                            onClick={() => kickPlayer(user.uid)}
                                        >
                                            Expulsar
                                        </BasicButton>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <BasicButton className='absolute bottom-[-50px] right-0 bg-green-600 hover:bg-green-700 text-white shadow' onClick={save}>
                    Guardar cambios
                </BasicButton>
            </div>
        </div>
    )
}

export default ManageChild