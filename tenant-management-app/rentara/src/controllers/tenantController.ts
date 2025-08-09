class TenantController {
    private tenants: Array<{ id: number; name: string; email: string; phone: string }> = [];
    private currentId: number = 1;

    createTenant(name: string, email: string, phone: string) {
        const newTenant = { id: this.currentId++, name, email, phone };
        this.tenants.push(newTenant);
        return newTenant;
    }

    getTenant(id: number) {
        return this.tenants.find(tenant => tenant.id === id);
    }

    updateTenant(id: number, name?: string, email?: string, phone?: string) {
        const tenant = this.getTenant(id);
        if (tenant) {
            if (name) tenant.name = name;
            if (email) tenant.email = email;
            if (phone) tenant.phone = phone;
            return tenant;
        }
        return null;
    }

    deleteTenant(id: number) {
        const index = this.tenants.findIndex(tenant => tenant.id === id);
        if (index !== -1) {
            return this.tenants.splice(index, 1)[0];
        }
        return null;
    }
}

export default TenantController;