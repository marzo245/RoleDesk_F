import React, { useState } from 'react'
import { useVideoChat } from '@/app/hooks/useVideoChat'
import { Bug } from '@phosphor-icons/react'

const VideoDebugPanel: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false)
    const { isScreenSharing, isCameraMuted, isMicMuted } = useVideoChat()

    const checkVideoTracks = () => {
        console.log('=== VIDEO DEBUG INFO ===')
        console.log('Screen sharing:', isScreenSharing)
        console.log('Camera muted:', isCameraMuted)
        console.log('Mic muted:', isMicMuted)
        
        // Buscar todos los videos en la página
        const videos = document.querySelectorAll('video')
        console.log('Total videos found:', videos.length)
        
        videos.forEach((video, index) => {
            console.log(`Video ${index}:`, {
                src: video.src,
                width: video.videoWidth,
                height: video.videoHeight,
                playing: !video.paused,
                id: video.id,
                className: video.className
            })
        })
        
        // Buscar tracks de Agora
        const agoraTracks = document.querySelectorAll('[data-track-type]')
        console.log('Agora tracks found:', agoraTracks.length)
        
        console.log('=== END DEBUG INFO ===')
    }

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed top-4 right-4 p-2 bg-red-600 hover:bg-red-700 rounded-full z-50"
                title="Debug Panel"
            >
                <Bug className="w-4 h-4 text-white" />
            </button>
        )
    }

    return (
        <div className="fixed top-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg z-50 max-w-xs">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold">Video Debug</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-red-400 hover:text-red-300"
                >
                    ✕
                </button>
            </div>
            
            <div className="text-xs space-y-1">
                <div>Screen Sharing: {isScreenSharing ? '✅' : '❌'}</div>
                <div>Camera: {isCameraMuted ? '🔴' : '🟢'}</div>
                <div>Mic: {isMicMuted ? '🔴' : '🟢'}</div>
                
                <button
                    onClick={checkVideoTracks}
                    className="mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                >
                    Check Console
                </button>
            </div>
        </div>
    )
}

export default VideoDebugPanel
