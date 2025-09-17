// Malaysian-specific validation utilities

// Malaysian IC (Identity Card) validation
export const validateMalaysianIC = (ic) => {
  if (!ic) return { isValid: false, error: 'IC number is required' }

  // Remove all non-digits
  const cleanIC = ic.replace(/\D/g, '')

  // Check if exactly 12 digits
  if (cleanIC.length !== 12) {
    return { isValid: false, error: 'IC number must be 12 digits' }
  }

  // Basic format validation (YYMMDD-SS-####)
  const month = parseInt(cleanIC.substring(2, 4))
  const day = parseInt(cleanIC.substring(4, 6))
  const stateCode = cleanIC.substring(6, 8)

  // Validate date components
  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Invalid month in IC number' }
  }

  if (day < 1 || day > 31) {
    return { isValid: false, error: 'Invalid day in IC number' }
  }

  // Valid state codes (simplified list)
  const validStateCodes = [
    '01', '21', '22', '23', '24', // Johor
    '02', '25', '26', '27', // Kedah
    '03', '28', '29', // Kelantan
    '04', '30', // Malacca
    '05', '31', '59', // Negeri Sembilan
    '06', '32', '33', // Pahang
    '07', '34', '35', // Pulau Pinang
    '08', '36', '37', '38', '39', // Perak
    '09', '40', // Perlis
    '10', '41', '42', '43', '44', // Selangor
    '11', '45', '46', // Terengganu
    '12', '47', '48', '49', // Sabah
    '13', '50', '51', '52', '53', // Sarawak
    '14', '54', '55', '56', '57', // Federal Territory
    '15', '58', '82', // Labuan
    '16', '82' // Putrajaya
  ]

  if (!validStateCodes.includes(stateCode)) {
    return { isValid: false, error: 'Invalid state code in IC number' }
  }

  return { isValid: true, error: null }
}

// Format IC number with dashes
export const formatMalaysianIC = (ic) => {
  if (!ic) return ''
  const cleanIC = ic.replace(/\D/g, '')
  if (cleanIC.length === 12) {
    return `${cleanIC.substring(0, 6)}-${cleanIC.substring(6, 8)}-${cleanIC.substring(8, 12)}`
  }
  return ic
}

// Malaysian phone number validation
export const validateMalaysianPhone = (phone) => {
  if (!phone) return { isValid: false, error: 'Phone number is required' }

  // Remove all non-digits and +
  const cleanPhone = phone.replace(/[^\d+]/g, '')

  // Malaysian phone patterns:
  // Mobile: +60 1X-XXX-XXXX or 01X-XXX-XXXX
  // Landline: +60 X-XXX-XXXX or 0X-XXX-XXXX

  // Check international format (+60)
  if (cleanPhone.startsWith('+60')) {
    const number = cleanPhone.substring(3)
    if (number.length >= 9 && number.length <= 10) {
      return { isValid: true, error: null }
    }
  }

  // Check local format (0X)
  if (cleanPhone.startsWith('0')) {
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
      return { isValid: true, error: null }
    }
  }

  return { isValid: false, error: 'Invalid Malaysian phone number format' }
}

// Format Malaysian phone number
export const formatMalaysianPhone = (phone) => {
  if (!phone) return ''

  const cleanPhone = phone.replace(/[^\d+]/g, '')

  // Format mobile numbers (01X-XXX-XXXX)
  if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
    return `${cleanPhone.substring(0, 3)}-${cleanPhone.substring(3, 6)}-${cleanPhone.substring(6)}`
  }

  // Format landline numbers (0X-XXX-XXXX)
  if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    return `${cleanPhone.substring(0, 2)}-${cleanPhone.substring(2, 5)}-${cleanPhone.substring(5)}`
  }

  // Format international numbers (+60 X-XXX-XXXX)
  if (cleanPhone.startsWith('+60') && cleanPhone.length >= 12) {
    const number = cleanPhone.substring(3)
    if (number.length === 10) {
      return `+60 ${number.substring(0, 2)}-${number.substring(2, 5)}-${number.substring(5)}`
    }
    if (number.length === 9) {
      return `+60 ${number.substring(0, 1)}-${number.substring(1, 4)}-${number.substring(4)}`
    }
  }

  return phone
}

// Malaysian currency validation and formatting
export const validateRinggitAmount = (amount) => {
  if (!amount && amount !== 0) return { isValid: false, error: 'Amount is required' }

  const numAmount = parseFloat(amount)

  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Amount must be a valid number' }
  }

  if (numAmount < 0) {
    return { isValid: false, error: 'Amount cannot be negative' }
  }

  // Check for more than 2 decimal places
  if (amount.toString().includes('.')) {
    const decimals = amount.toString().split('.')[1]
    if (decimals && decimals.length > 2) {
      return { isValid: false, error: 'Amount cannot have more than 2 decimal places' }
    }
  }

  return { isValid: true, error: null }
}

// Format amount as Malaysian Ringgit
export const formatRinggit = (amount, options = {}) => {
  const { showSymbol = true, decimals = 2 } = options

  if (!amount && amount !== 0) return ''

  const numAmount = parseFloat(amount)
  if (isNaN(numAmount)) return ''

  const formatted = numAmount.toLocaleString('en-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

  return showSymbol ? `RM ${formatted}` : formatted
}

// Malaysian nationalities for dropdown
export const MALAYSIAN_NATIONALITIES = [
  { value: 'malaysian', label: 'Malaysian' },
  { value: 'singaporean', label: 'Singaporean' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'indian', label: 'Indian' },
  { value: 'indonesian', label: 'Indonesian' },
  { value: 'thai', label: 'Thai' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'filipino', label: 'Filipino' },
  { value: 'myanmar', label: 'Myanmar' },
  { value: 'bangladeshi', label: 'Bangladeshi' },
  { value: 'pakistani', label: 'Pakistani' },
  { value: 'sri_lankan', label: 'Sri Lankan' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'korean', label: 'Korean' },
  { value: 'australian', label: 'Australian' },
  { value: 'british', label: 'British' },
  { value: 'american', label: 'American' },
  { value: 'other', label: 'Other' }
]

// Work permit/visa types in Malaysia
export const WORK_PERMIT_TYPES = [
  { value: 'none', label: 'Not Applicable (Malaysian)' },
  { value: 'employment_pass', label: 'Employment Pass' },
  { value: 'work_permit', label: 'Work Permit' },
  { value: 'professional_visit_pass', label: 'Professional Visit Pass' },
  { value: 'residence_pass', label: 'Residence Pass (PR)' },
  { value: 'student_visa', label: 'Student Visa' },
  { value: 'dependent_pass', label: 'Dependent Pass' },
  { value: 'social_visit_pass', label: 'Social Visit Pass' },
  { value: 'other', label: 'Other' }
]

// Malaysian states (for validation and dropdowns)
export const MALAYSIAN_STATES = [
  { value: 'johor', label: 'Johor' },
  { value: 'kedah', label: 'Kedah' },
  { value: 'kelantan', label: 'Kelantan' },
  { value: 'malacca', label: 'Malacca' },
  { value: 'negeri_sembilan', label: 'Negeri Sembilan' },
  { value: 'pahang', label: 'Pahang' },
  { value: 'penang', label: 'Penang' },
  { value: 'perak', label: 'Perak' },
  { value: 'perlis', label: 'Perlis' },
  { value: 'selangor', label: 'Selangor' },
  { value: 'terengganu', label: 'Terengganu' },
  { value: 'sabah', label: 'Sabah' },
  { value: 'sarawak', label: 'Sarawak' },
  { value: 'kuala_lumpur', label: 'Federal Territory of Kuala Lumpur' },
  { value: 'labuan', label: 'Federal Territory of Labuan' },
  { value: 'putrajaya', label: 'Federal Territory of Putrajaya' }
]

// Validate Malaysian postal code
export const validateMalaysianPostalCode = (postalCode) => {
  if (!postalCode) return { isValid: false, error: 'Postal code is required' }

  const cleanCode = postalCode.replace(/\D/g, '')

  if (cleanCode.length !== 5) {
    return { isValid: false, error: 'Malaysian postal code must be 5 digits' }
  }

  return { isValid: true, error: null }
}

// Standard Malaysian rental deposit structure
export const calculateMalaysianDeposit = (monthlyRent) => {
  const rent = parseFloat(monthlyRent) || 0

  return {
    securityDeposit: rent * 2,        // 2 months security deposit
    advanceRental: rent * 1,          // 1 month advance rental
    utilityDeposit: rent * 0.5,       // 0.5 month utility deposit
    total: rent * 3.5                 // Total upfront payment
  }
}