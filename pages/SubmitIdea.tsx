import React, { useState } from 'react';
import { Upload, CheckCircle, ArrowLeft, Lightbulb, User, Mail, Phone, BookOpen, Layers, Target, HelpCircle, FileText, CheckSquare, Plus, Trash2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';

interface Props {
  onNavigate: (path: string) => void;
}

const CLOUDINARY_CLOUD_NAME = 'dvntu7mui';
const CLOUDINARY_UPLOAD_PRESET = 'IEDCimages';

const CATEGORIES = [
  'Software / Web / Mobile App',
  'AI / ML / Data Science',
  'Hardware / IoT / Robotics',
  'Healthcare & BioTech',
  'Agriculture & FoodTech',
  'FinTech / E-Commerce',
  'Social Impact & Sustainability',
  'Other'
];

const TEAM_SIZES = [
  { value: 'solo', label: 'Solo (Just Me)' },
  { value: '2', label: '2 Members' },
  { value: '3', label: '3 Members' },
  { value: '4', label: '4 Members' }
];

const SUPPORT_OPTIONS = [
  'Mentorship & Guidance',
  'Incubation & Workspace',
  'Prototyping Grant / Funding',
  'Technical Assistance',
  'Co-founder / Team Matching',
  'IPR & Patent Support'
];

const SubmitIdea: React.FC<Props> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    category: '',
    problemStatement: '',
    solutionDescription: '',
    targetAudience: '',
    teamSize: 'solo',
    teamMembers: '',
  });

  const [selectedSupport, setSelectedSupport] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSupportToggle = (option: string) => {
    setSelectedSupport(prev => 
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const uploadFileToCloudinary = async (fileToUpload: File): Promise<string> => {
    try {
      setUploadProgress('Compressing file...');
      let finalFile = fileToUpload;
      
      // Compress if it is an image
      if (fileToUpload.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
          initialQuality: 0.7
        };
        finalFile = await imageCompression(fileToUpload, options);
      }

      setUploadProgress('Uploading file...');
      const fd = new FormData();
      fd.append('file', finalFile);
      fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      fd.append('folder', 'ideas/pitch_decks');
      
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
      throw new Error('Failed to upload attachment. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Basic Validation
      if (!formData.name || !formData.email || !formData.phone) {
        throw new Error("Please complete all personal details.");
      }
      if (!formData.title || !formData.category || !formData.problemStatement || !formData.solutionDescription) {
        throw new Error("Please complete all fields detailing your idea.");
      }

      let pitchDeckUrl = '';
      if (file) {
        pitchDeckUrl = await uploadFileToCloudinary(file);
      }

      const ideaSubmission = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        title: formData.title,
        category: formData.category,
        problemStatement: formData.problemStatement,
        solutionDescription: formData.solutionDescription,
        targetAudience: formData.targetAudience,
        teamSize: formData.teamSize,
        teamMembers: formData.teamSize !== 'solo' ? formData.teamMembers : '',
        supportNeeded: selectedSupport,
        pitchDeckUrl: pitchDeckUrl || null,
        timestamp: new Date()
      };

      await addDoc(collection(db, 'ideas'), ideaSubmission);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your idea. Please try again.');
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-4 bg-slate-50 dark:bg-slate-950">
        <motion.div 
          initial="hidden" animate="visible" variants={modalVariants}
          className="bg-white dark:bg-slate-900 border-[4px] border-black dark:border-white rounded-3xl p-10 max-w-lg w-full text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" as const, bounce: 0.5, duration: 0.6 }}
            className="w-24 h-24 bg-[#00FF00] border-[4px] border-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <CheckCircle className="w-12 h-12 text-black" />
          </motion.div>
          
          <h3 className="text-4xl font-black uppercase mb-4 tracking-tight">Idea Submitted!</h3>
          <p className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-8 leading-tight">
            Thank you for submitting <span className="underline decoration-[#FFDE03] decoration-4 font-black">{formData.title}</span>. 
            The IEDC Execom team will review your idea and get in touch with you shortly.
          </p>
          
          <button 
            onClick={() => onNavigate('/')}
            className="w-full py-4 bg-[#00FFFF] text-black font-black uppercase text-lg border-[4px] border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-40 px-6 max-w-7xl mx-auto pb-20 space-y-12">
      {/* Header section in Neobrutalism Style */}
      <div className="max-w-4xl border-b-[10px] border-black dark:border-white pb-12">
        <button 
          onClick={() => onNavigate('/')} 
          className="mb-6 px-4 py-2 border-[3px] border-black dark:border-white rounded-lg bg-white dark:bg-slate-900 text-black dark:text-white text-xs font-black uppercase flex items-center gap-2 hover:-translate-y-0.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6">SUBMIT IDEA.</h1>
        <p className="text-2xl font-bold leading-tight uppercase text-slate-700 dark:text-slate-300">
          Innovation begins with a single concept. Submit your idea, get incubated, and build the future with CE Kidangoor IEDC.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-10">
          {error && (
            <div className="p-4 border-[4px] border-black bg-red-100 text-red-950 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl">
              Error: {error}
            </div>
          )}

          {/* Section 1: Submitter Info */}
          <GlassCard className="p-8 md:p-12 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]" hoverEffect={false}>
            <div className="flex items-center gap-4 mb-8 border-b-[4px] border-black dark:border-white pb-4">
              <div className="p-3 bg-[#FFDE03] border-[3px] border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <User size={24} className="text-black" />
              </div>
              <h2 className="text-3xl font-black uppercase">1. Contributor Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-black uppercase mb-2 tracking-wider">Full Name *</label>
                <input 
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Adithya S"
                  className="w-full p-4 border-[3px] border-black rounded-xl font-bold bg-white dark:bg-slate-950 text-black dark:text-white placeholder-slate-400 focus:outline-none focus:bg-yellow-50 dark:focus:bg-slate-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-2 tracking-wider">Email Address *</label>
                <input 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. adithya@domain.com"
                  className="w-full p-4 border-[3px] border-black rounded-xl font-bold bg-white dark:bg-slate-950 text-black dark:text-white placeholder-slate-400 focus:outline-none focus:bg-yellow-50 dark:focus:bg-slate-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-2 tracking-wider">Phone Number *</label>
                <input 
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. +91 9876543210"
                  className="w-full p-4 border-[3px] border-black rounded-xl font-bold bg-white dark:bg-slate-950 text-black dark:text-white placeholder-slate-400 focus:outline-none focus:bg-yellow-50 dark:focus:bg-slate-900 transition-colors"
                />
              </div>
            </div>
          </GlassCard>

          {/* Section 2: Idea Details */}
          <GlassCard className="p-8 md:p-12 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]" hoverEffect={false}>
            <div className="flex items-center gap-4 mb-8 border-b-[4px] border-black dark:border-white pb-4">
              <div className="p-3 bg-[#00FFFF] border-[3px] border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Lightbulb size={24} className="text-black" />
              </div>
              <h2 className="text-3xl font-black uppercase">2. The Innovation</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase mb-2 tracking-wider">Idea / Project Title *</label>
                <input 
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="What is your innovation called?"
                  className="w-full p-4 border-[3px] border-black rounded-xl font-bold bg-white dark:bg-slate-950 text-black dark:text-white placeholder-slate-400 focus:outline-none focus:bg-yellow-50 dark:focus:bg-slate-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-2 tracking-wider">Domain / Category *</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full p-4 border-[3px] border-black rounded-xl font-bold bg-white dark:bg-slate-950 text-black dark:text-white focus:outline-none focus:bg-yellow-50 dark:focus:bg-slate-900 transition-colors"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-2 tracking-wider">Problem Statement *</label>
                <p className="text-xs font-bold text-slate-500 mb-2">Explain the problem you are solving in detail. Why is it a pain point?</p>
                <textarea 
                  name="problemStatement"
                  value={formData.problemStatement}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Describe who has this problem and how it impacts them..."
                  className="w-full p-4 border-[3px] border-black rounded-xl font-bold bg-white dark:bg-slate-950 text-black dark:text-white placeholder-slate-400 focus:outline-none focus:bg-yellow-50 dark:focus:bg-slate-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-2 tracking-wider">Your Solution *</label>
                <p className="text-xs font-bold text-slate-500 mb-2">How does your product/service solve the problem? What makes it unique?</p>
                <textarea 
                  name="solutionDescription"
                  value={formData.solutionDescription}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Explain how it works and what is unique about your approach..."
                  className="w-full p-4 border-[3px] border-black rounded-xl font-bold bg-white dark:bg-slate-950 text-black dark:text-white placeholder-slate-400 focus:outline-none focus:bg-yellow-50 dark:focus:bg-slate-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-2 tracking-wider">Target Audience & Market Opportunity</label>
                <p className="text-xs font-bold text-slate-500 mb-2">Who are the end users or paying customers? How large is the market?</p>
                <textarea 
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="e.g. College students, local stores, tech companies..."
                  className="w-full p-4 border-[3px] border-black rounded-xl font-bold bg-white dark:bg-slate-950 text-black dark:text-white placeholder-slate-400 focus:outline-none focus:bg-yellow-50 dark:focus:bg-slate-900 transition-colors"
                />
              </div>
            </div>
          </GlassCard>

          {/* Section 3: Team & Resources */}
          <GlassCard className="p-8 md:p-12 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]" hoverEffect={false}>
            <div className="flex items-center gap-4 mb-8 border-b-[4px] border-black dark:border-white pb-4">
              <div className="p-3 bg-[#FF00FF] border-[3px] border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Layers size={24} className="text-white" />
              </div>
              <h2 className="text-3xl font-black uppercase text-black dark:text-white">3. Setup & Support</h2>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-black uppercase mb-2 tracking-wider">Team Size *</label>
                  <select 
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleInputChange}
                    required
                    className="w-full p-4 border-[3px] border-black rounded-xl font-bold bg-white dark:bg-slate-950 text-black dark:text-white focus:outline-none focus:bg-yellow-50 dark:focus:bg-slate-900 transition-colors"
                  >
                    {TEAM_SIZES.map(ts => <option key={ts.value} value={ts.value}>{ts.label}</option>)}
                  </select>
                </div>

                <AnimatePresence mode="wait">
                  {formData.teamSize !== 'solo' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-xs font-black uppercase mb-2 tracking-wider">Team Member Names & Emails</label>
                      <textarea 
                        name="teamMembers"
                        value={formData.teamMembers}
                        onChange={handleInputChange}
                        rows={2}
                        placeholder="e.g. Alice (CSE, S5) - alice@domain.com, Bob (ME, S5) - bob@domain.com"
                        className="w-full p-4 border-[3px] border-black rounded-xl font-bold bg-white dark:bg-slate-950 text-black dark:text-white placeholder-slate-400 focus:outline-none focus:bg-yellow-50 dark:focus:bg-slate-900 transition-colors"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-4 tracking-wider">Support Needed from IEDC *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SUPPORT_OPTIONS.map(opt => {
                    const isSelected = selectedSupport.includes(opt);
                    return (
                      <div 
                        key={opt}
                        onClick={() => handleSupportToggle(opt)}
                        className={`flex items-center gap-3 p-4 border-[3px] border-black rounded-xl cursor-pointer select-none transition-all ${
                          isSelected 
                            ? 'bg-[#00FF00] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-0.5 translate-y-0.5' 
                            : 'bg-white dark:bg-slate-950 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                        }`}
                      >
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="hidden"
                        />
                        <div className={`w-6 h-6 border-[2px] border-black flex items-center justify-center bg-white ${isSelected ? 'bg-black' : ''}`}>
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className="font-bold text-sm uppercase">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase mb-2 tracking-wider">Attach Pitch Deck / Document / Image (Optional)</label>
                <p className="text-xs font-bold text-slate-500 mb-4">Supported formats: PDF, Images (Max 10MB). This helps us better understand your prototype or plans.</p>
                
                <div className="relative border-[3px] border-dashed border-black dark:border-slate-700 rounded-xl p-8 text-center bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                  <input 
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,image/*"
                  />
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 border-[3px] border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <Upload size={24} className="text-black dark:text-white" />
                    </div>
                    {file ? (
                      <div className="space-y-1">
                        <p className="font-black text-sm text-green-600 uppercase">File Selected</p>
                        <p className="font-bold text-xs text-slate-700 dark:text-slate-300 truncate max-w-xs">{file.name}</p>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setFile(null); }}
                          className="text-xs text-red-500 font-bold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-black text-sm uppercase">Click or Drag File to Upload</p>
                        <p className="font-bold text-xs text-slate-400">PDF, JPG, PNG up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Submitting Status / Submit Button */}
          <div className="text-right flex flex-col md:flex-row items-center justify-between gap-6 border-t-[4px] border-black dark:border-white pt-8">
            <div className="text-left font-bold text-slate-600 dark:text-slate-400">
              {loading && uploadProgress && (
                <p className="text-[#FF00FF] font-black uppercase text-sm animate-pulse">{uploadProgress}</p>
              )}
              {!loading && <p className="text-xs uppercase">* Marked fields are required</p>}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`px-12 py-5 bg-[#00FF00] text-black font-black uppercase text-xl border-[4px] border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all ${
                loading 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
              }`}
            >
              {loading ? 'Submitting Idea...' : 'Submit Idea Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitIdea;
