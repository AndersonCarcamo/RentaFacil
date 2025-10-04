import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'
import Head from 'next/head'
import { AuthProvider } from '../lib/hooks/useAuth'

// Estilos globales
import '@/styles/globals.css'

// Configuración del cliente de React Query
const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: (failureCount: number, error: any) => {
        // No reintentar en errores 404 o 403
        if (error?.status === 404 || error?.status === 403) {
          return false
        }
        // Reintentar hasta 3 veces para otros errores
        return failureCount < 3
      },
    },
    mutations: {
      retry: 1,
    },
  },
}

export default function App({ Component, pageProps }: AppProps) {
  // Cliente de React Query con configuración personalizada
  const [queryClient] = useState(() => new QueryClient(queryClientConfig))

  return (
    <>
      <Head>
        {/* Meta tags básicos para SEO */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#F5C842" />
        
        {/* Preconnect a servicios externos para mejor performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch para API */}
  <link rel="dns-prefetch" href="//api.rentafacil.com" />
        
        {/* Favicon optimizado */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            {/* Componente principal de la aplicación */}
            <Component {...pageProps} />
          </AuthProvider>
          
          {/* Toast notifications globales */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#374151',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e5e7eb',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </>
  )
}

// Configuración adicional de la app para mejorar performance
App.getInitialProps = async (context) => {
  // Esta función se ejecuta en el servidor y en el cliente
  // Aquí podemos hacer inicializaciones globales si es necesario
  return {
    pageProps: {},
  }
}