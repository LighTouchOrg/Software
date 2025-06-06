import json

def build_message(category, method, params):
    try:
        return json.dumps({
            "category": category,
            "method": method,
            "params": params
        })
    except Exception as e:
        print(f"Error building message: {e}")
        return None