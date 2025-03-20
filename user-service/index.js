const { ApolloServer } = require('@apollo/server');
const { createServer } = require('http');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { PubSub } = require('graphql-subscriptions');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const pubsub = new PubSub();

const typeDefs = `#graphql
  type Post {
    id: Int!
    title: String!
    content: String!
    authorId: Int!
  }

  type Query {
    posts: [Post]
    post(id: Int!): Post
  }

  type Mutation {
    createPost(title: String!, content: String!, authorId: Int!): Post
  }

  type Subscription {
    postAdded: Post
  }
`;

const resolvers = {
  Query: {
    posts: () => prisma.post.findMany(),
    post: (_, { id }) => prisma.post.findUnique({ where: { id } }),
  },
  Mutation: {
    createPost: async (_, { title, content, authorId }) => {
      const newPost = await prisma.post.create({ data: { title, content, authorId } });
      pubsub.publish('POST_ADDED', { postAdded: newPost });
      return newPost;
    },
  },
  Subscription: {
    postAdded: {
      subscribe: () => pubsub.asyncIterator(['POST_ADDED']),
    },
  },
};

// Create the schema, which will be the basis for all GraphQL operations
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create an Express app and HTTP server; we will attach both later.
const httpServer = createServer();

// Create WebSocket server using the HTTP server
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/',
});

// Hand in the schema we just created and have the
// WebSocketServer start listening.
const serverCleanup = useServer({ schema }, wsServer);

// Set up Apollo Server
const server = new ApolloServer({
  schema: schema,
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

const startApolloServer = async () => {
  await server.start();
  server.applyMiddleware({ app, path: "/" });
  // Now that our HTTP server is fully set up, actually listen.
  httpServer.listen(PORT, () => {
    console.log(`🚀 Query endpoint ready at http://localhost:${PORT}`);
    console.log(`🚀 Subscription endpoint ready at ws://localhost:${PORT}`);
  });
};
