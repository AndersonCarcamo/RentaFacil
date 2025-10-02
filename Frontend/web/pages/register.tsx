import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Header } from '../components/Header';
import Button from '../components/ui/Button';
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
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  nationalIdType: string;
  role: 'USER' | 'LANDLORD';
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  profilePicture?: File | null;
}

interface FormErrors {
  [key: string]: string;
}

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    nationalId: '',
    nationalIdType: 'DNI',
    role: 'USER',
    acceptTerms: false,
    acceptPrivacy: false,
    profilePicture: null
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
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

    // Optional fields validation
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'El teléfono debe estar en formato internacional (+51987654321)';
    }

    if (formData.nationalId && formData.nationalId.length > 20) {
      newErrors.nationalId = 'El documento no puede exceder 20 caracteres';
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock registration logic
      const registrationData = {
        email: formData.email.toLowerCase().trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone || null,
        national_id: formData.nationalId || null,
        national_id_type: formData.nationalIdType,
        role: formData.role
      };

      console.log('Registration data:', registrationData);

      // Simulate success
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        router.push('/auth/login?registered=true');
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Error al crear la cuenta. Por favor, inténtalo de nuevo.' });
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
          <Header />
          
          <div className="flex items-center justify-center min-h-[calc(100vh-96px)] px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Registro Exitoso!
              </h2>
              
              <p className="text-gray-600 mb-6">
                Tu cuenta ha sido creada correctamente. Serás redirigido al inicio de sesión en unos momentos.
              </p>
              
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Crear Cuenta - RENTA fácil</title>
        <meta name="description" content="Crea tu cuenta en RENTA fácil y encuentra tu hogar ideal" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div 
          className="flex items-center justify-center min-h-[calc(100vh-96px)] px-4 py-8"
          style={{
            backgroundColor: '#145879',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cg id='house'%3E%3Cpath d='M6 20L12 14L18 20V26H6V20Z' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-opacity='0.2'/%3E%3Crect x='8.5' y='22' width='2' height='3' fill='none' stroke='%23d1d5db' stroke-width='1.2' stroke-opacity='0.2'/%3E%3Crect x='13' y='18' width='2' height='2' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.2'/%3E%3C/g%3E%3Cg id='building'%3E%3Crect x='2' y='12' width='10' height='14' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-opacity='0.2'/%3E%3Crect x='4' y='15' width='2' height='2' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='7' y='15' width='2' height='2' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='4' y='18' width='2' height='2' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='7' y='18' width='2' height='2' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='4' y='21' width='2' height='2' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='7' y='21' width='2' height='2' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.2'/%3E%3C/g%3E%3Cg id='key'%3E%3Ccircle cx='4' cy='18' r='2' fill='none' stroke='%23d1d5db' stroke-width='1.4' stroke-opacity='0.2'/%3E%3Cpath d='M6 18H12M9.5 16V20M10.5 16.5V19.5' stroke='%23d1d5db' stroke-width='1.2' stroke-opacity='0.2' fill='none'/%3E%3C/g%3E%3Cg id='apartment'%3E%3Crect x='1' y='10' width='14' height='16' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-opacity='0.2'/%3E%3Crect x='3' y='13' width='2.5' height='2.5' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='7' y='13' width='2.5' height='2.5' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='11' y='13' width='2.5' height='2.5' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='3' y='17' width='2.5' height='2.5' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.4'/%3E%3Crect x='7' y='17' width='2.5' height='2.5' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='11' y='17' width='2.5' height='2.5' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='3' y='21' width='2.5' height='2.5' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.4'/%3E%3Crect x='7' y='21' width='2.5' height='2.5' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.4'/%3E%3Crect x='11' y='21' width='2.5' height='2.5' fill='none' stroke='%23d1d5db' stroke-width='1' stroke-opacity='0.4'/%3E%3C/g%3E%3Cg id='door'%3E%3Crect x='2' y='14' width='5' height='12' rx='2.5' fill='none' stroke='%23d1d5db' stroke-width='1.4' stroke-opacity='0.6'/%3E%3Ccircle cx='5.5' cy='20' r='0.4' fill='%23d1d5db' fill-opacity='0.5'/%3E%3C/g%3E%3C/defs%3E%3Cuse href='%23house' x='8' y='8'/%3E%3Cuse href='%23building' x='40' y='20'/%3E%3Cuse href='%23key' x='75' y='6' transform='rotate(45 79 24)'/%3E%3Cuse href='%23apartment' x='20' y='50'/%3E%3Cuse href='%23door' x='80' y='38' transform='rotate(-15 82.5 50)'/%3E%3Cuse href='%23key' x='12' y='80' transform='rotate(-30 16 98)'/%3E%3Cuse href='%23building' x='90' y='70'/%3E%3Cuse href='%23house' x='60' y='80'/%3E%3Cuse href='%23key' x='50' y='25' transform='rotate(60 54 43)'/%3E%3Cuse href='%23door' x='4' y='40'/%3E%3Cuse href='%23apartment' x='85' y='5'/%3E%3Cuse href='%23building' x='65' y='12'/%3E%3C/svg%3E")`,
            backgroundSize: '120px 120px'
          }}
        >
          <div className="max-w-6xl w-full bg-white rounded-xl shadow-lg p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulario - 2 columnas */}
              <div className="lg:col-span-2">
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Crear Cuenta
                  </h1>
                  <p className="text-gray-600">
                    Únete a RENTA fácil y encuentra tu hogar ideal
                  </p>
                </div>

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
                  </ul>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { value: 'USER', label: 'Usuario', desc: 'Buscar y contactar propietarios' },
                    { value: 'LANDLORD', label: 'Propietario', desc: 'Publicar y gestionar propiedades' }
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
                    Nombre *
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
                      placeholder="Tu nombre"
                      maxLength={100}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
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
                      placeholder="Tu apellido"
                      maxLength={100}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

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
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="tu@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
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

              {/* Documento de Identidad */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento
                  </label>
                  <select
                    value={formData.nationalIdType}
                    onChange={(e) => handleInputChange('nationalIdType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="DNI">DNI</option>
                    <option value="CE">Carné de Extranjería</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Documento (Opcional)
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
                      placeholder="12345678"
                      maxLength={20}
                    />
                  </div>
                  {errors.nationalId && (
                    <p className="mt-1 text-sm text-red-600">{errors.nationalId}</p>
                  )}
                </div>
              </div>

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

              {/* Submit Button */}
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
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-medium underline">
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </form>
              </div>

              {/* Foto de Perfil - 1 columna */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
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

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <PhotoIcon className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;