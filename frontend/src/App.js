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
  const [mode, setMode] = useState(null); // "contest" or "practice"
  const [problem, setProblem] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(1); // For practice mode (sequential)
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
  const [showContestFeedback, setShowContestFeedback] = useState(true);

  // Time tracking
  const [problemStartTime, setProblemStartTime] = useState(null);
  const [cumulativeTime, setCumulativeTime] = useState(0);

  // Dynamic filters
  const [selectedYear, setSelectedYear] = useState(2022);
  const [selectedContest, setSelectedContest] = useState('AMC 10A');

  // Track used problem IDs (for contest mode)
  const [usedProblemIds, setUsedProblemIds] = useState([]);
  const usedProblemIdsRef = useRef([]);
  useEffect(() => {
    usedProblemIdsRef.current = usedProblemIds;
  }, [usedProblemIds]);

  const cancelSourceRef = useRef(null);

  // Audio for correct/incorrect
  const correctAudio = useMemo(() => new Audio(correctSoundFile), []);
  const incorrectAudio = useMemo(() => new Audio(incorrectSoundFile), []);

  // Convert \(...\) to $...$ for math
  const convertLatexDelimiters = useCallback((text) => {
    if (!text) return '';
    return text
      .replace(/\\\((.+?)\\\)/g, '$$$1$')
      .replace(/\\\[(.+?)\\\]/gs, '$$$$ $1 $$$$');
  }, []);

  // Processed problem statement with meta
  const [problemStatementWithMeta, setProblemStatementWithMeta] = useState('');

  // Track incorrectly answered problems for review
  const [incorrectProblems, setIncorrectProblems] = useState([]);

  // Session is complete when 25 problems have been attempted
  const sessionComplete = attempted >= 25;

  // ---------------------- Fetch a Problem from Backend ----------------------
  const fetchProblem = useCallback(async () => {
    if (sessionComplete) return;
    setLoading(true);
    setError(null);
  
    // Cancel any previous request
    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel();
    }
    cancelSourceRef.current = axios.CancelToken.source();
  
    let params = {
      year: selectedYear,
      contest: selectedContest,
    };
  
    // For both contest and practice modes, send an exclusion list so already used problems aren’t repeated.
    if (usedProblemIdsRef.current.length > 0) {
      params.exclude = usedProblemIdsRef.current.join(",");
    }
  
    // If you are intentionally selecting sequential problems in practice mode, you may include:
    // if (mode === "practice") {
    //   params.problem_number = currentIndex;
    // }
  
    try {
      const response = await axios.get("http://127.0.0.1:5001/", {
        params,
        cancelToken: cancelSourceRef.current.token,
      });
      console.log("Received problem:", response.data);
  
      // If by any chance a duplicate is returned, fetch a new problem.
      if (usedProblemIdsRef.current.includes(response.data.problem_id)) {
        console.warn("Duplicate problem received, fetching a new one");
        fetchProblem();
        return;
      }
  
      setProblem(response.data);
      // Record the problem as used, regardless of mode.
      setUsedProblemIds(prev => [...prev, response.data.problem_id]);
      usedProblemIdsRef.current.push(response.data.problem_id);
      setProblemStartTime(Date.now());
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Error fetching problem:", err);
        setError(err.response?.data?.error || "Failed to load problem.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedContest, sessionComplete, mode, currentIndex]);  

  // ---------------------- useEffect: Initial Fetch ----------------------
  useEffect(() => {
    if (!sessionComplete && mode !== null) {
      fetchProblem();
    }
    return () => {
      if (cancelSourceRef.current) cancelSourceRef.current.cancel();
    };
  }, [fetchProblem, sessionComplete, mode]);

  // ---------------------- Update Problem Statement ----------------------
  useEffect(() => {
    if (problem) {
      const processed = problem.problem_statement
        ? convertLatexDelimiters(problem.problem_statement)
        : '';
      const meta = `\n\n**(${problem.year}, ${problem.contest}, Problem ${problem.problem_number})**`;
      setProblemStatementWithMeta(processed + meta);
    } else {
      setProblemStatementWithMeta('');
    }
  }, [problem, convertLatexDelimiters]);

  // ---------------------- Handle Choice Click ----------------------
  const handleChoiceClick = useCallback(
    (choice) => {
      if (!problem || !problem.answer_key || !problemStartTime) return;

      const match = choice.trim().match(/^([A-Z])\)?/);
      const selectedLetter = match ? match[1] : choice.trim().toUpperCase();
      const correctAnswer = problem.answer_key.trim().toUpperCase();
      const answerIsCorrect = selectedLetter === correctAnswer;

      const timeSpent = Date.now() - problemStartTime;
      setCumulativeTime(prev => prev + timeSpent);
      console.log(`Time on this problem: ${timeSpent}ms`);

      setAttempted(prev => prev + 1);

      if (answerIsCorrect) {
        setScore(prev => prev + 1);
      }

      if (mode === "contest") {
        if (showContestFeedback) {
          if (answerIsCorrect) {
            correctAudio.play();
            setFeedbackImage(correctImage);
          } else {
            incorrectAudio.play();
            setFeedbackImage(incorrectImage);
            setIncorrectProblems(prev => {
              if (!prev.find(p => p.problem_id === problem.problem_id)) {
                return [...prev, problem];
              }
              return prev;
            });
          }
          setIsCorrect(answerIsCorrect);
          if (attempted + 1 < 25) {
            setTimeout(() => {
              fetchProblem();
            }, 1000);
          }
        } else {
          if (!answerIsCorrect) {
            setIncorrectProblems(prev => {
              if (!prev.find(p => p.problem_id === problem.problem_id)) {
                return [...prev, problem];
              }
              return prev;
            });
          }
          if (attempted + 1 < 25) {
            setTimeout(() => {
              fetchProblem();
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
          setIncorrectProblems(prev => {
            if (!prev.find(p => p.problem_id === problem.problem_id)) {
              return [...prev, problem];
            }
            return prev;
          });
        }
        setIsCorrect(answerIsCorrect);
        setAnswered(true);
      }
    },
    [problem, problemStartTime, correctAudio, incorrectAudio, fetchProblem, attempted, mode, showContestFeedback]
  );

  // ---------------------- Show/Hide Solution in Practice Mode ----------------------
  const handleShowSolution = () => {
    setShowSolution(prev => !prev);
    setIsCorrect(null);
    setFeedbackImage(null);
  };

  // ---------------------- Next Problem in Practice Mode ----------------------
  const handleNextProblem = () => {
    setCurrentIndex(prev => prev + 1);
    setShowSolution(false);
    setAnswered(false);
    setIsCorrect(null);
    setFeedbackImage(null);
    fetchProblem();
  };

  // ---------------------- Toggle immediate feedback in Contest Mode ----------------------
  const handleContestFeedbackToggle = (checked) => {
    setShowContestFeedback(checked);
    if (!checked) {
      setIsCorrect(null);
      setFeedbackImage(null);
    }
  };

  // ---------------------- Format cumulative time ----------------------
  const cumulativeTimeSeconds = (cumulativeTime / 1000).toFixed(2);

  // ---------------------- Render Review Panel After Session Completion ----------------------
  const renderReviewPanel = () => {
    return (
      <div className="review-panel">
        <h2>Review Incorrect Problems</h2>
        {incorrectProblems.length === 0 ? (
          <p>No incorrect problems! Great job!</p>
        ) : (
          incorrectProblems.map((p, index) => (
            <div key={p.problem_id || index} className="review-item">
              <h3>
                {p.year}, {p.contest}, Problem {p.problem_number}
              </h3>
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {convertLatexDelimiters(p.problem_statement)}
                </ReactMarkdown>
              </div>
              <div className="solution-section">
                <h4>Detailed Solution</h4>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {convertLatexDelimiters(p.detailed_solution || "Solution not available.")}
                </ReactMarkdown>
              </div>
              <div className="similar-questions-section">
                <h4>Similar Problems</h4>
                {p.similar_questions && Array.isArray(p.similar_questions) && p.similar_questions.length > 0 ? (
                  p.similar_questions.map((sq, idx) => (
                    <div key={idx} className="similar-problem">
                      <strong>{sq.difficulty.charAt(0).toUpperCase() + sq.difficulty.slice(1)}:</strong>
                      <p><em>Question:</em></p>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {convertLatexDelimiters(sq.question)}
                      </ReactMarkdown>
                      <p><em>Detailed Solution:</em></p>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {convertLatexDelimiters(sq.detailed_solution)}
                      </ReactMarkdown>
                      <p><em>Final Answer:</em></p>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {convertLatexDelimiters(sq.final_answer)}
                      </ReactMarkdown>
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

  // ---------------------- Main Render ----------------------
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AMC Practice</h1>
        <div className="score-board">
          Score: {score} / {attempted} | Time: {cumulativeTimeSeconds} sec
        </div>
      </header>

      <div className="main-layout">
        <aside className="filter-sidebar">
          <h3>Filters</h3>
          <label>
            Year:
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setUsedProblemIds([]);
                usedProblemIdsRef.current = [];
                setAttempted(0);
                setScore(0);
                setCumulativeTime(0);
                setProblem(null);
                setIncorrectProblems([]);
              }}
            >
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </label>

          <label>
            Contest:
            <select
              value={selectedContest}
              onChange={(e) => {
                setSelectedContest(e.target.value);
                setUsedProblemIds([]);
                usedProblemIdsRef.current = [];
                setAttempted(0);
                setScore(0);
                setCumulativeTime(0);
                setProblem(null);
                setIncorrectProblems([]);
              }}
            >
              <option value="AMC 10A">AMC 10A</option>
              <option value="AMC 10B">AMC 10B</option>
            </select>
          </label>

          {mode === "contest" && (
            <div style={{ marginTop: '1rem' }}>
              <label>
                <input
                  type="checkbox"
                  checked={showContestFeedback}
                  onChange={(e) => handleContestFeedbackToggle(e.target.checked)}
                />
                {' '}Show immediate feedback?
              </label>
            </div>
          )}

          <button
            onClick={() => {
              setUsedProblemIds([]);
              usedProblemIdsRef.current = [];
              setAttempted(0);
              setScore(0);
              setCumulativeTime(0);
              setProblem(null);
              setIncorrectProblems([]);
              setIsCorrect(null);
              setFeedbackImage(null);
              if (mode === "practice") {
                setCurrentIndex(1);
                setAnswered(false);
                setShowSolution(false);
              }
              fetchProblem();
            }}
            className="filter-btn"
          >
            Restart Practice
          </button>
        </aside>

        <main className="content-panel">
          {mode === null ? (
            <div className="mode-selection-container">
              <h2 className="mode-selection-title">Select Mode</h2>
              <div className="mode-buttons">
                <button className="mode-button" onClick={() => setMode("contest")}>
                  Contest Mode
                </button>
                <button className="mode-button" onClick={() => setMode("practice")}>
                  Practice Mode
                </button>
              </div>
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
                  {renderReviewPanel()}
                </div>
              ) : (
                problem && !loading && (
                  <>
                    <section className="question-section">
                      <h2>Problem</h2>
                      <div className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
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
                        {problem.answer_choices && Array.isArray(problem.answer_choices)
                          ? problem.answer_choices.map((choice, index) => (
                              <button
                                key={index}
                                className="choice-button"
                                onClick={() => handleChoiceClick(choice)}
                                disabled={mode === "practice" && answered}
                              >
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {convertLatexDelimiters(choice)}
                                </ReactMarkdown>
                              </button>
                            ))
                          : null}
                      </div>
                    </section>

                    {showSolution && mode === "practice" && (
                      <div className="solution-section">
                        <h4>Detailed Solution</h4>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {convertLatexDelimiters(problem.detailed_solution || "Solution not available.")}
                        </ReactMarkdown>
                        <h4>Similar Problems</h4>
                        {problem.similar_questions && Array.isArray(problem.similar_questions) && problem.similar_questions.length > 0 ? (
                          problem.similar_questions.map((sq, idx) => (
                            <div key={idx} className="similar-problem">
                              <strong>{sq.difficulty.charAt(0).toUpperCase() + sq.difficulty.slice(1)}:</strong>
                              <p><em>Question:</em></p>
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {convertLatexDelimiters(sq.question)}
                              </ReactMarkdown>
                              <p><em>Detailed Solution:</em></p>
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {convertLatexDelimiters(sq.detailed_solution)}
                              </ReactMarkdown>
                              <p><em>Final Answer:</em></p>
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {convertLatexDelimiters(sq.final_answer)}
                              </ReactMarkdown>
                            </div>
                          ))
                        ) : (
                          <p>No similar problems available.</p>
                        )}
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
