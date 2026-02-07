#!/usr/bin/env python3
"""
Test script to simulate AI voice orders appearing on the kiosk display
Simulates a customer ordering at the drive-thru
"""

import requests
import json
import time

API_URL = 'http://localhost:3001/api/order'

def send_order_update(order_data):
    """Send order update to kiosk display"""
    try:
        response = requests.post(API_URL, json=order_data, timeout=2)
        if response.status_code == 200:
            print(f"✅ Sent to display")
        else:
            print(f"❌ Error: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

def simulate_drive_thru_order():
    """Simulate a customer ordering at drive-thru"""

    print("\n" + "="*60)
    print("🎬 SIMULATING DRIVE-THRU ORDER")
    print("="*60)
    print("\n📺 Watch the kiosk display at http://localhost:3001")
    print("\n" + "-"*60)

    # Customer pulls up
    print("\n🚗 Customer pulls up to drive-thru...")
    print("🎤 AI: 'Welcome to Burger Express! What can I get for you?'")
    time.sleep(3)

    # Customer orders first item
    print("\n👤 Customer: 'I'll have a cheeseburger, no pickles'")
    time.sleep(1)
    print("🤖 AI: Processing...")

    order = {
        "items": [
            {
                "name": "Cheeseburger",
                "quantity": 1,
                "price": 6.49,
                "modifiers": ["no pickles"],
                "size": None
            }
        ],
        "total": 6.49,
        "status": "in_progress"
    }

    send_order_update(order)
    print("📺 Display should now show: Cheeseburger (no pickles)")
    time.sleep(3)

    # AI confirms and asks for more
    print("\n🎤 AI: 'Got it, one cheeseburger with no pickles. Anything else?'")
    time.sleep(2)

    # Customer adds fries
    print("\n👤 Customer: 'Yeah, medium fries'")
    time.sleep(1)
    print("🤖 AI: Processing...")

    order["items"].append({
        "name": "Fries",
        "quantity": 1,
        "price": 3.49,
        "size": "medium",
        "modifiers": []
    })
    order["total"] = 9.98

    send_order_update(order)
    print("📺 Display should now show: Cheeseburger + Medium Fries")
    time.sleep(3)

    # AI confirms and asks for more
    print("\n🎤 AI: 'Medium fries, got it. Would you like a drink with that?'")
    time.sleep(2)

    # Customer adds drink
    print("\n👤 Customer: 'Sure, a large Coke'")
    time.sleep(1)
    print("🤖 AI: Processing...")

    order["items"].append({
        "name": "Coke",
        "quantity": 1,
        "price": 2.59,
        "size": "large",
        "modifiers": []
    })
    order["total"] = 12.57

    send_order_update(order)
    print("📺 Display should now show: Cheeseburger + Fries + Large Coke")
    time.sleep(3)

    # AI confirms total
    print("\n🎤 AI: 'Perfect! That's one cheeseburger with no pickles,")
    print("     medium fries, and a large Coke. Your total is $12.57.")
    print("     Is that everything?'")
    time.sleep(2)

    # Customer confirms
    print("\n👤 Customer: 'Yes, that's all'")
    time.sleep(1)

    # Mark order complete
    print("\n🎤 AI: 'Great! Please pull forward to the window.'")
    order["status"] = "complete"

    send_order_update(order)
    print("📺 Display should now show: ✅ Order Complete!")
    time.sleep(5)

    print("\n✅ ORDER SIMULATION COMPLETE")
    print("📺 Display should reset to welcome screen")
    print("\n" + "="*60)

def quick_test():
    """Quick test - just add one item"""
    print("\n🧪 Quick Test - Adding single item...")

    order = {
        "items": [
            {
                "name": "Double Burger",
                "quantity": 1,
                "price": 7.99,
                "modifiers": ["extra cheese"],
                "size": None
            }
        ],
        "total": 7.99,
        "status": "in_progress"
    }

    send_order_update(order)
    print("✅ Item sent! Check http://localhost:3001")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🖥️  KIOSK DISPLAY TEST SCRIPT")
    print("="*60)
    print("\nThis script simulates a drive-thru order appearing on the display")
    print("\nOptions:")
    print("  1 - Full simulation (realistic drive-thru order)")
    print("  2 - Quick test (single item)")
    print()

    choice = input("Choose test (1 or 2): ").strip()

    if choice == "1":
        simulate_drive_thru_order()
    elif choice == "2":
        quick_test()
    else:
        print("❌ Invalid choice")

    print("\n💡 Tip: Keep this script running and the display open")
    print("   to test real-time updates!\n")
