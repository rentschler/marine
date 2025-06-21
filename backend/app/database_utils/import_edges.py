# from datetime import datetime, timezone
from dateutil import parser  # Add this import

def convert_dates_to_iso(attrs):
    for key, value in attrs.items():
        if isinstance(value, datetime):
            attrs[key] = value.isoformat().replace('+00:00', 'Z')
    return attrs

async def import_edges(session, edges):
    print("Importing edges ...")
    for u, v, edge_attrs in edges:
        edge_attrs = flatten_attrs(edge_attrs)
        edge_attrs = convert_selected_dates(edge_attrs)
        rel_type = edge_attrs.get("type", "MISSING")
        query = f"""
        MATCH (a {{id: $u}}), (b {{id: $v}})
        MERGE (a)-[r:{rel_type}]->(b)
        SET r += $props
        """

        await session.run(
            query,
            u=u,
            v=v,
            props=edge_attrs
        )

def flatten_attrs(attrs):
    flat = {}
    for k, v in attrs.items():
        if isinstance(v, dict):
            flat.update(v)  
        else:
            flat[k] = v
    return flat


DATE_KEYS = {"start_date", "end_date", "date", "timestamp"}

def convert_selected_dates(attrs):
    """
    Converts date strings in the given dictionary to UTC ISO 8601 format.
    """
    for key in DATE_KEYS:
        value = attrs.get(key)
        if isinstance(value, str):
            try:
                dt = parser.parse(value)
                dt_utc = dt.astimezone(timezone.utc)
                attrs[key] = dt_utc.isoformat()
            except ValueError:
                pass  # Skip if the string is not in the expected format
    return attrs
