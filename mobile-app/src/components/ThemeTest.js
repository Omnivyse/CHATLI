import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../utils/themeUtils';
import ThemeToggle from './ThemeToggle';

const ThemeTest = () => {
  const { theme, toggleTheme } = useTheme();
  const colors = getThemeColors(theme);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Theme Test Component
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Current Theme: {theme}
      </Text>
      
      <View style={[styles.colorPalette, { backgroundColor: colors.surface }]}>
        <Text style={[styles.paletteTitle, { color: colors.text }]}>
          Color Palette
        </Text>
        
        <View style={[styles.colorItem, { backgroundColor: colors.primary }]}>
          <Text style={[styles.colorText, { color: colors.textInverse }]}>
            Primary
          </Text>
        </View>
        
        <View style={[styles.colorItem, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.colorText, { color: colors.text }]}>
            Surface Variant
          </Text>
        </View>
        
        <View style={[styles.colorItem, { backgroundColor: colors.border }]}>
          <Text style={[styles.colorText, { color: colors.text }]}>
            Border
          </Text>
        </View>
        
        <View style={[styles.colorItem, { backgroundColor: colors.success }]}>
          <Text style={[styles.colorText, { color: colors.textInverse }]}>
            Success
          </Text>
        </View>
        
        <View style={[styles.colorItem, { backgroundColor: colors.error }]}>
          <Text style={[styles.colorText, { color: colors.textInverse }]}>
            Error
          </Text>
        </View>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={toggleTheme}
        >
          <Text style={[styles.buttonText, { color: colors.textInverse }]}>
            Toggle Theme
          </Text>
        </TouchableOpacity>
        
        <ThemeToggle size={32} style={styles.themeToggle} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  colorPalette: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  paletteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  colorItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  colorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeToggle: {
    marginLeft: 16,
  },
});

export default ThemeTest; 