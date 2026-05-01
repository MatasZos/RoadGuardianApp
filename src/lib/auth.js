import Credentials from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import { cleanString } from "@/lib/utils";
import bcrypt from "bcryptjs";

// NextAuth configuration for email/password authentication, using MongoDB to store user data
export const authOptions = {
  session: { strategy: "jwt" },

  // custom credential provider for email/password authentication
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      // authorize function to validate user credentials and return user object if valid
      async authorize(credentials) {
        const email = cleanString(credentials?.email)?.toLowerCase();
        const password = cleanString(credentials?.password);

        // If email or password is missing, return null to indicate failed authentication
        if (!email || !password) return null;
        const client = await clientPromise;
        const db = client.db("login");
        const users = db.collection("user");
        const user = await users.findOne({ email });
        // If user is not found or doesn't have a password hash, return null to indicate failed authentication
        if (!user || !user.passwordHash) return null;

        // Compare the provided password with the stored password hash using bcrypt. If they don't match, return null to indicate failed authentication
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // If authentication is successful, return a user object containing the user's id, name, email, and account type 
        return {
          id: user._id.toString(),
          name: user.fullName,
          email: user.email,
          accountType: user.accountType || "user",
        };
      },
    }),
  ],

  //callbacks to include additional info in the JWT token and session, such as user id, name, and account type, which can be used for authorization and personalization in the app
  //JWT is used to store user info in the session cookie, and the session callback makes that info available in the session object on the client side
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accountType = user.accountType;
        token.name = user.name;
      }
      return token;
    },

    // The session callback is called whenever a session is checked. It receives the session object and the JWT token. If the session has a user object, it add the user's id, account type, and name from the token to the session.user object. This allows us to access this information on the client side through the session.
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.accountType = token.accountType;
        session.user.name = token.name;
      }
      return session;
    },
  },

  //when a user tries to access a protected page without being authenticated, they will be redirected to the /login page
  pages: {
    signIn: "/login",
  },

  //secret environment variable used to sign the JWT tokens for session management.
  secret: process.env.NEXTAUTH_SECRET,
};
