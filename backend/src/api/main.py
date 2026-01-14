"""
FastAPI Main Application
BnB SmartChoice DSS Backend
"""

import os
import time
import uuid
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

from .models import (
    RecommendationRequest, RecommendationResponse, RecommendationResult,
    RoomSummary, WeightExplanation, HealthResponse, StatsResponse, UserLocation
)
from .database import Database, get_db_connection, test_connection
from ..services.influence_engine import InfluenceEngine
from ..services.topsis_engine import TOPSISEngine

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="BnB SmartChoice DSS API",
    description="Decision Support System using Influence Diagram + TOPSIS for BnB recommendations",
    version="1.0.0"
)

# CORS Configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup/Shutdown Events
@app.on_event("startup")
async def startup_event():
    """Initialize database connection pool"""
    print("🚀 Starting BnB SmartChoice DSS API...")
    Database.initialize()
    success, info = test_connection()
    if success:
        print(f"✅ Database connected: {info[:50]}...")
    else:
        print(f"❌ Database connection failed: {info}")


@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections"""
    print("🛑 Shutting down...")
    Database.close_all()


# ============================================
# ENDPOINTS
# ============================================

@app.get("/", tags=["General"])
async def root():
    """Root endpoint"""
    return {
        "message": "BnB SmartChoice DSS API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse, tags=["General"])
async def health_check():
    """Health check endpoint"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check rooms
            cursor.execute("SELECT COUNT(*) FROM rooms")
            rooms_count = cursor.fetchone()[0]
            
            # Check criteria
            cursor.execute("SELECT COUNT(*) FROM criteria WHERE is_active = TRUE")
            criteria_count = cursor.fetchone()[0]
            
            cursor.close()
            
            return HealthResponse(
                status="healthy",
                database="connected",
                rooms_count=rooms_count,
                criteria_count=criteria_count
            )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")


@app.get("/stats", response_model=StatsResponse, tags=["General"])
async def get_statistics():
    """Get database statistics"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Total rooms
            cursor.execute("SELECT COUNT(*) as count FROM rooms")
            total_rooms = cursor.fetchone()['count']
            
            # Available rooms
            cursor.execute("SELECT COUNT(*) as count FROM rooms WHERE status = 'AVAILABLE'")
            available_rooms = cursor.fetchone()['count']
            
            # Price range
            cursor.execute("SELECT MIN(price) as min, AVG(price) as avg, MAX(price) as max FROM rooms")
            price_stats = cursor.fetchone()
            
            # Average rating
            cursor.execute("""
                SELECT AVG(review_scores_rating) as avg_rating 
                FROM rooms 
                WHERE review_scores_rating IS NOT NULL
            """)
            avg_rating = cursor.fetchone()['avg_rating']
            
            # Room types distribution
            cursor.execute("""
                SELECT room_type, COUNT(*) as count 
                FROM rooms 
                GROUP BY room_type
            """)
            room_types = {row['room_type']: row['count'] for row in cursor.fetchall()}
            
            cursor.close()
            
            return StatsResponse(
                total_rooms=total_rooms,
                available_rooms=available_rooms,
                price_range={
                    'min': float(price_stats['min']) if price_stats['min'] else 0,
                    'avg': float(price_stats['avg']) if price_stats['avg'] else 0,
                    'max': float(price_stats['max']) if price_stats['max'] else 0
                },
                average_rating=float(avg_rating) if avg_rating else None,
                room_types=room_types
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/dss/recommend", response_model=RecommendationResponse, tags=["Recommendations"])
async def get_recommendations(request: RecommendationRequest):
    """
    Main recommendation endpoint using Influence Diagram + TOPSIS with User Location
    
    This endpoint:
    1. Takes user's location coordinates as required input
    2. Converts user preferences to criterion weights using Influence Diagram
    3. Filters rooms based on hard constraints and distance from user
    4. Calculates distances for all candidate rooms
    5. Ranks rooms using TOPSIS algorithm with distance as a criterion
    6. Returns top N recommendations with explanations and distances
    """
    start_time = time.time()
    
    try:
        with get_db_connection() as conn:
            # Step 1: Convert preferences to weights using Influence Engine
            influence_engine = InfluenceEngine(conn)
            
            # Map frontend preferences to backend weights
            user_prefs = {
                'price_sensitivity': request.preferences.price_sensitivity,
                'comfort_priority': request.preferences.comfort_priority,
                'distance_tolerance': request.preferences.distance_tolerance,
                'view_importance': request.preferences.view_importance,
                'cleanliness_priority': request.preferences.cleanliness_priority,
            }
            
            criterion_weights = influence_engine.calculate_weights(user_prefs)
            weight_explanations = influence_engine.explain_weights(criterion_weights)
            
            # Step 2: Filter rooms based on hard constraints with distance calculation
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Build WHERE clause
            where_conditions = ["status = 'AVAILABLE'"]
            params = []
            
            # Haversine formula for distance calculation (in km)
            # Using user's location coordinates
            user_lat = request.user_location.latitude
            user_lng = request.user_location.longitude
            
            # Distance formula without alias (for WHERE/HAVING clauses)
            distance_formula = f"""(6371 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians({user_lat})) * cos(radians(latitude)) * 
                    cos(radians(longitude) - radians({user_lng})) + 
                    sin(radians({user_lat})) * sin(radians(latitude))
                ))
            ))"""
            
            # Distance select with alias (for SELECT clause)
            distance_select = f"{distance_formula} as distance"
            
            # Apply filters
            if request.filters:
                if request.filters.min_price is not None:
                    where_conditions.append("price >= %s")
                    params.append(request.filters.min_price)
                
                if request.filters.max_price is not None:
                    where_conditions.append("price <= %s")
                    params.append(request.filters.max_price)
                
                if request.filters.min_rating is not None:
                    where_conditions.append("review_scores_rating >= %s")
                    params.append(request.filters.min_rating)
                
                if request.filters.room_type:
                    where_conditions.append("room_type = %s")
                    params.append(request.filters.room_type)
                
                if request.filters.min_accommodates is not None:
                    where_conditions.append("accommodates >= %s")
                    params.append(request.filters.min_accommodates)
                
                if request.filters.instant_bookable is not None:
                    where_conditions.append("instant_bookable = %s")
                    params.append(request.filters.instant_bookable)
                
                if request.filters.superhost_only:
                    where_conditions.append("host_is_superhost = TRUE")
            
            where_clause = " AND ".join(where_conditions)
            
            # Get filtered rooms with distance calculation
            query = f"""
                SELECT 
                    room_id,
                    latitude,
                    longitude,
                    {distance_select}
                FROM rooms
                WHERE {where_clause}
                  AND latitude IS NOT NULL 
                  AND longitude IS NOT NULL
            """
            
            # Add distance filter if specified
            if request.filters and request.filters.max_distance is not None:
                query += f" AND {distance_formula} <= %s"
                params.append(request.filters.max_distance)
            
            query += """
                ORDER BY distance ASC, review_scores_rating DESC NULLS LAST
                LIMIT 100
            """
            
            cursor.execute(query, params)
            room_data = cursor.fetchall()
            
            if not room_data:
                cursor.close()
                return RecommendationResponse(
                    session_id=str(uuid.uuid4()),
                    total_evaluated=0,
                    computed_weights=criterion_weights,
                    weight_explanations=[WeightExplanation(**exp) for exp in weight_explanations],
                    ranked_results=[],
                    processing_time_ms=(time.time() - start_time) * 1000
                )
            
            room_ids = [row['room_id'] for row in room_data]
            room_distances = {row['room_id']: float(row['distance']) for row in room_data}
            
            cursor.close()
            
            # Step 3: Rank using TOPSIS with distance integrated
            topsis_engine = TOPSISEngine(conn)
            topsis_results = topsis_engine.rank_alternatives(room_ids, criterion_weights)
            
            # Step 4: Get room details for top results
            top_results = topsis_results[:request.limit]
            top_room_ids = [r['room_id'] for r in top_results]
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            room_ids_str = ','.join(map(str, top_room_ids))
            
            # Get full room details with distance
            cursor.execute(f"""
                SELECT 
                    room_id, listing_id, name, price, latitude, longitude,
                    room_type, accommodates, bedrooms, 
                    review_scores_rating, number_of_reviews,
                    picture_url, listing_url,
                    {distance_select}
                FROM rooms
                WHERE room_id IN ({room_ids_str})
            """)
            
            rooms_dict = {row['room_id']: dict(row) for row in cursor.fetchall()}
            cursor.close()
            
            # Step 5: Build response with distance information
            ranked_results = []
            for result in top_results:
                room_data = rooms_dict.get(result['room_id'])
                if room_data:
                    # Add distance to room data
                    distance_km = room_distances.get(result['room_id'])
                    room_data['distance_km'] = round(distance_km, 2) if distance_km else None
                    
                    # Enhance explanation with distance info
                    explanation = result['explanation']
                    if distance_km is not None:
                        if distance_km < 1:
                            explanation += f". Very close ({distance_km:.1f} km)"
                        elif distance_km < 3:
                            explanation += f". Nearby ({distance_km:.1f} km)"
                        elif distance_km < 10:
                            explanation += f". Moderate distance ({distance_km:.1f} km)"
                        else:
                            explanation += f". Distance: {distance_km:.1f} km"
                    
                    ranked_results.append(RecommendationResult(
                        rank=result['rank'],
                        room=RoomSummary(**room_data),
                        topsis_score=result['topsis_score'],
                        explanation=explanation,
                        distance_to_ideal=result['distance_to_ideal'],
                        distance_to_worst=result['distance_to_worst']
                    ))
            
            # Generate session ID
            session_id = str(uuid.uuid4())
            
            # Calculate processing time
            processing_time = (time.time() - start_time) * 1000
            
            return RecommendationResponse(
                session_id=session_id,
                total_evaluated=len(room_ids),
                computed_weights=criterion_weights,
                weight_explanations=[WeightExplanation(**exp) for exp in weight_explanations],
                ranked_results=ranked_results,
                processing_time_ms=processing_time
            )
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing recommendation: {str(e)}")


@app.get("/api/v1/rooms", tags=["Rooms"])
async def search_rooms(
    city: Optional[str] = Query(None, description="Filter by city/location"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    min_rating: Optional[float] = Query(None, description="Minimum rating"),
    room_type: Optional[str] = Query(None, description="Room type"),
    limit: int = Query(50, ge=1, le=100, description="Number of results")
):
    """Simple room search endpoint (without DSS)"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            where_conditions = ["status = 'AVAILABLE'"]
            params = []
            
            if min_price is not None:
                where_conditions.append("price >= %s")
                params.append(min_price)
            
            if max_price is not None:
                where_conditions.append("price <= %s")
                params.append(max_price)
            
            if min_rating is not None:
                where_conditions.append("review_scores_rating >= %s")
                params.append(min_rating)
            
            if room_type:
                where_conditions.append("room_type = %s")
                params.append(room_type)
            
            where_clause = " AND ".join(where_conditions)
            params.append(limit)
            
            cursor.execute(f"""
                SELECT 
                    room_id, listing_id, name, price, latitude, longitude,
                    room_type, accommodates, bedrooms, bathrooms,
                    review_scores_rating, number_of_reviews,
                    picture_url, listing_url,
                    host_name, host_is_superhost
                FROM rooms
                WHERE {where_clause}
                ORDER BY review_scores_rating DESC NULLS LAST
                LIMIT %s
            """, params)
            
            rooms = cursor.fetchall()
            cursor.close()
            
            return {
                "total": len(rooms),
                "rooms": [dict(room) for room in rooms]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/rooms/{room_id}", tags=["Rooms"])
async def get_room_details(room_id: int):
    """Get detailed information for a specific room"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT * FROM rooms WHERE room_id = %s
            """, (room_id,))
            
            room = cursor.fetchone()
            
            if not room:
                raise HTTPException(status_code=404, detail="Room not found")
            
            # Get attributes
            cursor.execute("""
                SELECT c.code, c.name, ra.value, c.unit
                FROM room_attributes ra
                JOIN criteria c ON ra.criterion_id = c.criterion_id
                WHERE ra.room_id = %s
                ORDER BY c.display_order
            """, (room_id,))
            
            attributes = cursor.fetchall()
            
            # Get normalized values for radar chart
            cursor.execute("""
                SELECT c.code, ra.value
                FROM room_attributes ra
                JOIN criteria c ON ra.criterion_id = c.criterion_id
                WHERE ra.room_id = %s AND c.is_active = TRUE
            """, (room_id,))
            
            raw_attributes = cursor.fetchall()
            normalized_values = {}
            
            # Simple normalization for visualization
            for attr in raw_attributes:
                code = attr['code'].lower()
                value = float(attr['value'])
                # Normalize to 0-1 range (simplified)
                if code == 'price':
                    normalized_values['price'] = min(1.0, 1.0 - (value / 1000000))  # Inverse for price
                elif code.startswith('rating'):
                    normalized_values[code.replace('rating_', '')] = value / 5.0  # Rating 0-5 to 0-1
                else:
                    normalized_values[code] = min(1.0, value / 100.0)  # Generic normalization
            
            cursor.close()
            
            return {
                "room": dict(room),
                "attributes": [dict(attr) for attr in attributes],
                "normalized_values": normalized_values
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/criteria", tags=["Configuration"])
async def get_criteria():
    """Get all active evaluation criteria"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT * FROM criteria 
                WHERE is_active = TRUE 
                ORDER BY display_order
            """)
            
            criteria = cursor.fetchall()
            cursor.close()
            
            return {"criteria": [dict(c) for c in criteria]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/influence-diagram", tags=["Configuration"])
async def get_influence_diagram():
    """Get the influence diagram structure"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("SELECT * FROM v_influence_tree")
            
            tree = cursor.fetchall()
            cursor.close()
            
            return {"influence_tree": [dict(node) for node in tree]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Run with: uvicorn src.api.main:app --reload
# ============================================

