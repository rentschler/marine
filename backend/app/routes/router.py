import random
from fastapi import APIRouter
from fastapi.responses import HTMLResponse, JSONResponse
from neo4j import GraphDatabase
import os
import time

# Credentials
NEO4J_URI = "bolt://" + os.environ.get('DB_HOST') + ":7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = os.environ.get('DB_PASSWORD')

router = APIRouter()

# Example data
sample_people = [
    {"name": "Alice"},
    {"name": "Bob"},
    {"name": "Charlie"}
]

relationships = [
    ("Alice", "Bob", "KNOWS"),
    ("Alice", "Charlie", "FRIENDS_WITH")
]


@router.get("/", response_class=HTMLResponse, tags=["ROOT"])
async def root():
    html_content = """
        <html>
            <head>
                <title>AVA Template Python API</title>
            </head>
            <body>
                <h1>AVA Template Python API</h1>
            </body>
        </html>
        """
    return HTMLResponse(content=html_content, status_code=200)

# Just used for debugging
@router.get("/clear-db", response_class=JSONResponse)
async def clear_db():
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")
        print("Database cleared.")
        
    
    return {"success": True}

@router.get("/read-db-example", response_class=JSONResponse)
async def read_db_example():
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    
    # Read database and create result array
    with driver.session() as session:
        person_result = session.run("MATCH (p:Person) RETURN p.name AS name, p.age AS age")
        relation_result = session.run("""
                    MATCH (a:Person)-[r]->(b:Person)
                    RETURN a.name AS from, type(r) AS relation, b.name AS to
                """)
        
        if (person_result.peek() is None or relation_result.peek() is None):
            return {"success": False, "error-message": "The database is empty!"}

        dbContentArray = ["People in the database:"]
        
        for record in person_result:
            dbContentArray.append(f" - {record['name']} (age {record['age']})")
        
        dbContentArray.append(" ")
        dbContentArray.append("Relationships in the database:")
                
        for record in relation_result:
            dbContentArray.append(f" - {record['from']} -[{record['relation']}]-> {record['to']})")  
    
    # Just to demonstrate the loading indicator in React
    time.sleep(1)
    
    return {"success": True, "db-content": dbContentArray}
    
@router.get("/write-db-example", response_class=JSONResponse)
async def write_db_example():
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    
    with driver.session() as session:
        # Empty database
        session.run("MATCH (n) DETACH DELETE n")
        print("Database cleared.")
    
        # Create nodes
        for person in sample_people:
            session.run(
                "CREATE (p:Person {name: $name, age: $age})",
                name=person["name"], age=random.randint(20, 90)
            )
        print("Sample nodes created.")

        # Create relationships
        for person1, person2, rel_type in relationships:
            session.run(
                """
                MATCH (a:Person {name: $name1}), (b:Person {name: $name2})
                CREATE (a)-[r:%s]->(b)
                """ % rel_type,
                name1=person1, name2=person2
            )
        print("Sample relationships created.")
        
    # Just to demonstrate the loading indicator in React
    time.sleep(1)
    
    return {"success": True}
