import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { TimelineEvent, Achievement, PastLeader } from '../../types';
import { Edit, Trash2, Plus, X } from 'lucide-react';

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
              <div><label className="block text-sm mb-1">Image URL</label><input className="w-full p-2 border rounded" value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})} /></div>
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
              <div><label className="block text-sm mb-1">Nodal Officer Image URL</label><input required className="w-full p-2 border rounded" value={formData.nodalOfficerImage} onChange={e => setFormData({...formData, nodalOfficerImage: e.target.value})} /></div>
              <div><label className="block text-sm mb-1">CEO Name</label><input required className="w-full p-2 border rounded" value={formData.ceo} onChange={e => setFormData({...formData, ceo: e.target.value})} /></div>
              <div><label className="block text-sm mb-1">CEO Image URL</label><input required className="w-full p-2 border rounded" value={formData.ceoImage} onChange={e => setFormData({...formData, ceoImage: e.target.value})} /></div>
              <div className="pt-2 flex justify-end gap-2"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegacyAdmin;
