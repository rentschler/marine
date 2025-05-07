async def get_node_count_in_db(session):
    try:
        result = await session.run("MATCH (n:Node) RETURN count(n) AS node_count")
        record = await result.single()
        return record["node_count"]
    except Exception as e:
        print(f"Exception while executing get_node_count_in_db: {e}")
        return 0

