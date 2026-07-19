import React, { useState } from 'react';
import { X, Upload, CheckCircle, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { addDoc, collection, doc, updateDoc, increment, query, where, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

const CLOUDINARY_CLOUD_NAME = 'dvntu7mui';
const CLOUDINARY_UPLOAD_PRESET = 'IEDCimages';

const EventRegistrationModal: React.FC<Props> = ({ event, onClose, onSuccess }) => {
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

  const handleCustomFieldChange = (fieldId: string, value: any, type: string) => {
    if (type === 'checkbox') {
      const current = customData[fieldId] || [];
      const newArray = current.includes(value) 
        ? current.filter((v: string) => v !== value)
        : [...current, value];
      setCustomData({ ...customData, [fieldId]: newArray });
    } else {
      setCustomData({ ...customData, [fieldId]: value });
    }
  };

  const uploadFileToCloudinary = async (file: File, folderName: string): Promise<string> => {
    try {
      // Compress if it's an image
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
    setError('');
    setLoading(true);
    setUploadProgress('');

    try {
      // 1. Check if maxParticipants reached (frontend sanity check)
      if (event.maxParticipants && event.currentParticipants && event.currentParticipants >= event.maxParticipants) {
        throw new Error("Sorry, this event is already full.");
      }

      // Validate referral code if entered
      let verifiedPromoterDocId = '';
      if (referralCode.trim()) {
        // Validate referral code if entered
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

      // Create a URL-safe folder name from the event title
      const safeEventTitle = event.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      
      let paymentScreenshotUrl = '';
      
      // 2. Upload Payment Screenshot if required
      if (event.feeAmount && event.feeAmount > 0) {
        if (!paymentScreenshot) {
          throw new Error("Payment screenshot is required.");
        }
        paymentScreenshotUrl = await uploadFileToCloudinary(paymentScreenshot, `${safeEventTitle}/payments`);
      }

      // 3. Upload any custom file fields
      const finalCustomData = { ...customData };
      if (event.customFields) {
        for (const field of event.customFields) {
          if (field.type === 'file' && finalCustomData[field.id]) {
            const fileObj = finalCustomData[field.id];
            if (fileObj instanceof File) {
              const url = await uploadFileToCloudinary(fileObj, `${safeEventTitle}/custom-files`);
              finalCustomData[field.id] = url; // replace file object with URL
            }
          }
        }
      }

      // 4. Save to Firestore
      
      // 4. Save to Firestore
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

      await addDoc(collection(db, 'event_registrations'), registrationDoc);

      const eventDocId = (event as any).docId;
      if (eventDocId) {
        await updateDoc(doc(db, 'events', eventDocId), {
          currentParticipants: increment(1)
        });
      }

      // Increment promoter score globally and per-event if referral code was verified
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
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || "An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", bounce: 0.3, duration: 0.5 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  if (success) {
    return (
      <AnimatePresence>
        <motion.div 
          initial="hidden" animate="visible" exit="hidden" variants={backdropVariants}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
        >
          <motion.div 
            variants={modalVariants}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-3xl p-10 max-w-sm w-full text-center shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
            >
              <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6 drop-shadow-lg" />
            </motion.div>
            <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400 mb-3">Success!</h3>
            <p className="text-slate-600 dark:text-slate-300 font-medium">Your registration for <span className="font-semibold text-slate-800 dark:text-white">{event.title}</span> has been submitted.</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial="hidden" animate="visible" exit="hidden" variants={backdropVariants}
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto pt-10 pb-10"
      >
        <motion.div 
          variants={modalVariants}
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-2xl w-full max-w-2xl my-auto flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6 sm:p-8 flex justify-between items-center shrink-0 z-10 overflow-hidden">
            {/* Background gradient for header */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-10"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500 dark:from-indigo-400 dark:to-pink-400 tracking-tight mb-1">
                Register Now
              </h3>
              <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 line-clamp-1">{event.title}</p>
            </div>
            <button 
              onClick={onClose} 
              disabled={loading} 
              className="relative z-10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 sm:p-3 rounded-full transition-all duration-200"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 overflow-y-auto">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl text-red-600 dark:text-red-400 font-medium text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">1</span>
                </div>
                <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Basic Details</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={loading} className="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200" placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={loading} className="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200" placeholder="john@example.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone Number *</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={loading} className="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200" placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Referral Code (Optional)</label>
                  <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="e.g. REF-AMAL-492" disabled={loading} className="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200" />
                </div>
              </div>
            </div>

            {event.customFields && event.customFields.length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
                    <span className="text-pink-600 dark:text-pink-400 font-bold text-sm">2</span>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Additional Information</h4>
                </div>
                
                <div className="space-y-5">
                  {event.customFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {field.label} {field.required && <span className="text-pink-500">*</span>}
                      </label>
                      
                      {field.type === 'text' && (
                        <input type="text" required={field.required} value={customData[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'text')} disabled={loading} className="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" />
                      )}
                      
                      {field.type === 'textarea' && (
                        <textarea required={field.required} value={customData[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'textarea')} disabled={loading} rows={3} className="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all" />
                      )}
                      
                      {field.type === 'dropdown' && (
                        <div className="relative">
                          <select required={field.required} value={customData[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'dropdown')} disabled={loading} className="w-full p-3.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all appearance-none">
                            <option value="">Select an option</option>
                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      )}
                      
                      {field.type === 'radio' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                          {field.options?.map(opt => (
                            <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${customData[field.id] === opt ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                              <input type="radio" name={field.id} value={opt} required={field.required} checked={customData[field.id] === opt} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'radio')} disabled={loading} className="w-4 h-4 text-pink-500 focus:ring-pink-500" />
                              <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {field.type === 'checkbox' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                          {field.options?.map(opt => {
                            const isChecked = (customData[field.id] || []).includes(opt);
                            return (
                              <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                <input type="checkbox" value={opt} checked={isChecked} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'checkbox')} disabled={loading} className="w-4 h-4 text-pink-500 rounded focus:ring-pink-500" />
                                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{opt}</span>
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
                          <div className={`w-full p-6 border-2 border-dashed rounded-xl text-center transition-all flex flex-col items-center justify-center gap-3 ${customData[field.id] ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 group-hover:border-pink-400 group-hover:bg-slate-50 dark:group-hover:bg-slate-800'}`}>
                            <div className={`p-3 rounded-full ${customData[field.id] ? 'bg-pink-100 dark:bg-pink-800/50 text-pink-600 dark:text-pink-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                              <Upload className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {customData[field.id] ? (customData[field.id] as File).name : 'Click or drag file to upload'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">PDF, JPG, PNG up to 10MB</p>
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
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{event.customFields && event.customFields.length > 0 ? '3' : '2'}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Payment</h4>
                  </div>
                  <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full font-bold text-sm border border-emerald-200 dark:border-emerald-500/30">
                    ₹{event.feeAmount}
                  </div>
                </div>
                
                <div className="flex flex-col gap-8 items-center">
                  {event.paymentQrUrl && (
                    <div className="w-full max-w-sm flex flex-col items-center mx-auto">
                      <div className="bg-white p-4 rounded-3xl shadow-md border border-slate-200 dark:border-slate-700 w-full">
                        <img src={event.paymentQrUrl} alt="Payment QR" className="w-full object-contain rounded-xl mx-auto" />
                      </div>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-3 text-center">Scan with any UPI app</p>
                    </div>
                  )}
                  
                  <div className="w-full space-y-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Upload Screenshot *</label>
                    <div className="relative group h-40">
                      <input type="file" accept="image/*" required onChange={(e) => {
                        if (e.target.files && e.target.files[0]) setPaymentScreenshot(e.target.files[0]);
                      }} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className={`w-full h-full border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center gap-3 ${paymentScreenshot ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 group-hover:border-emerald-400 group-hover:bg-slate-50 dark:group-hover:bg-slate-800'}`}>
                        <div className={`p-3 rounded-full ${paymentScreenshot ? 'bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                          {paymentScreenshot ? <CheckCircle className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                        </div>
                        <div className="space-y-1 text-center px-4">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate w-full max-w-[250px] mx-auto">
                            {paymentScreenshot ? paymentScreenshot.name : 'Click to attach payment proof'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4">
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold py-4 px-6 text-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
                
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{uploadProgress || 'Processing...'}</span>
                  </>
                ) : (
                  <span>Submit Registration</span>
                )}
              </motion.button>
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                By registering, you agree to our terms and conditions.
              </p>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventRegistrationModal;
