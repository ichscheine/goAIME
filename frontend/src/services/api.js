import axios from 'axios';

// Use environment variable if available, fall back to your hardcoded URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(config => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    if (userData && userData.token) {
      config.headers.Authorization = `Bearer ${userData.token}`;
    }
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      // You could redirect to login page here
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);



// Keep your existing API methods but use the apiClient instance
const api = {
  getProblem: async (params) => {
    try {
      // Make request to the problems endpoint
      const response = await apiClient.get('/api/problems', { params });
      
      if (!response.data) {
        throw new Error('No data received from API');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  getRandomProblem: async (filters = {}) => {
    try {
      
      // Add /api prefix to the URL
      const response = await apiClient.get('/api/problems/random', { params: filters });
      
      
      // Extract the actual problem data from the response structure
      let problemData = response.data;
      if (response.data && response.data.data) {
        // Unwrap from Flask's success_response format
        problemData = response.data.data;
      }
      
      // Process the MongoDB response to ensure consistent field names
      if (problemData) {
        // Extract contest and year from contest_id if available
        if (problemData.contest_id) {
          const parts = problemData.contest_id.split('_');
          if (parts.length === 2) {
            problemData.year = parts[1];
            // Convert "AMC10A" to "AMC 10A" for display
            problemData.contest = parts[0].replace(/(\d+)([A-Z])/g, '$1 $2');
          }
        }
        
        // Ensure description field exists (some components might use this)
        if (!problemData.description && problemData.problem_text) {
          problemData.description = problemData.problem_text;
        }
        
        // Make sure we have formatted answer choices
        if (Array.isArray(problemData.answer_choices)) {
        }
        
        // Ensure correct_answer is available
        if (problemData.correct_answer) {
        }
        
        // Process solution if available
        if (problemData.solution) {
          // Format solution text if needed
          if (problemData.solution.startsWith("++")) {
            // Special formatting in solution text
            problemData.formattedSolution = problemData.solution
              .replace(/\+\+([^+]+)\+\+/g, '<strong>$1</strong>');
          }
        }
        
        // Check for image_url
        if (problemData.image_url) {
        }
        
        // Check for similar_problems
        if (Array.isArray(problemData.similar_problems) && problemData.similar_problems.length > 0) {
        }
        
        // Ensure difficulty is available
        if (problemData.difficulty) {
        }
        
        // Check for topics
        if (Array.isArray(problemData.topics) && problemData.topics.length > 0) {
        }
        
      }
      
      return {
        ...response,
        data: problemData // Return the processed data
      };
    } catch (error) {
      throw error;
    }
  },

  initializeSession: async (options = {}) => {
    try {
      
      const response = await apiClient.post('/api/problems/session', options);
      
      
      // Extract the actual session data from the response structure
      let sessionData = response.data;
      if (response.data && response.data.data) {
        // Unwrap from Flask's success_response format
        sessionData = response.data.data;
      }
      
      return {
        ...response,
        data: sessionData
      };
    } catch (error) {
      throw error;
    }
  },

  getNextProblem: async (params = {}) => {
    try {
      
      // Call the correct endpoint with session_id
      const response = await apiClient.get('/api/problems/next', { params });
      
      
      // Extract the actual problem data from the response structure
      let problemData = response.data;
      if (response.data && response.data.data) {
        // Unwrap from Flask's success_response format
        problemData = response.data.data;
      }
      
      // Process the MongoDB response to ensure consistent field names
      if (problemData) {
        // Extract contest and year from contest_id if available
        if (problemData.contest_id) {
          const parts = problemData.contest_id.split('_');
          if (parts.length === 2) {
            problemData.year = parts[1];
            // Convert "AMC10A" to "AMC 10A" for display
            problemData.contest = parts[0].replace(/(\d+)([A-Z])/g, '$1 $2');
          }
        }
        
        // Ensure description field exists (some components might use this)
        if (!problemData.description && problemData.problem_text) {
          problemData.description = problemData.problem_text;
        }
        
        // Make sure we have formatted answer choices
        if (Array.isArray(problemData.answer_choices)) {
        }
        
        // Ensure correct_answer is available
        if (problemData.correct_answer) {
        }
        
        // Process solution if available
        if (problemData.solution) {
          // Format solution text if needed
          if (problemData.solution.startsWith("++")) {
            // Special formatting in solution text
            problemData.formattedSolution = problemData.solution
              .replace(/\+\+([^+]+)\+\+/g, '<strong>$1</strong>');
          }
        }
        
        // Check for image_url
      }
      
      return {
        ...response,
        data: problemData
      };
    } catch (error) {
      throw error;
    }
  },

  registerUser: async (userData) => {
    const response = await apiClient.post('/api/users/register', userData);
    return response;
  },

  loginUser: async (credentials) => {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response;
  },
  
  saveSession: async (username, sessionData) => {
    try {
      // Send session data to the backend for storage
      const response = await apiClient.post(
        `/api/sessions/update`,
        {
          username,
          sessionData
        }
      );
      return response;
    } catch (error) {
      console.error("Error saving session:", error);
      throw error;
    }
  },
  
  uploadAsset: async (username, formData) => {
    try {
      const response = await apiClient.post(
        `/api/assets/upload/${username}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response;
    } catch (error) {
      console.error("Error uploading asset:", error);
      throw error;
    }
  },

  // Add methods for the new backend endpoints
  getAllProblems: async (filters = {}) => {
    try {
      const response = await apiClient.get('/api/problems', { params: filters });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Get user progress data
  getUserProgress: async (username) => {
    try {
      const response = await apiClient.get(`/api/user/progress/${username}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Get cohort metrics for a user
  getCohortMetrics: async (username) => {
    try {
      const response = await apiClient.get(`/api/cohort/metrics/${username}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  getProblemById: async (id) => {
    try {
      const response = await apiClient.get(`/api/problems/${id}`);
      
      // Extract the actual problem data from the response structure
      let problemData = response.data;
      if (response.data && response.data.data) {
        // Unwrap from Flask's success_response format
        problemData = response.data.data;
      }
      
      // Process the response to ensure consistent field names
      if (problemData) {
        // Extract contest and year from contest_id if available
        if (problemData.contest_id) {
          const parts = problemData.contest_id.split('_');
          if (parts.length === 2) {
            problemData.year = parts[1];
            // Convert "AMC10A" to "AMC 10A" for display
            problemData.contest = parts[0].replace(/(\d+)([A-Z])/g, '$1 $2');
          }
        }
        
        // Ensure description field exists
        if (!problemData.description && problemData.problem_text) {
          problemData.description = problemData.problem_text;
        }
        
        // Process solution if available
        if (problemData.solution) {
          // Format solution text if needed
          if (problemData.solution.startsWith("++")) {
            problemData.formattedSolution = problemData.solution
              .replace(/\+\+([^+]+)\+\+/g, '<strong>$1</strong>');
          }
        }
        
      }
      
      return {
        ...response,
        data: problemData
      };
    } catch (error) {
      throw error;
    }
  },
  
  getProblemByParams: async (params) => {
    try {
      
      // Construct a query string for the contest and year from the params
      const contestId = `${params.contest.replace(/\s+/g, '')}_${params.year}`;
      
      // Always use the query parameter approach since it's more reliable
      let response;
      
      // Always use the /api prefix for backend routes
      response = await apiClient.get('/api/problems', { 
        params: {
          contest_id: contestId,
          problem_number: params.problem_number
        }
      });
      
      
      
      // Extract the actual problem data from the response structure
      let problemData = null;
      
      // Handle paginated response format (standard from backend)
      if (response.data && response.data.data && response.data.data.items && response.data.data.items.length > 0) {
        problemData = response.data.data.items[0];
      }
      // Handle array response format
      else if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        problemData = response.data.data[0];
      }
      // Handle direct object response
      else if (response.data && response.data.data && !Array.isArray(response.data.data)) {
        problemData = response.data.data;
      }
      // Fall back to raw response data
      else if (response.data) {
        problemData = response.data;
      }
      else {
      }
      
      // Process the response to ensure consistent field names
      if (problemData) {
        // Extract contest and year from contest_id if available
        if (problemData.contest_id) {
          const parts = problemData.contest_id.split('_');
          if (parts.length === 2) {
            problemData.year = parts[1];
            // Convert "AMC10A" to "AMC 10A" for display
            problemData.contest = parts[0].replace(/(\d+)([A-Z])/g, '$1 $2');
          }
        }
        
        // Ensure description field exists
        if (!problemData.description && problemData.problem_text) {
          problemData.description = problemData.problem_text;
        }
        
        // Process solution if available
        if (problemData.solution) {
          // Format solution text if needed
          if (problemData.solution.startsWith("++")) {
            problemData.formattedSolution = problemData.solution
              .replace(/\+\+([^+]+)\+\+/g, '<strong>$1</strong>');
          }
        }
        
      }
      
      return {
        ...response,
        data: problemData
      };
    } catch (error) {
      throw error;
    }
  },

  resetSession: async (data) => {
    try {
      const response = await apiClient.post('/api/reset-session', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  submitSolution: async (problemId, solution) => {
    const response = await apiClient.post(`/api/problems/${problemId}/submit`, { solution });
    return response;
  },

  getUserProfile: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response;
  },

  // Add logout functionality
  logout: () => {
    localStorage.removeItem('user');
    return Promise.resolve();
  }
};

api.getProblem = api.getRandomProblem;
export default api;