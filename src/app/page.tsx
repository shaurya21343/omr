'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, CheckCircle, XCircle, Clock, 
  Trash2, Eye, Plus, ArrowLeft, Save, 
  History, Settings, ChevronDown, ChevronUp
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create')
  const [questionCount, setQuestionCount] = useState(10)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(10).fill(null))
  const [submitted, setSubmitted] = useState(false)
  const [history, setHistory] = useState<OMRSubmission[]>([])
  const [showResult, setShowResult] = useState(false)
  const [currentResult, setCurrentResult] = useState<OMRSubmission | null>(null)
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setHistory(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load history:', e)
    }
  }, [])

  // Update answers array when question count changes
  useEffect(() => {
    setAnswers(prev => {
      const newAnswers = [...prev]
      if (newAnswers.length < questionCount) {
        newAnswers.push(...Array(questionCount - newAnswers.length).fill(null))
      } else if (newAnswers.length > questionCount) {
        newAnswers.length = questionCount
      }
      return newAnswers
    })
    setSubmitted(false)
    setShowResult(false)
  }, [questionCount])

  const handleAnswerChange = (questionIndex: number, option: number) => {
    if (submitted) return
    setAnswers(prev => {
      const newAnswers = [...prev]
      newAnswers[questionIndex] = option
      return newAnswers
    })
  }

  const handleSubmit = () => {
    const answeredCount = answers.filter(a => a !== null).length
    const unansweredCount = answers.filter(a => a === null).length
    
    const submission: OMRSubmission = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      timestamp: Date.now(),
      questionCount,
      answers: [...answers],
      answeredCount,
      unansweredCount
    }

    // Save to history
    const newHistory = [submission, ...history]
    setHistory(newHistory)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))

    setCurrentResult(submission)
    setShowResult(true)
    setSubmitted(true)
    
    showAlert('success', `OMR submitted successfully! ${answeredCount} answered, ${unansweredCount} unanswered.`)
  }

  const handleReset = () => {
    setAnswers(Array(questionCount).fill(null))
    setSubmitted(false)
    setShowResult(false)
    setCurrentResult(null)
  }

  const handleViewHistory = (submission: OMRSubmission) => {
    setCurrentResult(submission)
    setShowResult(true)
    setExpandedHistoryId(expandedHistoryId === submission.id ? null : submission.id)
  }

  const handleDeleteHistory = (id: string) => {
    const newHistory = history.filter(h => h.id !== id)
    setHistory(newHistory)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
    if (expandedHistoryId === id) setExpandedHistoryId(null)
    showAlert('success', 'History entry deleted')
  }

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      setHistory([])
      localStorage.removeItem(STORAGE_KEY)
      showAlert('success', 'All history cleared')
    }
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 3000)
  }

  const getOptionLetter = (index: number) => String.fromCharCode(65 + index)

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 700, 
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}>
          <FileText className="text-primary" size={28} />
          Digital OMR Sheet
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Create, submit, and track your OMR responses</p>
      </header>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      <div className="tabs" role="tablist">
        <button 
          role="tab" 
          aria-selected={activeTab === 'create'}
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <Plus size={16} /> Create OMR
        </button>
        <button 
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
          {!submitted ? (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <Settings size={20} style={{marginRight: '0.5rem'}} /> OMR Configuration
                </h2>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="questionCount">Number of Questions</label>
                <input
                  type="number"
                  id="questionCount"
                  className="form-input"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={200}
                  style={{ width: '120px' }}
                />
              </div>

              <div className="flex-between" style={{ marginTop: '1rem' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {questionCount} questions • 4 options each (A, B, C, D)
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    if (questionCount > 0) {
                      // Just to focus the first question
                      setSubmitted(false)
                    }
                  }}
                  disabled={questionCount < 1}
                >
                  <FileText size={16} /> Generate OMR Sheet
                </button>
              </div>
            </div>
          ) : null}

          {!submitted && questionCount > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <FileText size={20} style={{marginRight: '0.5rem'}} /> OMR Sheet - {questionCount} Questions
                </h2>
                <span className="badge badge-primary">{answers.filter(a => a !== null).length}/{questionCount} Answered</span>
              </div>

              <div className="omr-sheet" style={{ maxHeight: '60vh', overflow: 'auto' }}>
                {Array.from({ length: questionCount }, (_, i) => i).map((qIndex) => (
                  <div key={qIndex} className="omr-question">
                    <div className="omr-question-header">
                      <span className="omr-question-number">Question {qIndex + 1}</span>
                      {answers[qIndex] !== null && (
                        <span className="badge badge-success">
                          {getOptionLetter(answers[qIndex])}
                        </span>
                      )}
                    </div>
                    <div className="omr-options" role="radiogroup" aria-label={`Question ${qIndex + 1} options`}>
                      {[0, 1, 2, 3].map((optIndex) => (
                        <label 
                          key={optIndex}
                          className={`option-label ${answers[qIndex] === optIndex ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`q${qIndex}`}
                            value={optIndex}
                            checked={answers[qIndex] === optIndex}
                            onChange={() => handleAnswerChange(qIndex, optIndex)}
                            disabled={submitted}
                          />
                          <span className="option-letter">{getOptionLetter(optIndex)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleReset}
                  disabled={answers.every(a => a === null)}
                >
                  <ArrowLeft size={16} /> Reset
                </button>
                <button 
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
                  <CheckCircle size={20} style={{marginRight: '0.5rem', color: 'var(--success)'}} /> Submission Result
                </h2>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { setShowResult(false); setSubmitted(false); }}
                >
                  <ArrowLeft size={16} /> New OMR
                </button>
              </div>

              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--success-light)', borderRadius: '8px', border: '1px solid #86efac' }}>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Submitted</div>
                    <div style={{ fontWeight: 600 }}>{currentResult.date}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Total Questions</div>
                    <div style={{ fontWeight: 600 }}>{currentResult.questionCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Answered</div>
                    <div style={{ fontWeight: 600, color: 'var(--success)' }}>{currentResult.answeredCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Unanswered</div>
                    <div style={{ fontWeight: 600, color: 'var(--danger)' }}>{currentResult.unansweredCount}</div>
                  </div>
                </div>
              </div>

              <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Answer Key</h3>
              <div className="result-list" style={{ maxHeight: '50vh', overflow: 'auto' }}>
                {currentResult.answers.map((answer, index) => (
                  <div key={index} className="result-item">
                    <span className="result-question">Question {index + 1}</span>
                    <span className={`result-answer ${answer !== null ? 'answered' : 'unanswered'}`}>
                      {answer !== null ? getOptionLetter(answer) : 'Not Answered'}
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
              <History size={20} style={{marginRight: '0.5rem'}} /> OMR History
            </h2>
            {history.length > 0 && (
              <button className="btn btn-danger" onClick={handleClearHistory} style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <History size={48} style={{color: 'var(--border)'}} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No History Yet</h3>
              <p style={{ marginBottom: '1.5rem' }}>Submit your first OMR to see it here</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('create')}>
                <Plus size={16} /> Create OMR
              </button>
            </div>
          ) : (
            <div className="history-list">
              {history.map((submission) => {
                const isExpanded = expandedHistoryId === submission.id
                return (
                  <div key={submission.id} className="history-item">
                    <div className="history-header">
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          OMR - {submission.questionCount} Questions
                        </div>
                        <span className="history-date">{formatDate(submission.timestamp)}</span>
                      </div>
                      <div className="history-stats">
                        <span className="history-stat">
                          <CheckCircle size={14} style={{color: 'var(--success)'}} /> {submission.answeredCount} Answered
                        </span>
                        <span className="history-stat">
                          <XCircle size={14} style={{color: 'var(--danger)'}} /> {submission.unansweredCount} Unanswered
                        </span>
                      </div>
                    </div>
                    
                    <div className="history-actions">
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleViewHistory(submission)}
                        style={{ flex: 1 }}
                      >
                        <Eye size={14} /> {isExpanded ? 'Hide Details' : 'View Details'}
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleDeleteHistory(submission.id)}
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>Answers:</h4>
                        <div className="result-list" style={{ maxHeight: '30vh', overflow: 'auto' }}>
                          {submission.answers.map((answer, index) => (
                            <div key={index} className="result-item" style={{ padding: '0.5rem 0.75rem' }}>
                              <span className="result-question" style={{ fontSize: '0.8125rem' }}>Q{index + 1}</span>
                              <span className={`result-answer ${answer !== null ? 'answered' : 'unanswered'}`} style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem' }}>
                                {answer !== null ? getOptionLetter(answer) : '—'}
                              </span>
                            </div>
                          ))}
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