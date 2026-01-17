import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import HomeScreen from '@/screens/home/HomeScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import SearchScreen from '@/screens/search/SearchScreen';
import SearchResultsScreen from '@/screens/search/SearchResultsScreen';
import { COLORS, ROUTES, SIZES } from '@/constants';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background.secondary },
      }}
    >
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
      />
      <Stack.Screen
        name="SearchScreen"
        component={SearchScreen}
      />
      <Stack.Screen
        name="SearchResultsScreen"
        component={SearchResultsScreen}
      />
    </Stack.Navigator>
  );
};

const SearchStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background.secondary },
      }}
    >
      <Stack.Screen
        name="SearchScreen"
        component={SearchScreen}
      />
    </Stack.Navigator>
  );
};

const FavoritesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background.secondary },
      }}
    >
      <Stack.Screen
        name="FavoritesScreen"
        component={HomeScreen} // Placeholder
      />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background.secondary },
      }}
    >
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
      />
    </Stack.Navigator>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.secondary,
        tabBarStyle: {
          borderTopColor: COLORS.border.light,
          backgroundColor: COLORS.background.primary,
          paddingBottom: SIZES.sm,
          paddingTop: SIZES.sm,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: SIZES.fontSize.xs,
          marginTop: -SIZES.sm,
        },
      })}
    >
      <Tab.Screen
        name={ROUTES.HOME}
        component={HomeStack}
        options={{
          title: 'Inicio',
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <Feather name="home" size={24} color={focused ? '#2563EB' : '#64748B'} />
          ),
        }}
      />

      <Tab.Screen
        name={ROUTES.SEARCH}
        component={SearchStack}
        options={{
          title: 'Buscar',
          tabBarLabel: 'Buscar',
          tabBarIcon: ({ focused }) => (
            <Feather name="search" size={24} color={focused ? '#2563EB' : '#64748B'} />
          ),
        }}
      />

      <Tab.Screen
        name={ROUTES.FAVORITES}
        component={FavoritesStack}
        options={{
          title: 'Favoritos',
          tabBarLabel: 'Favoritos',
          tabBarIcon: ({ focused }) => (
            <Feather name="heart" size={24} color={focused ? '#2563EB' : '#64748B'} />
          ),
        }}
      />

      <Tab.Screen
        name={ROUTES.PROFILE}
        component={ProfileStack}
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <Feather name="user" size={24} color={focused ? '#2563EB' : '#64748B'} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name={ROUTES.LOGIN}
        component={LoginScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name={ROUTES.REGISTER}
        component={RegisterScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;

