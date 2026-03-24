import boto3
from core.config import settings

def get_bedrock_client():
    return boto3.client(
        service_name="bedrock-runtime",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )

bedrock_client = get_bedrock_client()

# Reusable function to invoke converse API
def invoke_agent(model_id: str, messages: list, system: list, toolConfig: dict = None):
    kwargs = {
        "modelId": model_id,
        "messages": messages,
        "system": system
    }
    if toolConfig:
        kwargs["toolConfig"] = toolConfig
        
    response = bedrock_client.converse(**kwargs)
    return response
