import { ApolloServer } from '@apollo/server';
import { createServer } from 'http';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { PubSub } from 'graphql-subscriptions';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';
import { expressMiddleware } from '@apollo/server/express4';

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
    updatePost(id: Int!, title: String!, content: String!): Post
    deletePost(id: Int!): Post
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
    updatePost: async (_, { id, title, content }) => {
      const updatedPost = await prisma.post.update({
        where: { id },
        data: { title, content },
      });
      return updatedPost;
    },
    deletePost: async (_, { id }) => {
      await prisma.post.delete({ where: { id } });
      return null;
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
const app = express();
const httpServer = createServer(app);

// Create WebSocket server using the HTTP server
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
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
  app.use('/graphql', cors(), express.json(), expressMiddleware(server, {
    context: async ({ req }) => ({ token: req.headers.authorization }),
  }));
  const PORT = 4002;
  // Now that our HTTP server is fully set up, actually listen.
  httpServer.listen(PORT, () => {
    console.log(`🚀 Query endpoint ready at http://localhost:${PORT}/graphql`);
    console.log(`🚀 Subscription endpoint ready at ws://localhost:${PORT}/graphql`);
  });
};
app.use(cors());
startApolloServer();
