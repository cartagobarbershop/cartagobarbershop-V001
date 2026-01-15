export const sanitizePhone = (phone: string) => phone.replace(/[^0-9]/g, "");
export const sanitizeEmail = (email: string) => email.trim().toLowerCase();
