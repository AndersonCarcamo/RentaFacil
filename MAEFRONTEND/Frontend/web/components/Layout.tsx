import { ReactNode } from 'react'
import Head from 'next/head'
import { Header } from './common/Header'
import { Footer } from './Footer'

interface LayoutProps {
  children: ReactNode
  title?: string
  description?: string
  canonical?: string
  noHeader?: boolean
  noFooter?: boolean
  className?: string
}

export default function Layout({ 
  children, 
  title = "RentaFacil - Alquiler de Propiedades",
  description = "Encuentra el alquiler perfecto en Perú",
  canonical,
  noHeader = false,
  noFooter = false,
  className = ""
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        {canonical && <link rel="canonical" href={canonical} />}
      </Head>
      
      <div className={`min-h-screen flex flex-col ${className}`}>
        {!noHeader && <Header />}
        
        <main className="flex-1">
          {children}
        </main>
        
        {!noFooter && <Footer />}
      </div>
    </>
  )
}
