import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ExecomMember } from '../../types';
import { Edit, Trash2, Plus, X } from 'lucide-react';

interface FirestoreMember extends ExecomMember {
  docId: string;
}

const ExecomAdmin: React.FC = () => {
  const [members, setMembers] = useState<FirestoreMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FirestoreMember | null>(null);

  const [formData, setFormData] = useState<Partial<ExecomMember>>({
    name: '',
    role: '',
    image: '',
    socials: { linkedin: '', twitter: '', github: '', instagram: '' }
  });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'execom'));
      const membersData = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      })) as FirestoreMember[];
      
      membersData.sort((a, b) => (a.id || 0) - (b.id || 0));
      setMembers(membersData);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleOpenModal = (member?: FirestoreMember) => {
    if (member) {
      setEditingMember(member);
      setFormData(member);
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        role: '',
        image: '',
        socials: { linkedin: '', twitter: '', github: '', instagram: '' }
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        const memberRef = doc(db, 'execom', editingMember.docId);
        await updateDoc(memberRef, formData);
      } else {
        const newMember = { ...formData, id: Date.now() };
        await addDoc(collection(db, 'execom'), newMember);
      }
      handleCloseModal();
      fetchMembers();
    } catch (error) {
      console.error("Error saving member:", error);
      alert("Failed to save member");
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    try {
      await deleteDoc(doc(db, 'execom', docId));
      fetchMembers();
    } catch (error) {
      console.error("Error deleting member:", error);
      alert("Failed to delete member");
    }
  };

  if (loading) return <div>Loading members...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Manage Execom</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div key={member.docId} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
            <img src={member.image || 'https://via.placeholder.com/150'} alt={member.name} className="w-16 h-16 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 truncate">{member.name}</h3>
              <p className="text-sm text-slate-500 truncate">{member.role}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleOpenModal(member)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(member.docId)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-slate-800">
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Short Role (Card)</label>
                  <input
                    type="text"
                    value={formData.role || ''}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Profile Role (Inner Page - Optional)</label>
                  <input
                    type="text"
                    value={formData.profileRole || ''}
                    onChange={(e) => setFormData({...formData, profileRole: e.target.value})}
                    placeholder="E.g., Chief Executive Officer"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image Link</label>
                  <input
                    type="url"
                    value={formData.image || ''}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={formData.socials?.linkedin || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      socials: { ...formData.socials, linkedin: e.target.value }
                    })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">GitHub URL</label>
                  <input
                    type="url"
                    value={formData.socials?.github || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      socials: { ...formData.socials, github: e.target.value }
                    })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Twitter URL</label>
                  <input
                    type="url"
                    value={formData.socials?.twitter || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      socials: { ...formData.socials, twitter: e.target.value }
                    })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Instagram URL</label>
                  <input
                    type="url"
                    value={formData.socials?.instagram || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      socials: { ...formData.socials, instagram: e.target.value }
                    })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecomAdmin;
