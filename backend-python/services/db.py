import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

client: AsyncIOMotorClient = None
db = None

async def connect_db():
    global client, db
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/cv-screener")
    client = AsyncIOMotorClient(uri)
    db = client["cv-screener"]
    print("✅ Python connected to MongoDB")

def get_db():
    return db
