import React from 'react'
import { Monitor, MonitorPlay } from '@phosphor-icons/react'
import { useVideoChat } from '@/app/hooks/useVideoChat'

type ScreenShareButtonProps = {
    
}

const ScreenShareButton: React.FC<ScreenShareButtonProps> = () => {

    const { isScreenSharing, toggleScreenShare } = useVideoChat()
    
    const screenShareClass = `w-6 h-6 ${isScreenSharing ? 'text-[#08D6A0]' : 'text-white'}`
    
    return (
        <button 
            className={`${isScreenSharing ? 'bg-[#2A4B54] hover:bg-[#3b6975]' : 'bg-[#4A5568] hover:bg-[#4A5568]/80'} 
            p-2 rounded-full animate-colors outline-none transition-colors duration-200`}
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Detener compartir pantalla' : 'Compartir pantalla'}
        >
            {isScreenSharing ? <MonitorPlay className={screenShareClass} /> : <Monitor className={screenShareClass} />}
        </button>
    )
}

export default ScreenShareButton
