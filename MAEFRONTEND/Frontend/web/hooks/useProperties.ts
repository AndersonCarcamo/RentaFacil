import { useState, useEffect, useCallback } from 'react'
import { fetchProperties, fetchProperty, PropertyResponse, PropertyFilters } from '@/lib/api/properties'

/**
 * Hook para manejar la lista de propiedades con filtros
 */
export function useProperties(initialFilters?: PropertyFilters) {
  const [properties, setProperties] = useState<PropertyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PropertyFilters | undefined>(initialFilters)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const loadProperties = useCallback(async (newFilters?: PropertyFilters, append = false) => {
    try {
      if (!append) {
        setLoading(true)
      }
      setError(null)

      const currentFilters = newFilters || filters
      const data = await fetchProperties(currentFilters)
      
      if (append) {
        setProperties(prev => [...prev, ...data])
      } else {
        setProperties(data)
      }

      // Check if there are more properties to load
      const limit = currentFilters?.limit || 20
      setHasMore(data.length === limit)
      
      if (!append) {
        setFilters(currentFilters)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando propiedades')
      console.error('Failed to load properties:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const loadMore = useCallback(() => {
    if (!loading && hasMore && filters) {
      const currentPage = filters.page || 1
      const nextFilters = { ...filters, page: currentPage + 1 }
      loadProperties(nextFilters, true)
    }
  }, [loading, hasMore, filters, loadProperties])

  const refresh = useCallback(() => {
    loadProperties(filters)
  }, [loadProperties, filters])

  const updateFilters = useCallback((newFilters: PropertyFilters) => {
    // Reset page to 1 when filters change
    const filtersWithPage = { ...newFilters, page: 1 }
    loadProperties(filtersWithPage)
  }, [loadProperties])

  useEffect(() => {
    loadProperties(initialFilters)
  }, []) // Only run on mount

  return {
    properties,
    loading,
    error,
    filters,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    updateFilters,
  }
}

/**
 * Hook para manejar una propiedad individual
 */
export function useProperty(id: string | null) {
  const [property, setProperty] = useState<PropertyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProperty = useCallback(async (propertyId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await fetchProperty(propertyId)
      setProperty(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando propiedad')
      console.error('Failed to load property:', err)
      setProperty(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    if (id) {
      loadProperty(id)
    }
  }, [id, loadProperty])

  useEffect(() => {
    if (id) {
      loadProperty(id)
    } else {
      setProperty(null)
      setLoading(false)
      setError(null)
    }
  }, [id, loadProperty])

  return {
    property,
    loading,
    error,
    refresh,
  }
}

/**
 * Hook para manejar búsquedas de propiedades con debounce
 */
export function usePropertySearch(initialQuery = '', delay = 500) {
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  
  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, delay)

    return () => clearTimeout(timer)
  }, [query, delay])

  // Convert search query to filters
  const searchFilters: PropertyFilters = {
    // This could be enhanced to parse the query and create appropriate filters
    // For now, we'll assume it's a general search
    city: debouncedQuery || undefined,
    page: 1,
    limit: 20,
  }

  const { properties, loading, error, updateFilters, ...rest } = useProperties(searchFilters)

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery)
  }, [])

  const searchWithFilters = useCallback((searchQuery: string, filters: PropertyFilters) => {
    setQuery(searchQuery)
    const combinedFilters = {
      ...filters,
      city: searchQuery || undefined,
      page: 1,
    }
    updateFilters(combinedFilters)
  }, [updateFilters])

  useEffect(() => {
    if (debouncedQuery !== initialQuery) {
      updateFilters(searchFilters)
    }
  }, [debouncedQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    query,
    debouncedQuery,
    properties,
    loading,
    error,
    search,
    searchWithFilters,
    updateFilters,
    ...rest,
  }
}

/**
 * Example usage:
 * 
 * // Basic property list
 * const { properties, loading, error, updateFilters } = useProperties({
 *   operation_type: 'rent',
 *   limit: 12
 * })
 * 
 * // Property search with debounce
 * const { 
 *   properties, 
 *   loading, 
 *   query, 
 *   search, 
 *   searchWithFilters 
 * } = usePropertySearch()
 * 
 * // Single property
 * const { property, loading, error } = useProperty(propertyId)
 */