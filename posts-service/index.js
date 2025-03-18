const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Type definitions
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
    updatePost(id: Int!, title: String, content: String): Post
    deletePost(id: Int!): Post
  }
`;

// Resolvers
const resolvers = {
  Query: {
    posts: () => prisma.post.findMany(),
    post: (_, { id }) => prisma.post.findUnique({ where: { id } })
  },
  Mutation: {
    createPost: (_, { title, content, authorId }) => 
      prisma.post.create({ data: { title, content, authorId } }),
      
    updatePost: (_, { id, ...data }) => 
      prisma.post.update({ where: { id }, data }),
      
    deletePost: (_, { id }) => 
      prisma.post.delete({ where: { id } })
  }
};

// Start server
const server = new ApolloServer({ typeDefs, resolvers });
startStandaloneServer(server, { listen: { port: 4002 } })
  .then(({ url }) => console.log(`Posts service ready at ${url}`));
