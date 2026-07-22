import { useEffect, useState } from "react";
import axios from "axios";
import "./SchedulePosts.css";

function ScheduledPosts() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await axios.get(
      "http://127.0.0.1:8000/posts/?status=scheduled"
    );
    setPosts(res.data);
  };

  return (
    <div className="scheduled-posts">
      <h2>Scheduled Posts</h2>

      {posts.map((post) => (
        <div className="post-card" key={post.id}>
          <h3>{post.title}</h3>

          <p>{post.caption}</p>

          <p>
            <strong>Platform:</strong> {post.platform}
          </p>

          <p>
            <strong>Scheduled:</strong> {post.scheduled_time}
          </p>

          <button>Reschedule</button>
          <button>Cancel</button>
        </div>
      ))}
    </div>
  );
}

export default ScheduledPosts;