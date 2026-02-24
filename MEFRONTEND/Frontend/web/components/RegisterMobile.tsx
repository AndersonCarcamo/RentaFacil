import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Header } from './common/Header';
import Button from './ui/Button';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  IdentificationIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhotoIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { validateDocument, formatDocument, getDocumentMaxLength, getRUCType } from '../lib/utils/documentValidation';
import { checkEmailExists } from '../lib/api/auth';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  nationalIdType: string;
  role: 'USER' | 'LANDLORD' | 'AGENT';
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  profilePicture?: File | null;
  agencyName?: string;
  agencyRuc?: string;
}

interface FormErrors {
  [key: string]: string;
}

interface RegisterMobileProps {
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
  generalError?: string;
  hideHeader?: boolean;
}

const RegisterProgress = React.memo(function RegisterProgress({ visualStep, visualTotalSteps }: { visualStep: number; visualTotalSteps: number }) {
  return (
    <div className="bg-white border-b flex-shrink-0">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-900">
            Paso {visualStep} de {visualTotalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((visualStep / visualTotalSteps) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(visualStep / visualTotalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
});

const Step2PersonalData = React.memo(function Step2PersonalData({
  formData,
  errors,
  isCheckingEmail,
  emailAvailable,
  onInputChange,
  onEmailBlur
}: {
  formData: FormData;
  errors: FormErrors;
  isCheckingEmail: boolean;
  emailAvailable: boolean | null;
  onInputChange: (field: keyof FormData, value: string | boolean) => void;
  onEmailBlur: () => void;
}) {
  const formatPhoneInput = (value: string): string => {
    let cleaned = value.replace(/[^\d+]/g, '');
    if (cleaned && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  return (
    <div className="space-y-1.5">
      <h2 className="text-lg font-bold text-gray-900">
        Datos Personales
      </h2>
      <p className="text-xs text-gray-600 mb-2">
        {formData.role === 'AGENT' 
          ? 'Información del representante y de la inmobiliaria'
          : 'Cuéntanos un poco sobre ti'}
      </p>

      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {formData.role === 'AGENT' ? 'Nombre del Representante *' : 'Nombre *'}
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => onInputChange('firstName', e.target.value)}
              className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.firstName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Tu nombre"
              maxLength={100}
            />
          </div>
          {errors.firstName && (
            <p className="mt-0.5 text-xs text-red-600">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {formData.role === 'AGENT' ? 'Apellido del Representante *' : 'Apellido *'}
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => onInputChange('lastName', e.target.value)}
              className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.lastName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Tu apellido"
              maxLength={100}
            />
          </div>
          {errors.lastName && (
            <p className="mt-0.5 text-xs text-red-600">{errors.lastName}</p>
          )}
        </div>

        {formData.role === 'AGENT' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nombre de la Inmobiliaria *
              </label>
              <div className="relative">
                <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.agencyName || ''}
                  onChange={(e) => onInputChange('agencyName', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.agencyName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nombre de tu inmobiliaria"
                  maxLength={200}
                />
              </div>
              {errors.agencyName && (
                <p className="mt-0.5 text-xs text-red-600">{errors.agencyName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                RUC de la Inmobiliaria *
              </label>
              <div className="relative">
                <IdentificationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.agencyRuc || ''}
                  onChange={(e) => onInputChange('agencyRuc', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.agencyRuc ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="12345678901"
                  maxLength={11}
                />
              </div>
              {errors.agencyRuc && (
                <p className="mt-0.5 text-xs text-red-600">{errors.agencyRuc}</p>
              )}
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Correo Electrónico *
          </label>
          <div className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              onBlur={onEmailBlur}
              className={`w-full pl-10 pr-12 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email 
                  ? 'border-red-300' 
                  : emailAvailable === false 
                    ? 'border-red-300'
                    : emailAvailable === true 
                      ? 'border-green-300'
                      : 'border-gray-300'
              }`}
              placeholder="tu@email.com"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isCheckingEmail && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
              {!isCheckingEmail && emailAvailable === true && (
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              )}
              {!isCheckingEmail && emailAvailable === false && (
                <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
              )}
            </div>
          </div>
          {errors.email && (
            <p className="mt-0.5 text-xs text-red-600">{errors.email}</p>
          )}
          {!errors.email && emailAvailable === true && formData.email && (
            <p className="mt-1 text-sm text-green-600">✓ Email disponible</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Teléfono (Opcional)
          </label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => onInputChange('phone', formatPhoneInput(e.target.value))}
              className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="+51987654321"
              maxLength={20}
            />
          </div>
          {errors.phone && (
            <p className="mt-0.5 text-xs text-red-600">{errors.phone}</p>
          )}
        </div>
      </div>
    </div>
  );
});

const RegisterNavigation = React.memo(function RegisterNavigation({
  currentStep,
  isLoading,
  onBack,
  onNext,
  onSubmit
}: {
  currentStep: number;
  isLoading: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="bg-white border-t px-4 py-2.5 flex-shrink-0">
      <div className="flex gap-3">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            className="flex-1"
            disabled={isLoading}
          >
            <ChevronLeftIcon className="w-5 h-5 mr-1" />
            Atrás
          </Button>
        )}

        {currentStep === 5 ? (
          <Button
            type="button"
            variant="primary"
            onClick={onSubmit}
            loading={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={onNext}
            className="flex-1"
          >
            Siguiente
            <ChevronRightIcon className="w-5 h-5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
});

const RegisterMobile: React.FC<RegisterMobileProps> = ({ onSubmit, isLoading, generalError, hideHeader = false }) => {
  const router = useRouter();
  const { type } = router.query;
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  // Determinar el rol basado en el parámetro type (soporta tanto mayúsculas como minúsculas)
  const getInitialRole = (): 'USER' | 'LANDLORD' | 'AGENT' => {
    if (!type) return 'USER';
    const typeStr = String(type).toLowerCase();
    if (typeStr === 'landlord') return 'LANDLORD';
    if (typeStr === 'agent') return 'AGENT';
    return 'USER';
  };
  
  const [formData, setFormData] = useState<FormData>({
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
    agencyRuc: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  const checkEmail = async (email: string) => {
    try {
      setIsCheckingEmail(true);
      const exists = await checkEmailExists(email);
      setEmailAvailable(!exists);
      
      if (exists) {
        setErrors(prev => ({
          ...prev,
          email: 'Este email ya está registrado. Intenta iniciar sesión.'
        }));
      } else if (errors.email === 'Este email ya está registrado. Intenta iniciar sesión.') {
        // Limpiar el error si el email está disponible
        setErrors(prev => {
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true;
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    
    if (strength <= 35) {
      return { strength, label: 'Débil', color: 'bg-red-500' };
    } else if (strength <= 65) {
      return { strength, label: 'Media', color: 'bg-yellow-500' };
    } else {
      return { strength, label: 'Fuerte', color: 'bg-green-500' };
    }
  };

  const passwordStrength = useMemo(
    () => (currentStep === 3 ? getPasswordStrength(formData.password) : { strength: 0, label: '', color: '' }),
    [currentStep, formData.password]
  );

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 1: // Tipo de usuario
        // No validation needed, role is always set
        break;

      case 2: // Datos personales
        if (!formData.firstName.trim()) {
          newErrors.firstName = 'El nombre es obligatorio';
        } else if (formData.firstName.trim().length < 1) {
          newErrors.firstName = 'El nombre debe tener al menos 1 carácter';
        }

        if (!formData.lastName.trim()) {
          newErrors.lastName = 'El apellido es obligatorio';
        } else if (formData.lastName.trim().length < 1) {
          newErrors.lastName = 'El apellido debe tener al menos 1 carácter';
        }

        if (!formData.email.trim()) {
          newErrors.email = 'El email es obligatorio';
        } else if (!validateEmail(formData.email)) {
          newErrors.email = 'El formato del email no es válido';
        }

        if (formData.phone && !validatePhone(formData.phone)) {
          newErrors.phone = 'El teléfono debe estar en formato internacional (+51987654321)';
        }

        // Validaciones para inmobiliaria
        if (formData.role === 'AGENT') {
          if (!formData.agencyName?.trim()) {
            newErrors.agencyName = 'El nombre de la inmobiliaria es obligatorio';
          } else if (formData.agencyName.trim().length < 3) {
            newErrors.agencyName = 'El nombre debe tener al menos 3 caracteres';
          }

          if (!formData.agencyRuc?.trim()) {
            newErrors.agencyRuc = 'El RUC es obligatorio para inmobiliarias';
          } else {
            const validation = validateDocument('RUC', formData.agencyRuc);
            if (!validation.valid) {
              newErrors.agencyRuc = validation.error || 'El RUC no es válido';
            }
          }
        }
        break;

      case 3: // Contraseña
        if (!formData.password) {
          newErrors.password = 'La contraseña es obligatoria';
        } else if (formData.password.length < 8) {
          newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        } else if (!/(?=.*[a-z])/.test(formData.password)) {
          newErrors.password = 'Debe contener al menos una letra minúscula';
        } else if (!/(?=.*[A-Z])/.test(formData.password)) {
          newErrors.password = 'Debe contener al menos una letra mayúscula';
        } else if (!/(?=.*\d)/.test(formData.password)) {
          newErrors.password = 'Debe contener al menos un número';
        }

        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Debes confirmar tu contraseña';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }
        break;

      case 4: // DNI (solo para USER y LANDLORD)
        if (formData.role === 'LANDLORD') {
          if (!formData.nationalId || !formData.nationalId.trim()) {
            newErrors.nationalId = 'El número de documento es obligatorio para propietarios';
          } else {
            const validation = validateDocument(formData.nationalIdType, formData.nationalId);
            if (!validation.valid) {
              newErrors.nationalId = validation.error || 'El documento no es válido';
            }
          }
        } else if (formData.role === 'USER') {
          if (formData.nationalId && formData.nationalId.trim()) {
            const validation = validateDocument(formData.nationalIdType, formData.nationalId);
            if (!validation.valid) {
              newErrors.nationalId = validation.error || 'El documento no es válido';
            }
          }
        }
        break;

      case 5: // Foto y términos
        if (!formData.acceptTerms) {
          newErrors.acceptTerms = 'Debes aceptar los términos y condiciones';
        }
        if (!formData.acceptPrivacy) {
          newErrors.acceptPrivacy = 'Debes aceptar la política de privacidad';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Si es paso 1 y el usuario es AGENT, saltar el paso 4 (DNI)
      if (currentStep === 3 && formData.role === 'AGENT') {
        setCurrentStep(5);
      } else {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      }
    }
  };

  const handleBack = () => {
    // Si estamos en paso 5 y el usuario es AGENT, volver al paso 3
    if (currentStep === 5 && formData.role === 'AGENT') {
      setCurrentStep(3);
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
  };

  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean) => {
    let processedValue = value;
    
    if (field === 'nationalId' && typeof value === 'string') {
      const maxLength = getDocumentMaxLength(formData.nationalIdType);
      processedValue = formatDocument(formData.normalIdType, value).substring(0, maxLength);
    }
    
    if (field === 'agencyRuc' && typeof value === 'string') {
      processedValue = value.replace(/\D/g, '').substring(0, 11);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Limpiar error en el mismo setState para evitar doble render
    setErrors(prev => {
      if (prev[field]) {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  }, [formData.nationalIdType]);

  const handleEmailBlur = () => {
    if (formData.email && validateEmail(formData.email)) {
      checkEmail(formData.email);
    } else {
      setEmailAvailable(null);
    }
  };

  const handleFileChange = (file: File | null) => {
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          profilePicture: 'Solo se permiten archivos JPG, PNG o WebP'
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          profilePicture: 'La imagen no puede exceder 5MB'
        }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));

      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.profilePicture;
        return newErrors;
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      profilePicture: null
    }));
    setImagePreview(null);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.profilePicture;
      return newErrors;
    });
  };

  const handleSubmit = async () => {
    if (validateStep(5)) {
      await onSubmit(formData);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">
              ¿Qué tipo de usuario eres?
            </h2>
            <p className="text-xs text-gray-500 mb-2">
              Selecciona el tipo de cuenta que mejor se adapte a tus necesidades
            </p>

            <div className="space-y-1.5">
              {[
                { 
                  value: 'USER', 
                  label: 'Usuario', 
                  icon: UserIcon,
                  desc: 'Buscar propiedades y contactar propietarios'
                },
                { 
                  value: 'LANDLORD', 
                  label: 'Propietario', 
                  icon: IdentificationIcon,
                  desc: 'Publicar y gestionar tus propiedades'
                },
                { 
                  value: 'AGENT', 
                  label: 'Inmobiliaria', 
                  icon: BuildingOfficeIcon,
                  desc: 'Gestionar múltiples propiedades como agente'
                }
              ].map((option) => {
                const Icon = option.icon;
                const isSelected = formData.role === option.value;
                return (
                  <label
                    key={option.value}
                    className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all block ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={isSelected}
                      onChange={(e) => handleInputChange('role', e.target.value as any)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-blue-500' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold text-xs ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {option.label}
                        </div>
                        <div className={`text-xs leading-tight ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                          {option.desc}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircleIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <Step2PersonalData
            formData={formData}
            errors={errors}
            isCheckingEmail={isCheckingEmail}
            emailAvailable={emailAvailable}
            onInputChange={handleInputChange}
            onEmailBlur={handleEmailBlur}
          />
        );

      case 3:
        return (
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-gray-900">
              Crea tu Contraseña
            </h2>
            <p className="text-xs text-gray-600 mb-2">
              Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número
            </p>

            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 py-2 text-sm pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.password}</p>
                )}
                {formData.password && !errors.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Fortaleza:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.strength <= 35 ? 'text-red-600' :
                        passwordStrength.strength <= 65 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-2 text-sm pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Repite tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-gray-900">
              Documento de Identidad
            </h2>
            <p className="text-xs text-gray-600 mb-2">
              {formData.role === 'LANDLORD' 
                ? 'Como propietario, necesitamos verificar tu identidad para publicar propiedades'
                : 'Este campo es opcional, pero recomendado para generar más confianza'}
            </p>

            {formData.role === 'LANDLORD' && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg mb-2">
                <div className="flex items-start gap-2">
                  <IdentificationIcon className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900">
                    <strong>Verificación requerida:</strong> Tu documento es obligatorio para garantizar la seguridad de la plataforma.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tipo de Documento {formData.role === 'LANDLORD' && '*'}
                </label>
                <select
                  value={formData.nationalIdType}
                  onChange={(e) => handleInputChange('nationalIdType', e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DNI">DNI</option>
                  <option value="CE">Carné de Extranjería</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="RUC">RUC</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Número de Documento {formData.role === 'LANDLORD' ? '*' : '(Opcional)'}
                </label>
                <div className="relative">
                  <IdentificationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => handleInputChange('nationalId', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.nationalId ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={
                      formData.nationalIdType === 'RUC' ? '20123456789' :
                      formData.nationalIdType === 'DNI' ? '12345678' :
                      formData.nationalIdType === 'CE' ? '123456789' :
                      'Número de pasaporte'
                    }
                    maxLength={getDocumentMaxLength(formData.nationalIdType)}
                  />
                </div>
                {errors.nationalId && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.nationalId}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-gray-900">
              Foto de Perfil
            </h2>
            <p className="text-xs text-gray-600 mb-2">
              Agrega una foto para generar más confianza (opcional)
            </p>

            <div 
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {imagePreview ? (
                <div className="space-y-2">
                  <div className="relative w-24 h-24 mx-auto">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-full border-3 border-white shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => document.getElementById('file-upload-mobile')?.click()}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    Cambiar foto
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <CloudArrowUpIcon className="w-10 h-10 text-gray-400 mx-auto" />
                  <div>
                    <button
                      type="button"
                      onClick={() => document.getElementById('file-upload-mobile')?.click()}
                      className="text-blue-600 hover:text-blue-800 font-medium underline"
                    >
                      Seleccionar archivo
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG, WebP hasta 5MB
                    </p>
                  </div>
                </div>
              )}
              
              <input
                id="file-upload-mobile"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileChange(file);
                  }
                }}
                className="hidden"
              />
            </div>

            {errors.profilePicture && (
              <p className="text-xs text-red-600">{errors.profilePicture}</p>
            )}

            <div className="mt-4 space-y-2">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="acceptTerms" className="text-xs text-gray-700">
                  Acepto los{' '}
                  <a href="/terms" className="text-blue-600 underline">
                    términos y condiciones
                  </a>
                  {' '}*
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-xs text-red-600 ml-6">{errors.acceptTerms}</p>
              )}

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="acceptPrivacy"
                  checked={formData.acceptPrivacy}
                  onChange={(e) => handleInputChange('acceptPrivacy', e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="acceptPrivacy" className="text-xs text-gray-700">
                  Acepto la{' '}
                  <a href="/privacy" className="text-blue-600 underline">
                    política de privacidad
                  </a>
                  {' '}*
                </label>
              </div>
              {errors.acceptPrivacy && (
                <p className="text-xs text-red-600 ml-6">{errors.acceptPrivacy}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Calcular el paso actual visualmente (para AGENT, omitimos el paso 4)
  const visualStep = formData.role === 'AGENT' && currentStep === 5 ? 4 : currentStep;
  const visualTotalSteps = formData.role === 'AGENT' ? 4 : 5;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {!hideHeader && <Header />}
      
      {/* Main Content - Adjust for Header height (96px) only if header is shown */}
      <div 
        className="flex flex-col" 
        style={{ 
          minHeight: hideHeader ? '100%' : 'calc(100vh - 96px)', 
          maxHeight: hideHeader ? '100%' : 'calc(100vh - 96px)',
          height: hideHeader ? '100%' : 'calc(100vh - 96px)'
        }}
      >
        <RegisterProgress visualStep={visualStep} visualTotalSteps={visualTotalSteps} />

        {/* Error general */}
        {generalError && (
          <div className="px-4 pt-2 pb-2 flex-shrink-0">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <ExclamationCircleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-red-700 text-xs">{generalError}</span>
            </div>
          </div>
        )}

        {/* Content - This will take remaining space and scroll if needed */}
        <div className="flex-1 overflow-y-auto px-4 py-1.5 min-h-0">
          {renderStepContent()}
        </div>

        <RegisterNavigation
          currentStep={currentStep}
          isLoading={isLoading}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default RegisterMobile;




