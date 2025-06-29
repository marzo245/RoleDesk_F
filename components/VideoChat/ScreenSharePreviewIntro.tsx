import React, { useEffect, useRef, useState } from 'react'
import signal from '@/utils/signal'
import { ILocalVideoTrack } from 'agora-rtc-sdk-ng'
import { Monitor } from '@phosphor-icons/react'

const ScreenSharePreviewIntro: React.FC = () => {
    const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null)
    const previewRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        console.log('ScreenSharePreviewIntro mounted')
        
        const onScreenShareStarted = (track: ILocalVideoTrack) => {
            console.log('Screen share started in intro preview:', track)
            setScreenTrack(track)
            
            // Reproducir inmediatamente en el elemento
            if (previewRef.current && track) {
                try {
                    console.log('Playing screen track in intro preview')
                    track.play(previewRef.current)
                    console.log('Screen track playing successfully in intro')
                } catch (error) {
                    console.error('Error playing screen track in intro:', error)
                }
            }
        }

        const onScreenShareEnded = () => {
            console.log('Screen share ended in intro preview')
            setScreenTrack(null)
        }

        // Escuchar las señales de pantalla compartida
        signal.on('local-screen-share-started', onScreenShareStarted)
        signal.on('local-screen-share-stopped', onScreenShareEnded)

        return () => {
            signal.off('local-screen-share-started', onScreenShareStarted)
            signal.off('local-screen-share-stopped', onScreenShareEnded)
        }
    }, [])

    // Effect adicional para manejar la reproducción cuando el ref esté listo
    useEffect(() => {
        if (screenTrack && previewRef.current) {
            console.log('Attempting to play screen track in intro effect')
            try {
                screenTrack.play(previewRef.current)
                console.log('Screen track playing from intro effect')
            } catch (error) {
                console.error('Error playing screen track from intro effect:', error)
            }
        }
    }, [screenTrack])

    return (
        <div className="w-full h-full bg-gray-900 relative overflow-hidden">
            {/* El div donde se reproducirá el video */}
            <div 
                ref={previewRef}
                className="absolute inset-0 w-full h-full bg-black"
            />
            
            {/* Overlay cuando no hay screen share o está cargando */}
            {!screenTrack && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center text-gray-300">
                        <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                        <p className="text-sm">No screen share active</p>
                    </div>
                </div>
            )}
            
            {/* Indicador de que está compartiendo */}
            {screenTrack && (
                <div className="absolute top-2 left-2 bg-green-500 bg-opacity-90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Sharing
                </div>
            )}
        </div>
    )
}

export default ScreenSharePreviewIntro
