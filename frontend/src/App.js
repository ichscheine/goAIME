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
  // ---------------------- State Variables ----------------------
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(false); // start as false so our useEffect triggers fetch on mount
  const [error, setError] = useState(null);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [isCorrect, setIsCorrect] = useState(null);
  const [feedbackImage, setFeedbackImage] = useState(null);

  // Time tracking
  const [problemStartTime, setProblemStartTime] = useState(null);
  const [cumulativeTime, setCumulativeTime] = useState(0); // in ms

  // Dynamic filters
  const [selectedYear, setSelectedYear] = useState('2022');
  const [selectedContest, setSelectedContest] = useState('AMC 10A');

  // Track used problem IDs to avoid repetition
  const [usedProblemIds, setUsedProblemIds] = useState([]);
  // Also store in a ref so we always have the latest value in callbacks.
  const usedProblemIdsRef = useRef([]);
  useEffect(() => {
    usedProblemIdsRef.current = usedProblemIds;
  }, [usedProblemIds]);

  const cancelSourceRef = useRef(null);

  const correctAudio = useMemo(() => new Audio(correctSoundFile), []);
  const incorrectAudio = useMemo(() => new Audio(incorrectSoundFile), []);

  const convertLatexDelimiters = useCallback((text) => {
    if (!text) return '';
    return text
      .replace(/\\\((.+?)\\\)/g, '$$$1$')
      .replace(/\\\[(.+?)\\\]/gs, '$$$$ $1 $$$$');
  }, []);

  const [problemStatementWithMeta, setProblemStatementWithMeta] = useState('');

  // Session is complete when 25 problems have been attempted.
  const sessionComplete = attempted >= 25;

  // ---------------------- Fetch a Problem from Backend ----------------------
  const fetchProblem = useCallback(async () => {
    if (sessionComplete) return;

    setLoading(true);
    setError(null);

    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel();
    }
    cancelSourceRef.current = axios.CancelToken.source();

    const params = {
      year: selectedYear,
      contest: selectedContest,
    };

    // Use the ref for up-to-date usedProblemIds
    if (usedProblemIdsRef.current.length > 0) {
      params.exclude = usedProblemIdsRef.current.join(",");
    }

    try {
      const response = await axios.get("http://127.0.0.1:5001/", {
        params,
        cancelToken: cancelSourceRef.current.token,
      });
      console.log("Received problem:", response.data);
      setProblem(response.data);
      // Add the new problem's ID to both state and the ref.
      setUsedProblemIds(prev => [...prev, response.data.problem_id]);
      // Also update the ref immediately.
      usedProblemIdsRef.current.push(response.data.problem_id);
      // Record start time.
      setProblemStartTime(Date.now());
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Error fetching problem:", err);
        setError(err.response?.data?.error || "Failed to load problem.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedContest, sessionComplete]);

  // ---------------------- useEffect: Initial Fetch ----------------------
  useEffect(() => {
    // Fetch a problem on mount (if session isn't complete)
    if (!sessionComplete) {
      fetchProblem();
    }
    return () => {
      if (cancelSourceRef.current) cancelSourceRef.current.cancel();
    };
  }, [fetchProblem, sessionComplete]);

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

      // Extract first letter (e.g., "A" from "A) Option text")
      const match = choice.trim().match(/^([A-Z])\)?/);
      const selectedLetter = match ? match[1] : choice.trim().toUpperCase();
      const correctAnswer = problem.answer_key.trim().toUpperCase();
      const answerIsCorrect = selectedLetter === correctAnswer;

      // Calculate time spent.
      const timeSpent = Date.now() - problemStartTime;
      setCumulativeTime(prev => prev + timeSpent);
      console.log(`Time on this problem: ${timeSpent}ms`);

      // Update score and attempted count.
      setAttempted(prev => prev + 1);
      if (answerIsCorrect) {
        setScore(prev => prev + 1);
        correctAudio.play();
        setFeedbackImage(correctImage);
      } else {
        incorrectAudio.play();
        setFeedbackImage(incorrectImage);
      }
      setIsCorrect(answerIsCorrect);

      // After a delay, if session is not complete, fetch next problem.
      setTimeout(() => {
        if (attempted + 1 < 25) {
          fetchProblem();
        }
      }, 1500);
    },
    [problem, problemStartTime, correctAudio, incorrectAudio, fetchProblem, attempted]
  );

  // ---------------------- Format cumulative time ----------------------
  const cumulativeTimeSeconds = (cumulativeTime / 1000).toFixed(2);

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
                // Reset session when filters change.
                setUsedProblemIds([]);
                usedProblemIdsRef.current = [];
                setAttempted(0);
                setScore(0);
                setCumulativeTime(0);
                setProblem(null);
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
                // Reset session when filters change.
                setUsedProblemIds([]);
                usedProblemIdsRef.current = [];
                setAttempted(0);
                setScore(0);
                setCumulativeTime(0);
                setProblem(null);
              }}
            >
              <option value="AMC 10A">AMC 10A</option>
              <option value="AMC 10B">AMC 10B</option>
            </select>
          </label>
          <button
            onClick={() => {
              // Restart session.
              setUsedProblemIds([]);
              usedProblemIdsRef.current = [];
              setAttempted(0);
              setScore(0);
              setCumulativeTime(0);
              setProblem(null);
              fetchProblem();
            }}
            className="filter-btn"
          >
            Restart Practice
          </button>
        </aside>
        <main className="content-panel">
          {loading && <p className="info-message">Loading...</p>}
          {error && <p className="error-message">{error}</p>}
          {sessionComplete ? (
            <div className="completion-message">
              <h2>Practice Complete!</h2>
              <p>Your final score is {score} out of {attempted}.</p>
              <p>Total time: {cumulativeTimeSeconds} seconds.</p>
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
                  {problem.image && problem.image.mimeType && problem.image.base64 && (
                    <div className="image-container">
                      <img
                        src={`data:${problem.image.mimeType};base64,${problem.image.base64}`}
                        alt="Problem Diagram"
                      />
                    </div>
                  )}
                </section>
                <section className="answer-section">
                  <h2>Answer Choices</h2>
                  <div className="answer-choices">
                    {problem.answer_choices && Array.isArray(problem.answer_choices)
                      ? problem.answer_choices.map((choice, index) => (
                          <button
                            key={index}
                            className="choice-button"
                            onClick={() => handleChoiceClick(choice)}
                          >
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {convertLatexDelimiters(choice)}
                            </ReactMarkdown>
                          </button>
                        ))
                      : null}
                  </div>
                </section>
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
        </main>
      </div>
    </div>
  );
}

export default App;
