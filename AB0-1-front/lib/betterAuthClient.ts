import { createAuthClient } from 'better-auth/react'

export const betterAuth = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  socialProviders: {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      scopes: ['openid', 'email', 'profile'],
    },
    linkedin: {
      clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      scopes: ['openid', 'profile', 'email'],
    },
  },
})

export const signInWithGoogle = () => betterAuth.signIn.social({ provider: 'google' })
export const signInWithLinkedIn = () => betterAuth.signIn.social({ provider: 'linkedin' })
