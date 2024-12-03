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

declare module '@xoi/gps-metadata-remover' {
    type ReadFunction = (size: number, offset: number) => Promise<Buffer>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type WriteFunction = (val: string, offset: number, enc: any) => Promise<void>
    type Options = {
        skipXMPRemoval?: boolean
    }
    async function removeLocation(path: string, read: ReadFunction, write: WriteFunction, options: Options = {}): Promise<boolean>;

    export { removeLocation };
}