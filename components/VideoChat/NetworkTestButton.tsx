import React from 'react'
import { videoChat } from '@/utils/video-chat/video-chat'

const NetworkTestButton: React.FC = () => {
    const testConnection = () => {
        console.log('=== Network Test ===')
        const info = videoChat.getConnectionDebugInfo()
        
        // Verificar conectividad básica
        if (info.mainClient.state === 'CONNECTED') {
            console.log('✓ Main client connected successfully')
        } else {
            console.log('✗ Main client not connected:', info.mainClient.state)
        }
        
        if (info.screenClient.state === 'CONNECTED') {
            console.log('✓ Screen client connected successfully')
        } else {
            console.log('⚠ Screen client not connected:', info.screenClient.state, '(normal if not sharing)')
        }
        
        // Verificar usuarios remotos
        const totalRemoteUsers = info.mainClient.remoteUsers + info.screenClient.remoteUsers
        console.log(`Remote users detected: ${totalRemoteUsers}`)
        
        if (totalRemoteUsers === 0) {
            console.log('⚠ No remote users detected. Check if other users are in the channel.')
        }
        
        // Test de latencia básico
        const startTime = performance.now()
        videoChat.getRemoteUsers()
        const endTime = performance.now()
        console.log(`API response time: ${(endTime - startTime).toFixed(2)}ms`)
    }

    return (
        <button
            onClick={testConnection}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs"
        >
            Network Test
        </button>
    )
}

export default NetworkTestButton
