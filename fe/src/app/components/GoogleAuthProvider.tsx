'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'

export default function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  // Thay thế bằng Client ID thực tế của bạn từ Google Cloud Console
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
}
