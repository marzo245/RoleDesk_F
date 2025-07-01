'use client'
import AnimatedCharacter from './play/SkinMenu/AnimatedCharacter'
import Link from 'next/link'
import BasicButton from '@/components/BasicButton'

export default function Index() {
  return (
    <div className='w-full grid place-items-center h-screen gradient p-4 relative'>
      <div className='max-w-[600px] flex flex-col items-center'>
        <div>
          <h1 className='font-semibold text-5xl text-center mb-6'>¡Bienvenido a RoleDesk!</h1>   
          <p className='w-full text-xl my-6 text-center'>
            Espacios virtuales colaborativos para reuniones de trabajo inmersivas
          </p>
        </div>
        <div className='flex flex-col items-center justify-center mb-8'>
          <Link href='/app' >
            <BasicButton className='text-lg px-8 py-4'>
              Comenzar Ahora
            </BasicButton>
          </Link>
        </div>
        <AnimatedCharacter src='/sprites/characters/Character_009.png'/>
      </div>
    </div>
  )
}
