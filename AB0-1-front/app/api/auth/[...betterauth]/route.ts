import { betterAuth } from 'better-auth';
import { toNextJsHandler, nextCookies } from 'better-auth/next-js';

const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET as string,
  socialProviders: {
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID as string,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
});

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth);
