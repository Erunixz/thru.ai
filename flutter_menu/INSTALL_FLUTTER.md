# Installing Flutter on Windows

## Option 1: Quick Install (Recommended)

1. **Download Flutter SDK**
   - Go to: https://docs.flutter.dev/get-started/install/windows
   - Download the latest Flutter SDK zip file
   - OR direct link: https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.19.0-stable.zip

2. **Extract the ZIP file**
   - Extract to a location like `C:\src\flutter` (avoid Program Files due to permissions)
   - DO NOT extract to a path with spaces or special characters

3. **Add Flutter to PATH**
   - Search for "Environment Variables" in Windows Start menu
   - Click "Environment Variables"
   - Under "User variables", find "Path" and click "Edit"
   - Click "New" and add: `C:\src\flutter\bin` (or wherever you extracted it)
   - Click "OK" on all dialogs

4. **Verify Installation**
   Open a NEW PowerShell/Command Prompt window and run:
   ```bash
   flutter --version
   flutter doctor
   ```

5. **Install Required Tools**
   Flutter doctor will show what's missing. You'll need:
   - Android Studio (for Android development) OR
   - Chrome (for web development - easiest option)
   - Visual Studio (for Windows desktop development)

## Option 2: Run on Chrome (Fastest to Get Started)

If you just want to see the app quickly:

1. Install Flutter (steps 1-4 above)
2. Make sure Chrome is installed
3. Run:
   ```bash
   cd flutter_menu
   flutter pub get
   flutter run -d chrome
   ```

This will open the app in your web browser!

## Option 3: Use Flutter with VS Code

1. Install Flutter SDK (steps 1-4 above)
2. Install VS Code: https://code.visualstudio.com/
3. Install Flutter extension in VS Code
4. Open the flutter_menu folder in VS Code
5. Press F5 to run

## Common Issues

### "flutter: command not found"
- You need to restart your terminal/PowerShell after adding to PATH
- Make sure you added the correct path (should end with `\bin`)

### "Android toolchain" issues
- Only needed for Android development
- For quick testing, use Chrome: `flutter run -d chrome`

### "No devices found"
- Install Chrome and run: `flutter devices`
- Should show "Chrome" as an available device

## After Installation

Once Flutter is installed, navigate to the flutter_menu folder and run:

```bash
cd "C:\Users\User\Desktop\Desktop (1)\Desktop (2)\Macathon\thru.ai\flutter_menu"
flutter pub get
flutter run -d chrome
```

The app will open in your browser showing the Burger Express menu!
