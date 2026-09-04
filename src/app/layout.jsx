import "./globals.css";

import { AuthProvider } from "../context/AuthProvider";
import PageMetadataManager from "@/components/layout/PageMetadataManager";
import ToastProvider from "@/components/layout/ToastProvider";
import { ThemeProvider } from "@/context/ThemeProvider";
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("qms-theme");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.dataset.theme="dark";document.documentElement.style.colorScheme="dark";}else{document.documentElement.dataset.theme="light";document.documentElement.style.colorScheme="light";}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider />
            <PageMetadataManager />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
