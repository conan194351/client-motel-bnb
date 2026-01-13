-- ==========================================
-- SEED DATA: Criteria & Influence Diagram
-- ==========================================

-- ==========================================
-- 1. INSERT CRITERIA (Evaluation Dimensions)
-- ==========================================

INSERT INTO criteria (code, name, description, is_benefit, default_weight, unit, display_order) VALUES
-- Cost Criteria (Lower is better)
('PRICE', 'Price per Night', 'Nightly rental price', FALSE, 0.25, '$', 1),
('DISTANCE_CENTER', 'Distance to City Center', 'Distance to downtown/main attractions', FALSE, 0.15, 'km', 2),

-- Benefit Criteria (Higher is better)
('RATING_OVERALL', 'Overall Rating', 'Average review rating', TRUE, 0.20, 'stars', 3),
('RATING_CLEANLINESS', 'Cleanliness Rating', 'Cleanliness score from reviews', TRUE, 0.10, 'stars', 4),
('RATING_LOCATION', 'Location Rating', 'Location convenience score', TRUE, 0.10, 'stars', 5),
('RATING_VALUE', 'Value Rating', 'Value for money score', TRUE, 0.10, 'stars', 6),
('ACCOMMODATES', 'Accommodation Capacity', 'Number of guests it can accommodate', TRUE, 0.05, 'people', 7),
('AMENITIES_COUNT', 'Amenities Count', 'Number of amenities provided', TRUE, 0.05, 'items', 8);


-- ==========================================
-- 2. INSERT INFLUENCE DIAGRAM STRUCTURE
-- ==========================================

-- 2.1 Insert Nodes
INSERT INTO influence_nodes (node_code, node_name, node_type, description, display_order) VALUES
-- Root Node (Ultimate Goal)
('ROOT_SATISFACTION', 'Overall Satisfaction', 'ROOT', 'Ultimate goal: User satisfaction with accommodation choice', 1),

-- Intermediate Nodes (High-level Objectives)
('CONVENIENCE', 'Convenience', 'INTERMEDIATE', 'How convenient and accessible the property is', 2),
('COMFORT', 'Comfort & Quality', 'INTERMEDIATE', 'Quality of stay experience', 3),
('VALUE', 'Value for Money', 'INTERMEDIATE', 'Cost-benefit balance', 4),

-- Leaf Nodes (Map to Physical Criteria)
('LEAF_PRICE', 'Price Impact', 'LEAF', 'Price influences value perception', 5),
('LEAF_DISTANCE', 'Location Proximity', 'LEAF', 'Distance influences convenience', 6),
('LEAF_RATING_OVERALL', 'Overall Quality', 'LEAF', 'Overall rating influences comfort', 7),
('LEAF_RATING_CLEANLINESS', 'Cleanliness Quality', 'LEAF', 'Cleanliness influences comfort', 8),
('LEAF_RATING_LOCATION', 'Location Quality', 'LEAF', 'Location rating influences convenience', 9),
('LEAF_RATING_VALUE', 'Value Perception', 'LEAF', 'Value rating influences value objective', 10),
('LEAF_AMENITIES', 'Amenities Richness', 'LEAF', 'Number of amenities influences comfort', 11);


-- 2.2 Insert Edges (Relationships)

-- Level 1: ROOT -> Intermediate Nodes
-- Weights sum to 1.0 for each parent
INSERT INTO influence_edges (parent_node_id, child_node_id, weight_factor, description) VALUES
(
    (SELECT node_id FROM influence_nodes WHERE node_code = 'ROOT_SATISFACTION'),
    (SELECT node_id FROM influence_nodes WHERE node_code = 'CONVENIENCE'),
    0.30,
    'Convenience contributes 30% to overall satisfaction'
),
(
    (SELECT node_id FROM influence_nodes WHERE node_code = 'ROOT_SATISFACTION'),
    (SELECT node_id FROM influence_nodes WHERE node_code = 'COMFORT'),
    0.40,
    'Comfort contributes 40% to overall satisfaction'
),
(
    (SELECT node_id FROM influence_nodes WHERE node_code = 'ROOT_SATISFACTION'),
    (SELECT node_id FROM influence_nodes WHERE node_code = 'VALUE'),
    0.30,
    'Value contributes 30% to overall satisfaction'
);


-- Level 2: Intermediate Nodes -> Leaf Nodes (with Criterion Mapping)

-- CONVENIENCE influenced by:
INSERT INTO influence_edges (parent_node_id, child_node_id, weight_factor, criterion_mapping_id, description) VALUES
(
    (SELECT node_id FROM influence_nodes WHERE node_code = 'CONVENIENCE'),
    (SELECT node_id FROM influence_nodes WHERE node_code = 'LEAF_DISTANCE'),
    0.60,
    (SELECT criterion_id FROM criteria WHERE code = 'DISTANCE_CENTER'),
    'Distance is 60% of convenience'
),
(
    (SELECT node_id FROM influence_nodes WHERE node_code = 'CONVENIENCE'),
    (SELECT node_id FROM influence_nodes WHERE node_code = 'LEAF_RATING_LOCATION'),
    0.40,
    (SELECT criterion_id FROM criteria WHERE code = 'RATING_LOCATION'),
    'Location rating is 40% of convenience'
);

-- COMFORT influenced by:
INSERT INTO influence_edges (parent_node_id, child_node_id, weight_factor, criterion_mapping_id, description) VALUES
(
    (SELECT node_id FROM influence_nodes WHERE node_code = 'COMFORT'),
    (SELECT node_id FROM influence_nodes WHERE node_code = 'LEAF_RATING_OVERALL'),
    0.40,
    (SELECT criterion_id FROM criteria WHERE code = 'RATING_OVERALL'),
    'Overall rating is 40% of comfort'
),
(
    (SELECT node_id FROM influence_nodes WHERE node_code = 'COMFORT'),
    (SELECT node_id FROM influence_nodes WHERE node_code = 'LEAF_RATING_CLEANLINESS'),
    0.35,
    (SELECT criterion_id FROM criteria WHERE code = 'RATING_CLEANLINESS'),
    'Cleanliness is 35% of comfort'
),
(
    (SELECT node_id FROM influence_nodes WHERE node_code = 'COMFORT'),
    (SELECT node_id FROM influence_nodes WHERE node_code = 'LEAF_AMENITIES'),
    0.25,
    (SELECT criterion_id FROM criteria WHERE code = 'AMENITIES_COUNT'),
    'Amenities are 25% of comfort'
);

-- VALUE influenced by:
INSERT INTO influence_edges (parent_node_id, child_node_id, weight_factor, criterion_mapping_id, description) VALUES
(
    (SELECT node_id FROM influence_nodes WHERE node_code = 'VALUE'),
    (SELECT node_id FROM influence_nodes WHERE node_code = 'LEAF_PRICE'),
    0.60,
    (SELECT criterion_id FROM criteria WHERE code = 'PRICE'),
    'Price is 60% of value perception'
),
(
    (SELECT node_id FROM influence_nodes WHERE node_code = 'VALUE'),
    (SELECT node_id FROM influence_nodes WHERE node_code = 'LEAF_RATING_VALUE'),
    0.40,
    (SELECT criterion_id FROM criteria WHERE code = 'RATING_VALUE'),
    'Value rating is 40% of value perception'
);


-- ==========================================
-- 3. VERIFY DATA
-- ==========================================

-- Check criteria count
SELECT COUNT(*) as criteria_count FROM criteria;

-- Check influence structure
SELECT * FROM v_influence_tree;

-- Verify weight sums (should be 1.0 for each parent)
SELECT 
    p.node_code,
    p.node_name,
    SUM(e.weight_factor) as total_weight,
    COUNT(*) as child_count
FROM influence_edges e
JOIN influence_nodes p ON e.parent_node_id = p.node_id
WHERE e.is_active = TRUE
GROUP BY p.node_id, p.node_code, p.node_name
ORDER BY p.display_order;


-- ==========================================
-- 4. EXAMPLE: View Influence Diagram Tree
-- ==========================================

SELECT 
    CONCAT(REPEAT('  ', 
        CASE 
            WHEN parent_code = 'ROOT_SATISFACTION' THEN 0
            WHEN parent_code IN ('CONVENIENCE', 'COMFORT', 'VALUE') THEN 1
            ELSE 2
        END
    ), child_name) as tree_structure,
    weight_factor,
    criterion_code
FROM v_influence_tree
ORDER BY 
    CASE parent_code
        WHEN 'ROOT_SATISFACTION' THEN 1
        WHEN 'CONVENIENCE' THEN 2
        WHEN 'COMFORT' THEN 3
        WHEN 'VALUE' THEN 4
        ELSE 5
    END,
    weight_factor DESC;

