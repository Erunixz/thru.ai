#!/usr/bin/env python3
"""
Quick test script to verify the frontend integration
Sends a test order to the frontend server
"""

import requests
import json
import time

def send_test_order():
    """Send a test order to the frontend"""

    test_order = {
        "items": [
            {
                "name": "Cheeseburger",
                "quantity": 2,
                "price": 6.49,
                "modifiers": ["no pickles", "extra cheese"],
                "size": None
            },
            {
                "name": "Fries",
                "quantity": 1,
                "price": 3.49,
                "size": "medium",
                "modifiers": []
            },
            {
                "name": "Coke",
                "quantity": 1,
                "price": 2.29,
                "size": "medium",
                "modifiers": []
            }
        ],
        "total": 18.76,
        "status": "in_progress"
    }

    print("🧪 Testing Frontend Integration...")
    print("\nSending test order:")
    print(json.dumps(test_order, indent=2))

    try:
        response = requests.post(
            'http://localhost:3001/api/order',
            json=test_order,
            timeout=5
        )

        if response.status_code == 200:
            print("\n✅ SUCCESS! Order sent to frontend")
            print(f"Response: {response.json()}")
            print("\n📺 Check http://localhost:3001 to see the order!")

            # Send completion after 5 seconds
            print("\nWaiting 5 seconds before completing order...")
            time.sleep(5)

            test_order["status"] = "complete"
            response = requests.post(
                'http://localhost:3001/api/order',
                json=test_order,
                timeout=5
            )

            print("✅ Order marked as complete!")
            print("The kiosk should now show the checkout screen.")

        else:
            print(f"\n❌ ERROR: Got status code {response.status_code}")

    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to frontend server")
        print("Make sure you run: python frontend_server.py")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")

if __name__ == "__main__":
    print("="*50)
    print("🍔 BURGER EXPRESS - Frontend Integration Test")
    print("="*50)
    print("\nMake sure frontend_server.py is running!")
    print("Press Enter to send test order...")
    input()

    send_test_order()

    print("\n" + "="*50)
    print("Test complete! Open http://localhost:3001 if not open.")
    print("="*50)
