import React, { createContext, useContext, ReactNode, useEffect, useState, useMemo, useRef } from 'react'
import AgoraRTC, { 
    AgoraRTCProvider, 
} from 'agora-rtc-react'
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'
import signal from '../../utils/signal'
import { videoChat, forceRefreshVideoSubscriptions, forceRefreshAllStreams, recreateCorruptedTracks } from '../../utils/video-chat/video-chat'

interface VideoChatContextType {
    toggleCamera: () => void
    toggleMicrophone: () => void
    toggleScreenShare: () => void
    refreshVideoSubscriptions: () => void
    refreshAllStreams: () => void
    recreateCorruptedTracks: () => void
    isCameraMuted: boolean
    isMicMuted: boolean
    isScreenSharing: boolean
}

const VideoChatContext = createContext<VideoChatContextType | undefined>(undefined)

interface AgoraVideoChatProviderProps {
    children: ReactNode
    uid: string
}

interface VideoChatProviderProps {
  children: ReactNode
}

export const AgoraVideoChatProvider: React.FC<AgoraVideoChatProviderProps> = ({ children }) => {
    const client = useMemo(() => {
        const newClient = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" })
        AgoraRTC.setLogLevel(4)
        return newClient
    }, [])

    return (
        <AgoraRTCProvider client={client}>
            <VideoChatProvider>
                {children}
            </VideoChatProvider>
        </AgoraRTCProvider>
    )
}

const VideoChatProvider: React.FC<VideoChatProviderProps> = ({ children }) => {
    const [isCameraMuted, setIsCameraMuted] = useState(true)
    const [isMicMuted, setIsMicMuted] = useState(true)
    const [isScreenSharing, setIsScreenSharing] = useState(false)

    useEffect(() => {
        // Verificar permisos de cámara y micrófono al montar
        const checkPermissions = async () => {
            try {
                const permissions = await navigator.mediaDevices.getUserMedia({ 
                    audio: false, 
                    video: false 
                })
                permissions.getTracks().forEach(track => track.stop()) // Limpiar
            } catch (error) {
                // Permisos no disponibles
            }
        }
        
        checkPermissions()

        // Cleanup function que se ejecuta cuando el componente se desmonta
        return () => {
            videoChat.destroy()
        }
    }, [])

    const toggleCamera = async () => {
        try {
            const muted = await videoChat.toggleCamera()
            setIsCameraMuted(muted)
        } catch (error) {
            // Error in toggleCamera
        }
    }

    const toggleMicrophone = async () => {
        try {
            const muted = await videoChat.toggleMicrophone()
            setIsMicMuted(muted)
        } catch (error) {
            // Error in toggleMicrophone
        }
    }

    const toggleScreenShare = async () => {
        try {
            const isSharing = await videoChat.toggleScreenShare()
            setIsScreenSharing(isSharing)
        } catch (error) {
            // Error in toggleScreenShare
        }
    }

    const refreshVideoSubscriptions = async () => {
        try {
            await forceRefreshVideoSubscriptions()
        } catch (error) {
            // Error in refreshVideoSubscriptions
        }
    }

    const refreshAllStreams = async () => {
        try {
            await forceRefreshAllStreams()
        } catch (error) {
            // Error in refreshAllStreams
        }
    }

    const recreateCorruptedTracksHook = async () => {
        try {
            await recreateCorruptedTracks()
        } catch (error) {
            // Error in recreateCorruptedTracks
        }
    }

    const value: VideoChatContextType = {
        toggleCamera,
        toggleMicrophone,
        toggleScreenShare,
        refreshVideoSubscriptions,
        refreshAllStreams,
        recreateCorruptedTracks: recreateCorruptedTracksHook,
        isCameraMuted,
        isMicMuted,
        isScreenSharing,
    }

    return (
        <VideoChatContext.Provider value={value}>
            {children}
        </VideoChatContext.Provider>
    )
}

export const useVideoChat = () => {
  const context = useContext(VideoChatContext)
  if (context === undefined) {
    throw new Error('useVideoChat must be used within a VideoChatProvider')
  }
  return context
}