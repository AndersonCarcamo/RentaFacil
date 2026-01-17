import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api/authApi';
import { COLORS, SIZES, ROUTES } from '@/constants';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      await logout();
      // El usuario será redirigido al home automáticamente
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleLogin = () => {
    navigation.navigate(ROUTES.LOGIN as never);
  };

  // Si no está autenticado
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>
        
        <View style={styles.notAuthContainer}>
          <View style={styles.notAuthIcon}>
            <Feather name="user" size={64} color="#CBD5E1" />
          </View>
          <Text style={styles.notAuthTitle}>Inicia sesión</Text>
          <Text style={styles.notAuthText}>
            Inicia sesión para acceder a tu perfil y disfrutar de todas las funcionalidades
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Usuario autenticado
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
        </View>

        {/* Información del usuario */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user.profilePictureUrl ? (
              <Image source={{ uri: user.profilePictureUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={48} color="#2563EB" />
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.email}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          
          {user.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user.role === 'USER' ? 'Inquilino' : user.role === 'LANDLORD' ? 'Propietario' : 'Inmobiliaria'}
              </Text>
            </View>
          )}
        </View>

        {/* Opciones del menú */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Feather name="edit" size={22} color="#64748B" />
            <Text style={styles.menuItemText}>Editar Perfil</Text>
            <Feather name="chevron-right" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="home" size={22} color="#64748B" />
            <Text style={styles.menuItemText}>Mis Propiedades</Text>
            <Feather name="chevron-right" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="calendar" size={22} color="#64748B" />
            <Text style={styles.menuItemText}>Mis Reservas</Text>
            <Feather name="chevron-right" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="credit-card" size={22} color="#64748B" />
            <Text style={styles.menuItemText}>Métodos de Pago</Text>
            <Feather name="chevron-right" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="bell" size={22} color="#64748B" />
            <Text style={styles.menuItemText}>Notificaciones</Text>
            <Feather name="chevron-right" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="shield" size={22} color="#64748B" />
            <Text style={styles.menuItemText}>Verificación</Text>
            <Feather name="chevron-right" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="settings" size={22} color="#64748B" />
            <Text style={styles.menuItemText}>Configuración</Text>
            <Feather name="chevron-right" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Feather name="help-circle" size={22} color="#64748B" />
            <Text style={styles.menuItemText}>Ayuda y Soporte</Text>
            <Feather name="chevron-right" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Botón de cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Versión 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  notAuthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.xl * 4,
  },
  notAuthIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  notAuthTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: SIZES.md,
  },
  notAuthText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.xl,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.lg,
    minWidth: 200,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 2*SIZES.xl,
    marginBottom: SIZES.md,
  },
  avatarContainer: {
    marginBottom: SIZES.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: SIZES.xs,
  },
  userEmail: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: SIZES.md,
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.full,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: SIZES.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    marginLeft: SIZES.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: SIZES.lg,
    marginVertical: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.lg,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: SIZES.sm,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  footerText: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
