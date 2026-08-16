from app.publish_x import publish_post_to_x

# 1. API Key (Sometimes called Consumer Key)
MY_API_KEY = "2006599418649391104-whVREUbF0lMjHdCJ2yD1cPEnmdncnG"

# 2. API Secret (Sometimes called Consumer Secret)
MY_API_SECRET = "EEuV9l8I3s9TK6AVI79yrwrHCjuFc1ae70GJsWrOB7NY4"

# 3. OAuth 1.0a Access Token
MY_ACCESS_TOKEN = "2006599418649391104-whVREUbF0lMjHdCJ2yD1cPEnmdncnG"

# 4. OAuth 1.0a Access Token Secret
MY_ACCESS_TOKEN_SECRET = "EEuV9l8I3s9TK6AVI79yrwrHCjuFc1ae70GJsWrOB7NY4"

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