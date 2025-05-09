async def get_min_max_node_degree(session):
    query = """
    MATCH (n)
    WITH n, COUNT { (n)--() } AS degree
    RETURN
        min(degree) AS minDegree,
        max(degree) AS maxDegree
    """
    
    result = await session.run(query)
    record = await result.single()
    
    return {
        "min_degree": record["minDegree"],
        "max_degree": record["maxDegree"]
    }