import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const handleResponse = async (response) => {
  if (response.status !== 200) {
    throw new Error(response.data?.error || `HTTP error! status: ${response.status}`);
  }
  return response.data;
};

const api = {
  checkConnection: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/checkConnection`);
      return response.status === 200;
    } catch (e) {
      return false;
    }
  },

  getStoredRecordings: async (userId) => {
    const response = await axios.get(`${BASE_URL}/getStoredRecordings?user_id=${userId}`);
    return Array.isArray(response.data.recordings) ? response.data.recordings : [];
  },

  generateMinutes: async (payload) => {
    const response = await axios.post(`${BASE_URL}/generate-minutes`, payload);
    return response.data;
  },

  getZohoRecordings: async (userId) => {
    const response = await axios.get(`${BASE_URL}/recordings?user_id=${userId}`);
    return response.data;
  },
 
  createMeeting: async (payload) => {
    const response = await axios.post(`${BASE_URL}/create-meeting`, payload);
    return response.data;
  },

  saveRecordings: async (userId, recordings) => {
    const response = await axios.post(`${BASE_URL}/saveRecordings`, { userId, recordings });
    return response.data;
  },

  downloadAllTranscripts: async (userId) => {
    const response = await axios.get(`${BASE_URL}/downloadAllTranscripts?user_id=${userId}`);
    return response.data;
  },

  /* -------------------------------------------------- */
  /* Teams & Participants */
  /* -------------------------------------------------- */
  getTeams: async (userId) => {
    const response = await axios.get(`${BASE_URL}/getTeams?user_id=${userId}`);
    return response.data;
  },

  createTeam: async (payload) => {
    const response = await axios.post(`${BASE_URL}/createTeam`, payload);
    return response.data;
  },

  updateTeam: async (payload) => {
    const response = await axios.post(`${BASE_URL}/updateTeam`, payload);
    return response.data;
  },

  deleteTeam: async (teamId, userId) => {
    const response = await axios.delete(`${BASE_URL}/deleteTeam?team_id=${teamId}&user_id=${userId}`);
    return response.data;
  },

  /* -------------------------------------------------- */
  /* Google Sheet                                         */
  /* -------------------------------------------------- */

  listGoogleSheets: async (userId) => {
    const response = await axios.get(`${BASE_URL}/google-workbooks?user_id=${userId}`);
    return response.data;
  },

  listGoogleDriveSheets: async (userId) => {
    const response = await axios.get(`${BASE_URL}/google-drive-list?user_id=${userId}`);
    return response.data;
  },

  manageGoogleSheet: async (userId, sheetId, sheetName, action) => {
    const response = await axios.post(`${BASE_URL}/google-manage-sheet`, {
      userId, sheetId, sheetName, action
    });
    return response.data;
  },

  createGoogleWorkbook: async (userId, name) => {
    const response = await axios.post(`${BASE_URL}/google-create-workbook`, {
      userId, name
    });
    return response.data;
  },

  saveMoMToGoogleSheet: async ({ userId, workbookId, meetingDate, momData, meetingDetails }) => {
    const response = await axios.post(`${BASE_URL}/google-sheet-mom`, {
      userId, workbookId, meetingDate, momData, meetingDetails,
    });
    return response.data;
  },

  /* -------------------------------------------------- */
  /* Automation Settings                                */
  /* -------------------------------------------------- */

  getSyncSettings: async (userId) => {
    const response = await axios.get(`${BASE_URL}/sync-settings?user_id=${userId}`);
    return response.data;
  },

  updateSyncSettings: async (userId, frequency) => {
    const response = await axios.post(`${BASE_URL}/sync-settings`, { userId, frequency });
    return response.data;
  },
};

export default api;
