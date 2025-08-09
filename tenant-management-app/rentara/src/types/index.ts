export interface Tenant {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
}

export interface TenantInput {
    name: string;
    email: string;
    phoneNumber: string;
}