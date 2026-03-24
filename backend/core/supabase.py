from supabase import create_client, Client
from core.config import settings

# Initialize Supabase client
# Using the service key here since the backend is a trusted environment
supabase: Client = create_client(settings.supabase_url, settings.supabase_service_key)
