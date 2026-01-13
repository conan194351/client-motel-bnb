"""
Database connection management
"""

import os
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()


class Database:
    """Database connection pool manager"""
    
    _pool = None
    
    @classmethod
    def initialize(cls):
        """Initialize connection pool"""
        if cls._pool is None:
            cls._pool = SimpleConnectionPool(
                minconn=1,
                maxconn=10,
                dbname=os.getenv('DB_NAME', 'stayhub'),
                user=os.getenv('DB_USER', 'stayhub_user'),
                password=os.getenv('DB_PASSWORD', 'stayhub_password'),
                host=os.getenv('DB_HOST', 'localhost'),
                port=os.getenv('DB_PORT', '5432')
            )
    
    @classmethod
    def get_connection(cls):
        """Get a connection from the pool"""
        if cls._pool is None:
            cls.initialize()
        return cls._pool.getconn()
    
    @classmethod
    def return_connection(cls, conn):
        """Return a connection to the pool"""
        if cls._pool is not None:
            cls._pool.putconn(conn)
    
    @classmethod
    def close_all(cls):
        """Close all connections in the pool"""
        if cls._pool is not None:
            cls._pool.closeall()
            cls._pool = None


@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = Database.get_connection()
    try:
        yield conn
    finally:
        Database.return_connection(conn)


def test_connection():
    """Test database connection"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            cursor.close()
            return True, version[0]
    except Exception as e:
        return False, str(e)

