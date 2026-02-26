import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Header } from '../components/common/Header';
import RegisterMobile from '../components/RegisterMobile';
import Button from '../components/ui/Button';
import { useAuth } from '../lib/hooks/useAuth';
import { validateDocument, formatDocument, getDocumentMaxLength, getRUCType } from '../lib/utils/documentValidation';
import { checkEmailExists } from '../lib/api/auth';
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
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

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
  // Campos adicionales para inmobiliaria
  agencyName?: string;
  agencyRuc?: string;
}

interface FormErrors {
  [key: string]: string;
}

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { type } = router.query; // Obtener el tipo desde la URL
  const { register: apiRegister } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    nationalId: '',
    nationalIdType: 'DNI',
    role: 'USER',
    acceptTerms: false,
    acceptPrivacy: false,
    profilePicture: null,
    agencyName: '',
    agencyRuc: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Preseleccionar el rol basado en el query parameter
  React.useEffect(() => {
    if (type === 'landlord') {
      setFormData(prev => ({ ...prev, role: 'LANDLORD' }));
    } else if (type === 'agent') {
      setFormData(prev => ({ ...prev, role: 'AGENT' }));
    }
  }, [type]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  // Verificar disponibilidad del email en tiempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email && validateEmail(formData.email)) {
        checkEmail(formData.email);
      } else {
        setEmailAvailable(null);
        setIsCheckingEmail(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const checkEmail = async (email: string) => {
    setIsCheckingEmail(true);
    try {
      const exists = await checkEmailExists(email);
      setEmailAvailable(!exists);
      
      if (exists) {
        setErrors(prev => ({ 
          ...prev, 
          email: 'Este email ya está registrado. Intenta iniciar sesión o usa otro email.' 
        }));
      } else if (errors.email === 'Este email ya está registrado. Intenta iniciar sesión o usa otro email.') {
        // Limpiar el error si el email está disponible
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailAvailable(null);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    } else if (formData.firstName.trim().length < 1) {
      newErrors.firstName = 'El nombre debe tener al menos 1 carácter';
    } else if (formData.firstName.trim().length > 100) {
      newErrors.firstName = 'El nombre no puede exceder 100 caracteres';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    } else if (formData.lastName.trim().length < 1) {
      newErrors.lastName = 'El apellido debe tener al menos 1 carácter';
    } else if (formData.lastName.trim().length > 100) {
      newErrors.lastName = 'El apellido no puede exceder 100 caracteres';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'La contraseña debe contener al menos una letra minúscula';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'La contraseña debe contener al menos una letra mayúscula';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'La contraseña debe contener al menos un número';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Debes confirmar tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Optional fields validation
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'El teléfono debe estar en formato internacional (+51987654321)';
    }

    // Validación de documentos de identidad para USER y LANDLORD
    if (formData.role !== 'AGENT') {
      // Para LANDLORD, el documento es obligatorio
      if (formData.role === 'LANDLORD') {
        if (!formData.nationalId || !formData.nationalId.trim()) {
          newErrors.nationalId = 'El número de documento es obligatorio para propietarios';
        } else {
          // Validar documento usando las funciones de validación
          const validation = validateDocument(formData.nationalIdType, formData.nationalId);
          if (!validation.valid) {
            newErrors.nationalId = validation.error || 'El documento no es válido';
          }
        }
      } else {
        // Para USER, es opcional pero si lo ingresa, debe ser válido
        if (formData.nationalId && formData.nationalId.trim()) {
          const validation = validateDocument(formData.nationalIdType, formData.nationalId);
          if (!validation.valid) {
            newErrors.nationalId = validation.error || 'El documento no es válido';
          }
        }
      }
    }

    // Validaciones específicas para inmobiliaria
    if (formData.role === 'AGENT') {
      if (!formData.agencyName?.trim()) {
        newErrors.agencyName = 'El nombre de la inmobiliaria es obligatorio';
      } else if (formData.agencyName.trim().length < 3) {
        newErrors.agencyName = 'El nombre debe tener al menos 3 caracteres';
      }

      if (!formData.agencyRuc?.trim()) {
        newErrors.agencyRuc = 'El RUC es obligatorio para inmobiliarias';
      } else {
        // Validar RUC usando la función de validación
        const validation = validateDocument('RUC', formData.agencyRuc);
        if (!validation.valid) {
          newErrors.agencyRuc = validation.error || 'El RUC no es válido';
        }
      }
    }

    // Terms and conditions
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Debes aceptar los términos y condiciones';
    }

    if (!formData.acceptPrivacy) {
      newErrors.acceptPrivacy = 'Debes aceptar la política de privacidad';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (file: File | null) => {
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          profilePicture: 'Solo se permiten archivos JPG, PNG o WebP'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          profilePicture: 'La imagen no puede exceder 5MB'
        }));
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));

      // Clear any previous errors
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

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    // Formatear el documento según el tipo antes de guardarlo
    let processedValue = value;
    
    if (field === 'nationalId' && typeof value === 'string') {
      // Limitar la longitud según el tipo de documento
      const maxLength = getDocumentMaxLength(formData.nationalIdType);
      processedValue = formatDocument(formData.nationalIdType, value).substring(0, maxLength);
    }
    
    if (field === 'agencyRuc' && typeof value === 'string') {
      // Para RUC solo permitir números y máximo 11 dígitos
      processedValue = value.replace(/\D/g, '').substring(0, 11);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Validación en tiempo real para documentos
    if (field === 'nationalId' && typeof value === 'string' && value.trim()) {
      const validation = validateDocument(formData.nationalIdType, processedValue as string);
      if (!validation.valid) {
        setErrors(prev => ({
          ...prev,
          nationalId: validation.error || 'Documento inválido'
        }));
      } else {
        // Limpiar error si es válido
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.nationalId;
          return newErrors;
        });
      }
    } else if (field === 'agencyRuc' && typeof value === 'string' && value.trim()) {
      const validation = validateDocument('RUC', processedValue as string);
      if (!validation.valid) {
        setErrors(prev => ({
          ...prev,
          agencyRuc: validation.error || 'RUC inválido'
        }));
      } else {
        // Limpiar error si es válido
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.agencyRuc;
          return newErrors;
        });
      }
    } else {
      // Clear error for other fields when user starts typing
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: ''
        }));
      }
    }
  };

  const formatPhoneInput = (value: string): string => {
    // Remove all non-digits except the leading +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with + if user is typing numbers
    if (cleaned && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 10;
    
    // Character variety checks
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

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await handleRegistration(formData);
  };

  const handleRegistration = async (data: FormData) => {
    setIsLoading(true);

    try {
      // Use real API registration
      const registrationData: any = {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        phone: data.phone || undefined,
        role: data.role.toLowerCase() as 'user' | 'landlord' | 'agent'
      };

      // Para usuarios y propietarios, enviar documento de identidad
      if (data.role !== 'AGENT') {
        registrationData.national_id = data.nationalId || undefined;
        registrationData.national_id_type = data.nationalIdType;
      } else {
        // Para inmobiliarias, enviar información de la agencia
        registrationData.agency_name = data.agencyName?.trim();
        registrationData.agency_ruc = data.agencyRuc?.trim();
        // El RUC de la agencia se usa como identificador
        registrationData.national_id = data.agencyRuc?.trim();
        registrationData.national_id_type = 'RUC';
      }

      console.log('📝 Enviando datos de registro:', { ...registrationData, password: '***' });

      // Call the real registration API (with Firebase)
      await apiRegister(registrationData);

      // Si hay una foto de perfil, guardarla temporalmente para subirla después del login
      if (data.profilePicture) {
        try {
          console.log('📸 Guardando foto de perfil para subir después del login...');
          
          // Convertir la imagen a base64 para guardarla en sessionStorage
          const reader = new FileReader();
          reader.onload = () => {
            const base64Image = reader.result as string;
            sessionStorage.setItem('pending_avatar_upload', base64Image);
            sessionStorage.setItem('pending_avatar_filename', data.profilePicture!.name);
            console.log('✅ Foto guardada temporalmente');
          };
          reader.readAsDataURL(data.profilePicture);
        } catch (uploadError) {
          console.error('⚠️ Error al guardar foto de perfil:', uploadError);
        }
      }

      // Show success
      setSuccess(true);
      
      // Redirect after success based on role
      setTimeout(() => {
        if (data.role === 'AGENT' || data.role === 'LANDLORD') {
          // Si es agente o propietario, llevar a la página de planes con el tipo de usuario
          router.push(`/plans?newUser=true&userType=${data.role}`);
        } else {
          // Para usuarios normales, llevar al login
          router.push('/login?registered=true');
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Registration error:', error);
      
      // Handle specific error messages
      let errorMessage = 'Error al crear la cuenta. Por favor, inténtalo de nuevo.';
      
      if (error instanceof Error) {
        // Primero verificar si el mensaje ya es descriptivo (viene de useAuth)
        if (error.message.includes('El email ya está registrado') || 
            error.message.includes('email-already-in-use')) {
          errorMessage = 'El email ya está registrado. Intenta iniciar sesión o usa otro email.';
        } else if (error.message.includes('409') || error.message.includes('already')) {
          errorMessage = 'El email ya está registrado. Intenta con otro email.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Los datos proporcionados no son válidos. Revisa la información.';
        } else if (error.message.includes('Firebase UID already registered')) {
          errorMessage = 'Esta cuenta ya está registrada. Intenta iniciar sesión.';
        } else if (error.message.length > 0 && error.message.length < 200) {
          // Si el mensaje es razonable, mostrarlo directamente
          errorMessage = error.message;
        }
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Registro Exitoso - RENTA fácil</title>
        </Head>
        
        <div className="min-h-screen bg-gray-50">
          {!isMobile && <Header disableRealtimeWidgets />}
          
          <div className={`flex items-center justify-center px-4 ${
            isMobile ? 'min-h-screen' : 'min-h-[calc(100vh-96px)]'
          }`}>
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Registro Exitoso!
              </h2>
              
              <p className="text-gray-600 mb-6">
                {formData.role === 'AGENT' 
                  ? 'Tu cuenta de inmobiliaria ha sido creada. Te mostraremos los planes disponibles en un momento.'
                  : formData.role === 'LANDLORD'
                  ? 'Tu cuenta de propietario ha sido creada. Te mostraremos los planes disponibles en un momento.'
                  : 'Tu cuenta ha sido creada correctamente. Serás redirigido al inicio de sesión en unos momentos.'
                }
              </p>
              
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Both mobile and desktop now use the wizard flow
  return (
    <>
      <Head>
        <title>Crear Cuenta - RENTA fácil</title>
        <meta name="description" content="Crea tu cuenta en RENTA fácil y encuentra tu hogar ideal" />
      </Head>
      
      {isMobile ? (
        /* Mobile view - Full width wizard */
        <RegisterMobile 
          onSubmit={handleRegistration}
          isLoading={isLoading}
          generalError={errors.general}
        />
      ) : (
        /* Desktop view - Header + 50/50 split with banner */
        <>
          <Header disableRealtimeWidgets />
          <div className="flex" style={{ height: 'calc(100vh - 96px)' }}>
          {/* Left side - Registration Form (50%) */}
          <div className="w-1/2 bg-white overflow-hidden">
            <RegisterMobile 
              onSubmit={handleRegistration}
              isLoading={isLoading}
              generalError={errors.general}
              hideHeader={true}
            />
          </div>
          
          {/* Right side - Banner (50%) */}
          <div 
            className="w-1/2 relative overflow-hidden sticky top-0 h-screen flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fcd34d 100%)'
            }}
          >
            {/* Pattern overlay */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px'
              }}
            />
            
            <div className="relative z-10 max-w-xl px-8 py-4">
              {/* Logo/Brand */}
              <div className="mb-6">
                <div className="inline-block bg-white/25 backdrop-blur-md px-5 py-2 rounded-2xl mb-4 shadow-lg">
                  <span className="text-white text-xl font-bold drop-shadow-md">RENTA fácil</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-3 leading-tight drop-shadow-lg">
                  Tu hogar ideal<br />te está esperando
                </h1>
                <p className="text-lg text-white font-medium drop-shadow-md">
                  Únete a miles de personas que ya encontraron su lugar perfecto
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">

                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/25 hover:bg-white/25 transition-all shadow-lg">
                  <div className="bg-white p-2.5 rounded-lg shadow-lg">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base drop-shadow-md">100% Seguro</h3>
                    <p className="text-white/95 text-xs drop-shadow-sm">Propietarios y propiedades verificadas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/25 hover:bg-white/25 transition-all shadow-lg">
                  <div className="bg-white p-2.5 rounded-lg shadow-lg">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base drop-shadow-md">Chat en vivo</h3>
                    <p className="text-white/95 text-xs drop-shadow-sm">Contacta directamente con propietarios</p>
                  </div>
                </div>
              </div>

              {/* CTA Box */}
              <div className="bg-white/25 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/30">
                <div className="flex items-center gap-2.5 mb-2">
                  <svg className="w-7 h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h4 className="text-white font-bold text-lg drop-shadow-md">¿Eres propietario?</h4>
                </div>
                <p className="text-white text-base font-semibold leading-snug drop-shadow-md">
                  Publica GRATIS y llega a miles de inquilinos en todo Perú
                </p>
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </>
  );
};

export default RegisterPage;