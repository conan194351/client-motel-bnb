-- ==========================================
-- BnB SmartChoice DSS Database Schema
-- Using Influence Diagram + TOPSIS Algorithm
-- ==========================================

-- Drop existing tables if needed (for development)
DROP TABLE IF EXISTS room_attributes CASCADE;
DROP TABLE IF EXISTS influence_edges CASCADE;
DROP TABLE IF EXISTS influence_nodes CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS recommendation_results CASCADE;
DROP TABLE IF EXISTS criteria CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- ==========================================
-- 1. ROOMS TABLE (Alternatives)
-- ==========================================
CREATE TABLE rooms (
    room_id SERIAL PRIMARY KEY,
    
    -- Basic Information
    listing_id BIGINT UNIQUE NOT NULL,  -- Original Airbnb ID
    name VARCHAR(500),
    description TEXT,
    
    -- Location
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    neighbourhood VARCHAR(255),
    neighbourhood_cleansed VARCHAR(255),
    
    -- Property Details
    property_type VARCHAR(100),
    room_type VARCHAR(50),  -- 'Entire home/apt', 'Private room', 'Shared room'
    accommodates INT,
    bedrooms DECIMAL(3,1),
    beds INT,
    bathrooms DECIMAL(3,1),
    
    -- Pricing
    price DECIMAL(10, 2) NOT NULL,
    minimum_nights INT,
    maximum_nights INT,
    
    -- Host Information
    host_id BIGINT,
    host_name VARCHAR(255),
    host_is_superhost BOOLEAN DEFAULT FALSE,
    host_response_rate VARCHAR(10),
    
    -- Reviews & Ratings
    number_of_reviews INT DEFAULT 0,
    review_scores_rating DECIMAL(3, 2),
    review_scores_accuracy DECIMAL(3, 2),
    review_scores_cleanliness DECIMAL(3, 2),
    review_scores_checkin DECIMAL(3, 2),
    review_scores_communication DECIMAL(3, 2),
    review_scores_location DECIMAL(3, 2),
    review_scores_value DECIMAL(3, 2),
    
    -- Availability
    availability_365 INT DEFAULT 0,
    instant_bookable BOOLEAN DEFAULT FALSE,
    
    -- Amenities
    amenities TEXT,  -- JSON array as text
    
    -- URLs
    listing_url TEXT,
    picture_url TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'AVAILABLE',  -- 'AVAILABLE', 'BOOKED', 'INACTIVE'
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_scraped DATE
);

-- Indexes for better query performance
CREATE INDEX idx_rooms_price ON rooms(price);
CREATE INDEX idx_rooms_location ON rooms(latitude, longitude);
CREATE INDEX idx_rooms_room_type ON rooms(room_type);
CREATE INDEX idx_rooms_rating ON rooms(review_scores_rating);
CREATE INDEX idx_rooms_status ON rooms(status);


-- ==========================================
-- 2. CRITERIA TABLE (Evaluation Dimensions)
-- ==========================================
CREATE TABLE criteria (
    criterion_id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,  -- 'PRICE', 'RATING', 'DISTANCE', etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- TOPSIS Configuration
    is_benefit BOOLEAN DEFAULT TRUE,  -- TRUE: Higher is better (Benefit), FALSE: Lower is better (Cost)
    
    -- Normalization bounds (optional, for display)
    min_value DECIMAL(10, 4),
    max_value DECIMAL(10, 4),
    
    -- Weight configuration
    default_weight DECIMAL(5, 4) DEFAULT 0.2,  -- Default weight if not specified
    
    -- Display
    unit VARCHAR(20),  -- '$', 'km', 'stars', etc.
    display_order INT DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. ROOM_ATTRIBUTES TABLE (Decision Matrix)
-- ==========================================
CREATE TABLE room_attributes (
    room_id INT REFERENCES rooms(room_id) ON DELETE CASCADE,
    criterion_id INT REFERENCES criteria(criterion_id) ON DELETE CASCADE,
    
    value DECIMAL(10, 4) NOT NULL,  -- Actual value (e.g., 500$, 2.5km, 4.8 stars)
    
    -- Metadata
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (room_id, criterion_id)
);

CREATE INDEX idx_room_attributes_room ON room_attributes(room_id);
CREATE INDEX idx_room_attributes_criterion ON room_attributes(criterion_id);


-- ==========================================
-- 4. INFLUENCE DIAGRAM STRUCTURE
-- ==========================================

-- 4.1 Influence Nodes (Decision Tree Nodes)
CREATE TABLE influence_nodes (
    node_id SERIAL PRIMARY KEY,
    node_name VARCHAR(100) NOT NULL,
    node_code VARCHAR(50) UNIQUE NOT NULL,  -- 'CONVENIENCE', 'COMFORT', 'VALUE'
    
    -- Node Type:
    -- 'ROOT' = Top-level objective (e.g., "Overall Satisfaction")
    -- 'INTERMEDIATE' = Mid-level goal (e.g., "Convenience", "Comfort")
    -- 'LEAF' = Maps to physical criterion (e.g., "Price Impact on Value")
    node_type VARCHAR(20) NOT NULL CHECK (node_type IN ('ROOT', 'INTERMEDIATE', 'LEAF')),
    
    description TEXT,
    
    -- Display
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4.2 Influence Edges (Relationships & Weights)
CREATE TABLE influence_edges (
    edge_id SERIAL PRIMARY KEY,
    
    parent_node_id INT REFERENCES influence_nodes(node_id) ON DELETE CASCADE,
    child_node_id INT REFERENCES influence_nodes(node_id) ON DELETE CASCADE,
    
    -- Weight factor: How much parent influences child (0.0 to 1.0)
    -- Note: Sum of weights from same parent should = 1.0
    weight_factor DECIMAL(5, 4) NOT NULL CHECK (weight_factor >= 0 AND weight_factor <= 1),
    
    -- If this is a LEAF node, map to physical criterion
    criterion_mapping_id INT REFERENCES criteria(criterion_id) ON DELETE SET NULL,
    
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    UNIQUE(parent_node_id, child_node_id)
);

CREATE INDEX idx_influence_edges_parent ON influence_edges(parent_node_id);
CREATE INDEX idx_influence_edges_child ON influence_edges(child_node_id);


-- ==========================================
-- 5. USER PREFERENCES (Session Storage)
-- ==========================================
CREATE TABLE user_preferences (
    preference_id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,  -- UUID from frontend
    
    -- Raw user input (JSON)
    raw_preferences JSONB,  -- e.g., {"price_importance": 0.8, "location_importance": 0.5}
    
    -- Computed weights (after Influence processing)
    computed_weights JSONB,  -- e.g., {"PRICE": 0.35, "RATING": 0.25, "DISTANCE": 0.40}
    
    -- Filter criteria
    filters JSONB,  -- e.g., {"city": "Albany", "min_price": 50, "max_price": 200}
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

CREATE INDEX idx_user_preferences_session ON user_preferences(session_id);


-- ==========================================
-- 6. RECOMMENDATION RESULTS (Cache & History)
-- ==========================================
CREATE TABLE recommendation_results (
    result_id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES user_preferences(session_id) ON DELETE CASCADE,
    
    room_id INT REFERENCES rooms(room_id) ON DELETE CASCADE,
    
    -- TOPSIS Scores
    topsis_score DECIMAL(5, 4) NOT NULL,  -- C_i value (0 to 1)
    distance_to_ideal DECIMAL(10, 6),     -- S_i^+
    distance_to_worst DECIMAL(10, 6),     -- S_i^-
    
    -- Ranking
    rank INT NOT NULL,
    
    -- Explanation (for UI)
    explanation TEXT,  -- e.g., "Best match for Price and Location"
    
    -- Debug info
    normalized_values JSONB,  -- Store v_ij values for debugging
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendation_results_session ON recommendation_results(session_id);
CREATE INDEX idx_recommendation_results_rank ON recommendation_results(session_id, rank);


-- ==========================================
-- UTILITY FUNCTIONS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rooms table
CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- VIEWS FOR CONVENIENCE
-- ==========================================

-- View: Complete room information with all attributes
CREATE OR REPLACE VIEW v_rooms_complete AS
SELECT 
    r.*,
    json_object_agg(c.code, ra.value) FILTER (WHERE ra.value IS NOT NULL) as attributes
FROM rooms r
LEFT JOIN room_attributes ra ON r.room_id = ra.room_id
LEFT JOIN criteria c ON ra.criterion_id = c.criterion_id
GROUP BY r.room_id;


-- View: Influence diagram tree structure
CREATE OR REPLACE VIEW v_influence_tree AS
SELECT 
    p.node_code as parent_code,
    p.node_name as parent_name,
    c.node_code as child_code,
    c.node_name as child_name,
    e.weight_factor,
    cr.code as criterion_code,
    cr.name as criterion_name,
    c.node_type
FROM influence_edges e
JOIN influence_nodes p ON e.parent_node_id = p.node_id
JOIN influence_nodes c ON e.child_node_id = c.node_id
LEFT JOIN criteria cr ON e.criterion_mapping_id = cr.criterion_id
WHERE e.is_active = TRUE AND p.is_active = TRUE AND c.is_active = TRUE
ORDER BY p.display_order, e.weight_factor DESC;


-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON TABLE rooms IS 'Stores property listings (Alternatives in TOPSIS)';
COMMENT ON TABLE criteria IS 'Evaluation dimensions/criteria for TOPSIS algorithm';
COMMENT ON TABLE room_attributes IS 'Decision matrix data - values for each room-criterion pair';
COMMENT ON TABLE influence_nodes IS 'Nodes in the Influence Diagram (decision tree)';
COMMENT ON TABLE influence_edges IS 'Edges showing influence relationships and weights';
COMMENT ON TABLE user_preferences IS 'User session preferences and computed weights';
COMMENT ON TABLE recommendation_results IS 'Cached TOPSIS results for user sessions';

