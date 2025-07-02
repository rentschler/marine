import os
import json
from typing import Dict, List


async def update_node_communities(session, level: int = 2):
    """
    Update all nodes in the database with their community information from the specified level.
    
    Args:
        session: Neo4j database session
        level: Community level to use (default: 2)
    """
    print(f"Updating nodes with community information from level {level}...")
    
    # Load community data from summaries
    summaries_path = f"summaries/level_{level}"
    if not os.path.exists(summaries_path):
        print(f"Summaries path {summaries_path} does not exist")
        return
    
    # Create a mapping of node_id to community_title
    node_to_community: Dict[str, str] = {}
    
    # Read all community files
    for file_name in os.listdir(summaries_path):
        if file_name.endswith('.json'):
            with open(os.path.join(summaries_path, file_name), 'r', encoding='utf-8') as f:
                try:
                    community_data = json.load(f)
                    community_title = community_data.get('title', '')
                    nodes = community_data.get('nodes', [])
                    
                    # Map each node to this community
                    for node_id in nodes:
                        if node_id in node_to_community:
                            print(f"Warning: Node {node_id} appears in multiple communities: {node_to_community[node_id]} and {community_title}")
                        else:
                            node_to_community[node_id] = community_title
                            
                except json.JSONDecodeError as e:
                    print(f"Error loading community file {file_name}: {e}")
                    continue
    
    print(f"Found {len(node_to_community)} nodes with community assignments")
    
    # Update each node in the database
    updated_count = 0
    for node_id, community_title in node_to_community.items():
        try:
            # Update the node with community information
            cypher_query = """
                MATCH (n {id: $node_id})
                SET n.community = $community_title
                RETURN n
            """
            
            result = await session.run(
                cypher_query,
                node_id=node_id,
                community_title=community_title
            )
            
            # Check if the node was actually updated
            record = await result.single()
            if record:
                updated_count += 1
            else:
                print(f"Warning: Node {node_id} not found in database")
                
        except Exception as e:
            print(f"Error updating node {node_id}: {e}")
            continue
    
    print(f"Successfully updated {updated_count} nodes with community information")
    return updated_count 