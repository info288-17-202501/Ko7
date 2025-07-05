from sqlalchemy import Table, Column, Integer, String, DateTime, MetaData, func
from database import metadata

usuarios = Table(
    "usuarios",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String(150), unique=True, nullable=False),
    Column("password_hash", String, nullable=False),
)
