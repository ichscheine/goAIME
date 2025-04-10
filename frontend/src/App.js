import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import './App.css';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export const DEFAULT_ASSETS = {
  sounds: {
    correct: 'https://goaime-assets.s3.us-east-1.amazonaws.com/sounds/correct.mp3',
    incorrect: 'https://goaime-assets.s3.us-east-1.amazonaws.com/sounds/incorrect.mp3'
  },
  images: {
    feedback: {
      correct: 'https://goaime-assets.s3.us-east-1.amazonaws.com/images/correct.gif',
      incorrect: 'https://goaime-assets.s3.us-east-1.amazonaws.com/images/incorrect.gif'
    }
  }
};

function App() {
  // Audio loading state
  const [audioLoaded, setAudioLoaded] = useState(false);

  // Audio initialization with error handling
  const correctAudio = useMemo(() => {
    const audio = new Audio(DEFAULT_ASSETS.sounds.correct);
    audio.addEventListener('loadeddata', () => setAudioLoaded(true));
    audio.addEventListener('error', (e) => {
      console.error('Error loading correct audio:', e);
      setAudioLoaded(false);
    });
    return audio;
  }, []);

  const incorrectAudio = useMemo(() => {
    const audio = new Audio(DEFAULT_ASSETS.sounds.incorrect);
    audio.addEventListener('loadeddata', () => setAudioLoaded(true));
    audio.addEventListener('error', (e) => {
      console.error('Error loading incorrect audio:', e);
      setAudioLoaded(false);
    });
    return audio;
  }, []);

  // Add the cleanup effect here
  useEffect(() => {
    const correctLoadedCallback = () => setAudioLoaded(true);
    const correctErrorCallback = (e) => {
      console.error('Error loading correct audio:', e);
      setAudioLoaded(false);
    };
    const incorrectLoadedCallback = () => setAudioLoaded(true);
    const incorrectErrorCallback = (e) => {
      console.error('Error loading incorrect audio:', e);
      setAudioLoaded(false);
    };

    // Add listeners
    correctAudio.addEventListener('loadeddata', correctLoadedCallback);
    correctAudio.addEventListener('error', correctErrorCallback);
    incorrectAudio.addEventListener('loadeddata', incorrectLoadedCallback);
    incorrectAudio.addEventListener('error', incorrectErrorCallback);

    // Cleanup function
    return () => {
      correctAudio.removeEventListener('loadeddata', correctLoadedCallback);
      correctAudio.removeEventListener('error', correctErrorCallback);
      incorrectAudio.removeEventListener('loadeddata', incorrectLoadedCallback);
      incorrectAudio.removeEventListener('error', incorrectErrorCallback);
    };
  }, [correctAudio, incorrectAudio]);
  
  // ---------------------- Mode and State Variables ----------------------
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const AMC10_TIME_LIMIT_MINUTES = 75;
  const [mode, setMode] = useState('');
  const [problem, setProblem] = useState(null);
  // This represents the sequential number within the current session.
  const [currentIndex, setCurrentIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(AMC10_TIME_LIMIT_MINUTES * 60); // in seconds
  const [problemStartTime, setProblemStartTime] = useState(null);
  const [cumulativeTime, setCumulativeTime] = useState(0);  // Move this up

  // Add this timer effect
  useEffect(() => {
    if (!sessionStarted) return;
  
    // Set session start time when session starts
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }
  
    const timer = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - sessionStartTime) / 1000);
      const timeLeftInSeconds = AMC10_TIME_LIMIT_MINUTES * 60 - elapsedTime;
      
      setTimeLeft(Math.max(0, timeLeftInSeconds));
      
      if (timeLeftInSeconds <= 0) {
        clearInterval(timer);
        setSessionComplete(true);
      }
    }, 1000);
  
    return () => clearInterval(timer);
  }, [sessionStarted, sessionStartTime]);
  
  // Update the image preloading useEffect
  useEffect(() => {
    const correctImg = new Image();
    const incorrectImg = new Image();
    
    let loadedCount = 0;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        setImagesLoaded(true);
      }
    };

    correctImg.onload = checkAllLoaded;
    incorrectImg.onload = checkAllLoaded;
    correctImg.onerror = (e) => console.error('Error loading correct image:', e);
    incorrectImg.onerror = (e) => console.error('Error loading incorrect image:', e);
    
    correctImg.src = DEFAULT_ASSETS.images.feedback.correct;
    incorrectImg.src = DEFAULT_ASSETS.images.feedback.incorrect;
  }, []);

  // Feedback
  const [isCorrect, setIsCorrect] = useState(null);
  const [feedbackImage, setFeedbackImage] = useState(null);

  // Practice mode states
  const [showSolution, setShowSolution] = useState(false);
  const [answered, setAnswered] = useState(false);

  // Contest mode: show or suppress immediate feedback?
  const [showProblemFeedback, setShowProblemFeedback] = useState(false);

  // Dynamic filters – Contest, Year, then Mode.
  const [selectedContest, setSelectedContest] = useState('AMC 10A');
  const [selectedYear, setSelectedYear] = useState(2022);
  const [selectedSkin, setSelectedSkin] = useState('Minecraft');

  // New state: let user enable shuffling on the frontend.
  const [shuffle, setShuffle] = useState(false);

  // Track used problem numbers (using problem_number for uniqueness)
  const [usedProblemNumbers, setUsedProblemNumbers] = useState([]);
  const usedProblemNumbersRef = useRef([]);
  useEffect(() => {
    usedProblemNumbersRef.current = usedProblemNumbers;
  }, [usedProblemNumbers]);

  // Cancel tokens for axios
  const cancelSourceRef = useRef(null);

  // Processed problem statement with meta
  const [problemStatementWithMeta, setProblemStatementWithMeta] = useState('');

  // Track incorrectly answered problems for review
  const [incorrectProblems, setIncorrectProblems] = useState([]);

  // Track all attempted problems with details.
  const [attemptRecords, setAttemptRecords] = useState([]);

  // Prevent multiple clicks on the same problem.
  const [answersDisabled, setAnswersDisabled] = useState(false);

  // ---------------------- Session Reset Function ----------------------
  const resetSession = () => {
    setUsedProblemNumbers([]);
    usedProblemNumbersRef.current = [];
    setAttempted(0);
    setScore(0);
    setCumulativeTime(0);
    setProblem(null);
    setIncorrectProblems([]);
    setAttemptRecords([]);
    setIsCorrect(null);
    setFeedbackImage(null);
    setAnswersDisabled(false);
    setCurrentIndex(1);
    setAnswered(false);
    setShowSolution(false);
    setSessionComplete(false);
    setSessionStarted(true);
    setSessionStartTime(Date.now());
    setTimeLeft(AMC10_TIME_LIMIT_MINUTES * 60);
    };

  // ---------------------- Fetch a Problem from Backend ----------------------
  const fetchProblem = useCallback(async () => {
    if (sessionComplete) {
      return;
    }

    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel();
    }
    cancelSourceRef.current = axios.CancelToken.source();

    // Build query parameters.
    let params = {
      year: selectedYear,
      contest: selectedContest,
      shuffle: shuffle,
    };

    if (mode === "practice") {
      params.Skin = selectedSkin;
    }

    if (usedProblemNumbersRef.current.length > 0) {
      params.exclude = usedProblemNumbersRef.current.join(",");
    }

    try {
      const response = await axios.get("http://127.0.0.1:5001/", {
        params,
        cancelToken: cancelSourceRef.current.token,
      });
      console.log("Received problem:", response.data);

      // Avoid duplicate problems.
      if (usedProblemNumbersRef.current.includes(response.data.problem_number)) {
        console.warn("Duplicate problem received, fetching a new one");
        await fetchProblem();
        return;
      }

      setProblem(response.data);
      setUsedProblemNumbers(prev => [...prev, response.data.problem_number]);
      usedProblemNumbersRef.current.push(response.data.problem_number);
      setProblemStartTime(Date.now());
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Error fetching problem:", err);
        setError(err.response?.data?.error || "Failed to load problem.");
      }
    } finally {
      setLoading(false);
    }
  }, [
    selectedYear,
    selectedContest,
    selectedSkin,
    sessionComplete,
    mode,
    shuffle
  ]);

  // ---------------------- Update Problem Statement ----------------------
  useEffect(() => {
    if (problem) {
      const processed = problem.problem_statement || '';
      const meta = `\n\n**(${problem.year}, ${problem.contest}, Problem ${problem.problem_number})**`;
      setProblemStatementWithMeta(processed + meta);
    } else {
      setProblemStatementWithMeta('');
    }
  }, [problem]);

  // ---------------------- Format cumulative time ----------------------
  const cumulativeTimeSeconds = (cumulativeTime / 1000).toFixed(2);

  // Add the playAudio utility function
  const playAudio = async (audio) => {
    if (!audio) return;
    try {
      audio.currentTime = 0; // Reset to start
      await audio.play();
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  };

  // Update the useEffect that checks for session completion
  useEffect(() => {
    // Check for both time limit and problem limit
    const timeExpired = timeLeft <= 0;
    const problemsComplete = attempted >= 25;
    
    if (sessionStarted && (timeExpired || problemsComplete)) {
      setSessionComplete(true);
    }
  }, [timeLeft, attempted, sessionStarted]);

  // ---------------------- Handle Choice Click ----------------------
  const handleChoiceClick = useCallback(
    async (choice) => { // Make the function async
      if (answersDisabled) return;
      setAnswersDisabled(true);

      if (!problem || !problem.answer_key || !problemStartTime) {
        setAnswersDisabled(false);
        return;
      }
  
      const match = choice.trim().match(/^([A-Z])\)?/);
      const selectedLetter = match ? match[1] : choice.trim().toUpperCase();
      const correctAnswer = problem.answer_key.trim().toUpperCase();
      const answerIsCorrect = selectedLetter === correctAnswer;
  
      const timeSpent = Date.now() - problemStartTime;
      setCumulativeTime(prev => prev + timeSpent);
      console.log(`Time on this problem: ${timeSpent}ms`);
  
      setAttemptRecords(prev => [
        ...prev,
        {
          problem_number: problem.problem_number,
          correct: answerIsCorrect,
          timeSpent
        }
      ]);
  
      setAttempted(prev => prev + 1);
  
      if (answerIsCorrect) {
        setScore(prev => prev + 1);
      } else {
        setIncorrectProblems(prev => {
          if (!prev.find(p => p.problem_number === problem.problem_number)) {
            return [...prev, problem];
          }
          return prev;
        });
      }
  
      if (mode === "contest") {
        setIsCorrect(null);
        setFeedbackImage(null);
        if (!sessionComplete && attempted + 1 < 25) {
          setTimeout(async () => {
            await fetchProblem();
            setAnswersDisabled(false);
          }, 500);
        }
      } else if (mode === "practice") {
        if (showProblemFeedback) {
          if (answerIsCorrect) {
            if (audioLoaded) {
              await playAudio(correctAudio);
            }
            setFeedbackImage(DEFAULT_ASSETS.images.feedback.correct);
          } else {
            if (audioLoaded) {
              await playAudio(incorrectAudio);
            }
            setFeedbackImage(DEFAULT_ASSETS.images.feedback.incorrect);
          }
          setIsCorrect(answerIsCorrect);
        }
        setAnswered(true);
      }
    },
    [
      problem,
      problemStartTime,
      correctAudio,
      incorrectAudio,
      fetchProblem,
      attempted,
      mode,
      showProblemFeedback,
      answersDisabled,
      audioLoaded,
      sessionComplete
    ]
  );

  // ---------------------- Show/Hide Solution in Practice Mode ----------------------
  const handleShowSolution = () => {
    setShowSolution(prev => !prev);
    setIsCorrect(null);
    setFeedbackImage(null);
  };

  // ---------------------- Next Problem in Practice Mode ----------------------
  const handleNextProblem = useCallback(async () => {
    setAnswersDisabled(true);
    // Increment the sequential index for the next problem.
    setCurrentIndex(prev => prev + 1);
    setShowSolution(false);
    setAnswered(false);
    setIsCorrect(null);
    setFeedbackImage(null);

    await fetchProblem();
    setAnswersDisabled(false);
  }, [fetchProblem]);

  // ---------------------- Toggle Immediate Feedback in Practice Mode ----------------------
  const handleProblemFeedbackToggle = (checked) => {
    setShowProblemFeedback(checked);
    if (!checked) {
      setIsCorrect(null);
      setFeedbackImage(null);
    }
  };

  // ---------------------- Render Summary Grid ----------------------
  const renderSummaryGrid = () => {
    const sortedRecords = [...attemptRecords].sort((a, b) => a.problem_number - b.problem_number);
    const gridRowStyle = {
      display: 'grid',
      gridTemplateColumns: 'repeat(25, 1fr)',
      gap: '4px',
      marginBottom: '8px'
    };
    return (
      <div className="attempt-summary-grid" style={{ marginBottom: '16px' }}>
        <div style={gridRowStyle}>
          {sortedRecords.map((record, idx) => (
            <div
              key={idx}
              className="grid-cell"
              style={{
                textAlign: 'center',
                border: '1px solid #ccc',
                padding: '4px'
              }}
            >
              {record.problem_number}
            </div>
          ))}
        </div>
        <div style={gridRowStyle}>
          {sortedRecords.map((record, idx) => (
            <div
              key={idx}
              className="grid-cell"
              style={{
                textAlign: 'center',
                border: '1px solid #ccc',
                padding: '4px'
              }}
            >
              {record.correct ? '✔' : '✖'}
            </div>
          ))}
        </div>
        <div style={gridRowStyle}>
          {sortedRecords.map((record, idx) => (
            <div
              key={idx}
              className="grid-cell"
              style={{
                textAlign: 'center',
                border: '1px solid #ccc',
                padding: '4px'
              }}
            >
              {(record.timeSpent / 1000).toFixed(2)} s
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ---------------------- Render Review Panel ----------------------
  const renderReviewPanel = () => {
    const sortedIncorrectProblems = [...incorrectProblems].sort(
      (a, b) => a.problem_number - b.problem_number
    );

    return (
      <div className="review-panel">
        <h2>Review Incorrect Problems</h2>
        {sortedIncorrectProblems.length === 0 ? (
          <p>No incorrect problems! Great job!</p>
        ) : (
          sortedIncorrectProblems.map((p, index) => (
            <div key={p.problem_number || index} className="review-item">
              <h3>
                {p.year}, {p.contest}, Problem {p.problem_number}
              </h3>
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {p.problem_statement}
                </ReactMarkdown>
              </div>
              <div className="solution-section">
                <h4>Detailed Solution</h4>
                {Array.isArray(p.detailed_solution) ? (
                  <div>
                    {p.detailed_solution.map((stepObj, idx) => (
                      <div key={idx} style={{ marginBottom: '1em' }}>
                        {Object.entries(stepObj).map(([title, content]) => (
                          <div key={title}>
                            <strong>{title.replace('_', ' ')}:</strong>
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                            >
                              {content}
                            </ReactMarkdown>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {p.detailed_solution || "Solution not available."}
                  </ReactMarkdown>
                )}
              </div>
              <div className="similar-questions-section">
                <h4>Similar Problems</h4>
                {p.similar_questions && Array.isArray(p.similar_questions) && p.similar_questions.length > 0 ? (
                  p.similar_questions.map((sq, sqIdx) => (
                    <div key={sqIdx} className="similar-problem">
                      <strong>{sq.difficulty.charAt(0).toUpperCase() + sq.difficulty.slice(1)}:</strong>
                      <p><em>Question:</em></p>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {typeof sq.question === 'string'
                          ? sq.question
                          : Array.isArray(sq.question)
                          ? sq.question.join('\n\n')
                          : "Question not available."}
                      </ReactMarkdown>
                      <p><em>Detailed Solution:</em></p>
                      {Array.isArray(sq.detailed_solution) ? (
                        <div>
                          {sq.detailed_solution.map((stepObj, idx2) => (
                            <div key={idx2} style={{ marginBottom: '1em' }}>
                              {Object.entries(stepObj).map(([title, content]) => (
                                <div key={title}>
                                  <strong>{title.replace('_', ' ')}:</strong>
                                  <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                  >
                                    {content}
                                  </ReactMarkdown>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {typeof sq.detailed_solution === 'string'
                            ? sq.detailed_solution
                            : 'Solution not available.'}
                        </ReactMarkdown>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No similar problems available.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // ---------------------- Restart Session Function ----------------------
  const restartSession = async () => {
    if (!mode) {
      setError("Please select a mode before starting");
      return;
    }

    // Clear local state immediately
    resetSession();
    setLoading(true);
    setError(null);
    setSessionStarted(true);

    try {
      const response = await axios.get("http://127.0.0.1:5001/", {
        params: {
          restart: true,
          year: selectedYear,
          contest: selectedContest,
          shuffle: shuffle,
          ...(mode === "practice" && { Skin: selectedSkin })
        }
      });
      setProblem(response.data);
      setProblemStartTime(Date.now());
    } catch (err) {
      console.error("Error starting session:", err);
      setError(err.response?.data?.error || "Failed to start session");
      setSessionStarted(false);  // Reset on error
    } finally {
      setLoading(false);
    }
  };

  // ---------------------- Main Render ----------------------
  return (
    <div className="app-container">
    <header className="app-header">
      <h1>AMC Practice</h1>
      <div className="score-board">
        {mode === "practice" ? (
          <>Score: {score} / {attempted} | Time Left: {Math.floor(timeLeft / 60)} min {timeLeft % 60} sec</>
        ) : (
          <>Attempted: {attempted} | Time Left: {Math.floor(timeLeft / 60)} min {timeLeft % 60} sec</>
        )}
      </div>
    </header>

      <div className="main-layout">
        {/* ------------------ Filter Sidebar ------------------ */}
        <aside className="filter-sidebar">
          <h3>Filters</h3>
          <label>
            Contest:
            <select
              value={selectedContest}
              onChange={e => {
                setSelectedContest(e.target.value);
                restartSession();
              }}
            >
              <option value="AMC 10A">AMC 10A</option>
              <option value="AMC 10B">AMC 10B</option>
            </select>
          </label>
          <label>
            Year:
            <select
              value={selectedYear}
              onChange={e => {
                setSelectedYear(e.target.value);
                restartSession();
              }}
            >
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </label>
          <label>
            Mode:
            <select
              value={mode}
              onChange={e => {
                setMode(e.target.value);
              }}
            >
              <option value="">Select Mode</option>
              <option value="contest">Contest</option>
              <option value="practice">Practice</option>
            </select>
          </label>
          {/* Shuffle checkbox */}
          <label style={{ marginTop: '1rem' }}>
            <input
              type="checkbox"
              checked={shuffle}
              onChange={e => setShuffle(e.target.checked)}
            />
            {' '}Shuffle Problems?
          </label>
          {/* Contest mode immediate feedback */}
          {mode === "practice" && (
            <label style={{ marginTop: '1rem' }}>
              <input
                type="checkbox"
                checked={showProblemFeedback}
                onChange={e => handleProblemFeedbackToggle(e.target.checked)}
              />
              {' '}Show Immediate Feedback?
            </label>
          )}
          {/* Skin filter for Practice mode */}
          {mode === "practice" && (
            <label>
              Skin:
              <select
                value={selectedSkin}
                onChange={e => {
                  setSelectedSkin(e.target.value);
                  restartSession();
                }}
              >
                <option value="Minecraft">Minecraft</option>
                <option value="Roblox">Roblox</option>
                <option value="Mario">Mario</option>
                <option value="Elsa">Elsa</option>
              </select>
            </label>
          )}
          <button
            onClick={restartSession}
            className="start-button"
            disabled={!mode}
          >
            Start
          </button>
        </aside>

        {/* ------------------ Main Content Panel ------------------ */}
        <main className="content-panel">
          {!sessionStarted ? (
            <div className="instruction-message">
              <h2>I am awesome and I know it</h2>
              <p>Let's go.</p>
            </div>
          ) : (
            <>
              {loading && <p className="info-message">Loading...</p>}
              {error && <p className="error-message">{error}</p>}
              {sessionComplete ? (
                <div className="completion-message">
                  <h2>Practice Complete!</h2>
                  <p>Your final score is {score} out of {attempted}.</p>
                  <p>Total time: {cumulativeTimeSeconds} seconds.</p>
                  {renderSummaryGrid()}
                  {renderReviewPanel()}
                </div>
              ) : (
                problem && !loading && (
                  <>
                    <section className="question-section">
                      {/* Display the current problem index */}
                      {mode === "practice" && <h2>Problem {currentIndex}</h2>}
                      <div className="markdown-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {problemStatementWithMeta}
                        </ReactMarkdown>
                      </div>
                      {problem.image && typeof problem.image === 'string' && (
                        <div className="image-container">
                          <img src={problem.image} alt="Problem Diagram" />
                        </div>
                      )}
                    </section>

                    <section className="answer-section">
                      <div className="answer-section-header">
                        <h2>Answer Choices</h2>
                        {mode === "practice" && (
                          <div className="practice-buttons-row">
                            <button
                              className="solution-button"
                              onClick={handleShowSolution}
                            >
                              {showSolution ? "Hide Solution" : "Show Solution"}
                            </button>
                            <button
                              className="next-problem-button"
                              onClick={handleNextProblem}
                              disabled={!answered}
                            >
                              Next Problem
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="answer-choices">
                        {Array.isArray(problem.answer_choices) &&
                          problem.answer_choices.map((choice, index) => (
                            <button
                              key={index}
                              className="choice-button"
                              onClick={() => handleChoiceClick(choice)}
                              disabled={(mode === "practice" && answered) || answersDisabled}
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                              >
                                {choice}
                              </ReactMarkdown>
                            </button>
                          ))}
                      </div>
                    </section>

                    {showSolution && mode === "practice" && (
                      <div className="solution-section">
                        <h4>Detailed Solution</h4>
                        {Array.isArray(problem.detailed_solution) ? (
                          <div>
                            {problem.detailed_solution.map((stepObj, idx) => (
                              <div key={idx} style={{ marginBottom: '1em' }}>
                                {Object.entries(stepObj).map(([title, content]) => (
                                  <div key={title}>
                                    <strong>{title.replace('_', ' ')}:</strong>
                                    <ReactMarkdown
                                      remarkPlugins={[remarkMath]}
                                      rehypePlugins={[rehypeKatex]}
                                    >
                                      {content}
                                    </ReactMarkdown>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {problem.detailed_solution || "Solution not available."}
                          </ReactMarkdown>
                        )}
                        <div className="similar-questions-section">
                          <h4>Similar Problems</h4>
                          {problem.similar_questions && Array.isArray(problem.similar_questions) && problem.similar_questions.length > 0 ? (
                            problem.similar_questions.map((sq, idx) => (
                              <div key={idx} className="similar-problem">
                                <strong>{sq.difficulty.charAt(0).toUpperCase() + sq.difficulty.slice(1)}:</strong>
                                <p><em>Question:</em></p>
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {typeof sq.question === 'string'
                                    ? sq.question
                                    : Array.isArray(sq.question)
                                    ? sq.question.join('\n\n')
                                    : "Question not available."}
                                </ReactMarkdown>
                                <p><em>Detailed Solution:</em></p>
                                {Array.isArray(sq.detailed_solution) ? (
                                  <div>
                                    {sq.detailed_solution.map((stepObj, idx2) => (
                                      <div key={idx2} style={{ marginBottom: '1em' }}>
                                        {Object.entries(stepObj).map(([title, content]) => (
                                          <div key={title}>
                                            <strong>{title.replace('_', ' ')}:</strong>
                                            <ReactMarkdown
                                              remarkPlugins={[remarkMath]}
                                              rehypePlugins={[rehypeKatex]}
                                            >
                                              {content}
                                            </ReactMarkdown>
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {typeof sq.detailed_solution === 'string'
                                      ? sq.detailed_solution
                                      : 'Solution not available.'}
                                  </ReactMarkdown>
                                )}
                              </div>
                            ))
                          ) : (
                            <p>No similar problems available.</p>
                          )}
                        </div>
                      </div>
                    )}
                    {isCorrect !== null && showProblemFeedback && (
                      <div className="feedback-section">
                        <p className={`result ${isCorrect ? 'correct' : 'incorrect'}`}>
                          {isCorrect ? 'Correct! 🎉' : 'Incorrect. ❌'}
                        </p>
                        {feedbackImage && imagesLoaded && (
                          <div className="result-image-container">
                            <img
                              src={feedbackImage}
                              alt={isCorrect ? 'Correct' : 'Incorrect'}
                              className="result-image"
                              style={{ maxWidth: '200px' }}
                              onError={(e) => console.error('Error displaying feedback image:', e)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
