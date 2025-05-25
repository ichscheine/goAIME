import axios from 'axios';

// Separate function for direct problem fetch to debug URL issues
const directFetchProblem = async (contest, year, problemNumber) => {
  try {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';
    
    // Construct a query string for the contest and year from the params
    const contestId = `${contest.replace(/\s+/g, '')}_${year}`;
    console.log('Constructed contest_id:', contestId);
    
    // IMPORTANT FIX: Manually construct the full URL without using axios config
    const fullUrl = `${API_BASE_URL}/problems`;
    const queryParams = new URLSearchParams({
      contest_id: contestId,
      problem_number: problemNumber
    }).toString();
    
    const finalUrl = `${fullUrl}?${queryParams}`;
    console.log('Making direct fetch with fully constructed URL:', finalUrl);
    
    // Make the request with the full manually constructed URL
    const response = await fetch(finalUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Fetch API response:', data);
    
    // Extract the actual problem data
    let problemData = data;
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      problemData = data.data[0];
    }
    
    // Process fields for consistency
    if (problemData) {
      if (problemData.contest_id) {
        const parts = problemData.contest_id.split('_');
        if (parts.length === 2) {
          problemData.year = parts[1];
          problemData.contest = parts[0].replace(/(\d+)([A-Z])/g, '$1 $2');
        }
      }
      
      if (!problemData.description && problemData.problem_text) {
        problemData.description = problemData.problem_text;
      }
      
      if (problemData.solution) {
        if (problemData.solution.startsWith("++")) {
          problemData.formattedSolution = problemData.solution
            .replace(/\+\+([^+]+)\+\+/g, '<strong>$1</strong>');
        }
      }
    }
    
    return problemData;
  } catch (error) {
    console.error('Error in directFetchProblem:', error);
    throw error;
  }
};

export { directFetchProblem };
