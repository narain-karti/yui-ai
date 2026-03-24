import json
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from core.config import settings
from datetime import datetime, timedelta

SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

def get_calendar_service():
    """Initializes the Google Calendar API client using the Service Account JSON"""
    try:
        service_account_info = json.loads(settings.google_service_account_json)
        creds = Credentials.from_service_account_info(
            service_account_info, scopes=SCOPES
        )
        return build('calendar', 'v3', credentials=creds)
    except Exception as e:
        print(f"Failed to init Google Calendar: {e}")
        return None

async def fetch_upcoming_events(days_ahead: int = 2):
    """Fetches events from the configured demo calendar for the next X days"""
    service = get_calendar_service()
    if not service:
        return []

    now = datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time
    time_max = (datetime.utcnow() + timedelta(days=days_ahead)).isoformat() + 'Z'

    try:
        events_result = service.events().list(
            calendarId=settings.google_demo_calendar_id, 
            timeMin=now,
            timeMax=time_max,
            maxResults=50, 
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        return events_result.get('items', [])
    except Exception as e:
        print(f"Error fetching calendar events: {e}")
        return []
