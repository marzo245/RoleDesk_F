export interface SecurityContextCheck {
  isSecureContext: boolean
  isLocalhost: boolean
  isHTTPS: boolean
  canUseWebRTC: boolean
  errors: string[]
}

// Dynamic import para evitar cargar Agora en contextos inseguros
let AgoraRTC: any = null

const loadAgoraSDK = async () => {
  if (AgoraRTC) return AgoraRTC
  
  try {
    const agoraModule = await import('agora-rtc-sdk-ng')
    AgoraRTC = agoraModule.default
    return AgoraRTC
  } catch (error) {
    console.error('Failed to load Agora SDK in security manager:', error)
    throw error
  }
}

export class AgoraSecurityManager {
  static checkSecurityContext(): SecurityContextCheck {
    const errors: string[] = []
    
    // Verificar si estamos en un contexto seguro
    const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : false
    const isLocalhost = typeof window !== 'undefined' ? 
      ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) : false
    const isHTTPS = typeof window !== 'undefined' ? 
      window.location.protocol === 'https:' : false
    
    // Verificar si getUserMedia está disponible
    const hasGetUserMedia = typeof navigator !== 'undefined' && 
      navigator.mediaDevices && 
      typeof navigator.mediaDevices.getUserMedia === 'function'
    
    // Verificar si enumerateDevices está disponible
    const hasEnumerateDevices = typeof navigator !== 'undefined' && 
      navigator.mediaDevices && 
      typeof navigator.mediaDevices.enumerateDevices === 'function'
    
    // WebRTC está disponible si:
    // 1. Tenemos contexto seguro (HTTPS o localhost)
    // 2. Y tenemos acceso a las APIs de media
    const canUseWebRTC = (isSecureContext || isLocalhost) && hasGetUserMedia && hasEnumerateDevices
    
    if (!isSecureContext && !isLocalhost) {
      errors.push('Your context is limited by web security, please try using https protocol or localhost.')
    }
    
    if (!hasGetUserMedia) {
      errors.push('getUserMedia() not supported in this environment.')
    }
    
    if (!hasEnumerateDevices) {
      errors.push('enumerateDevices() not supported in this environment.')
    }
    
    console.log('SecurityManager: Security check results:', {
      isSecureContext,
      isLocalhost,
      isHTTPS,
      hasGetUserMedia,
      hasEnumerateDevices,
      canUseWebRTC,
      errors
    })
    
    return {
      isSecureContext,
      isLocalhost,
      isHTTPS,
      canUseWebRTC,
      errors
    }
  }
  
  static async initializeWithFallback(): Promise<{
    canUseVideo: boolean
    canUseAudio: boolean
    errors: string[]
  }> {
    const securityCheck = this.checkSecurityContext()
    const result = {
      canUseVideo: false,
      canUseAudio: false,
      errors: [...securityCheck.errors]
    }
    
    if (!securityCheck.canUseWebRTC) {
      console.warn('WebRTC not available in this context:', securityCheck.errors)
      return result
    }
    
    // Intentar obtener permisos de audio/video gradualmente
    try {
      // Primero intentar solo audio
      await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      result.canUseAudio = true
      console.log('Audio permissions granted')
    } catch (audioError) {
      console.warn('Audio permissions denied:', audioError)
      result.errors.push('Audio permissions denied or not available')
    }
    
    try {
      // Luego intentar video
      await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
      result.canUseVideo = true
      console.log('Video permissions granted')
    } catch (videoError) {
      console.warn('Video permissions denied:', videoError)
      result.errors.push('Video permissions denied or not available')
    }
    
    return result
  }
  
  static async createSafeAgoraClient(config: { codec: string; mode: string }) {
    try {
      const AgoraRTCModule = await loadAgoraSDK()
      const client = AgoraRTCModule.createClient(config as any)
      console.log('Agora client created successfully')
      return client
    } catch (error) {
      console.error('Failed to create Agora client:', error)
      throw new Error('Failed to initialize Agora client in this environment')
    }
  }
  
  static async safeCreateCameraTrack(options?: any) {
    const securityCheck = this.checkSecurityContext()
    
    if (!securityCheck.canUseWebRTC) {
      throw new Error('Camera not available: ' + securityCheck.errors.join(', '))
    }

    try {
      const AgoraRTCModule = await loadAgoraSDK()
      return await AgoraRTCModule.createCameraVideoTrack(options)
    } catch (error: any) {
      if (error.message?.includes('context is limited')) {
        throw new Error('Camera access blocked by browser security. Use HTTPS or localhost.')
      }
      throw error
    }
  }
  
  static async safeCreateMicrophoneTrack(options?: any) {
    const securityCheck = this.checkSecurityContext()
    
    if (!securityCheck.canUseWebRTC) {
      throw new Error('Microphone not available: ' + securityCheck.errors.join(', '))
    }
    
    try {
      return await AgoraRTC.createMicrophoneAudioTrack(options)
    } catch (error: any) {
      if (error.message?.includes('context is limited')) {
        throw new Error('Microphone access blocked by browser security. Use HTTPS or localhost.')
      }
      throw error
    }
  }
  
  static async safeCreateScreenTrack(options?: any) {
    const securityCheck = this.checkSecurityContext()
    
    if (!securityCheck.canUseWebRTC) {
      throw new Error('Screen sharing not available: ' + securityCheck.errors.join(', '))
    }
    
    try {
      return await AgoraRTC.createScreenVideoTrack(options)
    } catch (error: any) {
      if (error.message?.includes('context is limited')) {
        throw new Error('Screen sharing blocked by browser security. Use HTTPS or localhost.')
      }
      throw error
    }
  }
  
  static getEnvironmentInfo() {
    const securityCheck = this.checkSecurityContext()
    
    return {
      ...securityCheck,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      location: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      webrtcSupport: {
        hasGetUserMedia: typeof navigator !== 'undefined' && 
          navigator.mediaDevices && 
          typeof navigator.mediaDevices.getUserMedia === 'function',
        hasEnumerateDevices: typeof navigator !== 'undefined' && 
          navigator.mediaDevices && 
          typeof navigator.mediaDevices.enumerateDevices === 'function',
        hasDisplayMedia: typeof navigator !== 'undefined' && 
          navigator.mediaDevices && 
          typeof navigator.mediaDevices.getDisplayMedia === 'function'
      }
    }
  }
}
