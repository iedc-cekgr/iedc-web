import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, Trash2, FileSpreadsheet, Mail, Phone, Calendar, Settings, Users, Plus, Save, X } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FirestoreFresher {
  docId: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  timestamp: any;
  [key: string]: any; // Allow for dynamic fields
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'select';
  options: string; // comma separated for select
  required: boolean;
}

export interface FreshersSettings {
  whatsappLink: string;
  customFields: CustomField[];
}

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

const FreshersAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'registrations' | 'settings'>('registrations');
  
  // Data state
  const [freshers, setFreshers] = useState<FirestoreFresher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  // Settings state
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settings, setSettings] = useState<FreshersSettings>({
    whatsappLink: '',
    customFields: []
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFreshers();
    fetchSettings();
  }, []);

  const fetchFreshers = async () => {
    try {
      const ref = collection(db, 'first_year_registrations');
      const q = query(ref, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      })) as FirestoreFresher[];
      setFreshers(data);
    } catch (error) {
      console.error("Error fetching fresher registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'config', 'freshers_settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data() as FreshersSettings);
      } else {
        // Initialize if not exists
        await setDoc(docRef, settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'config', 'freshers_settings');
      await setDoc(docRef, settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCustomField = () => {
    setSettings({
      ...settings,
      customFields: [
        ...settings.customFields,
        { id: `field_${Date.now()}`, label: 'New Field', type: 'text', options: '', required: false }
      ]
    });
  };

  const handleUpdateCustomField = (index: number, key: keyof CustomField, value: any) => {
    const updatedFields = [...settings.customFields];
    updatedFields[index] = { ...updatedFields[index], [key]: value };
    setSettings({ ...settings, customFields: updatedFields });
  };

  const handleRemoveCustomField = (index: number) => {
    if (!window.confirm("Remove this custom field? Existing data in registrations will not be deleted, but the field will no longer appear on the form.")) return;
    const updatedFields = settings.customFields.filter((_, i) => i !== index);
    setSettings({ ...settings, customFields: updatedFields });
  };

  const handleDelete = async (docId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete registration for "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'first_year_registrations', docId));
      setFreshers(prev => prev.filter(f => f.docId !== docId));
    } catch (error) {
      console.error("Error deleting registration:", error);
      alert("Failed to delete the registration.");
    }
  };

  const handleExportExcel = () => {
    if (freshers.length === 0) {
      alert("No registrations to export!");
      return;
    }

    const dataToExport = freshers.map(f => {
      // Base fields
      const row: any = {
        'Full Name': f.name || 'N/A',
        'Email Address': f.email || 'N/A',
        'Phone Number': f.phone || 'N/A',
        'Branch': f.branch || 'N/A',
        'Registered On': formatTimestampDate(f.timestamp)
      };

      // Add dynamic fields
      settings.customFields.forEach(field => {
        row[field.label] = f[field.id] || 'N/A';
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Freshers Registrations');
    XLSX.writeFile(workbook, `IEDC_Freshers_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredFreshers = freshers.filter(f => {
    const name = f.name || '';
    const email = f.email || '';
    const branch = f.branch || '';

    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = branchFilter === '' || branch === branchFilter;

    return matchesSearch && matchesBranch;
  });

  const branches = Array.from(new Set(freshers.map(f => f.branch).filter(Boolean)));

  if (loading || settingsLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        Loading module...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase text-slate-800 dark:text-slate-200">Freshers Hub</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold">Manage first-year registrations and form settings.</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`px-4 py-2 font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'registrations' ? 'bg-black dark:bg-white text-white dark:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
          >
            <Users className="w-4 h-4" />
            Registrations
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'settings' ? 'bg-black dark:bg-white text-white dark:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {activeTab === 'registrations' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-end">
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
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>

            <div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              >
                <option value="">All Branches</option>
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end font-bold text-sm text-slate-500 pr-2">
              Showing {filteredFreshers.length} of {freshers.length} registrations
            </div>
          </div>

          {/* List */}
          {filteredFreshers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500">
              No registrations found matching your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredFreshers.map((fresher) => (
                <div 
                  key={fresher.docId}
                  className="bg-white dark:bg-slate-900 border-[3px] border-black dark:border-slate-800 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 font-extrabold text-xs uppercase border-[2px] border-black dark:border-blue-700 rounded-full">
                        {fresher.branch}
                      </span>
                      <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatTimestampDate(fresher.timestamp)}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                      {fresher.name}
                    </h3>

                    <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-slate-600 dark:text-slate-400 font-bold">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{fresher.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{fresher.phone}</span>
                      </div>
                      
                      {/* Render Custom Fields Data if present */}
                      {settings.customFields.map(field => {
                        if (!fresher[field.id]) return null;
                        return (
                          <div key={field.id} className="flex items-center gap-2">
                            <span className="uppercase text-[10px] bg-slate-200 dark:bg-slate-800 px-1 rounded">{field.label}:</span>
                            <span>{fresher[field.id]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800 justify-end">
                    <button
                      onClick={() => handleDelete(fresher.docId, fresher.name)}
                      className="p-2 border-[2px] border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 transition-all"
                      title="Delete Registration"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
          
          {/* Post-Submit Action */}
          <div className="bg-white dark:bg-slate-900 border-[3px] border-black dark:border-slate-800 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black uppercase text-slate-800 dark:text-slate-200 mb-4 border-b-2 border-slate-200 dark:border-slate-700 pb-2">
              Post-Submit Actions
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">WhatsApp Community Group Link</label>
                <input
                  type="text"
                  value={settings.whatsappLink}
                  onChange={(e) => setSettings({ ...settings, whatsappLink: e.target.value })}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full border-2 border-slate-300 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1 font-bold">This link will be shown to users immediately after they successfully register.</p>
              </div>
            </div>
          </div>

          {/* Dynamic Form Builder */}
          <div className="bg-white dark:bg-slate-900 border-[3px] border-black dark:border-slate-800 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-700 pb-2 mb-6">
              <h3 className="text-xl font-black uppercase text-slate-800 dark:text-slate-200">
                Dynamic Form Fields
              </h3>
              <button
                onClick={handleAddCustomField}
                className="bg-black dark:bg-white text-white dark:text-black font-bold px-3 py-1.5 rounded flex items-center gap-1 text-sm shadow-[2px_2px_0px_0px_rgba(100,100,100,0.5)]"
              >
                <Plus className="w-4 h-4" /> Add Field
              </button>
            </div>
            
            <p className="text-sm font-bold text-slate-500 mb-6">These fields will appear on the Welcome page form in addition to Name, Email, Phone, and Branch.</p>

            <div className="space-y-6">
              {settings.customFields.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 font-bold">
                  No custom fields configured. Click "Add Field" to create one.
                </div>
              ) : (
                settings.customFields.map((field, index) => (
                  <div key={field.id} className="relative bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 shadow-sm">
                    <button
                      onClick={() => handleRemoveCustomField(index)}
                      className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full border-2 border-black hover:scale-110 transition-transform"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Field Label (Question)</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleUpdateCustomField(index, 'label', e.target.value)}
                          className="w-full border-2 border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Input Type</label>
                        <select
                          value={field.type}
                          onChange={(e) => handleUpdateCustomField(index, 'type', e.target.value)}
                          className="w-full border-2 border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-blue-500"
                        >
                          <option value="text">Short Text Answer</option>
                          <option value="select">Dropdown Select</option>
                        </select>
                      </div>

                      {field.type === 'select' && (
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Dropdown Options (Comma separated)</label>
                          <input
                            type="text"
                            value={field.options}
                            onChange={(e) => handleUpdateCustomField(index, 'options', e.target.value)}
                            placeholder="e.g. Hosteller, Day Scholar"
                            className="w-full border-2 border-slate-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}

                      <div className="md:col-span-2 flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id={`req_${field.id}`}
                          checked={field.required}
                          onChange={(e) => handleUpdateCustomField(index, 'required', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor={`req_${field.id}`} className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                          Make this field mandatory (required)
                        </label>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black uppercase tracking-wider px-8 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {isSaving ? (
                   <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Save All Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreshersAdmin;
