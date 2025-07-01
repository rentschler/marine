import os
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional


async def import_communities_to_database(session, level: int = 2, summaries_path: str = "summaries/level_2"):
    """
    Import level 2 communities into Neo4j database with proper graph structure.
    
    This function creates:
    1. Community nodes with all metadata
    2. Finding nodes for each community
    3. Relationships between communities and their findings
    4. Relationships between communities and existing nodes
    
    Args:
        session: Neo4j database session
        level: Community level to import (default: 2)
    """
    print(f"Importing level {level} communities to database...")
    
    # Load community data from summaries
    # summaries_path = f"summaries/level_{level}"
    if not os.path.exists(summaries_path):
        print(f"Summaries path {summaries_path} does not exist")
        return 0
    
    imported_count = 0
    community_titles = []
    
    # Read all community files
    for file_name in os.listdir(summaries_path):
        if not file_name.endswith('.json'):
            continue
            
        try:
            with open(os.path.join(summaries_path, file_name), 'r', encoding='utf-8') as f:
                community_data = json.load(f)
                
            # Import this community
            success = await _import_single_community(session, community_data, level)
            if success:
                imported_count += 1
                community_titles.append(community_data.get('title', ''))
                
        except json.JSONDecodeError as e:
            print(f"Error loading community file {file_name}: {e}")
            continue
        except Exception as e:
            print(f"Error importing community from {file_name}: {e}")
            continue
    
    print(f"Successfully imported {imported_count} communities to database")
    
    # Calculate and store community connections
    if len(community_titles) > 1:
        print("Calculating community connections...")
        connection_count = await _calculate_community_connections(session, community_titles, level)
        print(f"Found {connection_count} community connections")
    
    return imported_count


async def _import_single_community(session, community_data: Dict, level: int) -> bool:
    """
    Import a single community with all its findings and node relationships.
    """
    try:
        # Generate unique community ID
        community_id = str(uuid.uuid4())
        
        # Extract community properties
        title = community_data.get('title', '')
        summary = community_data.get('summary', '')
        rating = community_data.get('rating', 0.0)
        rating_explanation = community_data.get('rating explanation', '')
        findings = community_data.get('findings', [])
        node_ids = community_data.get('nodes', [])
        
        # Create community node
        community_query = """
            MERGE (c:Community {title: $title, level: $level})
            SET c.id = $community_id,
                c.summary = $summary,
                c.rating = $rating,
                c.rating_explanation = $rating_explanation,
                c.node_count = $node_count,
                c.created_at = $created_at,
                c.updated_at = $updated_at
            RETURN c
        """
        
        current_time = datetime.utcnow().isoformat()
        
        await session.run(
            community_query,
            community_id=community_id,
            title=title,
            level=level,
            summary=summary,
            rating=rating,
            rating_explanation=rating_explanation,
            node_count=len(node_ids),
            created_at=current_time,
            updated_at=current_time
        )
        
        # Create finding nodes and relationships
        await _import_findings(session, community_id, findings)
        
        # Create relationships with existing nodes
        await _link_community_to_nodes(session, community_id, node_ids)
        
        print(f"✅ Imported community: {title}")
        return True
        
    except Exception as e:
        print(f"❌ Error importing community {community_data.get('title', 'Unknown')}: {e}")
        return False


async def _import_findings(session, community_id: str, findings: List[Dict]):
    """
    Import findings for a community and create relationships.
    """
    for i, finding in enumerate(findings):
        finding_id = f"{community_id}_finding_{i}"
        summary = finding.get('summary', '')
        explanation = finding.get('explanation', '')
        
        # Create finding node
        finding_query = """
            MERGE (f:Finding {id: $finding_id})
            SET f.summary = $summary,
                f.explanation = $explanation,
                f.community_id = $community_id
            RETURN f
        """
        
        await session.run(
            finding_query,
            finding_id=finding_id,
            summary=summary,
            explanation=explanation,
            community_id=community_id
        )
        
        # Create relationship between community and finding
        relationship_query = """
            MATCH (c:Community {id: $community_id})
            MATCH (f:Finding {id: $finding_id})
            MERGE (c)-[:CONTAINS_FINDING]->(f)
        """
        
        await session.run(
            relationship_query,
            community_id=community_id,
            finding_id=finding_id
        )


async def _link_community_to_nodes(session, community_id: str, node_ids: List[str]):
    """
    Create relationships between community and existing nodes.
    """
    for node_id in node_ids:
        # Try to find the node in the database
        link_query = """
            MATCH (c:Community {id: $community_id})
            MATCH (n {id: $node_id})
            MERGE (c)-[:CONTAINS_NODE]->(n)
            RETURN n
        """
        
        result = await session.run(
            link_query,
            community_id=community_id,
            node_id=node_id
        )
        
        # Check if node was found and linked
        record = await result.single()
        if not record:
            print(f"⚠️  Node {node_id} not found in database for community {community_id}")


async def get_communities_with_nodes(session, level: int = 2):
    """
    Retrieve communities with their nodes and findings.
    """
    query = """
    MATCH (c:Community {level: $level})
    OPTIONAL MATCH (c)-[:CONTAINS_FINDING]->(f:Finding)
    OPTIONAL MATCH (c)-[:CONTAINS_NODE]->(n)
    RETURN c, collect(DISTINCT f) as findings, collect(DISTINCT n) as nodes
    ORDER BY c.rating DESC
    """
    
    result = await session.run(query, level=level)
    communities = []
    
    async for record in result:
        community = record["c"]
        findings = record["findings"]
        nodes = record["nodes"]
        
        communities.append({
            "community": dict(community),
            "findings": [dict(f) for f in findings if f is not None],
            "nodes": [dict(n) for n in nodes if n is not None]
        })
    
    return communities


async def get_community_by_title(session, title: str, level: int = 2):
    """
    Retrieve a specific community by title.
    """
    query = """
    MATCH (c:Community {title: $title, level: $level})
    OPTIONAL MATCH (c)-[:CONTAINS_FINDING]->(f:Finding)
    OPTIONAL MATCH (c)-[:CONTAINS_NODE]->(n)
    RETURN c, collect(DISTINCT f) as findings, collect(DISTINCT n) as nodes
    """
    
    result = await session.run(query, title=title, level=level)
    record = await result.single()
    
    if record:
        community = record["c"]
        findings = record["findings"]
        nodes = record["nodes"]
        
        return {
            "community": dict(community),
            "findings": [dict(f) for f in findings if f is not None],
            "nodes": [dict(n) for n in nodes if n is not None]
        }
    
    return None


async def get_nodes_by_community(session, community_title: str, level: int = 2):
    """
    Get all nodes that belong to a specific community.
    """
    query = """
    MATCH (c:Community {title: $title, level: $level})-[:CONTAINS_NODE]->(n)
    RETURN n
    """
    
    result = await session.run(query, title=community_title, level=level)
    nodes = []
    
    async for record in result:
        nodes.append(dict(record["n"]))
    
    return nodes


async def delete_communities(session, level: int = 2):
    """
    Delete all Community nodes and their related nodes and relationships for a given level.

    This function removes:
      - Community nodes at the specified level
      - All CONTAINS_NODE relationships from those communities to their nodes
      - All CONTAINS_FINDING relationships from those communities to Finding nodes
      - All CONNECTED_TO relationships from those communities to CommunityConnection nodes
      - The related Finding and CommunityConnection nodes themselves

    Args:
        session: The Neo4j database session.
        level (int, optional): The community level to delete. Defaults to 2.

    Returns:
        int: The number of nodes deleted.
    """
    query = """
    MATCH (c:Community {level: $level})
    OPTIONAL MATCH (c)-[r:CONTAINS_NODE]->(n)
    DELETE r
    WITH c
    OPTIONAL MATCH (c)-[r1:CONTAINS_FINDING]->(f:Finding)
    OPTIONAL MATCH (c)-[r2:CONNECTED_TO]->(cc:CommunityConnection)
    DELETE r1, r2, f, c, cc
    """
    result = await session.run(query, level=level)
    summary = await result.consume()
    
    print(f"Deleted {summary.counters.nodes_deleted} nodes and {summary.counters.relationships_deleted} relationships")
    return summary.counters.nodes_deleted


async def _calculate_community_connections(session, community_titles: List[str], level: int) -> int:
    """
    Calculate connections between all pairs of communities and store them in the database.
    
    Args:
        session: Neo4j database session
        community_titles: List of community titles
        level: Community level
    
    Returns:
        Number of connections found
    """
    connection_count = 0
    
    # Generate all pairs of communities
    for i, title1 in enumerate(community_titles):
        for j, title2 in enumerate(community_titles):
            if i >= j:  # Skip self-connections and avoid duplicates
                continue
                
            # Check for connections between these two communities
            connection_query = """
            MATCH (c1:Community {title: $title1, level: $level})-[:CONTAINS_NODE]->(n1)
            MATCH (c2:Community {title: $title2, level: $level})-[:CONTAINS_NODE]->(n2)
            WHERE n1 = n2 OR (n1)-[]->(n2) OR (n2)-[]->(n1)
            RETURN count(*) as connection_count
            """
            
            result = await session.run(
                connection_query,
                title1=title1,
                title2=title2,
                level=level
            )
            
            record = await result.single()
            connections = record["connection_count"] if record else 0
            
            if connections > 0:
                # Create a CommunityConnection node to store this information
                connection_id = str(uuid.uuid4())
                connection_query = """
                MATCH (c1:Community {title: $title1, level: $level})
                MATCH (c2:Community {title: $title2, level: $level})
                MERGE (cc:CommunityConnection {id: $connection_id})
                SET cc.community1_title = $title1,
                    cc.community2_title = $title2,
                    cc.connection_count = $connections,
                    cc.level = $level,
                    cc.created_at = $created_at
                MERGE (c1)-[:CONNECTED_TO]->(cc)
                MERGE (c2)-[:CONNECTED_TO]->(cc)
                """
                
                current_time = datetime.utcnow().isoformat()
                await session.run(
                    connection_query,
                    connection_id=connection_id,
                    title1=title1,
                    title2=title2,
                    connections=connections,
                    level=level,
                    created_at=current_time
                )
                
                connection_count += 1
                print(f"   Connected: '{title1}' <-> '{title2}' ({connections} connections)")
    
    return connection_count


async def get_community_connections(session, level: int = 2):
    """
    Retrieve all community connections.
    """
    query = """
    MATCH (c1:Community {level: $level})-[:CONNECTED_TO]->(cc:CommunityConnection)<-[:CONNECTED_TO]-(c2:Community {level: $level})
    RETURN cc.community1_title, cc.community2_title, cc.connection_count
    ORDER BY cc.connection_count DESC
    """
    
    result = await session.run(query, level=level)
    connections = []
    
    async for record in result:
        connections.append({
            "community1": record["cc.community1_title"],
            "community2": record["cc.community2_title"],
            "connection_count": record["cc.connection_count"]
        })
    
    return connections


async def get_community_connections_by_title(session, title: str, level: int = 2):
    """
    Get all connections for a specific community.
    """
    query = """
    MATCH (c:Community {title: $title, level: $level})-[:CONNECTED_TO]->(cc:CommunityConnection)<-[:CONNECTED_TO]-(c2:Community {level: $level})
    RETURN cc.community1_title, cc.community2_title, cc.connection_count
    ORDER BY cc.connection_count DESC
    """
    
    result = await session.run(query, title=title, level=level)
    connections = []
    
    async for record in result:
        connections.append({
            "community1": record["cc.community1_title"],
            "community2": record["cc.community2_title"],
            "connection_count": record["cc.connection_count"]
        })
    
    return connections


async def get_community_graph(session, level: int = 2, include_findings: bool = True):
    """
    Fetch all Community nodes, their related Findings, and transform CommunityConnection nodes into edges.
    
    Args:
        session: Neo4j database session
        level: Community level to fetch
        include_findings: Whether to include Finding nodes
    
    Returns:
        Dictionary with nodes and edges for the community graph
    """
    # Query to get communities and their findings
    if include_findings:
        community_query = """
        MATCH (c:Community {level: $level})
        OPTIONAL MATCH (c)-[:CONTAINS_FINDING]->(f:Finding)
        RETURN c, collect(f) as findings
        """
    else:
        community_query = """
        MATCH (c:Community {level: $level})
        RETURN c, [] as findings
        """
    
    # Query to get CommunityConnection nodes and transform them into edges
    connection_query = """
    MATCH (c1:Community {level: $level})-[:CONNECTED_TO]->(cc:CommunityConnection)<-[:CONNECTED_TO]-(c2:Community {level: $level})
    WHERE c1.title < c2.title  // Avoid duplicate edges
    RETURN c1.title as source, c2.title as target, cc.connection_count as weight, cc.id as connection_id
    """
    
    # Execute queries
    community_result = await session.run(community_query, level=level)
    connection_result = await session.run(connection_query, level=level)
    
    # Process communities and findings
    nodes = []
    communities = {}
    
    async for record in community_result:
        community = record["c"]
        findings = record["findings"]
        
        # Create community node
        community_node = {
            "id": community["id"],
            "title": community["title"],
            "level": community["level"],
            "description": community.get("description", ""),
            "created_at": community.get("created_at", ""),
            "updated_at": community.get("updated_at", ""),
            "type": "Community",
            "findings": []
        }
        
        # Add findings if requested
        if include_findings:
            for finding in findings:
                if finding:  # Check if finding is not None
                    finding_node = {
                        "id": finding["id"],
                        "content": finding["content"],
                        "type": finding.get("type", "Finding"),
                        "confidence": finding.get("confidence", 1.0),
                        "created_at": finding.get("created_at", ""),
                        "parent_community": community["title"]
                    }
                    community_node["findings"].append(finding_node)
        
        nodes.append(community_node)
        communities[community["title"]] = community_node
    
    # Process connections as edges
    edges = []
    async for record in connection_result:
        edge = {
            "source": record["source"],
            "target": record["target"],
            "weight": record["weight"],
            "connection_id": record["connection_id"],
            "type": "CommunityConnection"
        }
        edges.append(edge)
        
    
    return {
        "nodes": nodes,
        "edges": edges,
        "metadata": {
            "level": level,
            "include_findings": include_findings,
            "node_count": len(nodes),
            "edge_count": len(edges)
        }
    } 