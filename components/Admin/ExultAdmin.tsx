import React, { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Edit2, Trash2, Save, X, Download, Filter, Search, ChevronDown, ChevronUp, AlertTriangle, Trophy, Upload } from 'lucide-react';

const CLOUDINARY_CLOUD_NAME = 'dvntu7mui';
const CLOUDINARY_UPLOAD_PRESET = 'IEDCimages';

const encodeText = (text: string) => {
  if (!text) return text;
  return `[ENC]${btoa(encodeURIComponent(text))}`;
};

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


interface CustomField {
  id: string;
  type: 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'radio';
  label: string;
  required: boolean;
  options?: string[];
}

interface AdminQuizQuestion {
  id: string;
  type?: 'multiple-choice' | 'short-answer' | 'image-identification';
  text: string;
  imageUrl?: string;
  options: string[];
  correctOption: string;
}

interface ExultEvent {
  id: string;
  title: string;
  slug: string;
  isVisible?: boolean;
  description: string;
  date: string;
  time: string;
  venue: string;
  speaker: string;
  guidelines: string;
  posterUrl: string;
  isRegistrationEnabled: boolean;
  customFields: CustomField[];
  order: number;
  isQuiz?: boolean;
  quizTimeLimit?: number;
  questionTimeLimitSeconds?: number;
  quizStartDateTime?: string;
  quizEndDateTime?: string;
  feeAmount?: string;
  paymentQrUrl?: string;
  isGoogleForm?: boolean;
  googleFormLink?: string;
  eventType?: 'google-form' | 'website-form' | 'quiz';
  registrationStartDateTime?: string;
  registrationEndDateTime?: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  quizQuestions?: AdminQuizQuestion[];
}

interface ExultRegistration {
  id: string;
  readableId?: string;
  eventId: string;
  eventTitle: string;
  name: string;
  email: string;
  customData: Record<string, any>;
  timestamp: any;
  status?: string; // 'started', 'completed', 'disqualified'
  score?: number;
  timeTaken?: string;
  quizAnswers?: Record<string, string>;
  disqualifiedReason?: string;
  paymentScreenshotUrl?: string;
}

const ExultAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'registrations'>('events');
  
  // Events State
  const [events, setEvents] = useState<ExultEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // Registrations State
  const [registrations, setRegistrations] = useState<ExultRegistration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(true);
  const [regSearch, setRegSearch] = useState('');
  const [regFilterEvent, setRegFilterEvent] = useState('all');
  const [allQuizAnswers, setAllQuizAnswers] = useState<Record<string, any[]>>({});
  const [selectedRegResults, setSelectedRegResults] = useState<ExultRegistration | null>(null);

  // Event Form State
  const [eventForm, setEventForm] = useState<Partial<ExultEvent>>(() => {
    const saved = localStorage.getItem('exultAdminDraftForm');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      title: '', slug: '', description: '', date: '', time: '', venue: '', 
      speaker: '', guidelines: '', posterUrl: '', isRegistrationEnabled: true,
      customFields: [], order: 0, isQuiz: false, quizTimeLimit: 10, quizQuestions: [],
      feeAmount: '', paymentQrUrl: '', isGoogleForm: false, googleFormLink: ''
    };
  });
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Autosave Draft
  useEffect(() => {
    if (isEditingEvent || Object.keys(eventForm).length > 20) {
      localStorage.setItem('exultAdminDraftForm', JSON.stringify(eventForm));
    }
  }, [eventForm, isEditingEvent]);

  const fetchQuizAnswers = async () => {
    try {
      const ansSnapshot = await getDocs(collection(db, 'exult_quiz_answers'));
      const answersMap: Record<string, any[]> = {};
      ansSnapshot.docs.forEach(d => {
        answersMap[d.id] = d.data().answers;
      });
      setAllQuizAnswers(answersMap);
    } catch (error) {
      console.error('Error fetching quiz answers:', error);
    }
  };

  useEffect(() => {
    fetchQuizAnswers();
    if (activeTab === 'events') fetchEvents();
    if (activeTab === 'registrations') fetchRegistrations();
  }, [activeTab]);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const q = query(collection(db, 'exult_events'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExultEvent)));
      
      // Also fetch quiz answers for score calculation
      fetchQuizAnswers();
    } catch (error) {
      console.error('Error fetching Exult events:', error);
    }
    setLoadingEvents(false);
  };

  const fetchRegistrations = async () => {
    setLoadingRegs(true);
    try {
      const q = query(collection(db, 'exult_registrations'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      setRegistrations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExultRegistration)));
    } catch (error) {
      console.error('Error fetching Exult registrations:', error);
    }
    setLoadingRegs(false);
  };

  // ---------------- EVENT MANAGEMENT ----------------

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEventForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setEventForm(prev => ({ ...prev, [name]: value }));
      if (name === 'title' && !editingEventId) {
        setEventForm(prev => ({ ...prev, slug: generateSlug(value) }));
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'posterUrl' | 'paymentQrUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.secure_url) {
        setEventForm(prev => ({ ...prev, [fieldName]: data.secure_url }));
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error("Error uploading file to Cloudinary:", error);
      alert("Failed to upload image. Please check your Cloudinary Cloud Name and Upload Preset in the code.");
    } finally {
      setUploadingField(null);
    }
  };

  const saveEvent = async () => {
    if (!eventForm.title || !eventForm.slug) {
      alert("Title and Slug are required.");
      return;
    }
    
    try {
      let finalEventData = { ...eventForm };
      let answersData: any[] = [];
      
      if (eventForm.isQuiz) {
        answersData = eventForm.quizQuestions?.map((q: any) => ({
          questionId: q.id,
          type: q.type || 'multiple-choice',
          correctOption: q.correctOption
        })) || [];
        
        // Remove correctOption from the public event document, shuffle, and obfuscate
        finalEventData.quizQuestions = eventForm.quizQuestions?.map((q: any) => {
          const cleanQ: any = {
            id: q.id, 
            type: q.type || 'multiple-choice', 
            text: encodeText(q.text), 
            imageUrl: q.imageUrl
          };
          
          if (!q.type || q.type === 'multiple-choice' || q.type === 'image-identification') {
            // Shuffle options before saving to prevent network inspection from revealing the answer via its index
            cleanQ.options = q.options ? [...q.options].sort(() => Math.random() - 0.5).map((opt: string) => encodeText(opt)) : [];
          }
          
          return cleanQ;
        }) as any[];
      } else {
        finalEventData.quizQuestions = [];
        finalEventData.quizTimeLimit = 0;
      }
      
      let savedEventId = editingEventId;

      // Remove undefined values to prevent Firebase errors
      const cleanEventData = JSON.parse(JSON.stringify({
        ...finalEventData,
        customFields: eventForm.customFields || [],
        order: eventForm.order || events.length
      }));
      delete cleanEventData.id; // ensure ID isn't written directly if not needed, though it's fine

      if (editingEventId) {
        await updateDoc(doc(db, 'exult_events', editingEventId), cleanEventData);
      } else {
        const docRef = await addDoc(collection(db, 'exult_events'), cleanEventData);
        savedEventId = docRef.id;
      }
      
      // Save Decoupled Answers
      if (savedEventId) {
        if (eventForm.isQuiz) {
          await setDoc(doc(db, 'exult_quiz_answers', savedEventId), { answers: answersData });
        } else if (editingEventId) {
          // If it was changed from quiz to non-quiz, we could delete the answers doc but it's harmless to leave it
        }
      }

      setIsEditingEvent(false);
      setEditingEventId(null);
      localStorage.removeItem('exultAdminDraftForm');
      setEventForm({ 
        isRegistrationEnabled: true, customFields: [], order: events.length, 
        isQuiz: false, quizTimeLimit: 10, questionTimeLimitSeconds: undefined, quizQuestions: [], 
        quizStartDateTime: '', quizEndDateTime: '',
        feeAmount: '', paymentQrUrl: '', isGoogleForm: false, googleFormLink: '',
        eventType: 'website-form', registrationStartDateTime: '', registrationEndDateTime: '',
        registrationDeadline: '', maxParticipants: undefined
      });
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Error saving event");
    }
  };

  const deleteEvent = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this event AND all its registrations? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'exult_events', id));
        
        // Cascade delete registrations
        const regQuery = query(collection(db, 'exult_registrations'), where('eventId', '==', id));
        const regSnapshot = await getDocs(regQuery);
        const deletePromises = regSnapshot.docs.map(document => deleteDoc(doc(db, 'exult_registrations', document.id)));
        await Promise.all(deletePromises);
        
        fetchEvents();
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  const deleteRegistration = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this registration?")) {
      try {
        await deleteDoc(doc(db, 'exult_registrations', id));
        fetchRegistrations();
      } catch (error) {
        console.error("Error deleting registration:", error);
      }
    }
  };

  const editEvent = async (event: ExultEvent) => {
    let fullEvent = { ...event };
    const inferredType = fullEvent.eventType || (fullEvent.isQuiz ? 'quiz' : (fullEvent.isGoogleForm ? 'google-form' : 'website-form'));
    fullEvent.eventType = inferredType;
    
    if (inferredType === 'quiz' && fullEvent.quizQuestions) {
      try {
        const answersDoc = await getDoc(doc(db, 'exult_quiz_answers', fullEvent.id));
        const answersData = answersDoc.exists() ? (answersDoc.data().answers || []) : [];
        
        fullEvent.quizQuestions = fullEvent.quizQuestions?.map((q: any) => {
          const ans = answersData.find((a: any) => a.questionId === q.id);
          return { 
            ...q, 
            text: decodeText(q.text),
            options: q.options ? q.options.map((opt: string) => decodeText(opt)) : [],
            correctOption: ans ? ans.correctOption : '' 
          };
        });
      } catch (err) {
        console.error("Error fetching answers for edit", err);
      }
    }
  
  setEventForm(fullEvent);
  setEditingEventId(event.id);
  setIsEditingEvent(true);
};

  // Form Builder
  const addCustomField = () => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false
    };
    setEventForm(prev => ({ ...prev, customFields: [...(prev.customFields || []), newField] }));
  };

  const updateCustomField = (index: number, updates: Partial<CustomField>) => {
    const newFields = [...(eventForm.customFields || [])];
    newFields[index] = { ...newFields[index], ...updates };
    setEventForm(prev => ({ ...prev, customFields: newFields }));
  };

  const removeCustomField = (index: number) => {
    const newFields = [...(eventForm.customFields || [])];
    newFields.splice(index, 1);
    setEventForm(prev => ({ ...prev, customFields: newFields }));
  };

  // Quiz Builder
  const addQuizQuestion = () => {
    const newQ: AdminQuizQuestion = { id: `q_${Date.now()}`, type: 'multiple-choice', text: '', options: ['', '', '', ''], correctOption: '' };
    setEventForm(prev => ({ ...prev, quizQuestions: [...(prev.quizQuestions || []), newQ] }));
  };

  const updateQuizQuestion = (idx: number, updates: Partial<AdminQuizQuestion>) => {
    const newQs = [...(eventForm.quizQuestions || [])];
    newQs[idx] = { ...newQs[idx], ...updates };
    setEventForm(prev => ({ ...prev, quizQuestions: newQs }));
  };

  const removeQuizQuestion = (idx: number) => {
    const newQs = [...(eventForm.quizQuestions || [])];
    newQs.splice(idx, 1);
    setEventForm(prev => ({ ...prev, quizQuestions: newQs }));
  };

  const calculateScore = (reg: ExultRegistration) => {
    const answers = allQuizAnswers[reg.eventId];
    if (!answers) return null; // If we don't have the answer key, we can't score it
    if (!reg.quizAnswers) return 0; // If they submitted nothing, score is 0
    
    let score = 0;
    answers.forEach(ans => {
      const studentAns = reg.quizAnswers?.[ans.questionId] || '';
      if (!ans.type || ans.type === 'multiple-choice' || ans.type === 'image-identification') {
        if (studentAns === ans.correctOption) score += 1;
      } else {
        // For short-answer
        const cleanStudentAns = studentAns.replace(/\s+/g, '').toLowerCase();
        const cleanCorrectAns = (ans.correctOption || '').replace(/\s+/g, '').toLowerCase();
        if (cleanStudentAns === cleanCorrectAns && cleanCorrectAns !== '') score += 1;
      }
    });
    return score;
  };

  // ---------------- REGISTRATIONS MANAGEMENT ----------------
  
  const filteredRegs = registrations.filter(reg => {
    const matchesSearch = reg.name?.toLowerCase().includes(regSearch.toLowerCase()) || 
                          reg.email?.toLowerCase().includes(regSearch.toLowerCase());
    const matchesEvent = regFilterEvent === 'all' || reg.eventId === regFilterEvent;
    return matchesSearch && matchesEvent;
  });

  const exportCSV = () => {
    if (filteredRegs.length === 0) {
      alert("No data to export");
      return;
    }
    
    // Map custom field IDs to Labels
    const fieldIdToLabel: Record<string, string> = {};
    events.forEach(ev => {
      ev.customFields?.forEach(cf => {
        fieldIdToLabel[cf.id] = cf.label;
      });
    });

    // Get all possible custom field keys from the filtered set
    const customKeys = new Set<string>();
    filteredRegs.forEach(r => {
      if (r.customData) {
        Object.keys(r.customData).forEach(k => customKeys.add(k));
      }
    });
    
    const customKeyArray = Array.from(customKeys);
    // Use the mapped label if available, otherwise fallback to the raw ID
    const customHeaders = customKeyArray.map(key => fieldIdToLabel[key] || key);
    
    // Check if there are any quiz registrations
    const hasQuizzes = filteredRegs.some(r => r.status);
    const hasPayments = filteredRegs.some(r => r.paymentScreenshotUrl);
    
    const headers = ["Registration ID", "Event Title", "Name", "Email", "Date", ...customHeaders];
    if (hasQuizzes) {
      headers.push("Quiz Status", "Score", "Time Taken", "Disqualification Reason");
    }
    if (hasPayments) {
      headers.push("Payment Screenshot");
    }
    
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
    
    filteredRegs.forEach(r => {
      // Use toLocaleString to get both date and time in a standard format
      const dateStr = r.timestamp?.toDate ? r.timestamp.toDate().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '';
      
      const formatField = (val: any) => {
        if (val === undefined || val === null) return '""';
        let strVal = String(val);
        // If the value is a number string that might be converted to scientific notation,
        // use the Excel text formula ="value" but properly escaped for CSV
        if (/^[0-9]{8,20}$/.test(strVal)) {
          return `"=""${strVal}"""`;
        }
        // Standard CSV escaping
        return `"${strVal.replace(/"/g, '""')}"`;
      };

      const row = [
        formatField(r.readableId || r.id),
        formatField(r.eventTitle),
        formatField(r.name),
        formatField(r.email),
        formatField(dateStr)
      ];
      
      customKeyArray.forEach(key => {
        let val = r.customData ? r.customData[key] : '';
        if (typeof val === 'boolean') val = val ? 'Yes' : 'No';
        if (Array.isArray(val)) val = val.join('; ');
        row.push(formatField(val));
      });
      
      if (hasQuizzes) {
        row.push(formatField(r.status || ''));
        const score = (r.status === 'completed' || r.status === 'disqualified') ? calculateScore(r) : '';
        // Use 'out of' instead of '/' to prevent Excel from converting scores like '1 / 6' into dates like '01-Jun'
        row.push(formatField(score !== null && score !== '' ? `${score} out of ${allQuizAnswers[r.eventId]?.length || 0}` : ''));
        row.push(formatField(r.timeTaken || ''));
        row.push(formatField(r.disqualifiedReason || ''));
      }
      
      if (hasPayments) {
        row.push(formatField(r.paymentScreenshotUrl || ''));
      }
      
      csvRows.push(row.join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exult_registrations_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderLeaderboard = () => {
    if (regFilterEvent === 'all') return null;
    
    const selectedEvent = events.find(e => e.id === regFilterEvent);
    if (!selectedEvent?.isQuiz) return null;

    const quizRegs = filteredRegs.filter(r => r.status === 'completed');
    const scoredRegs = quizRegs.map(r => ({
      ...r,
      calcScore: calculateScore(r) || 0
    })).sort((a, b) => b.calcScore - a.calcScore).slice(0, 3); // top 3

    return (
      <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
        <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-600" /> High Scores Leaderboard
        </h3>
        {scoredRegs.length === 0 ? (
          <p className="text-sm text-purple-600">No completed quizzes yet for this event.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scoredRegs.map((reg, idx) => (
              <div key={reg.id} className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex justify-between items-center relative overflow-hidden">
                {idx === 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-20 rounded-bl-full"></div>}
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${idx === 0 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' : idx === 1 ? 'bg-slate-100 text-slate-600 border-2 border-slate-300' : 'bg-orange-50 text-orange-700 border-2 border-orange-200'}`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{reg.name}</div>
                    <div className="text-xs text-slate-500 max-w-[120px] truncate" title={reg.email}>{reg.email}</div>
                  </div>
                </div>
                <div className="text-right relative z-10">
                  <div className="text-2xl font-black text-purple-700">{reg.calcScore}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Points</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Exult 2026 Admin</h2>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'events' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Manage Events
        </button>
        <button
          onClick={() => setActiveTab('registrations')}
          className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'registrations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Registrations
        </button>
      </div>

      {activeTab === 'events' && (
        <div>
          {isEditingEvent ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {editingEventId ? 'Edit Event' : 
                     eventForm.eventType === 'google-form' ? 'Add Google Form Event' :
                     eventForm.eventType === 'website-form' ? 'Add Website Registration Event' :
                     'Add Quiz Event'}
                  </h3>
                  <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold mt-1">
                    TYPE: {eventForm.eventType?.replace('-', ' ')}
                  </div>
                </div>
                <button onClick={() => { setIsEditingEvent(false); setEditingEventId(null); localStorage.removeItem('exultAdminDraftForm'); setEventForm({}); }} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Common Information Section */}
              <h4 className="text-lg font-bold mb-4 text-slate-700 border-l-4 border-blue-500 pl-2">Event Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input type="text" name="title" value={eventForm.title || ''} onChange={handleEventFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL)</label>
                  <input type="text" name="slug" value={eventForm.slug || ''} onChange={handleEventFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                
                <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg flex items-center gap-3 border border-slate-200">
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="isVisible" id="toggle-isVisible" checked={eventForm.isVisible ?? true} onChange={(e) => setEventForm(prev => ({...prev, isVisible: e.target.checked}))} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out" style={{ transform: (eventForm.isVisible ?? true) ? 'translateX(100%)' : 'translateX(0)', borderColor: (eventForm.isVisible ?? true) ? '#22c55e' : '#cbd5e1' }}/>
                    <label htmlFor="toggle-isVisible" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer" style={{ backgroundColor: (eventForm.isVisible ?? true) ? '#22c55e' : '#cbd5e1' }}></label>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Event Visibility (Master Switch)</div>
                    <div className="text-sm text-slate-500">If disabled, this event will be completely hidden from the public website and cannot be accessed.</div>
                  </div>
                </div>

                {/* Date/Time is for all EXCEPT Google Form might use start/end times instead, but let's keep it for display */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Display Date</label>
                  <input type="text" name="date" value={eventForm.date || ''} onChange={handleEventFormChange} placeholder="e.g., Nov 15, 2026" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Display Time</label>
                  <input type="text" name="time" value={eventForm.time || ''} onChange={handleEventFormChange} placeholder="e.g., 10:00 AM - 12:00 PM" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>

                {eventForm.eventType !== 'quiz' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Venue / Mode</label>
                      <input type="text" name="venue" value={eventForm.venue || ''} onChange={handleEventFormChange} placeholder="e.g. Online or Main Hall" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Speaker/Judge (Optional)</label>
                      <input type="text" name="speaker" value={eventForm.speaker || ''} onChange={handleEventFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Poster Image</label>
                  <div className="flex gap-2">
                    <input type="text" name="posterUrl" value={eventForm.posterUrl || ''} onChange={handleEventFormChange} placeholder="Paste image URL here..." className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'posterUrl')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Upload Image" disabled={uploadingField === 'posterUrl'} />
                      <button type="button" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium whitespace-nowrap" disabled={uploadingField === 'posterUrl'}>
                        {uploadingField === 'posterUrl' ? <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-slate-700 animate-spin"></div> : <Upload className="w-4 h-4" />}
                        {uploadingField === 'posterUrl' ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Registration Fee */}
                {eventForm.eventType !== 'quiz' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Registration Fee (Optional)</label>
                    <input type="text" name="feeAmount" value={eventForm.feeAmount || ''} onChange={handleEventFormChange} placeholder="e.g. ₹200 or Free" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea name="description" value={eventForm.description || ''} onChange={handleEventFormChange} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg"></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Guidelines</label>
                  <textarea name="guidelines" value={eventForm.guidelines || ''} onChange={handleEventFormChange} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
                  <input type="number" name="order" value={eventForm.order || 0} onChange={handleEventFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
              </div>

              {/* Specific Sections based on Event Type */}

              {/* GOOGLE FORM SECTION */}
              {eventForm.eventType === 'google-form' && (
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <h4 className="text-lg font-bold mb-4 text-slate-700 border-l-4 border-green-500 pl-2">Google Form Registration Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Google Form URL *</label>
                      <input type="url" name="googleFormLink" value={eventForm.googleFormLink || ''} onChange={handleEventFormChange} placeholder="https://forms.gle/..." className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-green-50 focus:ring-green-500 border-green-200" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Registration Start Date & Time</label>
                      <input type="datetime-local" name="registrationStartDateTime" value={eventForm.registrationStartDateTime || ''} onChange={handleEventFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                      <p className="text-xs text-slate-500 mt-1">Leave blank to open immediately.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Registration End Date & Time</label>
                      <input type="datetime-local" name="registrationEndDateTime" value={eventForm.registrationEndDateTime || ''} onChange={handleEventFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                      <p className="text-xs text-slate-500 mt-1">Leave blank to keep open indefinitely.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* WEBSITE FORM SECTION */}
              {eventForm.eventType === 'website-form' && (
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <h4 className="text-lg font-bold mb-4 text-slate-700 border-l-4 border-indigo-500 pl-2">Registration Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2 md:col-span-2 bg-slate-50 p-4 rounded-lg">
                      <input type="checkbox" name="isRegistrationEnabled" checked={eventForm.isRegistrationEnabled ?? true} onChange={handleEventFormChange} className="w-5 h-5 text-indigo-600 rounded" />
                      <span className="font-bold text-slate-700">Enable Registrations Now</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Registration Deadline (Optional)</label>
                      <input type="datetime-local" name="registrationDeadline" value={eventForm.registrationDeadline || ''} onChange={handleEventFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                      <p className="text-xs text-slate-500 mt-1">Form will auto-close after this time.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Max Participants (Optional)</label>
                      <input type="number" name="maxParticipants" value={eventForm.maxParticipants || ''} onChange={handleEventFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="e.g. 100" />
                      <p className="text-xs text-slate-500 mt-1">Leave blank for unlimited.</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Payment QR Code Image (Optional)</label>
                      <div className="flex gap-2">
                        <input type="text" name="paymentQrUrl" value={eventForm.paymentQrUrl || ''} onChange={handleEventFormChange} placeholder="Paste QR Code URL here..." className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                        <div className="relative">
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'paymentQrUrl')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Upload QR Code" disabled={uploadingField === 'paymentQrUrl'} />
                          <button type="button" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium whitespace-nowrap" disabled={uploadingField === 'paymentQrUrl'}>
                            {uploadingField === 'paymentQrUrl' ? <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-slate-700 animate-spin"></div> : <Upload className="w-4 h-4" />}
                            {uploadingField === 'paymentQrUrl' ? 'Uploading...' : 'Upload'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* QUIZ FORM SECTION */}
              {eventForm.eventType === 'quiz' && (
                <div className="border-t border-purple-200 bg-purple-50 p-6 rounded-xl mt-6 mb-6">
                  <h4 className="text-lg font-bold text-purple-900 mb-4 border-l-4 border-purple-500 pl-2">Quiz Settings & Questions</h4>
                  
                  <div className="flex items-center space-x-2 bg-white p-4 rounded-lg mb-6 border border-purple-100">
                    <input type="checkbox" name="isRegistrationEnabled" checked={eventForm.isRegistrationEnabled ?? true} onChange={handleEventFormChange} className="w-5 h-5 text-purple-600 rounded" />
                    <span className="font-bold text-purple-900">Enable Quiz Registrations Now</span>
                  </div>

                  <div className="mb-6 bg-white p-4 rounded-lg border border-purple-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-bold text-purple-800 mb-2 block">Total Time Limit (Minutes)</label>
                      <input type="number" name="quizTimeLimit" value={eventForm.quizTimeLimit || 10} onChange={handleEventFormChange} className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-purple-800 mb-2 block">Per-Question Time Limit (Secs)</label>
                      <input type="number" name="questionTimeLimitSeconds" value={eventForm.questionTimeLimitSeconds || ''} onChange={handleEventFormChange} className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Optional" />
                      <p className="text-xs text-purple-600 mt-1">If set, auto-skips to next question.</p>
                    </div>
                  </div>

                  <div className="mb-6 bg-white p-4 rounded-lg border border-purple-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-purple-800 mb-2 block">Quiz Start Date & Time</label>
                      <input type="datetime-local" name="quizStartDateTime" value={eventForm.quizStartDateTime || ''} onChange={handleEventFormChange} className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-purple-800 mb-2 block">Quiz End Date & Time</label>
                      <input type="datetime-local" name="quizEndDateTime" value={eventForm.quizEndDateTime || ''} onChange={handleEventFormChange} className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                        {(eventForm.quizQuestions || []).map((q: any, qIdx: number) => (
                          <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 relative group">
                        <button onClick={() => removeQuizQuestion(qIdx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                        <div className="mb-4 pr-8 flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-500">Question {qIdx + 1}</label>
                          <select 
                            value={q.type || 'multiple-choice'} 
                            onChange={(e) => updateQuizQuestion(qIdx, { type: e.target.value as any })}
                            className="text-xs border border-slate-300 rounded px-2 py-1"
                          >
                            <option value="multiple-choice">Round 1: Objective</option>
                            <option value="short-answer">Round 2: Short Answer</option>
                            <option value="image-identification">Round 3: Image ID</option>
                          </select>
                        </div>
                        <div className="mb-4">
                          <textarea value={q.text} onChange={(e) => updateQuizQuestion(qIdx, { text: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-2" rows={2} placeholder="Enter your question here..."></textarea>
                          
                          {q.type === 'image-identification' && (
                            <div className="mb-3">
                              <label className="block text-xs font-bold text-slate-500 mb-1">Image URL (Optional)</label>
                              <div className="flex gap-2">
                                <input type="text" value={q.imageUrl || ''} onChange={(e) => updateQuizQuestion(qIdx, { imageUrl: e.target.value })} className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm" placeholder="Paste image URL..." />
                                <div className="relative shrink-0">
                                  <input type="file" accept="image/*" onChange={async (e) => {
                                    if (!e.target.files?.[0]) return;
                                    setUploadingField(`q_${q.id}`);
                                    const formData = new FormData();
                                    formData.append('file', e.target.files[0]);
                                    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                                    try {
                                      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
                                      const data = await res.json();
                                      updateQuizQuestion(qIdx, { imageUrl: data.secure_url });
                                    } catch (err) {}
                                    setUploadingField(null);
                                  }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                  <button type="button" className="bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap" disabled={uploadingField === `q_${q.id}`}>
                                    {uploadingField === `q_${q.id}` ? 'Uploading...' : 'Upload'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {(!q.type || q.type === 'multiple-choice' || q.type === 'image-identification') ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(q.options && q.options.length > 0 ? q.options : ['', '', '', '']).map((opt: string, oIdx: number) => (
                              <div key={oIdx} className="flex items-center gap-3">
                                <input 
                                  type="radio" 
                                  name={`correct_${q.id}`} 
                                  checked={q.correctOption === opt && opt !== ''} 
                                  onChange={() => updateQuizQuestion(qIdx, { correctOption: opt })}
                                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                                  title="Mark as correct answer"
                                />
                                <input 
                                  type="text" 
                                  value={opt} 
                                  onChange={(e) => {
                                    const newOpts = [...(q.options && q.options.length > 0 ? q.options : ['', '', '', ''])];
                                    newOpts[oIdx] = e.target.value;
                                    const newCorrect = q.correctOption === opt ? e.target.value : q.correctOption;
                                    updateQuizQuestion(qIdx, { options: newOpts, correctOption: newCorrect });
                                  }} 
                                  placeholder={`Option ${oIdx + 1}`} 
                                  className={`w-full px-3 py-1.5 border rounded-md text-sm ${q.correctOption === opt && opt !== '' ? 'border-purple-500 bg-purple-50/50' : 'border-slate-300'}`}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Correct Answer</label>
                            <input 
                              type="text" 
                              value={q.correctOption} 
                              onChange={(e) => updateQuizQuestion(qIdx, { correctOption: e.target.value })} 
                              placeholder="Type the exact correct answer here..." 
                              className="w-full px-3 py-1.5 border border-purple-300 bg-purple-50/30 rounded-md text-sm"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Verification is case-insensitive and ignores extra spaces.</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addQuizQuestion} className="mt-4 flex items-center text-white bg-purple-600 hover:bg-purple-700 font-medium text-sm px-4 py-2 rounded-lg transition-colors">
                    <Plus className="w-4 h-4 mr-1" /> Add Question
                  </button>
                </div>
              )}

              {/* Form Builder Section (Only for Website Form and Quiz) */}
              {(eventForm.eventType === 'website-form' || eventForm.eventType === 'quiz') && (
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <h4 className="text-lg font-bold mb-4 border-l-4 border-orange-400 pl-2">Custom Registration Fields</h4>
                  <p className="text-sm text-slate-500 mb-4">Name and Email are included by default. Add custom fields below if you need extra info from participants.</p>
                  
                  <div className="space-y-4 mb-4">
                    {(eventForm.customFields || []).map((field, idx) => (
                      <div key={field.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-4">
                        <div className="flex justify-between">
                          <span className="font-medium">Field #{idx + 1}</span>
                          <button onClick={() => removeCustomField(idx)} className="text-red-500 hover:text-red-700 text-sm flex items-center"><Trash2 className="w-4 h-4 mr-1"/> Remove</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Label</label>
                            <input type="text" value={field.label} onChange={(e) => updateCustomField(idx, { label: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Type</label>
                            <select value={field.type} onChange={(e) => updateCustomField(idx, { type: e.target.value as any })} className="w-full px-2 py-1 border rounded text-sm">
                              <option value="text">Short Text</option>
                              <option value="textarea">Long Text</option>
                              <option value="dropdown">Dropdown</option>
                              <option value="radio">Radio Buttons</option>
                              <option value="checkbox">Checkbox</option>
                            </select>
                          </div>
                          <div className="flex items-center mt-6">
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={field.required} onChange={(e) => updateCustomField(idx, { required: e.target.checked })} /> Required
                            </label>
                          </div>
                        </div>
                        {(field.type === 'dropdown' || field.type === 'radio') && (
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Options (comma separated)</label>
                            <input 
                              type="text" 
                              key={`options_${field.id}_${field.options?.join(',')}`}
                              defaultValue={field.options?.join(', ') || ''} 
                              onBlur={(e) => updateCustomField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} 
                              placeholder="e.g. Option 1, Option 2" 
                              className="w-full px-2 py-1 border rounded text-sm" 
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addCustomField} className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus className="w-4 h-4 mr-1" /> Add Custom Field
                  </button>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => { setIsEditingEvent(false); setEditingEventId(null); }} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">Cancel</button>
                <button onClick={saveEvent} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"><Save className="w-4 h-4" /> Save Event</button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Google Form Event */}
                <button 
                  onClick={() => { 
                    setIsEditingEvent(true); 
                    setEventForm({ eventType: 'google-form', isGoogleForm: true, isQuiz: false, isRegistrationEnabled: true, customFields: [], order: events.length }); 
                  }}
                  className="flex flex-col items-center justify-center p-6 bg-white border-2 border-slate-200 hover:border-blue-500 rounded-xl transition-all hover:shadow-lg group"
                >
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Create Google Form Event</h3>
                  <p className="text-sm text-slate-500 text-center">Create an event where registration happens through an external Google Form.</p>
                </button>

                {/* 2. Website Registration Event */}
                <button 
                  onClick={() => { 
                    setIsEditingEvent(true); 
                    setEventForm({ eventType: 'website-form', isGoogleForm: false, isQuiz: false, isRegistrationEnabled: true, customFields: [], order: events.length }); 
                  }}
                  className="flex flex-col items-center justify-center p-6 bg-white border-2 border-slate-200 hover:border-green-500 rounded-xl transition-all hover:shadow-lg group"
                >
                  <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Create Website Event</h3>
                  <p className="text-sm text-slate-500 text-center">Create an event that uses the website's built-in registration system.</p>
                </button>

                {/* 3. Quiz Event */}
                <button 
                  onClick={() => { 
                    setIsEditingEvent(true); 
                    setEventForm({ eventType: 'quiz', isGoogleForm: false, isQuiz: true, isRegistrationEnabled: true, customFields: [], order: events.length, quizTimeLimit: 10, quizQuestions: [] }); 
                  }}
                  className="flex flex-col items-center justify-center p-6 bg-white border-2 border-slate-200 hover:border-purple-500 rounded-xl transition-all hover:shadow-lg group"
                >
                  <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Create Quiz Event</h3>
                  <p className="text-sm text-slate-500 text-center">Create a quiz event using the existing quiz system.</p>
                </button>
              </div>

              {loadingEvents ? (
                <div>Loading events...</div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 font-semibold text-slate-600">Event</th>
                        <th className="p-4 font-semibold text-slate-600">Type</th>
                        <th className="p-4 font-semibold text-slate-600">Date/Time</th>
                        <th className="p-4 font-semibold text-slate-600">Registrations</th>
                        <th className="p-4 font-semibold text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.length === 0 ? (
                        <tr><td colSpan={4} className="p-4 text-center text-slate-500">No events found</td></tr>
                      ) : (
                        events.map(event => (
                          <tr key={event.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-4">
                              <div className="font-medium text-slate-800">{event.title}</div>
                              <div className="text-sm text-slate-500">/{event.slug}</div>
                            </td>
                            <td className="p-4">
                              {event.isQuiz ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-md border border-purple-200"><AlertTriangle className="w-3 h-3"/> Quiz</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">Standard</span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="text-sm">{event.date}</div>
                              <div className="text-sm text-slate-500">{event.time}</div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${event.isRegistrationEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {event.isRegistrationEnabled ? 'Open' : 'Closed'}
                              </span>
                            </td>
                            <td className="p-4 flex items-center gap-3">
                              <button onClick={() => editEvent(event)} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => deleteEvent(event.id)} className="text-red-600 hover:text-red-800 p-1"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'registrations' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search name or email..." 
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="relative">
                <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  value={regFilterEvent}
                  onChange={(e) => setRegFilterEvent(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none bg-white"
                >
                  <option value="all">All Events</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={exportCSV} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <Download className="w-5 h-5" /> Export CSV
            </button>
          </div>

          {renderLeaderboard()}

          {loadingRegs ? (
            <div className="text-center py-10 text-slate-500">Loading registrations...</div>
          ) : (
            regFilterEvent !== 'all' && (events.find(e => e.id === regFilterEvent)?.eventType === 'google-form' || events.find(e => e.id === regFilterEvent)?.isGoogleForm) ? (
              <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">External Registration</h3>
                <p className="text-slate-500">This event uses Google Forms. No internal registration records are collected here.</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200">
                    <th className="p-3 font-semibold text-slate-600">ID</th>
                    <th className="p-3 font-semibold text-slate-600">Name</th>
                    <th className="p-3 font-semibold text-slate-600">Email</th>
                    <th className="p-3 font-semibold text-slate-600">Event</th>
                    <th className="p-3 font-semibold text-slate-600">Status</th>
                    <th className="p-3 font-semibold text-slate-600">Date</th>
                    <th className="p-3 font-semibold text-slate-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegs.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-500">No registrations found</td></tr>
                  ) : (
                    filteredRegs.map(reg => (
                      <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 text-slate-600 text-sm font-mono">{reg.readableId || reg.id.substring(0, 8)}</td>
                        <td className="p-3 font-medium text-slate-800">{reg.name}</td>
                        <td className="p-3 text-slate-600 text-sm">{reg.email}</td>
                        <td className="p-3 text-slate-600 text-sm">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-100">
                            {reg.eventTitle || 'Unknown Event'}
                          </span>
                          {reg.paymentScreenshotUrl && (
                            <div className="mt-2">
                              <a href={reg.paymentScreenshotUrl} target="_blank" rel="noreferrer" className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 hover:bg-green-200 inline-block font-semibold">
                                View Receipt
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {reg.status ? (
                            <div className="flex flex-col gap-1">
                              <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full w-max ${
                                reg.status === 'completed' ? 'bg-green-100 text-green-800' :
                                reg.status === 'disqualified' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {reg.status.toUpperCase()}
                              </span>
                              { (reg.status === 'completed' || reg.status === 'disqualified') && (
                                <span className="text-xs text-slate-500 font-medium">Score: {calculateScore(reg) ?? '?'} / {allQuizAnswers[reg.eventId]?.length || 0}</span>
                              )}
                              {reg.status === 'disqualified' && reg.disqualifiedReason && (
                                <span className="text-[10px] text-red-500 font-semibold leading-tight max-w-[120px]">{reg.disqualifiedReason}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 text-sm">
                          {reg.timestamp?.toDate ? reg.timestamp.toDate().toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            {(reg.status === 'completed' || reg.status === 'disqualified') && (
                              <button onClick={() => setSelectedRegResults(reg)} className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 hover:bg-blue-100 rounded transition-colors text-xs font-bold border border-blue-200">
                                View Results
                              </button>
                            )}
                            <button onClick={() => deleteRegistration(reg.id)} className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded transition-colors border border-red-200">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            )
          )}
        </div>
      )}
      {/* Quiz Results Modal */}
      {selectedRegResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Quiz Results: {selectedRegResults.name}</h3>
                <p className="text-sm text-slate-500">{selectedRegResults.email}</p>
              </div>
              <button onClick={() => setSelectedRegResults(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-700">Total Score</div>
                <div className="text-xl font-bold text-purple-600">
                  {calculateScore(selectedRegResults) ?? 0} / {allQuizAnswers[selectedRegResults.eventId]?.length || 0}
                </div>
              </div>

              <div className="space-y-4">
                {events.find(e => e.id === selectedRegResults.eventId)?.quizQuestions?.map((q: any, i: number) => {
                  const decodedText = decodeText(q.text);
                  const studentAns = selectedRegResults.quizAnswers?.[q.id] || '';
                  const correctAnsKey = allQuizAnswers[selectedRegResults.eventId]?.find(a => a.questionId === q.id);
                  const correctAns = correctAnsKey?.correctOption || '';
                  
                  let isCorrect = false;
                  if (!q.type || q.type === 'multiple-choice') {
                    isCorrect = studentAns === correctAns;
                  } else {
                    const cleanStudentAns = studentAns.replace(/\s+/g, '').toLowerCase();
                    const cleanCorrectAns = correctAns.replace(/\s+/g, '').toLowerCase();
                    isCorrect = cleanStudentAns === cleanCorrectAns && cleanCorrectAns !== '';
                  }

                  return (
                    <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex gap-3">
                        <div className="mt-1">
                          {isCorrect ? (
                            <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><X className="w-4 h-4" /></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <p className="font-semibold text-slate-800 text-sm">Q{i + 1}: {decodedText}</p>
                            <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap bg-white px-2 py-0.5 rounded border border-slate-200">{q.type === 'short-answer' ? 'Short Answer' : q.type === 'image-identification' ? 'Image ID' : 'Objective'}</span>
                          </div>
                          
                          {q.imageUrl && <img src={q.imageUrl} alt="Question" className="max-h-32 mb-3 rounded-lg border border-slate-200 object-contain bg-white" />}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div className="bg-white p-2.5 rounded border border-slate-200 shadow-sm">
                              <span className="text-slate-500 text-xs block mb-1">Their Answer:</span>
                              <span className={`font-medium ${!studentAns ? 'text-slate-400 italic' : isCorrect ? 'text-green-700' : 'text-red-700'}`}>{studentAns || '(No Answer)'}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded border border-slate-200 shadow-sm">
                              <span className="text-slate-500 text-xs block mb-1">Correct Answer:</span>
                              <span className="font-medium text-slate-800">{correctAns}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExultAdmin;
