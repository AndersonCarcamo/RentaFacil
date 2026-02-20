/**
 * Utilidades para formateo de moneda
 */

export type Currency = 'PEN' | 'USD' | 'EUR'

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  PEN: 'S/',
  USD: '$',
  EUR: '€'
}

export const CURRENCY_NAMES: Record<Currency, string> = {
  PEN: 'Soles',
  USD: 'Dólares',
  EUR: 'Euros'
}

/**
 * Formatea un número como moneda
 * @param amount - Cantidad a formatear
 * @param currency - Código de moneda (PEN, USD, EUR)
 * @param includeSymbol - Si incluir el símbolo de moneda (default: true)
 * @returns String formateado
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: Currency = 'PEN',
  includeSymbol: boolean = true
): string {
  // Manejar valores nulos o undefined
  if (amount === null || amount === undefined) {
    return includeSymbol ? `${CURRENCY_SYMBOLS[currency]} 0.00` : '0.00'
  }

  // Convertir a número si es string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  // Validar que sea un número válido
  if (isNaN(numAmount)) {
    return includeSymbol ? `${CURRENCY_SYMBOLS[currency]} 0.00` : '0.00'
  }

  // Formatear con separadores de miles y 2 decimales
  const formatted = numAmount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  // Retornar con o sin símbolo
  return includeSymbol ? `${CURRENCY_SYMBOLS[currency]} ${formatted}` : formatted
}

/**
 * Formatea un precio de manera compacta (sin decimales si es entero)
 * @param amount - Cantidad a formatear
 * @param currency - Código de moneda
 * @returns String formateado compacto
 */
export function formatPriceCompact(
  amount: number | string | null | undefined,
  currency: Currency = 'PEN'
): string {
  if (amount === null || amount === undefined) {
    return `${CURRENCY_SYMBOLS[currency]} 0`
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(numAmount)) {
    return `${CURRENCY_SYMBOLS[currency]} 0`
  }

  // Si es un número entero, no mostrar decimales
  const decimals = numAmount % 1 === 0 ? 0 : 2

  const formatted = numAmount.toLocaleString('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

  return `${CURRENCY_SYMBOLS[currency]} ${formatted}`
}

/**
 * Parsea una cadena de moneda a número
 * @param currencyString - String con formato de moneda
 * @returns Número parseado
 */
export function parseCurrency(currencyString: string): number {
  // Remover símbolos de moneda y espacios
  const cleaned = currencyString
    .replace(/[S/\$€\s]/g, '')
    .replace(/,/g, '') // Remover separadores de miles

  return parseFloat(cleaned) || 0
}

/**
 * Obtiene el símbolo de una moneda
 * @param currency - Código de moneda
 * @returns Símbolo de la moneda
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] || CURRENCY_SYMBOLS.PEN
}

/**
 * Obtiene el nombre de una moneda
 * @param currency - Código de moneda
 * @returns Nombre de la moneda
 */
export function getCurrencyName(currency: Currency): string {
  return CURRENCY_NAMES[currency] || CURRENCY_NAMES.PEN
}

/**
 * Convierte entre monedas (requiere tasas de cambio)
 * @param amount - Cantidad a convertir
 * @param fromCurrency - Moneda origen
 * @param toCurrency - Moneda destino
 * @param exchangeRates - Tasas de cambio
 * @returns Cantidad convertida
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  // Convertir a USD como moneda base
  const amountInUSD = fromCurrency === 'USD' 
    ? amount 
    : amount / (exchangeRates[fromCurrency] || 1)

  // Convertir de USD a moneda destino
  const result = toCurrency === 'USD'
    ? amountInUSD
    : amountInUSD * (exchangeRates[toCurrency] || 1)

  return Math.round(result * 100) / 100 // Redondear a 2 decimales
}
