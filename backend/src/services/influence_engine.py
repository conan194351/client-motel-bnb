"""
Influence Diagram Engine
Converts user preferences to criterion weights using influence diagram structure
"""

from typing import Dict, List, Tuple
import psycopg2
from psycopg2.extras import RealDictCursor


class InfluenceEngine:
    """
    Processes user preferences through the Influence Diagram
    to calculate final criterion weights
    """
    
    def __init__(self, db_connection):
        self.conn = db_connection
    
    def get_influence_structure(self) -> Tuple[Dict, Dict]:
        """
        Load the influence diagram structure from database
        Returns: (nodes_dict, edges_dict)
        """
        cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        
        # Load all nodes
        cursor.execute("""
            SELECT node_id, node_code, node_name, node_type
            FROM influence_nodes
            WHERE is_active = TRUE
            ORDER BY display_order
        """)
        nodes = {row['node_code']: dict(row) for row in cursor.fetchall()}
        
        # Load all edges with criterion mappings
        cursor.execute("""
            SELECT 
                p.node_code as parent_code,
                c.node_code as child_code,
                e.weight_factor,
                cr.code as criterion_code,
                cr.criterion_id
            FROM influence_edges e
            JOIN influence_nodes p ON e.parent_node_id = p.node_id
            JOIN influence_nodes c ON e.child_node_id = c.node_id
            LEFT JOIN criteria cr ON e.criterion_mapping_id = cr.criterion_id
            WHERE e.is_active = TRUE AND p.is_active = TRUE AND c.is_active = TRUE
        """)
        
        # Organize edges by parent
        edges = {}
        for row in cursor.fetchall():
            parent = row['parent_code']
            if parent not in edges:
                edges[parent] = []
            edges[parent].append(dict(row))
        
        cursor.close()
        return nodes, edges
    
    def calculate_weights(self, user_preferences: Dict[str, float]) -> Dict[str, float]:
        """
        Calculate criterion weights from user preferences
        
        Args:
            user_preferences: Dict like {
                'convenience_importance': 0.8,  # 0-1 scale
                'comfort_importance': 0.9,
                'value_importance': 0.6
            }
        
        Returns:
            Dict mapping criterion codes to weights, e.g.:
            {
                'PRICE': 0.25,
                'RATING_OVERALL': 0.20,
                'DISTANCE_CENTER': 0.15,
                ...
            }
        """
        nodes, edges = self.get_influence_structure()
        
        # Map user preferences to intermediate nodes or directly to criteria
        # Support both legacy and new format
        
        # Check if using new direct preference format
        if 'price_sensitivity' in user_preferences:
            # New format: map directly to criteria weights
            raw_weights = {
                'PRICE': user_preferences.get('price_sensitivity', 0.5),
                'RATING_OVERALL': user_preferences.get('comfort_priority', 0.5) * 0.4,
                'RATING_CLEANLINESS': user_preferences.get('cleanliness_priority', 0.5),
                'RATING_LOCATION': user_preferences.get('distance_tolerance', 0.5),
                'DISTANCE_CENTER': user_preferences.get('distance_tolerance', 0.5) * 0.3,
                'AMENITIES_COUNT': user_preferences.get('comfort_priority', 0.5) * 0.3,
                'VIEW_QUALITY': user_preferences.get('view_importance', 0.5),
            }
            
            # Normalize to sum to 1.0
            total = sum(raw_weights.values())
            if total > 0:
                return {k: v/total for k, v in raw_weights.items()}
            else:
                return {k: 1.0/len(raw_weights) for k in raw_weights.keys()}
        
        # Legacy format: use intermediate nodes
        intermediate_weights = {
            'CONVENIENCE': user_preferences.get('convenience_importance', 0.5),
            'COMFORT': user_preferences.get('comfort_importance', 0.5),
            'VALUE': user_preferences.get('value_importance', 0.5)
        }
        
        # Normalize intermediate weights so they sum to 1.0
        total = sum(intermediate_weights.values())
        if total > 0:
            intermediate_weights = {k: v/total for k, v in intermediate_weights.items()}
        
        # Calculate final criterion weights by propagating through the tree
        criterion_weights = {}
        
        for parent_code, parent_weight in intermediate_weights.items():
            if parent_code not in edges:
                continue
            
            # For each child of this intermediate node
            for edge in edges[parent_code]:
                if edge['criterion_code']:  # This is a leaf node mapped to a criterion
                    criterion_code = edge['criterion_code']
                    edge_weight = float(edge['weight_factor'])
                    
                    # Weight = parent_weight × edge_weight
                    contribution = parent_weight * edge_weight
                    
                    # Accumulate (in case multiple paths lead to same criterion)
                    if criterion_code in criterion_weights:
                        criterion_weights[criterion_code] += contribution
                    else:
                        criterion_weights[criterion_code] = contribution
        
        # Normalize to sum = 1.0
        total = sum(criterion_weights.values())
        if total > 0:
            criterion_weights = {k: v/total for k, v in criterion_weights.items()}
        
        return criterion_weights
    
    def explain_weights(self, criterion_weights: Dict[str, float]) -> List[Dict]:
        """
        Generate human-readable explanation of weight calculation
        """
        cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        
        explanations = []
        for criterion_code, weight in sorted(criterion_weights.items(), key=lambda x: x[1], reverse=True):
            cursor.execute("""
                SELECT name, description, unit
                FROM criteria
                WHERE code = %s
            """, (criterion_code,))
            
            criterion = cursor.fetchone()
            if criterion:
                explanations.append({
                    'criterion_code': criterion_code,
                    'criterion_name': criterion['name'],
                    'weight': weight,
                    'weight_percent': weight * 100,
                    'description': criterion['description'],
                    'unit': criterion['unit']
                })
        
        cursor.close()
        return explanations


def example_usage():
    """Example of how to use the InfluenceEngine"""
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    # Connect to database
    conn = psycopg2.connect(
        dbname=os.getenv('DB_NAME', 'stayhub'),
        user=os.getenv('DB_USER', 'stayhub_user'),
        password=os.getenv('DB_PASSWORD', 'stayhub_password'),
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432')
    )
    
    # Create engine
    engine = InfluenceEngine(conn)
    
    # User preferences (0-1 scale, where 1 = most important)
    user_prefs = {
        'convenience_importance': 0.8,  # Very important
        'comfort_importance': 0.9,      # Very important
        'value_importance': 0.5         # Moderately important
    }
    
    # Calculate weights
    weights = engine.calculate_weights(user_prefs)
    
    # Get explanations
    explanations = engine.explain_weights(weights)
    
    print("\n" + "="*60)
    print("CALCULATED CRITERION WEIGHTS")
    print("="*60)
    for exp in explanations:
        print(f"{exp['criterion_name']:30s} {exp['weight']:.4f} ({exp['weight_percent']:.1f}%)")
    print("="*60 + "\n")
    
    conn.close()


if __name__ == '__main__':
    example_usage()

