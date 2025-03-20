import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink, split } from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';

// HTTP link
const httpLink = new HttpLink({
  uri: 'http://localhost:4002/graphql', // Replace with your GraphQL server URL
});

// WebSocket link for subscriptions
const wsLink = new WebSocketLink({
  uri: 'ws://localhost:4002/graphql', // Replace with your GraphQL server URL
  options: {
    reconnect: true,
  },
});

// Use split to route queries and mutations over HTTP link, subscriptions over WebSocket link
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);

reportWebVitals();
