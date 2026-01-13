"""
TOPSIS (Technique for Order Preference by Similarity to Ideal Solution) Engine
Implements the TOPSIS algorithm for multi-criteria decision making
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
import psycopg2
from psycopg2.extras import RealDictCursor


class TOPSISEngine:
    """
    Implements TOPSIS algorithm for ranking alternatives
    """
    
    def __init__(self, db_connection):
        self.conn = db_connection
    
    def get_decision_matrix(self, room_ids: List[int], criterion_codes: List[str]) -> Tuple[np.ndarray, List[int], List[str]]:
        """
        Retrieve decision matrix from database
        
        Returns:
            - matrix: numpy array of shape (m_rooms, n_criteria)
            - room_ids_ordered: list of room_ids in matrix row order
            - criterion_codes_ordered: list of criterion codes in matrix column order
        """
        cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        
        # Build query to get all attributes
        room_ids_str = ','.join(map(str, room_ids))
        criterion_codes_str = ','.join([f"'{code}'" for code in criterion_codes])
        
        cursor.execute(f"""
            SELECT 
                ra.room_id,
                c.code as criterion_code,
                ra.value
            FROM room_attributes ra
            JOIN criteria c ON ra.criterion_id = c.criterion_id
            WHERE ra.room_id IN ({room_ids_str})
              AND c.code IN ({criterion_codes_str})
            ORDER BY ra.room_id, c.display_order
        """)
        
        rows = cursor.fetchall()
        
        # Organize data into matrix
        data_dict = {}
        for row in rows:
            room_id = row['room_id']
            code = row['criterion_code']
            value = float(row['value'])
            
            if room_id not in data_dict:
                data_dict[room_id] = {}
            data_dict[room_id][code] = value
        
        # Convert to numpy matrix
        room_ids_ordered = sorted(data_dict.keys())
        criterion_codes_ordered = criterion_codes
        
        matrix = []
        for room_id in room_ids_ordered:
            row = []
            for code in criterion_codes_ordered:
                value = data_dict.get(room_id, {}).get(code, 0.0)
                row.append(value)
            matrix.append(row)
        
        cursor.close()
        return np.array(matrix, dtype=float), room_ids_ordered, criterion_codes_ordered
    
    def normalize_matrix(self, matrix: np.ndarray) -> np.ndarray:
        """
        Normalize decision matrix using vector normalization
        r_ij = x_ij / sqrt(sum(x_ij^2))
        """
        # Calculate sum of squares for each column
        sum_of_squares = np.sum(matrix ** 2, axis=0)
        
        # Avoid division by zero
        sum_of_squares = np.where(sum_of_squares == 0, 1, sum_of_squares)
        
        # Normalize
        normalized = matrix / np.sqrt(sum_of_squares)
        
        return normalized
    
    def apply_weights(self, normalized_matrix: np.ndarray, weights: np.ndarray) -> np.ndarray:
        """
        Apply weights to normalized matrix
        v_ij = w_j * r_ij
        """
        return normalized_matrix * weights
    
    def get_ideal_solutions(self, weighted_matrix: np.ndarray, is_benefit: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Determine ideal best (A+) and ideal worst (A-) solutions
        
        Args:
            weighted_matrix: weighted normalized matrix
            is_benefit: boolean array indicating if criterion is benefit (True) or cost (False)
        
        Returns:
            - ideal_best: A+ array
            - ideal_worst: A- array
        """
        ideal_best = np.zeros(weighted_matrix.shape[1])
        ideal_worst = np.zeros(weighted_matrix.shape[1])
        
        for j in range(weighted_matrix.shape[1]):
            column = weighted_matrix[:, j]
            
            if is_benefit[j]:
                # Benefit criterion: max is best, min is worst
                ideal_best[j] = np.max(column)
                ideal_worst[j] = np.min(column)
            else:
                # Cost criterion: min is best, max is worst
                ideal_best[j] = np.min(column)
                ideal_worst[j] = np.max(column)
        
        return ideal_best, ideal_worst
    
    def calculate_distances(self, weighted_matrix: np.ndarray, 
                          ideal_best: np.ndarray, 
                          ideal_worst: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Calculate Euclidean distances to ideal solutions
        S_i+ = sqrt(sum((v_ij - A_j+)^2))
        S_i- = sqrt(sum((v_ij - A_j-)^2))
        """
        # Distance to ideal best
        distance_to_best = np.sqrt(np.sum((weighted_matrix - ideal_best) ** 2, axis=1))
        
        # Distance to ideal worst
        distance_to_worst = np.sqrt(np.sum((weighted_matrix - ideal_worst) ** 2, axis=1))
        
        return distance_to_best, distance_to_worst
    
    def calculate_similarity_scores(self, distance_to_best: np.ndarray, 
                                   distance_to_worst: np.ndarray) -> np.ndarray:
        """
        Calculate similarity scores (closeness coefficients)
        C_i = S_i- / (S_i+ + S_i-)
        
        Closer to 1 = better alternative
        """
        denominator = distance_to_best + distance_to_worst
        
        # Avoid division by zero
        denominator = np.where(denominator == 0, 1, denominator)
        
        scores = distance_to_worst / denominator
        
        return scores
    
    def rank_alternatives(self, 
                        room_ids: List[int], 
                        criterion_weights: Dict[str, float],
                        filters: Optional[Dict] = None) -> List[Dict]:
        """
        Complete TOPSIS ranking process
        
        Args:
            room_ids: List of room IDs to evaluate
            criterion_weights: Dict mapping criterion codes to weights
            filters: Optional filters to apply
        
        Returns:
            List of ranked results with scores and explanations
        """
        # Get criteria information
        cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        
        criterion_codes = list(criterion_weights.keys())
        criterion_codes_str = ','.join([f"'{code}'" for code in criterion_codes])
        
        cursor.execute(f"""
            SELECT code, is_benefit, name, unit
            FROM criteria
            WHERE code IN ({criterion_codes_str})
            ORDER BY display_order
        """)
        
        criteria_info = {row['code']: dict(row) for row in cursor.fetchall()}
        cursor.close()
        
        # Ensure criterion_codes are in the order we have info for
        criterion_codes = [code for code in criterion_codes if code in criteria_info]
        
        # Get decision matrix
        matrix, room_ids_ordered, criterion_codes_ordered = self.get_decision_matrix(
            room_ids, criterion_codes
        )
        
        if matrix.size == 0:
            return []
        
        # Prepare weights and benefit flags
        weights = np.array([criterion_weights[code] for code in criterion_codes_ordered])
        is_benefit = np.array([criteria_info[code]['is_benefit'] for code in criterion_codes_ordered])
        
        # TOPSIS Algorithm Steps
        
        # Step 1: Normalize matrix
        normalized = self.normalize_matrix(matrix)
        
        # Step 2: Apply weights
        weighted = self.apply_weights(normalized, weights)
        
        # Step 3: Determine ideal solutions
        ideal_best, ideal_worst = self.get_ideal_solutions(weighted, is_benefit)
        
        # Step 4: Calculate distances
        dist_to_best, dist_to_worst = self.calculate_distances(weighted, ideal_best, ideal_worst)
        
        # Step 5: Calculate similarity scores
        scores = self.calculate_similarity_scores(dist_to_best, dist_to_worst)
        
        # Step 6: Rank alternatives
        results = []
        for i, room_id in enumerate(room_ids_ordered):
            results.append({
                'room_id': room_id,
                'topsis_score': float(scores[i]),
                'distance_to_ideal': float(dist_to_best[i]),
                'distance_to_worst': float(dist_to_worst[i]),
                'normalized_values': {
                    code: float(weighted[i, j]) 
                    for j, code in enumerate(criterion_codes_ordered)
                }
            })
        
        # Sort by score descending
        results.sort(key=lambda x: x['topsis_score'], reverse=True)
        
        # Add rank
        for rank, result in enumerate(results, 1):
            result['rank'] = rank
        
        # Generate explanations
        results = self.add_explanations(results, matrix, room_ids_ordered, 
                                       criterion_codes_ordered, criterion_weights, 
                                       criteria_info)
        
        return results
    
    def add_explanations(self, results: List[Dict], 
                        matrix: np.ndarray,
                        room_ids_ordered: List[int],
                        criterion_codes: List[str],
                        weights: Dict[str, float],
                        criteria_info: Dict) -> List[Dict]:
        """
        Generate human-readable explanations for rankings
        """
        # Find top criteria by weight
        top_criteria = sorted(weights.items(), key=lambda x: x[1], reverse=True)[:3]
        top_codes = [code for code, _ in top_criteria]
        
        for result in results:
            room_id = result['room_id']
            room_idx = room_ids_ordered.index(room_id)
            
            # Analyze strengths and weaknesses
            strengths = []
            weaknesses = []
            
            for code in top_codes:
                col_idx = criterion_codes.index(code)
                value = matrix[room_idx, col_idx]
                is_benefit = criteria_info[code]['is_benefit']
                
                # Compare to average
                avg_value = np.mean(matrix[:, col_idx])
                
                if is_benefit:
                    if value > avg_value * 1.1:  # 10% better than average
                        strengths.append(criteria_info[code]['name'])
                    elif value < avg_value * 0.9:  # 10% worse than average
                        weaknesses.append(criteria_info[code]['name'])
                else:  # Cost criterion (lower is better)
                    if value < avg_value * 0.9:  # 10% better (lower) than average
                        strengths.append(criteria_info[code]['name'])
                    elif value > avg_value * 1.1:  # 10% worse (higher) than average
                        weaknesses.append(criteria_info[code]['name'])
            
            # Generate explanation
            explanation_parts = []
            
            if result['rank'] == 1:
                explanation_parts.append("Best overall match")
            elif result['rank'] <= 3:
                explanation_parts.append("Excellent choice")
            elif result['rank'] <= 10:
                explanation_parts.append("Good option")
            
            if strengths:
                explanation_parts.append(f"Strong in: {', '.join(strengths)}")
            
            if weaknesses and result['rank'] > 1:
                explanation_parts.append(f"Trade-off: {', '.join(weaknesses)}")
            
            result['explanation'] = '. '.join(explanation_parts) if explanation_parts else "Balanced option"
        
        return results


def example_usage():
    """Example of how to use the TOPSISEngine"""
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
    
    # Get some room IDs (top 20 by rating)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT room_id FROM rooms 
        WHERE status = 'AVAILABLE' AND review_scores_rating IS NOT NULL
        ORDER BY review_scores_rating DESC
        LIMIT 20
    """)
    room_ids = [row[0] for row in cursor.fetchall()]
    cursor.close()
    
    # Create engine
    engine = TOPSISEngine(conn)
    
    # Define criterion weights (these would come from InfluenceEngine)
    weights = {
        'PRICE': 0.25,
        'RATING_OVERALL': 0.30,
        'RATING_CLEANLINESS': 0.15,
        'RATING_LOCATION': 0.15,
        'DISTANCE_CENTER': 0.10,
        'AMENITIES_COUNT': 0.05
    }
    
    # Rank alternatives
    results = engine.rank_alternatives(room_ids, weights)
    
    # Display top 5
    print("\n" + "="*80)
    print("TOP 5 RECOMMENDATIONS")
    print("="*80)
    
    for result in results[:5]:
        print(f"\nRank {result['rank']}: Room ID {result['room_id']}")
        print(f"  TOPSIS Score: {result['topsis_score']:.4f}")
        print(f"  Explanation: {result['explanation']}")
    
    print("\n" + "="*80 + "\n")
    
    conn.close()


if __name__ == '__main__':
    example_usage()

