import React, { createContext, useContext, ReactNode, useEffect, useState, useMemo, useRef } from 'react'
import signal from '../../utils/signal'
import { videoChat } from '../../utils/video-chat/video-chat'
import { AgoraSecurityManager } from '../../utils/video-chat/security-manager'

// Dynamic imports para evitar que Agora se cargue en contextos inseguros
let AgoraRTC: any = null
let AgoraRTCProvider: any = null

// Función para cargar Agora dinámicamente solo cuando es seguro
const loadAgoraSDK = async () => {
    if (AgoraRTC) return { AgoraRTC, AgoraRTCProvider }
    
    try {
        const agoraModule = await import('agora-rtc-react')
        const agoraSDK = await import('agora-rtc-sdk-ng')
        
        AgoraRTC = agoraSDK.default
        AgoraRTCProvider = agoraModule.AgoraRTCProvider
        
        return { AgoraRTC, AgoraRTCProvider }
    } catch (error) {
        console.error('Failed to load Agora SDK:', error)
        throw error
    }
}

interface VideoChatContextType {
    toggleCamera: () => void
    toggleMicrophone: () => void
    toggleScreenShare: () => void
    isCameraMuted: boolean
    isMicMuted: boolean
    isScreenSharing: boolean
    webrtcAvailable: boolean
    securityInfo: any
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
    const [client, setClient] = useState<any>(null)
    const [agoraLoaded, setAgoraLoaded] = useState(false)
    const [loadingError, setLoadingError] = useState<string | null>(null)

    useEffect(() => {
        const initializeAgora = async () => {
            try {
                // Verificar si WebRTC está disponible antes de cargar Agora
                const securityCheck = AgoraSecurityManager.checkSecurityContext()
                
                if (!securityCheck.canUseWebRTC) {
                    console.warn('WebRTC not available, skipping Agora initialization:', securityCheck.errors)
                    setAgoraLoaded(true) // Marcar como "cargado" para evitar bucles
                    return
                }
                
                // Cargar Agora dinámicamente
                console.log('Loading Agora SDK...')
                const { AgoraRTC: AgoraRTCModule } = await loadAgoraSDK()
                
                // Crear cliente solo después de cargar el SDK
                const newClient = AgoraRTCModule.createClient({ codec: "vp8", mode: "rtc" })
                AgoraRTCModule.setLogLevel(4)
                
                setClient(newClient)
                setAgoraLoaded(true)
                console.log('Agora SDK loaded successfully')
                
            } catch (error) {
                console.error('Failed to initialize Agora:', error)
                setLoadingError(error instanceof Error ? error.message : 'Unknown error')
                setAgoraLoaded(true)
            }
        }

        initializeAgora()
    }, [])

    // Mostrar loading mientras se carga Agora
    if (!agoraLoaded) {
        return (
            <VideoChatProvider>
                {children}
            </VideoChatProvider>
        )
    }

    // Si hay error de carga o no hay cliente válido, usar solo VideoChatProvider
    if (loadingError || !client) {
        return (
            <VideoChatProvider>
                {children}
            </VideoChatProvider>
        )
    }

    // Solo usar AgoraRTCProvider si tenemos cliente válido y Agora cargado
    const DynamicAgoraRTCProvider = AgoraRTCProvider
    
    return (
        <DynamicAgoraRTCProvider client={client}>
            <VideoChatProvider>
                {children}
            </VideoChatProvider>
        </DynamicAgoraRTCProvider>
    )
}

const VideoChatProvider: React.FC<VideoChatProviderProps> = ({ children }) => {
    const [isCameraMuted, setIsCameraMuted] = useState(true)
    const [isMicMuted, setIsMicMuted] = useState(true)
    const [isScreenSharing, setIsScreenSharing] = useState(false)
    const [webrtcAvailable, setWebrtcAvailable] = useState(false)
    const [securityInfo, setSecurityInfo] = useState<any>(null)

    useEffect(() => {
        console.log('VideoChatProvider: Component mounted')
        
        // Verificar estado de seguridad
        const checkSecurity = async () => {
            console.log('VideoChatProvider: Checking security context...')
            const envInfo = AgoraSecurityManager.getEnvironmentInfo()
            console.log('VideoChatProvider: Environment info:', envInfo)
            setSecurityInfo(envInfo)
            setWebrtcAvailable(envInfo.canUseWebRTC)
            console.log('VideoChatProvider: Setting webrtcAvailable to:', envInfo.canUseWebRTC)
            
            if (!envInfo.canUseWebRTC) {
                console.warn('VideoChatProvider: WebRTC not available:', envInfo.errors)
                return
            }
            
            // Solo verificar permisos si WebRTC está disponible
            try {
                console.log('VideoChatProvider: Checking permissions...')
                const capabilities = await AgoraSecurityManager.initializeWithFallback()
                console.log('VideoChatProvider: Capabilities check result:', capabilities)
            } catch (error) {
                console.log('VideoChatProvider: Capabilities check failed:', error)
            }
        }
        
        checkSecurity()

        // Cleanup function que se ejecuta cuando el componente se desmonta
        return () => {
            console.log('VideoChatProvider unmounting, destroying videoChat...')
            videoChat.destroy()
        }
    }, [])

    const toggleCamera = async () => {
        console.log('Hook: toggleCamera called, current state:', isCameraMuted)
        
        if (!webrtcAvailable) {
            console.warn('Camera not available: WebRTC context not secure')
            alert('Camera requires HTTPS or localhost. Please use a secure connection.')
            return
        }
        
        try {
            const muted = await videoChat.toggleCamera()
            console.log('Hook: toggleCamera result:', muted)
            setIsCameraMuted(muted)
        } catch (error: any) {
            console.error('Hook: Error in toggleCamera:', error)
            
            if (error.message?.includes('HTTPS') || error.message?.includes('localhost')) {
                alert('Camera access blocked by browser security. Please use HTTPS or localhost.')
            } else {
                alert('Failed to access camera: ' + error.message)
            }
        }
    }

    const toggleMicrophone = async () => {
        console.log('Hook: toggleMicrophone called, current state:', isMicMuted)
        
        if (!webrtcAvailable) {
            console.warn('Microphone not available: WebRTC context not secure')
            alert('Microphone requires HTTPS or localhost. Please use a secure connection.')
            return
        }
        
        try {
            const muted = await videoChat.toggleMicrophone()
            console.log('Hook: toggleMicrophone result:', muted)
            setIsMicMuted(muted)
        } catch (error: any) {
            console.error('Hook: Error in toggleMicrophone:', error)
            
            if (error.message?.includes('HTTPS') || error.message?.includes('localhost')) {
                alert('Microphone access blocked by browser security. Please use HTTPS or localhost.')
            } else {
                alert('Failed to access microphone: ' + error.message)
            }
        }
    }

    const toggleScreenShare = async () => {
        console.log('Hook: toggleScreenShare called, current state:', isScreenSharing)
        
        if (!webrtcAvailable) {
            console.warn('Screen share not available: WebRTC context not secure')
            alert('Screen sharing requires HTTPS or localhost. Please use a secure connection.')
            return
        }
        
        try {
            const isSharing = await videoChat.toggleScreenShare()
            console.log('Hook: toggleScreenShare result:', isSharing)
            setIsScreenSharing(isSharing)
        } catch (error: any) {
            console.error('Hook: Error in toggleScreenShare:', error)
            
            if (error.message?.includes('HTTPS') || error.message?.includes('localhost')) {
                alert('Screen sharing blocked by browser security. Please use HTTPS or localhost.')
            } else {
                alert('Failed to start screen sharing: ' + error.message)
            }
        }
    }

    const value: VideoChatContextType = {
        toggleCamera,
        toggleMicrophone,
        toggleScreenShare,
        isCameraMuted,
        isMicMuted,
        isScreenSharing,
        webrtcAvailable,
        securityInfo,
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