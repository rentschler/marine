from typing import Dict, List, Tuple
from collections import defaultdict
from nl_querying.query_utils import PathResult, generate_full_text_query
from models.Graph import Link, Node
from neo4j import AsyncGraphDatabase
import os

class Neo4JGraph:
    """
    Asynchronous wrapper for querying a Neo4j graph database using the native neo4j async driver.
    """

    def __init__(self):
        """
        Initializes the Neo4j graph connection using environment variables for configuration.
        """
        NEO4J_URI = "bolt://" + os.environ.get('DB_HOST') + ":7687"
        NEO4J_USER = "neo4j"
        NEO4J_PASSWORD = os.environ.get('DB_PASSWORD')
        self.driver = AsyncGraphDatabase.driver(
            NEO4J_URI,
            auth=(NEO4J_USER, NEO4J_PASSWORD)
        )

    async def initialize(self):
        """
        Creates a full-text index on the Entity nodes asynchronously, if it does not already exist.
        Should be called once during setup.
        """
        async with self.driver.session() as session:
            await session.run(
                "CREATE FULLTEXT INDEX entity IF NOT EXISTS FOR (n:Entity) ON EACH [n.id]"
            )

    async def full_text_search_on_important_entities(
        self,
        query_entities: List[str],
        relevant_entities: List[str]
    ) -> Dict[Tuple[str, str], List[PathResult]]:
        """
        Performs an asynchronous full-text search on important entities and returns path results.

        Parameters:
        ----------
        query_entities : List[str]
            A list of entities extracted from the user's query.
        relevant_entities : List[str]
            A list of entities determined to be relevant to the question.

        Returns:
        -------
        Dict[Tuple[str, str], List[PathResult]]
            A dictionary mapping (start_entity_id, end_entity_id) to lists of PathResult objects.
        """
        valid_entities = set(query_entities + relevant_entities)
        result: Dict[Tuple[str, str], List[PathResult]] = defaultdict(list)

        async with self.driver.session() as session:
            for entity in valid_entities:
                cypher_query = """
                CALL db.index.fulltext.queryNodes('entity', $query, {limit: 2})
                YIELD node AS start_entity
                MATCH path = (start_entity)-[rels*..2]-(end_entity:Entity)
                WHERE all(n IN nodes(path)[1..-1] WHERE NOT n:Entity)
                AND start_entity <> end_entity
                RETURN {
                    nodes: [n IN nodes(path) | {
                        id: n.id, 
                        labels: labels(n), 
                        properties: properties(n)
                    }],
                    relationships: [r IN rels | {
                        type: type(r),
                        source: startNode(r).id,
                        target: endNode(r).id,
                        properties: properties(r)
                    }]
                } AS path_data
                """

                query_text = generate_full_text_query(entity)
                records = await session.run(cypher_query, {"query": query_text})

                async for record in records:
                    path_data = record["path_data"]

                    nodes = [
                        Node(**node["properties"])
                        for node in path_data["nodes"]
                    ]

                    relationships = [
                        Link(
                            type=rel["type"],
                            source=rel["source"],
                            target=rel["target"],
                            properties=rel["properties"],
                            is_inferred= rel.get("is_inferred", False)
                        ) for rel in path_data["relationships"]
                    ]

                    start_node = nodes[0]
                    end_node = nodes[-1]

                    start_id = start_node.id
                    end_id = end_node.id

                    if not (start_id in valid_entities and end_id in valid_entities):
                        continue

                    key = tuple(sorted((start_id, end_id)))

                    result[key].append(PathResult(
                        nodes=nodes,
                        relationships=relationships
                    ))

            return result

    async def close(self):
        """
        Closes the Neo4j driver connection.
        """
        await self.driver.close()
