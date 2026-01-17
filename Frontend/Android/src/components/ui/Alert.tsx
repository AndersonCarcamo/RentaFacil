import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { COLORS, SIZES } from '@/constants';

interface AlertProps {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  title?: string;
  style?: ViewStyle;
}

const Alert: React.FC<AlertProps> = ({ type, message, title, style }) => {
  // No renderizar si no hay mensaje
  if (!message || message.length === 0) {
    return null;
  }

  const getAlertStyle = () => {
    const baseStyle: ViewStyle = {
      padding: SIZES.md,
      borderRadius: SIZES.radius.md,
      marginBottom: SIZES.md,
    };

    const typeStyles: Record<string, ViewStyle> = {
      error: {
        backgroundColor: '#FEE2E2',
        borderLeftWidth: 4,
        borderLeftColor: COLORS.danger,
      },
      success: {
        backgroundColor: '#DCFCE7',
        borderLeftWidth: 4,
        borderLeftColor: COLORS.success,
      },
      warning: {
        backgroundColor: '#FEF3C7',
        borderLeftWidth: 4,
        borderLeftColor: COLORS.warning,
      },
      info: {
        backgroundColor: '#DBEAFE',
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
      },
    };

    return { ...baseStyle, ...typeStyles[type], ...style };
  };

  const getTextColor = () => {
    const colors: Record<string, string> = {
      error: '#7F1D1D',
      success: '#166534',
      warning: '#92400E',
      info: '#1E40AF',
    };
    return colors[type];
  };

  return (
    <View style={getAlertStyle()}>
      {title && (
        <Text
          style={[
            styles.title,
            { color: getTextColor() },
          ]}
        >
          {title}
        </Text>
      )}
      {message && message.length > 0 && (
        <Text
          style={[
            styles.message,
            { color: getTextColor() },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

export default Alert;

const styles = StyleSheet.create({
  title: {
    fontSize: SIZES.fontSize.base,
    fontWeight: '600',
    marginBottom: SIZES.sm,
  },
  message: {
    fontSize: SIZES.fontSize.sm,
    lineHeight: 20,
  },
});
