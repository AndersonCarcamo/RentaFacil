/**
 * Admin Page
 * Panel de administración para usuarios con rol de administrador
 */

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../lib/hooks/useAuth'
import AdminPanel from '../components/admin/AdminPanel'
import { Header } from '../components/common/Header'
import { Footer } from '../components/Footer'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect if not admin
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <>
      <Head>
        <title>Panel de Administración - RENTA fácil</title>
        <meta name="description" content="Panel de administración de RENTA fácil" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-[1800px] mx-auto px-3 sm:px-4 lg:px-6 py-6">
          <AdminPanel userEmail={user.email} />
        </main>

        <Footer />
      </div>
    </>
  )
}
