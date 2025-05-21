async def get_min_max_date(session):
    query = "MATCH (n) RETURN min(n.timestamp) AS min_date, max(n.timestamp) AS max_date"
    try:
        records = await session.run(query)
        async for record in records:
            return {
                "min_date": record["min_date"],
                "max_date": record["max_date"]
            }
    except Exception as e:
        return {"min_date": None, "max_date": None}

