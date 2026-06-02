import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Home() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [showNewRepo, setShowNewRepo] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch available workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3001/api/git/list/workspaces"
        );
        setWorkspaces(response.data.workspaces || []);
      } catch (err) {
        console.error("Failed to fetch workspaces:", err);
      } finally {
        setLoadingWorkspaces(false);
      }
    };
    fetchWorkspaces();
  }, []);

  const handleSelectExisting = async () => {
    if (!selectedWorkspace) {
      setError("Please select a repository");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `http://localhost:3001/api/git/${selectedWorkspace}/tree`
      );

      navigate("/workspace", {
        state: {
          projectName: selectedWorkspace,
          fileTree: response.data.fileTree,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to load repository"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloneNew = async () => {
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
          fileTree: response.data.fileTree,
        },
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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Animated background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="min-h-screen flex items-center justify-center px-4 py-20">
          <div className="max-w-2xl w-full">
            {/* Logo and Title */}
            <div className="text-center mb-12">
              <div className="inline-block mb-6">
                <div className="text-6xl font-bold text-white">
                  Dev<span className="text-green-400">Shield</span>
                </div>
              </div>
              <p className="text-xl text-gray-300 mb-4">
                AI-Powered Security-First Development Environment
              </p>
              <p className="text-gray-400 text-sm max-w-lg mx-auto">
                DevShield combines intelligent code analysis with real-time security scanning. Detect vulnerabilities, get AI-powered explanations, and ship secure code with confidence.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 hover:border-green-400 transition-all">
                <div className="text-green-400 text-2xl mb-3">🔒</div>
                <h3 className="text-white font-semibold mb-2">Security First</h3>
                <p className="text-gray-400 text-sm">Real-time vulnerability detection with Bandit & Semgrep</p>
              </div>
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 hover:border-green-400 transition-all">
                <div className="text-green-400 text-2xl mb-3">🤖</div>
                <h3 className="text-white font-semibold mb-2">AI Insights</h3>
                <p className="text-gray-400 text-sm">Get intelligent explanations of security issues</p>
              </div>
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 hover:border-green-400 transition-all">
                <div className="text-green-400 text-2xl mb-3">⚡</div>
                <h3 className="text-white font-semibold mb-2">Fast Analysis</h3>
                <p className="text-gray-400 text-sm">Integrated terminal with instant code auditing</p>
              </div>
            </div>

            {/* Main Card */}
            <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
              
              {/* Error */}
              {error && (
                <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              {/* Existing Repositories Section */}
              {!showNewRepo && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Already Audited Repository
                  </h2>

                  {loadingWorkspaces ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border border-green-400 border-t-transparent"></div>
                    </div>
                  ) : workspaces.length > 0 ? (
                    <>
                      <div className="mb-6">
                        <label className="text-gray-300 text-sm font-medium mb-3 block">
                          Select from your repositories
                        </label>
                        <select
                          value={selectedWorkspace}
                          onChange={(e) => {
                            setSelectedWorkspace(e.target.value);
                            setError("");
                          }}
                          className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-400 appearance-none cursor-pointer"
                          style={{
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(74,222,128)' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/csvg%3e")`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 0.75rem center",
                            backgroundSize: "1.5em 1.5em",
                            paddingRight: "2.5rem",
                          }}
                        >
                          <option value="">Choose a repository...</option>
                          {workspaces.map((ws) => (
                            <option key={ws.name} value={ws.name}>
                              {ws.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={handleSelectExisting}
                        disabled={loading || !selectedWorkspace}
                        className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200 mb-6"
                      >
                        {loading ? "Loading..." : "Open Repository"}
                      </button>

                      {/* Divider */}
                      <div className="flex items-center mb-6">
                        <div className="flex-1 border-t border-gray-600"></div>
                        <span className="px-4 text-gray-400 text-sm font-medium">OR</span>
                        <div className="flex-1 border-t border-gray-600"></div>
                      </div>

                      <button
                        onClick={() => {
                          setShowNewRepo(true);
                          setError("");
                        }}
                        disabled={loading}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200 border border-gray-600"
                      >
                        Add New Repository
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-400 text-center py-8">
                        No repositories found. Let's add your first one!
                      </p>
                      <button
                        onClick={() => setShowNewRepo(true)}
                        className="w-full bg-green-500 hover:bg-green-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                      >
                        Add First Repository
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* New Repository Section */}
              {showNewRepo && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => {
                        setShowNewRepo(false);
                        setRepoUrl("");
                        setProjectName("");
                        setError("");
                      }}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      ← Back
                    </button>
                    <h2 className="text-2xl font-bold text-white">
                      Add New Repository
                    </h2>
                  </div>

                  <div className="mb-4">
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
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

                  <div className="mb-6">
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
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

                  <button
                    onClick={handleCloneNew}
                    disabled={loading}
                    className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                  >
                    {loading ? "Cloning repository..." : "Clone & Open"}
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm">
                Secure your code. Every commit. Every push.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;