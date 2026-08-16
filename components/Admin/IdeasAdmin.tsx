import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { IdeaSubmission } from '../../types';
import { Search, Eye, Trash2, X, Download, ExternalLink, Calendar, User, Mail, Phone, BookOpen, FileSpreadsheet, Layers, ShieldQuestion } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FirestoreIdea extends IdeaSubmission {
  docId: string;
}

// Helper to safely format Firestore timestamp or other date values
const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  if (typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate().toLocaleString();
    } catch (e) {
      console.error("Error converting timestamp via toDate:", e);
    }
  }
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

const formatTimestampDate = (timestamp: any) => {
  if (!timestamp) return 'Unknown';
  if (typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate().toLocaleDateString();
    } catch (e) {
      console.error("Error converting timestamp via toDate:", e);
    }
  }
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
};

// Helper to convert Cloudinary URL to direct download URL using fl_attachment
const getCloudinaryDownloadUrl = (url: string | undefined | null) => {
  if (!url) return '';
  // Cloudinary often blocks transformations (like fl_attachment) on PDFs for security reasons,
  // which results in an ERR_INVALID_RESPONSE. For PDFs, we'll return the original URL.
  if (url.toLowerCase().endsWith('.pdf')) {
    return url;
  }
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  return url;
};


const IdeasAdmin: React.FC = () => {
  const [ideas, setIdeas] = useState<FirestoreIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<FirestoreIdea | null>(null);

  const fetchIdeas = async () => {
    setLoading(false);
    try {
      setLoading(true);
      const ideasRef = collection(db, 'ideas');
      const q = query(ideasRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const ideasData = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      })) as FirestoreIdea[];
      setIdeas(ideasData);
    } catch (error) {
      console.error("Error fetching idea submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const handleDelete = async (docId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the idea "${title}"? This action cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'ideas', docId));
      setIdeas(prev => prev.filter(idea => idea.docId !== docId));
      if (selectedIdea?.docId === docId) {
        setSelectedIdea(null);
      }
    } catch (error) {
      console.error("Error deleting idea:", error);
      alert("Failed to delete the submission.");
    }
  };

  const handleExportExcel = () => {
    if (ideas.length === 0) {
      alert("No ideas to export!");
      return;
    }
    const dataToExport = ideas.map(idea => ({
      'Submitter Name': idea.name || 'N/A',
      'Email': idea.email || 'N/A',
      'Phone': idea.phone || 'N/A',
      'Branch/Department': idea.department || 'N/A',
      'Semester': idea.semester || 'N/A',
      'Idea Title': idea.title || 'N/A',
      'Category': idea.category || 'N/A',
      'Problem Statement': idea.problemStatement || 'N/A',
      'Solution Description': idea.solutionDescription || 'N/A',
      'Target Audience': idea.targetAudience || 'N/A',
      'Team Size': idea.teamSize || 'N/A',
      'Team Members': idea.teamMembers || 'N/A',
      'Support Needed': idea.supportNeeded ? idea.supportNeeded.join(', ') : 'N/A',
      'Pitch Deck Link': idea.pitchDeckUrl || 'None',
      'Submitted On': formatTimestamp(idea.timestamp)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submitted Ideas');
    XLSX.writeFile(workbook, `IEDC_Idea_Submissions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Filter ideas based on search term & category filter
  const filteredIdeas = ideas.filter(idea => {
    const name = idea.name || '';
    const email = idea.email || '';
    const title = idea.title || '';
    const department = idea.department || '';

    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === '' || idea.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(ideas.map(i => i.category)));

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        Loading idea submissions...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase text-slate-800 dark:text-slate-200">Idea Submissions</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold">Manage, review, and filter student startup/project idea submissions.</p>
        </div>
        <button
          onClick={handleExportExcel}
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Export to Excel
        </button>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, title, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end font-bold text-sm text-slate-500 pr-2">
          Showing {filteredIdeas.length} of {ideas.length} submissions
        </div>
      </div>

      {/* Submissions List */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500">
          No idea submissions found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredIdeas.map((idea) => {
            const formattedDate = formatTimestampDate(idea.timestamp);

            return (
              <div 
                key={idea.docId}
                className="bg-white dark:bg-slate-900 border-[3px] border-black dark:border-slate-800 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 font-extrabold text-xs uppercase border-[2px] border-black dark:border-yellow-700 rounded-full">
                      {idea.category}
                    </span>
                    <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedDate}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-black text-[10px] uppercase rounded">
                      Team: {idea.teamSize === 'solo' ? 'Solo' : `${idea.teamSize} members`}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                    {idea.title}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 text-sm text-slate-600 dark:text-slate-400 font-bold">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>{idea.name} ({idea.semester}, {idea.department.split(' ')[0]})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{idea.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{idea.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800 justify-end">
                  <button
                    onClick={() => setSelectedIdea(idea)}
                    className="p-2 border-[2px] border-black dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 font-bold text-sm"
                    title="View Full Details"
                  >
                    <Eye className="w-4.5 h-4.5" />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => handleDelete(idea.docId, idea.title)}
                    className="p-2 border-[2px] border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-all"
                    title="Delete Idea"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Idea Details Modal */}
      {selectedIdea && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-[4px] border-black dark:border-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedIdea(null)}
              className="absolute right-4 top-4 p-1.5 border-[2px] border-black rounded-lg bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5 text-black dark:text-white" />
            </button>

            {/* Modal Header */}
            <div className="mb-6 border-b-[4px] border-black dark:border-slate-800 pb-4 pr-10">
              <span className="px-3 py-1 bg-[#00FFFF] text-black font-extrabold text-xs uppercase border-[2px] border-black rounded-full mb-3 inline-block">
                {selectedIdea.category}
              </span>
              <h3 className="text-3xl font-black leading-tight text-black dark:text-white mb-2">{selectedIdea.title}</h3>
              <p className="text-sm font-bold text-slate-500 flex items-center gap-1">
                Submitted on: {formatTimestamp(selectedIdea.timestamp)}
              </p>
            </div>

            {/* Modal Content */}
            <div className="space-y-6">
              {/* Section 1: Submitter Info */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 border-[2px] border-black rounded-xl">
                <h4 className="font-black text-xs uppercase text-slate-400 mb-3 tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Submitter Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-bold text-black dark:text-white">
                  <div>Name: <span className="font-black text-blue-600 dark:text-blue-400">{selectedIdea.name}</span></div>
                  <div>Email: <span>{selectedIdea.email}</span></div>
                  <div>Phone: <span>{selectedIdea.phone}</span></div>
                  <div>Year/Dept: <span>{selectedIdea.semester} - {selectedIdea.department}</span></div>
                </div>
              </div>

              {/* Section 2: Technical Description */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-black text-sm uppercase text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                    <ShieldQuestion className="w-4.5 h-4.5 text-blue-500" /> The Problem
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                    {selectedIdea.problemStatement}
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-sm uppercase text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                    <Layers className="w-4.5 h-4.5 text-green-500" /> The Solution
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                    {selectedIdea.solutionDescription}
                  </p>
                </div>

                {selectedIdea.targetAudience && (
                  <div>
                    <h4 className="font-black text-sm uppercase text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-4.5 h-4.5 text-yellow-500" /> Target Market / Customer Base
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                      {selectedIdea.targetAudience}
                    </p>
                  </div>
                )}
              </div>

              {/* Section 3: Setup Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-black text-xs uppercase text-slate-400 mb-2">Team Info</h4>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    <p>Size: <span className="font-black uppercase">{selectedIdea.teamSize === 'solo' ? 'Solo Submission' : `${selectedIdea.teamSize} member team`}</span></p>
                    {selectedIdea.teamMembers && (
                      <p className="mt-1 text-xs whitespace-pre-wrap font-medium p-2 bg-slate-50 dark:bg-slate-950 rounded border dark:border-slate-800">{selectedIdea.teamMembers}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-xs uppercase text-slate-400 mb-2">Support Requested</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedIdea.supportNeeded && selectedIdea.supportNeeded.length > 0 ? (
                      selectedIdea.supportNeeded.map(sup => (
                        <span key={sup} className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900 rounded font-bold text-xs uppercase">
                          {sup}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 font-bold">No specific support listed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pitch Deck Link */}
              {selectedIdea.pitchDeckUrl && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Pitch Deck / Attachment is attached:</span>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={selectedIdea.pitchDeckUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 border-[2px] border-black rounded-xl bg-[#00FFFF] hover:bg-[#00e000] text-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all"
                    >
                      <span>View Pitch Deck</span>
                      <ExternalLink className="w-4.5 h-4.5" />
                    </a>
                    <a
                      href={getCloudinaryDownloadUrl(selectedIdea.pitchDeckUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 border-[2px] border-black rounded-xl bg-[#00FF00] hover:bg-[#00e000] text-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all"
                    >
                      <span>Download File</span>
                      <Download className="w-4.5 h-4.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeasAdmin;
