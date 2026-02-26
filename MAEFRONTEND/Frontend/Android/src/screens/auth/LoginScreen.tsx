import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import TextInputField from '@/components/ui/TextInputField';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Container from '@/components/ui/Container';
import { authApi } from '@/services/api/authApi';
import { storageService } from '@/services/storage/storageService';
import { validators, validationMessages } from '@/utils/validation';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, SIZES, ROUTES } from '@/constants';

interface LoginForm {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginScreen = ({ route }: any) => {
  const navigation = useNavigation();
  const { login: setAuthUser } = useAuth();
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(
    route?.params?.registered === 'true'
  );

  // Limpiar mensaje de éxito después de 3 segundos
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!form.email) {
      newErrors.email = validationMessages.required;
    } else if (!validators.email(form.email)) {
      newErrors.email = validationMessages.email;
    }

    if (!form.password) {
      newErrors.password = validationMessages.required;
    } else if (!validators.password(form.password)) {
      newErrors.password = validationMessages.password;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setGeneralError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login({
        email: form.email,
        password: form.password,
      });

      // El login fue exitoso
      console.log('✅ Login exitoso:', response.user.email);
      
      // Actualizar el contexto de autenticación
      await setAuthUser(response.user);
      
      // Navegar de vuelta a la pantalla principal
      navigation.goBack();
      
      // Mostrar mensaje de éxito (opcional)
      setTimeout(() => {
        alert(`¡Bienvenido/a ${response.user.firstName}!`);
      }, 300);
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      let errorMessage = 'Error al iniciar sesión. Por favor, intenta de nuevo';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('401') || error.message.includes('Invalid')) {
          errorMessage = 'Email o contraseña incorrectos';
        } else if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = 'Usuario no encontrado. ¿Necesitas registrarte?';
        } else if (error.message.includes('suspended')) {
          errorMessage = 'Tu cuenta ha sido suspendida. Contacta con soporte';
        }
      }
      
      setGeneralError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterPress = () => {
    navigation.navigate(ROUTES.REGISTER as never);
  };

  const handleForgotPassword = () => {
    navigation.navigate(ROUTES.FORGOT_PASSWORD as never);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.secondary }}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Container padding={SIZES.lg}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Image 
              source={require('@/assets/images/logo_sin_fondo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.subtitle}>Ingresa a tu cuenta para continuar</Text>
          </View>

          {showSuccessMessage && <Alert
            type="success"
            title="¡Registro exitoso!"
            message="Tu cuenta ha sido creada. Ahora puedes iniciar sesión"
            style={styles.alert}
          />}

          {generalError && <Alert
            type="error"
            title="Error de inicio de sesión"
            message={generalError}
            style={styles.alert}
          />}

          {/* Form */}
          <View style={styles.form}>
            <TextInputField
              label="Correo Electrónico"
              placeholder="tu@email.com"
              value={form.email}
              onChangeText={(text) => {
                setForm({ ...form, email: text });
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              keyboardType="email-address"
              editable={!isLoading}
            />

            <TextInputField
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              value={form.password}
              onChangeText={(text) => {
                setForm({ ...form, password: text });
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color="#64748B" 
                  />
                </TouchableOpacity>
              }
            />

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={isLoading}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              title={isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              onPress={handleLogin}
              isLoading={isLoading}
              disabled={isLoading}
              size="lg"
              style={styles.loginButton}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <Button
              title="Continuar con Google"
              onPress={() => console.log('Google login')}
              variant="outline"
              size="lg"
              style={styles.socialButton}
            />
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={handleRegisterPress} disabled={isLoading}>
              <Text style={styles.registerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.xl * 2,
  },
  logoImage: {
    width: 200,
    height: 80,
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: SIZES.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: SIZES.lg,
    marginBottom: SIZES.sm,
  },
  subtitle: {
    fontSize: SIZES.fontSize.base,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  alert: {
    marginBottom: SIZES.lg,
  },
  form: {
    marginBottom: SIZES.xl,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: SIZES.lg,
  },
  forgotPasswordText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: SIZES.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SIZES.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border.light,
  },
  dividerText: {
    marginHorizontal: SIZES.md,
    fontSize: SIZES.fontSize.sm,
    color: COLORS.text.secondary,
  },
  socialButton: {
    marginBottom: SIZES.md,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SIZES.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  registerText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.text.secondary,
  },
  registerLink: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: SIZES.md,
    right: SIZES.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
});
