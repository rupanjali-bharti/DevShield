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
  const response = await axios.post(
    `${BASE_URL}/api/git/${projectName}/terminal`,
    { command }
  );
  return response.data;
};