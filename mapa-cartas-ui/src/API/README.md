# API para Interfaz de Cartas

Esta API proporciona un backend para gestionar las cartas del juego de tablero hexagonal.

## Estructura de la API

La API está organizada en los siguientes módulos:

- `server.js`: Punto de entrada principal que configura y arranca el servidor Express
- `dbConfig.js`: Configuración de la conexión a PostgreSQL
- `dbConnection.js`: Gestión de la conexión y consultas a la base de datos
- `cardRepository.js`: Operaciones CRUD para las cartas
- `routes/cardRoutes.js`: Definición de endpoints de la API
- `cardClient.js`: Cliente para consumir la API desde el frontend
- `useCardApi.js`: Hook de React para integrar la API en componentes
- `schema.sql`: Script SQL para crear la estructura de la base de datos
- `startServer.js`: Script para iniciar el servidor API

## Instalación y Configuración

1. Asegúrate de tener PostgreSQL instalado y ejecutándose
2. Crea una base de datos llamada "Card Details DB"
3. Ejecuta el script `schema.sql` para crear las tablas necesarias
4. Configura las variables de entorno en el archivo `.env`
5. Instala las dependencias con `npm install`

## Iniciar el Servidor API

```bash
node src/API/startServer.js
```

El servidor se ejecutará en http://localhost:3030 por defecto.

## Endpoints Disponibles

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | /api/cards | Obtener todas las cartas |
| GET | /api/cards/:id | Obtener una carta por ID |
| POST | /api/cards | Crear una nueva carta |
| PUT | /api/cards/:id | Actualizar una carta existente |
| DELETE | /api/cards/:id | Eliminar una carta |

## Uso en la Aplicación React

Para utilizar la API en los componentes de React:

```jsx
import { useCardApi } from './API/useCardApi';

function CardList() {
  const { cards, loading, error, fetchCards } = useCardApi();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Listado de Cartas</h2>
      <button onClick={fetchCards}>Recargar</button>
      <ul>
        {cards.map(card => (
          <li key={card.id}>
            {card.type}{card.id} - {card.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Esquema de Datos de Carta

```typescript
interface Card {
  id: number;
  type: string;        // P (Personaje), O (Objeto), A (Aliado), H (Hechizo)
  color: string;       // Formato hexadecimal: #RRGGBB
  name: string;
  rarity: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}
```
