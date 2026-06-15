import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { getApiOrigin } from './api-config';

// URL do endpoint GraphQL obtido dinamicamente a partir do origin
const getGraphqlUrl = () => {
  const origin = getApiOrigin();
  return `${origin}/graphql`;
};

let clientInstance: ApolloClient<any> | null = null;

/**
 * Retorna uma instância do Apollo Client.
 * Cria uma nova instância no lado do servidor (SSR) para evitar vazamento de cache,
 * e reutiliza uma instância única (singleton) no navegador.
 */
export function getApolloClient() {
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    return createApolloClient();
  }

  if (!clientInstance) {
    clientInstance = createApolloClient();
  }

  return clientInstance;
}

function createApolloClient() {
  const httpLink = new HttpLink({
    uri: getGraphqlUrl(),
    // Envia os cookies da sessão para permitir a autenticação JWT automática baseada em cookies
    credentials: 'include',
  });

  return new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    ssrMode: typeof window === 'undefined',
  });
}

// Exporta o client padrão (apenas no browser, ou usar getApolloClient() para ser seguro em SSR)
export const apolloClient = typeof window !== 'undefined' ? getApolloClient() : null;
