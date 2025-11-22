import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ProfileSidebar } from '../components/ProfileSidebar';
import { useAuth } from '../lib/hooks/useAuth';
import { getCurrentUser } from '../lib/api/auth';
import {
  fetchUserProfile,
  updateUserProfile,
  uploadAvatar,
  UserProfile,
  UpdateUserProfileRequest,
  getFullName,
} from '../lib/api/users';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  Bars3Icon,
  ChevronDownIcon,
  KeyIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

const ProfilePage = () => {
  const router = useRouter();
  const authContext = useAuth();
  const { user: authUser, loading: authLoading } = authContext;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<UpdateUserProfileRequest>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  // Función local para refrescar el usuario en el contexto
  const localRefreshUser = async () => {
    try {
      console.log('🔄 Local refresh user called');
      const currentUser = await getCurrentUser();
      console.log('✅ User data received:', {
        email: currentUser.email,
        profile_picture_url: currentUser.profile_picture_url
      });
      
      // Forzar recarga de la página para actualizar el Header
      console.log('🔄 Reloading page to update Header...');
      window.location.reload();
    } catch (error) {
      console.error('❌ Failed to refresh user:', error);
    }
  };

  // Helper para construir URL completa del avatar
  const getAvatarUrl = (avatarPath?: string | null): string | null => {
    if (!avatarPath) return null;
    
    // Si ya es una URL completa, devolverla tal cual
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }
    
    // Si es una ruta relativa, construir URL completa
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return `${API_BASE_URL}${avatarPath}`;
  };

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login?redirect=/profile');
      return;
    }

    if (authUser) {
      loadProfile();
    }
  }, [authUser, authLoading]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await fetchUserProfile();
      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateUserProfile(formData);
      setProfile(updated);
      setEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
      });
    }
    setEditing(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('La imagen es muy grande. Máximo 10MB');
      return;
    }

    try {
      setUploading(true);
      console.log('📤 Uploading avatar:', file.name, file.type, file.size);
      
      const response = await uploadAvatar(file);
      console.log('✅ Avatar uploaded successfully:', response);
      
      // Small delay to ensure backend has processed the file
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload profile to get updated avatar URL
      console.log('🔄 Reloading profile data...');
      await loadProfile();
      
      // Refresh user data in auth context for Header
      console.log('🔄 Refreshing auth context...');
      await localRefreshUser();
      console.log('✅ Auth context refreshed');
      
      toast.success('Foto de perfil actualizada correctamente');
    } catch (error: any) {
      console.error('❌ Error uploading avatar:', error);
      toast.error(error.message || 'Error al subir la foto');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      TENANT: 'Inquilino',
      LANDLORD: 'Propietario',
      AGENT: 'Agente',
      ADMIN: 'Administrador',
    };
    return roles[role] || role;
  };

  const handlePasswordReset = async () => {
    if (!profile?.email) {
      toast.error('No se pudo obtener el correo electrónico');
      return;
    }

    try {
      setSendingPasswordReset(true);
      await sendPasswordResetEmail(auth, profile.email);
      setPasswordResetSuccess(true);
      toast.success('Correo de restablecimiento enviado exitosamente');
      
      // Auto-close modal after 5 seconds
      setTimeout(() => {
        setShowPasswordResetModal(false);
        setPasswordResetSuccess(false);
      }, 5000);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      let errorMessage = 'Error al enviar el correo de restablecimiento';
      
      // Translate Firebase error codes to Spanish
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No se encontró un usuario con este correo';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Por favor intenta más tarde';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Error de conexión. Verifica tu internet';
      }
      
      toast.error(errorMessage);
    } finally {
      setSendingPasswordReset(false);
    }
  };

  const closePasswordResetModal = () => {
    setShowPasswordResetModal(false);
    setPasswordResetSuccess(false);
  };

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>Mi Perfil - RENTA fácil</title>
        </Head>
        <div className="min-h-screen bg-[#5AB0DB] relative">
          {/* Textura de fondo */}
          <div className="fixed inset-0 opacity-5 pointer-events-none z-0">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="profile-texture" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                  {/* Casa 1 */}
                  <path d="M 40 80 L 60 60 L 80 80 L 80 100 L 40 100 Z M 50 85 L 50 95 L 60 95 L 60 85 Z M 65 75 L 65 85 L 75 85 L 75 75 Z" 
                        fill="white" opacity="0.4"/>
                  
                  {/* Llave 1 */}
                  <circle cx="140" cy="50" r="8" fill="none" stroke="white" strokeWidth="2" opacity="0.4"/>
                  <rect x="140" y="50" width="20" height="3" fill="white" opacity="0.4"/>
                  <rect x="155" y="48" width="3" height="3" fill="white" opacity="0.4"/>
                  <rect x="150" y="48" width="3" height="3" fill="white" opacity="0.4"/>
                  
                  {/* Edificio 1 */}
                  <rect x="50" y="140" width="30" height="40" fill="white" opacity="0.3"/>
                  <rect x="55" y="145" width="5" height="5" fill="#5AB0DB" opacity="0.5"/>
                  <rect x="65" y="145" width="5" height="5" fill="#5AB0DB" opacity="0.5"/>
                  <rect x="55" y="155" width="5" height="5" fill="#5AB0DB" opacity="0.5"/>
                  <rect x="65" y="155" width="5" height="5" fill="#5AB0DB" opacity="0.5"/>
                  <rect x="55" y="165" width="5" height="5" fill="#5AB0DB" opacity="0.5"/>
                  <rect x="65" y="165" width="5" height="5" fill="#5AB0DB" opacity="0.5"/>
                  
                  {/* Casa 2 */}
                  <path d="M 160 130 L 190 110 L 190 160 L 160 160 Z M 170 140 L 170 155 L 180 155 L 180 140 Z" 
                        fill="white" opacity="0.4"/>
                  
                  {/* Llave 2 */}
                  <circle cx="30" cy="160" r="6" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4"/>
                  <rect x="30" y="160" width="15" height="2" fill="white" opacity="0.4"/>
                  <rect x="42" y="159" width="2" height="2" fill="white" opacity="0.4"/>
                  <rect x="38" y="159" width="2" height="2" fill="white" opacity="0.4"/>
                  
                  {/* Edificio 2 */}
                  <rect x="140" y="120" width="25" height="35" fill="white" opacity="0.3"/>
                  <rect x="145" y="125" width="4" height="4" fill="#5AB0DB" opacity="0.5"/>
                  <rect x="153" y="125" width="4" height="4" fill="#5AB0DB" opacity="0.5"/>
                  <rect x="145" y="133" width="4" height="4" fill="#5AB0DB" opacity="0.5"/>
                  <rect x="153" y="133" width="4" height="4" fill="#5AB0DB" opacity="0.5"/>
                  <rect x="145" y="141" width="4" height="4" fill="#5AB0DB" opacity="0.5"/>
                  <rect x="153" y="141" width="4" height="4" fill="#5AB0DB" opacity="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#profile-texture)" />
            </svg>
          </div>
          
          <div className="relative z-50">
            <Header />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 py-8 relative z-[5]">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Sidebar - Oculto en móvil */}
              <div className="hidden md:block w-full md:w-64 flex-shrink-0">
                <ProfileSidebar />
              </div>
              <div className="flex-1">
                <div className="animate-pulse">
                  <div className="h-48 bg-white bg-opacity-50 rounded-lg mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-12 bg-white bg-opacity-50 rounded"></div>
                    <div className="h-12 bg-white bg-opacity-50 rounded"></div>
                    <div className="h-12 bg-white bg-opacity-50 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Head>
          <title>Mi Perfil - RENTA fácil</title>
        </Head>
        <div className="min-h-screen bg-[#5AB0DB] relative">
          {/* Textura de fondo */}
          <div className="fixed inset-0 opacity-10 pointer-events-none z-0">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="profile-texture" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                  {/* Casa 1 */}
                  <path d="M 40 80 L 60 60 L 80 80 L 80 100 L 40 100 Z M 50 85 L 50 95 L 60 95 L 60 85 Z M 65 75 L 65 85 L 75 85 L 75 75 Z" 
                        fill="white" opacity="0.6"/>
                  
                  {/* Llave 1 */}
                  <circle cx="140" cy="50" r="8" fill="none" stroke="white" strokeWidth="2" opacity="0.6"/>
                  <rect x="140" y="50" width="20" height="3" fill="white" opacity="0.6"/>
                  <rect x="155" y="48" width="3" height="3" fill="white" opacity="0.6"/>
                  <rect x="150" y="48" width="3" height="3" fill="white" opacity="0.6"/>
                  
                  {/* Edificio 1 */}
                  <rect x="50" y="140" width="30" height="40" fill="white" opacity="0.5"/>
                  <rect x="55" y="145" width="5" height="5" fill="#FFFFFF" opacity="0.7"/>
                  <rect x="65" y="145" width="5" height="5" fill="#FFFFFF" opacity="0.7"/>
                  <rect x="55" y="155" width="5" height="5" fill="#FFFFFF" opacity="0.7"/>
                  <rect x="65" y="155" width="5" height="5" fill="#FFFFFF" opacity="0.7"/>
                  <rect x="55" y="165" width="5" height="5" fill="#FFFFFF" opacity="0.7"/>
                  <rect x="65" y="165" width="5" height="5" fill="#FFFFFF" opacity="0.7"/>
                  
                  {/* Casa 2 */}
                  <path d="M 160 130 L 190 110 L 190 160 L 160 160 Z M 170 140 L 170 155 L 180 155 L 180 140 Z" 
                        fill="white" opacity="0.6"/>
                  
                  {/* Llave 2 */}
                  <circle cx="30" cy="160" r="6" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6"/>
                  <rect x="30" y="160" width="15" height="2" fill="white" opacity="0.6"/>
                  <rect x="42" y="159" width="2" height="2" fill="white" opacity="0.6"/>
                  <rect x="38" y="159" width="2" height="2" fill="white" opacity="0.6"/>
                  
                  {/* Edificio 2 */}
                  <rect x="140" y="120" width="25" height="35" fill="white" opacity="0.5"/>
                  <rect x="145" y="125" width="4" height="4" fill="#FFFFFF" opacity="0.7"/>
                  <rect x="153" y="125" width="4" height="4" fill="#FFFFFF" opacity="0.7"/>
                  <rect x="145" y="133" width="4" height="4" fill="#FFFFFF" opacity="0.7"/>
                  <rect x="153" y="133" width="4" height="4" fill="#FFFFFF" opacity="0.7"/>
                  <rect x="145" y="141" width="4" height="4" fill="#FFFFFF" opacity="0.7"/>
                  <rect x="153" y="141" width="4" height="4" fill="#FFFFFF" opacity="0.7"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#profile-texture)" />
            </svg>
          </div>
          
          <div className="relative z-10">
            <Header />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Sidebar - Oculto en móvil */}
              <div className="hidden md:block w-full md:w-64 flex-shrink-0">
                <ProfileSidebar />
              </div>
              <div className="flex-1">
                <div className="text-center">
                  <p className="text-gray-600">No se pudo cargar el perfil</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Mi Perfil - RENTA fácil</title>
        <meta name="description" content="Gestiona tu perfil y configuración en RENTA fácil" />
      </Head>

      <div className="min-h-screen bg-[#5AB0DB] relative">
        {/* Textura de fondo */}
        <div className="fixed inset-0 opacity-10 pointer-events-none z-0">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="profile-texture" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                {/* Casa 1 */}
                <path d="M 40 80 L 60 60 L 80 80 L 80 100 L 40 100 Z M 50 85 L 50 95 L 60 95 L 60 85 Z M 65 75 L 65 85 L 75 85 L 75 75 Z" 
                      fill="white" opacity="0.6"/>
                
                {/* Llave 1 */}
                <circle cx="140" cy="50" r="8" fill="none" stroke="white" strokeWidth="2" opacity="0.6"/>
                <rect x="140" y="50" width="20" height="3" fill="white" opacity="0.6"/>
                <rect x="155" y="48" width="3" height="3" fill="white" opacity="0.6"/>
                <rect x="150" y="48" width="3" height="3" fill="white" opacity="0.6"/>
                
                {/* Edificio 1 */}
                <rect x="50" y="140" width="30" height="40" fill="white" opacity="0.5"/>
                <rect x="55" y="145" width="5" height="5" fill="#FFFFFF" opacity="0.7"/>
                <rect x="65" y="145" width="5" height="5" fill="#FFFFFF" opacity="0.7"/>
                <rect x="55" y="155" width="5" height="5" fill="#FFFFFF" opacity="0.7"/>
                <rect x="65" y="155" width="5" height="5" fill="#FFFFFF" opacity="0.7"/>
                <rect x="55" y="165" width="5" height="5" fill="#FFFFFF" opacity="0.7"/>
                <rect x="65" y="165" width="5" height="5" fill="#FFFFFF" opacity="0.7"/>
                
                {/* Casa 2 */}
                <path d="M 160 130 L 190 110 L 190 160 L 160 160 Z M 170 140 L 170 155 L 180 155 L 180 140 Z" 
                      fill="white" opacity="0.6"/>
                
                {/* Llave 2 */}
                <circle cx="30" cy="160" r="6" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6"/>
                <rect x="30" y="160" width="15" height="2" fill="white" opacity="0.6"/>
                <rect x="42" y="159" width="2" height="2" fill="white" opacity="0.6"/>
                <rect x="38" y="159" width="2" height="2" fill="white" opacity="0.6"/>
                
                {/* Edificio 2 */}
                <rect x="140" y="120" width="25" height="35" fill="white" opacity="0.5"/>
                <rect x="145" y="125" width="4" height="4" fill="#FFFFFF" opacity="0.7"/>
                <rect x="153" y="125" width="4" height="4" fill="#FFFFFF" opacity="0.7"/>
                <rect x="145" y="133" width="4" height="4" fill="#FFFFFF" opacity="0.7"/>
                <rect x="153" y="133" width="4" height="4" fill="#FFFFFF" opacity="0.7"/>
                <rect x="145" y="141" width="4" height="4" fill="#FFFFFF" opacity="0.7"/>
                <rect x="153" y="141" width="4" height="4" fill="#FFFFFF" opacity="0.7"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#profile-texture)" />
          </svg>
        </div>
        
        <div className="relative z-50">
          <Header />
        </div>

        {/* Menú de Navegación Móvil */}
        <div className="lg:hidden max-w-7xl mx-auto px-4 py-4 relative z-40">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full bg-white rounded-lg shadow-md px-4 py-3 flex items-center justify-between text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bars3Icon className="w-5 h-5 text-[#5AB0DB]" />
              <span className="font-medium">Menú de Perfil</span>
            </div>
            <ChevronDownIcon 
              className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {mobileMenuOpen && (
            <div className="mt-2 bg-white rounded-lg shadow-lg overflow-hidden">
              <ProfileSidebar />
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-[5]">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Sidebar - Oculto en móvil, visible en tablet+ */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <ProfileSidebar />
            </div>

            {/* Contenido Principal */}
            <div className="flex-1 w-full">
              {/* Header del Perfil */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4 sm:mb-6">
            {/* Banner */}
            <div className="h-24 sm:h-32 bg-gradient-to-r from-[#F5C842] to-[#F5D96F] relative overflow-hidden">
              {/* Patrón decorativo en el banner */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern id="banner-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                      <circle cx="40" cy="40" r="30" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
                      <circle cx="40" cy="40" r="15" fill="none" stroke="white" strokeWidth="1" opacity="0.2" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#banner-pattern)" />
                </svg>
              </div>
            </div>

            {/* Información Principal */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-12 sm:-mt-16">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center overflow-hidden shadow-lg">
                    {getAvatarUrl(profile.avatar_url) ? (
                      <img
                        src={getAvatarUrl(profile.avatar_url)!}
                        alt={getFullName(profile)}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('❌ Error loading avatar:', profile.avatar_url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <UserCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className={`absolute bottom-0 right-0 w-9 h-9 sm:w-10 sm:h-10 bg-[#5AB0DB] rounded-full flex items-center justify-center text-white hover:bg-[#4A9DC8] transition-colors shadow-lg cursor-pointer ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title={uploading ? 'Subiendo...' : 'Cambiar foto'}
                  >
                    {uploading ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </label>
                </div>

                {/* Botón Editar */}
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full sm:w-auto px-4 sm:px-4 py-2.5 sm:py-2 bg-[#5AB0DB] text-white rounded-lg hover:bg-[#4A9DC8] transition-colors flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
                  >
                    <PencilIcon className="w-5 h-5" />
                    Editar Perfil
                  </button>
                ) : (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium text-sm sm:text-base"
                    >
                      <XMarkIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">Cancelar</span>
                      <span className="sm:hidden">Cancelar</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-[#5AB0DB] text-white rounded-lg hover:bg-[#4A9DC8] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium text-sm sm:text-base"
                    >
                      {saving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">Guardando...</span>
                          <span className="sm:hidden">Guardando...</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-5 h-5" />
                          <span className="hidden sm:inline">Guardar</span>
                          <span className="sm:hidden">Guardar</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Nombre y Rol */}
              <div className="mt-4 text-center sm:text-left">
                {editing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.first_name || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      className="text-xl sm:text-2xl font-bold text-gray-900 border-b-2 border-[#5AB0DB] focus:outline-none w-full text-center sm:text-left"
                      placeholder="Nombre"
                    />
                    <input
                      type="text"
                      value={formData.last_name || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      className="text-lg sm:text-xl text-gray-900 border-b-2 border-[#5AB0DB] focus:outline-none w-full text-center sm:text-left"
                      placeholder="Apellido"
                    />
                  </div>
                ) : (
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{getFullName(profile)}</h1>
                )}
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#5AB0DB] bg-opacity-20 text-[#2D7DA8]">
                    {getRoleName(profile.role)}
                  </span>
                  {profile.is_verified && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      ✓ Verificado
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Información de Contacto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Email */}
              <div className="flex items-start gap-3 p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg">
                <EnvelopeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <p className="text-sm sm:text-base text-gray-900 break-all">{profile.email}</p>
                  <p className="text-xs text-gray-500 mt-1">No se puede modificar</p>
                </div>
              </div>

              {/* Teléfono */}
              <div className="flex items-start gap-3 p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg">
                <PhoneIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5AB0DB] focus:border-[#5AB0DB]"
                      placeholder="+51 999 999 999"
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-gray-900">{profile.phone || 'No especificado'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información de la Cuenta */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Información de la Cuenta</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Fecha de Registro
                </label>
                <p className="text-sm sm:text-base text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Último Acceso
                </label>
                <p className="text-sm sm:text-base text-gray-900">
                  {profile.last_login_at
                    ? new Date(profile.last_login_at).toLocaleDateString('es-PE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Nunca'}
                </p>
              </div>
            </div>
          </div>

          {/* Seguridad */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#5AB0DB]" />
              Seguridad
            </h2>
            <div className="space-y-4">
              <div className="flex items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg flex-col sm:flex-row gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <KeyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 mt-1 sm:mt-0 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-gray-900">Contraseña</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Restablece tu contraseña a través de tu correo electrónico
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordResetModal(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#5AB0DB] text-white rounded-lg hover:bg-[#4A9DC8] transition-colors font-medium text-sm whitespace-nowrap"
                >
                  Cambiar Contraseña
                </button>
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>

        {/* Modal de Restablecimiento de Contraseña */}
        {showPasswordResetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              {!passwordResetSuccess ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[#5AB0DB] bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                      <KeyIcon className="w-6 h-6 text-[#5AB0DB]" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Cambiar Contraseña</h3>
                  </div>

                  <p className="text-gray-600 mb-4">
                    Se enviará un enlace de restablecimiento al correo:
                  </p>

                  <div className="flex items-center gap-2 p-3 bg-[#5AB0DB] bg-opacity-10 rounded-lg border border-[#5AB0DB] border-opacity-30 mb-6">
                    <EnvelopeIcon className="w-5 h-5 text-[#5AB0DB]" />
                    <span className="text-gray-900 font-medium break-all">{profile?.email}</span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={closePasswordResetModal}
                      disabled={sendingPasswordReset}
                      className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handlePasswordReset}
                      disabled={sendingPasswordReset}
                      className="flex-1 px-4 py-2.5 bg-[#5AB0DB] text-white rounded-lg hover:bg-[#4A9DC8] transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {sendingPasswordReset ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Enviando...
                        </>
                      ) : (
                        'Enviar Enlace'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">¡Correo Enviado!</h3>
                    <p className="text-gray-600 mb-6">
                      Hemos enviado un enlace de restablecimiento a<br />
                      <span className="font-medium text-gray-900">{profile?.email}</span>
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                      <p className="text-sm text-blue-800">
                        <strong>Próximos pasos:</strong>
                      </p>
                      <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                        <li>Revisa tu bandeja de entrada</li>
                        <li>Haz clic en el enlace del correo</li>
                        <li>Crea tu nueva contraseña</li>
                        <li>Inicia sesión con tu nueva contraseña</li>
                      </ol>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      El enlace expirará en 1 hora. Si no recibes el correo, revisa tu carpeta de spam.
                    </p>
                    <button
                      onClick={closePasswordResetModal}
                      className="w-full px-4 py-2.5 bg-[#5AB0DB] text-white rounded-lg hover:bg-[#4A9DC8] transition-colors font-medium"
                    >
                      Entendido
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
};

export default ProfilePage;
