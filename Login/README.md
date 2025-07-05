# API de Login - FastAPI

Este proyecto implementa una API de autenticación básica (registro e inicio de sesión) usando FastAPI, PostgreSQL y SQLAlchemy.

## 🚀 Instalación

1. **Clona el repositorio** y entra a la carpeta `Login`:

   ```bash
   cd Login
   ```
2. **Instala las dependencias** (usa un entorno virtual recomendado):

   ```bash
   pip install -r requirements.txt
   ```
3. **Configura la base de datos**:

   - Edita el archivo `.env` si necesitas cambiar la conexión.
   - Ejecuta el script `script.sql` en tu PostgreSQL para crear la base y la tabla de usuarios.
4. **Inicia el servidor**:

   ```bash
   uvicorn main_backend:app --reload
   ```

   El servidor estará disponible en [http://localhost:8000](http://localhost:8000).

## 📋 Endpoints principales

- `POST /register`Registra un nuevo usuario.**Body:**

  ```json
  {
    "username": "usuario",
    "password": "contraseña"
  }
  ```
- `POST /login`
  Inicia sesión con usuario y contraseña.
  **Body:**

  ```json
  {
    "username": "usuario",
    "password": "contraseña"
  }
  ```

## 📝 Notas

- El CORS está habilitado para permitir peticiones desde cualquier origen (útil para desarrollo con React).
- La contraseña se almacena de forma segura (hash).
- Revisa el archivo `requirements.txt` para ver todas las dependencias necesarias.

---

¡Listo para usar como backend de autenticación en tus proyectos!
