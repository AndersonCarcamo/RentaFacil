import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/Footer';
import { ProfileSidebar } from '../../components/ProfileSidebar';
import { useAuth } from '../../lib/hooks/useAuth';
import { HeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';

const FavoritesPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/profile/favorites');
      return;
    }

    if (user) {
      loadFavorites();
    }
  }, [user, authLoading]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // TODO: Implementar llamada al endpoint de favoritos
      // const data = await fetchFavorites();
      // setFavorites(data);
      
      // Por ahora, datos de ejemplo
      setFavorites([]);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Head>
          <title>Mis Favoritos - RENTA fácil</title>
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
          
          <div className="relative z-10">
            <Header />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
            <div className="flex gap-6">
              <div className="w-64 flex-shrink-0">
                <ProfileSidebar />
              </div>
              <div className="flex-1">
                <div className="animate-pulse space-y-4">
                  <div className="h-48 bg-white bg-opacity-50 rounded-lg"></div>
                  <div className="h-48 bg-white bg-opacity-50 rounded-lg"></div>
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
        <title>Mis Favoritos - RENTA fácil</title>
        <meta name="description" content="Propiedades guardadas como favoritas" />
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
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Propiedades Favoritas</h1>

                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <HeartOutlineIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tienes favoritos aún
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Guarda propiedades que te interesen para encontrarlas fácilmente después
                    </p>
                    <button
                      onClick={() => router.push('/search')}
                      className="px-6 py-3 bg-[#5AB0DB] text-white rounded-lg hover:bg-[#4A9DC8] transition-colors"
                    >
                      Explorar Propiedades
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((property) => (
                      <div
                        key={property.id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="relative h-48 bg-gray-200">
                          <img
                            src={property.image}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                          <button
                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                          >
                            <HeartIcon className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">{property.title}</h3>
                          <p className="text-gray-600 text-sm mb-2">{property.location}</p>
                          <p className="text-[#5AB0DB] font-bold text-lg">
                            S/ {property.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default FavoritesPage;
