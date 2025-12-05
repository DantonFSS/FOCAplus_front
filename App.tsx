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

// Stack Navigator para o fluxo de criação de curso
function CourseCreationStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NewCourse" component={NewCourseScreen} />
      <Stack.Screen name="PeriodDetail" component={PeriodDetailScreen} />
      <Stack.Screen name="PeriodInfo" component={PeriodInfoScreen} />
      <Stack.Screen name="AddDisciplines" component={AddDisciplinesScreen} />
      <Stack.Screen name="CourseInfo" component={CourseInfoScreen} />
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
        <Drawer.Screen name="Home" component={HomeScreen} />
        <Drawer.Screen name="Pro" component={ProScreen} />
        <Drawer.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Drawer.Screen 
          name="CourseCreation" 
          component={CourseCreationStack}
          options={{ headerShown: false }}
        />
        <Drawer.Screen 
          name="CourseInfo" 
          component={CourseInfoScreen}
          options={{ headerShown: false }}
        />
        <Drawer.Screen 
          name="PeriodInfo" 
          component={PeriodInfoScreen}
          options={{ headerShown: false }}
        />
        <Drawer.Screen 
          name="DisciplineInfo" 
          component={DisciplineInfoScreen}
          options={{ headerShown: false }}
        />
        <Drawer.Screen 
          name="EvaluationInfo" 
          component={EvaluationInfoScreen}
          options={{ headerShown: false }}
        />
        <Drawer.Screen 
          name="AddDisciplines" 
          component={AddDisciplinesScreen}
          options={{ headerShown: false }}
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
