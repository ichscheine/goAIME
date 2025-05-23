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
      console.log('API Call: getProblem with params:', params);
      
      // Log the full URL being requested
      const url = `${API_BASE_URL}/api/problems`;
      console.log('Request URL:', url);
      
      const response = await apiClient.get('/problems', { params });
      
      console.log('API Response:', response);
      
      if (!response.data) {
        console.error('No data in response');
        throw new Error('No data received from API');
      }
      
      return response;
    } catch (error) {
      console.error('API Error:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  },
  
  getRandomProblem: async (filters = {}) => {
    try {
      console.log('API Call: getRandomProblem with filters:', filters);
      
      // Add /api prefix to the URL
      const response = await apiClient.get('/api/problems/random', { params: filters });
      
      console.log('Problem data from MongoDB:', response.data);
      
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
          console.log('Answer choices found:', problemData.answer_choices);
        }
        
        // Ensure correct_answer is available
        if (problemData.correct_answer) {
          console.log('Correct answer found:', problemData.correct_answer);
        }
        
        // Process solution if available
        if (problemData.solution) {
          // Format solution text if needed
          if (problemData.solution.startsWith("++")) {
            // Special formatting in solution text
            problemData.formattedSolution = problemData.solution
              .replace(/\+\+([^+]+)\+\+/g, '<strong>$1</strong>');
          }
          console.log('Solution found');
        }
        
        // Check for image_url
        if (problemData.image_url) {
          console.log('Image URL found:', problemData.image_url);
        }
        
        // Check for similar_problems
        if (Array.isArray(problemData.similar_problems) && problemData.similar_problems.length > 0) {
          console.log('Similar problems found:', problemData.similar_problems.length);
        }
        
        // Ensure difficulty is available
        if (problemData.difficulty) {
          console.log('Difficulty found:', problemData.difficulty);
        }
        
        // Check for topics
        if (Array.isArray(problemData.topics) && problemData.topics.length > 0) {
          console.log('Topics found:', problemData.topics.length);
        }
        
        console.log('Processed problem data:', problemData);
      }
      
      return {
        ...response,
        data: problemData // Return the processed data
      };
    } catch (error) {
      console.error('API Error in getRandomProblem:', error);
      throw error;
    }
  },

  initializeSession: async (options = {}) => {
    try {
      console.log('API Call: initializeSession with options:', options);
      
      const response = await apiClient.post('/api/problems/session', options);
      
      console.log('Session initialization response:', response.data);
      
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
      console.error('API Error in initializeSession:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  },

  getNextProblem: async (params = {}) => {
    try {
      console.log('API Call: getNextProblem with params:', params);
      
      // Call the correct endpoint with session_id
      const response = await apiClient.get('/api/problems/next', { params });
      
      console.log('Next problem data from MongoDB:', response.data);
      
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
          console.log('Answer choices found:', problemData.answer_choices);
        }
        
        // Ensure correct_answer is available
        if (problemData.correct_answer) {
          console.log('Correct answer found:', problemData.correct_answer);
        }
        
        // Process solution if available
        if (problemData.solution) {
          // Format solution text if needed
          if (problemData.solution.startsWith("++")) {
            // Special formatting in solution text
            problemData.formattedSolution = problemData.solution
              .replace(/\+\+([^+]+)\+\+/g, '<strong>$1</strong>');
          }
          console.log('Solution found');
        }
        
        // Check for image_url
        if (problemData.image_url) {
          console.log('Image URL found:', problemData.image_url);
        }
        
        // Check for similar_problems
        if (Array.isArray(problemData.similar_problems) && problemData.similar_problems.length > 0) {
          console.log('Similar problems found:', problemData.similar_problems);
        }
        
        // Ensure difficulty is available
        if (problemData.difficulty) {
          console.log('Difficulty found:', problemData.difficulty);
        }
        
        // Check for topics
        if (Array.isArray(problemData.topics) && problemData.topics.length > 0) {
          console.log('Topics found:', problemData.topics.length);
        }
        
        // Check for session progress info
        if (problemData.session_progress) {
          console.log('Session progress:', 
            `${problemData.session_progress.current}/${problemData.session_progress.total}`);
        }
        
        console.log('Processed problem data:', problemData);
      }
      
      return {
        ...response,
        data: problemData
      };
    } catch (error) {
      console.error('API Error in getNextProblem:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
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
    const response = await apiClient.post(
      `/api/sessions/${username}`,
      sessionData
    );
    return response;
  },
  
  uploadAsset: async (username, formData) => {
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
  },

  // Add methods for the new backend endpoints
  getAllProblems: async (filters = {}) => {
    try {
      const response = await apiClient.get('/api/problems', { params: filters });
      return response;
    } catch (error) {
      console.error('API Error in getAllProblems:', error);
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
          console.log('Solution found');
        }
        
        console.log('Processed problem data:', problemData);
      }
      
      return {
        ...response,
        data: problemData
      };
    } catch (error) {
      console.error('API Error in getProblemById:', error);
      throw error;
    }
  },
  
  getProblemByParams: async (params) => {
    try {
      console.log('API Call: getProblemByParams with params:', params);
      
      // Construct a query string for the contest and year from the params
      const contestId = `${params.contest.replace(/\s+/g, '')}_${params.year}`;
      console.log('Constructed contest_id:', contestId);
      
      // For AMC 10A 2022 Problem 1, try direct fetch with the specific ID format
      let response;
      
      // First try direct problem fetch by ID if possible
      if (params.problem_number && contestId) {
        try {
          const problemId = `${contestId}-${params.problem_number}`;
          console.log(`Trying direct fetch with ID: ${problemId}`);
          response = await apiClient.get(`/api/problems/${problemId}`);
          console.log('Direct problem fetch succeeded:', response.data);
        } catch (err) {
          console.log('Direct fetch failed, falling back to query params');
          // Continue with the query parameters approach
          response = await apiClient.get('/api/problems', { 
            params: {
              contest_id: contestId,
              problem_number: params.problem_number
            }
          });
        }
      } else {
        // Use the regular query approach if we don't have all params
        response = await apiClient.get('/api/problems', { 
          params: {
            contest_id: contestId,
            problem_number: params.problem_number
          }
        });
      }
      
      console.log('Raw API response:', response);
      console.log('Problem data from API:', response.data);
      
      // Extract the actual problem data from the response structure
      let problemData = response.data;
      if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        // Unwrap from Flask's success_response format and get the first matching problem
        problemData = response.data.data[0];
        console.log('Unwrapped problem data:', problemData);
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
          console.log('Solution found');
        }
        
        console.log('Processed problem data:', problemData);
      }
      
      return {
        ...response,
        data: problemData
      };
    } catch (error) {
      console.error('API Error in getProblemByParams:', error);
      throw error;
    }
  },

  resetSession: async (data) => {
    try {
      console.log('API Call: resetSession with data:', data);
      const response = await apiClient.post('/api/reset-session', data);
      return response;
    } catch (error) {
      console.error('API Error in resetSession:', error);
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