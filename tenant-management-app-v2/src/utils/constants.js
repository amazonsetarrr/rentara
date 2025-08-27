export const SUBSCRIPTION_LIMITS = {
  trial: { properties: 1, units: 5, users: 1 },
  starter: { properties: 3, units: 25, users: 2 },
  professional: { properties: 10, units: 100, users: 5 },
  enterprise: { properties: -1, units: -1, users: -1 }
}

export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin', 
  MEMBER: 'member'
}

export const UNIT_STATUSES = {
  OCCUPIED: 'occupied',
  VACANT: 'vacant',
  MAINTENANCE: 'maintenance',
  UNAVAILABLE: 'unavailable'
}

export const TENANT_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  MOVED_OUT: 'moved_out'
}

export const LEASE_STATUSES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  TERMINATED: 'terminated'
}

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment Complex' },
  { value: 'house', label: 'Single Family House' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'commercial', label: 'Commercial Building' },
  { value: 'condo', label: 'Condominium' },
  { value: 'terrace', label: 'Terrace House' },
  { value: 'semi-detached', label: 'Semi-Detached House' },
  { value: 'bungalow', label: 'Bungalow/Detached House' },
  { value: 'serviced-residence', label: 'Serviced Residence' },
  { value: 'studio', label: 'Studio Apartment' }
]