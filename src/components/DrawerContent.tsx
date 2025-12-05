import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';

interface DrawerContentProps {
  navigation?: any;
  currentScreen?: string;
}

export const DrawerContent: React.FC<DrawerContentProps> = ({ navigation, currentScreen = 'Home' }) => {
  const { user, logout } = useAuth();

  const isHomeActive = currentScreen === 'Home' || currentScreen === 'home';

  const menuItems = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: 'casa_icon', 
      iconType: 'asset',
      screen: 'Home',
      disabled: false,
    },
    { 
      id: 'create-course', 
      label: 'Criar curso', 
      icon: 'plus_ison', 
      iconType: 'asset', 
      screen: 'CourseCreation',
      disabled: false,
    },
    { 
      id: 'join-group', 
      label: 'Juntar-se ao curso', 
      icon: 'users_icon', 
      iconType: 'asset',
      disabled: true,
      comingSoon: true,
    },
    { 
      id: 'pro', 
      label: 'Obter Pro', 
      icon: 'star_icon', 
      iconType: 'asset', 
      screen: 'Pro',
      disabled: false,
    },
    // Gap antes de Configurações
    { 
      id: 'settings', 
      label: 'Configurações', 
      icon: 'config_icon', 
      iconType: 'asset',
      disabled: false,
    },
    { 
      id: 'help', 
      label: 'Ajuda & feedback', 
      icon: 'quest_icon', 
      iconType: 'asset',
      disabled: false,
    },
    { 
      id: 'about', 
      label: 'Sobre', 
      icon: 'info_icon', 
      iconType: 'asset',
      disabled: false,
    },
  ];

  const getIconSource = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'casa_icon': require('../../assets/casa_icon.png'),
      'star_icon': require('../../assets/star_icon.png'),
      'plus_ison': require('../../assets/plus_ison.png'),
      'users_icon': require('../../assets/users_icon.png'),
      'config_icon': require('../../assets/config_icon.png'),
      'quest_icon': require('../../assets/quest_icon.png'),
      'info_icon': require('../../assets/info_icon.png'),
    };
    return iconMap[iconName];
  };

  const handleNavigation = (item: any) => {
    if (item.disabled || !navigation) return;
    
    if (item.screen) {
      navigation.navigate(item.screen as never);
    } else if (item.id === 'home') {
      navigation.navigate('Home');
    }
  };


  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top spacing */}
        <View style={styles.topSpacing} />
        
        {/* Avatar e Nome do Usuário */}
        {user && (
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.userName}>
              {user?.name || user?.username || 'Usuário'}
            </Text>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => {
            const isActive = 
              (item.id === 'home' && (currentScreen === 'Home' || currentScreen === 'home')) ||
              (item.screen && currentScreen === item.screen);
            const isSettings = item.id === 'settings';
            
            return (
              <React.Fragment key={item.id}>
                {/* Gap antes de Configurações */}
                {isSettings && (
                  <View style={styles.gapBeforeSettings} />
                )}
                
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                    item.disabled && styles.menuItemDisabled,
                  ]}
                  onPress={() => handleNavigation(item)}
                  disabled={item.disabled}
                  activeOpacity={0.7}
                >
                  {item.iconType === 'asset' ? (
                    <Image 
                      source={getIconSource(item.icon)} 
                      style={[
                        styles.menuIconImage,
                        isActive && styles.menuIconImageActive,
                      ]}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={[
                      styles.menuIcon,
                      isActive && styles.menuIconActive,
                    ]}>
                      {item.icon}
                    </Text>
                  )}
                  <Text style={[
                    styles.menuLabel,
                    isActive && styles.menuLabelActive,
                    item.disabled && styles.menuLabelDisabled,
                  ]}>
                    {item.label}
                  </Text>
                  {item.comingSoon && (
                    <View style={styles.comingSoonChip}>
                      <Text style={styles.comingSoonText}>Em breve</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Logout Button - Fora do ScrollView para sempre estar visível */}
      <View style={styles.logoutSection}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: 20,
  },
  topSpacing: {
    height: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 24,
    paddingBottom: 24,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.black,
  },
  menuSection: {
    paddingTop: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 24,
    paddingRight: 24,
    minHeight: 56,
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 2,
  },
  menuItemActive: {
    backgroundColor: '#0085FF',
    borderRadius: 8,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuIcon: {
    fontSize: 24,
    width: 24,
    height: 24,
    marginRight: 14,
    textAlign: 'center',
    color: '#111111',
    lineHeight: 24,
    opacity: 0.9,
  },
  menuIconActive: {
    color: theme.colors.white,
    opacity: 1,
  },
  menuIconImage: {
    width: 24,
    height: 24,
    marginRight: 14,
    tintColor: '#111111',
    opacity: 0.85,
  },
  menuIconImageActive: {
    tintColor: theme.colors.white,
    opacity: 1,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
  },
  menuLabelActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  menuLabelDisabled: {
    color: 'rgba(17, 17, 17, 0.6)',
  },
  comingSoonChip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  comingSoonText: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '400',
  },
  gapBeforeSettings: {
    height: 32,
  },
  logoutSection: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: theme.colors.white,
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    minHeight: 56,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E53935',
  },
  bottomSpacing: {
    height: 48,
  },
});
