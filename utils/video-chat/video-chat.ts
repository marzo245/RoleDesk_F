import signal from '../signal'
import { createHash } from 'crypto'
import { generateToken } from './generateToken'
import { AgoraSecurityManager } from './security-manager'

// Dynamic imports para evitar que Agora se cargue en contextos inseguros
let AgoraRTC: any = null
let loadingPromise: Promise<any> | null = null

// Función para cargar Agora dinámicamente solo cuando es seguro
const loadAgoraSDK = async () => {
    if (AgoraRTC) return AgoraRTC
    
    if (loadingPromise) return loadingPromise
    
    loadingPromise = (async () => {
        try {
            const agoraModule = await import('agora-rtc-sdk-ng')
            AgoraRTC = agoraModule.default
            return AgoraRTC
        } catch (error) {
            console.error('Failed to load Agora SDK:', error)
            throw error
        }
    })()
    
    return loadingPromise
}

export class VideoChat {
    private client: any
    private screenClient: any | null = null // Cliente dedicado para pantalla compartida
    private microphoneTrack: any | null = null
    private cameraTrack: any | null = null
    private screenTrack: any | null = null
    private currentChannel: string = ''
    private currentRealmId: string = '' // Almacenar el realmId actual
    private isScreenSharing: boolean = false
    private baseUID: string = '' // UID base del usuario
    private isDualStreamEnabled: boolean = false // Flag para rastrear si dual stream está habilitado
    private securityContext: any = null
    private isInitialized: boolean = false

    private remoteUsers: { [uid: string]: any } = {}

    private channelTimeout: NodeJS.Timeout | null = null

    constructor() {
        // Solo verificar contexto de seguridad, NO cargar Agora todavía
        this.securityContext = AgoraSecurityManager.checkSecurityContext()
        
        if (!this.securityContext.canUseWebRTC) {
            console.error('VideoChat: Cannot initialize in insecure context:', this.securityContext.errors)
            // Crear un cliente mock que no haga nada
            this.client = this.createMockClient()
            this.isInitialized = true
            return
        }

        // En contextos seguros, crear un proxy que cargue Agora bajo demanda
        this.client = this.createLazyClient()
        this.isInitialized = false
    }

    private createMockClient(): any {
        // Cliente mock que no hace nada para entornos inseguros
        return {
            join: () => Promise.reject(new Error('WebRTC not available in this context')),
            leave: () => Promise.resolve(),
            publish: () => Promise.resolve(),
            unpublish: () => Promise.resolve(),
            subscribe: () => Promise.resolve(),
            unsubscribe: () => Promise.resolve(),
            enableDualStream: () => Promise.resolve(),
            on: () => {},
            off: () => {},
            connectionState: 'DISCONNECTED',
            remoteUsers: [],
            uid: null,
            channelName: null
        }
    }

    private createLazyClient(): any {
        // Cliente proxy que carga Agora bajo demanda
        const lazyClientProxy = new Proxy({}, {
            get: (target: any, prop: string) => {
                if (prop === 'then' || prop === 'catch' || prop === 'finally') {
                    // No es una promesa, retornar undefined
                    return undefined
                }
                
                return async (...args: any[]) => {
                    // Cargar e inicializar Agora cuando se accede por primera vez
                    if (!this.isInitialized) {
                        await this.initializeAgoraClient()
                    }
                    
                    // Delegar al cliente real
                    if (this.client && typeof this.client[prop] === 'function') {
                        return this.client[prop](...args)
                    } else if (this.client && prop in this.client) {
                        return this.client[prop]
                    }
                    
                    console.warn(`Method ${prop} not found on Agora client`)
                    return undefined
                }
            }
        })
        
        return lazyClientProxy
    }

    private async initializeAgoraClient(): Promise<void> {
        if (this.isInitialized) return
        
        try {
            console.log('VideoChat: Initializing Agora client...')
            
            // Cargar Agora SDK dinámicamente
            const AgoraRTCModule = await loadAgoraSDK()
            
            // Crear cliente real
            this.client = AgoraRTCModule.createClient({ codec: "vp8", mode: "rtc" })
            AgoraRTCModule.setLogLevel(4)
            
            // Configurar event listeners
            this.client.on('user-published', this.onUserPublished)
            this.client.on('user-unpublished', this.onUserUnpublished)
            this.client.on('user-left', this.onUserLeft)
            this.client.on('user-info-updated', this.onUserInfoUpdated)
            this.client.on('user-joined', this.onUserJoined)
            
            // Agregar listener de conexión para detectar problemas de red
            this.client.on('connection-state-change', (curState: any, revState: any, reason: any) => {
                // Si el cliente se reconecta, verificar el estado del dual stream
                if (curState === 'CONNECTED' && revState !== 'CONNECTED') {
                    this.verifyDualStreamState()
                }
            })
            
            this.isInitialized = true
            console.log('VideoChat: Agora client initialized successfully')
            
        } catch (error) {
            console.error('VideoChat: Failed to initialize Agora client:', error)
            this.client = this.createMockClient()
            this.isInitialized = true
        }
    }

    public isWebRTCAvailable(): boolean {
        return this.securityContext?.canUseWebRTC || false
    }

    public getSecurityInfo() {
        return AgoraSecurityManager.getEnvironmentInfo()
    }

    private async setupScreenClient(): Promise<void> {
        if (this.screenClient) return
        
        if (!this.securityContext?.canUseWebRTC) {
            console.warn('Cannot setup screen client in insecure context')
            return
        }
        
        try {
            // Cargar Agora SDK dinámicamente
            const AgoraRTCModule = await loadAgoraSDK()
            
            this.screenClient = AgoraRTCModule.createClient({ codec: "vp8", mode: "rtc" })
            
            // Configurar listeners de conexión para el cliente de pantalla
            this.screenClient.on('connection-state-change', (curState: any, revState: any, reason: any) => {
                console.log(`Screen client connection state changed: ${revState} -> ${curState}, reason: ${reason}`)
            })
            
            // Usar las mismas funciones de callback para ambos clientes
            this.screenClient.on('user-published', (user: any, mediaType: any, config: any) => {
                console.log(`Screen client - User published: ${user.uid}, Media type: ${mediaType}`)
                this.onUserPublished(user, mediaType, config)
            })
            this.screenClient.on('user-unpublished', this.onUserUnpublished)
            this.screenClient.on('user-left', this.onUserLeft)
            this.screenClient.on('user-info-updated', this.onUserInfoUpdated)
            this.screenClient.on('user-joined', (user: any) => {
                console.log(`Screen client - User joined: ${user.uid}`)
                this.onUserJoined(user)
            })
            
            console.log('Screen client setup completed with event listeners')
        } catch (error) {
            console.error('Failed to setup screen client:', error)
            this.screenClient = null
        }
    }

    private onUserInfoUpdated = (uid: string) => {
        if (!this.remoteUsers[uid]) return
        signal.emit('user-info-updated', this.remoteUsers[uid])
    }

    private onUserJoined = (user: any) => {
        this.remoteUsers[user.uid] = user
        signal.emit('user-info-updated', user)
    }

    public onUserPublished = async (user: any, mediaType: any, config?: any) => {
        console.log(`User published: ${user.uid}, Media type: ${mediaType}`)
        console.log(`Debug: baseUID="${this.baseUID}", isMyScreenShare check: ${user.uid.toString()} === ${this.baseUID}_screen`)
        
        // No suscribirse a tu propio stream de pantalla compartida
        const isMyScreenShare = user.uid.toString() === `${this.baseUID}_screen`
        if (isMyScreenShare) {
            console.log('✅ Skipping subscription to own screen share')
            return
        }
        
        this.remoteUsers[user.uid] = user
        
        // Determinar qué cliente usar para la suscripción
        let clientToUse = this.client
        const isScreenUser = user.uid.toString().endsWith('_screen')
        
        if (isScreenUser && this.screenClient && this.screenClient.connectionState === 'CONNECTED') {
            clientToUse = this.screenClient
            console.log('Using screen client for subscription')
        } else if (!isScreenUser) {
            console.log('Using main client for subscription')
        } else {
            console.log('Screen client not available, using main client as fallback')
        }
        
        console.log(`Subscribing to user ${user.uid} with ${clientToUse === this.screenClient ? 'screen' : 'main'} client`)
        
        try {
            await clientToUse.subscribe(user, mediaType)
            console.log(`Successfully subscribed to ${user.uid} for ${mediaType}`)
        } catch (error) {
            console.error(`Error subscribing to ${user.uid}:`, error)
            return
        }

        if (mediaType === 'audio') {
            user.audioTrack?.play()
        }

        if (mediaType === 'audio' || mediaType === 'video') {
            console.log('Emitting user-info-updated for user:', user.uid)
            console.log('User details for emission:', {
                uid: user.uid,
                hasVideo: user.hasVideo,
                hasAudio: user.hasAudio,
                videoTrack: !!user.videoTrack,
                audioTrack: !!user.audioTrack
            })
            signal.emit('user-info-updated', user)
        }
    }

    public onUserUnpublished = (user: any, mediaType: any) => {
        if (mediaType === 'audio') {
            user.audioTrack?.stop()
        }
    }

    public onUserLeft = (user: any, reason: any) => {
        delete this.remoteUsers[user.uid]
        signal.emit('user-left', user)
    }

    public async toggleCamera() {
        console.log('VideoChat: toggleCamera called')
        
        if (!this.securityContext?.canUseWebRTC) {
            console.warn('Camera not available in insecure context')
            throw new Error('Camera access requires HTTPS or localhost')
        }
        
        console.log('VideoChat: Current camera track state:', {
            exists: !!this.cameraTrack,
            enabled: this.cameraTrack?.enabled,
            clientState: this.client?.connectionState
        })
        
        try {
            if (!this.cameraTrack) {
                console.log('VideoChat: Creating new camera track...')
                this.cameraTrack = await AgoraSecurityManager.safeCreateCameraTrack()
                console.log('VideoChat: Camera track created successfully')
                
                // Reproducir localmente
                try {
                    this.cameraTrack.play('local-video')
                    console.log('VideoChat: Camera track playing locally')
                } catch (playError) {
                    console.log('VideoChat: Local video element not found, will play when available')
                }

                // Publicar la cámara en el cliente principal si está conectado
                if (this.client.connectionState === 'CONNECTED') {
                    console.log('VideoChat: Publishing camera track...')
                    await this.republishAllTracks() // Usar método seguro
                    console.log('VideoChat: Camera track published successfully')
                } else {
                    console.log('VideoChat: Client not connected, will publish when connected')
                }

                console.log('VideoChat: toggleCamera returning false (camera now active)')
                return false // Retornar false porque ahora está activa (no muted)
            }
            
            console.log('VideoChat: Toggling existing camera track...')
            const newState = !this.cameraTrack.enabled
            await this.cameraTrack.setEnabled(newState)
            console.log('VideoChat: Camera enabled state changed to:', newState)

            // Republicar cuando cambia el estado de la cámara
            if (this.client.connectionState === 'CONNECTED') {
                console.log('VideoChat: Republishing tracks after camera toggle...')
                await this.republishAllTracks()
                console.log('VideoChat: Tracks republished successfully')
            }

            const returnValue = !this.cameraTrack.enabled
            console.log('VideoChat: toggleCamera returning:', returnValue)
            return returnValue
        } catch (error: any) {
            console.error('VideoChat: Error in toggleCamera:', error)
            
            // Manejar errores específicos de contexto de seguridad
            if (error.message?.includes('context is limited') || 
                error.message?.includes('enumerateDevices') ||
                error.message?.includes('getUserMedia')) {
                throw new Error('Camera access blocked by browser security. Please use HTTPS or localhost.')
            }
            
            // En caso de error, asumir que la cámara está muted
            return true
        }
    }

    // TODO: Set it up so microphone gets muted and unmuted instead of enabled and disabled

    public async toggleMicrophone() {
        console.log('VideoChat: toggleMicrophone called')
        
        if (!this.securityContext?.canUseWebRTC) {
            console.warn('Microphone not available in insecure context')
            throw new Error('Microphone access requires HTTPS or localhost')
        }
        
        console.log('VideoChat: Current microphone track state:', {
            exists: !!this.microphoneTrack,
            muted: this.microphoneTrack?.muted,
            clientState: this.client?.connectionState
        })
        
        try {
            if (!this.microphoneTrack) {
                console.log('VideoChat: Creating new microphone track...')
                this.microphoneTrack = await AgoraSecurityManager.safeCreateMicrophoneTrack()
                console.log('VideoChat: Microphone track created successfully')

                // Publicar el micrófono en el cliente principal si está conectado
                if (this.client.connectionState === 'CONNECTED') {
                    console.log('VideoChat: Publishing microphone track...')
                    await this.republishAllTracks() // Usar método seguro
                    console.log('VideoChat: Microphone track published successfully')
                } else {
                    console.log('VideoChat: Client not connected, will publish when connected')
                }

                console.log('VideoChat: toggleMicrophone returning false (microphone now active)')
                return false // Retornar false porque ahora está activo (no muted)
            }
            
            console.log('VideoChat: Toggling existing microphone track...')
            const newMutedState = !this.microphoneTrack.muted
            await this.microphoneTrack.setMuted(newMutedState)
            console.log('VideoChat: Microphone muted state changed to:', newMutedState)

            // No necesitamos republicar para el micrófono al cambiar mute state
            // ya que solo cambia el estado muted, no la publicación

            const returnValue = this.microphoneTrack.muted
            console.log('VideoChat: toggleMicrophone returning:', returnValue)
            return returnValue
        } catch (error: any) {
            console.error('VideoChat: Error in toggleMicrophone:', error)
            
            // Manejar errores específicos de contexto de seguridad
            if (error.message?.includes('context is limited') || 
                error.message?.includes('enumerateDevices') ||
                error.message?.includes('getUserMedia')) {
                throw new Error('Microphone access blocked by browser security. Please use HTTPS or localhost.')
            }
            
            // En caso de error, asumir que el micrófono está muted
            return true
        }
    }

    public playVideoTrackAtElementId(elementId: string) {
        if (this.cameraTrack) {
            this.cameraTrack.play(elementId)
        }
    }

    private resetRemoteUsers() {
        this.remoteUsers = {}
        signal.emit('reset-users')
    }    public async joinChannel(channel: string, uid: string, realmId: string) {
        if (!this.securityContext?.canUseWebRTC) {
            console.warn('Cannot join channel: WebRTC not available in this context')
            return Promise.reject(new Error('WebRTC requires HTTPS or localhost'))
        }

        if (this.channelTimeout) {
            clearTimeout(this.channelTimeout)
        }

        this.channelTimeout = setTimeout(async () => {
            try {
                if (channel === this.currentChannel) return
                
                this.baseUID = uid // Guardar el UID base
                this.currentRealmId = realmId // Guardar el realmId actual
                
                // Emitir el UID local para que VideoBar pueda filtrar correctamente
                signal.emit('local-user-uid', uid)
                
                const uniqueChannelId = this.createUniqueChannelId(realmId, channel)
                const token = await generateToken(uniqueChannelId)
                if (!token) return

                // Forzar limpieza completa antes de intentar reconectar
                await this.forceCleanup()
                
                // Pequeña pausa para asegurar desconexión completa
                await new Promise(resolve => setTimeout(resolve, 200))
                
                console.log(`Joining channel: ${uniqueChannelId} with UID: ${uid}`)
                
                // Configurar cliente para mejor rendimiento
                await this.ensureDualStreamEnabled()
                
                // Usar timeout más largo para conexiones problemáticas
                const joinPromise = this.client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID!, uniqueChannelId, token, uid)
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Join timeout after 15 seconds')), 15000)
                })
                
                await Promise.race([joinPromise, timeoutPromise])
                this.currentChannel = channel
                this.currentRealmId = realmId // Asegurar que se guarda de nuevo
                console.log('Successfully joined channel')
                console.log('Channel state after join - currentChannel:', this.currentChannel)
                console.log('Channel state after join - currentRealmId:', this.currentRealmId)

                // Publicar tracks disponibles
                const tracksToPublish = []
                if (this.microphoneTrack && !this.microphoneTrack.muted) {
                    tracksToPublish.push(this.microphoneTrack)
                }
                
                if (this.cameraTrack && this.cameraTrack.enabled) {
                    tracksToPublish.push(this.cameraTrack)
                }
                
                if (tracksToPublish.length > 0) {
                    await this.client.publish(tracksToPublish)
                    console.log('Published tracks:', tracksToPublish.length)
                }

                // Si ya hay pantalla compartida activa, conectar el cliente de pantalla también
                if (this.isScreenSharing && this.screenTrack) {
                    await this.joinScreenChannel(uniqueChannelId)
                }

            } catch (error: any) {
                console.error('Error joining channel:', error)
                
                // Manejar errores específicos de contexto de seguridad
                if (error.message?.includes('context is limited') || 
                    error.message?.includes('enumerateDevices') ||
                    error.message?.includes('getUserMedia')) {
                    throw new Error('Video chat requires HTTPS or localhost')
                }
                
                // Si hay un error de UID conflict, solo hacer limpieza y reintentar una vez con el UID original
                if (error?.code === 'UID_CONFLICT') {
                    console.log('UID conflict detected, attempting single retry...')
                    try {
                        // Limpieza más agresiva
                        await this.forceCleanup()
                        await new Promise(resolve => setTimeout(resolve, 2000)) // Espera más tiempo
                        
                        // Intentar de nuevo con el UID original (no crear uno nuevo)
                        console.log(`Retrying with original UID: ${uid}`)
                        
                        const token = await generateToken(this.createUniqueChannelId(realmId, channel))
                        await this.client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID!, this.createUniqueChannelId(realmId, channel), token, uid)
                        this.currentChannel = channel
                        
                        const retryTracksToPublish = []
                        if (this.microphoneTrack && !this.microphoneTrack.muted) {
                            retryTracksToPublish.push(this.microphoneTrack)
                        }
                        
                        if (this.cameraTrack && this.cameraTrack.enabled) {
                            retryTracksToPublish.push(this.cameraTrack)
                        }
                        
                        if (retryTracksToPublish.length > 0) {
                            await this.client.publish(retryTracksToPublish)
                        }

                        // Retry screen channel if needed
                        if (this.isScreenSharing && this.screenTrack) {
                            await this.joinScreenChannel(this.createUniqueChannelId(this.currentRealmId, this.currentChannel))
                        }
                    } catch (retryError) {
                        console.error('Failed to resolve UID conflict with original UID:', retryError)
                        // No crear más UIDs únicos, simplemente fallar
                    }
                }
            }
        }, 1000)
    }

    private async joinScreenChannel(uniqueChannelId: string) {
        try {
            console.log('Setting up screen client...')
            await this.setupScreenClient()
            if (!this.screenClient) {
                console.error('Failed to setup screen client')
                return
            }
            
            const screenUID = `${this.baseUID}_screen`
            console.log(`🖥️ Starting screen share with baseUID="${this.baseUID}", screenUID="${screenUID}"`)
            console.log(`Generating token for screen channel: ${uniqueChannelId}`)
            const token = await generateToken(uniqueChannelId)
            if (!token) {
                console.error('Failed to generate token for screen channel')
                return
            }

            console.log(`Joining screen channel with UID: ${screenUID}`)
            
            // Timeout para el cliente de pantalla también
            const joinPromise = this.screenClient.join(process.env.NEXT_PUBLIC_AGORA_APP_ID!, uniqueChannelId, token, screenUID)
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Screen join timeout after 15 seconds')), 15000)
            })
            
            await Promise.race([joinPromise, timeoutPromise])
            console.log('Screen client successfully joined channel')
            
            if (this.screenTrack) {
                console.log('Publishing screen track on separate client...')
                await this.screenClient.publish([this.screenTrack])
                console.log('Screen track published successfully on separate client')
            } else {
                console.error('No screen track available to publish')
            }
        } catch (error) {
            console.error('Error joining screen channel:', error)
        }
    }

    public async leaveChannel() {
        if (this.channelTimeout) {
            clearTimeout(this.channelTimeout)
        }

        this.channelTimeout = setTimeout(async () => {
            if (this.currentChannel === '') return

            // Desconectar cliente principal
            if (this.client.connectionState === 'CONNECTED') {
                await this.client.leave()
            }

            // Desconectar cliente de pantalla si existe
            if (this.screenClient && this.screenClient.connectionState === 'CONNECTED') {
                await this.screenClient.leave()
            }

            this.currentChannel = ''
            this.currentRealmId = ''
            this.baseUID = '' // Limpiar el UID base
            this.isDualStreamEnabled = false // Resetear flag de dual stream
            this.resetRemoteUsers()
        }, 1000)
        
    }

    public async toggleScreenShare(): Promise<boolean> {
        try {
            if (this.isScreenSharing) {
                // Detener compartir pantalla
                console.log('Stopping screen share...')
                
                // Desconectar y limpiar cliente de pantalla
                if (this.screenClient && this.screenClient.connectionState === 'CONNECTED') {
                    console.log('Leaving screen channel...')
                    await this.screenClient.leave()
                    console.log('Screen client disconnected')
                }
                
                if (this.screenTrack) {
                    console.log('Stopping and closing screen track...')
                    this.screenTrack.stop()
                    this.screenTrack.close()
                    this.screenTrack = null
                    console.log('Screen track stopped and cleaned up')
                }

                this.isScreenSharing = false
                signal.emit('local-screen-share-stopped') // Notificar al frontend
                console.log('Screen sharing stopped')
                return false
            } else {
                // Iniciar compartir pantalla
                console.log('Starting screen share...')
                
                try {
                    // Crear track de pantalla
                    const screenResult = await AgoraSecurityManager.safeCreateScreenTrack({
                        encoderConfig: "1080p_1", // Calidad de video
                        optimizationMode: "motion", // Optimizar para movimiento
                    })

                    console.log('Screen result created:', screenResult)

                    // Agora puede devolver un track único o un array [video, audio]
                    let videoTrack: any
                    if (Array.isArray(screenResult)) {
                        videoTrack = screenResult[0] as any
                        console.log('Using video track from array')
                    } else {
                        videoTrack = screenResult as any
                        console.log('Using single video track')
                    }

                    // Verificar que el track es válido
                    if (!videoTrack || typeof videoTrack.play !== 'function') {
                        throw new Error('Invalid screen video track')
                    }

                    console.log('Screen track details:', {
                        type: videoTrack.constructor.name,
                        enabled: videoTrack.enabled
                    })

                    this.screenTrack = videoTrack
                    this.isScreenSharing = true

                    console.log('Screen track created and stored successfully')

                    // Detectar cuando el usuario pare de compartir desde el navegador
                    this.screenTrack.on("track-ended", async () => {
                        console.log('Screen share ended by user')
                        await this.toggleScreenShare()
                    })

                    // Emitir señal de pantalla compartida iniciada con el track INMEDIATAMENTE
                    console.log('Emitting local-screen-share-started signal with track:', this.screenTrack)
                    signal.emit('local-screen-share-started', this.screenTrack)

                    // Luego conectar cliente de pantalla y publicar
                    if (this.currentChannel && this.currentRealmId) {
                        console.log('Current channel found, joining screen channel...')
                        console.log('Current channel:', this.currentChannel)
                        console.log('Current realmId:', this.currentRealmId)
                        
                        // Usar el realmId correcto
                        const uniqueChannelId = this.createUniqueChannelId(this.currentRealmId, this.currentChannel)
                        console.log('Generated uniqueChannelId for screen:', uniqueChannelId)
                        
                        // Unir inmediatamente sin delay para mejor sincronización
                        try {
                            await this.joinScreenChannel(uniqueChannelId)
                            console.log('Screen channel joined successfully')
                        } catch (error) {
                            console.error('Error joining screen channel immediately:', error)
                        }
                    } else {
                        console.warn('No current channel or realmId, cannot join screen channel')
                        console.warn('Current channel:', this.currentChannel)
                        console.warn('Current realmId:', this.currentRealmId)
                    }
                    
                    return true
                } catch (screenError) {
                    console.error('Error creating or publishing screen track:', screenError)
                    this.isScreenSharing = false
                    return false
                }
            }
        } catch (error) {
            console.error('Error toggling screen share:', error)
            this.isScreenSharing = false
            return false
        }
    }

    public async republishAllTracks() {
        try {
            if (this.client.connectionState !== 'CONNECTED') {
                return
            }
            
            // Despublicar todo primero para evitar conflictos
            try {
                await this.client.unpublish()
            } catch (unpublishError) {
                // Error silenciado - es normal en algunos casos
            }
            
            const tracksToPublish = []
            
            // Revisar micrófono
            if (this.microphoneTrack && !this.microphoneTrack.muted) {
                tracksToPublish.push(this.microphoneTrack)
            }
            
            // Revisar cámara - Solo publicar cámara en el cliente principal (la pantalla va en el cliente separado)
            if (this.cameraTrack && this.cameraTrack.enabled) {
                tracksToPublish.push(this.cameraTrack)
            }
            
            if (tracksToPublish.length > 0) {
                const validTracks = tracksToPublish.filter(t => t !== undefined)
                await this.client.publish(validTracks)
            }
        } catch (error) {
            console.error('VideoChat: Error republishing tracks:', error)
        }
    }

    public async destroy() {
        try {
            console.log('Destroying video chat instance...')
            
            // Limpiar timeout si existe
            if (this.channelTimeout) {
                clearTimeout(this.channelTimeout)
                this.channelTimeout = null
            }

            // Detener y limpiar tracks
            if (this.cameraTrack) {
                this.cameraTrack.stop()
                this.cameraTrack.close()
            }
            if (this.microphoneTrack) {
                this.microphoneTrack.stop()
                this.microphoneTrack.close()
            }
            if (this.screenTrack) {
                this.screenTrack.stop()
                this.screenTrack.close()
            }

            // Desconectar de los canales si están conectados
            if (this.client.connectionState === 'CONNECTED') {
                await this.client.leave()
            }
            
            if (this.screenClient && this.screenClient.connectionState === 'CONNECTED') {
                await this.screenClient.leave()
            }

            // Limpiar referencias
            this.microphoneTrack = null
            this.cameraTrack = null
            this.screenTrack = null
            this.screenClient = null
            this.currentChannel = ''
            this.currentRealmId = ''
            this.isScreenSharing = false
            this.isDualStreamEnabled = false // Resetear flag de dual stream
            this.remoteUsers = {}
            
            console.log('Video chat destroyed successfully')
        } catch (error) {
            console.error('Error destroying video chat:', error)
        }
    }

    private createUniqueChannelId(realmId: string, channel: string): string {
        const combined = `${realmId}-${channel}`;
        return createHash('md5').update(combined).digest('hex').substring(0, 16);
    }

    private async forceCleanup() {
        try {
            // Intentar dejar cualquier canal activo
            if (this.client.connectionState !== 'DISCONNECTED') {
                await this.client.leave()
            }
            
            if (this.screenClient && this.screenClient.connectionState !== 'DISCONNECTED') {
                await this.screenClient.leave()
            }
            
            // Limpiar todos los tracks
            if (this.microphoneTrack) {
                this.microphoneTrack.stop()
                this.microphoneTrack.close()
                this.microphoneTrack = null
            }
            
            if (this.cameraTrack) {
                this.cameraTrack.stop()
                this.cameraTrack.close()
                this.cameraTrack = null
            }
            
            if (this.screenTrack) {
                this.screenTrack.stop()
                this.screenTrack.close()
                this.screenTrack = null
            }
            
            this.remoteUsers = {}
            this.currentChannel = ''
            this.currentRealmId = ''
            this.isScreenSharing = false
            this.isDualStreamEnabled = false // Resetear flag de dual stream
            
            console.log('Force cleanup completed')
        } catch (error) {
            console.log('Force cleanup error (this is usually normal):', error)
        }
    }

    private async ensureDualStreamEnabled(): Promise<void> {
        try {
            console.log('ensureDualStreamEnabled: Current state:', {
                isDualStreamEnabled: this.isDualStreamEnabled,
                connectionState: this.client.connectionState
            })
            
            // Si ya está marcado como habilitado según nuestro flag, no hacer nada
            if (this.isDualStreamEnabled) {
                console.log('ensureDualStreamEnabled: Already enabled according to flag, skipping')
                return
            }
            
            // Intentar habilitar dual stream con manejo robusto de errores
            console.log('ensureDualStreamEnabled: Attempting to enable dual stream...')
            try {
                await this.client.enableDualStream()
                this.isDualStreamEnabled = true
                console.log('ensureDualStreamEnabled: Successfully enabled dual stream')
            } catch (error: any) {
                console.log('ensureDualStreamEnabled: Error details:', {
                    code: error.code,
                    message: error.message,
                    name: error.name,
                    fullError: error
                })
                
                // Verificar si es un error de "ya está habilitado"
                const errorMessage = error.message?.toLowerCase() || ''
                const errorCode = error.code
                
                const isAlreadyEnabledError = (
                    // Verificar por código de error
                    (errorCode === 'INVALID_OPERATION' || errorCode === 'INVALID_STATE') &&
                    // Y por mensaje de error (múltiples variaciones)
                    (errorMessage.includes('already enabled') ||
                     errorMessage.includes('dual stream is already enabled') ||
                     errorMessage.includes('duplicated operation') ||
                     errorMessage.includes('dual-stream already enabled') ||
                     errorMessage.includes('already turned on'))
                )
                
                if (isAlreadyEnabledError) {
                    this.isDualStreamEnabled = true
                    console.log('ensureDualStreamEnabled: Dual stream was already enabled, updating flag')
                } else {
                    console.warn('ensureDualStreamEnabled: Failed to enable dual stream with unknown error:', error.message)
                    // No actualizar el flag si es un error diferente
                    throw error // Re-lanzar para que el código que llama sepa que falló
                }
            }
        } catch (outerError: any) {
            console.error('ensureDualStreamEnabled: Unexpected error:', outerError)
            // No re-lanzar errores inesperados para no romper el flujo de conexión
        }
    }

    private verifyDualStreamState(): void {
        // Verificación asíncrona del estado del dual stream
        // No podemos hacer await aquí porque esto es un listener de eventos
        setTimeout(async () => {
            try {
                // Intentar una operación que falle si dual stream no está habilitado
                // En lugar de intentar habilitarlo de nuevo, solo verificamos
                console.log('verifyDualStreamState: Checking if dual stream needs to be enabled...')
                if (!this.isDualStreamEnabled) {
                    console.log('verifyDualStreamState: Flag indicates dual stream is disabled, attempting to sync...')
                    await this.ensureDualStreamEnabled()
                } else {
                    console.log('verifyDualStreamState: Flag indicates dual stream is already enabled')
                }
            } catch (error) {
                console.log('verifyDualStreamState: Error during verification:', error)
            }
        }, 1000) // Esperar 1 segundo para que la conexión se estabilice
    }

    public getConnectionState() {
        return this.client?.connectionState || 'DISCONNECTED'
    }

    public getScreenConnectionState() {
        return this.screenClient?.connectionState || 'DISCONNECTED'
    }

    public getRemoteUsers() {
        return Object.values(this.remoteUsers)
    }

    public getRemoteUserDetails() {
        return Object.values(this.remoteUsers).map(user => ({
            uid: user.uid,
            hasVideo: !!user.videoTrack,
            hasAudio: !!user.audioTrack,
            isScreenSharing: user.uid.toString().endsWith('_screen'),
            baseUID: user.uid.toString().replace('_screen', '')
        }))
    }

    public getConnectionDebugInfo() {
        const info = {
            mainClient: {
                state: this.client?.connectionState || 'DISCONNECTED',
                uid: this.client?.uid || null,
                channelName: this.client?.channelName || null,
                remoteUsers: this.client?.remoteUsers?.length || 0
            },
            screenClient: {
                state: this.screenClient?.connectionState || 'DISCONNECTED', 
                uid: this.screenClient?.uid || null,
                channelName: this.screenClient?.channelName || null,
                remoteUsers: this.screenClient?.remoteUsers?.length || 0
            },
            isScreenSharing: this.isScreenSharing,
            currentChannel: this.currentChannel,
            currentRealmId: this.currentRealmId,
            baseUID: this.baseUID
        }
        
        console.log('Debug info requested:', info)
        return info
    }

    public getTracksState() {
        return {
            camera: {
                exists: !!this.cameraTrack,
                enabled: this.cameraTrack?.enabled || false
            },
            microphone: {
                exists: !!this.microphoneTrack,
                muted: this.microphoneTrack?.muted || false
            },
            screen: {
                exists: !!this.screenTrack,
                enabled: this.screenTrack?.enabled || false,
                isSharing: this.isScreenSharing
            },
            client: {
                state: this.client?.connectionState || 'DISCONNECTED',
                uid: this.client?.uid || null,
                channel: this.currentChannel || null
            }
        }
    }

    public getLocalUserInfo() {
        return {
            uid: this.baseUID,
            videoTrack: this.cameraTrack,
            audioTrack: this.microphoneTrack,
            hasVideo: !!(this.cameraTrack && this.cameraTrack.enabled),
            hasAudio: !!(this.microphoneTrack && !this.microphoneTrack.muted),
            isLocal: true
        }
    }
}

export const videoChat = new VideoChat()

// Funciones helper para debug
export const getVideoChatDebugInfo = () => videoChat.getConnectionDebugInfo()
export const getVideoChatTracksState = () => videoChat.getTracksState()
