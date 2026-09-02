import os

token = os.environ.get("DUMMY_TOKEN")
if token:
    masked = token[:2] + "****" + token[-2:]
    print(f"Token found: {masked}")
else:
    print("ERROR: Token not found in environment")