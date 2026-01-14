"""
Pydantic models for API request/response validation
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import date


# ============================================
# REQUEST MODELS
# ============================================


class UserPreferences(BaseModel):
    """
    User preference input for influence diagram
    
    Các giá trị từ 0.0 trở lên thể hiện mức độ ưu tiên (sẽ được normalize):
    - 0.0-0.3: Không quan trọng
    - 0.4-0.6: Trung bình
    - 0.7-1.0: Rất quan trọng
    
    Note: Values will be automatically normalized, so they can exceed 1.0
    """
    # New frontend-compatible preferences
    price_sensitivity: float = Field(
        default=0.5, 
        ge=0.0,
        description="Sensitivity to price (0=don't care, higher=more sensitive)",
        example=0.7
    )
    comfort_priority: float = Field(
        default=0.5, 
        ge=0.0,
        description="Priority for comfort/amenities (0=low, higher=more important)",
        example=0.8
    )
    distance_tolerance: float = Field(
        default=0.5, 
        ge=0.0,
        description="Tolerance for distance (0=far ok, higher=must be near)",
        example=0.6
    )
    view_importance: float = Field(
        default=0.5, 
        ge=0.0,
        description="Importance of view/aesthetics (0=not important, higher=more important)",
        example=0.5
    )
    cleanliness_priority: float = Field(
        default=0.5, 
        ge=0.0,
        description="Priority for cleanliness (0=low, higher=more important)",
        example=0.9
    )
    
    # Backward compatibility (legacy fields)
    convenience_importance: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    comfort_importance: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    value_importance: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class UserLocation(BaseModel):
    """
    User's location coordinates (GPS)
    
    Examples:
    - Ho Chi Minh City (Ben Thanh Market): lat=10.762622, lng=106.660172
    - Hanoi (Hoan Kiem Lake): lat=21.028511, lng=105.804817
    - Da Nang (Dragon Bridge): lat=16.061380, lng=108.227480
    """
    latitude: float = Field(
        description="User's latitude", 
        ge=-90, 
        le=90,
        example=10.762622
    )
    longitude: float = Field(
        description="User's longitude", 
        ge=-180, 
        le=180,
        example=106.660172
    )


class Filters(BaseModel):
    """
    Filter criteria for room search (hard constraints)
    
    Các bộ lọc này sẽ loại bỏ phòng không đáp ứng trước khi ranking.
    """
    min_price: Optional[float] = Field(
        default=None, 
        description="Minimum price per night (VND)",
        example=100000
    )
    max_price: Optional[float] = Field(
        default=None, 
        description="Maximum price per night (VND)",
        example=2000000
    )
    min_rating: Optional[float] = Field(
        default=None, 
        ge=0, 
        le=5, 
        description="Minimum rating (0-5 stars)",
        example=4.0
    )
    room_type: Optional[str] = Field(
        default=None, 
        description="Room type filter",
        example="Entire home/apt"
    )
    min_accommodates: Optional[int] = Field(
        default=None, 
        ge=1, 
        description="Minimum number of guests",
        example=2
    )
    max_distance: Optional[float] = Field(
        default=None, 
        description="Maximum distance from user location (km)",
        example=10.0
    )
    instant_bookable: Optional[bool] = Field(
        default=None, 
        description="Only instant bookable",
        example=True
    )
    superhost_only: Optional[bool] = Field(
        default=False, 
        description="Only superhosts",
        example=False
    )


class RecommendationRequest(BaseModel):
    """
    Request body for recommendation endpoint
    
    Example:
    ```json
    {
      "user_location": {"latitude": 10.762622, "longitude": 106.660172},
      "preferences": {
        "price_sensitivity": 0.7,
        "comfort_priority": 0.8,
        "distance_tolerance": 0.6,
        "view_importance": 0.5,
        "cleanliness_priority": 0.9
      },
      "filters": {
        "max_price": 2000000,
        "min_rating": 4.0,
        "max_distance": 10
      },
      "limit": 10
    }
    ```
    """
    user_location: UserLocation = Field(
        description="User's current location coordinates (required)"
    )
    preferences: UserPreferences = Field(
        description="User preference weights (0-1 scale)"
    )
    filters: Optional[Filters] = Field(
        default=None, 
        description="Optional filter criteria (hard constraints)"
    )
    limit: int = Field(
        default=10, 
        ge=1, 
        le=100, 
        description="Number of results to return",
        example=10
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_location": {
                    "latitude": 10.762622,
                    "longitude": 106.660172
                },
                "preferences": {
                    "price_sensitivity": 0.7,
                    "comfort_priority": 0.8,
                    "distance_tolerance": 0.6,
                    "view_importance": 0.5,
                    "cleanliness_priority": 0.9
                },
                "filters": {
                    "max_price": 2000000,
                    "min_rating": 4.0,
                    "max_distance": 10
                },
                "limit": 10
            }
        }


class RoomSummary(BaseModel):
    """Summary information for a room"""
    room_id: int
    listing_id: int
    name: str
    price: float
    latitude: float
    longitude: float
    room_type: str
    accommodates: Optional[int]
    bedrooms: Optional[float]
    review_scores_rating: Optional[float]
    number_of_reviews: int
    picture_url: Optional[str]
    listing_url: Optional[str]
    distance_km: Optional[float] = Field(default=None, description="Distance from user location in km")


class RecommendationResult(BaseModel):
    """Single recommendation result"""
    rank: int
    room: RoomSummary
    topsis_score: float = Field(description="TOPSIS similarity score (0-1)")
    explanation: str = Field(description="Human-readable explanation")
    distance_to_ideal: float
    distance_to_worst: float


class WeightExplanation(BaseModel):
    """Explanation of calculated criterion weights"""
    criterion_code: str
    criterion_name: str
    weight: float
    weight_percent: float
    description: str
    unit: str


class RecommendationResponse(BaseModel):
    """Response from recommendation endpoint"""
    session_id: str = Field(description="Session ID for caching")
    total_evaluated: int = Field(description="Total number of rooms evaluated")
    computed_weights: Dict[str, float] = Field(description="Calculated criterion weights")
    weight_explanations: List[WeightExplanation]
    ranked_results: List[RecommendationResult]
    processing_time_ms: float


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    database: str
    rooms_count: int
    criteria_count: int


class StatsResponse(BaseModel):
    """Statistics response"""
    total_rooms: int
    available_rooms: int
    price_range: Dict[str, float]
    average_rating: Optional[float]
    room_types: Dict[str, int]

