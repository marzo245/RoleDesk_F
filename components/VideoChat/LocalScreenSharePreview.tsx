import React, { useEffect, useRef, useState } from 'react'
import signal from '@/utils/signal'
import { ILocalVideoTrack } from 'agora-rtc-sdk-ng'
import { Monitor, X } from '@phosphor-icons/react'
import { useVideoChat } from '@/app/hooks/useVideoChat'

const LocalScreenSharePreview: React.FC = () => {
    const { toggleScreenShare } = useVideoChat()
    const [isVisible, setIsVisible] = useState(false)
    const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null)
    const previewRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onScreenShareStarted = (track: ILocalVideoTrack) => {
            console.log('Local screen share started, showing preview:', track)
            setScreenTrack(track)
            setIsVisible(true)
            
            // Esperar un poco antes de intentar reproducir para asegurar que el elemento esté listo
            setTimeout(() => {
                if (previewRef.current && track) {
                    try {
                        console.log('Playing screen track in preview element')
                        track.play(previewRef.current)
                        console.log('Screen track playing successfully')
                    } catch (error) {
                        console.error('Error playing screen track in preview:', error)
                    }
                }
            }, 100)
        }

        const onScreenShareEnded = () => {
            console.log('Local screen share ended, hiding preview')
            setIsVisible(false)
            setScreenTrack(null)
        }

        // Usar las señales correctas
        signal.on('local-screen-share-started', onScreenShareStarted)
        signal.on('local-screen-share-stopped', onScreenShareEnded)

        return () => {
            signal.off('local-screen-share-started', onScreenShareStarted)
            signal.off('local-screen-share-stopped', onScreenShareEnded)
        }
    }, [])

    // Effect adicional para reproducir el track cuando el componente está listo
    useEffect(() => {
        if (screenTrack && previewRef.current && isVisible) {
            console.log('Attempting to play screen track in effect')
            try {
                screenTrack.play(previewRef.current)
                console.log('Screen track playing from effect')
            } catch (error) {
                console.error('Error playing screen track from effect:', error)
            }
        }
    }, [screenTrack, isVisible])

    const handleStopSharing = () => {
        toggleScreenShare()
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
                <button 
                    onClick={handleStopSharing}
                    className="p-1 hover:bg-red-600 hover:bg-opacity-60 rounded transition-colors"
                    title="Detener compartir pantalla"
                >
                    <X className="w-5 h-5" />
                </button>
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
            
            <p className="text-sm text-gray-300 p-2 text-center bg-black bg-opacity-60">
                Vista previa de tu pantalla
            </p>
        </div>
    )
}

export default LocalScreenSharePreview
