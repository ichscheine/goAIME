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
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [isCorrect, setIsCorrect] = useState(null);
  const [feedbackImage, setFeedbackImage] = useState(null);

  const [selectedYear, setSelectedYear] = useState('2022');
  const [selectedContest, setSelectedContest] = useState('AMC 10A');

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

  const fetchProblem = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsCorrect(null);
    setFeedbackImage(null);

    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel();
    }
    cancelSourceRef.current = axios.CancelToken.source();

    const params = {
      year: selectedYear,
      contest: selectedContest,
    };

    try {
      const response = await axios.get("http://127.0.0.1:5001/", {
        params,
        cancelToken: cancelSourceRef.current.token,
      });
      console.log("Received problem:", response.data);
      setProblem(response.data);
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Error fetching problem:", err);
        setError("Failed to load problem.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedContest]);

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

  useEffect(() => {
    fetchProblem();
    return () => {
      if (cancelSourceRef.current) cancelSourceRef.current.cancel();
    };
  }, [fetchProblem]);

  const handleChoiceClick = useCallback(
    (choice) => {
      console.log("Choice clicked:", choice);
      if (!problem || !problem.answer_key) return;
  
      // Use a regex to extract the first letter (A-Z) from the choice.
      const match = choice.trim().match(/^([A-Z])\)?/);
      const selectedLetter = match ? match[1] : choice.trim().toUpperCase();
  
      const correctAnswer = problem.answer_key.trim().toUpperCase();
      const isAnswerCorrect = selectedLetter === correctAnswer;
  
      setAttempted((prev) => prev + 1);
      if (isAnswerCorrect) {
        setScore((prev) => prev + 1);
        correctAudio.play();
        setFeedbackImage(correctImage);
      } else {
        incorrectAudio.play();
        setFeedbackImage(incorrectImage);
      }
      setIsCorrect(isAnswerCorrect);
  
      setTimeout(() => {
        fetchProblem();
      }, 1500);
    },
    [problem, correctAudio, incorrectAudio, fetchProblem]
  );  

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AMC Practice</h1>
        <div className="score-board">
          Score: {score} / {attempted}
        </div>
      </header>

      <div className="main-layout">
        <aside className="filter-sidebar">
          <h3>Filters</h3>
          <label>
            Year:
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </label>
          <label>
            Contest:
            <select value={selectedContest} onChange={(e) => setSelectedContest(e.target.value)}>
              <option value="AMC 10A">AMC 10A</option>
              <option value="AMC 10B">AMC 10B</option>
            </select>
          </label>
          <button onClick={fetchProblem} className="filter-btn">
            Apply Filters
          </button>
        </aside>

        <main className="content-panel">
          {loading && <p className="info-message">Loading...</p>}
          {error && <p className="error-message">{error}</p>}

          {problem && !loading && (
            <>
              <section className="question-section">
                <h2>Problem</h2>
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {problemStatementWithMeta}
                  </ReactMarkdown>
                </div>
                {problem.image &&
                  problem.image.mimeType &&
                  problem.image.base64 && (
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
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
