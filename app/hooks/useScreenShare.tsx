import { useState, useEffect } from 'react'
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'
import signal from '@/utils/signal'

export const useScreenShare = () => {
    const [screenShareUser, setScreenShareUser] = useState<IAgoraRTCRemoteUser | null>(null)
    const [isLocalScreenSharing, setIsLocalScreenSharing] = useState(false)

    // Función para detectar si un stream es de pantalla compartida
    const isScreenSharingStream = (user: IAgoraRTCRemoteUser): boolean => {
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
            if (isScreenSharingStream(user)) {
                console.log(`Detected screen sharing from user: ${user.uid}`)
                setScreenShareUser(user)
            } else {
                // Si el usuario ya no está compartiendo pantalla, limpiar
                if (screenShareUser && user.uid === screenShareUser.uid) {
                    console.log(`User ${user.uid} stopped screen sharing`)
                    setScreenShareUser(null)
                }
            }
        }

        const onUserLeft = (user: IAgoraRTCRemoteUser) => {
            if (screenShareUser && user.uid === screenShareUser.uid) {
                console.log(`Screen sharing user left: ${user.uid}`)
                setScreenShareUser(null)
            }
        }

        const onResetUsers = () => {
            setScreenShareUser(null)
        }

        const onLocalScreenShareStarted = () => {
            console.log('Local screen sharing started')
            setIsLocalScreenSharing(true)
        }

        const onLocalScreenShareStopped = () => {
            console.log('Local screen sharing stopped')
            setIsLocalScreenSharing(false)
        }

        // Suscribirse a eventos
        signal.on('user-info-updated', onUserInfoUpdated)
        signal.on('user-left', onUserLeft)
        signal.on('reset-users', onResetUsers)
        signal.on('local-screen-share-started', onLocalScreenShareStarted)
        signal.on('local-screen-share-stopped', onLocalScreenShareStopped)

        return () => {
            signal.off('user-info-updated', onUserInfoUpdated)
            signal.off('user-left', onUserLeft)
            signal.off('reset-users', onResetUsers)
            signal.off('local-screen-share-started', onLocalScreenShareStarted)
            signal.off('local-screen-share-stopped', onLocalScreenShareStopped)
        }
    }, [screenShareUser])

    const closeScreenShare = () => {
        setScreenShareUser(null)
    }

    return {
        screenShareUser,
        isLocalScreenSharing,
        closeScreenShare
    }
}
