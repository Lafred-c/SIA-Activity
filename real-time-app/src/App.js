import React, { useState, useEffect } from 'react';
import { gql, useQuery, useSubscription, useMutation } from '@apollo/client';
import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const httpLink = new HttpLink({
  uri: 'http://localhost:4002/graphql',
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4002/graphql',
    webSocketImpl: window.WebSocket,
  })
);

const link = split(
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

export const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});


// GraphQL queries, mutations, and subscriptions
const GET_POSTS = gql`
  query GetPosts {
    posts {
      id
      title
      content
    }
  }
`;

const POST_ADDED = gql`
  subscription PostAdded {
    postAdded {
      id
      title
      content
    }
  }
`;

const CREATE_POST = gql`
  mutation CreatePost($title: String!, $content: String!, $authorId: Int!) {
    createPost(title: $title, content: $content, authorId: $authorId) {
      id
      title
      content
    }
  }
`;

const UPDATE_POST = gql`
  mutation UpdatePost($id: Int!, $title: String!, $content: String!) {
    updatePost(id: $id, title: $title, content: $content) {
      id
      title
      content
    }
  }
`;

const DELETE_POST = gql`
  mutation DeletePost($id: Int!) {
    deletePost(id: $id) {
      id
    }
  }
`;


function App() {
  // State variables
  const { loading, error, data } = useQuery(GET_POSTS);
  const { data: subscriptionData } = useSubscription(POST_ADDED);
  const [posts, setPosts] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');

  // GraphQL mutations
  const [createPost] = useMutation(CREATE_POST, { refetchQueries: [{ query: GET_POSTS }] });
  const [updatePost] = useMutation(UPDATE_POST, { refetchQueries: [{ query: GET_POSTS }] });
  const [deletePost] = useMutation(DELETE_POST, { refetchQueries: [{ query: GET_POSTS }] });

  // useEffect hooks
  useEffect(() => {
    if (data) {
      setPosts(data.posts);
    }
  }, [data]);

  useEffect(() => {
    if (subscriptionData && subscriptionData.postAdded) {
      setPosts(prevPosts => [...prevPosts, subscriptionData.postAdded]);
    }
  }, [subscriptionData]);

  // Handler functions
  const handleCreatePost = () => {
    createPost({ variables: { title: newTitle, content: newContent, authorId: 1 } });
    setNewTitle('');
    setNewContent('');
  };

  const handleEditPost = (id, title, content) => {
    setEditingPostId(id);
    setEditedTitle(title);
    setEditedContent(content);
  };

  const handleUpdatePost = () => {
    updatePost({ variables: { id: editingPostId, title: editedTitle, content: editedContent } });
    setEditingPostId(null);
    setEditedTitle('');
    setEditedContent('');
  };

  const handleDeletePost = async (id) => {
    try {
      console.log("Attempting to delete post with ID:", id);
      await deletePost({ variables: { id } });
      console.log("Post deleted successfully.");
      // Update local state to remove the deleted post
      setPosts(prevPosts => prevPosts.filter(post => post.id !== id));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };
  
  

  // Loading and error handling
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  // Render the component
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>Real-time Posts</h1>

      {/* Input fields and create button */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <input
          type="text"
          placeholder="Title"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          style={{ padding: '10px', marginRight: '10px', fontSize: '16px' }}
        />
        <input
          type="text"
          placeholder="Content"
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          style={{ padding: '10px', marginRight: '10px', fontSize: '16px' }}
        />
        <button
          onClick={handleCreatePost}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Create Post
        </button>
      </div>

      {/* List of posts */}
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {posts.map(post => (
          <li key={post.id} style={{ marginBottom: '20px', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
            {editingPostId === post.id ? (
              <div>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  style={{ padding: '5px', marginRight: '5px' }}
                />
                <input
                  type="text"
                  value={editedContent}
                  onChange={e => setEditedContent(e.target.value)}
                  style={{ padding: '5px', marginRight: '5px' }}
                />
                <button onClick={handleUpdatePost} style={{ padding: '5px', marginRight: '5px' }}>Update</button>
              </div>
            ) : (
              <div>
                <h2 style={{ color: '#555' }}>{post.title}</h2>
                <p style={{ color: '#777' }}>{post.content}</p>
                <button onClick={() => handleEditPost(post.id, post.title, post.content)} style={{ padding: '5px', marginRight: '5px' }}>Edit</button>
                <button onClick={() => handleDeletePost(post.id)} style={{ padding: '5px' }}>Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
