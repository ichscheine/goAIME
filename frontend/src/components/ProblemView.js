import React, { useCallback, useState, useEffect } from 'react';
import 'katex/dist/katex.min.css';
import api from '../services/api';

import AnswerChoices from './AnswerChoices';
import SolutionDisplay from './SolutionDisplay';
import FeedbackPanel from './FeedbackPanel';
import MathRenderer from './MathRenderer';
import { useProblem } from '../contexts/ProblemContext';
import { useAudio } from '../hooks/useAudio';
import { useParams } from 'react-router-dom';
import SessionSummary from './SessionSummary';

const ProblemView = () => {
  // Context hooks
  const {
    problem,
    loading,
    error,
    problemStatementWithMeta,
    mode,
    currentIndex,
    answered,
    setAnswered,
    problemStartTime,
    setCumulativeTime,
    setAttempted,
    setScore,
    setAnswersDisabled,
    setIncorrectProblems,
    answersDisabled,
    setAttemptRecords,
    fetchProblem,
    nextProblem,
    sessionComplete,
    attempted,
    setCurrentIndex,
    setProblem,
    setProblemStatementWithMeta,
    setProblemStartTime,
    setSessionComplete
  } = useProblem();

  // Router hooks
  const { id } = useParams();

  // State hooks
  const { playCorrect, playIncorrect, audioLoaded } = useAudio();
  const [showSolution, setShowSolution] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [feedbackImage, setFeedbackImage] = useState(null);
  const [showProblemFeedback, setShowProblemFeedback] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState(null);

  // Debug useEffect
  useEffect(() => {
    // Debug logging removed during decluttering
    
    if (!problem && !loading && !error) {
      fetchProblem();
    }
  }, [problem, loading, error, fetchProblem, id, problemStatementWithMeta]); 

  // Problem loading effect
  useEffect(() => {
    const loadProblem = async () => {
      if (id) {
        try {
          const result = await api.getProblemById(id);
          
          if (result && result.data) {
            const problem = result.data;
            
            // Extract year and contest from contest_id (e.g., "AMC10A_2022")
            let year, contest;
            if (problem.contest_id) {
              const parts = problem.contest_id.split('_');
              if (parts.length === 2) {
                // Format: "AMC10A_2022" -> contest="AMC 10A", year=2022
                const contestPart = parts[0];
                // Insert space between letters and numbers for readability
                contest = contestPart.replace(/(\d+)([A-Z])/g, '$1 $2');
                year = parts[1];
              }
            }
            
            // Add these fields to the problem object
            const enrichedProblem = {
              ...problem,
              // Use existing fields if available, otherwise use parsed values
              year: problem.year || year,
              contest: problem.contest || contest,
              problem_statement: problem.problem_text
            };
            
            setProblem(enrichedProblem);
            
            // Add the metadata to the problem statement
            const processed = enrichedProblem.problem_statement || problem.problem_text || problem.content || '';
            const meta = `\n\n**(${enrichedProblem.year || '?'}, ${enrichedProblem.contest || '?'}, Problem ${problem.problem_number || '?'})**`;
            setProblemStatementWithMeta(processed + meta);
            
            setProblemStartTime(Date.now());
          }
        } catch (error) {
        }
      }
    };
    
    loadProblem();
  }, [id, setProblem, setProblemStatementWithMeta, setProblemStartTime]);

  // Handle next problem click
  const handleNextProblem = useCallback(async () => {
    try {
      
      setAnswersDisabled(true);
      
      setShowSolution(false);
      setAnswered(false);
      setIsCorrect(null);
      setFeedbackImage(null);
      
      setCurrentIndex(prev => prev + 1);
      
      // Check if we've reached 25 problems
      if (currentIndex >= 25) {
        setSessionComplete(true);
        return; // Exit early - no need to fetch more problems
      }
      
      // Use nextProblem for ordered problem navigation
      if (nextProblem) {
        await nextProblem();
      }
    } catch (error) {
      
      // If we get a 404, this means the session is complete
      if (error.response && error.response.status === 404) {
        setSessionComplete(true);
      }
    } finally {
      setAnswersDisabled(false);
    }
  }, [
    currentIndex,
    nextProblem,
    setAnswered, 
    setAnswersDisabled, 
    setCurrentIndex, 
    setIsCorrect,
    setShowSolution,
    setFeedbackImage,
    setSessionComplete
  ]);

  // Handle choice click
  const handleChoiceClick = useCallback(async (choice) => {
    setSelectedChoice(choice); // Track the selected option
    
    // Skip if answers are disabled or already answered
    if (answersDisabled || answered) {
      return;
    }
    
    // Calculate time spent on this problem in milliseconds
    const timeSpentMs = Date.now() - problemStartTime;
    
    // Update accumulated time in milliseconds
    setCumulativeTime(prev => prev + timeSpentMs);
    
    // Mark as answered
    setAnswered(true);
    if (mode === 'competition') {
      setAnswersDisabled(true);
    }
    
    // Check if the answer is correct
    const correctAnswer = problem.correct_answer;
    const isAnswerCorrect = choice === correctAnswer;
    
    // Update score and tracking
    setAttempted(prev => prev + 1);
    
    if (isAnswerCorrect) {
      setScore(prev => prev + 1);
      
      // Play sound for correct answer
      if (audioLoaded && playCorrect) {
        playCorrect();
      }
    } else {
      // Track incorrect problems
      setIncorrectProblems(prev => [...prev, {
        ...problem,
        userAnswer: choice,
        timeSpentMs
      }]);
      
      // Play sound for incorrect answer
      if (audioLoaded && playIncorrect) {
        playIncorrect();
      }
    }
    
    // Record this attempt - store time in milliseconds for accuracy
    setAttemptRecords(prev => [...prev, {
      problem_id: problem._id,
      correct: isAnswerCorrect,        // Original property
      isCorrect: isAnswerCorrect,      // Add isCorrect for consistency with ProblemContext
      timeSpent: timeSpentMs,          // Store in milliseconds
      time: timeSpentMs / 1000,        // Also store seconds for backward compatibility
      problemNumber: currentIndex,     // Add problem number for easier reference
      choice: choice,
      selectedAnswer: choice           // Add selectedAnswer for consistent naming
    }]);
    
    // Show feedback
    setIsCorrect(isAnswerCorrect);
    
    // If in contest mode, immediately advance to the next problem without delay
    if (mode === "competition") {

      // Check if this was the last problem (25th)
      if (currentIndex >= 25 || attempted >= 25) {
        setSessionComplete(true);
        return;
      }

      try {
        await handleNextProblem();
      } catch (err) {
        // If we get a 404, it means the session is complete
        if (err.response && err.response.status === 404) {
          setSessionComplete(true);
        }
      }
    }
  }, [
    problem, problemStartTime, answered, answersDisabled,
    audioLoaded, mode, playCorrect, playIncorrect,
    setAnswered, setAnswersDisabled, setAttemptRecords,
    setCumulativeTime, setIncorrectProblems, setScore, 
    setAttempted, setIsCorrect, handleNextProblem, attempted,
    setSessionComplete, currentIndex
  ]);
  
  // Toggle solution display
  const handleShowSolution = useCallback(() => {
    setShowSolution(prev => !prev);
    setIsCorrect(null);
    setFeedbackImage(null);
  }, []);
  
  // Toggle feedback display
  const handleProblemFeedbackToggle = useCallback((checked) => {
    setShowProblemFeedback(checked);
  }, []);

  // NOW add conditional returns, after ALL hooks
  if (loading) {
    return <div className="loading-container">Loading problem...</div>;
  }
  
  if (!problem) {
    return <div className="error-container">Problem could not be loaded.</div>;
  }
  
  // Render component
  return (
    <>
      {sessionComplete ? (
        <SessionSummary />
      ) : (
        <>
          <section className="question-section">
            {mode === "practice" && <h2>Problem {currentIndex}</h2>}
            <div className="markdown-content">
              <MathRenderer>
                {problemStatementWithMeta}
              </MathRenderer>
            </div>
            {problem?.image && typeof problem.image === 'string' && (
              <div className="image-container">
                <img src={problem.image} alt="Problem Diagram" loading="lazy" />
              </div>
            )}
          </section>

          {mode === "practice" && (
            <div className="settings-row">
              <label className="feedback-toggle">
                <input 
                  type="checkbox"
                  checked={showProblemFeedback}
                  onChange={(e) => handleProblemFeedbackToggle(e.target.checked)}
                />
                Show answer feedback
              </label>
            </div>
          )}

          <AnswerChoices
            problem={problem}
            mode={mode}
            answered={answered}
            answersDisabled={answersDisabled}
            onChoiceClick={handleChoiceClick}
            onShowSolution={handleShowSolution}
            onNextProblem={handleNextProblem}
            showSolution={showSolution}
            selectedChoice={selectedChoice} 
          />

          {showSolution && mode === "practice" && (
            <SolutionDisplay problem={problem} />
          )}
          
          {isCorrect !== null && showProblemFeedback && mode === "practice" && (
            <FeedbackPanel isCorrect={isCorrect} feedbackImage={feedbackImage} />
          )}
        </>
      )}
    </>
  );
};

export default ProblemView;