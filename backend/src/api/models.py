"""
Pydantic models for API request/response validation
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import date


class UserPreferences(BaseModel):
    """User preference input for influence diagram"""
    # New frontend-compatible preferences
    price_sensitivity: float = Field(
        default=0.5, 
        ge=0.0, 
        le=1.0,
        description="Sensitivity to price (0=don't care, 1=very sensitive)"
    )
    comfort_priority: float = Field(
        default=0.5, 
        ge=0.0, 
        le=1.0,
        description="Priority for comfort/amenities (0-1 scale)"
    )
    distance_tolerance: float = Field(
        default=0.5, 
        ge=0.0, 
        le=1.0,
        description="Tolerance for distance (0=far ok, 1=must be near)"
    )
    view_importance: float = Field(
        default=0.5, 
        ge=0.0, 
        le=1.0,
        description="Importance of view/aesthetics (0-1 scale)"
    )
    cleanliness_priority: float = Field(
        default=0.5, 
        ge=0.0, 
        le=1.0,
        description="Priority for cleanliness (0-1 scale)"
    )
    
    # Backward compatibility (legacy fields)
    convenience_importance: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    comfort_importance: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    value_importance: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class Filters(BaseModel):
    """Filter criteria for room search"""
    min_price: Optional[float] = Field(default=None, description="Minimum price per night")
    max_price: Optional[float] = Field(default=None, description="Maximum price per night")
    min_rating: Optional[float] = Field(default=None, ge=0, le=5, description="Minimum rating")
    room_type: Optional[str] = Field(default=None, description="Room type filter")
    min_accommodates: Optional[int] = Field(default=None, ge=1, description="Minimum number of guests")
    max_distance: Optional[float] = Field(default=None, description="Maximum distance from location (km)")
    latitude: Optional[float] = Field(default=None, description="Latitude for distance calculation")
    longitude: Optional[float] = Field(default=None, description="Longitude for distance calculation")
    instant_bookable: Optional[bool] = Field(default=None, description="Only instant bookable")
    superhost_only: Optional[bool] = Field(default=False, description="Only superhosts")


class RecommendationRequest(BaseModel):
    """Request body for recommendation endpoint"""
    preferences: UserPreferences = Field(description="User preference weights")
    filters: Optional[Filters] = Field(default=None, description="Filter criteria")
    limit: int = Field(default=10, ge=1, le=100, description="Number of results to return")


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

