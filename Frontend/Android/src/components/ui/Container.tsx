import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { COLORS, SIZES } from '@/constants';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  backgroundColor?: string;
}

const Container: React.FC<ContainerProps> = ({
  children,
  style,
  padding = SIZES.md,
  paddingHorizontal,
  paddingVertical,
  backgroundColor = COLORS.background.secondary,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          padding,
          paddingHorizontal: paddingHorizontal ?? padding,
          paddingVertical: paddingVertical ?? padding,
          backgroundColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default Container;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
