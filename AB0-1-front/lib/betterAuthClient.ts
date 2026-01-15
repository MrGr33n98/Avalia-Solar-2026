import { createAuthClient } from 'better-auth'

export const betterAuth = createAuthClient({
  baseUrl: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || '',
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

export const signInWithGoogle = () => betterAuth.social.signIn('google')
export const signInWithLinkedIn = () => betterAuth.social.signIn('linkedin')
