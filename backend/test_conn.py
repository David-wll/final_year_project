import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
uri = os.getenv("MONGO_URI")
print(f"Testing connection to: {uri}")

try:
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    print(f"Server info: {client.server_info()}")
    print("Connection successful!")
except Exception as e:
    print(f"Connection failed: {e}")
