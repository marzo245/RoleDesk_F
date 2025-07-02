import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, ILocalVideoTrack, IAgoraRTCRemoteUser, IDataChannelConfig } from 'agora-rtc-sdk-ng'
import signal from '../signal'
import { createHash } from 'crypto'
import { generateToken } from './generateToken'

export class VideoChat {
    private client: IAgoraRTCClient = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" })
    private screenClient: IAgoraRTCClient | null = null // Cliente dedicado para pantalla compartida
    private microphoneTrack: IMicrophoneAudioTrack | null = null
    private cameraTrack: ICameraVideoTrack | null = null
    private screenTrack: ILocalVideoTrack | null = null
    private currentChannel: string = ''
    private currentRealmId: string = '' // Almacenar el realmId actual
    private isScreenSharing: boolean = false
    private baseUID: string = '' // UID base del usuario
    private isDualStreamEnabled: boolean = false // Flag para rastrear si dual stream está habilitado

    private remoteUsers: { [uid: string]: IAgoraRTCRemoteUser } = {}

    private channelTimeout: NodeJS.Timeout | null = null

    constructor() {
        AgoraRTC.setLogLevel(4)
        
        this.client.on('user-published', this.onUserPublished)
        this.client.on('user-unpublished', this.onUserUnpublished)
        this.client.on('user-left', this.onUserLeft)
        this.client.on('user-info-updated', this.onUserInfoUpdated)
        this.client.on('user-joined', this.onUserJoined)
        
        // Agregar listener de conexión para detectar problemas de red
        this.client.on('connection-state-change', (curState, revState, reason) => {
            // Si el cliente se reconecta, verificar el estado del dual stream
            if (curState === 'CONNECTED' && revState !== 'CONNECTED') {
                this.verifyDualStreamState()
            }
        })

        // Agregar listeners para eventos de visibilidad y fullscreen
        this.setupVisibilityListeners()
    }

    private setupScreenClient() {
        if (this.screenClient) return
        
        this.screenClient = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" })
        
        // Configurar listeners de conexión para el cliente de pantalla
        this.screenClient.on('connection-state-change', (curState, revState, reason) => {
            // Log de conexión para debug si es necesario
        })
        
        // Usar las mismas funciones de callback para ambos clientes
        this.screenClient.on('user-published', (user, mediaType, config) => {
            this.onUserPublished(user, mediaType, config)
        })
        this.screenClient.on('user-unpublished', this.onUserUnpublished)
        this.screenClient.on('user-left', this.onUserLeft)
        this.screenClient.on('user-info-updated', this.onUserInfoUpdated)
        this.screenClient.on('user-joined', (user) => {
            this.onUserJoined(user)
        })
    }

    private onUserInfoUpdated = (uid: string) => {
        if (!this.remoteUsers[uid]) return
        signal.emit('user-info-updated', this.remoteUsers[uid])
    }

    private onUserJoined = (user: IAgoraRTCRemoteUser) => {
        this.remoteUsers[user.uid] = user
        signal.emit('user-info-updated', user)
    }

    public onUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video" | "datachannel", config?: IDataChannelConfig) => {
        // No suscribirse a tu propio stream de pantalla compartida
        const isMyScreenShare = user.uid.toString() === `${this.baseUID}_screen`
        if (isMyScreenShare) {
            return
        }
        
        // Verificar que el usuario esté realmente en el canal antes de intentar suscribirse
        const isScreenUser = user.uid.toString().endsWith('_screen')
        let clientToUse = this.client
        
        // Para usuarios de screen share, usar el screenClient si está disponible
        if (isScreenUser && this.screenClient && this.screenClient.connectionState === 'CONNECTED') {
            clientToUse = this.screenClient
            const remoteUsers = clientToUse.remoteUsers
            if (!remoteUsers.find(u => u.uid === user.uid)) {
                return // Usuario no encontrado en el screen client
            }
        } else if (!isScreenUser) {
            // Para usuarios normales, siempre usar el cliente principal
            clientToUse = this.client
            const remoteUsers = clientToUse.remoteUsers
            if (!remoteUsers.find(u => u.uid === user.uid)) {
                return // Usuario no encontrado en el main client
            }
        }
        
        // Verificar que el cliente esté conectado
        if (clientToUse.connectionState !== 'CONNECTED') {
            return
        }
        
        // Almacenar el usuario remoto
        this.remoteUsers[user.uid] = user
        
        try {
            await clientToUse.subscribe(user, mediaType)
            
            if (mediaType === 'audio') {
                user.audioTrack?.play()
            }

            // Emitir evento de actualización para que el frontend pueda actualizar la UI
            signal.emit('user-info-updated', user)
            
        } catch (error) {
            console.error(`Error subscribing to ${user.uid}:`, error)
            // Remover el usuario de la lista si la suscripción falla
            delete this.remoteUsers[user.uid]
            return
        }
    }

    public onUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video" | "datachannel") => {
        if (mediaType === 'audio') {
            user.audioTrack?.stop()
        }
    }

    public onUserLeft = (user: IAgoraRTCRemoteUser, reason: string) => {
        delete this.remoteUsers[user.uid]
        signal.emit('user-left', user)
    }

    public async toggleCamera() {
        try {
            if (!this.cameraTrack) {
                this.cameraTrack = await AgoraRTC.createCameraVideoTrack()
                
                // Reproducir localmente
                try {
                    this.cameraTrack.play('local-video')
                } catch (playError) {
                    // Local video element not found, will play when available
                }

                // Publicar la cámara en el cliente principal si está conectado
                if (this.client.connectionState === 'CONNECTED') {
                    await this.republishAllTracks() // Usar método seguro
                }

                return false // Retornar false porque ahora está activa (no muted)
            }
            
            const newState = !this.cameraTrack.enabled
            await this.cameraTrack.setEnabled(newState)

            // Republicar cuando cambia el estado de la cámara
            if (this.client.connectionState === 'CONNECTED') {
                await this.republishAllTracks()
            }

            const returnValue = !this.cameraTrack.enabled
            return returnValue
        } catch (error) {
            console.error('VideoChat: Error in toggleCamera:', error)
            // En caso de error, asumir que la cámara está muted
            return true
        }
    }

    // TODO: Set it up so microphone gets muted and unmuted instead of enabled and disabled

    public async toggleMicrophone() {
        try {
            if (!this.microphoneTrack) {
                this.microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack()

                // Publicar el micrófono en el cliente principal si está conectado
                if (this.client.connectionState === 'CONNECTED') {
                    await this.republishAllTracks() // Usar método seguro
                }

                return false // Retornar false porque ahora está activo (no muted)
            }
            
            const newMutedState = !this.microphoneTrack.muted
            await this.microphoneTrack.setMuted(newMutedState)

            // No necesitamos republicar para el micrófono al cambiar mute state
            // ya que solo cambia el estado muted, no la publicación

            const returnValue = this.microphoneTrack.muted
            return returnValue
        } catch (error) {
            console.error('VideoChat: Error in toggleMicrophone:', error)
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
    }

    public async joinChannel(channel: string, uid: string, realmId: string) {
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
            this.setupScreenClient()
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
            // Verificar que AgoraRTC está disponible
            if (!AgoraRTC || typeof AgoraRTC.createScreenVideoTrack !== 'function') {
                console.error('AgoraRTC is not available or createScreenVideoTrack is not supported')
                throw new Error('Screen sharing is not supported in this environment')
            }

            if (this.isScreenSharing) {
                // Detener compartir pantalla
                
                // Desconectar y limpiar cliente de pantalla
                if (this.screenClient && this.screenClient.connectionState === 'CONNECTED') {
                    await this.screenClient.leave()
                }
                
                if (this.screenTrack) {
                    this.screenTrack.stop()
                    this.screenTrack.close()
                    this.screenTrack = null
                }

                this.isScreenSharing = false
                signal.emit('local-screen-share-stopped') // Notificar al frontend
                
                // Refrescar suscripciones al detener screen share también
                setTimeout(() => {
                    this.refreshExistingSubscriptions()
                }, 500) // Delay más corto al detener
                
                return false
            } else {
                // Iniciar compartir pantalla
                
                try {
                    // Verificar que estamos en un contexto seguro (HTTPS)
                    if (typeof window !== 'undefined' && !window.isSecureContext) {
                        throw new Error('Screen sharing requires HTTPS')
                    }

                    // Crear track de pantalla
                    const screenResult = await AgoraRTC.createScreenVideoTrack({
                        encoderConfig: "1080p_1", // Calidad de video
                        optimizationMode: "motion", // Optimizar para movimiento
                    })

                    // Agora puede devolver un track único o un array [video, audio]
                    let videoTrack: ILocalVideoTrack
                    if (Array.isArray(screenResult)) {
                        videoTrack = screenResult[0] as ILocalVideoTrack
                    } else {
                        videoTrack = screenResult as ILocalVideoTrack
                    }

                    // Verificar que el track es válido
                    if (!videoTrack || typeof videoTrack.play !== 'function') {
                        throw new Error('Invalid screen video track')
                    }

                    this.screenTrack = videoTrack
                    this.isScreenSharing = true

                    // Detectar cuando el usuario pare de compartir desde el navegador
                    this.screenTrack.on("track-ended", async () => {
                        await this.toggleScreenShare()
                    })

                    // Emitir señal de pantalla compartida iniciada con el track INMEDIATAMENTE
                    signal.emit('local-screen-share-started', this.screenTrack)

                    // Luego conectar cliente de pantalla y publicar
                    if (this.currentChannel && this.currentRealmId) {
                        // Usar el realmId correcto
                        const uniqueChannelId = this.createUniqueChannelId(this.currentRealmId, this.currentChannel)
                        
                        // Unir inmediatamente sin delay para mejor sincronización
                        try {
                            await this.joinScreenChannel(uniqueChannelId)
                        } catch (error) {
                            console.error('Error joining screen channel immediately:', error)
                        }
                    } else {
                        console.warn('No current channel or realmId, cannot join screen channel')
                    }
                    
                    // Refrescar las suscripciones existentes para mantener los streams visibles
                    setTimeout(() => {
                        this.refreshExistingSubscriptions()
                    }, 1000) // Pequeño delay para que se establezca el screen share
                    
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

            // Limpiar event listeners de visibilidad y fullscreen
            if (typeof window !== 'undefined') {
                document.removeEventListener('visibilitychange', this.handleVisibilityChange)
                document.removeEventListener('fullscreenchange', this.handleFullscreenChange)
                document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange)
                document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange)
                document.removeEventListener('msfullscreenchange', this.handleFullscreenChange)
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

    /**
     * Refresca las suscripciones de todos los usuarios existentes para asegurar 
     * que los streams de video se mantengan visibles después de cambios de configuración
     */
    private async refreshExistingSubscriptions() {
        try {
            // Obtener todos los usuarios remotos del cliente principal
            const mainClientUsers = this.client.remoteUsers
            
            for (const user of mainClientUsers) {
                try {
                    // Re-suscribirse a video si existe
                    if (user.videoTrack && user.hasVideo) {
                        // Forzar re-suscripción para evitar el bug de pantalla negra
                        await this.client.unsubscribe(user, 'video')
                        await this.client.subscribe(user, 'video')
                    }
                    
                    // Re-suscribirse a audio si existe
                    if (user.audioTrack && user.hasAudio) {
                        await this.client.unsubscribe(user, 'audio')
                        await this.client.subscribe(user, 'audio')
                        // Asegurar que el audio siga reproduciéndose
                        user.audioTrack.play()
                    }
                    
                    // Re-emitir el evento para actualizar la UI
                    signal.emit('user-info-updated', user)
                } catch (userError) {
                    console.error(`Error refreshing subscription for user ${user.uid}:`, userError)
                    // Continuar con otros usuarios aunque falle uno
                }
            }
            
            // Si hay un screen client, hacer lo mismo
            if (this.screenClient && this.screenClient.connectionState === 'CONNECTED') {
                const screenClientUsers = this.screenClient.remoteUsers
                
                for (const user of screenClientUsers) {
                    try {
                        if (user.videoTrack && user.hasVideo) {
                            await this.screenClient.unsubscribe(user, 'video')
                            await this.screenClient.subscribe(user, 'video')
                            signal.emit('user-info-updated', user)
                        }
                    } catch (userError) {
                        console.error(`Error refreshing screen subscription for user ${user.uid}:`, userError)
                    }
                }
            }
            
        } catch (error) {
            console.error('Error refreshing existing subscriptions:', error)
        }
    }

    // Función pública para forzar un refresh de suscripciones desde el frontend
    public async forceRefreshSubscriptions() {
        await this.refreshExistingSubscriptions()
    }

    // Función pública para forzar un refresh de todos los streams desde el frontend
    public async forceRefreshAllStreams() {
        await this.refreshAllStreams()
    }

    private setupVisibilityListeners() {
        if (typeof window === 'undefined') return

        // Listener para cambios de visibilidad (minimizar ventana, cambiar de tab, etc.)
        document.addEventListener('visibilitychange', this.handleVisibilityChange)
        
        // Listeners para fullscreen
        document.addEventListener('fullscreenchange', this.handleFullscreenChange)
        document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange) // Safari
        document.addEventListener('mozfullscreenchange', this.handleFullscreenChange) // Firefox
        document.addEventListener('msfullscreenchange', this.handleFullscreenChange) // IE/Edge
    }

    private handleVisibilityChange = () => {
        if (document.hidden) {
            // Página oculta - pausar algunos streams si es necesario
            console.log('Page became hidden')
        } else {
            // Página visible - refrescar streams después de un breve delay
            console.log('Page became visible, refreshing streams...')
            setTimeout(() => {
                this.refreshAllStreams()
            }, 500)
        }
    }

    private handleFullscreenChange = () => {
        const isFullscreen = !!(document.fullscreenElement || 
                                (document as any).webkitFullscreenElement || 
                                (document as any).mozFullScreenElement || 
                                (document as any).msFullscreenElement)
        
        console.log(`Fullscreen changed: ${isFullscreen ? 'entered' : 'exited'}`)
        
        // Refrescar streams después de cambio de fullscreen
        setTimeout(() => {
            this.refreshAllStreams()
        }, 1000)
    }

    private refreshAllStreams = async () => {
        try {
            console.log('Refreshing all streams after visibility/fullscreen change...')

            // Refrescar cámara local si existe
            if (this.cameraTrack && this.cameraTrack.enabled) {
                try {
                    // Parar y volver a iniciar la reproducción
                    this.cameraTrack.stop()
                    setTimeout(() => {
                        if (this.cameraTrack) {
                            this.cameraTrack.play('local-video')
                        }
                    }, 100)
                } catch (playError) {
                    console.log('Local video element not found during refresh')
                }
            }

            // Refrescar screen share local si existe
            if (this.screenTrack) {
                console.log('Refreshing local screen share...')
                signal.emit('refresh-local-screen-share', this.screenTrack)
            }

            // Refrescar suscripciones de usuarios remotos
            await this.refreshExistingSubscriptions()

            // Esperar un poco y hacer un segundo intento de refresh para streams remotos
            setTimeout(async () => {
                try {
                    // Re-emitir eventos de actualización para todos los usuarios remotos
                    Object.values(this.remoteUsers).forEach(user => {
                        if (user.hasVideo || user.hasAudio) {
                            signal.emit('user-info-updated', user)
                        }
                    })
                } catch (error) {
                    console.error('Error in second refresh attempt:', error)
                }
            }, 1500)

            console.log('All streams refresh completed')
        } catch (error) {
            console.error('Error refreshing streams:', error)
        }
    }
}

export const videoChat = new VideoChat()

// Funciones helper para debug
export const getVideoChatDebugInfo = () => videoChat.getConnectionDebugInfo()
export const getVideoChatTracksState = () => videoChat.getTracksState()

// Función para forzar refresh de suscripciones cuando las cámaras se pongan en negro
export const forceRefreshVideoSubscriptions = () => videoChat.forceRefreshSubscriptions()

// Función para refrescar todos los streams (cámara local, screen share y remotos)
export const forceRefreshAllStreams = () => videoChat.forceRefreshAllStreams()
