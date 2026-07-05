import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ExecomMember } from '../../types';
import { Edit, Trash2, Plus, X, Upload } from 'lucide-react';

const CLOUDINARY_CLOUD_NAME = 'dvntu7mui';
const CLOUDINARY_UPLOAD_PRESET = 'IEDCimages';

interface FirestoreMember extends ExecomMember {
  docId: string;
}

const ExecomAdmin: React.FC = () => {
  const [members, setMembers] = useState<FirestoreMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FirestoreMember | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ExecomMember>>({
    name: '',
    role: '',
    image: '',
    order: 0,
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
      
      membersData.sort((a, b) => (a.order ?? a.id ?? 0) - (b.order ?? b.id ?? 0));
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
        order: 0,
        socials: { linkedin: '', twitter: '', github: '', instagram: '' }
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof ExecomMember) => {
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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Manage Execom</h2>
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
          <div key={member.docId} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
            <img src={member.image || 'https://via.placeholder.com/150'} alt={member.name} className="w-16 h-16 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{member.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{member.role}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleOpenModal(member)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-950 rounded-lg">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(member.docId)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 dark:bg-slate-950 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Display Order (Lower number comes first)</label>
                  <input
                    type="number"
                    value={formData.order ?? 0}
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
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
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.image || ''}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Upload Image" disabled={uploadingField === 'image'} />
                      <button type="button" className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:bg-slate-800 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium whitespace-nowrap" disabled={uploadingField === 'image'}>
                        {uploadingField === 'image' ? <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-slate-700 animate-spin"></div> : <Upload className="w-4 h-4" />}
                        {uploadingField === 'image' ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>
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
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-900 rounded-lg">
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
