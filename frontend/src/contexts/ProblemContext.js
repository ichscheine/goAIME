import React, { createContext, useState, useRef, useCallback, useContext } from 'react';
import api from '../services/api';

const ProblemContext = createContext();

export const ProblemProvider = ({ children }) => {
  // Problem and session state
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [problemStatementWithMeta, setProblemStatementWithMeta] = useState('');
  const [problemStartTime, setProblemStartTime] = useState(null);
  const [cumulativeTime, setCumulativeTime] = useState(0);
  const [attemptRecords, setAttemptRecords] = useState([]);
  const [incorrectProblems, setIncorrectProblems] = useState([]);
  const [, setUsedProblemNumbers] = useState([]);
  const usedProblemNumbersRef = useRef([]);
  const [answersDisabled, setAnswersDisabled] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [sessionId, setSessionId] = useState(null); // MOVED INSIDE COMPONENT
  const [selectedOption, setSelectedOption] = useState(null); // MOVED INSIDE COMPONENT
  
  // Request tracking
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const MIN_FETCH_INTERVAL = 500;
  
  // Filter states
  const [selectedContest, setSelectedContest] = useState('AMC 10A');
  const [selectedYear, setSelectedYear] = useState(2022);
  const [selectedSkin, setSelectedSkin] = useState('Minecraft');
  const [mode, setMode] = useState('');
  const [shuffle, setShuffle] = useState(false);
  
  // Fetch a problem from the backend
  const fetchProblem = useCallback(async (options = {}) => {
    console.log('ProblemContext.fetchProblem called with:', {
      ...options,
      selectedYear: options.year || selectedYear, 
      selectedContest: options.contest || selectedContest, 
      currentIndex: options.index || currentIndex,
      shuffle: options.shuffle !== undefined ? options.shuffle : shuffle
    });
    
    // Throttle API requests
    const now = Date.now();
    if (isFetchingRef.current || now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      console.log('Ignoring fetch request - already fetching or too soon');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      
      const response = await api.getRandomProblem({
        year: options.year || selectedYear,
        contest: options.contest || selectedContest,
        index: options.index || currentIndex,
        shuffle: options.shuffle !== undefined ? options.shuffle : shuffle,
        excludeIds: options.excludeIds || usedProblemNumbersRef.current
      });
      
      console.log('Problem response:', response);
      
      // Extract problem data from the response
      const problemData = response.data;
      
      if (!problemData) {
        console.error('No problem data in response');
        setError('No problem data received');
        return false;
      }
      
      console.log('Setting problem state with:', problemData);
      setProblem(problemData);
      
      // Create problem statement with metadata by extracting from contest_id
      // This handles both direct fields and fields derived from contest_id
      let year = problemData.year;
      let contest = problemData.contest;
      
      // Extract from contest_id if direct fields aren't available
      if (!year || !contest) {
        if (problemData.contest_id) {
          const parts = problemData.contest_id.split('_');
          if (parts.length === 2) {
            year = parts[1];
            contest = parts[0].replace(/(\d+)([A-Z])/g, '$1 $2'); // "AMC10A" -> "AMC 10A"
          }
        }
      }
      
      // Set problem statement with metadata
      const statement = problemData.problem_text || problemData.problem_statement || problemData.content || '';
      const meta = `\n\n**(${year || '?'}, ${contest || '?'}, Problem ${problemData.problem_number || '?'})**`;
      setProblemStatementWithMeta(statement + meta);
      
      // Track this problem in used problems
      if (problemData.problem_number) {
        const newUsedProblems = [...usedProblemNumbersRef.current, problemData.problem_number];
        usedProblemNumbersRef.current = newUsedProblems;
        setUsedProblemNumbers(newUsedProblems);
      }
      
      setProblemStartTime(now);
      return true;
    } catch (err) {
      console.error('Error fetching problem:', err);
      setError(err.message || 'Failed to fetch problem');
      return false;
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [selectedYear, selectedContest, currentIndex, shuffle]);
  
  const resetContestProblems = useCallback(async () => {
    try {
      await api.resetSession({
        contest: selectedContest,
        year: selectedYear,
        shuffle: shuffle
      });
      
      // Reset frontend state
      setUsedProblemNumbers([]);
      usedProblemNumbersRef.current = [];
      setProblem(null);
      setSessionComplete(false);
    } catch (error) {
      console.error("Failed to reset session:", error);
    }
  }, [selectedContest, selectedYear, shuffle]);
  
  const resetSession = useCallback(() => {
    setUsedProblemNumbers([]);
    usedProblemNumbersRef.current = [];
    setAttempted(0);
    setScore(0);
    setCumulativeTime(0);
    setProblem(null);
    setIncorrectProblems([]);
    setAttemptRecords([]);
    setCurrentIndex(1);
    setAnswered(false);
    setSessionComplete(false);
  }, []);
  
  const startSession = useCallback(async () => {
    console.log("startSession called with mode:", mode);
    if (!mode) {
      setError("Please select a mode before starting");
      return false;
    }
    
    resetSession();
    
    try {
      setLoading(true);
      setSessionStarted(true);
      
      // Initialize the session first
      console.log('Initializing session with:', {
        shuffle: shuffle,
        year: selectedYear,
        contest: selectedContest
      });
      
      const sessionResult = await api.initializeSession({
        shuffle: shuffle,
        year: selectedYear,
        contest: selectedContest,
        ...(mode === "practice" && { skin: selectedSkin })
      });
      
      if (!sessionResult?.data?.session_id) {
        console.error("Failed to initialize session", sessionResult);
        setError("Failed to initialize problem session");
        setSessionStarted(false);
        setLoading(false);
        return false;
      }
      
      // Store the session ID
      const sessionId = sessionResult.data.session_id;
      setSessionId(sessionId);
      console.log(`Session initialized with ID: ${sessionId}`);
      
      // Now fetch the first problem
      const result = await api.getNextProblem({ 
        session_id: sessionId 
      });
      
      if (!result?.data) {
        console.error("Failed to fetch first problem");
        setError("Failed to fetch the first problem");
        setSessionStarted(false);
        setLoading(false);
        return false;
      }
      
      // Process the problem data
      setProblem(result.data);
      setProblemStartTime(Date.now());
      setAnswered(false);
      setSelectedOption(null);
      
      const problemData = result.data;
      let year = problemData.year;
      let contest = problemData.contest;

      // Extract from contest_id if direct fields aren't available
      if (!year || !contest) {
        if (problemData.contest_id) {
          const parts = problemData.contest_id.split('_');
          if (parts.length === 2) {
            year = parts[1];
            contest = parts[0].replace(/(\d+)([A-Z])/g, '$1 $2');
          }
        }
      }

      // Set problem statement with metadata
      const statement = problemData.problem_text || problemData.problem_statement || problemData.content || '';
      const meta = `\n\n**(${year || '?'}, ${contest || '?'}, Problem ${problemData.problem_number || '?'})**`;
      setProblemStatementWithMeta(statement + meta);

      console.log('Session started successfully with first problem:', result.data);
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Error starting session:", err);
      setError(`Failed to start session: ${err.message || 'Unknown error'}`);
      setSessionStarted(false);
      setLoading(false);
      return false;
    }
  }, [mode, selectedYear, selectedContest, shuffle, selectedSkin, resetSession]);

  const nextProblem = useCallback(async () => {
    try {
      const result = await api.getNextProblem({ session_id: sessionId });
      
      // Process the problem data
      setProblem(result.data);
      setProblemStartTime(Date.now());
      setAnswered(false);
      setSelectedOption(null);
      
      // Format problem statement with metadata
      const problemData = result.data;
      let year = problemData.year;
      let contest = problemData.contest;
      
      // Extract from contest_id if direct fields aren't available
      if (!year || !contest) {
        if (problemData.contest_id) {
          const parts = problemData.contest_id.split('_');
          if (parts.length === 2) {
            year = parts[1];
            contest = parts[0].replace(/(\d+)([A-Z])/g, '$1 $2');
          }
        }
      }
      
      // Set problem statement with metadata
      const statement = problemData.problem_text || problemData.problem_statement || problemData.content || '';
      const meta = `\n\n**(${year || '?'}, ${contest || '?'}, Problem ${problemData.problem_number || '?'})**`;
      setProblemStatementWithMeta(statement + meta);
      
      return result;
    } catch (error) {
      console.error("Error fetching next problem:", error);
      
      // If we get a 404, this means we've reached the end of the session
      if (error.response && error.response.status === 404) {
        setSessionComplete(true);
      }
      
      throw error; // Re-throw to let the component handle it
    }
  }, [sessionId, setProblem, setProblemStartTime, setAnswered, setSelectedOption, setProblemStatementWithMeta, setSessionComplete]);
  
  return (
    <ProblemContext.Provider value={{
      problem,
      problemStatementWithMeta,
      loading,
      error,
      sessionStarted,
      sessionComplete,
      score,
      attempted,
      currentIndex,
      problemStartTime,
      cumulativeTime,
      attemptRecords,
      incorrectProblems,
      answersDisabled,
      answered,
      selectedContest,
      setSelectedContest,
      selectedYear,
      setSelectedYear,
      selectedSkin,
      setSelectedSkin,
      mode,
      setMode,
      shuffle,
      setShuffle,
      fetchProblem,
      resetContestProblems,
      startSession,
      sessionId,
      setSessionId,
      selectedOption,
      setSelectedOption,
      nextProblem,
      setAnswersDisabled,
      setAnswered,
      setScore,
      setAttempted,
      setCumulativeTime,
      setCurrentIndex,
      setIncorrectProblems,
      setAttemptRecords,
      setSessionComplete
    }}>
      {children}
    </ProblemContext.Provider>
  );
};

export const useProblem = () => useContext(ProblemContext);