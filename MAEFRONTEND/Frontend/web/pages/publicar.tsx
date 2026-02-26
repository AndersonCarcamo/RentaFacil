import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Redirección de /publicar a /publish
const PublicarRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/publish');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  );
};

export default PublicarRedirect;
