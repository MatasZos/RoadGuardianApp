// This file sets up the NextAuth authentication handler for the application. It imports the necessary NextAuth function and the authentication options defined in a separate module. 
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
