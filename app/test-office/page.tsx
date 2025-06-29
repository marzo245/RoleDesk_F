'use client'
import React, { useEffect, useState } from 'react'
import { sprites } from '@/utils/pixi/spritesheet/spritesheet'

export default function TestOfficePage() {
    const [loaded, setLoaded] = useState(false)
    const [error, setError] = useState<string>('')

    useEffect(() => {
        const loadSprites = async () => {
            try {
                await sprites.load('office')
                setLoaded(true)
            } catch (err) {
                setError(`Error loading office spritesheet: ${err}`)
                console.error(err)
            }
        }
        loadSprites()
    }, [])

    const TestSprite = ({ spriteName }: { spriteName: string }) => {
        try {
            const spriteData = sprites.spriteSheetDataSet['office'].sprites[spriteName]
            if (!spriteData) {
                return <div className="p-2 border border-red-500">❌ {spriteName}</div>
            }

            const src = sprites.spriteSheetDataSet['office'].url
            const { x, y, width, height } = spriteData
            const sheetWidth = sprites.spriteSheetDataSet['office'].width
            const sheetHeight = sprites.spriteSheetDataSet['office'].height
            const scale = 3 // Escalamos para ver mejor

            // Extraemos las coordenadas del nombre del sprite (formato: office_X_Y)
            const coords = spriteName.match(/office_(\d+)_(\d+)/)
            const col = coords ? coords[1] : '?'
            const row = coords ? coords[2] : '?'

            return (
                <div className="p-1 border border-green-500 flex flex-col items-center bg-white">
                    <div 
                        style={{
                            backgroundImage: `url(${src})`,
                            backgroundPosition: `-${x * scale}px -${y * scale}px`,
                            backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
                            width: `${width * scale}px`,
                            height: `${height * scale}px`,
                            imageRendering: 'pixelated'
                        }}
                    />
                    <span className="text-xs mt-1 text-center text-black">
                        Col {col}, Fila {row}
                        <br />
                        ({x},{y})
                    </span>
                </div>
            )
        } catch (err) {
            return <div className="p-2 border border-red-500">❌ Error: {spriteName}</div>
        }
    }

    if (error) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Office Spritesheet Test - ERROR</h1>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </div>
        )
    }

    if (!loaded) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Office Spritesheet Test</h1>
                <div>Loading office spritesheet...</div>
            </div>
        )
    }

    const spriteNames = sprites.spriteSheetDataSet['office'].spritesList.map(sprite => sprite.name)

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Office Spritesheet Test</h1>
            <div className="mb-4">
                <p>✅ Office spritesheet loaded successfully!</p>
                <p>Found {spriteNames.length} sprites</p>
            </div>
            
            <div className="grid grid-cols-24 gap-1 mb-4 max-w-full overflow-x-auto"
                 style={{ gridTemplateColumns: 'repeat(24, minmax(60px, 1fr))' }}>
                {spriteNames.map(spriteName => (
                    <TestSprite key={spriteName} spriteName={spriteName} />
                ))}
            </div>
            
            <div className="mt-8">
                <h2 className="text-xl font-bold mb-2">Sprites por capa:</h2>
                <div className="space-y-2">
                    <div>
                        <strong>Floor:</strong> {spriteNames.filter(name => {
                            const sprite = sprites.spriteSheetDataSet['office'].sprites[name]
                            return !sprite.layer || sprite.layer === 'floor'
                        }).length} sprites
                    </div>
                    <div>
                        <strong>Object:</strong> {spriteNames.filter(name => {
                            const sprite = sprites.spriteSheetDataSet['office'].sprites[name]
                            return sprite.layer === 'object'
                        }).length} sprites
                    </div>
                    <div>
                        <strong>Above Floor:</strong> {spriteNames.filter(name => {
                            const sprite = sprites.spriteSheetDataSet['office'].sprites[name]
                            return sprite.layer === 'above_floor'
                        }).length} sprites
                    </div>
                </div>
            </div>
        </div>
    )
}
