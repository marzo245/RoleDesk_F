import React, { useEffect, useRef, useState } from 'react'
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'
import { X, Monitor, VideoCamera } from '@phosphor-icons/react'
import signal from '@/utils/signal'

interface ScreenShareModalProps {
    user: IAgoraRTCRemoteUser
    onClose: () => void
}

const ScreenShareModal: React.FC<ScreenShareModalProps> = ({ user, onClose }) => {
    const screenContainerRef = useRef<HTMLDivElement>(null)
    const cameraContainerRef = useRef<HTMLDivElement>(null)
    const [userName, setUserName] = useState<string>('')
    const [cameraUser, setCameraUser] = useState<IAgoraRTCRemoteUser | null>(null)

    // Función mejorada de cierre que limpia estilos antes de cerrar
    const handleClose = () => {
        // Limpiar estilos inmediatamente
        const cleanupStyles = () => {
            const videoElement = document.querySelector(`#screen-share-${user.uid} video`)
            const container = document.querySelector(`#screen-share-${user.uid}`)
            
            if (videoElement) {
                videoElement.style.removeProperty('width')
                videoElement.style.removeProperty('height') 
                videoElement.style.removeProperty('object-fit')
                videoElement.style.removeProperty('background-color')
                videoElement.style.removeProperty('max-width')
                videoElement.style.removeProperty('max-height')
            }
            
            if (container) {
                container.style.removeProperty('width')
                container.style.removeProperty('height')
                container.style.removeProperty('display')
                container.style.removeProperty('align-items')
                container.style.removeProperty('justify-content')
            }
        }
        
        cleanupStyles()
        
        // Llamar el onClose original después de limpiar
        onClose()
    }

    useEffect(() => {
        // Obtener nombre del usuario - usar el UID completo en lugar de solo los últimos caracteres
        const baseUid = user.uid.toString().replace('_screen', '')
        
        // Usar el UID completo o formatear de manera más inteligente
        let displayName = baseUid
        if (baseUid.length > 15) {
            // Si es muy largo, mostrar primeros y últimos caracteres
            displayName = `${baseUid.slice(0, 8)}...${baseUid.slice(-4)}`
        }
        setUserName(displayName)
        
        // Reproducir el video de pantalla compartida
        if (user.videoTrack && screenContainerRef.current) {
            try {
                user.videoTrack.play(`screen-share-${user.uid}`)
                
                // Aplicar estilos para que el video se ajuste correctamente sin recortes
                setTimeout(() => {
                    const container = document.querySelector(`#screen-share-${user.uid}`)
                    const videoElement = document.querySelector(`#screen-share-${user.uid} video`)
                    
                    if (container) {
                        container.style.width = '100%'
                        container.style.height = '100%'
                        container.style.display = 'flex'
                        container.style.alignItems = 'center'
                        container.style.justifyContent = 'center'
                    }
                    
                    if (videoElement) {
                        videoElement.style.width = '100%'
                        videoElement.style.height = '100%'
                        videoElement.style.objectFit = 'contain'
                        videoElement.style.backgroundColor = 'black'
                        videoElement.style.maxWidth = '100%'
                        videoElement.style.maxHeight = '100%'
                    }
                    
                    // Verificar de nuevo después de un tiempo adicional por si el video tarda en renderizar
                    setTimeout(() => {
                        const lateVideoElement = document.querySelector(`#screen-share-${user.uid} video`)
                        if (lateVideoElement) {
                            lateVideoElement.style.width = '100%'
                            lateVideoElement.style.height = '100%'
                            lateVideoElement.style.objectFit = 'contain'
                            lateVideoElement.style.backgroundColor = 'black'
                            lateVideoElement.style.maxWidth = '100%'
                            lateVideoElement.style.maxHeight = '100%'
                        }
                    }, 500)
                }, 100)
                
            } catch (error) {
                // Error silenciado
            }
        }

        // Buscar la cámara del usuario inmediatamente y solicitar información actualizada
        
        // Emitir señal para obtener información actualizada
        signal.emit('get-user-camera', baseUid)
        
        // También intentar obtener todos los usuarios remotos directamente
        setTimeout(() => {
            signal.emit('get-all-remote-users')
        }, 100)

        // Listener para encontrar la cámara del mismo usuario
        const onUserInfoUpdated = (remoteUser: IAgoraRTCRemoteUser | any) => {
            // Manejar tanto usuarios remotos como locales
            const userUid = remoteUser.uid?.toString() || remoteUser.uid
            const remoteBaseUid = userUid.replace('_screen', '')
            
            // Buscar usuario con el mismo baseUID que NO sea pantalla compartida
            if (remoteBaseUid === baseUid && !userUid.endsWith('_screen') && remoteUser.videoTrack) {
                setCameraUser(remoteUser)
            }
        }
        
        // También manejar el caso del usuario local
        const onLocalUserInfo = (localUser: any) => {
            if (localUser && localUser.uid === baseUid && localUser.videoTrack) {
                setCameraUser(localUser)
            }
        }
        
        // Manejar información de todos los usuarios remotos
        const onAllRemoteUsers = (allUsers: any[]) => {
            // Verificar que allUsers es un array válido
            if (!Array.isArray(allUsers) || allUsers.length === 0) {
                return
            }
            
            const targetUser = allUsers.find(u => {
                if (!u || !u.uid) return false
                const userBaseUid = u.uid.toString().replace('_screen', '')
                return userBaseUid === baseUid && !u.isScreenSharing && u.user?.videoTrack
            })
            
            if (targetUser) {
                setCameraUser(targetUser.user)
            }
        }

        signal.on('user-info-updated', onUserInfoUpdated)
        signal.on('local-user-info', onLocalUserInfo)
        signal.on('get-all-remote-users', onAllRemoteUsers)

        // Función de limpieza cuando el modal se cierre
        return () => {
            // Limpiar estilos aplicados al video de pantalla compartida
            const restoreScreenStyles = () => {
                const videoElement = document.querySelector(`#screen-share-${user.uid} video`)
                const containerDiv = document.querySelector(`#screen-share-${user.uid} > div`)
                const container = document.querySelector(`#screen-share-${user.uid}`)
                
                if (videoElement) {
                    // Restaurar estilos normales para el video
                    videoElement.style.width = ''
                    videoElement.style.height = ''
                    videoElement.style.objectFit = ''
                    videoElement.style.backgroundColor = ''
                    videoElement.style.maxWidth = ''
                    videoElement.style.maxHeight = ''
                }
                
                if (container) {
                    // Restaurar estilos normales para el contenedor
                    container.style.width = ''
                    container.style.height = ''
                    container.style.display = ''
                    container.style.alignItems = ''
                    container.style.justifyContent = ''
                }
                
                if (containerDiv) {
                    // Restaurar estilos del div interno
                    containerDiv.style.width = ''
                    containerDiv.style.height = ''
                    containerDiv.style.display = ''
                    containerDiv.style.alignItems = ''
                    containerDiv.style.justifyContent = ''
                }
            }
            
            // Ejecutar limpieza inmediatamente y con delay para asegurar que funcione
            restoreScreenStyles()
            setTimeout(restoreScreenStyles, 100)
            
            // Limpiar listeners
            signal.off('user-info-updated', onUserInfoUpdated)
            signal.off('local-user-info', onLocalUserInfo)
            signal.off('get-all-remote-users', onAllRemoteUsers)
        }
    }, [user])

    // Reproducir video de cámara cuando esté disponible
    useEffect(() => {
        if (cameraUser && cameraUser.videoTrack && cameraContainerRef.current) {
            const userId = cameraUser.uid || cameraUser.baseUID || 'local'
            try {
                cameraUser.videoTrack.play(`camera-${userId}`)
                
                // Aplicar estilos para que la cámara se ajuste correctamente
                setTimeout(() => {
                    const container = document.querySelector(`#camera-${userId}`)
                    const videoElement = document.querySelector(`#camera-${userId} video`)
                    
                    if (container) {
                        container.style.width = '100%'
                        container.style.height = '100%'
                        container.style.display = 'flex'
                        container.style.alignItems = 'center'
                        container.style.justifyContent = 'center'
                    }
                    
                    if (videoElement) {
                        videoElement.style.width = '100%'
                        videoElement.style.height = '100%'
                        videoElement.style.objectFit = 'cover'
                        videoElement.style.borderRadius = '8px'
                    }
                }, 100)
                
            } catch (error) {
                // Error silenciado
            }
        }
    }, [cameraUser])

    // Aplicar estilos a la pantalla compartida para evitar recortes
    useEffect(() => {
        if (user.videoTrack && screenContainerRef.current) {
            // Aplicar estilos múltiples veces para asegurar que funcionen
            const applyScreenStyles = () => {
                const videoElement = document.querySelector(`#screen-share-${user.uid} video`)
                const containerDiv = document.querySelector(`#screen-share-${user.uid} > div`)
                
                if (videoElement) {
                    videoElement.style.width = '100%'
                    videoElement.style.height = '100%'
                    videoElement.style.objectFit = 'contain'
                    videoElement.style.backgroundColor = 'black'
                    videoElement.style.maxWidth = '100%'
                    videoElement.style.maxHeight = '100%'
                }
                
                if (containerDiv) {
                    containerDiv.style.width = '100%'
                    containerDiv.style.height = '100%'
                    containerDiv.style.display = 'flex'
                    containerDiv.style.alignItems = 'center'
                    containerDiv.style.justifyContent = 'center'
                }
            }
            
            // Aplicar estilos en múltiples momentos para asegurar que funcionen
            setTimeout(applyScreenStyles, 100)
            setTimeout(applyScreenStyles, 500)
            setTimeout(applyScreenStyles, 1000)
        }
    }, [user, user.videoTrack])

    // Efecto para limpiar estilos cuando el componente se desmonta
    useEffect(() => {
        return () => {
            // Limpiar cualquier estilo residual
            setTimeout(() => {
                const videoElement = document.querySelector(`#screen-share-${user.uid} video`)
                const container = document.querySelector(`#screen-share-${user.uid}`)
                
                if (videoElement) {
                    videoElement.style.removeProperty('width')
                    videoElement.style.removeProperty('height')
                    videoElement.style.removeProperty('object-fit')
                    videoElement.style.removeProperty('background-color')
                    videoElement.style.removeProperty('max-width')
                    videoElement.style.removeProperty('max-height')
                }
                
                if (container) {
                    container.style.removeProperty('width')
                    container.style.removeProperty('height')
                    container.style.removeProperty('display')
                    container.style.removeProperty('align-items')
                    container.style.removeProperty('justify-content')
                }
            }, 50)
        }
    }, [])

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm"
            onClick={handleClose}
        >
                <div 
                    className="relative w-[95vw] h-[90vh] max-w-7xl bg-gray-800 rounded-xl overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 to-transparent p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-white">
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-600/80 rounded-full">
                                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                                <Monitor className="w-5 h-5 text-green-200" />
                                <span className="text-sm font-medium">{userName} está compartiendo pantalla</span>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all duration-200 hover:scale-105"
                            title="Cerrar pantalla compartida"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Main Content - Layout mejorado */}
                <div className="w-full h-full flex gap-6 p-6">
                    {/* Cámara del usuario - Panel izquierdo con mejor proporción */}
                    <div className="w-96 h-full bg-gray-800 rounded-lg shadow-lg flex flex-col overflow-hidden">
                        <div className="flex items-center justify-center p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                            <VideoCamera className="w-5 h-5 mr-2 text-blue-200" />
                            <span className="font-medium">Cámara de {userName}</span>
                        </div>
                        <div className="flex-1 p-4 flex items-center justify-center">
                            {cameraUser && cameraUser.videoTrack ? (
                                <div className="relative w-full max-w-sm">
                                    <div
                                        ref={cameraContainerRef}
                                        id={`camera-${cameraUser.uid || cameraUser.baseUID || 'local'}`}
                                        className="w-full bg-black rounded-lg overflow-hidden shadow-md"
                                        style={{ 
                                            aspectRatio: '16/9',
                                            minHeight: '200px',
                                            maxHeight: '300px'
                                        }}
                                    />
                                    {/* Overlay sutil para mejor presentación */}
                                    <div className="absolute inset-0 rounded-lg ring-2 ring-blue-400/30 pointer-events-none"></div>
                                </div>
                            ) : (
                                <div className="w-full max-w-sm aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
                                    <div className="text-center text-gray-400">
                                        <VideoCamera className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                                        <p className="text-sm font-medium">Cámara no disponible</p>
                                        <p className="text-xs text-gray-500 mt-1">El usuario no está compartiendo su cámara</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Info adicional */}
                        <div className="p-3 bg-gray-700/50 text-center">
                            <p className="text-xs text-gray-400">
                                Vista de cámara en tiempo real
                            </p>
                        </div>
                    </div>

                    {/* Pantalla compartida - Panel principal */}
                    <div className="flex-1 h-full bg-gray-900 rounded-lg shadow-lg flex flex-col overflow-hidden">
                        <div className="flex items-center justify-center p-3 bg-gradient-to-r from-green-600 to-green-700 text-white">
                            <Monitor className="w-5 h-5 mr-2 text-green-200" />
                            <span className="font-medium">Pantalla compartida por {userName}</span>
                        </div>
                        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                            <div className="relative w-full h-full flex items-center justify-center">
                                <div
                                    ref={screenContainerRef}
                                    id={`screen-share-${user.uid}`}
                                    className="w-full h-full bg-black flex items-center justify-center"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%'
                                    }}
                                >
                                    {/* Fallback content mientras se carga */}
                                    {!user.videoTrack && (
                                        <div className="w-full h-full flex items-center justify-center text-white">
                                            <div className="text-center">
                                                <Monitor className="w-20 h-20 mx-auto mb-6 text-gray-400" />
                                                <p className="text-xl font-medium mb-2">Conectando con la pantalla compartida...</p>
                                                <p className="text-sm text-gray-400">de {userName}</p>
                                                <div className="mt-4">
                                                    <div className="animate-pulse flex space-x-2 justify-center">
                                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Info adicional */}
                        <div className="p-3 bg-gray-800/50 text-center">
                            <p className="text-xs text-gray-400">
                                Pantalla en tiempo real • Haz clic fuera del modal o en "Cerrar" para salir
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer con controles mejorados */}
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 to-transparent p-6">
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={handleClose}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-700/80 hover:bg-gray-600/80 text-white rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                        >
                            <X className="w-5 h-5" />
                            Cerrar vista completa
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-lg text-gray-300 text-sm backdrop-blur-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            En vivo
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ScreenShareModal
