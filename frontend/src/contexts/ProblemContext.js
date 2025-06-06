import React, { createContext, useState, useRef, useCallback, useContext } from 'react';
import api from '../services/api';
import { useUser } from '../contexts/UserContext';

const ProblemContext = createContext();

export const ProblemProvider = ({ children }) => {
  const { saveSessionResults } = useUser();

  // Problem state
  const [sessionStartTime, setSessionStartTime] = useState(null);
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
  const [pausedTime, setPausedTime] = useState(0); // Track time spent paused
  const [cumulativeTime, setCumulativeTime] = useState(0);
  const [attemptRecords, setAttemptRecords] = useState([]);
  const [incorrectProblems, setIncorrectProblems] = useState([]);
  const [, setUsedProblemNumbers] = useState([]);
  const usedProblemNumbersRef = useRef([]);
  const [answersDisabled, setAnswersDisabled] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [sessionId, setSessionId] = useState(null); // MOVED INSIDE COMPONENT
  const [selectedOption, setSelectedOption] = useState(null); // MOVED INSIDE COMPONENT
  const [isPaused, setIsPaused] = useState(false);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [totalProblems, setTotalProblems] = useState(25); // Update this based on your actual count
  const [unattempted, setUnattempted] = useState(25);
  const [sessionResultsSaved, setSessionResultsSaved] = useState(false); // Track if session results have been saved
  
  // Update totalProblems when student completes or skips a problem
  // Wrap in useCallback to prevent dependencies from changing on every render
  const handleProblemCompleted = useCallback((problem) => {
    setAttempted(attempted + 1);
    setUnattempted(unattempted - 1);
    setTotalProblems(attempted);
  }, [attempted, unattempted, setAttempted, setUnattempted, setTotalProblems]);
  
  // Wrap in useCallback to prevent dependencies from changing on every render
  const handleProblemSkipped = useCallback((problem) => {
    setUnattempted(unattempted - 1);
    setTotalProblems(attempted + unattempted);
  }, [attempted, unattempted, setUnattempted, setTotalProblems]);

  // Request tracking
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const MIN_FETCH_INTERVAL = 500;
  
  // Filter states
  const [selectedContest, setSelectedContest] = useState('AMC 10A');
  const [selectedYear, setSelectedYear] = useState(2022);
  const [selectedSkin, setSelectedSkin] = useState('Minecraft');
  // Mode state
  const [mode, setMode] = useState('');
  
  // Wrapper for setMode to ensure consistent mode values
  const handleSetMode = useCallback((newMode) => {
    // Convert 'contest' to 'competition' for consistency
    setMode(newMode === 'contest' ? 'competition' : newMode);
  }, []);
  const [shuffle, setShuffle] = useState(false);
  
  // Fetch a problem from the backend
  const fetchProblem = useCallback(async (options = {}) => {
    
    // Throttle API requests
    const now = Date.now();
    if (isFetchingRef.current || now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      return false;
    }
    
    try {
      const now = Date.now();
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

      // Call handleProblemCompleted or handleProblemSkipped here
      if (response.data.completed) {
        handleProblemCompleted(response.data);
      } else if (response.data.skipped) {
        handleProblemSkipped(response.data);
      }

      setLoading(false);
      isFetchingRef.current = false;
    } catch (error) {
      setError(error);
      setLoading(false);
      isFetchingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedContest, currentIndex, shuffle, handleProblemCompleted, handleProblemSkipped]);

  // Fetch a problem from the backend and update the problem state
  // eslint-disable-next-line no-unused-vars
  const fetchProblemAndUpdateState = useCallback(async (options = {}) => {
    try {
      // eslint-disable-next-line no-unused-vars
      const fetchOptions = {
        ...options,
        selectedYear: options.year || selectedYear, 
        selectedContest: options.contest || selectedContest, 
        currentIndex: options.index || currentIndex,
        shuffle: options.shuffle !== undefined ? options.shuffle : shuffle
      };
      
      const response = await fetchProblem(options);
      
      // Extract problem data from the response
      const problemData = response.data;
      
      if (!problemData) {
        console.error('No problem data in response');
        setError('No problem data received');
        return false;
      }
      
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
      
      // Define the current time before using it
      const now = Date.now();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedContest, currentIndex, shuffle, fetchProblem]);
  
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
    setSessionResultsSaved(false); // Reset session results saved flag
  }, []);
  
  const startSession = useCallback(async () => {
    const currentTime = Date.now();
    setSessionStartTime(currentTime);
  
    if (!mode) {
      setError("Please select a mode before starting");
      return false;
    }
    
    resetSession();
    
    try {
      setLoading(true);
      setSessionStarted(true);
      
      // Initialize the session first
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

      if (sessionResult?.data?.total_problems) {
        setTotalProblems(sessionResult.data.total_problems);
      } else {
        // Default if backend doesn't provide this information
        setTotalProblems(25);
      }
      
      // Store the session ID
      const sessionId = sessionResult.data.session_id;
      setSessionId(sessionId);
      
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
      setAnswersDisabled(false); // <--- ADD THIS LINE
      
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
      setAnswersDisabled(false); // <--- ADD THIS LINE
      
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

        // Only save session results if they haven't been saved already
        if (!sessionResultsSaved) {
          const sessionData = {
            session_id: sessionId || `session_${Date.now()}`,
            score,
            attempted,
            totalTime: cumulativeTime,
            year: selectedYear,
            contest: selectedContest,
            mode: mode,
            completed_at: new Date().toISOString(),
            problems_attempted: attemptRecords.map(record => ({
              problem_number: record.problemNumber,
              problem_id: record.problem_id,
              correct: record.isCorrect || record.correct,
              selected_answer: record.selectedAnswer || record.choice,
              correct_answer: record.correctAnswer,
              time_spent: record.timeSpent,
              timestamp: record.timestamp,
              difficulty: record.difficulty,
              topics: record.topics || []
            }))
          };
          
          console.log("Session complete, saving results:", sessionData);
          try {
            const saveResult = await saveSessionResults(sessionData);
            if (saveResult) {
              setSessionResultsSaved(true); // Mark as saved
              console.log("Session results saved successfully");
            } else {
              console.warn("Session save returned false, will retry on next attempt");
              // Don't mark as saved to allow retry
            }
          } catch (err) {
            console.error("Error saving session results:", err);
            // Don't mark as saved to allow retry
          }
        } else {
          console.log("Session results already saved, skipping duplicate save");
        }
      }
      
      throw error; // Re-throw to let the component handle it
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, setProblem, setProblemStartTime, setAnswered, setSelectedOption, setProblemStatementWithMeta, setSessionComplete, score, attempted, cumulativeTime, attemptRecords, saveSessionResults, sessionResultsSaved, mode, selectedContest, selectedYear]);
  
  const handleOptionSelect = useCallback((option) => {
    if (answersDisabled) return;
  
  
    setSelectedOption(option);
    setAnswersDisabled(true);
    setAnswered(true);
  
    const isCorrect = option === problem.answer; // Compare the selected option with the correct answer
  
    // Calculate time spent on this problem in milliseconds
    const endTime = Date.now();
    let timeSpentMs = endTime - problemStartTime;
    
    // Subtract paused time for more accurate time measurement
    if (pausedTime > 0) {
      timeSpentMs -= pausedTime;
      
      // Reset pausedTime after using it
      setPausedTime(0);
    }
  
    // Ensure timeSpentMs is at least 100ms to avoid negative or zero values from timing glitches
    timeSpentMs = Math.max(100, timeSpentMs);
    
  
    // Update score if answer is correct
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
    } else {
      // Add to incorrect problems list for review
      setIncorrectProblems(prev => [...prev, currentIndex]);
    }
  
    const attemptRecord = {
      problemNumber: currentIndex, // Use the actual problem number
      problem_id: problem._id || problem.id, // Add problem ID
      attempted: true,                // Explicitly marks as attempted
      isCorrect: isCorrect,           // Boolean for correctness
      correct: isCorrect,             // Add for compatibility with ProblemView records
      selectedAnswer: option,         // User's selected answer
      correctAnswer: problem.answer || problem.correct_answer, // Store correct answer
      timeSpent: timeSpentMs,         // Store in milliseconds for consistent access
      time: timeSpentMs / 1000,       // Also include seconds for backward compatibility
      timestamp: new Date().toISOString(), // Timestamp of the attempt
      difficulty: problem.difficulty, // Add difficulty if available
      topics: problem.topics || [],   // Add topics if available
      contest: problem.contest || selectedContest, // Add contest info
      year: problem.year || selectedYear,         // Add year info
      problem_type: problem.type || problem.problem_type // Add problem type if available
    };
  
  
    // Add to attempt records using a function to ensure state updates properly
    setAttemptRecords(prev => {
      const newRecords = [...prev, attemptRecord];
      return newRecords;
    });
  
    // Track that we've attempted one more problem
    setAttempted(prev => prev + 1);
  
    // Calculate elapsed time for this problem
    setCumulativeTime(prev => prev + timeSpentMs);
  
    // Move to next problem after a short delay
    setTimeout(() => {
      nextProblem();
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, problemStartTime, pausedTime, answersDisabled, currentIndex, setSelectedOption, setAnswersDisabled, 
      setAnswered, setScore, setIncorrectProblems, setAttemptRecords, setAttempted, setCumulativeTime, nextProblem, selectedContest, selectedYear]);

  // Reference to track pause start time
  const pauseStartTimeRef = useRef(null);

  const handlePauseSession = useCallback(() => {
    if (isPaused) return; // Prevent duplicate pause actions
    
    setIsPaused(true);
    // Store the time when paused to calculate elapsed time correctly
    const pauseTime = Date.now();
    pauseStartTimeRef.current = pauseTime;
    
  }, [isPaused]);
  
  const handleResumeSession = useCallback(() => {
    if (!isPaused) return; // Only resume if currently paused
    
    // Calculate how long the session was paused
    if (pauseStartTimeRef.current) {
      const pauseDuration = Date.now() - pauseStartTimeRef.current;
      
      // Add this pause duration to our total paused time counter
      setPausedTime(prevPausedTime => prevPausedTime + pauseDuration);
      pauseStartTimeRef.current = null;
    }
    
    setIsPaused(false);
  }, [isPaused]);
  
  const handleRestartSession = useCallback(() => {
    // Logic to restart the current session
    if (window.confirm("Are you sure you want to restart this session? All progress will be reset.")) {
      setCurrentProblemIndex(0);
      setIsPaused(false);
      resetSession();
      
      // Start fresh with the first problem
      const startFresh = async () => {
        try {
          const result = await api.initializeSession({
            shuffle: shuffle,
            year: selectedYear,
            contest: selectedContest,
            ...(mode === "practice" && { skin: selectedSkin })
          });
          
          if (result?.data?.session_id) {
            setSessionId(result.data.session_id);
            nextProblem();
          }
        } catch (err) {
          console.error("Error restarting session:", err);
          setError("Failed to restart session");
        }
      };
      
      startFresh();
    }
  }, [resetSession, shuffle, selectedYear, selectedContest, mode, selectedSkin, nextProblem]);
  
  const handleQuitSession = useCallback(() => {
    if (window.confirm("Are you sure you want to quit this session?")) {
      setSessionStarted(false);
      setIsPaused(false);
      resetSession();
    }
  }, [resetSession]);
  
  // We're removing the unused ref
  // const setPauseTimeRef = useRef(null);

  const completeSession = useCallback(async () => {
    // Check if session results have already been saved
    if (sessionResultsSaved) {
      console.log("Session results already saved, skipping duplicate save in completeSession");
      return;
    }
    
    // Set session as complete immediately to prevent duplicate calls
    setSessionComplete(true);
    
    try {
      // Try to get the user from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        return;
      }
      
      const user = JSON.parse(userData);
      const username = user.username || 'guest';
      
      const now = new Date();
      const sessionDate = now.toISOString();
      
      // Get previous sessions from localStorage for this specific user
      const storageKey = `user_stats_${username}`;
      const storedStats = localStorage.getItem(storageKey);
      let userStats = storedStats ? JSON.parse(storedStats) : {
        sessions: [],
        bestScore: 0,
        lastSession: null
      };
      
      // Generate a unique session ID
      const sessionUniqueId = Date.now();
      
      // Check if this session already exists in the array to prevent duplicates
      const sessionExists = userStats.sessions.some(s => 
        s.date === sessionDate || 
        s.id === sessionUniqueId ||
        (s.score === score && s.attempted === attempted && 
         s.contest === selectedContest && s.year === selectedYear)
      );
      
      // Only add new session if it doesn't already exist
      if (!sessionExists) {
        // Add new session with current stats
        userStats.sessions.push({
          id: sessionUniqueId,
          score,
          attempted,
          timeSpent: cumulativeTime,
          date: sessionDate,
          contest: selectedContest,
          year: selectedYear,
          mode
        });
      } else {
        console.log("Session already exists in local storage, not adding duplicate");
      }
      
      // Update best score if current score is higher
      if (score > userStats.bestScore) {
        userStats.bestScore = score;
      }
      
      // Update last session date
      userStats.lastSession = sessionDate;
      
      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(userStats));
      
      // Use the saveSessionResults function to save to the backend
      if (saveSessionResults) {
        const sessionData = {
          session_id: sessionId || `local_${Date.now()}`,
          score,
          attempted,
          totalTime: cumulativeTime,
          // Add more context to help with debugging
          year: selectedYear,
          contest: selectedContest,
          mode: mode,
          completed_at: new Date().toISOString(),
          problems_attempted: attemptRecords.map(record => ({
            problem_number: record.problemNumber,
            problem_id: record.problem_id,
            correct: record.isCorrect || record.correct,
            selected_answer: record.selectedAnswer || record.choice,
            correct_answer: record.correctAnswer,
            time_spent: record.timeSpent,
            timestamp: record.timestamp,
            difficulty: record.difficulty,
            topics: record.topics || []
          }))
        };
        
        console.log("CompleteSession called, saving session:", sessionData);
        try {
          const saveResult = await saveSessionResults(sessionData);
          if (saveResult) {
            setSessionResultsSaved(true); // Mark as saved
            console.log("Session results saved successfully from completeSession");
          } else {
            console.warn("Session save returned false in completeSession, will retry later");
            // Don't mark as saved to allow retry
          }
        } catch (err) {
          console.error("Failed to save session results from completeSession:", err);
          // Don't mark as saved to allow retry
        }
      } else {
        console.warn("saveSessionResults function not available");
      }
    } catch (error) {
      console.error("Error saving session stats:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, attempted, cumulativeTime, selectedContest, selectedYear, mode, sessionId, saveSessionResults, sessionResultsSaved, attemptRecords]);

  // Solution viewing functionality
  const [solutionProblem, setSolutionProblem] = useState(null);
  const [showingSolution, setShowingSolution] = useState(false);
  const [solutionError, setSolutionError] = useState(null);
  
  const showSolution = useCallback(async (problemNumber, contest, year) => {
    setLoading(true);
    setSolutionError(null);
    
    try {
      // Format the inputs to ensure consistency
      const formattedContest = contest ? contest.trim() : selectedContest;
      const formattedYear = year ? year.toString() : selectedYear.toString();
      const formattedProblemNumber = parseInt(problemNumber, 10);
      
      // Fetch the problem details to get the solution
      const response = await api.getProblemByParams({
        contest: formattedContest,
        year: formattedYear,
        problem_number: formattedProblemNumber
      });
      
      if (response && response.data) {
        
        // Only use the solution if it's provided in the data
        // Don't create a placeholder as solutions should exist
        setSolutionProblem(response.data);
        setShowingSolution(true);
      } else {
        console.error("Failed to fetch solution data - empty response");
        setSolutionError("Could not load the solution. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching solution:", error);
      setSolutionError(`Error: ${error.message || "Failed to fetch solution"}`);
      
      // Try to find the problem in the current session data
      if (attemptRecords && attemptRecords.length > 0) {
        const record = attemptRecords.find(r => r.problemNumber === problemNumber);
        if (record && record.solution) {
          setSolutionProblem(record);
          setShowingSolution(true);
          setSolutionError(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedContest, selectedYear, attemptRecords]);
  
  const hideSolution = useCallback(() => {
    setShowingSolution(false);
    setSolutionProblem(null);
  }, []);

return (
  <ProblemContext.Provider value={{
    totalProblems,
    attempted,
    unattempted,
    handleProblemCompleted,
    handleProblemSkipped,
    problem,
    problemStatementWithMeta,
    loading,
    error,
    sessionStarted,
    sessionComplete,
    score,
    // Remove duplicate "attempted" key
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
    setMode: handleSetMode,
    shuffle,
    setShuffle,
    fetchProblem,
    resetContestProblems,
    startSession,
    completeSession,
    sessionId,
    setSessionId,
    sessionStartTime,
    setSessionStartTime,
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
    setSessionComplete,
    isPaused,
    setIsPaused,
    currentProblemIndex,
    handleOptionSelect,
    handlePauseSession,
    handleResumeSession,
    handleRestartSession,
    handleQuitSession,
    showingSolution,
    solutionProblem,
    solutionError,
    showSolution,
    hideSolution,
    sessionResultsSaved,
    setSessionResultsSaved
  }}>
    {children}
  </ProblemContext.Provider>
);
}; // Closing brace for the ProblemProvider component

export const useProblem = () => useContext(ProblemContext);