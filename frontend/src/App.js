import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import './App.css';

// Sound files (optional)
import correctSoundFile from './sounds/correct.mp3';
import incorrectSoundFile from './sounds/incorrect.mp3';

// Images for feedback (optional)
import correctImage from './images/correct.gif';
import incorrectImage from './images/incorrect.gif';

// Markdown + Math
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // KaTeX CSS

function App() {
  // ---------------------- State Variables ----------------------
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [resultImage, setResultImage] = useState(null);

  const [solutionData, setSolutionData] = useState(null);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [startTime, setStartTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState(null);
  const [showSolution, setShowSolution] = useState(false);

  // For canceling Axios requests
  const cancelSourceRef = useRef(null);

  // Preload audio
  const correctAudio = useMemo(() => new Audio(correctSoundFile), []);
  const incorrectAudio = useMemo(() => new Audio(incorrectSoundFile), []);

  // ---------------------- Utility: Convert LaTeX Delimiters ----------------------
  const convertLatexDelimiters = useCallback((text) => {
    if (!text) return '';
    return text
      // inline math: \( ... \) -> $...$
      .replace(/\\\((.+?)\\\)/g, '$$$1$')
      // display math: \[ ... \] -> $$...$$
      .replace(/\\\[(.+?)\\\]/gs, '$$$$ $1 $$$$');
  }, []);

  // We'll store the final problem statement (with metadata appended) in local state
  const [problemStatementWithMeta, setProblemStatementWithMeta] = useState('');

  // ---------------------- Fetch a Problem from Backend ----------------------
  const fetchProblem = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Reset all relevant states
    setUserAnswer('');
    setIsCorrect(null);
    setResultImage(null);
    setSolutionData(null);
    setSolutionLoading(false);
    setLoadingProgress(0);
    setTimeSpent(null);
    setShowSolution(false);

    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel();
    }
    cancelSourceRef.current = axios.CancelToken.source();

    try {
      const response = await axios.get("http://127.0.0.1:5001/", {
        cancelToken: cancelSourceRef.current.token
      });
      console.log("Received problem:", response.data);
      setProblem(response.data);
      setStartTime(Date.now());
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Error fetching problem:", err);
        setError("Failed to load problem.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Once we have the problem, convert the statement to Markdown + append metadata
  useEffect(() => {
    if (problem) {
      let processed = '';
      if (problem.problem_statement) {
        processed = convertLatexDelimiters(problem.problem_statement);
      }
      // Build a small Markdown snippet with the metadata, e.g. (2022, AMC 10A, Problem #5)
      const meta = `\n\n**(${problem.year}, ${problem.contest}, Problem ${problem.problem_number})**`;

      // Append to the statement
      const finalStatement = processed + meta;
      setProblemStatementWithMeta(finalStatement);
    } else {
      setProblemStatementWithMeta('');
    }
  }, [problem, convertLatexDelimiters]);

  useEffect(() => {
    console.log("problem.image is:", problem?.image);
  }, [problem]);
  
  // Fetch a problem on component mount
  useEffect(() => {
    fetchProblem();
    return () => {
      if (cancelSourceRef.current) {
        cancelSourceRef.current.cancel();
      }
    };
  }, [fetchProblem]);

  // ---------------------- Submit Answer ----------------------
  const handleSubmitAnswer = useCallback(() => {
    // If solution is loaded, do not re-check
    if (solutionData) return;

    if (problem && problem.answer_key) {
      const correct = userAnswer.trim().toUpperCase() === problem.answer_key.trim().toUpperCase();
      setIsCorrect(correct);
      correct ? correctAudio.play() : incorrectAudio.play();
      setResultImage(correct ? correctImage : incorrectImage);

      if (startTime) {
        const elapsed = Date.now() - startTime;
        setTimeSpent((elapsed / 1000).toFixed(1));
        console.log(`Time spent: ${elapsed / 1000} seconds`);
      }
    } else {
      // No valid problem or answer key
      setIsCorrect(false);
      incorrectAudio.play();
      setResultImage(incorrectImage);
    }
  }, [problem, userAnswer, startTime, correctAudio, incorrectAudio, solutionData]);

  // ---------------------- Show/Fetch the Solution ----------------------
  const handleShowSolution = useCallback(async () => {
    if (!problem || !problem.problem_number || !problem.year || !problem.contest) return;

    console.log("Show Solution clicked");
    setSolutionLoading(true);
    setLoadingProgress(0);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }, 200);

    try {
      const response = await axios.get("http://127.0.0.1:5001/adaptive_learning", {
        params: {
          year: problem.year,
          contest: problem.contest,
          problem_number: problem.problem_number,
          difficulty: "medium"
        }
      });
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setSolutionData(response.data);
      setShowSolution(true);
    } catch (err) {
      console.error("Error fetching solution:", err);
    } finally {
      clearInterval(progressInterval);
      setSolutionLoading(false);
    }
  }, [problem]);

  // ---------------------- Split the solution/followup into paragraphs ----------------------
  const getSolutionParagraphs = useCallback(() => {
    if (!solutionData?.solution) return [];
    return solutionData.solution
      .trim()
      .split(/\n\s*\n/);
  }, [solutionData]);

  const getFollowupParagraphs = useCallback(() => {
    if (!solutionData?.followup) return [];
    return solutionData.followup
      .trim()
      .split(/\n\s*\n/);
  }, [solutionData]);

  // ---------------------- Render ----------------------
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AMC 10 Practice</h1>
      </header>

      <main className="problem-card">
        {/* Loading / Error States */}
        {loading && <p className="info-message">Loading...</p>}
        {error && <p className="error-message">{error}</p>}

        {/* Problem Section */}
        {problem && !loading && (
          <section className="question-section">
            <h2>Problem</h2>
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {problemStatementWithMeta}
              </ReactMarkdown>
            </div>

            {/* -------------- DISPLAY EMBEDDED IMAGE IF PRESENT -------------- */}
            {problem.image && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <img
                  src={`data:${problem.image.mimeType};base64,${problem.image.base64}`}
                  alt="Problem Diagram"
                  style={{ width: '300px', height: 'auto', border: '1px solid #ccc' }}
                />
              </div>
            )}
          </section>
        )}

        {/* Answer Section */}
        {problem && !loading && (
          <section className="answer-section">
            <h2>Answer Choices</h2>
            <div className="answer-choices">
              {problem.answer_choices?.map((choice, index) => (
                <div key={index} className="choice-text">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {convertLatexDelimiters(choice)}
                  </ReactMarkdown>
                </div>
              ))}
            </div>

            <div className="answer-input">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Enter your answer (e.g. A, B, C...)"
              />
              <button onClick={handleSubmitAnswer} className="submit-btn answer-submit-btn">
                Submit
              </button>
            </div>

            {timeSpent && (
              <p className="info-message" style={{ marginTop: '0.5rem' }}>
                Time Spent: {timeSpent} seconds
              </p>
            )}

            {/* Correct/Incorrect Feedback (if solution not loaded) */}
            {isCorrect !== null && !solutionData && !solutionLoading && (
              <>
                <p className={`result ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {isCorrect ? 'Correct! 🎉' : 'Incorrect. Try again! ❌'}
                </p>
                {resultImage && (
                  <div className="result-image-container">
                    <img
                      src={resultImage}
                      alt={isCorrect ? 'Correct' : 'Incorrect'}
                      className="result-image"
                      loading="lazy"
                    />
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Show Solution Button (only if user is incorrect) */}
        {problem && isCorrect === false && !solutionData && !solutionLoading && (
          <button onClick={handleShowSolution} className="solution-btn">
            Show Solution
          </button>
        )}

        {/* Loading progress for solution */}
        {solutionLoading && (
          <p className="info-message">Loading Solution: {loadingProgress}%</p>
        )}

        {/* Solution & Follow-up Section */}
        {solutionData && (
          <section className="solution-section">
            <div className="solution-header">
              <button
                onClick={() => setShowSolution((prev) => !prev)}
                className="toggle-solution-btn"
              >
                {showSolution ? 'Hide Solution' : 'Show Solution'}
              </button>
            </div>

            {showSolution && (
              <div className="solution-content markdown-content">
                <h2>Solution</h2>
                {getSolutionParagraphs().length === 0 && (
                  <p>No detailed solution available.</p>
                )}
                {getSolutionParagraphs().map((para, i) => (
                  <ReactMarkdown
                    key={i}
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {convertLatexDelimiters(para)}
                  </ReactMarkdown>
                ))}

                <h2>Follow-up Questions</h2>
                {getFollowupParagraphs().length === 0 && (
                  <p>No follow-up questions available.</p>
                )}
                {getFollowupParagraphs().map((para, i) => (
                  <ReactMarkdown
                    key={i}
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {convertLatexDelimiters(para)}
                  </ReactMarkdown>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Navigation */}
        {problem && !loading && (
          <section className="navigation-section">
            <button onClick={fetchProblem} className="next-btn">
              Next Problem
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
