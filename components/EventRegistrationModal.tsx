import React, { useState } from 'react';
import { X, Upload, CheckCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { addDoc, collection, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';

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
      setUploadProgress('Compressing image...');
      
      // Compress if it's an image
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        fileToUpload = await imageCompression(file, options);
      }

      setUploadProgress('Uploading to secure storage...');
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

      let paymentScreenshotUrl = '';
      
      // 2. Upload Payment Screenshot if required
      if (event.feeAmount && event.feeAmount > 0) {
        if (!paymentScreenshot) {
          throw new Error("Payment screenshot is required.");
        }
        paymentScreenshotUrl = await uploadFileToCloudinary(paymentScreenshot, `event-registrations/${event.id}/payments`);
      }

      // 3. Upload any custom file fields
      const finalCustomData = { ...customData };
      if (event.customFields) {
        for (const field of event.customFields) {
          if (field.type === 'file' && finalCustomData[field.id]) {
            const fileObj = finalCustomData[field.id];
            if (fileObj instanceof File) {
              const url = await uploadFileToCloudinary(fileObj, `event-registrations/${event.id}/custom-files`);
              finalCustomData[field.id] = url; // replace file object with URL
            }
          }
        }
      }

      setUploadProgress('Saving registration...');
      
      // 4. Save to Firestore
      const registrationDoc = {
        eventId: String(event.id),
        eventTitle: event.title,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        customData: finalCustomData,
        paymentScreenshotUrl,
        timestamp: new Date()
      };

      await addDoc(collection(db, 'event_registrations'), registrationDoc);

      // 5. Increment Participant Count in Event Doc
      // NOTE: We rely on the event object having a document ID in firestore. We should pass `docId` into the Event type or find it by `id`.
      // Since Event has `id: number`, we have to query it or if it has `docId` we can just use that. 
      // For now, if event has a docId we use it, otherwise we might skip incrementing here and just count docs later.
      // Assuming event.id is actually the numeric ID, we need to know its document ID. 
      // To be safe, we will fetch the doc ID by querying the numeric ID.
      // Wait, in Events.tsx, we inject `docId` into the objects! So we can use `(event as any).docId`.
      const eventDocId = (event as any).docId;
      if (eventDocId) {
        await updateDoc(doc(db, 'events', eventDocId), {
          currentParticipants: increment(1)
        });
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

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 uppercase">Success!</h3>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Your registration for {event.title} has been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto pt-10 pb-10">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl my-auto flex flex-col max-h-[90vh]">
        <div className="p-6 border-b-[4px] border-black dark:border-white flex justify-between items-center shrink-0 bg-[#00FFFF] z-10 rounded-t-2xl">
          <div>
            <h3 className="text-2xl font-black text-black uppercase tracking-tight">Register</h3>
            <p className="text-sm font-bold text-black/70 uppercase">{event.title}</p>
          </div>
          <button onClick={onClose} disabled={loading} className="text-black hover:bg-black/10 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 font-bold">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-xl font-black uppercase text-slate-800 dark:text-slate-200 border-b-2 border-slate-200 pb-2">Basic Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Full Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} disabled={loading} className="w-full p-3 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-pink-500 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Email Address *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={loading} className="w-full p-3 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-pink-500 outline-none transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Phone Number *</label>
                <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={loading} className="w-full p-3 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-pink-500 outline-none transition-colors" />
              </div>
            </div>
          </div>

          {event.customFields && event.customFields.length > 0 && (
            <div className="space-y-4 pt-4 border-t-2 border-slate-200 dark:border-slate-700">
              <h4 className="text-xl font-black uppercase text-slate-800 dark:text-slate-200 border-b-2 border-slate-200 pb-2">Additional Information</h4>
              
              <div className="space-y-4">
                {event.customFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                      {field.label} {field.required && '*'}
                    </label>
                    
                    {field.type === 'text' && (
                      <input type="text" required={field.required} value={customData[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'text')} disabled={loading} className="w-full p-3 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800" />
                    )}
                    
                    {field.type === 'textarea' && (
                      <textarea required={field.required} value={customData[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'textarea')} disabled={loading} rows={3} className="w-full p-3 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800" />
                    )}
                    
                    {field.type === 'dropdown' && (
                      <select required={field.required} value={customData[field.id] || ''} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'dropdown')} disabled={loading} className="w-full p-3 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <option value="">Select an option</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}
                    
                    {field.type === 'radio' && (
                      <div className="space-y-2">
                        {field.options?.map(opt => (
                          <label key={opt} className="flex items-center gap-3">
                            <input type="radio" name={field.id} value={opt} required={field.required} checked={customData[field.id] === opt} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'radio')} disabled={loading} className="w-4 h-4 text-pink-500" />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {field.type === 'checkbox' && (
                      <div className="space-y-2">
                        {field.options?.map(opt => (
                          <label key={opt} className="flex items-center gap-3">
                            <input type="checkbox" value={opt} checked={(customData[field.id] || []).includes(opt)} onChange={(e) => handleCustomFieldChange(field.id, e.target.value, 'checkbox')} disabled={loading} className="w-4 h-4 text-pink-500" />
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{opt}</span>
                          </label>
                        ))}
                        {field.required && (!customData[field.id] || customData[field.id].length === 0) && (
                           <input type="checkbox" className="hidden" required />
                        )}
                      </div>
                    )}
                    
                    {field.type === 'file' && (
                      <div className="relative">
                        <input type="file" required={field.required} onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleCustomFieldChange(field.id, e.target.files[0], 'file');
                          }
                        }} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="w-full p-4 border-2 border-dashed border-slate-400 dark:border-slate-600 rounded-lg text-center bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center">
                          <Upload className="w-6 h-6 text-slate-400 mb-2" />
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                            {customData[field.id] ? (customData[field.id] as File).name : 'Click or drag file to upload'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.feeAmount && event.feeAmount > 0 && (
            <div className="space-y-4 pt-4 border-t-2 border-slate-200 dark:border-slate-700">
              <h4 className="text-xl font-black uppercase text-slate-800 dark:text-slate-200 border-b-2 border-slate-200 pb-2 flex justify-between">
                <span>Payment</span>
                <span className="text-pink-600">₹{event.feeAmount}</span>
              </h4>
              <div className="flex flex-col gap-6 items-center">
                {event.paymentQrUrl && (
                  <div className="w-full max-w-md shrink-0 mx-auto">
                    <img src={event.paymentQrUrl} alt="Payment QR" className="w-full border-[4px] border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white object-contain" />
                    <p className="text-sm text-center mt-4 font-black uppercase text-pink-600 bg-pink-100 py-2 rounded-lg border-2 border-pink-200">Scan to pay ₹{event.feeAmount}</p>
                  </div>
                )}
                <div className="w-full">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Upload Payment Screenshot *</label>
                  <div className="relative">
                    <input type="file" accept="image/*" required onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setPaymentScreenshot(e.target.files[0]);
                    }} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="w-full p-8 border-4 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center bg-slate-50 dark:bg-slate-800 transition-colors hover:border-pink-500 flex flex-col items-center">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="font-bold text-slate-600 dark:text-slate-400">
                        {paymentScreenshot ? paymentScreenshot.name : 'Click here to attach screenshot'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t-[4px] border-black dark:border-white">
            <button type="submit" disabled={loading} className="w-full bg-[#FF00FF] text-white border-[4px] border-black dark:border-white font-black py-4 px-6 uppercase text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  {uploadProgress || 'Processing...'}
                </>
              ) : (
                'Submit Registration'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventRegistrationModal;
