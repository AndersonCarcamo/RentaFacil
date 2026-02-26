import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/Footer';
import { ProfileSidebar } from '../../components/ProfileSidebar';
import { useAuth } from '../../lib/hooks/useAuth';
import {
  KeyIcon,
  LockClosedIcon,
  ShieldExclamationIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { deleteAccount } from '../../lib/api/users';

const SettingsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Estados para modales
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showSuspendAccountModal, setShowSuspendAccountModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Estados para formularios
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/profile/settings');
      return;
    }
  }, [user, authLoading]);

  const handleResetPassword = async () => {
    if (!user?.email) {
      toast.error('No se pudo obtener el correo electrónico');
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, user.email);
      toast.success('Correo de restablecimiento enviado exitosamente. Revisa tu bandeja de entrada.');
      setShowResetPasswordModal(false);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      let errorMessage = 'Error al enviar el correo de restablecimiento';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No se encontró un usuario con este correo';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Por favor intenta más tarde';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Error de conexión. Verifica tu internet';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (changePasswordData.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setLoading(true);
      // TODO: Implementar llamada al endpoint de cambio de contraseña
      // await changePassword(changePasswordData.currentPassword, changePasswordData.newPassword);
      toast.success('Contraseña actualizada correctamente');
      setShowChangePasswordModal(false);
      setChangePasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendAccount = async () => {
    try {
      setLoading(true);
      // TODO: Implementar llamada al endpoint de suspensión de cuenta
      // await suspendAccount();
      toast.success('Cuenta suspendida. Puedes reactivarla al iniciar sesión nuevamente.');
      setShowSuspendAccountModal(false);
      await logout();
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Error al suspender la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR') {
      toast.error('Por favor escribe "ELIMINAR" para confirmar');
      return;
    }

    try {
      setLoading(true);
      await deleteAccount('Usuario solicitó eliminar su cuenta');
      toast.success('Cuenta eliminada correctamente');
      setShowDeleteAccountModal(false);
      setDeleteConfirmText('');
      await logout();
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <>
        <Head>
          <title>Configuración - RENTA fácil</title>
        </Head>
        <div className="min-h-screen bg-[#5AB0DB] relative">
          {/* Textura de fondo */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
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
          
          <Header />
          <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
            <div className="flex gap-6">
              <div className="w-64 flex-shrink-0">
                <ProfileSidebar />
              </div>
              <div className="flex-1">
                <div className="animate-pulse space-y-4">
                  <div className="h-32 bg-white bg-opacity-50 rounded-lg"></div>
                  <div className="h-32 bg-white bg-opacity-50 rounded-lg"></div>
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
        <title>Configuración - RENTA fácil</title>
        <meta name="description" content="Configuración de cuenta y seguridad" />
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

        <div className="max-w-7xl mx-auto px-4 py-8 relative z-[5]">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0">
              <ProfileSidebar />
            </div>

            {/* Contenido Principal */}
            <div className="flex-1 space-y-6">
              {/* Seguridad y Contraseña */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <LockClosedIcon className="w-6 h-6" />
                  Seguridad y Contraseña
                </h2>

                <div className="space-y-4">
                  {/* Restablecer Contraseña */}
                  <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <KeyIcon className="w-6 h-6 text-[#5AB0DB] mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Restablecer Contraseña</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Recibe un correo para crear una nueva contraseña
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowResetPasswordModal(true)}
                      className="px-4 py-2 text-[#5AB0DB] hover:bg-[#5AB0DB] hover:bg-opacity-10 rounded-lg transition-colors"
                    >
                      Solicitar
                    </button>
                  </div>

                  {/* Cambiar Contraseña */}
                  <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <LockClosedIcon className="w-6 h-6 text-[#5AB0DB] mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Cambiar Contraseña</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Actualiza tu contraseña actual
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowChangePasswordModal(true)}
                      className="px-4 py-2 text-[#5AB0DB] hover:bg-[#5AB0DB] hover:bg-opacity-10 rounded-lg transition-colors"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              </div>

              {/* Gestión de Cuenta */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShieldExclamationIcon className="w-6 h-6" />
                  Gestión de Cuenta
                </h2>

                <div className="space-y-4">
                  {/* Suspender Cuenta */}
                  <div className="flex items-start justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Suspender Cuenta</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Desactiva temporalmente tu cuenta. Podrás reactivarla después.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSuspendAccountModal(true)}
                      className="px-4 py-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                    >
                      Suspender
                    </button>
                  </div>

                  {/* Eliminar Cuenta */}
                  <div className="flex items-start justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <TrashIcon className="w-6 h-6 text-red-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Eliminar Cuenta</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Elimina permanentemente tu cuenta y todos tus datos. Esta acción no se puede deshacer.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDeleteAccountModal(true)}
                      className="px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* Modal: Restablecer Contraseña */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Restablecer Contraseña</h3>
            <p className="text-sm text-gray-600 mb-4">
              Se enviará un enlace de restablecimiento al correo:
            </p>
            <div className="flex items-center gap-2 p-3 bg-[#5AB0DB] bg-opacity-10 rounded-lg border border-[#5AB0DB] border-opacity-30 mb-6">
              <EnvelopeIcon className="w-5 h-5 text-[#5AB0DB]" />
              <span className="text-gray-900 font-medium break-all">{user?.email}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetPasswordModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#5AB0DB] text-white rounded-lg hover:bg-[#4A9DC8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar Enlace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cambiar Contraseña */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cambiar Contraseña</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  value={changePasswordData.currentPassword}
                  onChange={(e) =>
                    setChangePasswordData({ ...changePasswordData, currentPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5AB0DB] focus:border-[#5AB0DB]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={changePasswordData.newPassword}
                  onChange={(e) =>
                    setChangePasswordData({ ...changePasswordData, newPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5AB0DB] focus:border-[#5AB0DB]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={changePasswordData.confirmPassword}
                  onChange={(e) =>
                    setChangePasswordData({ ...changePasswordData, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5AB0DB] focus:border-[#5AB0DB]"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setChangePasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                disabled={
                  loading ||
                  !changePasswordData.currentPassword ||
                  !changePasswordData.newPassword ||
                  !changePasswordData.confirmPassword
                }
                className="flex-1 px-4 py-2 bg-[#5AB0DB] text-white rounded-lg hover:bg-[#4A9DC8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Cambiar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Suspender Cuenta */}
      {showSuspendAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
              <h3 className="text-lg font-bold text-gray-900">Suspender Cuenta</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Tu cuenta será desactivada temporalmente. Todas tus publicaciones y datos se mantendrán seguros.
              Podrás reactivar tu cuenta iniciando sesión nuevamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSuspendAccountModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSuspendAccount}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Suspendiendo...' : 'Suspender'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Eliminar Cuenta */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrashIcon className="w-8 h-8 text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">Eliminar Cuenta</h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Esta acción es <strong>permanente</strong> y no se puede deshacer. Se eliminarán:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-4">
                <li>Tu perfil y toda tu información personal</li>
                <li>Todas tus publicaciones de propiedades</li>
                <li>Tu historial de búsquedas y favoritos</li>
                <li>Todos tus mensajes y conversaciones</li>
              </ul>
              <p className="text-sm text-gray-600 mb-4">
                Para confirmar, escribe <strong>ELIMINAR</strong> en el campo de abajo:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Escribe ELIMINAR"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirmText !== 'ELIMINAR'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Eliminando...' : 'Eliminar Cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsPage;
