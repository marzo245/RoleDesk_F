import React from 'react'
import { videoChat } from '@/utils/video-chat/video-chat'

const QuickTestControls: React.FC = () => {
    const handleToggleCamera = async () => {
        try {
            const disabled = await videoChat.toggleCamera()
            console.log('Camera toggled:', disabled ? 'OFF' : 'ON')
        } catch (error) {
            console.error('Error toggling camera:', error)
        }
    }

    const handleToggleMicrophone = async () => {
        try {
            const muted = await videoChat.toggleMicrophone()
            console.log('Microphone toggled:', muted ? 'MUTED' : 'UNMUTED')
        } catch (error) {
            console.error('Error toggling microphone:', error)
        }
    }

    const handleToggleScreenShare = async () => {
        try {
            const started = await videoChat.toggleScreenShare()
            console.log('Screen share toggled:', started ? 'STARTED' : 'STOPPED')
        } catch (error) {
            console.error('Error toggling screen share:', error)
        }
    }

    return (
        <div className="fixed bottom-4 left-4 z-50 bg-black bg-opacity-80 p-3 rounded-lg">
            <h3 className="text-white text-sm font-bold mb-2">Quick Test</h3>
            <div className="flex gap-2">
                <button
                    onClick={handleToggleCamera}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                >
                    📹 Camera
                </button>
                <button
                    onClick={handleToggleMicrophone}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                >
                    🎤 Mic
                </button>
                <button
                    onClick={handleToggleScreenShare}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs"
                >
                    🖥️ Screen
                </button>
            </div>
        </div>
    )
}

export default QuickTestControls
