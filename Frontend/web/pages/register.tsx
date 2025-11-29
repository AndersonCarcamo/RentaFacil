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
          {!isMobile && <Header />}
          
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

  // Mobile view - Wizard
  if (isMobile) {
    return (
      <>
        <Head>
          <title>Crear Cuenta - RENTA fácil</title>
          <meta name="description" content="Crea tu cuenta en RENTA fácil y encuentra tu hogar ideal" />
        </Head>
        
        {/* RegisterMobile ya incluye el Header */}
        <RegisterMobile 
          onSubmit={handleRegistration}
          isLoading={isLoading}
          generalError={errors.general}
        />
      </>
    );
  }

  // Desktop view - Full form
  return (
    <>
      <Head>
        <title>Crear Cuenta - RENTA fácil</title>
        <meta name="description" content="Crea tu cuenta en RENTA fácil y encuentra tu hogar ideal" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div 
          className="min-h-[calc(100vh-96px)] px-4 py-8"
          style={{
            backgroundColor: '#145879',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cg id='house'%3E%3Cpath d='M6 20L12 14L18 20V26H6V20Z' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.06'/%3E%3Crect x='8.5' y='22' width='2' height='3' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.04'/%3E%3Crect x='13' y='18' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.04'/%3E%3C/g%3E%3Cg id='building'%3E%3Crect x='2' y='12' width='10' height='14' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.06'/%3E%3Crect x='4' y='15' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.04'/%3E%3Crect x='7' y='15' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.04'/%3E%3Crect x='4' y='18' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.04'/%3E%3Crect x='7' y='18' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.04'/%3E%3Crect x='4' y='21' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.04'/%3E%3Crect x='7' y='21' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.04'/%3E%3C/g%3E%3Cg id='key'%3E%3Ccircle cx='4' cy='18' r='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.06'/%3E%3Cpath d='M6 18H12M9.5 16V20M10.5 16.5V19.5' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.04' fill='none'/%3E%3C/g%3E%3Cg id='apartment'%3E%3Crect x='1' y='10' width='14' height='16' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.05'/%3E%3Crect x='3' y='13' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.03'/%3E%3Crect x='7' y='13' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.03'/%3E%3Crect x='11' y='13' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.03'/%3E%3Crect x='3' y='17' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.03'/%3E%3Crect x='7' y='17' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.03'/%3E%3Crect x='11' y='17' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.03'/%3E%3Crect x='3' y='21' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.03'/%3E%3Crect x='7' y='21' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.03'/%3E%3Crect x='11' y='21' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='0.8' stroke-opacity='0.03'/%3E%3C/g%3E%3Cg id='door'%3E%3Crect x='2' y='14' width='5' height='12' rx='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.05'/%3E%3Ccircle cx='5.5' cy='20' r='0.4' fill='%23ffffff' fill-opacity='0.04'/%3E%3C/g%3E%3C/defs%3E%3Cuse href='%23house' x='8' y='8'/%3E%3Cuse href='%23building' x='40' y='20'/%3E%3Cuse href='%23key' x='75' y='6' transform='rotate(45 79 24)'/%3E%3Cuse href='%23apartment' x='20' y='50'/%3E%3Cuse href='%23door' x='80' y='38' transform='rotate(-15 82.5 50)'/%3E%3Cuse href='%23key' x='12' y='80' transform='rotate(-30 16 98)'/%3E%3Cuse href='%23building' x='90' y='70'/%3E%3Cuse href='%23house' x='60' y='80'/%3E%3Cuse href='%23key' x='50' y='25' transform='rotate(60 54 43)'/%3E%3Cuse href='%23door' x='4' y='40'/%3E%3Cuse href='%23apartment' x='85' y='5'/%3E%3Cuse href='%23building' x='65' y='12'/%3E%3C/svg%3E")`,
            backgroundSize: '120px 120px'
          }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="bg-white px-8 py-6 border-b-2 border-gray-100">
                <h1 className="text-3xl font-bold mb-2 text-gray-900">
                  Crear Cuenta
                </h1>
                <p className="text-gray-600">
                  Únete a RENTA fácil y encuentra tu hogar ideal
                </p>
              </div>

              <div className="p-8">
            {/* Error general */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-red-700 text-sm">{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Usuario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ¿Qué tipo de usuario eres? *
                </label>
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">¿Cuál es la diferencia?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li><strong>Usuario:</strong> Buscar propiedades, contactar propietarios, guardar favoritos</li>
                    <li><strong>Propietario:</strong> Publicar propiedades, recibir consultas, gestionar alquileres</li>
                    <li><strong>Inmobiliaria:</strong> Gestionar múltiples propiedades, representar a propietarios</li>
                  </ul>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'USER', label: 'Usuario', desc: 'Buscar y contactar propietarios' },
                    { value: 'LANDLORD', label: 'Propietario', desc: 'Publicar y gestionar propiedades' },
                    { value: 'AGENT', label: 'Inmobiliaria', desc: 'Gestionar múltiples propiedades' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                        formData.role === option.value
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={formData.role === option.value}
                        onChange={(e) => handleInputChange('role', e.target.value as any)}
                        className="sr-only"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                  
                </div>
              </div>

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.role === 'AGENT' ? 'Nombre del Representante *' : 'Nombre *'}
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder={formData.role === 'AGENT' ? 'Nombre del representante' : 'Tu nombre'}
                      maxLength={100}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.role === 'AGENT' ? 'Apellido del Representante *' : 'Apellido *'}
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder={formData.role === 'AGENT' ? 'Apellido del representante' : 'Tu apellido'}
                      maxLength={100}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Campos específicos para Inmobiliaria */}
              {formData.role === 'AGENT' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Inmobiliaria *
                    </label>
                    <div className="relative">
                      <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.agencyName || ''}
                        onChange={(e) => handleInputChange('agencyName', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.agencyName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Nombre de tu inmobiliaria"
                        maxLength={200}
                      />
                    </div>
                    {errors.agencyName && (
                      <p className="mt-1 text-sm text-red-600">{errors.agencyName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUC de la Inmobiliaria *
                    </label>
                    <div className="relative">
                      <IdentificationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.agencyRuc || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                          handleInputChange('agencyRuc', value);
                        }}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.agencyRuc ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="12345678901"
                        maxLength={11}
                      />
                    </div>
                    {errors.agencyRuc && (
                      <p className="mt-1 text-sm text-red-600">{errors.agencyRuc}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      El RUC debe tener 11 dígitos
                    </p>
                  </div>
                </>
              )}

              {/* Email y Teléfono - Grid 2 columnas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
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
                    {/* Indicador de verificación */}
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
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                  {!errors.email && emailAvailable === true && (
                    <p className="mt-1 text-sm text-green-600">✓ Email disponible</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono (Opcional)
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', formatPhoneInput(e.target.value))}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="+51987654321"
                      maxLength={20}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Formato internacional: +[código país][número]
                  </p>
                </div>
              </div>

              {/* Contraseña y Confirmar - Grid 2 columnas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contraseña */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
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
                <p className="mt-1 text-xs text-gray-500">
                  Debe contener al menos 8 caracteres, una mayúscula, una minúscula y un número
                </p>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Repite tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

              {/* Documento de Identidad - Condicional según tipo de usuario */}
              {formData.role !== 'AGENT' ? (
                // DNI/Pasaporte/CE/RUC para Usuario y Propietario
                <>
                  {formData.role === 'LANDLORD' && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <IdentificationIcon className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-amber-900 font-medium mb-1">
                            Verificación de Identidad Requerida
                          </p>
                          <p className="text-sm text-amber-800">
                            Como propietario, necesitamos verificar tu identidad para publicar propiedades. Tu documento es obligatorio para garantizar la seguridad de la plataforma.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Documento {formData.role === 'LANDLORD' && '*'}
                    </label>
                    <select
                      value={formData.nationalIdType}
                      onChange={(e) => handleInputChange('nationalIdType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required={formData.role === 'LANDLORD'}
                    >
                      <option value="DNI">DNI</option>
                      <option value="CE">Carné de Extranjería</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="RUC">RUC</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Documento {formData.role === 'LANDLORD' ? '*' : '(Opcional)'}
                    </label>
                    <div className="relative">
                      <IdentificationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.nationalId}
                        onChange={(e) => handleInputChange('nationalId', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.nationalId ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder={
                          formData.nationalIdType === 'RUC' ? '20123456789 (11 dígitos)' :
                          formData.nationalIdType === 'DNI' ? '12345678 (8 dígitos)' :
                          formData.nationalIdType === 'CE' ? '123456789 (9 dígitos)' :
                          'Número de pasaporte'
                        }
                        maxLength={getDocumentMaxLength(formData.nationalIdType)}
                        required={formData.role === 'LANDLORD'}
                      />
                    </div>
                    {errors.nationalId && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <ExclamationCircleIcon className="w-4 h-4" />
                        {errors.nationalId}
                      </p>
                    )}
                    {!errors.nationalId && formData.nationalId && formData.nationalId.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.nationalIdType === 'RUC' && (
                          <>
                            {formData.nationalId.length}/11 dígitos
                            {formData.nationalId.length === 11 && getRUCType(formData.nationalId) && (
                              <span className="ml-2 text-blue-600 font-medium">
                                • {getRUCType(formData.nationalId)}
                              </span>
                            )}
                          </>
                        )}
                        {formData.nationalIdType === 'DNI' && `${formData.nationalId.length}/8 dígitos`}
                        {formData.nationalIdType === 'CE' && `${formData.nationalId.length}/9 dígitos`}
                        {formData.nationalIdType === 'Pasaporte' && `${formData.nationalId.length} caracteres`}
                      </p>
                    )}
                  </div>
                </div>
                </>
              ) : (
                // Nota informativa para Inmobiliarias
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-900 font-medium mb-1">
                        Registro como Inmobiliaria
                      </p>
                      <p className="text-sm text-blue-800">
                        Las inmobiliarias deben registrarse con el RUC de la empresa. Ya has ingresado el RUC en el campo específico arriba. Este RUC será tu identificador principal como inmobiliaria.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Términos y Condiciones */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                    Acepto los{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                      términos y condiciones
                    </Link>
                    {' '}*
                  </label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-red-600 ml-7">{errors.acceptTerms}</p>
                )}

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptPrivacy"
                    checked={formData.acceptPrivacy}
                    onChange={(e) => handleInputChange('acceptPrivacy', e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="acceptPrivacy" className="text-sm text-gray-700">
                    Acepto la{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                      política de privacidad
                    </Link>
                    {' '}*
                  </label>
                </div>
                {errors.acceptPrivacy && (
                  <p className="text-sm text-red-600 ml-7">{errors.acceptPrivacy}</p>
                )}
              </div>

              {/* Foto de Perfil (Opcional) */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Foto de Perfil (Opcional)
                </h3>
                
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="relative w-32 h-32 mx-auto">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">
                        ¡Perfecto! Tu foto se ve genial.
                      </p>
                      <button
                        type="button"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        Cambiar foto
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-gray-600 mb-2">
                          Arrastra tu foto aquí o{' '}
                          <button
                            type="button"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            className="text-blue-600 hover:text-blue-800 font-medium underline"
                          >
                            selecciona un archivo
                          </button>
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, WebP hasta 5MB
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <input
                    id="file-upload"
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
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    {errors.profilePicture}
                  </p>
                )}

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <PhotoIcon className="w-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1">¿Por qué una foto de perfil?</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Genera más confianza con propietarios</li>
                        <li>• Aumenta tus posibilidades de contacto</li>
                        <li>• Personaliza tu experiencia</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full"
              >
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>

              {/* Login Link */}
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium underline">
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </div>
            </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;