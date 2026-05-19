import axios from "axios";

const BASE_URL = "http://localhost:3001";

export const cloneRepo = async (repoUrl, projectName) => {
  const response = await axios.post(`${BASE_URL}/api/git/clone`, {
    repoUrl,
    projectName,
  });
  return response.data;
};

export const getFileContent = async (projectName, filePath) => {
  const response = await axios.get(`${BASE_URL}/api/files/${projectName}`, {
    params: { filePath },
  });
  return response.data.content;
};

export const saveFile = async (projectName, filePath, content) => {
  const response = await axios.post(
    `${BASE_URL}/api/files/${projectName}`,
    { filePath, content }
  );
  return response.data;
};

export const executeTerminalCommand = async (projectName, command) => {
  try {
    // Detect if it's a git commit command
    if (command.trim().startsWith("git commit")) {
      // Extract message if present
      const messageMatch = command.match(/-m\s+["']([^"']*)["']/);
      const message = messageMatch ? messageMatch[1] : "Auto commit from DevShield";
      
      const response = await axios.post(
        `${BASE_URL}/api/git/${projectName}/commit`,
        { message }
      );
      return response.data;
    }
    
    const response = await axios.post(
      `${BASE_URL}/api/git/${projectName}/terminal`,
      { command }
    );
    return response.data;
  } catch (error) {
    const errorData = error.response?.data;
    return {
      success: false,
      error: errorData?.error || error.message,
      details: errorData?.details,
      output: errorData?.output || "",
    };
  }
};

export const configureGit = async (projectName, name, email) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/git/${projectName}/configure-git`,
      { name, email }
    );
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

export const getGitInfo = async (projectName) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/git/${projectName}/info`
    );
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};