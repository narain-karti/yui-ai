from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class TripEvent(BaseModel):
    id: str
    type: str

class FlightNode(TripEvent):
    type: str = "flight"
    pnr: str
    status: str
    delay_mins: Optional[int] = 0
    origin: str
    destination: str
    departure: str
    arrival: str
    new_eta: Optional[str] = None

class MeetingNode(TripEvent):
    type: str = "meeting"
    title: str
    start: str
    criticality: int
    remotely_joinable: bool = False

class HotelNode(TripEvent):
    type: str = "hotel"
    name: str
    checkin: str
    flexible_checkin: bool = False

class Edge(BaseModel):
    # e.g., "required_before", "must_precede"
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    relation: str 
    buffer_mins: int
    cascade_risk: Optional[float] = 0.0

class FreeWindow(BaseModel):
    start: str
    end: str
    duration_mins: int
    location: str

class Location(BaseModel):
    lat: float
    lng: float
    source: str

class Itinerary(BaseModel):
    flight: Optional[FlightNode] = None
    hotel: Optional[HotelNode] = None
    meetings: List[MeetingNode] = []
    # Can extend with other events

class TripContext(BaseModel):
    trip_id: str
    user_id: str
    itinerary: Itinerary
    free_windows: List[FreeWindow] = []
    resolution_log: List[Any] = []
    last_aria_action: Optional[str] = None
    last_aria_ts: Optional[datetime] = None
    last_luma_suggestion_ts: Optional[datetime] = None
    location: Optional[Location] = None
    status: str = "active"

class AgentLog(BaseModel):
    trip_id: str
    agent: str # yui, aria, luma
    action: str
    detail: str

class DuffelWebhookPayload(BaseModel):
    type: str
    data: Dict[str, Any]

class LumaVenue(BaseModel):
    name: str
    type: str
    distance_min: int
    rating: float
    why_recommended: str

class LumaCard(BaseModel):
    food: LumaVenue
    work: LumaVenue
    explore: LumaVenue
