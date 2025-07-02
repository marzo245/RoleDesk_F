import React, { useEffect, useRef, useState } from 'react'
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'
import signal from '@/utils/signal'
import { MicrophoneSlash, Monitor, ArrowsOut } from '@phosphor-icons/react'
import AnimatedCharacter from '@/app/play/SkinMenu/AnimatedCharacter'
import ScreenShareModal from './ScreenShareModal'

interface RemoteUser {
    uid: string
    baseUID: string // UID base sin sufijos
    micEnabled: boolean
    cameraEnabled: boolean
    isScreenSharing: boolean
    user: IAgoraRTCRemoteUser
}

const VideoBar:React.FC = () => {

    const [remoteUsers, setRemoteUsers] = useState<{ [uid: string]: RemoteUser }>({})
    const [fullscreenUser, setFullscreenUser] = useState<IAgoraRTCRemoteUser | null>(null)
    const [localUserUID, setLocalUserUID] = useState<string>('')

    // Función para extraer el UID base (sin sufijos como _screen)
    const getBaseUID = (uid: string): string => {
        return uid.replace(/_screen$/, '')
    }

    // Función para detectar si un UID es de pantalla compartida
    const isScreenSharingUID = (uid: string): boolean => {
        return uid.endsWith('_screen')
    }

    // Función para detectar si un stream es de pantalla compartida (fallback)
    const isScreenSharingStream = (user: IAgoraRTCRemoteUser): boolean => {
        // Primero verificar por UID
        if (isScreenSharingUID(user.uid.toString())) {
            return true
        }
        
        if (!user.videoTrack) return false
        
        const track = user.videoTrack.getMediaStreamTrack()
        if (!track) return false
        
        // Múltiples heurísticas para detectar screen share
        const label = track.label.toLowerCase()
        const isScreenByLabel = label.includes('screen') || label.includes('display')
        
        // Verificar por displaySurface
        const settings = track.getSettings()
        const isScreenByDisplaySurface = settings.displaySurface !== undefined
        
        // Verificar por dimensiones (pantallas suelen ser más grandes que cámaras)
        let isScreenByDimensions = false
        if (typeof settings.width === 'number' && typeof settings.height === 'number') {
            isScreenByDimensions = settings.width > 1280 || settings.height > 720
        }
        
        return isScreenByLabel || isScreenByDisplaySurface || isScreenByDimensions
    }

    useEffect(() => {
        const onUserInfoUpdated = (user: IAgoraRTCRemoteUser) => {
            const uid = user.uid.toString()
            const baseUID = getBaseUID(uid)
            const isScreenSharing = isScreenSharingUID(uid) || isScreenSharingStream(user)
            
            console.log(`VideoBar - Processing user ${uid}:`, {
                baseUID,
                localUserUID,
                isScreenSharing,
                hasVideo: user.hasVideo,
                shouldFilterScreenShare: localUserUID && baseUID === localUserUID && isScreenSharing
            })
            
            // Solo filtrar la pantalla compartida del usuario local, NO su cámara
            if (localUserUID && baseUID === localUserUID && isScreenSharing) {
                
                return
            }
            
            // Solo log cuando hay cambios significativos (video, audio o screen share)
            const hasContent = user.hasVideo || user.hasAudio || isScreenSharing
            if (hasContent) {
                console.log(`VideoBar - Adding/updating user ${uid}:`, {
                    baseUID,
                    isScreenSharing,
                    hasVideo: user.hasVideo,
                    hasAudio: user.hasAudio,
                    uidEndsWithScreen: uid.endsWith('_screen')
                })
            }
            
            setRemoteUsers(prev => {
                const updated = { ...prev, [uid]: {
                    uid: uid,
                    baseUID: baseUID,
                    micEnabled: user.hasAudio,
                    cameraEnabled: user.hasVideo && !isScreenSharing, // Solo es cámara si tiene video pero NO es screen share
                    isScreenSharing: isScreenSharing,
                    user: user,
                }}
                
                // Solo log cuando el número de usuarios cambia o hay contenido
                const userCountChanged = Object.keys(updated).length !== Object.keys(prev).length
                if (userCountChanged || hasContent) {
                    
                }
                return updated
            })
        }

        // Nuevo listener para detectar screen shares desde ScreenShareViewer
        const onScreenShareDetected = (data: { user: IAgoraRTCRemoteUser, isScreenShare: boolean }) => {
            
            if (data.isScreenShare) {
                onUserInfoUpdated(data.user)
            }
        }

        // Listener para solicitudes de información de cámara
        const onGetUserCamera = (targetBaseUID: string) => {
            
            
            
            // Buscar el usuario de cámara en los usuarios remotos actuales
            Object.values(remoteUsers).forEach(remoteUser => {
                const remoteBaseUID = getBaseUID(remoteUser.uid)
                console.log(`VideoBar - Checking remote user:`, {
                    uid: remoteUser.uid,
                    baseUID: remoteBaseUID,
                    targetBaseUID,
                    isScreenSharing: remoteUser.isScreenSharing,
                    hasVideoTrack: !!remoteUser.user?.videoTrack,
                    cameraEnabled: remoteUser.cameraEnabled
                })
                
                if (remoteBaseUID === targetBaseUID && !remoteUser.isScreenSharing) {
                    if (remoteUser.user?.videoTrack) {
                        
                        signal.emit('user-info-updated', remoteUser.user)
                    } else {
                        
                    }
                }
            })
            
            // También enviar información sobre todos los usuarios remotos
            
            const allUsersArray = Object.values(remoteUsers) || []
            
            signal.emit('get-all-remote-users', allUsersArray)
            
            // Si el usuario objetivo es el usuario local, obtener su información
            if (targetBaseUID === localUserUID) {
                
                // Importar videoChat para obtener información local
                import('../../utils/video-chat/video-chat').then(({ videoChat }) => {
                    const localInfo = videoChat.getLocalUserInfo()
                    
                    if (localInfo.hasVideo) {
                        signal.emit('user-info-updated', localInfo)
                    }
                })
            }
        }

        const onLocalUserUID = (uid: string) => {
            
            setLocalUserUID(uid)
        }

        const onResetUsers = () => {
            setRemoteUsers({})
            setLocalUserUID('') // Limpiar también el UID local
        }
        
        const onUserLeft = (user: IAgoraRTCRemoteUser) => {
            setRemoteUsers(prev => {
                const newUsers = { ...prev }
                delete newUsers[user.uid]
                return newUsers
            })
        }

        signal.on('user-info-updated', onUserInfoUpdated)
        signal.on('screen-share-detected', onScreenShareDetected)
        signal.on('local-user-uid', onLocalUserUID)
        signal.on('reset-users', onResetUsers)
        signal.on('user-left', onUserLeft)
        signal.on('get-user-camera', onGetUserCamera)
        return () => {
            signal.off('user-info-updated', onUserInfoUpdated)
            signal.off('screen-share-detected', onScreenShareDetected)
            signal.off('local-user-uid', onLocalUserUID)
            signal.off('reset-users', onResetUsers)
            signal.off('user-left', onUserLeft)
            signal.off('get-user-camera', onGetUserCamera)
        }

    }, [localUserUID])

    return (
        <main className='absolute z-10 w-full flex flex-col items-center pt-2 top-0'>
            {/* Agrupar usuarios por baseUID y mostrar todos sus streams */}
            <section className='flex flex-col items-center gap-6'>
                {(() => {
                    // Agrupar usuarios por baseUID
                    const userGroups: { [baseUID: string]: RemoteUser[] } = {}
                    Object.values(remoteUsers).forEach(user => {
                        if (!userGroups[user.baseUID]) {
                            userGroups[user.baseUID] = []
                        }
                        userGroups[user.baseUID].push(user)
                    })

                    
                    

                    // Renderizar cada grupo de usuario
                    return Object.entries(userGroups).map(([baseUID, users]) => {
                        const cameraUser = users.find(u => !u.isScreenSharing)
                        const screenUser = users.find(u => u.isScreenSharing)

                        console.log(`VideoBar - Rendering group ${baseUID}:`, {
                            cameraUser: cameraUser ? cameraUser.uid : 'none',
                            screenUser: screenUser ? screenUser.uid : 'none'
                        })

                        return (
                            <div key={baseUID} className='flex flex-col items-center gap-3'>
                                {/* Mostrar pantalla compartida si existe */}
                                {screenUser && (
                                    <div className='flex flex-col items-center gap-2'>
                                        <p className='text-xs text-green-400 font-medium flex items-center gap-1'>
                                            <Monitor className='w-3 h-3' />
                                            {baseUID.slice(-8)} está compartiendo pantalla
                                        </p>
                                        <RemoteUserScreenShare 
                                            user={screenUser} 
                                            onFullscreen={() => setFullscreenUser(screenUser.user)}
                                        />
                                    </div>
                                )}
                                
                                {/* Mostrar cámara si existe */}
                                {cameraUser && cameraUser.cameraEnabled && (
                                    <RemoteUser user={cameraUser} />
                                )}
                            </div>
                        )
                    })
                })()}
            </section>
            
            {/* Modal de pantalla completa */}
            {fullscreenUser && (
                <ScreenShareModal 
                    user={fullscreenUser}
                    onClose={() => setFullscreenUser(null)}
                />
            )}
        </main>
    )
}

export default VideoBar

function RemoteUserScreenShare({ user, onFullscreen }: { user: RemoteUser; onFullscreen: () => void }) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        console.log(`RemoteUserScreenShare - User ${user.uid}:`, {
            hasVideoTrack: !!user.user.videoTrack,
            isScreenSharing: user.isScreenSharing,
            cameraEnabled: user.cameraEnabled,
            videoTrackId: user.user.videoTrack?.getTrackId?.() || 'unknown'
        })
        
        // Para pantalla compartida, solo verificar que hay videoTrack, sin importar otros flags
        if (user.user.videoTrack) {
            // if the container has a child, remove it
            if (containerRef.current?.firstChild) {
                containerRef.current.removeChild(containerRef.current.firstChild)
            }

            
            try {
                user.user.videoTrack.play(`remote-screen-${user.uid}`)
                
            } catch (error) {
                
            }
        } else {
            
        }
    }, [user])

    return (
        <div className='w-[500px] h-[280px] bg-[#0f0f1d] bg-opacity-95 rounded-lg overflow-hidden relative border-2 border-green-500 group cursor-pointer hover:border-green-400 transition-colors'>
            <div 
                ref={containerRef} 
                id={`remote-screen-${user.uid}`} 
                className='w-full h-full flex items-center justify-center'
                style={{
                    background: '#000',
                    objectFit: 'contain'
                }}
            >
                {/* Contenedor interno para mantener aspect ratio */}
                <div 
                    className="w-full h-full"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        objectFit: 'contain'
                    }}
                />
            </div>
            
            {/* Overlay con controles */}
            <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center'>
                <button
                    onClick={onFullscreen}
                    className='opacity-0 group-hover:opacity-100 bg-black bg-opacity-70 text-white p-3 rounded-full hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2'
                >
                    <ArrowsOut className='w-5 h-5' />
                    <span className='text-sm font-medium'>Pantalla completa</span>
                </button>
            </div>
            
            <div className='absolute bottom-2 left-2 bg-black bg-opacity-80 rounded-full z-10 text-sm p-2 px-3 select-none flex flex-row items-center gap-2'>
                <Monitor className='w-4 h-4 text-green-400' />
                <span className='text-white'>Pantalla de {user.baseUID.slice(-8)}</span>
                {!user.micEnabled && <MicrophoneSlash className='w-4 h-4 text-[#FF2F49]' />}
            </div>
        </div>
    )
}

function RemoteUser({ user }: { user: RemoteUser }) {

    const containerRef = useRef<HTMLDivElement>(null)
    const [skin, setSkin] = useState<string>('')

    useEffect(() => {
        const onVideoSkin = (data: { skin: string, uid: string }) => {
            const userBaseUID = user.baseUID
            if (data.uid === userBaseUID) {
                setSkin(data.skin)
            }
        }

        signal.on('video-skin', onVideoSkin)
        signal.emit('getSkinForUid', user.baseUID)
        return () => {
            signal.off('video-skin', onVideoSkin)
        }
    }, [user.baseUID])

    useEffect(() => {
        if (user.cameraEnabled) {
            // if the container has a child, remove it
            if (containerRef.current?.firstChild) {
                containerRef.current.removeChild(containerRef.current.firstChild)
            }

            user.user.videoTrack?.play(`remote-user-${user.uid}`)
        }

    }, [user])

    return (
        <div className='w-[233px] h-[130px] bg-[#0f0f1d] bg-opacity-90 rounded-lg overflow-hidden relative'>
            <div className='absolute w-full h-full grid place-items-center'>
                <div className='w-[48px] h-[48px] bg-[#222222] rounded-full border-2 border-[#424A61] grid place-items-center overflow-hidden'>
                    {skin && <AnimatedCharacter src={`/sprites/characters/Character_${skin}.png`} noAnimation className='w-full h-full relative bottom-1'/>}
                </div>
            </div>
            <div ref={containerRef} id={`remote-user-${user.uid}`} className='w-full h-full'></div>
            <p className='absolute bottom-1 left-2 bg-black bg-opacity-70 rounded-full z-10 text-xs p-1 px-2 select-none flex flex-row items-center gap-1'>
                {!user.micEnabled && <MicrophoneSlash className='w-3 h-3 text-[#FF2F49]' />}
                {user.baseUID.slice(-8)}
            </p>
        </div>
    )
}
