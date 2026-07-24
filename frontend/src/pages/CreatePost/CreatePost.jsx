import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./CreatePost.css";

function CreatePost() {
  const location = useLocation();
  const editPost = location.state?.post;

  const [post, setPost] = useState({
    title: "",
    caption: "",
    media_url: "",
    platform: "",
    scheduled_time: ""
  });
  useEffect(() => {
  if (editPost) {
    setPost({
      title: editPost.title,
      caption: editPost.caption,
      media_url: editPost.media_url,
      platform: editPost.platform,
      scheduled_time: editPost.scheduled_time?.slice(0, 16),
    });
  }
}, [editPost]);

  const handleChange = (e) => {
    setPost({
      ...post,
      [e.target.name]: e.target.value
    });
  };

  const saveDraft = async () => {

     try {
    const data = {
      ...post,
      scheduled_time: null
    };

    await axios.post("http://127.0.0.1:8000/posts/", data);
    alert("Draft Saved Successfully");
  } catch (error) {
    console.error(error);
    alert("Failed to save draft");
  }
};

const schedulePost = async () => {
  try {
    if (editPost) {
      await axios.put(
        `http://127.0.0.1:8000/posts/${editPost.id}`,
        post
      );

      alert("Post Updated Successfully");
    } else {
      await axios.post(
        "http://127.0.0.1:8000/posts/",
        post
      );

      alert("Post Scheduled Successfully");
    }
  } catch (error) {
    console.error(error);
    alert("Operation Failed");
  }
};
  return (
    <div className="create-post">
      <h2>{editPost ? "Edit Post" : "Create Post"}</h2>

      <input
        type="text"
        name="title"
        placeholder="Title"
        value={post.title}
        onChange={handleChange}
      />

      <br /><br />

      <textarea
        name="caption"
        value={post.caption}
        placeholder="Caption"
        onChange={handleChange}
      />

      <br /><br />

      <input
        type="text"
        name="media_url"
        value={post.media_url}
        placeholder="Media URL"
        onChange={handleChange}
      />

      <br /><br />

      <select
  name="platform"
  value={post.platform}
  onChange={handleChange}
>
  <option value="">Select Platform</option>
  <option value="Instagram">Instagram</option>
  <option value="Facebook">Facebook</option>
  <option value="LinkedIn">LinkedIn</option>
  <option value="Twitter">Twitter</option>
</select>
      <br /><br />

      <input
        type="datetime-local"
        name="scheduled_time"
        value={post.scheduled_time}
        onChange={handleChange}
      />

      <br /><br />

    <div className="buttons">
        <button type="button" onClick={saveDraft}>
        Save Draft
    </button>

    <button type="button" onClick={schedulePost}>
        Schedule
    </button>
    </div>
</div>
);
}


export default CreatePost;