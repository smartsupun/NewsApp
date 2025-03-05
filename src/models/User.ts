export interface UserPreferences {
    darkMode: boolean;
    notifications: boolean;
    categories: string[];
    biometricEnabled: boolean;
}

export type AuthProvider = 'email' | 'google' | 'facebook';

export interface UserData {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    dateOfBirth?: Date | string | null;
    mobileNumber?: string;
    profilePicture?: string | null;
    authProvider?: AuthProvider;
    createdAt?: Date | string;
    lastLoginAt?: Date | string;
    preferences?: Partial<UserPreferences>;
}

export class User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: Date | null;
    mobileNumber: string;
    profilePicture: string | null;
    authProvider: AuthProvider;
    createdAt: Date;
    lastLoginAt: Date;
    preferences: UserPreferences;

    constructor(data: UserData = {}) {
        this.id = data.id || `user_${new Date().getTime()}`;
        this.firstName = data.firstName || '';
        this.lastName = data.lastName || '';
        this.email = data.email || '';
        this.dateOfBirth = data.dateOfBirth instanceof Date
            ? data.dateOfBirth
            : data.dateOfBirth
                ? new Date(data.dateOfBirth)
                : null;
        this.mobileNumber = data.mobileNumber || '';
        this.profilePicture = data.profilePicture || null;
        this.authProvider = data.authProvider || 'email';
        this.createdAt = data.createdAt instanceof Date
            ? data.createdAt
            : data.createdAt
                ? new Date(data.createdAt)
                : new Date();
        this.lastLoginAt = data.lastLoginAt instanceof Date
            ? data.lastLoginAt
            : data.lastLoginAt
                ? new Date(data.lastLoginAt)
                : new Date();
        this.preferences = {
            darkMode: data.preferences?.darkMode ?? false,
            notifications: data.preferences?.notifications ?? true,
            categories: data.preferences?.categories ?? ['general'],
            biometricEnabled: data.preferences?.biometricEnabled ?? false
        };
    }

    get fullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    get initials(): string {
        return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
    }

    hasCompletedProfile(): boolean {
        return !!(this.firstName && this.lastName && this.dateOfBirth && this.mobileNumber);
    }
}