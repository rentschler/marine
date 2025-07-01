# Community Node Schema Documentation

This document outlines the schema for community-related nodes in the Neo4j database and explains how they are interconnected.

## Node Types

### 1. Community Node
Represents a hierarchical community identified through graph analysis.

**Properties:**
- `id`: Unique identifier (UUID)
- `title`: Community title/name
- `level`: Hierarchical level (1-5)
- `description`: Community description
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

**Labels:** `Community`

### 2. CommunityConnection Node
Represents connections between two communities based on shared nodes or event relationships.

**Properties:**
- `id`: Unique identifier (UUID)
- `community1_title`: Title of first community
- `community2_title`: Title of second community
- `connection_count`: Number of connections between communities
- `level`: Community level
- `created_at`: Timestamp of creation

**Labels:** `CommunityConnection`

### 3. Finding Node
Represents key findings or insights extracted from community analysis.

**Properties:**
- `id`: Unique identifier (UUID)
- `content`: Finding text content
- `type`: Type of finding (e.g., "insight", "pattern", "anomaly")
- `confidence`: Confidence score (0-1)
- `created_at`: Timestamp of creation

**Labels:** `Finding`

### 4. Entity Node
Represents entities in the original graph (existing nodes from MC3 dataset).

**Properties:**
- `id`: Entity identifier
- `name`: Entity name
- `type`: Entity type (e.g., "Person", "Location", "Event")
- `community`: Community assignment (optional, for level 2 communities)
- Additional properties based on entity type

**Labels:** Various entity types (e.g., `Person`, `Location`, `Event`, etc.)

## Relationships

### Community Relationships

1. **Community → Finding**
   - **Relationship:** `CONTAINS_FINDING`
   - **Direction:** Community → Finding
   - **Description:** Links a community to its associated findings/insights

2. **Community → Entity**
   - **Relationship:** `CONTAINS_NODE`
   - **Direction:** Community → Entity
   - **Description:** Links a community to the entities that belong to it

3. **Community → CommunityConnection**
   - **Relationship:** `CONNECTED_TO`
   - **Direction:** Community → CommunityConnection
   - **Description:** Links a community to connection nodes that represent its relationships with other communities


## Database Schema Diagram

```
(Community) -[:CONTAINS_FINDING]-> (Finding)
     |
     v
[:CONTAINS_NODE]
     |
     v
(Entity) <--[original relationships]--> (Entity)
     ^
     |
[:CONTAINS_NODE]
     |
     v
(Community) -[:CONNECTED_TO]-> (CommunityConnection) <-[:CONNECTED_TO]- (Community)
```

