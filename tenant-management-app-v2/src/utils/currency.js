// Currency utilities for Malaysian market
export const CURRENCY = {
  symbol: 'RM',
  code: 'MYR',
  name: 'Malaysian Ringgit',
  locale: 'ms-MY'
}

export function formatCurrency(amount, options = {}) {
  const {
    showSymbol = true,
    showCode = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options

  if (!amount || isNaN(amount)) {
    return showSymbol ? `${CURRENCY.symbol}0.00` : '0.00'
  }

  const formatter = new Intl.NumberFormat(CURRENCY.locale, {
    style: 'decimal',
    minimumFractionDigits,
    maximumFractionDigits
  })

  const formatted = formatter.format(Number(amount))

  let result = formatted
  if (showSymbol) {
    result = `${CURRENCY.symbol}${formatted}`
  }
  if (showCode) {
    result = `${result} ${CURRENCY.code}`
  }

  return result
}

export function parseCurrency(value) {
  if (!value) return 0
  
  // Remove currency symbol and spaces
  const cleaned = value.toString()
    .replace(/RM|MYR/g, '')
    .replace(/,/g, '')
    .trim()
  
  return parseFloat(cleaned) || 0
}