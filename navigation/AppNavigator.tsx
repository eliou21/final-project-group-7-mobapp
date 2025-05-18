import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignUpScreen';
import AdminDashboard from '../screens/AdminDashboard';
import ManageEventsScreen from '../screens/ManageEventsScreen';
import ManageVolunteersScreen from '../screens/ManageVolunteersScreens';
import ProfileScreen from '../screens/ProfileScreen';
import VolunteerDashboard from '../screens/VolunteerDashboard';
import WelcomeScreen from '../screens/WelcomeScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import EventRegistrationScreen from '../screens/EventRegistrationScreen';
import { TouchableOpacity, Text } from 'react-native';
import SavedEventsScreen from '../screens/SavedEventsScreen';
import MyRegisteredEventsScreen from '../screens/MyRegisteredEventsScreen';
import CancelledEventsScreen from '../screens/CancelledEventsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ExitTabButton({ navigation }: { navigation: any }) {
  const { logout } = useAuth();
  return (
    <TouchableOpacity
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      onPress={() => {
        logout();
      }}
    >
      <Ionicons name="log-out" size={24} color="#fff" />
      <Text style={{ fontSize: 12, color: '#fff' }}>Exit</Text>
    </TouchableOpacity>
  );
}

function AdminTabs({ navigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#7BB1B7' },
        tabBarActiveTintColor: '#FFF1C7',
        tabBarInactiveTintColor: '#fff',
        headerShown: false
      }}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} options={{
        tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
      }} />
      <Tab.Screen name="ManageEvents" component={ManageEventsScreen} options={{
        title: 'Event Form',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="file-document-edit" color={color} size={size} />,
      }} />
      <Tab.Screen name="ManageVolunteers" component={ManageVolunteersScreen} options={{
        title: 'Volunteers',
        tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
      }} />
      <Tab.Screen name="CancelledEvents" component={CancelledEventsScreen} options={{
        title: 'Events',
        tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} />,
      }} />
      <Tab.Screen name="Exit" component={WelcomeScreen} options={{
        tabBarButton: (props) => (
          <ExitTabButton navigation={navigation} />
        ),
      }} />
    </Tab.Navigator>
  );
}

function VolunteerTabs({ navigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#7BB1B7' },
        tabBarActiveTintColor: '#FFF1C7',
        tabBarInactiveTintColor: '#fff',
        headerShown: false
      }}
    >
      <Tab.Screen name="Dashboard" component={VolunteerDashboard} options={{
        tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
      }} />
      <Tab.Screen name="SavedEvents" component={SavedEventsScreen} options={{
        tabBarIcon: ({ color, size }) => <Ionicons name="bookmark" color={color} size={size} />,
        title: 'Saved Events',
      }} />
      <Tab.Screen name="MyRegisteredEvents" component={MyRegisteredEventsScreen} options={{
        tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
        title: 'My Events',
      }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{
        tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
      }} />
      <Tab.Screen name="Exit" component={WelcomeScreen} options={{
        tabBarButton: (props) => (
          <ExitTabButton navigation={navigation} />
        ),
      }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuth();  // Assuming useAuth gives you the logged-in user

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user.role === 'admin' ? (
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
      ) : (
        <Stack.Screen name="VolunteerTabs" component={VolunteerTabs} />
      )}
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="CancelledEvents" component={CancelledEventsScreen} />
    </Stack.Navigator>
  );
}
