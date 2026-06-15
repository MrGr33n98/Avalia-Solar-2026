import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { onError } from '@apollo/client/link/error';
import { track } from './analytics/lazy';
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

  const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, path }) => {
        console.error(`[GraphQL error]: Message: ${message}, Path: ${path}`);
        track('graphql_error', {
          error_message: message,
          error_path: path ? path.join('.') : undefined,
          operation_name: operation.operationName,
        });
      });
    }
    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
      track('graphql_network_error', {
        error_message: networkError.message,
        operation_name: operation.operationName,
      });
    }
  });

  const apqEnabled = process.env.NEXT_PUBLIC_APQ_ENABLED !== 'false';

  let link: any = errorLink.concat(httpLink);

  if (apqEnabled) {
    const sha256Hash = async (query: string) => {
      if (typeof window === 'undefined') {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(query).digest('hex');
      } else {
        const msgBuffer = new TextEncoder().encode(query);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    };

    const persistedQueriesLink = createPersistedQueryLink({
      sha256: sha256Hash,
      useGETForHashedQueries: true,
    });

    link = errorLink.concat(persistedQueriesLink).concat(httpLink);
  }

  return new ApolloClient({
    link: link,
    cache: new InMemoryCache(),
    ssrMode: typeof window === 'undefined',
  });
}

// Exporta o client padrão (apenas no browser, ou usar getApolloClient() para ser seguro em SSR)
export const apolloClient = typeof window !== 'undefined' ? getApolloClient() : null;
