import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getStoredToken } from './api';

// Constrói a URL do GraphQL baseada nas configurações de ambiente
const getGraphqlUrl = (): string => {
  const customBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (customBase) {
    // Remove o sufixo da API REST /api/v1 se existir
    const origin = customBase.replace(/\/api\/v1\/?$/, '');
    return `${origin}/graphql`;
  }
  const isProduction = process.env.NODE_ENV === 'production';
  const origin = isProduction 
    ? 'https://api.avaliasolar.com.br' 
    : 'http://10.0.2.2:3001'; // 10.0.2.2 é o localhost do host no emulador Android
  return `${origin}/graphql`;
};

const httpLink = createHttpLink({
  uri: getGraphqlUrl(),
});

// Middleware para interceptar as requisições e injetar o token JWT obtido do SecureStore
const authLink = setContext(async (_, { headers }) => {
  const token = await getStoredToken();
  return {
    headers: {
      ...headers,
      'Accept': 'application/json',
      'X-Client': 'android',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

// Inicialização do Apollo Client no App Mobile
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default apolloClient;
