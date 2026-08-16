import tweepy


def publish_post_to_x(api_key, api_secret, access_token, access_token_secret, post_text):
    """
    Takes the user's API credentials and the text they want to post,
    and publishes it directly to X.
    """
    try:
        # Initialize the X API v2 Client
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_token_secret
        )

        # Publish the tweet
        response = client.create_tweet(text=post_text)

        # Return success and the ID of the new tweet
        return True, f"Successfully posted to X! Tweet ID: {response.data['id']}"

    except tweepy.errors.TweepyException as e:
        # If it fails (e.g., bad tokens, duplicate post), return the error safely
        return False, f"Failed to post to X: {str(e)}"
    except Exception as e:
        return False, f"An unexpected error occurred: {str(e)}"