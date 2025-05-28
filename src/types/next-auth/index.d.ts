import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
    interface User extends DefaultUser {
        token?: string; // Custom property
        username?: string;
        isAdmin?: boolean
    }

    interface Session extends DefaultSession {
        user: {
            token?: string;
            username?: string;
            isAdmin?: boolean;
        } & DefaultSession['user'];
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        token?: string;
        username?: string;
        isAdmin?: boolean;
    }
}