
'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Plus,
  ArrowLeft,
  History,
  Settings,
} from 'lucide-react'

interface OMRSubmission {
  id: string
  date: string
  timestamp: number
  questionCount: number
  answers: (number | null)[]
  answeredCount: number
  unansweredCount: number
}

const STORAGE_KEY = 'omr_history'
const MIN_QUESTIONS = 1
const MAX_QUESTIONS = 200

export default function Home() {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create')
  const [questionCount, setQuestionCount] = useState(10)
  const [questionCountInput, setQuestionCountInput] = useState('10')
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(10).fill(null)
  )
  const [submitted, setSubmitted] = useState(false)
  const [history, setHistory] = useState<OMRSubmission[]>([])
  const [showResult, setShowResult] = useState(false)
  const [currentResult, setCurrentResult] =
    useState<OMRSubmission | null>(null)
  const [expandedHistoryId, setExpandedHistoryId] =
    useState<string | null>(null)
  const [alert, setAlert] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)

      if (stored) {
        const parsed: OMRSubmission[] = JSON.parse(stored)
        setHistory(parsed)
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }, [])

  // Keep the answers array in sync with the question count
  useEffect(() => {
    setAnswers((previous) => {
      const next = [...previous]

      if (next.length < questionCount) {
        next.push(
          ...Array(questionCount - next.length).fill(null)
        )
      } else if (next.length > questionCount) {
        next.length = questionCount
      }

      return next
    })

    setSubmitted(false)
    setShowResult(false)
    setCurrentResult(null)
  }, [questionCount])

  // Allow empty input while editing
  const handleQuestionCountChange = (value: string) => {
    if (!/^\d*$/.test(value)) return

    setQuestionCountInput(value)

    // Don't force a value while the field is temporarily empty
    if (value === '') return

    const parsed = Number(value)

    if (parsed >= MIN_QUESTIONS && parsed <= MAX_QUESTIONS) {
      setQuestionCount(parsed)
    }
  }

  // Validate the value after editing finishes
  const handleQuestionCountBlur = () => {
    const parsed = Number(questionCountInput)

    const validCount =
      questionCountInput.trim() === ''
        ? MIN_QUESTIONS
        : Math.max(
            MIN_QUESTIONS,
            Math.min(MAX_QUESTIONS, parsed)
          )

    setQuestionCount(validCount)
    setQuestionCountInput(String(validCount))
  }

  // Mobile-friendly increment and decrement buttons
  const adjustQuestionCount = (amount: number) => {
    const next = Math.max(
      MIN_QUESTIONS,
      Math.min(MAX_QUESTIONS, questionCount + amount)
    )

    setQuestionCount(next)
    setQuestionCountInput(String(next))
  }

  const handleAnswerChange = (
    questionIndex: number,
    option: number
  ) => {
    if (submitted) return

    setAnswers((previous) => {
      const next = [...previous]
      next[questionIndex] = option
      return next
    })
  }

  const showAlert = (
    type: 'success' | 'error',
    message: string
  ) => {
    setAlert({ type, message })
  }

  const handleSubmit = () => {
    const answeredCount = answers.filter(
      (answer) => answer !== null
    ).length

    const unansweredCount = answers.filter(
      (answer) => answer === null
    ).length

    const timestamp = Date.now()

    const submission: OMRSubmission = {
      id: timestamp.toString(),
      date: new Date(timestamp).toLocaleString(),
      timestamp,
      questionCount,
      answers: [...answers],
      answeredCount,
      unansweredCount,
    }

    const newHistory = [submission, ...history]

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(newHistory)
      )

      setHistory(newHistory)
      setCurrentResult(submission)
      setShowResult(true)
      setSubmitted(true)

      showAlert(
        'success',
        `OMR submitted successfully! ${answeredCount} answered, ${unansweredCount} unanswered.`
      )
    } catch (error) {
      console.error('Failed to save OMR history:', error)

      showAlert(
        'error',
        'Unable to save your submission. Check your browser storage.'
      )
    }
  }

  const handleReset = () => {
    setAnswers(Array(questionCount).fill(null))
    setSubmitted(false)
    setShowResult(false)
    setCurrentResult(null)
  }

  const handleViewHistory = (submission: OMRSubmission) => {
    if (expandedHistoryId === submission.id) {
      setExpandedHistoryId(null)
      return
    }

    setCurrentResult(submission)
    setExpandedHistoryId(submission.id)
  }

  const handleDeleteHistory = (id: string) => {
    const newHistory = history.filter(
      (submission) => submission.id !== id
    )

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(newHistory)
      )

      setHistory(newHistory)

      if (expandedHistoryId === id) {
        setExpandedHistoryId(null)
        setCurrentResult(null)
      }

      showAlert('success', 'History entry deleted')
    } catch (error) {
      console.error('Failed to delete history:', error)
      showAlert('error', 'Unable to delete this history entry.')
    }
  }

  const handleClearHistory = () => {
    if (
      !confirm(
        'Are you sure you want to clear all history? This cannot be undone.'
      )
    ) {
      return
    }

    try {
      localStorage.removeItem(STORAGE_KEY)
      setHistory([])
      setExpandedHistoryId(null)
      setCurrentResult(null)

      showAlert('success', 'All history cleared')
    } catch (error) {
      console.error('Failed to clear history:', error)
      showAlert('error', 'Unable to clear history.')
    }
  }

  const getOptionLetter = (index: number) =>
    String.fromCharCode(65 + index)

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleString()

  return (
    <div className="container">
      <header
        style={{
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
          }}
        >
          <FileText className="text-primary" size={28} />
          Digital OMR Sheet
        </h1>

        <p style={{ color: 'var(--text-secondary)' }}>
          Create, submit, and track your OMR responses
        </p>
      </header>

      {alert && (
        <div
          className={`alert alert-${alert.type}`}
          role="status"
        >
          <span>{alert.message}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setAlert(null)}
            style={{
              marginLeft: '0.75rem',
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'create'}
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <Plus size={16} /> Create OMR
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} /> History ({history.length})
        </button>
      </div>

      {activeTab === 'create' && (
        <>
          {!submitted && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <Settings
                    size={20}
                    style={{ marginRight: '0.5rem' }}
                  />
                  OMR Configuration
                </h2>
              </div>

              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="questionCount"
                >
                  Number of Questions
                </label>

                {/* Responsive question count control */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: 'fit-content',
                    maxWidth: '100%',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => adjustQuestionCount(-1)}
                    disabled={questionCount <= MIN_QUESTIONS}
                    aria-label="Decrease number of questions"
                    style={{
                      width: '44px',
                      height: '44px',
                      minWidth: '44px',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      touchAction: 'manipulation',
                    }}
                  >
                    −
                  </button>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    id="questionCount"
                    className="form-input"
                    value={questionCountInput}
                    onChange={(event) =>
                      handleQuestionCountChange(
                        event.target.value
                      )
                    }
                    onBlur={handleQuestionCountBlur}
                    aria-label="Number of questions (1 to 200)"
                    autoComplete="off"
                    style={{
                      width: '84px',
                      minWidth: '0',
                      height: '44px',
                      boxSizing: 'border-box',
                      textAlign: 'center',
                      fontSize: '1rem',
                    }}
                  />

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => adjustQuestionCount(1)}
                    disabled={questionCount >= MAX_QUESTIONS}
                    aria-label="Increase number of questions"
                    style={{
                      width: '44px',
                      height: '44px',
                      minWidth: '44px',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      touchAction: 'manipulation',
                    }}
                  >
                    +
                  </button>
                </div>

                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    marginTop: '0.5rem',
                  }}
                >
                  Choose between 1 and 200 questions.
                </p>
              </div>

              <div
                className="flex-between"
                style={{ marginTop: '1rem' }}
              >
                <div
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                  }}
                >
                  {questionCount} questions • 4 options each
                  (A, B, C, D)
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    handleQuestionCountBlur()
                  }}
                  disabled={
                    questionCount < MIN_QUESTIONS ||
                    questionCount > MAX_QUESTIONS
                  }
                >
                  <FileText size={16} /> Generate OMR Sheet
                </button>
              </div>
            </div>
          )}

          {!submitted && questionCount > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <FileText
                    size={20}
                    style={{ marginRight: '0.5rem' }}
                  />
                  OMR Sheet - {questionCount} Questions
                </h2>

                <span className="badge badge-primary">
                  {answers.filter((answer) => answer !== null).length}
                  /{questionCount} Answered
                </span>
              </div>

              <div
                className="omr-sheet"
                style={{
                  maxHeight: '60vh',
                  overflow: 'auto',
                }}
              >
                {Array.from(
                  { length: questionCount },
                  (_, index) => index
                ).map((questionIndex) => (
                  <div
                    key={questionIndex}
                    className="omr-question"
                  >
                    <div className="omr-question-header">
                      <span className="omr-question-number">
                        Question {questionIndex + 1}
                      </span>

                      {answers[questionIndex] !== null && (
                        <span className="badge badge-success">
                          {getOptionLetter(
                            answers[questionIndex]!
                          )}
                        </span>
                      )}
                    </div>

                    <div
                      className="omr-options"
                      role="radiogroup"
                      aria-label={`Question ${questionIndex + 1} options`}
                    >
                      {[0, 1, 2, 3].map((optionIndex) => (
                        <label
                          key={optionIndex}
                          className={`option-label ${
                            answers[questionIndex] === optionIndex
                              ? 'selected'
                              : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q${questionIndex}`}
                            value={optionIndex}
                            checked={
                              answers[questionIndex] === optionIndex
                            }
                            onChange={() =>
                              handleAnswerChange(
                                questionIndex,
                                optionIndex
                              )
                            }
                            disabled={submitted}
                          />

                          <span className="option-letter">
                            {getOptionLetter(optionIndex)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                  marginTop: '1rem',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={answers.every(
                    (answer) => answer === null
                  )}
                >
                  <ArrowLeft size={16} /> Reset
                </button>

                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSubmit}
                >
                  <CheckCircle size={16} /> Submit OMR
                </button>
              </div>
            </div>
          )}

          {showResult && currentResult && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <CheckCircle
                    size={20}
                    style={{
                      marginRight: '0.5rem',
                      color: 'var(--success)',
                    }}
                  />
                  Submission Result
                </h2>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowResult(false)
                    setSubmitted(false)
                    setCurrentResult(null)
                    setAnswers(Array(questionCount).fill(null))
                  }}
                >
                  <ArrowLeft size={16} /> New OMR
                </button>
              </div>

              <div
                style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: 'var(--success-light)',
                  borderRadius: '8px',
                  border: '1px solid #86efac',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '2rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#166534',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Submitted
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {currentResult.date}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#166534',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Total Questions
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {currentResult.questionCount}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#166534',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Answered
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: 'var(--success)',
                      }}
                    >
                      {currentResult.answeredCount}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#166534',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Unanswered
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: 'var(--danger)',
                      }}
                    >
                      {currentResult.unansweredCount}
                    </div>
                  </div>
                </div>
              </div>

              <h3
                style={{
                  marginBottom: '1rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                Answer Key
              </h3>

              <div
                className="result-list"
                style={{
                  maxHeight: '50vh',
                  overflow: 'auto',
                }}
              >
                {currentResult.answers.map((answer, index) => (
                  <div key={index} className="result-item">
                    <span className="result-question">
                      Question {index + 1}
                    </span>

                    <span
                      className={`result-answer ${
                        answer !== null
                          ? 'answered'
                          : 'unanswered'
                      }`}
                    >
                      {answer !== null
                        ? getOptionLetter(answer)
                        : 'Not Answered'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <History
                size={20}
                style={{ marginRight: '0.5rem' }}
              />
              OMR History
            </h2>

            {history.length > 0 && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleClearHistory}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8125rem',
                }}
              >
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <History
                  size={48}
                  style={{ color: 'var(--border)' }}
                />
              </div>

              <h3
                style={{
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)',
                }}
              >
                No History Yet
              </h3>

              <p style={{ marginBottom: '1.5rem' }}>
                Submit your first OMR to see it here
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('create')}
              >
                <Plus size={16} /> Create OMR
              </button>
            </div>
          ) : (
            <div className="history-list">
              {history.map((submission) => {
                const isExpanded =
                  expandedHistoryId === submission.id

                return (
                  <div
                    key={submission.id}
                    className="history-item"
                  >
                    <div className="history-header">
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '0.25rem',
                          }}
                        >
                          OMR - {submission.questionCount} Questions
                        </div>

                        <span className="history-date">
                          {formatDate(submission.timestamp)}
                        </span>
                      </div>

                      <div className="history-stats">
                        <span className="history-stat">
                          <CheckCircle
                            size={14}
                            style={{ color: 'var(--success)' }}
                          />
                          {submission.answeredCount} Answered
                        </span>

                        <span className="history-stat">
                          <XCircle
                            size={14}
                            style={{ color: 'var(--danger)' }}
                          />
                          {submission.unansweredCount} Unanswered
                        </span>
                      </div>
                    </div>

                    <div className="history-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          handleViewHistory(submission)
                        }
                        style={{ flex: 1 }}
                      >
                        <Eye size={14} />
                        {isExpanded
                          ? 'Hide Details'
                          : 'View Details'}
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() =>
                          handleDeleteHistory(submission.id)
                        }
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>

                    {isExpanded && (
                      <div
                        style={{
                          marginTop: '1rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid var(--border)',
                        }}
                      >
                        <h4
                          style={{
                            marginBottom: '0.75rem',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                          }}
                        >
                          Answers:
                        </h4>

                        <div
                          className="result-list"
                          style={{
                            maxHeight: '30vh',
                            overflow: 'auto',
                          }}
                        >
                          {submission.answers.map(
                            (answer, index) => (
                              <div
                                key={index}
                                className="result-item"
                                style={{
                                  padding: '0.5rem 0.75rem',
                                }}
                              >
                                <span
                                  className="result-question"
                                  style={{ fontSize: '0.8125rem' }}
                                >
                                  Q{index + 1}
                                </span>

                                <span
                                  className={`result-answer ${
                                    answer !== null
                                      ? 'answered'
                                      : 'unanswered'
                                  }`}
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '0.125rem 0.5rem',
                                  }}
                                >
                                  {answer !== null
                                    ? getOptionLetter(answer)
                                    : '—'}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
