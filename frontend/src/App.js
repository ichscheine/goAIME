import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import './App.css';

import correctSoundFile from './sounds/correct.mp3';
import incorrectSoundFile from './sounds/incorrect.mp3';

import correctImage from './images/correct.gif';
import incorrectImage from './images/incorrect.gif';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

function App() {
  // ---------------------- Mode and State Variables ----------------------
  const [sessionStarted, setSessionStarted] = useState(false);
  const [mode, setMode] = useState('');
  const [problem, setProblem] = useState(null);
  // This represents the sequential number within the current session.
  const [currentIndex, setCurrentIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);

  // Feedback
  const [isCorrect, setIsCorrect] = useState(null);
  const [feedbackImage, setFeedbackImage] = useState(null);

  // Practice mode states
  const [showSolution, setShowSolution] = useState(false);
  const [answered, setAnswered] = useState(false);

  // Contest mode: show or suppress immediate feedback?
  const [showContestFeedback, setShowContestFeedback] = useState(false);

  // Time tracking
  const [problemStartTime, setProblemStartTime] = useState(null);
  const [cumulativeTime, setCumulativeTime] = useState(0);

  // Dynamic filters – Contest, Year, then Mode.
  const [selectedContest, setSelectedContest] = useState('AMC 10A');
  const [selectedYear, setSelectedYear] = useState(2022);
  const [selectedBackground, setSelectedBackground] = useState('Minecraft');

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

  // Audio for correct/incorrect
  const correctAudio = useMemo(() => new Audio(correctSoundFile), []);
  const incorrectAudio = useMemo(() => new Audio(incorrectSoundFile), []);

  // Processed problem statement with meta
  const [problemStatementWithMeta, setProblemStatementWithMeta] = useState('');

  // Track incorrectly answered problems for review
  const [incorrectProblems, setIncorrectProblems] = useState([]);

  // Track all attempted problems with details.
  const [attemptRecords, setAttemptRecords] = useState([]);

  // Prevent multiple clicks on the same problem.
  const [answersDisabled, setAnswersDisabled] = useState(false);

  // Session complete when 25 problems have been attempted.
  const sessionComplete = attempted >= 25;

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
    // Reset currentIndex so session starts at Problem 1.
    setCurrentIndex(1);
    setAnswered(false);
    setShowSolution(false);
  };

  // ---------------------- Fetch a Problem from Backend ----------------------
  const fetchProblem = useCallback(async () => {
    if (sessionComplete) return;
    setLoading(true);
    setError(null);

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
      params.background = selectedBackground;
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
    selectedBackground,
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

  // ---------------------- Handle Choice Click ----------------------
  const handleChoiceClick = useCallback(
    (choice) => {
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
        if (showContestFeedback) {
          if (answerIsCorrect) {
            correctAudio.play();
            setFeedbackImage(correctImage);
          } else {
            incorrectAudio.play();
            setFeedbackImage(incorrectImage);
          }
          setIsCorrect(answerIsCorrect);
          if (attempted + 1 < 25) {
            setTimeout(async () => {
              await fetchProblem();
              setAnswersDisabled(false);
            }, 1000);
          }
        } else {
          setIsCorrect(null);
          if (attempted + 1 < 25) {
            setTimeout(async () => {
              await fetchProblem();
              setAnswersDisabled(false);
            }, 500);
          }
        }
      } else if (mode === "practice") {
        if (answerIsCorrect) {
          correctAudio.play();
          setFeedbackImage(correctImage);
        } else {
          incorrectAudio.play();
          setFeedbackImage(incorrectImage);
        }
        setIsCorrect(answerIsCorrect);
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
      showContestFeedback,
      answersDisabled
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

  // ---------------------- Toggle immediate feedback in Contest Mode ----------------------
  const handleContestFeedbackToggle = (checked) => {
    setShowContestFeedback(checked);
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

    // Clear local state immediately
    resetSession();
    setLoading(true);
    setError(null);
    setSessionStarted(true);
    
    try {
      // Request the backend with the restart flag
      const response = await axios.get("http://127.0.0.1:5001/", {
        params: {
          restart: true,
          year: selectedYear,
          contest: selectedContest,
          shuffle: shuffle,
          ...(mode === "practice" && { background: selectedBackground })
        }
      });
      // Set the new problem (which should be Problem 1)
      setProblem(response.data);
      setProblemStartTime(Date.now());
    } catch (err) {
      console.error("Error starting session:", err);
      setError(err.response?.data?.error || "Failed to start session");
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
          Score: {score} / {attempted} | Time: {(cumulativeTime / 1000).toFixed(2)} sec
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
            {' '}Shuffle Problems
          </label>
          {/* Contest mode immediate feedback */}
          {mode === "contest" && (
            <label style={{ marginTop: '1rem' }}>
              <input
                type="checkbox"
                checked={showContestFeedback}
                onChange={e => handleContestFeedbackToggle(e.target.checked)}
              />
              {' '}Show immediate feedback?
            </label>
          )}
          {/* Background filter for Practice mode */}
          {mode === "practice" && (
            <label>
              Background:
              <select
                value={selectedBackground}
                onChange={e => {
                  setSelectedBackground(e.target.value);
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
            className="filter-btn"
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

                    {isCorrect !== null && (
                      <div className="feedback-section">
                        <p className={`result ${isCorrect ? 'correct' : 'incorrect'}`}>
                          {isCorrect ? 'Correct! 🎉' : 'Incorrect. ❌'}
                        </p>
                        {feedbackImage && (
                          <div className="result-image-container">
                            <img
                              src={feedbackImage}
                              alt={isCorrect ? 'Correct' : 'Incorrect'}
                              className="result-image"
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
