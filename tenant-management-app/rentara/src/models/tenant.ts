class Tenant {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;

    constructor(id: string, name: string, email: string, phoneNumber: string) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phoneNumber = phoneNumber;
    }

    validateEmail(): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(this.email);
    }

    validatePhoneNumber(): boolean {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(this.phoneNumber);
    }
}

export default Tenant;