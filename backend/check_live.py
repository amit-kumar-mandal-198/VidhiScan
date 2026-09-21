import urllib.request

try:
    resp = urllib.request.urlopen("http://localhost:3000/")
    print(f"Server is LIVE! Status code: {resp.status}")
except Exception as e:
    print(f"Error connecting: {e}")
