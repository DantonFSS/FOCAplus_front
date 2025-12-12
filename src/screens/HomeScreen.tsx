import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { userCoursesApi, UserCourseResponse } from '../api/userCourses';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [courses, setCourses] = useState<UserCourseResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCourses = async () => {
    try {
      const coursesList = await userCoursesApi.getAll();
      setCourses(coursesList);
    } catch (error) {
      console.error('❌ Erro ao carregar cursos:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Carregar cursos quando a tela é focada
  useFocusEffect(
    React.useCallback(() => {
      loadCourses();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCourses();
  };

  const handleCoursePress = (course: UserCourseResponse) => {
    (navigation as any).navigate('CourseInfo', {
      userCourseId: course.userCourseId,
    });
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Começar</Text>
        <Text style={styles.subtitle}>Estamos felizes que você esteja aqui.</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.blueLight} />
          <Text style={styles.loadingText}>Carregando cursos...</Text>
        </View>
      ) : courses.length > 0 ? (
        <View style={styles.coursesContainer}>
          <Text style={styles.coursesTitle}>Meus Cursos</Text>
          {courses.map((course) => (
            <TouchableOpacity
              key={course.userCourseId}
              style={styles.courseCard}
              onPress={() => handleCoursePress(course)}
            >
              <View style={styles.courseIcon}>
                <Text style={styles.courseIconText}>
                  {course.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.courseContent}>
                <Text style={styles.courseName}>{course.name}</Text>
                {course.institutionName && (
                  <Text style={styles.courseInstitution}>{course.institutionName}</Text>
                )}
              </View>
              <Text style={styles.courseArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image 
                source={require('../../assets/foca1.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIcons}>
              <Image 
                source={require('../../assets/box_icon.png')} 
                style={styles.emptyIconImage}
                resizeMode="contain"
              />
              <Image 
                source={require('../../assets/book_alt.png')} 
                style={styles.emptyIconImage}
                resizeMode="contain"
              />
              <Image 
                source={require('../../assets/sad_face.png')} 
                style={styles.emptyIconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.emptyText}>Você ainda não tem cursos.</Text>
            <Text style={styles.emptySubtext}>Clique em 'Criar novo curso' para começar!</Text>
          </View>
        </>
      )}

      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => (navigation as any).navigate('CourseCreation', { screen: 'NewCourse' })}
        >
          <View style={styles.optionIcon}>
            <Image 
              source={require('../../assets/plus_ison.png')} 
              style={styles.optionIconImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Criar um curso</Text>
            <Text style={styles.optionDescription}>
              Comece algo novo e convide outros para participar
            </Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => (navigation as any).navigate('CourseCreation', { screen: 'NewCourse' })}
        >
          <View style={styles.optionIcon}>
            <Image 
              source={require('../../assets/users_icon.png')} 
              style={styles.optionIconImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Digite o código de convite</Text>
            <Text style={styles.optionDescription}>
              Participe de um grupo privado para o qual você foi convidado.
            </Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => (navigation as any).navigate('CourseCreation', { screen: 'NewCourse' })}
        >
          <View style={styles.optionIcon}>
            <Image 
              source={require('../../assets/web_on.png')} 
              style={styles.optionIconImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Explore grupos da comunidade</Text>
            <Text style={styles.optionDescription}>
              Descubra e participe de grupos criados pela comunidade.
            </Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: '700',
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: theme.colors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  emptyStateContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  emptyIcons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  emptyIconImage: {
    width: 32,
    height: 32,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray,
    fontWeight: '500',
  },
  optionsContainer: {
    marginTop: theme.spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  optionIconImage: {
    width: 20,
    height: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  optionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray,
    fontWeight: '500',
  },
  optionArrow: {
    fontSize: 24,
    color: theme.colors.gray,
    marginLeft: theme.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.grayLight,
    marginVertical: theme.spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.gray,
  },
  coursesContainer: {
    marginTop: theme.spacing.md,
  },
  coursesTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.black,
    marginBottom: theme.spacing.md,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.grayLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  courseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  courseIconText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.white,
  },
  courseContent: {
    flex: 1,
  },
  courseName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.black,
    marginBottom: theme.spacing.xs,
  },
  courseInstitution: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray,
    fontWeight: '500',
  },
  courseArrow: {
    fontSize: 24,
    color: theme.colors.gray,
    marginLeft: theme.spacing.sm,
  },
});

