import { Geist, Geist_Mono } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "./globals.css";
import Providers from "./providers";
import BootstrapClient from "./components/BootstrapClient";

//Importing google fonts using next/font for styling the app
//Geist Sans for the main text
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
//Geist Mono for technical text 
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
//metadata for the app name and description
export const metadata = {
  title: "RoadGuardian",
  description:
    "Emergency help, maintenance tracking, and document storage for bikers.",
};

//RootLayout component that wraps the entire application
//It makes a HTML structure with the styles and fonts applied, Providers component is for authentication, and BootstrapClient is for using bootstrap components for client side
export default function RootLayout({ children }) {
  return (
    <html lang="en" data-bs-theme="dark">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>{children}</Providers>
        <BootstrapClient />
      </body>
    </html>
  );
}