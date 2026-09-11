import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { SubWebsite } from '../../types';
import { 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Search, 
  Monitor, 
  ArrowRightLeft, 
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import RethinkModal from './RethinkModal';

interface FirestoreSubWebsite extends SubWebsite {
  docId: string;
}

const WebsitesAdmin: React.FC = () => {
  const [websites, setWebsites] = useState<FirestoreSubWebsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<FirestoreSubWebsite | null>(null);
  const [deleteSite, setDeleteSite] = useState<FirestoreSubWebsite | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<SubWebsite>>({
    name: '',
    slug: '',
    targetUrl: '',
    description: '',
    displayMode: 'iframe',
    isActive: true
  });

  const [slugError, setSlugError] = useState<string | null>(null);

  const fetchWebsites = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'websites'));
      const sitesData = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      })) as FirestoreSubWebsite[];
      setWebsites(sitesData);
    } catch (error) {
      console.error("Error fetching websites:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const sanitizeSlug = (rawSlug: string) => {
    return rawSlug
      .toLowerCase()
      .trim()
      .replace(/^\/+|\/+$/g, '') // remove leading/trailing slashes
      .replace(/[^a-z0-9-_]/g, '-'); // replace invalid chars with hyphen
  };

  const handleSlugChange = (val: string) => {
    const cleaned = sanitizeSlug(val);
    setFormData(prev => ({ ...prev, slug: cleaned }));
    
    // Validate reserved routes
    const reservedRoutes = ['events', 'execom', 'gallery', 'legacy', 'about', 'leaderboard', 'exult', 'submit-idea', 'welcome', 'admin', 'csl', 'register', 'live', 'auction'];
    if (reservedRoutes.includes(cleaned)) {
      setSlugError(`"${cleaned}" is a reserved system route. Please choose a different link name.`);
    } else {
      setSlugError(null);
    }
  };

  const handleOpenModal = (site?: FirestoreSubWebsite) => {
    setSlugError(null);
    if (site) {
      setEditingSite(site);
      setFormData(site);
    } else {
      setEditingSite(null);
      setFormData({
        name: '',
        slug: '',
        targetUrl: '',
        description: '',
        displayMode: 'iframe',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSite(null);
    setSlugError(null);
  };

  const formatUrl = (url: string) => {
    let trimmed = url.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slugError) return;

    const formattedSlug = sanitizeSlug(formData.slug || '');
    if (!formattedSlug) {
      setSlugError('Please enter a valid link slug (e.g. name, summit)');
      return;
    }

    const formattedTargetUrl = formatUrl(formData.targetUrl || '');
    if (!formattedTargetUrl) {
      alert('Please enter a valid target URL');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        name: formData.name?.trim() || 'Untitled Website',
        slug: formattedSlug,
        targetUrl: formattedTargetUrl,
        description: formData.description?.trim() || '',
        displayMode: formData.displayMode || 'iframe',
        isActive: formData.isActive !== false,
        updatedAt: serverTimestamp()
      };

      if (editingSite) {
        const docRef = doc(db, 'websites', editingSite.docId);
        await updateDoc(docRef, dataToSave);
      } else {
        await addDoc(collection(db, 'websites'), {
          ...dataToSave,
          createdAt: serverTimestamp()
        });
      }

      handleCloseModal();
      await fetchWebsites();
    } catch (error) {
      console.error("Error saving sub-website:", error);
      alert("Failed to save website entry. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (site: FirestoreSubWebsite) => {
    try {
      const docRef = doc(db, 'websites', site.docId);
      await updateDoc(docRef, { isActive: !site.isActive });
      setWebsites(prev => prev.map(s => s.docId === site.docId ? { ...s, isActive: !s.isActive } : s));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const confirmDeleteWebsite = async () => {
    if (!deleteSite) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'websites', deleteSite.docId));
      await fetchWebsites();
    } catch (error) {
      console.error("Error deleting website:", error);
      alert("Failed to delete website entry.");
    } finally {
      setIsDeleting(false);
      setDeleteSite(null);
    }
  };

  const getFullShortUrl = (slug: string) => {
    const origin = window.location.origin;
    return `${origin}/${slug}`;
  };

  const handleCopyLink = (slug: string, docId: string) => {
    const fullUrl = getFullShortUrl(slug);
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(docId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredWebsites = websites.filter(site => 
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.targetUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-semibold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" />
              Website Manager & Alias Routing
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Linked Sub-Websites
            </h2>
            <p className="text-slate-300 text-sm max-w-xl">
              Turn external site links (like <code className="text-blue-300 bg-white/10 px-1.5 py-0.5 rounded">https://name.vercel.app</code>) into official IEDC domain links (like <code className="text-emerald-300 bg-white/10 px-1.5 py-0.5 rounded">iedc.ce-kgr.org/name</code>).
            </p>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span>Add Sub-Website</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Search & Quick stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search websites or links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Active: {websites.filter(w => w.isActive).length}</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
          <div>Total Linked: {websites.length}</div>
        </div>
      </div>

      {/* Websites Table / Cards */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Loading linked websites...</p>
        </div>
      ) : filteredWebsites.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
            <Globe className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {searchQuery ? 'No matching websites found' : 'No Sub-Websites Linked Yet'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {searchQuery 
                ? 'Try tweaking your search term.' 
                : 'Click "Add Sub-Website" above to convert external Vercel, Netlify or GitHub links into branded iedc.ce-kgr.org/name URLs.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Your First Site Link
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4">Website Name</th>
                  <th className="p-4">Short Branded URL</th>
                  <th className="p-4">Destination Link</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredWebsites.map((site) => {
                  const shortUrl = getFullShortUrl(site.slug);
                  const isCopied = copiedId === site.docId;

                  return (
                    <tr 
                      key={site.docId} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Name & Desc */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>{site.name}</span>
                        </div>
                        {site.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs truncate">
                            {site.description}
                          </p>
                        )}
                      </td>

                      {/* Short Link */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                            /{site.slug}
                          </span>
                          <button
                            onClick={() => handleCopyLink(site.slug, site.docId)}
                            title="Copy full short URL"
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded"
                          >
                            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>

                      {/* Destination URL */}
                      <td className="p-4">
                        <a
                          href={site.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-300 hover:text-blue-600 max-w-[200px] truncate"
                        >
                          <span className="truncate">{site.targetUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                        </a>
                      </td>

                      {/* Mode Badge */}
                      <td className="p-4">
                        {site.displayMode === 'iframe' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full text-xs font-medium">
                            <Monitor className="w-3.5 h-3.5" />
                            Embedded Frame
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-medium">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Direct Redirect
                          </span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleActive(site)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            site.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {site.isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              Disabled
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/${site.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Preview branded short link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleOpenModal(site)}
                            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteSite(site)}
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Delete link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Sub-Website Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {editingSite ? 'Edit Sub-Website Link' : 'Add New Sub-Website Link'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Connect external sites (Vercel, Netlify, Github) to iedc.ce-kgr.org
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Site Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Website Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Startup Summit 2026 or Event Site"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Slug Path */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Short URL Path / Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                    iedc.ce-kgr.org/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="name (e.g. summit, hackathon)"
                    value={formData.slug || ''}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border ${
                      slugError ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
                    } rounded-xl text-sm font-mono focus:ring-2 focus:outline-none`}
                  />
                </div>
                {slugError ? (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {slugError}
                  </p>
                ) : formData.slug ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                    ✓ Link will be: iedc.ce-kgr.org/{formData.slug}
                  </p>
                ) : null}
              </div>

              {/* Target External URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Website Link (Vercel / External) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://name.vercel.app"
                  value={formData.targetUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetUrl: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Display Mode Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Display Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, displayMode: 'iframe' }))}
                    className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      formData.displayMode === 'iframe'
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Monitor className="w-4 h-4 text-blue-600" />
                        Embedded Frame
                      </span>
                      {formData.displayMode === 'iframe' && <Sparkles className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Embeds target site in 100% full screen while keeping iedc.ce-kgr.org domain in address bar.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, displayMode: 'redirect' }))}
                    className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      formData.displayMode === 'redirect'
                        ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                        Direct Redirect
                      </span>
                      {formData.displayMode === 'redirect' && <Sparkles className="w-4 h-4 text-amber-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Instantly forwards visitors from iedc.ce-kgr.org/name to target URL.
                    </p>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief notes on what this separate website is for..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Enable Short Link
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Active links are accessible to visitors at iedc.ce-kgr.org/{formData.slug || 'name'}
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !!slugError}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Sub-Website Link'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <RethinkModal
        isOpen={!!deleteSite}
        title="Rethink Sub-Website Deletion"
        description="Are you sure you want to remove this linked website? Visitors to the short URL will no longer be forwarded or embedded."
        itemName={deleteSite ? `${deleteSite.name} (/ ${deleteSite.slug})` : undefined}
        confirmText="Yes, Delete Link"
        cancelText="Keep Website Link"
        onConfirm={confirmDeleteWebsite}
        onCancel={() => setDeleteSite(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default WebsitesAdmin;
