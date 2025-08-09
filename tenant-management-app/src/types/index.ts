export interface Property {
  id: number;
  name: string;
  address: string;
  created_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  created_at: string;
}

export interface Lease {
  id: number;
  property_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string;
  rent_amount: number;
  created_at: string;
}

export interface Payment {
  id: number;
  lease_id: number;
  payment_date: string;
  amount: number;
  created_at: string;
}
