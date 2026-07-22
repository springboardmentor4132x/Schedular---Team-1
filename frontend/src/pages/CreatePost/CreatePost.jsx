import { useState } from "react";
import axios from "axios";
import "./CreatePost.css";

function CreatePost() {
  const [post, setPost] = useState({
    title: "",
    caption: "",
    media_url: "",
    platform: "",
    scheduled_time: ""
  });

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
    await axios.post("http://127.0.0.1:8000/posts/", post);
    alert("Post Scheduled Successfully");
  } catch (error) {
    console.error(error);
    alert("Failed to schedule post");
  }
};

  return (
    <div className="create-post">
      <h2>Create Post</h2>

      <input
        type="text"
        name="title"
        placeholder="Title"
        onChange={handleChange}
      />

      <br /><br />

      <textarea
        name="caption"
        placeholder="Caption"
        onChange={handleChange}
      />

      <br /><br />

      <input
        type="text"
        name="media_url"
        placeholder="Media URL"
        onChange={handleChange}
      />

      <br /><br />

      <select name="platform" onChange={handleChange}>
        <option value="">Select Platform</option>
        <option>Instagram</option>
        <option>Facebook</option>
        <option>LinkedIn</option>
        <option>Twitter</option>
      </select>

      <br /><br />

      <input
        type="datetime-local"
        name="scheduled_time"
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