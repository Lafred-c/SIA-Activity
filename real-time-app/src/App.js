import React, { useState, useEffect } from 'react';
import { gql, useQuery, useSubscription, useMutation } from '@apollo/client';

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

function App() {
  const { loading, error, data } = useQuery(GET_POSTS);
  const { data: subscriptionData } = useSubscription(POST_ADDED);
  const [posts, setPosts] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [createPost] = useMutation(CREATE_POST, {
    refetchQueries: [{ query: GET_POSTS }], // This will refresh the list after creating a post
  });

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

  const handleCreatePost = () => {
    createPost({
      variables: {
        title: newTitle,
        content: newContent,
        authorId: 1, // You might want to let the user select the author as well
      },
    });
    setNewTitle('');
    setNewContent('');
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

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
            <h2 style={{ color: '#555' }}>{post.title}</h2>
            <p style={{ color: '#777' }}>{post.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
