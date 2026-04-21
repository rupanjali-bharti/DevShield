import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleClone = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repo URL");
      return;
    }
    if (!projectName.trim()) {
      setError("Please enter a project name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:3001/api/git/clone",
        { repoUrl, projectName }
      );

      navigate("/workspace", {
        state: {
          projectName,
          fileTree: response.data.fileTree
        }
      });
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to clone repository"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            Dev<span className="text-green-400">Shield</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            AI-powered security-first development environment
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Repo URL */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-1 block">
            GitHub Repository URL
          </label>
          <input
            type="text"
            placeholder="https://github.com/username/repo"
            value={repoUrl}
            onChange={(e) => {
              setRepoUrl(e.target.value);
              setError("");
            }}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Project Name */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-1 block">
            Project Name
          </label>
          <input
            type="text"
            placeholder="my-project"
            value={projectName}
            onChange={(e) => {
              setProjectName(
                e.target.value.replace(/\s+/g, "-").toLowerCase()
              );
              setError("");
            }}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Button */}
        <button
          onClick={handleClone}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200"
        >
          {loading ? "Cloning repository..." : "Open in DevShield"}
        </button>

      </div>
    </div>
  );
}

export default Home;