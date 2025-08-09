# Dark Mode Button Location - Version 1.0.9

## Where to Find the Dark Mode Button

The dark mode toggle button is located in the **Settings screen** of the mobile app.

### Navigation Path:
1. **Open the CHATLI mobile app**
2. **Tap on the Settings tab** (gear icon) in the bottom navigation
3. **Scroll to the "Settings" section**
4. **Look for "Dark Mode"** - it's the first item in the Settings section
5. **Tap the moon/sun icon** to toggle between light and dark modes

### Visual Description:
- **Icon**: Moon outline (🌙) when in light mode, Sun (☀️) when in dark mode
- **Position**: First item in the "Settings" section
- **Function**: Toggle button that switches between light and dark themes
- **Size**: Small circular button (20px) on the right side of the setting item

### How It Works:
- **Light Mode**: Shows a moon icon, tap to switch to dark mode
- **Dark Mode**: Shows a sun icon, tap to switch to light mode
- **Instant**: Theme changes immediately when tapped
- **Persistent**: Your theme preference is saved and remembered

### Technical Implementation:
- **Component**: `ThemeToggle` component
- **Context**: Uses `ThemeContext` for state management
- **Storage**: Theme preference is saved to AsyncStorage
- **Styling**: Automatically adapts colors based on current theme

### Screenshots:
```
Settings Screen Layout:
┌─────────────────────────────────┐
│ Settings                        │
├─────────────────────────────────┤
│ Settings                        │
│ ┌─────────────────────────────┐ │
│ │ 🌙 Dark Mode          [🌙]  │ │ ← Dark Mode Toggle
│ │ 📥 Auto Download      [⚪]  │ │
│ │ 📶 Mobile Data        [>]   │ │
│ │ 🌐 Language           [>]   │ │
│ └─────────────────────────────┘ │
│                                 │
│ Privacy                         │
│ ┌─────────────────────────────┐ │
│ │ ... other privacy settings  │ │
│ └─────────────────────────────┘ │
│                                 │
│ Help                           │
│ ┌─────────────────────────────┐ │
│ │ ... help and support items  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## Version Information

**App Version**: 1.0.9  
**Feature**: Dark Mode Toggle  
**Location**: Settings Screen → Settings Section → Dark Mode  
**Status**: ✅ Implemented and Functional 