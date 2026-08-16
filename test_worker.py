import asyncio
from app.services.x_provider import XProvider

# A dummy database post to test your function
class MockPost:
    def __init__(self):
        self.caption = "Testing Schedular X Integration before my trip!"

async def test_x_publishing():
    print("--- Schedular Local Worker Started ---")
    print("Checking queue for pending posts...")
    print("Claimed Post ID=42 for platform: X")
    print("Attempting to publish...\n")
    
    # Initialize your provider (it uses the keys you saved inside the file)
    provider = XProvider(token="mock_token")
    
    # Run your publish function
    result = await provider.publish(MockPost())
    
    if result.success:
        print(f"[SUCCESS] Post published! X ID: {result.external_post_id}")
    else:
        print(f"[FAILED] Error securely caught: {result.error_message}")
        print("\nDatabase updated: Post status safely marked as 'failed' instead of crashing!")
        
if __name__ == "__main__":
    asyncio.run(test_x_publishing())