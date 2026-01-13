#!/usr/bin/env python3
"""
Import listings from CSV to PostgreSQL Database
Calculates derived attributes for TOPSIS algorithm
"""

import csv
import json
import re
import os
from typing import Dict, List, Optional
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv


# Load environment variables
load_dotenv()


# Database connection configuration
DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'stayhub'),
    'user': os.getenv('DB_USER', 'stayhub_user'),
    'password': os.getenv('DB_PASSWORD', 'stayhub_password'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432')
}


# Reference location (e.g., Albany City Center)
# You can adjust this or make it configurable
REFERENCE_LOCATION = {
    'lat': 42.6526,  # Albany, NY downtown
    'lon': -73.7562
}


def clean_price(price_str: str) -> Optional[float]:
    """Convert price string like '$70.00' to float"""
    if not price_str or price_str == '':
        return None
    try:
        # Remove $ and commas, then convert to float
        cleaned = re.sub(r'[$,]', '', price_str)
        return float(cleaned)
    except (ValueError, AttributeError):
        return None


def clean_boolean(bool_str: str) -> bool:
    """Convert 't'/'f' or 'true'/'false' to boolean"""
    if not bool_str:
        return False
    return bool_str.lower() in ('t', 'true', '1', 'yes')


def clean_percentage(pct_str: str) -> Optional[float]:
    """Convert '100%' to 100.0"""
    if not pct_str or pct_str == 'N/A':
        return None
    try:
        return float(pct_str.replace('%', ''))
    except ValueError:
        return None


def clean_numeric(num_str: str) -> Optional[float]:
    """Convert string to float, handle empty/invalid values"""
    if not num_str or num_str == '':
        return None
    try:
        return float(num_str)
    except ValueError:
        return None


def clean_integer(int_str: str) -> Optional[int]:
    """Convert string to int, handle empty/invalid values"""
    if not int_str or int_str == '':
        return None
    try:
        return int(float(int_str))  # Handle cases like '2.0'
    except ValueError:
        return None


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance in kilometers using Haversine formula
    """
    from math import radians, cos, sin, asin, sqrt
    
    # Convert to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r


def count_amenities(amenities_str: str) -> int:
    """Count number of amenities from JSON array string"""
    if not amenities_str:
        return 0
    try:
        # Parse as JSON array
        amenities_list = json.loads(amenities_str.replace("'", '"'))
        return len(amenities_list)
    except (json.JSONDecodeError, ValueError):
        # Fallback: count commas + 1
        return amenities_str.count(',') + 1 if amenities_str else 0


def import_rooms(csv_file_path: str, conn) -> List[int]:
    """
    Import rooms from CSV file
    Returns list of room_ids
    """
    print(f"📥 Importing rooms from {csv_file_path}...")
    
    cursor = conn.cursor()
    room_ids = []
    
    insert_query = """
        INSERT INTO rooms (
            listing_id, name, description, latitude, longitude,
            neighbourhood, neighbourhood_cleansed, property_type, room_type,
            accommodates, bedrooms, beds, bathrooms, price,
            minimum_nights, maximum_nights, host_id, host_name,
            host_is_superhost, host_response_rate, number_of_reviews,
            review_scores_rating, review_scores_accuracy, review_scores_cleanliness,
            review_scores_checkin, review_scores_communication, review_scores_location,
            review_scores_value, availability_365, instant_bookable,
            amenities, listing_url, picture_url, status, last_scraped
        ) VALUES (
            %(listing_id)s, %(name)s, %(description)s, %(latitude)s, %(longitude)s,
            %(neighbourhood)s, %(neighbourhood_cleansed)s, %(property_type)s, %(room_type)s,
            %(accommodates)s, %(bedrooms)s, %(beds)s, %(bathrooms)s, %(price)s,
            %(minimum_nights)s, %(maximum_nights)s, %(host_id)s, %(host_name)s,
            %(host_is_superhost)s, %(host_response_rate)s, %(number_of_reviews)s,
            %(review_scores_rating)s, %(review_scores_accuracy)s, %(review_scores_cleanliness)s,
            %(review_scores_checkin)s, %(review_scores_communication)s, %(review_scores_location)s,
            %(review_scores_value)s, %(availability_365)s, %(instant_bookable)s,
            %(amenities)s, %(listing_url)s, %(picture_url)s, %(status)s, %(last_scraped)s
        )
        ON CONFLICT (listing_id) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            availability_365 = EXCLUDED.availability_365,
            updated_at = CURRENT_TIMESTAMP
        RETURNING room_id;
    """
    
    with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        rows_to_insert = []
        
        for row in reader:
            # Skip if no price or invalid location
            price = clean_price(row.get('price', ''))
            lat = clean_numeric(row.get('latitude', ''))
            lon = clean_numeric(row.get('longitude', ''))
            
            if not price or not lat or not lon:
                continue
            
            # Parse bathrooms from text like "1 bath" or "1.5 baths"
            bathrooms_text = row.get('bathrooms_text', '')
            bathrooms = None
            if bathrooms_text:
                bath_match = re.search(r'(\d+\.?\d*)', bathrooms_text)
                if bath_match:
                    bathrooms = float(bath_match.group(1))
            
            # Parse last_scraped date
            last_scraped = None
            if row.get('last_scraped'):
                try:
                    last_scraped = datetime.strptime(row['last_scraped'], '%Y-%m-%d').date()
                except ValueError:
                    pass
            
            room_data = {
                'listing_id': clean_integer(row.get('id', '')),
                'name': row.get('name', '')[:500],  # Limit length
                'description': row.get('description', ''),
                'latitude': lat,
                'longitude': lon,
                'neighbourhood': row.get('neighbourhood', ''),
                'neighbourhood_cleansed': row.get('neighbourhood_cleansed', ''),
                'property_type': row.get('property_type', ''),
                'room_type': row.get('room_type', ''),
                'accommodates': clean_integer(row.get('accommodates', '')),
                'bedrooms': clean_numeric(row.get('bedrooms', '')),
                'beds': clean_integer(row.get('beds', '')),
                'bathrooms': bathrooms,
                'price': price,
                'minimum_nights': clean_integer(row.get('minimum_nights', '')),
                'maximum_nights': clean_integer(row.get('maximum_nights', '')),
                'host_id': clean_integer(row.get('host_id', '')),
                'host_name': row.get('host_name', ''),
                'host_is_superhost': clean_boolean(row.get('host_is_superhost', 'f')),
                'host_response_rate': row.get('host_response_rate', ''),
                'number_of_reviews': clean_integer(row.get('number_of_reviews', '0')) or 0,
                'review_scores_rating': clean_numeric(row.get('review_scores_rating', '')),
                'review_scores_accuracy': clean_numeric(row.get('review_scores_accuracy', '')),
                'review_scores_cleanliness': clean_numeric(row.get('review_scores_cleanliness', '')),
                'review_scores_checkin': clean_numeric(row.get('review_scores_checkin', '')),
                'review_scores_communication': clean_numeric(row.get('review_scores_communication', '')),
                'review_scores_location': clean_numeric(row.get('review_scores_location', '')),
                'review_scores_value': clean_numeric(row.get('review_scores_value', '')),
                'availability_365': clean_integer(row.get('availability_365', '0')) or 0,
                'instant_bookable': clean_boolean(row.get('instant_bookable', 'f')),
                'amenities': row.get('amenities', ''),
                'listing_url': row.get('listing_url', ''),
                'picture_url': row.get('picture_url', ''),
                'status': 'AVAILABLE' if clean_integer(row.get('availability_365', '0')) > 0 else 'INACTIVE',
                'last_scraped': last_scraped
            }
            
            rows_to_insert.append(room_data)
            
            # Batch insert every 100 rows
            if len(rows_to_insert) >= 100:
                for room in rows_to_insert:
                    cursor.execute(insert_query, room)
                    room_id = cursor.fetchone()[0]
                    room_ids.append(room_id)
                conn.commit()
                print(f"  ✓ Imported {len(room_ids)} rooms...")
                rows_to_insert = []
        
        # Insert remaining rows
        if rows_to_insert:
            for room in rows_to_insert:
                cursor.execute(insert_query, room)
                room_id = cursor.fetchone()[0]
                room_ids.append(room_id)
            conn.commit()
    
    cursor.close()
    print(f"✅ Imported {len(room_ids)} rooms total!")
    return room_ids


def calculate_and_insert_attributes(conn):
    """
    Calculate attribute values for all rooms based on criteria
    This populates the room_attributes table (Decision Matrix)
    """
    print(f"🔢 Calculating room attributes...")
    
    cursor = conn.cursor()
    
    # Get all criteria
    cursor.execute("SELECT criterion_id, code FROM criteria WHERE is_active = TRUE")
    criteria = cursor.fetchall()
    
    # Get all rooms
    cursor.execute("""
        SELECT room_id, price, latitude, longitude, 
               review_scores_rating, review_scores_cleanliness, 
               review_scores_location, review_scores_value,
               accommodates, amenities
        FROM rooms
        WHERE status = 'AVAILABLE'
    """)
    rooms = cursor.fetchall()
    
    attributes_to_insert = []
    
    for room in rooms:
        room_id, price, lat, lon, rating, cleanliness, location_rating, value_rating, accommodates, amenities = room
        
        # Calculate distance to city center
        distance = calculate_distance(lat, lon, REFERENCE_LOCATION['lat'], REFERENCE_LOCATION['lon'])
        
        # Count amenities
        amenities_count = count_amenities(amenities)
        
        # Map criteria codes to values
        values_map = {
            'PRICE': price,
            'DISTANCE_CENTER': distance,
            'RATING_OVERALL': rating,
            'RATING_CLEANLINESS': cleanliness,
            'RATING_LOCATION': location_rating,
            'RATING_VALUE': value_rating,
            'ACCOMMODATES': accommodates,
            'AMENITIES_COUNT': amenities_count
        }
        
        # Insert attributes
        for criterion_id, code in criteria:
            value = values_map.get(code)
            if value is not None:  # Only insert if value exists
                attributes_to_insert.append((room_id, criterion_id, value))
    
    # Batch insert attributes
    if attributes_to_insert:
        insert_query = """
            INSERT INTO room_attributes (room_id, criterion_id, value)
            VALUES (%s, %s, %s)
            ON CONFLICT (room_id, criterion_id) DO UPDATE SET
                value = EXCLUDED.value,
                calculated_at = CURRENT_TIMESTAMP
        """
        execute_batch(cursor, insert_query, attributes_to_insert, page_size=1000)
        conn.commit()
    
    cursor.close()
    print(f"✅ Calculated {len(attributes_to_insert)} attributes!")


def print_statistics(conn):
    """Print import statistics"""
    cursor = conn.cursor()
    
    print("\n" + "="*50)
    print("📊 IMPORT STATISTICS")
    print("="*50)
    
    # Room count
    cursor.execute("SELECT COUNT(*) FROM rooms")
    room_count = cursor.fetchone()[0]
    print(f"Total Rooms: {room_count}")
    
    # Available rooms
    cursor.execute("SELECT COUNT(*) FROM rooms WHERE status = 'AVAILABLE'")
    available_count = cursor.fetchone()[0]
    print(f"Available Rooms: {available_count}")
    
    # Price statistics
    cursor.execute("SELECT MIN(price), AVG(price), MAX(price) FROM rooms")
    min_price, avg_price, max_price = cursor.fetchone()
    print(f"Price Range: ${min_price:.2f} - ${max_price:.2f} (avg: ${avg_price:.2f})")
    
    # Rating statistics
    cursor.execute("""
        SELECT AVG(review_scores_rating), COUNT(*) 
        FROM rooms 
        WHERE review_scores_rating IS NOT NULL
    """)
    avg_rating, rated_count = cursor.fetchone()
    if avg_rating:
        print(f"Average Rating: {avg_rating:.2f} ({rated_count} rooms with ratings)")
    
    # Attributes count
    cursor.execute("SELECT COUNT(*) FROM room_attributes")
    attr_count = cursor.fetchone()[0]
    print(f"Total Attributes Calculated: {attr_count}")
    
    # Criteria count
    cursor.execute("SELECT COUNT(*) FROM criteria WHERE is_active = TRUE")
    criteria_count = cursor.fetchone()[0]
    print(f"Active Criteria: {criteria_count}")
    
    print("="*50 + "\n")
    
    cursor.close()


def main():
    """Main import function"""
    print("\n" + "="*50)
    print("🚀 BnB SmartChoice DSS - Data Importer")
    print("="*50 + "\n")
    
    # CSV file path
    csv_file = os.path.join(os.path.dirname(__file__), '..', 'listings.csv')
    
    if not os.path.exists(csv_file):
        print(f"❌ Error: CSV file not found at {csv_file}")
        return
    
    try:
        # Connect to database
        print(f"🔌 Connecting to database: {DB_CONFIG['dbname']}@{DB_CONFIG['host']}...")
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Connected!\n")
        
        # Import rooms
        room_ids = import_rooms(csv_file, conn)
        
        if not room_ids:
            print("❌ No rooms imported!")
            return
        
        # Calculate attributes
        calculate_and_insert_attributes(conn)
        
        # Print statistics
        print_statistics(conn)
        
        # Close connection
        conn.close()
        print("✅ Import completed successfully!")
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    main()

