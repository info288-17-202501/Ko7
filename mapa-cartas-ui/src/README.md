# 🎨 Interfaz Gráfica — Juego de Cartas Hexagonal

Este directorio contiene **toda la lógica y presentación de la interfaz gráfica** del juego, desarrollada en React. Aquí encontrarás los componentes, utilidades, imágenes y **estilos personalizados** que definen la experiencia visual y de usuario.

---

## 📁 Estructura de Carpetas

```
src/
│
├── App.jsx, main.jsx, index.css      # Entrada y raíz de la app
├── Game.jsx, HexCell.jsx, Card.jsx   # Tablero, celdas y cartas
├── MainMenu.jsx, menu.jsx            # Menús principales
├── Login.jsx, AuthForms.jsx          # Autenticación y usuario
├── DeckCreator.jsx, cardApiClient.js # Barajas y API de cartas
│
├── assets/   # Imágenes generales (logo, tablero, etc)
├── images/   # Sprites de cartas (por ID)
└── styles/   # Estilos CSS personalizados
    ├── animations.css
    ├── background.css
    ├── buttons.css
    ├── screen.css
    └── server-list.css
```

---

## 🎨 Filosofía y Detalles de Estilos

La interfaz busca ser **moderna, clara y visualmente atractiva**, con inspiración en juegos de cartas digitales y tableros hexagonales. Los estilos están pensados para:

- **Resaltar la información clave** (cartas, rarezas, selección)
- **Facilitar la interacción** (drag & drop, hover, feedback visual)
- **Mantener una paleta sobria y elegante**, con toques de color para rarezas y acciones importantes

### Principales decisiones de diseño y explicación de los estilos

#### 1. **Estilos globales y fondos (`background.css`, `screen.css`)**

- **Fondos oscuros** (`#000`, gradientes púrpura/azul) para dar protagonismo a los elementos del juego y reducir fatiga visual.
- **Efectos de ruido, scanlines y partículas** para dar un aire retro/cyberpunk y profundidad visual.
- **Fuentes**: Uso de `'Press Start 2P', cursive` para títulos y elementos clave, evocando videojuegos clásicos.
- **Escalado de contenido** (`screen.css`): El contenido principal se escala al 80% para que todo se vea centrado y con aire, sin scrolls molestos.

#### 2. **Animaciones y feedback (`animations.css`)**

- **Animaciones de color, fade-in, typing y RGB** para títulos, textos y efectos de aparición.
- **Animaciones de borde y sombra** en hexágonos y cartas para resaltar selección, rareza y hover.
- **Transiciones suaves** en todos los elementos interactivos.

#### 3. **Cartas y rarezas (`background.css`)**

- **Colores y gradientes** para cada rareza:
  - Común: verdes.
  - Rara: azules.
  - Épica: morados.
  - Legendaria: dorados y amarillos.
- **Animaciones de gradiente y borde** para que cada rareza tenga su propia "vida" visual.
- **Hover**: Sombra azul y borde resaltado para feedback inmediato.

#### 4. **Tablero y celdas hexagonales (`background.css`)**

- **SVG y clip-path** para hexágonos perfectos.
- **Animaciones de pulso** y gradientes para hexágonos seleccionados o en hover.
- **Colores**: Neutros para celdas normales, dorado y rosa para selección y hover.

#### 5. **Botones (`server-list.css`, `buttons.css`)**

- **Botones "cyberpunk"** con formas personalizadas usando `clip-path`, gradientes y animaciones de glitch.
- **Colores**:
  - Primarios: dorados y azules.
  - Secundarios: azules claros.
  - Éxito/peligro: verdes y rojos.
- **Hover**: Efectos de pulso, brillo y glitch para dar sensación de tecnología y acción.
- **Tamaños**: Grandes y legibles, con variantes para móvil y botones pequeños (logout, etc).
- **Tipografía**: `'Cyber'` y `'Press Start 2P'` para mantener la coherencia visual.

#### 6. **Paneles y menús (`server-list.css`)**

- **Paneles translúcidos** con `backdrop-filter: blur` para dar profundidad y separar visualmente las capas.
- **Sombras y bordes redondeados** para suavizar el diseño.
- **Scrollbars personalizados** para mantener la estética en listas largas.
- **Títulos con sombra y gradiente** para destacar secciones importantes.

#### 7. **Login y formularios (`server-list.css`)**

- **Fondos translúcidos y blur** para el formulario, centrado y con padding generoso.
- **Inputs grandes y claros**, con bordes animados y colores de feedback.
- **Errores y mensajes**: Colores vivos (rojo para error, verde para éxito), animaciones de shake y fade-in.

#### 8. **Responsive**

- **Media queries** para adaptar tamaños de fuente, botones y paneles en pantallas pequeñas.
- **Flexbox y grid** para centrar y distribuir elementos en cualquier resolución.

---

## 🧩 Componentes Clave

- **App.jsx**: Punto de entrada, gestiona login y navegación.
- **Game.jsx**: Lógica y renderizado del tablero, conexión con el servidor de partidas.
- **Card.jsx**: Renderizado de cartas, drag & drop, descripción emergente.
- **HexCell.jsx**: Celdas hexagonales SVG, gestión de posiciones.
- **MainMenu.jsx**: Menú principal tras login.
- **AuthForms.jsx**: Formularios de login, registro y usuario.
- **DeckCreator.jsx**: Herramienta para crear y editar barajas.

---

## 📦 Estilos Personalizados

- **animations.css**:Animaciones de color, fade-in, typing, RGB, pulso y bordes animados para hexágonos y cartas.
- **background.css**:Fondos, gradientes, ruido, scanlines, partículas, estilos de rareza de cartas, hexágonos y animaciones de tablero.
- **buttons.css**:Barra inferior deslizante y botón flotante para acciones rápidas.
- **screen.css**:Centrado y escalado del contenido principal, sin scrolls.
- **server-list.css**:
  Paneles translúcidos, listas de servidores, botones cyberpunk, formularios y menús con blur y gradientes.

---

## 🖼️ Imágenes y Recursos

- **assets/**: Imágenes generales (logo, tablero, etc).
- **images/**: Sprites de cartas, nombradas por ID.

---

## 🚀 Cómo iniciar la interfaz

1. Instala dependencias:
   ```sh
   bun install
   ```
2. Ejecuta en modo desarrollo:
   ```sh
   bun run dev
   ```
3. Accede a [http://localhost:5173](http://localhost:5173)

---

## 📝 Notas

- Los estilos están pensados para ser **claros, accesibles y agradables**.
- Puedes personalizar colores y tamaños en los archivos CSS según tus preferencias.
- Las animaciones y transiciones mejoran la experiencia, pero puedes desactivarlas si buscas un estilo más minimalista.
- El sistema de rarezas y colores ayuda a identificar rápidamente el valor de cada carta.
- El diseño cyberpunk y retro se logra con gradientes, fuentes pixeladas y efectos de glitch.

---

¡Explora, personaliza y haz tuya la interfaz!
Si tienes dudas sobre algún estilo o componente, revisa los comentarios en los archivos CSS y JSX.

---
