import React, { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

interface ExultQuizProps {
  registrationId: string;
  onNavigate: (path: string) => void;
}

const ExultQuiz: React.FC<ExultQuizProps> = ({ registrationId, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data State
  const [registration, setRegistration] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  
  // Quiz State
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Security State
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null);

  // 1. Fetch Initial Data
  useEffect(() => {
    const init = async () => {
      try {
        const regDoc = await getDoc(doc(db, 'exult_registrations', registrationId));
        if (!regDoc.exists()) {
          setError('Registration not found.');
          setLoading(false);
          return;
        }
        
        const regData = regDoc.data();
        setRegistration(regData);

        if (regData.status === 'completed' || regData.status === 'disqualified') {
          setIsCompleted(true);
          setLoading(false);
          return;
        }

        const eventDoc = await getDoc(doc(db, 'exult_events', regData.eventId));
        if (!eventDoc.exists()) {
          setError('Event not found.');
          setLoading(false);
          return;
        }
        
        const eventData = eventDoc.data();
        setEvent(eventData);

        // Group and shuffle questions by type to create rounds
        if (eventData.quizQuestions) {
          const round1 = eventData.quizQuestions.filter((q: any) => !q.type || q.type === 'multiple-choice');
          const round2 = eventData.quizQuestions.filter((q: any) => q.type === 'short-answer');
          const round3 = eventData.quizQuestions.filter((q: any) => q.type === 'image-identification');

          const decodeText = (text: string) => {
            if (text && typeof text === 'string' && text.startsWith('[ENC]')) {
              try {
                return decodeURIComponent(atob(text.substring(5)));
              } catch(e) {
                return text;
              }
            }
            return text;
          };

          const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);
          const prepareQuestions = (arr: any[]) => shuffle([...arr]).map((q: any) => ({
             ...q,
             text: decodeText(q.text),
             options: q.options ? shuffle([...q.options]).map((opt: string) => decodeText(opt)) : []
          }));

          const sortedQs = [
            ...prepareQuestions(round1),
            ...prepareQuestions(round2),
            ...prepareQuestions(round3)
          ];
          setQuestions(sortedQs);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading quiz:", err);
        setError('Failed to load quiz. Please check connection.');
        setLoading(false);
      }
    };
    init();
  }, [registrationId]);

  // 2. Submit Logic
  const submitQuiz = useCallback(async (forcedStatus?: 'completed' | 'disqualified', reason?: string) => {
    if (isCompleted || !registration) return;
    setIsCompleted(true);
    
    try {
      // Calculate time taken client side for display, though server checks start/end time
      const startTime = registration.quizStartTime?.toDate ? registration.quizStartTime.toDate().getTime() : Date.now();
      const endTimeMs = Date.now();
      const diffMs = endTimeMs - startTime;
      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      const timeTakenStr = `${mins}m ${secs}s`;

      const updateData: any = {
        status: forcedStatus || 'completed',
        quizAnswers: answers,
        quizEndTime: serverTimestamp(),
        timeTaken: timeTakenStr
      };

      if (reason) {
        updateData.disqualifiedReason = reason;
      }

      await updateDoc(doc(db, 'exult_registrations', registrationId), updateData);

      // Exit fullscreen safely
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error(err));
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      alert("Failed to save submission! Please notify the coordinators immediately.");
    }
  }, [answers, isCompleted, registration, registrationId]);

  // 3. Timer Effect
  useEffect(() => {
    if (!hasStarted || isCompleted || !event?.quizTimeLimit || !registration?.quizStartTime) return;

    const interval = setInterval(() => {
      // Use Firebase's recorded start time to prevent client local clock manipulation
      const startTimeMs = registration.quizStartTime.toDate().getTime();
      const allowedTimeMs = event.quizTimeLimit * 60 * 1000;
      const elapsedMs = Date.now() - startTimeMs;
      const remaining = Math.floor((allowedTimeMs - elapsedMs) / 1000);

      if (remaining <= 0) {
        clearInterval(interval);
        submitQuiz('completed');
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, isCompleted, event, registration, submitQuiz]);

  // 3.5 Per-Question Timer Effect
  useEffect(() => {
    if (hasStarted && !isCompleted && event?.questionTimeLimitSeconds) {
      setQuestionTimeLeft(Number(event.questionTimeLimitSeconds));
    }
  }, [currentQuestionIdx, hasStarted, isCompleted, event]);

  useEffect(() => {
    if (!hasStarted || isCompleted || questionTimeLeft === null) return;
    
    if (questionTimeLeft <= 0) {
      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
      } else {
        submitQuiz('completed');
      }
      return;
    }

    const interval = setInterval(() => {
      setQuestionTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, isCompleted, questionTimeLeft, currentQuestionIdx, questions.length, submitQuiz]);

  // 4. Anti-Cheat: Visibility / Tab Switching
  useEffect(() => {
    if (!hasStarted || isCompleted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount === 1) {
            setWarningMessage('WARNING: Tab switching is strictly prohibited! If you leave this tab again, your quiz will be instantly disqualified and auto-submitted.');
            setShowWarning(true);
          } else if (newCount >= 2) {
            submitQuiz('disqualified', 'Tab Switching Violation');
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasStarted, isCompleted, submitQuiz]);

  // 5. Anti-Cheat: Keyboard Shortcuts & Context Menu
  useEffect(() => {
    if (!hasStarted || isCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12
      if (e.key === 'F12') e.preventDefault();
      // Block Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C / Ctrl+U
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) e.preventDefault();
      if (e.ctrlKey && e.key.toUpperCase() === 'U') e.preventDefault();
      // Block PrintScreen & Ctrl+P
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key.toUpperCase() === 'P')) {
        e.preventDefault();
        setWarningMessage('Screenshots and Printing are disabled!');
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      }
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [hasStarted, isCompleted]);

  // 6. Enter Quiz
  const startQuiz = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      }
      setHasStarted(true);
      // Immediately trigger an update to get fresh serverTimestamp if needed, but it was already set in ExultEvent.
    } catch (err) {
      alert("You must allow full screen mode to start the quiz.");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#050B08] flex justify-center items-center"><div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div></div>;
  }

  if (error) {
    return <div className="min-h-screen bg-[#050B08] text-white flex items-center justify-center"><h2>{error}</h2></div>;
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#050B08] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h1 className="text-3xl font-bold mb-4">Quiz Submitted!</h1>
        {registration?.status === 'disqualified' && (
          <p className="text-red-400 mb-4 border border-red-500/30 bg-red-500/10 p-4 rounded-lg">Your submission was flagged for a rule violation (tab switching). Your score will be subject to review.</p>
        )}
        <p className="text-slate-400 mb-8 max-w-md">Thank you for participating. Your score and time have been securely recorded. You may now close this window.</p>
        <button onClick={() => onNavigate('/exult')} className="text-purple-400 hover:underline">Return to Home</button>
      </div>
    );
  }

  if (!hasStarted) {
    const now = new Date();
    let isQuizOpen = true;
    let quizStatusMessage = '';

    if (event?.quizStartDateTime && new Date(event.quizStartDateTime) > now) {
      isQuizOpen = false;
      quizStatusMessage = 'The quiz has not started yet. Please wait.';
    } else if (event?.quizEndDateTime && new Date(event.quizEndDateTime) < now) {
      isQuizOpen = false;
      quizStatusMessage = 'The quiz has ended.';
    }

    return (
      <div className="min-h-screen bg-[#050B08] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl bg-slate-900/80 border border-purple-500/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.15)] text-center">
          <h1 className="text-3xl font-bold mb-2 text-purple-400">{event?.title} - Quiz Mode</h1>
          <p className="text-slate-300 mb-8">Welcome, {registration?.name}. Please read the strict guidelines below.</p>
          
          <div className="text-left space-y-4 mb-8 bg-black/40 p-6 rounded-xl border border-white/5">
            <h3 className="font-bold text-red-400 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              STRICT ANTI-CHEAT ENABLED
            </h3>
            <ul className="list-disc pl-5 text-sm text-slate-300 space-y-2">
              <li>Your global timer ({event?.quizTimeLimit} minutes) will start as soon as you enter.</li>
              {event?.questionTimeLimitSeconds && (
                <li><b>EACH QUESTION</b> has a strict timer of {event.questionTimeLimitSeconds} seconds. It will auto-skip if unanswered. You cannot go back to previous questions.</li>
              )}
              <li>Do <b>NOT</b> switch tabs or minimize the browser. The first offense will trigger a warning, the second will <b>disqualify</b> and auto-submit your quiz.</li>
              <li>Right-click, text selection, and keyboard shortcuts are disabled.</li>
              <li>The quiz will automatically submit when the timer expires.</li>
            </ul>
          </div>

          {!isQuizOpen ? (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-center font-bold">
              {quizStatusMessage}
            </div>
          ) : (
            <button onClick={startQuiz} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-10 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all transform hover:scale-105">
              AGREE & ENTER FULLSCREEN
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active Quiz Render
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentQuestionIdx];

  return (
    <div 
      className="min-h-screen bg-[#050B08] text-white font-sans relative overflow-hidden select-none"
      onCopy={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Print Overlay Prevention */}
      <style>{`
        @media print {
          body { display: none !important; }
        }
      `}</style>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/90 backdrop-blur-sm p-6">
          <div className="bg-black border border-red-500 p-8 rounded-2xl max-w-lg text-center shadow-[0_0_50px_rgba(239,68,68,0.5)]">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <h2 className="text-2xl font-bold text-red-500 mb-4">RULE VIOLATION DETECTED</h2>
            <p className="text-lg mb-6">{warningMessage}</p>
            <button onClick={() => setShowWarning(false)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-xl">I UNDERSTAND</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0">
        <div className="font-bold text-purple-400 hidden md:block">{event?.title}</div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 hidden md:block text-purple-200">
            {(!questions[currentQuestionIdx]?.type || questions[currentQuestionIdx]?.type === 'multiple-choice') ? 'Round 1: Objective' : 
             questions[currentQuestionIdx]?.type === 'short-answer' ? 'Round 2: Short Answer' : 'Round 3: Image ID'}
          </div>
          <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">
            Q {currentQuestionIdx + 1} / {questions.length}
          </div>
          
          {event?.questionTimeLimitSeconds && (
            <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${questionTimeLeft && questionTimeLeft <= 5 ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : 'bg-orange-500/20 border-orange-500/30 text-orange-300'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {questionTimeLeft}s
            </div>
          )}

          <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${timeLeft && timeLeft < 60 ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : 'bg-purple-500/20 border-purple-500/30 text-purple-300'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {formatTime(timeLeft)}
          </div>
          <button onClick={() => submitQuiz('completed')} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            Finish Quiz
          </button>
        </div>
      </div>

      {/* Main Quiz Area */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {currentQ && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl md:text-3xl font-semibold mb-8 leading-relaxed">
              <span className="text-purple-500 mr-2">Q.</span>
              {currentQ.text}
            </h2>
            
              {currentQ.imageUrl && currentQ.type === 'image-identification' && (
                <div className="mb-6 flex justify-center">
                  <img src={currentQ.imageUrl} alt="Quiz Question" className="max-w-full max-h-[400px] object-contain rounded-xl border border-white/20 shadow-2xl" />
                </div>
              )}

              {(!currentQ.type || currentQ.type === 'multiple-choice') ? (
                <div className="space-y-4">
                  {currentQ.options.map((opt: string, i: number) => {
                    const isSelected = answers[currentQ.id] === opt;
                    return (
                      <label key={i} className={`flex items-center p-5 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}>
                        <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${isSelected ? 'border-purple-500' : 'border-slate-500'}`}>
                          {isSelected && <div className="w-3 h-3 bg-purple-500 rounded-full"></div>}
                        </div>
                        <input 
                          type="radio" 
                          name={`q_${currentQ.id}`} 
                          className="hidden" 
                          checked={isSelected}
                          onChange={() => setAnswers(prev => ({ ...prev, [currentQ.id]: opt }))}
                        />
                        <span className="text-lg">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6">
                  <input 
                    type="text" 
                    placeholder="Type your answer here..." 
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-white/20"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <p className="text-sm text-white/40 mt-3 text-center">Type your exact answer. Spelling matters!</p>
                </div>
              )}
          </div>
        )}
        
        {/* Navigation */}
        <div className="flex justify-between mt-12 pt-8 border-t border-white/10">
          {!event?.questionTimeLimitSeconds ? (
            <button 
              disabled={currentQuestionIdx === 0 || questions[currentQuestionIdx]?.type !== questions[currentQuestionIdx - 1]?.type}
              title={questions[currentQuestionIdx]?.type !== questions[currentQuestionIdx - 1]?.type ? "Cannot go back to previous round" : "Previous Question"}
              onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              Previous
            </button>
          ) : (
            <div></div> /* Empty div to push next button to right */
          )}
          
          {currentQuestionIdx < questions.length - 1 ? (
            <button 
              onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] font-bold flex items-center gap-2"
            >
              Next
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          ) : (
            <button 
              onClick={() => submitQuiz('completed')}
              className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] font-bold flex items-center gap-2 text-black"
            >
              Submit Quiz
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExultQuiz;
