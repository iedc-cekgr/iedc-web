import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, Image as ImageIcon, ArrowLeft, Info, Trophy } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { collection, doc, updateDoc, increment, query, where, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  eventId: string;
  onNavigate: (path: string) => void;
}

const CLOUDINARY_CLOUD_NAME = 'dvntu7mui';
const CLOUDINARY_UPLOAD_PRESET = 'IEDCimages';

const RegistrationPage: React.FC<Props> = ({ eventId, onNavigate }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    email: '',
    phone: ''
  });
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoadingEvent(true);
        // Look up by slug or ID
        const snapshot = await getDocs(collection(db, 'events'));
        const foundDoc = snapshot.docs.find(doc => {
          const docData = doc.data();
          const docSlug = docData.slug || docData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return docSlug === eventId || String(docData.id) === eventId;
        });

        if (foundDoc) {
          setEvent({ docId: foundDoc.id, ...foundDoc.data() } as any);
        } else {
          setError("Event not found.");
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Failed to load event details.");
      } finally {
        setLoadingEvent(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleCustomFieldChange = (fieldId: string, value: any, type: string) => {
    if (type === 'checkbox') {
      const current = customData[fieldId] || [];
      const newArray = current.includes(value) 
        ? [] // deselect if already selected
        : [value]; // select only this one (replacing any other selection)
      setCustomData({ ...customData, [fieldId]: newArray });
    } else {
      setCustomData({ ...customData, [fieldId]: value });
    }
  };

  const uploadFileToCloudinary = async (file: File, folderName: string): Promise<string> => {
    try {
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
          initialQuality: 0.7
        };
        fileToUpload = await imageCompression(file, options);
      }

      const fd = new FormData();
      fd.append('file', fileToUpload);
      fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      fd.append('folder', folderName);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: fd
      });
      
      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      }
      throw new Error(data.error?.message || 'Upload failed');
    } catch (err) {
      console.error('File upload error:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    
    setError('');
    setLoading(true);
    setUploadProgress('');

    try {
      if (event.maxParticipants && event.currentParticipants && event.currentParticipants >= event.maxParticipants) {
        throw new Error("Sorry, this event is already full.");
      }

      let verifiedPromoterDocId = '';
      if (referralCode.trim()) {
        const promotersRef = collection(db, 'promoters');
        const q = query(promotersRef, where('code', '==', referralCode.trim().toUpperCase()));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error("Invalid referral code. Please correct it or leave it blank to register.");
        }
        
        const promoterDoc = querySnapshot.docs[0];
        const promoterData = promoterDoc.data();
        if (promoterData.isActive === false) {
          throw new Error("This referral code is currently inactive.");
        }
        verifiedPromoterDocId = promoterDoc.id;
      }

      const safeEventTitle = event.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      let paymentScreenshotUrl = '';
      
      if (event.feeAmount && event.feeAmount > 0) {
        if (!paymentScreenshot) {
          throw new Error("Payment screenshot is required.");
        }
        paymentScreenshotUrl = await uploadFileToCloudinary(paymentScreenshot, `${safeEventTitle}/payments`);
      }

      const finalCustomData = { ...customData };
      if (event.customFields) {
        for (const field of event.customFields) {
          if (field.type === 'file' && finalCustomData[field.id]) {
            const fileObj = finalCustomData[field.id];
            if (fileObj instanceof File) {
              const url = await uploadFileToCloudinary(fileObj, `${safeEventTitle}/custom-files`);
              finalCustomData[field.id] = url;
            }
          }
        }
      }
      
      const registrationDoc = {
        eventId: String(event.id),
        eventTitle: event.title,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        customData: finalCustomData,
        paymentScreenshotUrl,
        referralCode: referralCode.trim().toUpperCase() || null,
        timestamp: new Date()
      };

      await setDoc(doc(db, 'event_registrations', safeEventTitle), {
        eventTitle: event.title,
        eventId: String(event.id),
        lastUpdated: new Date()
      }, { merge: true });

      const { addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'event_registrations', safeEventTitle, 'participants'), registrationDoc);

      const eventDocId = (event as any).docId;
      if (eventDocId) {
        await updateDoc(doc(db, 'events', eventDocId), {
          currentParticipants: increment(1)
        });
      }

      if (verifiedPromoterDocId && eventDocId) {
        await updateDoc(doc(db, 'promoters', verifiedPromoterDocId), {
          siteReferrals: increment(1),
          totalReferrals: increment(1)
        });

        const eventReferralRef = doc(db, 'event_referrals', `${eventDocId}_${verifiedPromoterDocId}`);
        const eventReferralSnap = await getDoc(eventReferralRef);
        if (eventReferralSnap.exists()) {
          await updateDoc(eventReferralRef, {
            siteReferrals: increment(1),
            totalReferrals: increment(1)
          });
        } else {
          const promoterSnap = await getDoc(doc(db, 'promoters', verifiedPromoterDocId));
          if (promoterSnap.exists()) {
            const promoterData = promoterSnap.data();
            await setDoc(eventReferralRef, {
              eventId: eventDocId,
              eventTitle: event.title,
              promoterId: verifiedPromoterDocId,
              promoterName: promoterData.name,
              promoterCode: promoterData.code,
              siteReferrals: 1,
              gformReferrals: 0,
              totalReferrals: 1,
              lastUpdated: new Date()
            });
          }
        }
      }

      setSuccess(true);
      
      if (!event.whatsappLink) {
        setTimeout(() => {
          onNavigate('/events');
        }, 3000);
      }

    } catch (err: any) {
      setError(err.message || "An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring" as const, bounce: 0.3, duration: 0.5 }
    }
  };

  if (loadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-slate-50 dark:bg-slate-950">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Event not found</h2>
        <button onClick={() => onNavigate('/events')} className="text-indigo-600 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </button>
      </div>
    );
  }

  const isRegistrationClosed = 
    event.isRegistrationEnabled === false || 
    (event.registrationEndDateTime && new Date(event.registrationEndDateTime) < new Date());

  if (isRegistrationClosed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-slate-50 dark:bg-slate-950">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Event Registration Closed</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-center max-w-md px-4">
          Registration for <span className="font-semibold text-slate-800 dark:text-slate-200">{event.title}</span> has closed. 
          Please check back later for future events.
        </p>
        <button onClick={() => onNavigate('/events')} className="text-indigo-600 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-4 bg-slate-50 dark:bg-slate-950">
        <motion.div 
          initial="hidden" animate="visible" variants={modalVariants}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" as const, bounce: 0.5, duration: 0.6 }}
          >
            <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6 drop-shadow-lg" />
          </motion.div>
          <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400 mb-3">Success!</h3>
          <p className="text-slate-600 dark:text-slate-300 font-medium mb-6">Your registration for <span className="font-semibold text-slate-800 dark:text-white">{event.title}</span> has been submitted.</p>
          
          {event.whatsappLink && (
            <div className="flex flex-col gap-3 mt-6">
              <a 
                href={event.whatsappLink} 
                target="_blank" 
                rel="noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold py-3 px-6 shadow-lg shadow-[#25D366]/30 hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                Join WhatsApp Group
              </a>
            </div>
          )}
          
          <button 
            onClick={() => onNavigate('/events')}
            className="mt-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all font-medium"
          >
            Back to Events
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => onNavigate('/events')} 
          className="mb-6 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-2 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Events
        </button>

        <motion.div 
          initial="hidden" animate="visible" variants={modalVariants}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Cover Image */}
          {event.image && (
            <div className="w-full h-48 sm:h-64 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10" />
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-bold uppercase tracking-wider mb-2 backdrop-blur-md">Registration</span>
                <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">{event.title}</h1>
              </div>
            </div>
          )}

          {/* Fallback Header if no image */}
          {!event.image && (
            <div className="relative p-6 sm:p-10 overflow-hidden bg-slate-900">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 opacity-50"></div>
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-md">Registration</span>
                <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">{event.title}</h1>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl text-red-600 dark:text-red-400 font-medium text-sm"
              >
                {error}
              </motion.div>
            )}

            {event.prizePool && (
              <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 p-[3px] rounded-2xl shadow-xl shadow-yellow-500/20">
                <div className="bg-white dark:bg-slate-900 rounded-[14px] p-6 h-full w-full flex items-center justify-between gap-6 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="flex items-center gap-5 z-10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40 flex items-center justify-center shadow-inner border border-yellow-300 dark:border-yellow-700/50 flex-shrink-0">
                      <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400 drop-shadow-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Prize Pool</p>
                      <h3 className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-yellow-500 dark:from-yellow-400 dark:to-yellow-300">
                        {event.prizePool}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {event.guidelines && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-6 rounded-r-2xl shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-100 dark:bg-amber-800/50 p-2 rounded-full text-amber-600 dark:text-amber-400">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">Guidelines & Rules</h4>
                    <div className="text-amber-700 dark:text-amber-300 text-sm whitespace-pre-wrap leading-relaxed">
                      {event.guidelines}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">1</span>
                </div>
                <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200">Basic Details</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={loading} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={loading} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone Number *</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={loading} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200" />
                </div>
                {event.enableReferralCode && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Referral Code (Optional)</label>
                    <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} disabled={loading} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200" />
                  </div>
                )}
              </div>
            </div>

            {event.customFields && event.customFields.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center border border-pink-100 dark:border-pink-800/50">
                    <span className="text-pink-600 dark:text-pink-400 font-bold text-lg">2</span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200">Additional Information</h4>
                </div>
                
                <div className="space-y-6">
                  {event.customFields.map((field) => (
                    <div key={field.id} className="space-y-3">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {field.label} {field.required && <span className="text-pink-500">*</span>}
                      </label>
                      
                      {field.type === 'text' && (
                        <input type="text" required={field.required} value={customData[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'text')} disabled={loading} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" />
                      )}
                      
                      {field.type === 'textarea' && (
                        <textarea required={field.required} value={customData[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'textarea')} disabled={loading} rows={4} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" />
                      )}
                      
                      {field.type === 'dropdown' && (
                        <div className="relative">
                          <select required={field.required} value={customData[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'dropdown')} disabled={loading} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all appearance-none">
                            <option value="">Select an option</option>
                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      )}
                      
                      {field.type === 'radio' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          {field.options?.map(opt => (
                            <label key={opt} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${customData[field.id] === opt ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                              <input type="radio" name={field.id} value={opt} required={field.required} checked={customData[field.id] === opt} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'radio')} disabled={loading} className="w-5 h-5 text-pink-500 focus:ring-pink-500" />
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {field.type === 'checkbox' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          {field.options?.map(opt => {
                            const isChecked = (customData[field.id] || []).includes(opt);
                            return (
                              <label key={opt} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${isChecked ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                <input type="checkbox" value={opt} checked={isChecked} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'checkbox')} disabled={loading} className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500" />
                                <span className="text-slate-700 dark:text-slate-300 font-medium">{opt}</span>
                              </label>
                            );
                          })}
                          {field.required && (!customData[field.id] || customData[field.id].length === 0) && (
                             <input type="checkbox" className="hidden" required />
                          )}
                        </div>
                      )}
                      
                      {field.type === 'file' && (
                        <div className="relative group">
                          <input type="file" required={field.required} onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleCustomFieldChange(field.id, e.target.files[0], 'file');
                            }
                          }} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                          <div className={`w-full p-8 border-2 border-dashed rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-4 ${customData[field.id] ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 group-hover:border-pink-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
                            <div className={`p-4 rounded-full ${customData[field.id] ? 'bg-pink-100 dark:bg-pink-800/50 text-pink-600 dark:text-pink-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                              <Upload className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                                {customData[field.id] ? (customData[field.id] as File).name : 'Click or drag file to upload'}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">PDF, JPG, PNG up to 10MB</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.feeAmount && event.feeAmount > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">{event.customFields && event.customFields.length > 0 ? '3' : '2'}</span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200">Payment</h4>
                  </div>
                  <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-5 py-2 rounded-xl font-bold text-base border border-emerald-200 dark:border-emerald-500/30">
                    ₹{event.feeAmount}
                  </div>
                </div>
                
                <div className="flex flex-col gap-8 items-center">
                  {event.paymentQrUrl && (
                    <div className="w-full max-w-md flex flex-col items-center">
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 w-full">
                        <img src={event.paymentQrUrl} alt="Payment QR" className="w-full object-contain rounded-xl" />
                      </div>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-4 text-center">Scan with any UPI app</p>
                    </div>
                  )}
                  
                  <div className="w-full max-w-md space-y-3">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Upload Screenshot *</label>
                    <div className="relative group min-h-[200px]">
                      <input type="file" accept="image/*" required onChange={(e) => {
                        if (e.target.files && e.target.files[0]) setPaymentScreenshot(e.target.files[0]);
                      }} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className={`w-full h-full border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center gap-4 ${paymentScreenshot ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 group-hover:border-emerald-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
                        <div className={`p-4 rounded-full ${paymentScreenshot ? 'bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                          {paymentScreenshot ? <CheckCircle className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                        </div>
                        <div className="space-y-1 text-center px-6">
                          <p className="text-base font-semibold text-slate-700 dark:text-slate-300 truncate w-full max-w-[200px] mx-auto">
                            {paymentScreenshot ? paymentScreenshot.name : 'Click to attach payment proof'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold py-5 px-8 text-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
                
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{uploadProgress || 'Processing...'}</span>
                  </>
                ) : (
                  <span>Submit Registration</span>
                )}
              </motion.button>
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
                By registering, you agree to our terms and conditions.
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default RegistrationPage;
