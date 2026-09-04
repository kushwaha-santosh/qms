import "./globals.css";

import { AuthProvider } from "../context/AuthProvider";
import PageMetadataManager from "@/components/layout/PageMetadataManager";
import ToastProvider from "@/components/layout/ToastProvider";
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider />
          <PageMetadataManager />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
