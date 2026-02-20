import React from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '@/contexts/AuthContext';
import MainNavigator from '@/navigation/MainNavigator';

export default function App() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" />
          <MainNavigator />
        </NavigationContainer>
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
