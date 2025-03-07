import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Image, View, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import MapScreen from '../screens/MapScreen';
import MygaragesScreen from '../screens/MygaragesScreen';
import CreateGarageScreen from '../screens/CreateGarageScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WishlistScreen from '../screens/WishlistScreen';
import GarageDetailScreen from '../screens/GarageDetailScreen';
import ReservationScreen from '../screens/ReservationScreen';
import SetAvailabilityScreen from '../screens/setAvailabilityScreen';
import ReportScreen from '../screens/ReportScreen';

const MyGaragesStack = createStackNavigator();
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MyGaragesStackNavigator = () => (
  <MyGaragesStack.Navigator>
    <MyGaragesStack.Screen 
      name="Mygarages" 
      component={MygaragesScreen} 
      options={{ headerShown: false }} 
    />
    <MyGaragesStack.Screen 
      name="GarageDetail" 
      component={GarageDetailScreen} 
      options={{ headerShown: false }} 
    />
    <MyGaragesStack.Screen 
      name="Report" 
      component={ReportScreen} 
      options={{ headerShown: false }} 
    />
    <MyGaragesStack.Screen 
      name="Reservation" 
      component={ReservationScreen} 
      options={{ headerShown: false }} 
    />
    <MyGaragesStack.Screen 
      name="SetAvailability" 
      component={SetAvailabilityScreen} 
      options={{ headerShown: false }} 
    />
  </MyGaragesStack.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AppTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconSource;

        switch (route.name) {
          case 'Map':
            iconSource = require('../assets/icons/map_icon.png'); 
            break;
          case 'MyGarages':
            iconSource = require('../assets/icons/home_icon.png'); 
            break;
          case 'CreateGarage':
            iconSource = require('../assets/icons/addition_icon.png'); 
            break;
          case 'Wishlist':
            iconSource = require('../assets/icons/heart_icon.png'); 
            break;
          case 'Profile':
            iconSource = require('../assets/icons/profile_icon.png'); 
            break;
        }

        return (
          <Image
            source={iconSource}
            style={{ width: size, height: size, tintColor: color }}
          />
        );
      },
      tabBarActiveTintColor: '#007BFF',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: { height: 60, paddingBottom: 5 },
    })}
  >
    <Tab.Screen name="Map" component={MapScreen} />
    <Tab.Screen name="MyGarages" component={MyGaragesStackNavigator} />
    <Tab.Screen name="CreateGarage" component={CreateGarageScreen} />
    <Tab.Screen name="Wishlist" component={WishlistScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const Navigation = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {user ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default Navigation;
