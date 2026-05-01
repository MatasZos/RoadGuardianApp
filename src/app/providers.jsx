// file to wrap the application with the SessionProvider from next-auth, which provides authentication context to the entire app
"use client";
import { SessionProvider } from "next-auth/react";
export default function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}