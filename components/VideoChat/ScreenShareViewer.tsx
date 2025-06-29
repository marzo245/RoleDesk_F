import React, { useEffect, useRef, useState } from 'react'
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'
import signal from '@/utils/signal'
import { X, Monitor } from '@phosphor-icons/react'

interface ScreenShareViewerProps {
    
}

const ScreenShareViewer: React.FC<ScreenShareViewerProps> = () => {
    const [screenSharingUser, setScreenSharingUser] = useState<IAgoraRTCRemoteUser | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onUserInfoUpdated = (user: IAgoraRTCRemoteUser) => {
            // Detectar si el usuario está compartiendo pantalla con mejor detección
            let isScreenSharing = false
            if (user.videoTrack) {
                const track = user.videoTrack.getMediaStreamTrack()
                if (track) {
                    // Verificar múltiples indicadores de screen share
                    isScreenSharing = track.label.includes('screen') || 
                                    track.label.includes('Screen') ||
                                    track.getSettings().displaySurface !== undefined
                    
                    // También verificar por dimensiones
                    const settings = track.getSettings()
                    if (settings.width && settings.height && 
                        (settings.width > 1280 || settings.height > 720)) {
                        isScreenSharing = true
                    }

                    // Verificar por UID si termina en _screen
                    if (user.uid.toString().endsWith('_screen')) {
                        isScreenSharing = true
                    }
                }
            }
            
            console.log(`ScreenShareViewer - User ${user.uid} sharing: ${isScreenSharing}`)
            
            if (isScreenSharing && !screenSharingUser) {
                console.log('ScreenShareViewer - Setting screen sharing user')
                setScreenSharingUser(user)
                // Removido: setIsVisible(true) - No abrir automáticamente
                
                // Notificar al VideoBar que se detectó pantalla compartida
                signal.emit('screen-share-detected', { user, isScreenShare: true })
            } else if (!isScreenSharing && screenSharingUser && user.uid === screenSharingUser.uid) {
                console.log('ScreenShareViewer - User stopped screen sharing')
                setScreenSharingUser(null)
                setIsVisible(false)
                
                // Notificar al VideoBar que se detuvo la pantalla compartida
                signal.emit('screen-share-detected', { user, isScreenShare: false })
            }
        }

        const onUserLeft = (user: IAgoraRTCRemoteUser) => {
            if (screenSharingUser && user.uid === screenSharingUser.uid) {
                setScreenSharingUser(null)
                setIsVisible(false)
            }
        }

        signal.on('user-info-updated', onUserInfoUpdated)
        signal.on('user-left', onUserLeft)

        return () => {
            signal.off('user-info-updated', onUserInfoUpdated)
            signal.off('user-left', onUserLeft)
        }
    }, [screenSharingUser])

    useEffect(() => {
        if (screenSharingUser && containerRef.current) {
            // Limpiar contenedor anterior
            if (containerRef.current.firstChild) {
                containerRef.current.removeChild(containerRef.current.firstChild)
            }
            
            // Intentar reproducir el video de pantalla compartida
            try {
                screenSharingUser.videoTrack?.play('screen-share-container')
                console.log('Playing screen share for user:', screenSharingUser.uid)
            } catch (error) {
                console.error('Error playing screen share:', error)
            }
        }
    }, [screenSharingUser])

    // Añadir un efecto para intentar detectar pantallas compartidas de manera más agresiva
    useEffect(() => {
        const checkForScreenShare = () => {
            // Buscar todos los elementos de video con dimensiones grandes
            const videos = document.querySelectorAll('video')
            videos.forEach(video => {
                if (video.videoWidth > 1280 || video.videoHeight > 720) {
                    console.log('Found potential screen share video:', video.videoWidth, 'x', video.videoHeight)
                }
            })
        }

        const interval = setInterval(checkForScreenShare, 2000)
        return () => clearInterval(interval)
    }, [])

    const closeScreenShare = () => {
        setIsVisible(false)
        setScreenSharingUser(null)
    }

    if (!isVisible || !screenSharingUser) {
        return null
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
            <div className="relative w-full h-full max-w-6xl max-h-screen p-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 text-white">
                    <div className="flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-[#08D6A0]" />
                        <span className="text-sm font-medium">
                            {screenSharingUser.uid.toString().slice(36)} está compartiendo pantalla
                        </span>
                    </div>
                    <button
                        onClick={closeScreenShare}
                        className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                        title="Cerrar vista de pantalla compartida"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Video Container */}
                <div 
                    ref={containerRef}
                    id="screen-share-container"
                    className="w-full h-full bg-gray-900 rounded-lg overflow-hidden"
                    style={{ maxHeight: 'calc(100vh - 120px)' }}
                />
            </div>
        </div>
    )
}

export default ScreenShareViewer
