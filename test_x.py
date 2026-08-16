from app.publish_x import publish_post_to_x

# 1. API Key (Consumer Key)
MY_API_KEY = "EyiwJLRlTXRoN21H0EagwAV6T"

# 2. API Secret (Consumer Secret)
MY_API_SECRET = "FYh5ESafq6wsx6aeaIil65Nf5KwQNWLw6O4oXQvFrJnejHS8SI"

# 3. OAuth 1.0a Access Token
MY_ACCESS_TOKEN = "2006599418649391104-NhARa4tXsIRzb9Mspso2C8X9B7dzE5"

# 4. OAuth 1.0a Access Token Secret
MY_ACCESS_TOKEN_SECRET = "iU1Ge86XgCY3tiYfnelDqzXjMGTUIFoexdcmKWyImUqRq"

# The text you want to post to your X timeline
my_message = "Hello world! This is my first automated post from the Schedular application!"

print("Attempting to post to X...")

# Run the function
success, result_message = publish_post_to_x(
    api_key=MY_API_KEY,
    api_secret=MY_API_SECRET,
    access_token=MY_ACCESS_TOKEN,
    access_token_secret=MY_ACCESS_TOKEN_SECRET,
    post_text=my_message
)

print(result_message)