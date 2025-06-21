# Interfaz de Juego de Cartas Hexagonal

Una aplicación web que implementa un juego de cartas sobre un tablero hexagonal, conectado a una base de datos PostgreSQL utilizando una API REST.

## Características

- Tablero de juego hexagonal interactivo
- Sistema de arrastrar y soltar cartas
- Cartas con descripciones emergentes
- API REST para la gestión de cartas
- Conexión a base de datos PostgreSQL
- Interfaz adaptativa que se ajusta al tamaño de la pantalla

## Estructura del Proyecto

```
.
├── /public            # Archivos estáticos
├── /src               # Código fuente
│   ├── /API           # Módulos de la API
│   │   ├── /routes    # Rutas de la API
│   │   └── ...        # Otros archivos de la API
│   ├── /assets        # Recursos gráficos
│   ├── App.jsx        # Componente principal original
│   ├── GameBoardWithAPI.jsx # Versión con conexión a API
│   ├── Card.jsx       # Componente de carta
│   ├── HexCell.jsx    # Componente de celda hexagonal
│   └── main.jsx       # Punto de entrada de React
└── ...                # Archivos de configuración
```

## Requisitos previos

- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)
- Base de datos "Card Details DB" creada en PostgreSQL

## Instalación

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno en `.env`
4. Ejecutar el script SQL: `psql -U postgres -d "Card Details DB" -f src/API/schema.sql`

## Ejecución del proyecto

Para ejecutar tanto la API como la interfaz de usuario:

```bash
npm run start
```

Para ejecutar solo la API:

```bash
npm run api
```

Para ejecutar solo la interfaz:

```bash
npm run dev
```

## Endpoints de la API

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | /api/cards | Obtener todas las cartas |
| GET | /api/cards/:id | Obtener una carta por ID |
| POST | /api/cards | Crear una nueva carta |
| PUT | /api/cards/:id | Actualizar una carta existente |
| DELETE | /api/cards/:id | Eliminar una carta |

## Estructura de las Cartas

Una carta contiene los siguientes campos:

- `id`: Identificador único de la carta
- `type`: Tipo de carta (P: Personaje, O: Objeto, A: Aliado, H: Hechizo)
- `color`: Color de la carta en formato hexadecimal
- `name`: Nombre de la carta
- `rarity`: Rareza de la carta
- `description`: Descripción detallada de la carta

## Tecnologías utilizadas

- React con Vite para el frontend
- Express.js para la API REST
- PostgreSQL como base de datos
- Node.js para el entorno de ejecución
