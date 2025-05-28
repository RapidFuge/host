import NextAuth from 'next-auth';
import { isLength, isAlphanumeric, isAscii } from 'validator';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDatabase } from '@lib/db';
import { compare, hash } from 'bcrypt';
import { generateToken, hashRounds } from '@lib';

const db = await getDatabase();

const validUsername = (str: string | undefined) => str && typeof str === "string" && isLength(str, {
    min: 3,
    max: 50
}) && isAlphanumeric(str);
const validPassword = (str: string | undefined) => str && typeof str === "string" && isLength(str, {
    min: 3,
    max: 100
});
const validToken = (str: string) => str && typeof str === "string" && isAscii(str);

export default NextAuth({
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
                signUpToken: { label: "Sign Up Token", type: "text", optional: true },
            },
            async authorize(credentials) {
                const { username, password, signUpToken } = credentials || {};

                if (!username || !validUsername(username)) throw new Error("Invalid username.");
                if (!password || !validPassword(password)) throw new Error("Invalid password: Must be less than 100 characters.");

                if (signUpToken) {
                    if (!validToken(signUpToken)) throw new Error("Invalid Sign Up Token.");

                    const exists = await db.getUser(username);
                    if (exists) throw new Error("User already exists!");

                    const tokenExists = await db.getSignUpToken(signUpToken);
                    if (!tokenExists) throw new Error("Token does not exist.");

                    const hashed = await hash(password, hashRounds);
                    const token = await generateToken();

                    await db.addUser(username, hashed, token);
                    await db.removeSignUpToken(signUpToken);
                    console.log(`Used sign up token ${token} to create account ${username}.`);
                    return { success: true, username };
                }

                const user = await db.getUser(username);
                console.log(user, username)
                if (!user) throw new Error("Invalid username.");

                const correct = await compare(password, user.password);
                if (!correct) throw new Error("Invalid password.");

                if (!user.token) {
                    const token = await generateToken();
                    await db.setToken(user.username, token)
                }

                return user.toJSON();
            }
        })
    ],
    session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.token = user.token;
                token.username = user.username;
                token.isAdmin = user.isAdmin;
            }
            return token;
        },
        async session({ session, token }) {
            session.user = { token: token.token, username: token.username, isAdmin: token.isAdmin };
            return session;
        }
    },
    pages: {
        signIn: "/login",
    }
});