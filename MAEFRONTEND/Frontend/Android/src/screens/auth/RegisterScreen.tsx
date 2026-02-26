import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import TextInputField from '@/components/ui/TextInputField';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Container from '@/components/ui/Container';
import { authApi } from '@/services/api/authApi';
import { validators, validationMessages, formatDocument, getDocumentMaxLength } from '@/utils/validation';
import { COLORS, SIZES, ROUTES, DOCUMENT_TYPES } from '@/constants';
import { RegisterData, RootStackParamList } from '@/types';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

interface RegisterForm extends RegisterData {}

interface RegisterErrors {
  [key: string]: string;
}

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const route = useRoute();
  const { type } = (route.params as any) || {};

  const getInitialRole = (): RegisterData['role'] => {
    if (!type) return 'USER';
    const typeStr = String(type).toLowerCase();
    if (typeStr === 'landlord') return 'LANDLORD';
    if (typeStr === 'agent') return 'AGENT';
    return 'USER';
  };

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [form, setForm] = useState<RegisterForm>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    nationalId: '',
    nationalIdType: 'DNI',
    role: getInitialRole(),
    acceptTerms: false,
    acceptPrivacy: false,
    profilePicture: null,
    agencyName: '',
    agencyRuc: '',
  });

  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDocumentTypePicker, setShowDocumentTypePicker] = useState(false);

  // Debounce para verificar email
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (form.email && validators.email(form.email)) {
        checkEmail(form.email);
      } else {
        setEmailAvailable(null);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [form.email]);

  const checkEmail = async (email: string) => {
    try {
      setIsCheckingEmail(true);
      const exists = await authApi.checkEmailExists(email);
      setEmailAvailable(!exists);

      if (exists) {
        setErrors((prev) => ({
          ...prev,
          email: 'Este email ya está registrado. Intenta iniciar sesión.',
        }));
      } else if (errors.email?.includes('registrado')) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error al verificar email:', error);
      setEmailAvailable(null);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: COLORS.danger };

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

    if (strength <= 35) {
      return { strength, label: 'Débil', color: COLORS.danger };
    } else if (strength <= 65) {
      return { strength, label: 'Media', color: COLORS.warning };
    } else {
      return { strength, label: 'Fuerte', color: COLORS.success };
    }
  };

  const passwordStrength = getPasswordStrength(form.password);

  const validateStep = (step: number): boolean => {
    const newErrors: RegisterErrors = {};

    switch (step) {
      case 2: // Datos personales
        if (!form.firstName.trim()) {
          newErrors.firstName = 'El nombre es obligatorio';
        }
        if (!form.lastName.trim()) {
          newErrors.lastName = 'El apellido es obligatorio';
        }
        if (!form.email.trim()) {
          newErrors.email = 'El email es obligatorio';
        } else if (!validators.email(form.email)) {
          newErrors.email = validationMessages.email;
        }
        if (form.phone && !validators.phone(form.phone)) {
          newErrors.phone = validationMessages.phone;
        }

        if (form.role === 'AGENT') {
          if (!form.agencyName?.trim()) {
            newErrors.agencyName = 'El nombre de la inmobiliaria es obligatorio';
          }
          if (!form.agencyRuc?.trim()) {
            newErrors.agencyRuc = 'El RUC es obligatorio';
          } else if (!validators.ruc(form.agencyRuc)) {
            newErrors.agencyRuc = validationMessages.document;
          }
        }
        break;

      case 3: // Contraseña
        if (!form.password) {
          newErrors.password = validationMessages.required;
        } else if (!validators.password(form.password)) {
          newErrors.password = validationMessages.password;
        } else if (!/[a-z]/.test(form.password)) {
          newErrors.password = 'Debe contener al menos una letra minúscula';
        } else if (!/[A-Z]/.test(form.password)) {
          newErrors.password = 'Debe contener al menos una letra mayúscula';
        } else if (!/\d/.test(form.password)) {
          newErrors.password = 'Debe contener al menos un número';
        }

        if (!form.confirmPassword) {
          newErrors.confirmPassword = validationMessages.required;
        } else if (!validators.passwordMatch(form.password, form.confirmPassword)) {
          newErrors.confirmPassword = validationMessages.passwordMatch;
        }
        break;

      case 4: // DNI
        if (form.role === 'LANDLORD') {
          if (!form.nationalId.trim()) {
            newErrors.nationalId = 'El número de documento es obligatorio';
          } else if (!validators.document(form.nationalId, form.nationalIdType)) {
            newErrors.nationalId = validationMessages.document;
          }
        }
        break;

      case 5: // Términos
        if (!form.acceptTerms) {
          newErrors.acceptTerms = validationMessages.terms;
        }
        if (!form.acceptPrivacy) {
          newErrors.acceptPrivacy = validationMessages.privacy;
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3 && form.role === 'AGENT') {
        setCurrentStep(5); // Saltar DNI para AGENT
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 5 && form.role === 'AGENT') {
      setCurrentStep(3);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleInputChange = (field: keyof RegisterForm, value: any) => {
    if (field === 'nationalId' && typeof value === 'string') {
      const maxLength = getDocumentMaxLength(form.nationalIdType);
      value = formatDocument(form.nationalIdType, value).substring(0, maxLength);
    }

    if (field === 'agencyRuc' && typeof value === 'string') {
      value = value.replace(/\D/g, '').substring(0, 11);
    }

    if (field === 'phone' && typeof value === 'string') {
      value = value.replace(/\D/g, '').substring(0, 9);
    }

    setForm((prev) => ({ ...prev, [field]: value }));

    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRegister = async () => {
    if (!validateStep(5)) {
      return;
    }

    setGeneralError('');
    setIsLoading(true);

    try {
      const response = await authApi.register(form);
      console.log('✅ Registro exitoso:', response.user.email);

      // Navegar a login con parámetro de éxito
      navigation.navigate(ROUTES.LOGIN, { registered: 'true' });
    } catch (error) {
      console.error('❌ Error en registro:', error);

      let errorMessage = 'Error al registrar. Por favor, intenta de nuevo.';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setGeneralError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: RegisterData['role']) => {
    setForm((prev) => ({ ...prev, role }));
    handleNext();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>¿Cuál es tu rol?</Text>
            <Text style={styles.stepSubtitle}>
              Selecciona el tipo de cuenta que deseas crear
            </Text>

            <TouchableOpacity
              style={[
                styles.roleCard,
                form.role === 'USER' && styles.roleCardActive,
              ]}
              onPress={() => handleRoleSelect('USER')}
            >
              <Feather name="home" size={32} color={form.role === 'USER' ? '#2563EB' : '#64748B'} style={styles.roleIcon} />
              <Text style={styles.roleTitle}>Inquilino</Text>
              <Text style={styles.roleDescription}>
                Busca propiedades para rentar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleCard,
                form.role === 'LANDLORD' && styles.roleCardActive,
              ]}
              onPress={() => handleRoleSelect('LANDLORD')}
            >
              <Feather name="package" size={32} color={form.role === 'LANDLORD' ? '#2563EB' : '#64748B'} style={styles.roleIcon} />
              <Text style={styles.roleTitle}>Propietario</Text>
              <Text style={styles.roleDescription}>
                Publica tus propiedades
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleCard,
                form.role === 'AGENT' && styles.roleCardActive,
              ]}
              onPress={() => handleRoleSelect('AGENT')}
            >
              <Feather name="briefcase" size={32} color={form.role === 'AGENT' ? '#2563EB' : '#64748B'} style={styles.roleIcon} />
              <Text style={styles.roleTitle}>Inmobiliaria</Text>
              <Text style={styles.roleDescription}>
                Gestiona propiedades para clientes
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Datos Personales</Text>

            {generalError && (
              <Alert type="error" message={generalError} style={styles.alert} />
            )}

            <TextInputField
              label="Nombre"
              placeholder="Tu nombre"
              value={form.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
              error={errors.firstName}
            />

            <TextInputField
              label="Apellido"
              placeholder="Tu apellido"
              value={form.lastName}
              onChangeText={(text) => handleInputChange('lastName', text)}
              error={errors.lastName}
            />

            <TextInputField
              label="Correo Electrónico"
              placeholder="tu@email.com"
              value={form.email}
              onChangeText={(text) => handleInputChange('email', text)}
              error={errors.email}
              keyboardType="email-address"
              rightIcon={
                isCheckingEmail ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : emailAvailable === true ? (
                  <Feather name="check" size={20} color="#10B981" />
                ) : emailAvailable === false ? (
                  <Feather name="x" size={20} color="#EF4444" />
                ) : null
              }
            />

            <TextInputField
              label="Teléfono (opcional)"
              placeholder="987654321"
              value={form.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              error={errors.phone}
              keyboardType="phone-pad"
            />

            {form.role === 'AGENT' && (
              <>
                <TextInputField
                  label="Nombre de Inmobiliaria"
                  placeholder="Tu inmobiliaria"
                  value={form.agencyName || ''}
                  onChangeText={(text) =>
                    handleInputChange('agencyName', text)
                  }
                  error={errors.agencyName}
                />

                <TextInputField
                  label="RUC"
                  placeholder="12345678901"
                  value={form.agencyRuc || ''}
                  onChangeText={(text) => handleInputChange('agencyRuc', text)}
                  error={errors.agencyRuc}
                  keyboardType="numeric"
                />
              </>
            )}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Crea tu Contraseña</Text>

            <TextInputField
              label="Contraseña"
              placeholder="Contraseña segura"
              value={form.password}
              onChangeText={(text) => handleInputChange('password', text)}
              error={errors.password}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color="#64748B" 
                  />
                </TouchableOpacity>
              }
            />

            {form.password && (
              <View style={styles.passwordStrengthContainer}>
                <View
                  style={[
                    styles.passwordStrengthBar,
                    {
                      width: `${passwordStrength.strength}%`,
                      backgroundColor: passwordStrength.color,
                    },
                  ]}
                />
                <Text style={styles.passwordStrengthText}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            <TextInputField
              label="Confirmar Contraseña"
              placeholder="Repite tu contraseña"
              value={form.confirmPassword}
              onChangeText={(text) =>
                handleInputChange('confirmPassword', text)
              }
              error={errors.confirmPassword}
              secureTextEntry={!showConfirmPassword}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Feather 
                    name={showConfirmPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color="#64748B" 
                  />
                </TouchableOpacity>
              }
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Documento de Identidad</Text>
            <Text style={styles.stepSubtitle}>
              {form.role === 'LANDLORD'
                ? 'Este paso es obligatorio para propietarios'
                : 'Paso opcional'}
            </Text>

            <TouchableOpacity
              style={styles.documentTypeSelector}
              onPress={() => setShowDocumentTypePicker(true)}
            >
              <Text style={styles.documentTypeText}>{form.nationalIdType}</Text>
              <Feather name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>

            <TextInputField
              label={`Número de ${form.nationalIdType}`}
              placeholder="12345678"
              value={form.nationalId}
              onChangeText={(text) => handleInputChange('nationalId', text)}
              error={errors.nationalId}
              keyboardType="numeric"
              maxLength={getDocumentMaxLength(form.nationalIdType)}
            />

            <Modal visible={showDocumentTypePicker} transparent={true}>
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowDocumentTypePicker(false)}
              >
                <View style={styles.modalContent}>
                  {DOCUMENT_TYPES.map((doc) => (
                    <TouchableOpacity
                      key={doc.value}
                      style={styles.documentOption}
                      onPress={() => {
                        handleInputChange('nationalIdType', doc.value);
                        setShowDocumentTypePicker(false);
                      }}
                    >
                      <Text style={styles.documentOptionText}>
                        {doc.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Términos y Condiciones</Text>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  form.acceptTerms && styles.checkboxChecked,
                ]}
                onPress={() =>
                  handleInputChange('acceptTerms', !form.acceptTerms)
                }
              >
                {form.acceptTerms && (
                  <Feather name="check" size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  handleInputChange('acceptTerms', !form.acceptTerms)
                }
              >
                <Text style={styles.checkboxLabel}>
                  Acepto los Términos y Condiciones
                </Text>
              </TouchableOpacity>
            </View>

            {errors.acceptTerms && (
              <Text style={styles.errorText}>{errors.acceptTerms}</Text>
            )}

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  form.acceptPrivacy && styles.checkboxChecked,
                ]}
                onPress={() =>
                  handleInputChange('acceptPrivacy', !form.acceptPrivacy)
                }
              >
                {form.acceptPrivacy && (
                  <Feather name="check" size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  handleInputChange('acceptPrivacy', !form.acceptPrivacy)
                }
              >
                <Text style={styles.checkboxLabel}>
                  Acepto la Política de Privacidad
                </Text>
              </TouchableOpacity>
            </View>

            {errors.acceptPrivacy && (
              <Text style={styles.errorText}>{errors.acceptPrivacy}</Text>
            )}
          </View>
        );

      default:
        return null;
    }
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
            <Text style={styles.logo}>RENTA</Text>
            <Text style={styles.logoSubtitle}>fácil</Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Paso {currentStep} de {totalSteps}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentStep / totalSteps) * 100}%` },
                ]}
              />
            </View>
          </View>

          {/* Step Content */}
          {renderStep()}

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <Button
                title="Atrás"
                onPress={handleBack}
                variant="outline"
                size="lg"
                style={styles.backButton}
                disabled={isLoading}
              />
            )}

            {currentStep < totalSteps ? (
              <Button
                title="Siguiente"
                onPress={handleNext}
                size="lg"
                style={[
                  styles.nextButton,
                  currentStep > 1 ? { flex: 1, marginLeft: SIZES.md } : undefined,
                ]}
                disabled={isLoading}
              />
            ) : (
              <Button
                title={isLoading ? 'Registrando...' : 'Registrarse'}
                onPress={handleRegister}
                isLoading={isLoading}
                size="lg"
                style={[
                  styles.nextButton,
                  currentStep > 1 ? { flex: 1, marginLeft: SIZES.md } : undefined,
                ]}
                disabled={isLoading}
              />
            )}
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN as never)} disabled={isLoading}>
              <Text style={styles.loginLink}>Inicia sesión aquí</Text>
            </TouchableOpacity>
          </View>
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  logo: {
    fontSize: SIZES.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.primary,
  },
  logoSubtitle: {
    fontSize: SIZES.fontSize.lg,
    color: COLORS.secondary,
    marginTop: -SIZES.sm,
  },
  progressContainer: {
    marginBottom: SIZES.lg,
  },
  progressText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: SIZES.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border.light,
    borderRadius: SIZES.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  stepContainer: {
    marginBottom: SIZES.xl,
  },
  stepTitle: {
    fontSize: SIZES.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SIZES.sm,
  },
  stepSubtitle: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: SIZES.lg,
  },
  alert: {
    marginBottom: SIZES.lg,
  },
  roleCard: {
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  roleIcon: {
    marginBottom: SIZES.md,
  },
  roleTitle: {
    fontSize: SIZES.fontSize.base,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SIZES.sm,
  },
  roleDescription: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  passwordStrengthContainer: {
    marginBottom: SIZES.md,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: COLORS.border.light,
    borderRadius: SIZES.radius.full,
    marginBottom: SIZES.sm,
  },
  passwordStrengthText: {
    fontSize: SIZES.fontSize.xs,
    color: COLORS.text.secondary,
  },
  documentTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    marginBottom: SIZES.lg,
    backgroundColor: COLORS.background.primary,
  },
  documentTypeText: {
    fontSize: SIZES.fontSize.base,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background.primary,
    borderTopLeftRadius: SIZES.radius.xl,
    borderTopRightRadius: SIZES.radius.xl,
    paddingVertical: SIZES.md,
  },
  documentOption: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  documentOptionText: {
    fontSize: SIZES.fontSize.base,
    color: COLORS.text.primary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.border.medium,
    borderRadius: SIZES.radius.sm,
    marginRight: SIZES.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.text.primary,
    flex: 1,
  },
  errorText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.danger,
    marginBottom: SIZES.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SIZES.md,
    marginBottom: SIZES.lg,
  },
  backButton: {
    flex: 0,
  },
  nextButton: {
    flex: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  loginText: {
    fontSize: SIZES.fontSize.sm,
    color: COLORS.text.secondary,
  },
  loginLink: {
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
