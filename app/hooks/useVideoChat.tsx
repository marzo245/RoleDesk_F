import React, { createContext, useContext, ReactNode, useEffect, useState, useMemo, useRef } from 'react'
import AgoraRTC, { 
    AgoraRTCProvider, 
} from 'agora-rtc-react'
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'
import signal from '../../utils/signal'
import { videoChat } from '../../utils/video-chat/video-chat'

interface VideoChatContextType {
    toggleCamera: () => void
    toggleMicrophone: () => void
    toggleScreenShare: () => void
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
        console.log('VideoChatProvider: Component mounted')
        
        // Verificar permisos de cámara y micrófono al montar
        const checkPermissions = async () => {
            try {
                console.log('VideoChatProvider: Checking permissions...')
                const permissions = await navigator.mediaDevices.getUserMedia({ 
                    audio: false, 
                    video: false 
                })
                console.log('VideoChatProvider: Media permissions OK')
                permissions.getTracks().forEach(track => track.stop()) // Limpiar
            } catch (error) {
                console.log('VideoChatProvider: Media permissions issue:', error)
            }
        }
        
        checkPermissions()

        // Cleanup function que se ejecuta cuando el componente se desmonta
        return () => {
            console.log('VideoChatProvider unmounting, destroying videoChat...')
            videoChat.destroy()
        }
    }, [])

    const toggleCamera = async () => {
        console.log('Hook: toggleCamera called, current state:', isCameraMuted)
        try {
            const muted = await videoChat.toggleCamera()
            console.log('Hook: toggleCamera result:', muted)
            setIsCameraMuted(muted)
        } catch (error) {
            console.error('Hook: Error in toggleCamera:', error)
        }
    }

    const toggleMicrophone = async () => {
        console.log('Hook: toggleMicrophone called, current state:', isMicMuted)
        try {
            const muted = await videoChat.toggleMicrophone()
            console.log('Hook: toggleMicrophone result:', muted)
            setIsMicMuted(muted)
        } catch (error) {
            console.error('Hook: Error in toggleMicrophone:', error)
        }
    }

    const toggleScreenShare = async () => {
        console.log('Hook: toggleScreenShare called, current state:', isScreenSharing)
        try {
            const isSharing = await videoChat.toggleScreenShare()
            console.log('Hook: toggleScreenShare result:', isSharing)
            setIsScreenSharing(isSharing)
        } catch (error) {
            console.error('Hook: Error in toggleScreenShare:', error)
        }
    }

    const value: VideoChatContextType = {
        toggleCamera,
        toggleMicrophone,
        toggleScreenShare,
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