import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { TimelineEvent, Achievement, PastLeader } from '../../types';
import { Edit, Trash2, Plus, X, Upload } from 'lucide-react';

const CLOUDINARY_CLOUD_NAME = 'dvntu7mui';
const CLOUDINARY_UPLOAD_PRESET = 'IEDCimages';

const LegacyAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'achievements' | 'past_leaders'>('timeline');

  // Common UI shell, we will define separate components or render functions for each tab
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Manage Legacy Page</h2>
      
      <div className="flex space-x-2 mb-6">
        {['timeline', 'achievements', 'past_leaders'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab === 'past_leaders' ? 'Pioneers' : tab.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {activeTab === 'timeline' && <TimelineAdmin />}
        {activeTab === 'achievements' && <AchievementsAdmin />}
        {activeTab === 'past_leaders' && <PastLeadersAdmin />}
      </div>
    </div>
  );
};

// --- Timeline Admin ---
const TimelineAdmin = () => {
  const [items, setItems] = useState<(TimelineEvent & { docId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<(TimelineEvent & { docId: string }) | null>(null);
  const [formData, setFormData] = useState<Partial<TimelineEvent>>({ year: '', title: '', description: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = await getDocs(collection(db, 'timeline'));
      setItems(q.docs.map(d => ({ docId: d.id, ...d.data() })) as any);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleOpenModal = (item?: any) => {
    setEditingItem(item || null);
    setFormData(item || { year: '', title: '', description: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'timeline', editingItem.docId), formData);
      } else {
        await addDoc(collection(db, 'timeline'), formData);
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (error) { alert("Failed to save"); }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Delete?")) return;
    await deleteDoc(doc(db, 'timeline', docId));
    fetchItems();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Timeline Events</h3>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-2"><Plus className="w-4 h-4"/> Add</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b"><th className="p-3">Year</th><th className="p-3">Title</th><th className="p-3 text-right">Actions</th></tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.docId} className="border-b">
              <td className="p-3 font-medium">{item.year}</td>
              <td className="p-3">{item.title}</td>
              <td className="p-3 text-right">
                <button onClick={() => handleOpenModal(item)} className="p-2 text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(item.docId)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between">
              <h3 className="font-bold">{editingItem ? 'Edit' : 'Add'} Timeline Event</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div><label className="block text-sm mb-1">Year</label><input required className="w-full p-2 border rounded" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} /></div>
              <div><label className="block text-sm mb-1">Title</label><input required className="w-full p-2 border rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
              <div><label className="block text-sm mb-1">Description</label><textarea required className="w-full p-2 border rounded" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div className="pt-2 flex justify-end gap-2"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Achievements Admin ---
const AchievementsAdmin = () => {
  const [items, setItems] = useState<(Achievement & { docId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<(Achievement & { docId: string }) | null>(null);
  const [formData, setFormData] = useState<Partial<Achievement>>({ title: '', year: '', description: '', icon: 'Award', image: '' });
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = await getDocs(collection(db, 'achievements'));
      setItems(q.docs.map(d => ({ docId: d.id, ...d.data() })) as any);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleOpenModal = (item?: any) => {
    setEditingItem(item || null);
    setFormData(item || { title: '', year: '', description: '', icon: 'Award', image: '' });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof Achievement) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName as string);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: fd
      });
      
      const data = await response.json();
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, [fieldName]: data.secure_url }));
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error("Error uploading file to Cloudinary:", error);
      alert("Failed to upload image.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'achievements', editingItem.docId), formData);
      } else {
        await addDoc(collection(db, 'achievements'), { ...formData, id: Date.now() });
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (error) { alert("Failed to save"); }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Delete?")) return;
    await deleteDoc(doc(db, 'achievements', docId));
    fetchItems();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Achievements</h3>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-2"><Plus className="w-4 h-4"/> Add</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b"><th className="p-3">Year</th><th className="p-3">Title</th><th className="p-3 text-right">Actions</th></tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.docId} className="border-b">
              <td className="p-3 font-medium">{item.year}</td>
              <td className="p-3">{item.title}</td>
              <td className="p-3 text-right">
                <button onClick={() => handleOpenModal(item)} className="p-2 text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(item.docId)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between">
              <h3 className="font-bold">{editingItem ? 'Edit' : 'Add'} Achievement</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div><label className="block text-sm mb-1">Year</label><input required className="w-full p-2 border rounded" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} /></div>
              <div><label className="block text-sm mb-1">Title</label><input required className="w-full p-2 border rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
              <div><label className="block text-sm mb-1">Description</label><textarea required className="w-full p-2 border rounded" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div><label className="block text-sm mb-1">Icon (Trophy, Lightbulb, Zap, Award)</label><input required className="w-full p-2 border rounded" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} /></div>
              <div>
                <label className="block text-sm mb-1">Image URL</label>
                <div className="flex gap-2">
                  <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})} />
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Upload Image" disabled={uploadingField === 'image'} />
                    <button type="button" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium whitespace-nowrap" disabled={uploadingField === 'image'}>
                      {uploadingField === 'image' ? <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-slate-700 animate-spin"></div> : <Upload className="w-4 h-4" />}
                      {uploadingField === 'image' ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Past Leaders Admin ---
const PastLeadersAdmin = () => {
  const [items, setItems] = useState<(PastLeader & { docId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<(PastLeader & { docId: string }) | null>(null);
  const [formData, setFormData] = useState<Partial<PastLeader>>({ year: '', nodalOfficer: '', nodalOfficerImage: '', ceo: '', ceoImage: '' });
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = await getDocs(collection(db, 'past_leaders'));
      setItems(q.docs.map(d => ({ docId: d.id, ...d.data() })) as any);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleOpenModal = (item?: any) => {
    setEditingItem(item || null);
    setFormData(item || { year: '', nodalOfficer: '', nodalOfficerImage: '', ceo: '', ceoImage: '' });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof PastLeader) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName as string);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: fd
      });
      
      const data = await response.json();
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, [fieldName]: data.secure_url }));
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error("Error uploading file to Cloudinary:", error);
      alert("Failed to upload image.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'past_leaders', editingItem.docId), formData);
      } else {
        await addDoc(collection(db, 'past_leaders'), formData);
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (error) { alert("Failed to save"); }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Delete?")) return;
    await deleteDoc(doc(db, 'past_leaders', docId));
    fetchItems();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">The Pioneers</h3>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-3 py-2 rounded flex items-center gap-2"><Plus className="w-4 h-4"/> Add</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b"><th className="p-3">Tenure</th><th className="p-3">Nodal Officer</th><th className="p-3">CEO</th><th className="p-3 text-right">Actions</th></tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.docId} className="border-b">
              <td className="p-3 font-medium">{item.year}</td>
              <td className="p-3">{item.nodalOfficer}</td>
              <td className="p-3">{item.ceo}</td>
              <td className="p-3 text-right">
                <button onClick={() => handleOpenModal(item)} className="p-2 text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(item.docId)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between">
              <h3 className="font-bold">{editingItem ? 'Edit' : 'Add'} Past Leaders</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div><label className="block text-sm mb-1">Tenure (Year)</label><input required className="w-full p-2 border rounded" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} /></div>
              <div><label className="block text-sm mb-1">Nodal Officer Name</label><input required className="w-full p-2 border rounded" value={formData.nodalOfficer} onChange={e => setFormData({...formData, nodalOfficer: e.target.value})} /></div>
              <div>
                <label className="block text-sm mb-1">Nodal Officer Image URL</label>
                <div className="flex gap-2">
                  <input required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" value={formData.nodalOfficerImage || ''} onChange={e => setFormData({...formData, nodalOfficerImage: e.target.value})} />
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'nodalOfficerImage')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Upload Image" disabled={uploadingField === 'nodalOfficerImage'} />
                    <button type="button" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium whitespace-nowrap" disabled={uploadingField === 'nodalOfficerImage'}>
                      {uploadingField === 'nodalOfficerImage' ? <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-slate-700 animate-spin"></div> : <Upload className="w-4 h-4" />}
                      {uploadingField === 'nodalOfficerImage' ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>
              <div><label className="block text-sm mb-1">CEO Name</label><input required className="w-full p-2 border rounded" value={formData.ceo} onChange={e => setFormData({...formData, ceo: e.target.value})} /></div>
              <div>
                <label className="block text-sm mb-1">CEO Image URL</label>
                <div className="flex gap-2">
                  <input required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" value={formData.ceoImage || ''} onChange={e => setFormData({...formData, ceoImage: e.target.value})} />
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'ceoImage')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Upload Image" disabled={uploadingField === 'ceoImage'} />
                    <button type="button" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium whitespace-nowrap" disabled={uploadingField === 'ceoImage'}>
                      {uploadingField === 'ceoImage' ? <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-slate-700 animate-spin"></div> : <Upload className="w-4 h-4" />}
                      {uploadingField === 'ceoImage' ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegacyAdmin;
