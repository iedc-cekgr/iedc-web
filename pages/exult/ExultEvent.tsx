import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const CLOUDINARY_CLOUD_NAME = 'dvntu7mui';
const CLOUDINARY_UPLOAD_PRESET = 'IEDCimages';

interface CustomField {
  id: string;
  type: 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'radio';
  label: string;
  required: boolean;
  options?: string[]; // For dropdown and radio
}

interface ExultEventDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  speaker?: string;
  guidelines?: string;
  posterUrl: string;
  isRegistrationEnabled: boolean;
  isGoogleForm?: boolean;
  googleFormLink?: string;
  eventType?: 'google-form' | 'website-form' | 'quiz';
  registrationStartDateTime?: string;
  registrationEndDateTime?: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  feeAmount?: string;
  isQuiz?: boolean;
  customFields?: CustomField[];
  paymentQrUrl?: string;
}

interface ExultEventProps {
  slug: string;
  onNavigate: (path: string) => void;
}

const ExultEvent: React.FC<ExultEventProps> = ({ slug, onNavigate }) => {
  const [event, setEvent] = useState<ExultEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationCount, setRegistrationCount] = useState(0);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const q = query(collection(db, 'exult_events'), where('slug', '==', slug));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          const eventData = docData.data() as any;
          setEvent({ id: docData.id, ...eventData } as ExultEventDetail);

          // Fetch registration count if maxParticipants is set
          if (eventData.maxParticipants) {
            const countQ = query(collection(db, 'exult_registrations'), where('eventId', '==', docData.id));
            const countSnapshot = await getDocs(countQ);
            setRegistrationCount(countSnapshot.docs.length);
          }
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
    
    setSuccessMsg('');
    setErrorMsg('');
    setName('');
    setEmail('');
    setPaymentScreenshot(null);
    setCustomData({});
  }, [slug]);

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setCustomData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId: string, checked: boolean) => {
    setCustomData(prev => ({ ...prev, [fieldId]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const readableId = 'EXT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Clean undefined values from customData
      const cleanCustomData = JSON.parse(JSON.stringify(customData));

      const registrationData: any = {
        eventId: event.id,
        eventTitle: event.title,
        readableId,
        name,
        email,
        customData: cleanCustomData,
        timestamp: serverTimestamp()
      };

      if (event.feeAmount && paymentScreenshot) {
        const formData = new FormData();
        formData.append('file', paymentScreenshot);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        if (data.secure_url) {
          registrationData.paymentScreenshotUrl = data.secure_url;
        } else {
          throw new Error(data.error?.message || 'Failed to upload screenshot to Cloudinary');
        }
      }
      
      if (event.isQuiz) {
        registrationData.status = 'started';
        registrationData.quizStartTime = serverTimestamp();
      }

      const docRef = await addDoc(collection(db, 'exult_registrations'), registrationData);
      
      if (event.isQuiz) {
        onNavigate(`/exult/quiz/${docRef.id}`);
        return;
      }
      
      setSuccessMsg('Registration successful! See you at EXULT 2026.');
      setName('');
      setEmail('');
      setPaymentScreenshot(null);
      setCustomData({});
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(`Failed to register: ${err.message || err.toString()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050B08] flex justify-center items-center">
        <div className="w-12 h-12 rounded-full border-4 border-green-500/20 border-t-green-500 animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020205] text-white">
        <h2 className="text-2xl font-bold">Event not found</h2>
      </div>
    );
  }

  // Registration Status Logic
  const now = new Date();
  const computedEventType = event.eventType || (event.isQuiz ? 'quiz' : (event.isGoogleForm ? 'google-form' : 'website-form'));
  const isGoogleFormEvent = computedEventType === 'google-form';
  
  let isGoogleFormOpen = true;
  let googleFormStatusMsg = '';
  
  if (isGoogleFormEvent) {
    if (event.registrationStartDateTime && new Date(event.registrationStartDateTime) > now) {
      isGoogleFormOpen = false;
      googleFormStatusMsg = 'Registration Not Started';
    } else if (event.registrationEndDateTime && new Date(event.registrationEndDateTime) < now) {
      isGoogleFormOpen = false;
      googleFormStatusMsg = 'Registration Closed';
    }
  }

  let isFormOpen = event.isRegistrationEnabled;
  let formClosedMsg = 'Registrations are currently closed for this event.';
  
  if (computedEventType === 'website-form') {
    if (event.registrationDeadline && new Date(event.registrationDeadline) < now) {
      isFormOpen = false;
      formClosedMsg = 'Registration deadline has passed.';
    } else if (event.maxParticipants && registrationCount >= event.maxParticipants) {
      isFormOpen = false;
      formClosedMsg = 'Registration is full (Maximum capacity reached).';
    }
  }

  return (
    <div className="min-h-screen bg-[#050B08] text-white selection:bg-green-500/30 selection:text-green-200 font-sans pb-20 relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-green-500/5 blur-[150px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:30px_30px]"></div>
      </div>

      {/* Back button */}
      <div className="pt-10 px-6 max-w-6xl mx-auto relative z-10">
        <button 
          onClick={() => onNavigate('/exult')}
          className="flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors mb-8 group"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Events
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Left Column: Event Details */}
        <div>
          {event.posterUrl && (
            <div className="rounded-2xl overflow-hidden mb-8 border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <img src={event.posterUrl} alt={event.title} className="w-full h-auto object-cover" />
            </div>
          )}
          
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-white drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            {event.title}
          </h1>
          
          <div className="flex flex-wrap gap-4 mb-8">
            {event.date && (
              <div className="flex items-center gap-2 text-slate-300 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                {event.date}
              </div>
            )}
            {event.time && (
              <div className="flex items-center gap-2 text-slate-300 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {event.time}
              </div>
            )}
            {event.venue && (
              <div className="flex items-center gap-2 text-slate-300 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                {event.venue}
              </div>
            )}
          </div>

          {event.description && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white border-b border-white/10 pb-2">About Event</h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {event.speaker && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white border-b border-white/10 pb-2">Speaker/Judge</h3>
              <p className="text-slate-300">{event.speaker}</p>
            </div>
          )}

          {event.guidelines && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-white border-b border-white/10 pb-2">Guidelines</h3>
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap bg-white/5 p-4 rounded-xl border border-white/5">
                {event.guidelines}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Registration Form */}
        <div className="lg:mt-0 mt-8">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sticky top-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <div className="w-2 h-8 bg-green-500 rounded-full"></div>
              Register Now
            </h2>

            {!isFormOpen && !isGoogleFormEvent ? (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-center">
                {formClosedMsg}
              </div>
            ) : isGoogleFormEvent ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-slate-300 mb-6 text-lg">Registration for this event is handled externally via Google Forms.</p>
                {!isGoogleFormOpen ? (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-center w-full">
                    {googleFormStatusMsg}
                  </div>
                ) : (
                  <a 
                    href={event.googleFormLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-bold text-xl py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
                  >
                    Proceed to Registration
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>
                )}
              </div>
            ) : successMsg ? (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-6 rounded-xl text-center flex flex-col items-center gap-4">
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p className="font-medium text-lg">{successMsg}</p>
                <button 
                  onClick={() => setSuccessMsg('')}
                  className="mt-2 text-sm text-green-500 hover:text-green-400 underline"
                >
                  Register another person
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                    {errorMsg}
                  </div>
                )}
                
                {/* Default Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                {/* Custom Fields */}
                {event.customFields && event.customFields.map((field: any) => (
                  <div key={field.id} className="pt-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      {field.label} {field.required && '*'}
                    </label>
                    
                    {field.type === 'text' && (
                      <input 
                        type="text"
                        required={field.required}
                        value={customData[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors"
                      />
                    )}
                    
                    {field.type === 'textarea' && (
                      <textarea 
                        required={field.required}
                        value={customData[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors min-h-[100px] resize-y"
                      />
                    )}

                    {field.type === 'dropdown' && field.options && (
                      <select 
                        required={field.required}
                        value={customData[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 transition-colors appearance-none"
                      >
                        <option value="" disabled className="bg-slate-900">Select an option</option>
                        {field.options.map((opt: string) => (
                          <option key={opt} value={opt} className="bg-slate-900">{opt}</option>
                        ))}
                      </select>
                    )}

                    {field.type === 'radio' && field.options && (
                      <div className="space-y-2 mt-2">
                        {field.options.map((opt: string) => (
                          <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                            <input 
                              type="radio"
                              name={field.id}
                              value={opt}
                              required={field.required}
                              checked={customData[field.id] === opt}
                              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                              className="w-4 h-4 text-green-500 bg-black/40 border-white/20 focus:ring-green-500 focus:ring-offset-slate-900"
                            />
                            <span className="text-slate-300 group-hover:text-white transition-colors">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === 'checkbox' && (
                      <label className="flex items-start gap-3 cursor-pointer mt-2 group">
                        <input 
                          type="checkbox"
                          required={field.required}
                          checked={customData[field.id] || false}
                          onChange={(e) => handleCheckboxChange(field.id, e.target.checked)}
                          className="mt-1 w-4 h-4 text-green-500 rounded border-white/20 bg-black/40 focus:ring-green-500 focus:ring-offset-slate-900"
                        />
                        <span className="text-slate-300 group-hover:text-white transition-colors text-sm leading-snug">
                          {field.label}
                        </span>
                      </label>
                    )}
                  </div>
                ))}

                {/* Payment Section */}
                {event.feeAmount && (
                  <div className="mt-8 border-t border-white/10 pt-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                      Payment Details
                    </h3>
                    
                    <div className="bg-white/5 rounded-xl p-6 border border-green-500/30 text-center mb-6">
                      <p className="text-slate-300 mb-2">Registration Fee</p>
                      <div className="text-3xl font-bold text-white mb-6">{event.feeAmount}</div>
                      
                      {event.paymentQrUrl && (
                        <div className="flex flex-col items-center">
                          <p className="text-sm text-slate-400 mb-3">Scan this QR Code to Pay</p>
                          <div className="bg-white p-2 rounded-xl inline-block shadow-lg">
                            <img src={event.paymentQrUrl} alt="Payment QR Code" className="w-48 h-48 object-cover rounded-lg" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Upload Payment Screenshot *</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        required
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setPaymentScreenshot(e.target.files[0]);
                          }
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500/10 file:text-green-500 hover:file:bg-green-500/20"
                      />
                      <p className="text-xs text-slate-500 mt-2">Please upload a clear screenshot of your successful payment.</p>
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-bold text-lg py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin"></div>
                      Processing...
                    </span>
                  ) : event.isQuiz ? (
                    'NEXT: START QUIZ'
                  ) : (
                    'SUBMIT REGISTRATION'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExultEvent;
