import { betterAuth } from 'better-auth';
import { handlers } from 'better-auth/next';

export const auth = betterAuth({
  socialProviders: {
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID as string,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
    },
  },
});

export const { GET, POST } = handlers(auth);
