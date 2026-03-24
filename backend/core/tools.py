# core/tools.py
# Definitions for Amazon Bedrock Native Tool Calling via Converse API

def get_aria_tool_config():
    """Tool schema for ARIA (Crisis Agent)"""
    return {
        "tools": [
            {
                "toolSpec": {
                    "name": "search_flights",
                    "description": "Searches Duffel for available alternatives between origins and destinations.",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "origin": {
                                    "type": "string",
                                    "description": "IATA code of the origin airport (e.g., MAA)"
                                },
                                "destination": {
                                    "type": "string",
                                    "description": "IATA code of the destination airport (e.g., BOM)"
                                },
                                "date": {
                                    "type": "string",
                                    "description": "Departure date in YYYY-MM-DD format"
                                },
                                "budget_max": {
                                    "type": "number",
                                    "description": "Maximum budget ceiling to filter results"
                                }
                            },
                            "required": ["origin", "destination", "date"]
                        }
                    }
                }
            },
            {
                "toolSpec": {
                    "name": "get_calendar",
                    "description": "Fetch upcoming calendar meetings to scan for cascade risks.",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "days_ahead": {
                                    "type": "integer",
                                    "description": "Number of days ahead to scan"
                                }
                            },
                            "required": ["days_ahead"]
                        }
                    }
                }
            },
            {
                "toolSpec": {
                    "name": "update_trip_context",
                    "description": "Upsert the resolved strategy into the Supabase Trip Context Graph.",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "trip_id": {
                                    "type": "string"
                                },
                                "resolution_summary": {
                                    "type": "string"
                                },
                                "new_flight_pnr": {
                                    "type": "string"
                                }
                            },
                            "required": ["trip_id", "resolution_summary", "new_flight_pnr"]
                        }
                    }
                }
            }
        ]
    }

def get_yui_tool_config():
    """Tool schema for YUI (Intent and Routing)"""
    return {
        "tools": [
            {
                "toolSpec": {
                    "name": "web_search",
                    "description": "Live web lookup for non-flight information (e.g., weather, visa rules) via SearchApi.",
                    "inputSchema": {
                        "json": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "The search query"
                                }
                            },
                            "required": ["query"]
                        }
                    }
                }
            }
        ]
    }
