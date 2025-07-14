'use client'
import React from 'react'
import BasicButton from '@/components/BasicButton'
import AnimatedCharacter from './SkinMenu/AnimatedCharacter'
import { useVideoChat } from '../hooks/useVideoChat'
import MicAndCameraButtons from '@/components/VideoChat/MicAndCameraButtons'

import ScreenSharePreviewIntro from '@/components/VideoChat/ScreenSharePreviewIntro'

type IntroScreenProps = {
    realmName: string
    skin: string
    username: string
    setShowIntroScreen: (show: boolean) => void
}

const IntroScreen:React.FC<IntroScreenProps> = ({ realmName, skin, username, setShowIntroScreen }) => {

    const src = '/sprites/characters/Character_' + skin + '.png'
    const { isScreenSharing } = useVideoChat()

    return (
        <main className='dark-gradient w-full h-screen flex flex-col items-center pt-16'>
            <h1 className='text-4xl font-semibold mb-8'>Welcome to <span className='text-[#CAD8FF]'>{realmName}</span></h1>
            
            <section className='flex flex-row items-start gap-8'>
                {/* Previsualización de Video */}
                <div className='flex flex-col items-center gap-4'>
                    <h3 className='text-lg font-medium text-white'>Camera Preview</h3>
                    <div className='aspect-video w-[337px] h-[227px] bg-black rounded-xl border-2 border-[#3F4776] overflow-hidden'>
                        <LocalVideo/>
                    </div>
                    <MicAndCameraButtons/>
                </div>

                {/* Previsualización de Pantalla Compartida (solo si está activa) */}
                {isScreenSharing && (
                    <div className='flex flex-col items-center gap-4'>
                        <h3 className='text-lg font-medium text-white'>Screen Share Preview</h3>
                        <div className='aspect-video w-[450px] h-[253px] bg-black rounded-xl border-2 border-[#08D6A0] overflow-hidden'>
                            <ScreenSharePreviewIntro />
                        </div>
                        <p className='text-sm text-[#08D6A0] font-medium'>✓ Screen sharing active</p>
                    </div>
                )}

                {/* Avatar y botón de unirse */}
                <div className='flex flex-col items-center gap-6 ml-8'>
                    <div className='flex flex-row items-center gap-3'>
                        <AnimatedCharacter src={src} noAnimation/>
                        <p className='text-xl font-medium'>{username}</p>
                    </div>
                    <div className='text-center'>
                        <p className='text-sm text-gray-300 mb-4'>
                            {isScreenSharing ? 'Ready to join with camera and screen share' : 'Ready to join'}
                        </p>
                        <BasicButton className='py-3 px-8 w-[200px] text-lg font-medium' onClick={() => setShowIntroScreen(false)}>
                            Join Room
                        </BasicButton>
                    </div>
                </div>
            </section>


        </main>
    )
}

export default IntroScreen

function LocalVideo() {
    const { isCameraMuted, isMicMuted, isScreenSharing } = useVideoChat()

    return (
        <div className='w-full h-full bg-[#111111] grid place-items-center relative'>
            <div id='local-video' className='w-full h-full'>

            </div>
            <div className='absolute select-none text-sm text-white items-center flex flex-col gap-1'>
                {isMicMuted && isCameraMuted && <p>Camera and microphone are off</p>}
                {isCameraMuted && !isMicMuted && <p>Camera is off</p>}
                {!isCameraMuted && isMicMuted && <p>Microphone is muted</p>}
            </div>
            
            {/* Indicador de estado del micrófono cuando la cámara está encendida */}
            {isMicMuted && !isCameraMuted && (
                <p className='absolute bottom-2 right-3 select-none text-xs text-white bg-red-500 bg-opacity-75 p-1 px-2 rounded-full'>
                    Muted
                </p>
            )}
            
            {/* Indicador de pantalla compartida */}
            {isScreenSharing && (
                <div className='absolute top-2 left-2 select-none text-xs text-white bg-[#08D6A0] bg-opacity-90 p-1 px-2 rounded-full flex items-center gap-1'>
                    <div className='w-2 h-2 bg-white rounded-full animate-pulse'></div>
                    Screen sharing
                </div>
            )}
        </div>
    )
}