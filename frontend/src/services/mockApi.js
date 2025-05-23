// Removed loading problems from local JSON
let problems = null;
let contests = null;

const loadData = async () => {
  throw new Error('Local problem loading is disabled. Use the cloud MongoDB API.');
};

// Get all problems
export const getAllProblems = () => {
  loadData();
  return {
    data: problems,
    status: 200
  };
};

// Get problem by ID
export const getProblemById = (id) => {
  loadData();
  
  // Find problem by problem_number and contest_id
  const [contestId, problemNum] = id.split('-');
  const problem = problems.find(p => 
    p.contest_id === contestId && p.problem_number === parseInt(problemNum, 10)
  );
  
  if (!problem) {
    throw new Error(`Problem with ID ${id} not found`);
  }
  
  // Enrich the problem with parsed metadata
  if (problem.contest_id) {
    const parts = problem.contest_id.split('_');
    if (parts.length === 2) {
      const contestPart = parts[0];
      problem.contest = contestPart.replace(/(\d+)([A-Z])/g, '$1 $2'); // "AMC10A" -> "AMC 10A"
      problem.year = parts[1];
    }
  }
  
  // Map problem_text to problem_statement for compatibility
  if (problem.problem_text) {
    problem.problem_statement = problem.problem_text;
  }
  
  return {
    data: problem,
    status: 200
  };
};

// Get random problem with filters
export const getRandomProblem = (filters = {}) => {
  loadData();
  
  let filteredProblems = [...problems];
  
  // Apply filters
  if (filters.contest) {
    const contestPrefix = filters.contest.replace(/\s+/g, ''); // "AMC 10A" -> "AMC10A"
    filteredProblems = filteredProblems.filter(p => 
      p.contest_id && p.contest_id.startsWith(contestPrefix)
    );
  }
  
  if (filters.year) {
    filteredProblems = filteredProblems.filter(p => 
      p.contest_id && p.contest_id.includes(`_${filters.year}`)
    );
  }
  
  if (filters.difficulty) {
    filteredProblems = filteredProblems.filter(p => 
      p.difficulty === filters.difficulty
    );
  }
  
  if (filters.excludeIds && filters.excludeIds.length > 0) {
    filteredProblems = filteredProblems.filter(p => {
      const id = `${p.contest_id}-${p.problem_number}`;
      return !filters.excludeIds.includes(id);
    });
  }
  
  if (filteredProblems.length === 0) {
    throw new Error('No problems match the filter criteria');
  }
  
  // Get a random problem
  const randomIndex = Math.floor(Math.random() * filteredProblems.length);
  const problem = filteredProblems[randomIndex];
  
  // Enrich the problem with parsed metadata
  if (problem.contest_id) {
    const parts = problem.contest_id.split('_');
    if (parts.length === 2) {
      const contestPart = parts[0];
      problem.contest = contestPart.replace(/(\d+)([A-Z])/g, '$1 $2');
      problem.year = parts[1];
    }
  }
  
  // Map problem_text to problem_statement for compatibility
  if (problem.problem_text) {
    problem.problem_statement = problem.problem_text;
  }
  
  return {
    data: problem,
    status: 200
  };
};

// Get available contests
export const getAvailableContests = () => {
  loadData();
  
  // Extract unique contests from the data
  const uniqueContests = [...new Set(contests.map(c => {
    const parts = c.contest_id.split('_');
    if (parts.length === 2) {
      const contestPart = parts[0];
      return contestPart.replace(/(\d+)([A-Z])/g, '$1 $2'); // "AMC10A" -> "AMC 10A"
    }
    return null;
  }))].filter(Boolean);
  
  return {
    data: uniqueContests,
    status: 200
  };
};

// Get available years for a contest
export const getAvailableYears = (contest) => {
  loadData();
  
  const contestPrefix = contest.replace(/\s+/g, ''); // "AMC 10A" -> "AMC10A"
  
  const years = contests
    .filter(c => c.contest_id.startsWith(contestPrefix))
    .map(c => {
      const parts = c.contest_id.split('_');
      return parts.length === 2 ? parts[1] : null;
    })
    .filter(Boolean);
  
  return {
    data: [...new Set(years)],
    status: 200
  };
};

export default {
  getAllProblems,
  getProblemById,
  getRandomProblem,
  getAvailableContests,
  getAvailableYears
};