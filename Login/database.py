from sqlalchemy import create_engine, MetaData
from databases import Database
from dotenv import load_dotenv
import os

load_dotenv()  # Carga variables del .env

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    raise ValueError("DATABASE_URL no está definida")

database = Database(DATABASE_URL)  # para conexiones async
engine = create_engine(DATABASE_URL)  # para metadata.create_all()
metadata = MetaData()
