import { SpriteSheetTile } from './spritesheet'
import { SpriteSheetData } from './SpriteSheetData'

const width = 128
const height = 112
const url = '/sprites/spritesheets/office.png'

const sprites: SpriteSheetTile[] = [
    { name: 'desk_left', x: 0, y: 0, width: 16, height: 16, layer: 'object', colliders: [{ x: 0, y: 0 }] },
    { name: 'desk_right', x: 16, y: 0, width: 16, height: 16, layer: 'object', colliders: [{ x: 0, y: 0 }] },
    { name: 'chair', x: 32, y: 0, width: 16, height: 16, layer: 'object', colliders: [{ x: 0, y: 0 }] },
    { name: 'computer', x: 48, y: 0, width: 16, height: 16, layer: 'object', colliders: [{ x: 0, y: 0 }] },
    { name: 'plant', x: 64, y: 0, width: 16, height: 16, layer: 'object', colliders: [{ x: 0, y: 0 }] },
    { name: 'bookshelf', x: 80, y: 0, width: 16, height: 16, layer: 'object', colliders: [{ x: 0, y: 0 }] },
    { name: 'filing_cabinet', x: 96, y: 0, width: 16, height: 16, layer: 'object', colliders: [{ x: 0, y: 0 }] },
    { name: 'office_floor', x: 112, y: 0, width: 16, height: 16, layer: 'floor' },
]

const officeSpriteSheetData = new SpriteSheetData(width, height, url, sprites)

export { officeSpriteSheetData }
