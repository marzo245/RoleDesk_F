# Spritesheet de Oficina - Documentación

## Información General
- **Archivo**: `/public/sprites/spritesheets/office.png`
- **Dimensiones**: 384x288 px (24 sprites x 16px de ancho, 18 sprites x 16px de alto)
- **Tamaño de sprite**: 16x16 px cada uno
- **Mapeo**: `utils/pixi/spritesheet/office.ts`

## Sprites Disponibles

### Pisos
- `office_floor_gray_1` - Piso gris claro
- `office_floor_gray_2` - Piso gris medio
- `office_floor_beige` - Piso beige/crema
- `office_floor_dark` - Piso oscuro/charcoal
- `office_floor_carpet_1` - Alfombra tipo 1
- `office_floor_carpet_2` - Alfombra tipo 2
- `office_floor_carpet_3` - Alfombra tipo 3
- `office_floor_wood_1` - Piso de madera tipo 1
- `office_floor_wood_2` - Piso de madera tipo 2
- `office_floor_wood_3` - Piso de madera tipo 3

### Plantas
- `office_plant_small_1` - Planta pequeña variante 1
- `office_plant_small_2` - Planta pequeña variante 2
- `office_plant_tall_1` - Planta alta variante 1
- `office_plant_tall_2` - Planta alta variante 2
- `office_plant_medium_1` - Planta mediana variante 1
- `office_plant_medium_2` - Planta mediana variante 2
- `office_plant_large_1` - Planta grande variante 1
- `office_plant_large_2` - Planta grande variante 2

### Puertas
- `office_door_wood_closed` - Puerta de madera cerrada
- `office_door_wood_open` - Puerta de madera abierta
- `office_door_1` - Puerta variante 1
- `office_door_2` - Puerta variante 2
- `office_door_3` - Puerta variante 3
- `office_door_4` - Puerta variante 4

### Muebles de Almacenamiento
- `office_bookshelf` - Estantería de libros
- `office_filing_cabinet` - Archivero
- `office_safe` - Caja fuerte
- `office_server_rack` - Rack de servidores

### Escritorios y Equipos
- `office_desk_with_pc` - Escritorio con computadora
- `office_computer_monitor` - Monitor de computadora
- `office_laptop_desk` - Escritorio con laptop
- `office_desk_empty` - Escritorio vacío
- `office_desk_large` - Escritorio grande
- `office_meeting_table` - Mesa de reuniones

### Sillas
- `office_chair_blue_1` - Silla azul variante 1
- `office_chair_blue_2` - Silla azul variante 2
- `office_chair_blue_3` - Silla azul variante 3
- `office_chair_blue_4` - Silla azul variante 4
- `office_chair_blue_5` - Silla azul variante 5
- `office_chair_dark_1` - Silla oscura variante 1
- `office_chair_guest` - Silla de visitante
- `office_chair_white` - Silla blanca

### Equipos de Oficina
- `office_printer` - Impresora
- `office_scanner` - Escáner
- `office_copier` - Fotocopiadora
- `office_fax` - Máquina de fax

### Amenidades
- `office_water_cooler` - Dispensador de agua
- `office_vending_machine` - Máquina expendedora
- `office_coffee_machine` - Máquina de café

### Elementos de Pared/Decoración
- `office_calendar` - Calendario
- `office_whiteboard` - Pizarra blanca
- `office_wall_1` - Pared variante 1
- `office_wall_2` - Pared variante 2
- `office_window_1` - Ventana variante 1
- `office_window_2` - Ventana variante 2
- `office_blinds_1` - Persianas variante 1
- `office_blinds_2` - Persianas variante 2
- `office_clock` - Reloj
- `office_picture_frame` - Marco de cuadro

### Iluminación
- `office_lamp_desk` - Lámpara de escritorio
- `office_lamp_ceiling` - Lámpara de techo

### Accesorios de Escritorio
- `office_keyboard` - Teclado
- `office_mouse` - Mouse
- `office_phone` - Teléfono
- `office_stapler` - Engrapadora
- `office_pen_holder` - Porta plumas
- `office_papers` - Papeles
- `office_folder` - Carpeta
- `office_trash_can` - Bote de basura

## Capas (Layers)
- **Sin capa especificada**: Elementos de piso
- **`object`**: Elementos sólidos con colisión
- **`above_floor`**: Elementos decorativos sin colisión

## Uso en el Editor
La paleta 'office' está disponible en el editor de mapas. Los sprites se pueden seleccionar y colocar en el mapa usando las herramientas del editor.

## Archivo de Ejemplo
Se incluye un mapa de ejemplo en `utils/officemap.json` que muestra cómo usar los sprites de oficina para crear un ambiente de trabajo realista.
