import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import SessionWrapper from '@/components/SessionWrapper';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Johen Donate - Platform Donasi Digital",
  description: "Platform donasi digital untuk mendukung creator favorit Anda",
  keywords: "donasi, digital, creator, support, johen donate",
  authors: [{ name: "Johen Donate Team" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionWrapper>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0F2A5F',
                color: '#2563EB',
                border: '2px solid #2563EB',
                fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                fontSize: '14px'
              },
              success: {
                style: {
                  background: '#0F2A5F',
                  color: '#2563EB',
                  border: '2px solid #2563EB',
                },
                iconTheme: {
                  primary: '#2563EB',
                  secondary: '#0F2A5F',
                },
              },
              error: {
                style: {
                  background: '#0F2A5F',
                  color: '#ff6b6b',
                  border: '2px solid #ff6b6b',
                },
                iconTheme: {
                  primary: '#ff6b6b',
                  secondary: '#0F2A5F',
                },
              },
            }}
          />
        </SessionWrapper>
      </body>
    </html>
  );
}
