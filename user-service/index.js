const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Type definitions
const typeDefs = `#graphql
  type User {
    id: Int!
    name: String!
    email: String!
  }

  type Query {
    users: [User]
    user(id: Int!): User
  }

  type Mutation {
    createUser(name: String!, email: String!): User
    updateUser(id: Int!, name: String, email: String): User
    deleteUser(id: Int!): User
  }
`;

// Resolvers
const resolvers = {
  Query: {
    users: () => prisma.user.findMany(),
    user: (_, { id }) => prisma.user.findUnique({ where: { id } })
  },
  Mutation: {
    createUser: (_, { name, email }) => 
      prisma.user.create({ data: { name, email } }),
      
    updateUser: (_, { id, ...data }) => 
      prisma.user.update({ where: { id }, data }),
      
    deleteUser: (_, { id }) => 
      prisma.user.delete({ where: { id } })
  }
};

// Start server
const server = new ApolloServer({ typeDefs, resolvers });
startStandaloneServer(server, { listen: { port: 4001 } })
  .then(({ url }) => console.log(`Users service ready at ${url}`));
