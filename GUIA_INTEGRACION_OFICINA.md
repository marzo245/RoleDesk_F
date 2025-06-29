# Guía de Integración del Spritesheet de Oficina

## Pasos para Completar la Integración

### 1. **Reemplazar el Archivo PNG**
- Guarda tu spritesheet de oficina como: `public/sprites/spritesheets/office.png`
- Actualmente hay un archivo placeholder que necesitas reemplazar

### 2. **Verificar las Dimensiones**
Tu spritesheet parece tener las siguientes características:
- Grid organizado de sprites de 32x32 píxeles
- Aproximadamente 24 columnas x 18 filas
- Dimensiones totales estimadas: 768x576 píxeles

Si las dimensiones son diferentes, actualiza estas líneas en `utils/pixi/spritesheet/office.ts`:
```typescript
const width = 768   // Cambia por el ancho real de tu imagen
const height = 576  // Cambia por la altura real de tu imagen
```

### 3. **Ajustar Coordenadas de Sprites**
He mapeado los sprites principales basándome en tu imagen, pero es posible que necesites ajustar las coordenadas exactas. Cada sprite se define así:

```typescript
{ name: 'sprite_name', x: 64, y: 32, width: 32, height: 32, layer: 'object', colliders: [{ x: 0, y: 0 }] }
```

**Parámetros:**
- `name`: Nombre único del sprite
- `x, y`: Coordenadas en píxeles (esquina superior izquierda)
- `width, height`: Tamaño del sprite en píxeles
- `layer`: Capa de renderizado
  - Sin especificar = piso (floor)
  - `'object'` = objetos con colisión
  - `'above_floor'` = elementos decorativos sin colisión
- `colliders`: Array de posiciones que bloquean el movimiento

### 4. **Sprites Mapeados Actualmente**

He mapeado los siguientes sprites basándome en tu imagen:

**Pisos:**
- `office_floor_light_gray` - Piso gris claro
- `office_floor_dark_gray` - Piso gris oscuro
- `office_floor_beige` - Piso beige
- `office_floor_brown` - Piso marrón

**Plantas:**
- `office_plant_small_1` a `office_plant_small_4` - Plantas pequeñas
- `office_plant_medium_1` a `office_plant_medium_5` - Plantas medianas
- `office_plant_tall` - Planta alta

**Puertas:**
- `office_door_1` a `office_door_4` - Puertas cerradas
- `office_door_open_1` a `office_door_open_4` - Puertas abiertas

**Muebles:**
- `office_bookshelf_1`, `office_bookshelf_2` - Estanterías
- `office_filing_cabinet_1`, `office_filing_cabinet_2` - Archivadores
- `office_desk_with_computer` - Escritorios con computadora
- `office_chair_blue_1` a `office_chair_blue_5` - Sillas azules
- `office_chair_dark_1` a `office_chair_dark_4` - Sillas oscuras
- `office_conference_table_large` - Mesa de conferencias
- `office_printer_small` - Impresora
- `office_coffee_machine` - Máquina de café
- `office_water_cooler` - Dispensador de agua

### 5. **Probar la Integración**

1. **Inicia el proyecto:**
   ```cmd
   npm run dev
   ```

2. **Ve al editor del juego** (probablemente en `/editor` o similar)

3. **Busca el spritesheet "office"** en el menú de sprites

4. **Crea un nuevo mapa** o edita uno existente para probar los sprites

### 6. **Usar el Mapa de Ejemplo**

He creado un mapa de ejemplo en `utils/officemap.json` que muestra:
- Área de trabajo con escritorios y sillas
- Sala de reuniones con mesa de conferencias
- Elementos decorativos como plantas y máquinas

### 7. **Cambiar el Mapa por Defecto (Opcional)**

Si quieres usar la temática de oficina como predeterminada:
```cmd
copy "utils\officemap.json" "utils\defaultmap.json"
```

### 8. **Solución de Problemas**

**Si los sprites no aparecen:**
- Verifica que el archivo PNG esté en la ruta correcta
- Comprueba las dimensiones del spritesheet en `office.ts`
- Asegúrate de que las coordenadas x/y sean correctas

**Si las colisiones no funcionan:**
- Revisa el array `colliders` de cada sprite
- Los valores x/y en colliders son relativos al sprite (0,0 = esquina superior izquierda)

**Si los sprites se ven cortados:**
- Ajusta los valores `width` y `height` de cada sprite
- Verifica que las coordenadas no se superpongan

### 9. **Agregar Más Sprites**

Para agregar sprites adicionales:
1. Identifica las coordenadas en tu PNG
2. Agrega una nueva entrada al array `sprites` en `office.ts`
3. Usa el sprite en tus mapas con el nombre que le hayas dado

## Archivos Modificados

- ✅ `utils/pixi/spritesheet/office.ts` - Definiciones de sprites
- ✅ `utils/pixi/spritesheet/spritesheet.ts` - Registro del nuevo spritesheet
- ✅ `utils/officemap.json` - Mapa de ejemplo
- ⏳ `public/sprites/spritesheets/office.png` - **Reemplaza con tu imagen**

¡Una vez que reemplaces el archivo PNG, tu nuevo spritesheet de oficina estará listo para usar!
