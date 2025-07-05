# Dark Mode Implementation Guide

## Overview

The CHATLI mobile app now supports a comprehensive dark mode system with the following features:

- **System Theme Detection**: Automatically detects and follows the device's system theme preference
- **Manual Theme Toggle**: Users can manually switch between light and dark modes
- **Theme Persistence**: Theme preference is saved to AsyncStorage and persists across app launches
- **Consistent Theming**: All components use a centralized theme system for consistent appearance

## Architecture

### 1. Theme Context (`src/contexts/ThemeContext.js`)

The main theme management system that provides:
- Current theme state (`light` or `dark`)
- Theme toggle function
- Theme persistence with AsyncStorage
- System theme change detection

```javascript
const { theme, toggleTheme, setTheme, resetToSystemTheme, isLoading } = useTheme();
```

### 2. Theme Utilities (`src/utils/themeUtils.js`)

Centralized theme utilities providing:
- Color schemes for light and dark modes
- Helper functions for common theme operations
- Pre-built style objects for common UI elements

#### Color Schemes

**Light Mode Colors:**
- Background: `#ffffff`
- Surface: `#f8fafc`
- Text: `#0f172a`
- Primary: `#000000`
- Border: `#e2e8f0`

**Dark Mode Colors:**
- Background: `#000000` (pure black)
- Surface: `#1a1a1a` (dark gray)
- Text: `#ffffff` (pure white)
- Primary: `#ffffff` (pure white)
- Border: `#333333` (medium gray)

### 3. Theme Toggle Component (`src/components/ThemeToggle.js`)

A reusable component for toggling between themes:
- Shows sun icon in dark mode
- Shows moon icon in light mode
- Automatically adapts to current theme colors

## Usage

### Basic Theme Usage

```javascript
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';

const MyComponent = () => {
  const { theme, toggleTheme } = useTheme();
  const colors = getThemeColors(theme);

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>
        Hello World
      </Text>
      <TouchableOpacity onPress={toggleTheme}>
        <Text>Toggle Theme</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Using Theme Toggle Component

```javascript
import ThemeToggle from '../components/ThemeToggle';

const Header = () => {
  return (
    <View style={styles.header}>
      <Text>CHATLI</Text>
      <ThemeToggle size={24} />
    </View>
  );
};
```

### Common Style Patterns

#### Container with Theme Colors
```javascript
const colors = getThemeColors(theme);

<View style={[
  styles.container, 
  { backgroundColor: colors.background }
]}>
```

#### Text with Theme Colors
```javascript
<Text style={[
  styles.title,
  { color: colors.text }
]}>
  Title
</Text>

<Text style={[
  styles.subtitle,
  { color: colors.textSecondary }
]}>
  Subtitle
</Text>
```

#### Input Fields
```javascript
<TextInput
  style={[
    styles.input,
    {
      backgroundColor: colors.surfaceVariant,
      borderColor: colors.border,
      color: colors.text,
    }
  ]}
  placeholderTextColor={colors.placeholder}
/>
```

#### Buttons
```javascript
<TouchableOpacity
  style={[
    styles.button,
    {
      backgroundColor: colors.primary,
    }
  ]}
>
  <Text style={{ color: colors.textInverse }}>
    Button Text
  </Text>
</TouchableOpacity>
```

## Updated Components

The following components have been updated to support dark mode:

### 1. App.js
- Navigation container theming
- Tab bar theming
- Status bar theming
- Stack navigator theming

### 2. ChatListScreen
- Background colors
- Header theming
- Search input theming
- Chat item theming
- Loading states
- Error states

### 3. SettingsScreen
- Background colors
- Setting items theming
- Switch components
- Logout button theming
- Footer theming

### 4. PostFeedScreen
- Background colors
- Header theming
- Loading states
- Error states
- Floating action button

### 5. Post Component
- Basic theming structure (needs completion)

## Theme Colors Reference

### Background Colors
- `background`: Main app background
- `surface`: Card and component backgrounds
- `surfaceVariant`: Secondary surface backgrounds
- `surfaceElevated`: Elevated surface backgrounds

### Text Colors
- `text`: Primary text color
- `textSecondary`: Secondary text color
- `textTertiary`: Tertiary text color
- `textInverse`: Text color for dark backgrounds

### Interactive Colors
- `primary`: Primary action color
- `primaryLight`: Light variant of primary
- `secondary`: Secondary action color
- `accent`: Accent color for highlights

### Status Colors
- `success`: Success states
- `warning`: Warning states
- `error`: Error states
- `info`: Information states

### Border Colors
- `border`: Standard borders
- `borderLight`: Light borders
- `borderDark`: Dark borders

### Special Colors
- `link`: Link colors
- `placeholder`: Input placeholder text
- `disabled`: Disabled state colors
- `disabledText`: Disabled text colors

## Best Practices

### 1. Always Use Theme Colors
Never use hardcoded colors. Always reference the theme color system:

```javascript
// ❌ Bad
<View style={{ backgroundColor: '#ffffff' }}>

// ✅ Good
<View style={{ backgroundColor: colors.background }}>
```

### 2. Use Semantic Color Names
Use semantic color names instead of specific colors:

```javascript
// ❌ Bad
<Text style={{ color: '#000000' }}>

// ✅ Good
<Text style={{ color: colors.text }}>
```

### 3. Combine with StyleSheet
Combine theme colors with StyleSheet for better performance:

```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

// In component
<View style={[
  styles.container,
  { backgroundColor: colors.background }
]}>
```

### 4. Test Both Themes
Always test your components in both light and dark modes to ensure proper contrast and readability.

## Future Enhancements

1. **Animated Theme Transitions**: Add smooth transitions when switching themes
2. **Custom Theme Support**: Allow users to create custom color schemes
3. **High Contrast Mode**: Add high contrast mode for accessibility
4. **Theme Presets**: Pre-built theme variations (e.g., blue theme, green theme)
5. **Component Library**: Create a comprehensive themed component library

## Troubleshooting

### Theme Not Updating
- Ensure the component is wrapped in `ThemeProvider`
- Check that `useTheme()` is called correctly
- Verify AsyncStorage permissions

### Colors Not Applying
- Make sure `getThemeColors(theme)` is called
- Check that the color property exists in the theme
- Verify the component is re-rendering when theme changes

### Performance Issues
- Use `useMemo` for expensive theme calculations
- Avoid creating new style objects on every render
- Use StyleSheet.create for static styles 