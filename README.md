1. What do database migrations do and why are they useful?
Database migrations are a means of handling changes to the schema of the database over time.
They enable developers to add, change, or remove tables and columns in a versioned and controlled way.
Migrations are useful since they provide consistency between development, testing, and production environments
and simplify tracking and applying changes without needing manual intervention.

3. How does GraphQL differ from REST for CRUD operations?
GraphQL is different from REST in that clients can ask specifically for the data they require in one query,
without over-fetching or under-fetching of data.
In REST, every endpoint usually returns a defined structure of data,
 but GraphQL returns a dynamic schema where clients can choose fields that they require.
This makes GraphQL more efficient and flexible to use with complex applications.
