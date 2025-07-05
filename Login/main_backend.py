from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from database import database, metadata, DATABASE_URL
from models import usuarios
from schemas import UsuarioCreate, UsuarioLogin
from auth import hash_password, verify_password
from sqlalchemy import create_engine, select
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todos los orígenes en desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear base de datos y conectar
engine = create_engine(DATABASE_URL)
metadata.create_all(engine)

#Register
@app.post("/register")
async def register(user: UsuarioCreate):
    print(f"Datos recibidos: username={user.username}, password_length={len(user.password)}")
    
    # Verificar usuario existente
    query = usuarios.select().where(usuarios.c.username == user.username)
    existing_user = await database.fetch_one(query)
    if existing_user:
        print(f"Error: El usuario '{user.username}' ya existe")
        raise HTTPException(status_code=400, detail="Usuario ya existe")

    # Crear usuario nuevo
    try:
        hashed = hash_password(user.password)
        query = usuarios.insert().values(username=user.username, password_hash=hashed)
        await database.execute(query)
        print(f"Usuario '{user.username}' creado exitosamente")
        return {"message": "Usuario creado exitosamente"}
    except Exception as e:
        print(f"Error al crear usuario: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al crear usuario: {str(e)}")

# Login
@app.post("/login")
async def login(user: UsuarioLogin):
    query = usuarios.select().where(usuarios.c.username == user.username)
    db_user = await database.fetch_one(query)
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    return {
        "message": f"Bienvenido {user.username}", 
        "user": {
            "id": db_user["id"],           # ← AGREGAR EL ID
            "username": user.username,
            "user_id": db_user["id"]       # ← Por si acaso usas otro nombre
        }
    }
