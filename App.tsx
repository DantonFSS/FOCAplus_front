import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProScreen } from './src/screens/ProScreen';
import { CreateGroupScreen } from './src/screens/CreateGroupScreen';
import { NewCourseScreen } from './src/screens/NewCourseScreen';
import { PeriodDetailScreen } from './src/screens/PeriodDetailScreen';
import { PeriodInfoScreen } from './src/screens/PeriodInfoScreen';
import { AddDisciplinesScreen } from './src/screens/AddDisciplinesScreen';
import { CourseInfoScreen } from './src/screens/CourseInfoScreen';
import { DisciplineInfoScreen } from './src/screens/DisciplineInfoScreen';
import { EvaluationInfoScreen } from './src/screens/EvaluationInfoScreen';
import { DrawerContent } from './src/components/DrawerContent';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { theme } from './src/theme';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register'>('login');

  return (
    <>
      {currentScreen === 'login' ? (
        <LoginScreen 
          onNavigateToRegister={() => setCurrentScreen('register')}
          onLoginSuccess={() => {
            // O redirecionamento será feito automaticamente pelo AppNavigator
            // quando isAuthenticated mudar
          }}
        />
      ) : (
        <RegisterScreen onNavigateToLogin={() => setCurrentScreen('login')} />
      )}
      <StatusBar style={currentScreen === 'login' ? 'light' : 'dark'} />
    </>
  );
}

// Stack Navigator para o fluxo completo do app
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="NewCourse" component={NewCourseScreen} />
      <Stack.Screen name="PeriodDetail" component={PeriodDetailScreen} />
      <Stack.Screen name="CourseInfo" component={CourseInfoScreen} />
      <Stack.Screen name="PeriodInfo" component={PeriodInfoScreen} />
      <Stack.Screen name="AddDisciplines" component={AddDisciplinesScreen} />
      <Stack.Screen name="DisciplineInfo" component={DisciplineInfoScreen} />
      <Stack.Screen name="EvaluationInfo" component={EvaluationInfoScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Ou um componente de loading
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => {
          const state = props.state;
          const currentRoute = state.routes[state.index];
          return <DrawerContent {...props} currentScreen={currentRoute.name} />;
        }}
        screenOptions={({ navigation }) => ({
          drawerStyle: {
            backgroundColor: theme.colors.white,
            width: 320,
          },
          overlayColor: 'rgba(0, 0, 0, 0.35)',
          drawerType: 'front',
          drawerActiveTintColor: theme.colors.blueLight,
          drawerInactiveTintColor: '#111111',
          drawerLabelStyle: {
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: 20,
          },
          drawerItemStyle: {
            borderRadius: 0,
          },
          drawerAnimationDuration: 220,
          drawerHideStatusBarOnOpen: false,
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.white,
          },
          headerTintColor: theme.colors.black,
          headerTitle: '',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.openDrawer()}
              style={{ marginLeft: 16, padding: 8 }}
            >
              <Text style={{ fontSize: 24, color: theme.colors.black }}>☰</Text>
            </TouchableOpacity>
          ),
        })}
      >
        <Drawer.Screen 
          name="Home" 
          component={MainStack} 
          options={{ headerShown: false }}
        />
        <Drawer.Screen name="Pro" component={ProScreen} />
        <Drawer.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Drawer.Screen 
          name="CourseCreation" 
          component={NewCourseScreen}
          options={{ headerShown: true }}
        />
      </Drawer.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
