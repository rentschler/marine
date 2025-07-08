def get_short_title(title: str) -> str:
    title_to_short = {
        "Efforts to Protect Nemo Reef from Unauthorized Activities": "Nemo Reef Protection",
        "Himmap Harbor and Dolphin Bay: Ecological and Regulatory Overview": "Himmap & Dolphin Bay Management",
        "Himark Harbor: Centralized Maritime Coordination by Rodriguez": "Rodriguez's Harbor Coordination",
        "Nemo Reef Community: Environmental Compliance and Operational Dynamics": "Nemo Reef Operations",
        "Environmental Conservation and Restricted Access Issues": "Restricted Access Issues",
        "Comprehensive Overview of Nemo Reef Monitoring and Management Community": "Nemo Reef Monitoring by EcoVigil",
        "Nemo Reef: Unified Environmental and Operational Dynamics": "Nemo Reef operations by V. Miesel",
        "Event Communication and Access Management Analysis": "Access Management",
        "Oceanus City Council: Governance, Oversight, and Community Interactions at Nemo Reef": "Nemo Reef interactions by Oceanus City",
        "Nemo Reef Unauthorized Activity Analysis": "Nemo Reef Unauthorized Activity",
        "Nemo Reef & Haacklee Harbor & Marine Monitoring": "Nemo Reef & Haacklee Harbor",
    }
    return title_to_short.get(title, title) or title

