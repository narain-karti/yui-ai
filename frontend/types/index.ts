export interface FlightNode {
  id: string;
  type: "flight";
  pnr: string;
  status: string;
  delay_mins?: number;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  new_eta?: string;
}

export interface MeetingNode {
  id: string;
  type: "meeting";
  title: string;
  start: string;
  criticality: number;
  remotely_joinable: boolean;
}

export interface HotelNode {
  id: string;
  type: "hotel";
  name: string;
  checkin: string;
  flexible_checkin: boolean;
}

export type TripEvent = FlightNode | MeetingNode | HotelNode;

export interface FreeWindow {
  start: string;
  end: string;
  duration_mins: number;
  location: string;
}

export interface Location {
  lat: number;
  lng: number;
  source: string;
}

export interface Itinerary {
  flight?: FlightNode;
  hotel?: HotelNode;
  meetings: MeetingNode[];
}

export interface TripContext {
  trip_id: string;
  user_id: string;
  itinerary: Itinerary;
  free_windows: FreeWindow[];
  resolution_log: any[];
  last_aria_action?: string;
  last_aria_ts?: string;
  last_luma_suggestion_ts?: string;
  location?: Location;
  status: string;
}

export interface AgentLog {
  id: string;
  trip_id: string;
  agent: "yui" | "aria" | "luma";
  action: string;
  detail: string;
  created_at: string;
}

export interface LumaVenue {
  name: string;
  type: string;
  distance_min: number;
  rating: number;
  why_recommended: string;
}

export interface LumaCard {
  food: LumaVenue;
  work: LumaVenue;
  explore: LumaVenue;
}
