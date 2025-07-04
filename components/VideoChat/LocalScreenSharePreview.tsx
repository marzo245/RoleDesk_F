import React, { useEffect, useRef, useState } from 'react'
import signal from '@/utils/signal'
import { ILocalVideoTrack } from 'agora-rtc-sdk-ng'
import { Monitor, X, ArrowClockwise, WifiX } from '@phosphor-icons/react'
import { useVideoChat } from '@/app/hooks/useVideoChat'

const LocalScreenSharePreview: React.FC = () => {
    const { toggleScreenShare, refreshAllStreams, recreateCorruptedTracks } = useVideoChat()
    const [isVisible, setIsVisible] = useState(false)
    const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null)
    const previewRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onScreenShareStarted = (track: ILocalVideoTrack) => {
            setScreenTrack(track)
            setIsVisible(true)
            
            // Esperar un poco antes de intentar reproducir para asegurar que el elemento esté listo
            setTimeout(() => {
                if (previewRef.current && track) {
                    try {
                        track.play(previewRef.current)
                    } catch (error) {
                        // Error playing screen track in preview
                    }
                }
            }, 100)
        }

        const onScreenShareEnded = () => {
            setIsVisible(false)
            setScreenTrack(null)
        }

        const onRefreshScreenShare = (track: ILocalVideoTrack) => {
            if (previewRef.current && track) {
                try {
                    track.play(previewRef.current)
                } catch (error) {
                    // Error refreshing screen track
                }
            }
        }

        // Usar las señales correctas
        signal.on('local-screen-share-started', onScreenShareStarted)
        signal.on('local-screen-share-stopped', onScreenShareEnded)
        signal.on('refresh-local-screen-share', onRefreshScreenShare)

        return () => {
            signal.off('local-screen-share-started', onScreenShareStarted)
            signal.off('local-screen-share-stopped', onScreenShareEnded)
            signal.off('refresh-local-screen-share', onRefreshScreenShare)
        }
    }, [])

    // Effect adicional para reproducir el track cuando el componente está listo
    useEffect(() => {
        if (screenTrack && previewRef.current && isVisible) {
            try {
                screenTrack.play(previewRef.current)
            } catch (error) {
                // Error playing screen track from effect
            }
        }
    }, [screenTrack, isVisible])

    const handleStopSharing = () => {
        toggleScreenShare()
    }

    const handleRefreshStreams = () => {
        refreshAllStreams()
    }

    const handleRecreateTraks = () => {
        recreateCorruptedTracks()
    }

    if (!isVisible) {
        return null
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-black bg-opacity-95 rounded-lg overflow-hidden border-2 border-green-500 shadow-2xl">
            <div className="flex items-center justify-between p-3 bg-black bg-opacity-80 text-white text-sm">
                <div className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-green-400" />
                    <span className="font-medium">Compartiendo pantalla</span>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={handleRefreshStreams}
                        className="p-1 hover:bg-blue-600 hover:bg-opacity-60 rounded transition-colors"
                        title="Refrescar streams si se ven en negro"
                    >
                        <ArrowClockwise className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleRecreateTraks}
                        className="p-1 hover:bg-yellow-600 hover:bg-opacity-60 rounded transition-colors"
                        title="Recrear tracks corruptos si la cámara no funciona"
                    >
                        <WifiX className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleStopSharing}
                        className="p-1 hover:bg-red-600 hover:bg-opacity-60 rounded transition-colors"
                        title="Detener compartir pantalla"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
            
            <div className="relative w-80 h-45 bg-gray-800">
                {/* El div donde se reproducirá el video */}
                <div 
                    ref={previewRef}
                    className="absolute inset-0 w-full h-full"
                />
                
                {/* Fallback solo si no hay track */}
                {!screenTrack && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-center">
                        <div>
                            <Monitor className="w-10 h-10 mx-auto mb-2" />
                            <p className="text-sm">Iniciando preview...</p>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="text-xs text-gray-300 p-2 text-center bg-black bg-opacity-60">
                <p>Vista previa de tu pantalla</p>
                <p className="text-gray-400 mt-1">💡 Pantallas en negro? Usa ↻ | Cámara no funciona? Usa ⚡</p>
            </div>
        </div>
    )
}

export default LocalScreenSharePreview
