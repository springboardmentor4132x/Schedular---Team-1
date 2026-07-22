import { useEffect, useState } from "react";
import axios from "axios";
import "./Drafts.css";

function Drafts() {
  const [posts, setPosts] = useState([]);

  const fetchDrafts = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/posts/?status=draft"
      );
      setPosts(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const deletePost = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/posts/${id}`);
      fetchDrafts();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  return (
    <div className="drafts">
      <h2>Draft Posts</h2>

      {posts.length === 0 ? (
        <p>No Draft Posts</p>
      ) : (
        posts.map((post) => (
          <div className="draft-card" key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.caption}</p>

            <button>Edit</button>

            <button onClick={() => deletePost(post.id)}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Drafts;