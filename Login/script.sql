-- 1. Crear base de datos
CREATE DATABASE users;

-- 2. Crear el usuario con contraseña
CREATE USER "Login_Admin" WITH PASSWORD 'dragonballaf';

-- 3. Darle todos los permisos sobre la base
GRANT ALL PRIVILEGES ON DATABASE users TO "Login_Admin";

-- 4. Conectarse a la base de datos (solo si lo haces en un entorno interactivo)
-- \c users

-- 5. Crear tabla usuarios
-- Este bloque solo debes ejecutarlo dentro de la base de datos `users`

-- Si lo ejecutas desde psql interactivo:
-- \c users

CREATE TABLE public.usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
);

-- 6. Dar permisos al usuario sobre la tabla y secuencia
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "Login_Admin";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "Login_Admin";
