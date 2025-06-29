import React, { useEffect, useState } from 'react'
import { getVideoChatDebugInfo } from '@/utils/video-chat/video-chat'

const VideoChatDebugPanel: React.FC = () => {
    const [debugInfo, setDebugInfo] = useState<any>({})
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            setDebugInfo(getVideoChatDebugInfo())
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
            >
                Debug
            </button>
        )
    }

    return (
        <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-md">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold">Video Chat Debug</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-red-400 hover:text-red-300"
                >
                    ✕
                </button>
            </div>
            
            <div className="text-xs space-y-1">
                <div><strong>Realm ID:</strong> {debugInfo.currentRealmId || 'None'}</div>
                <div><strong>Channel:</strong> {debugInfo.currentChannel || 'None'}</div>
                <div><strong>Base UID:</strong> {debugInfo.baseUID || 'None'}</div>
                <div><strong>Screen Sharing:</strong> {debugInfo.isScreenSharing ? 'Yes' : 'No'}</div>
                
                <div className="border-t border-gray-600 pt-2 mt-2">
                    <strong>Main Client:</strong>
                    <div className="ml-2">
                        <div>State: {debugInfo.mainClient?.state || 'Unknown'}</div>
                        <div>UID: {debugInfo.mainClient?.uid || 'None'}</div>
                        <div>Remote Users: {debugInfo.mainClient?.remoteUsers || 0}</div>
                    </div>
                </div>
                
                <div className="border-t border-gray-600 pt-2 mt-2">
                    <strong>Screen Client:</strong>
                    <div className="ml-2">
                        <div>State: {debugInfo.screenClient?.state || 'Unknown'}</div>
                        <div>UID: {debugInfo.screenClient?.uid || 'None'}</div>
                        <div>Remote Users: {debugInfo.screenClient?.remoteUsers || 0}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VideoChatDebugPanel
