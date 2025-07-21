async def health_check_db(session) -> int:
    """
    Returns:
    -1 if the DB is unreachable
     0 if no nodes exist
     >0 number of nodes in DB
    """
    try:
        result = await session.run("MATCH (n) RETURN count(n) AS node_count")
        record = await result.single()
        return record["node_count"]
    except Exception as e:
        print(f"health_check_db: {e}")
        return -1
