import Credentials from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

function cleanString(v) {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

export const authOptions = {
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = cleanString(credentials?.email)?.toLowerCase();
        const password = cleanString(credentials?.password);

        if (!email || !password) return null;

        const client = await clientPromise;
        const db = client.db("login");
        const users = db.collection("user");

        const user = await users.findOne({ email });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user._id.toString(),
          name: user.fullName,
          email: user.email,
          accountType: user.accountType || "user",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accountType = user.accountType;
        token.name = user.name;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.accountType = token.accountType;
        session.user.name = token.name;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
