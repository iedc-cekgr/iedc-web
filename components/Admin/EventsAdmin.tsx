import React, { useState, useEffect } from 'react';
import { collection, collectionGroup, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Event, CustomField } from '../../types';
import { Edit, Trash2, Plus, X, Upload } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CLOUDINARY_CLOUD_NAME = 'dvntu7mui';
const CLOUDINARY_UPLOAD_PRESET = 'IEDCimages';

interface FirestoreEvent extends Event {
  docId: string;
}

const EventsAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'registrations'>('events');
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FirestoreEvent | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [regFilterEvent, setRegFilterEvent] = useState('all');

  // Form state
  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    date: '',
    description: '',
    guidelines: '',
    prizePool: '',
    image: '',
    type: '',
    mode: 'Offline',
    startDateTime: '',
    endDateTime: '',
    eventType: 'website-form',
    googleFormLink: '',
    registrationStartDateTime: '',
    registrationEndDateTime: '',
    isRegistrationEnabled: true,
    maxParticipants: undefined,
    currentParticipants: 0,
    paymentQrUrl: '',
    feeAmount: 0,
    customFields: [],
    enableReferralCode: false,
    whatsappLink: '',
    slug: ''
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsData = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      })) as FirestoreEvent[];
      // Sort by date or ID if needed, here just raw
      setEvents(eventsData.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    setLoadingRegs(true);
    try {
      // Fetch legacy flat registrations
      const oldQ = query(collection(db, 'event_registrations'));
      const oldSnapshot = await getDocs(oldQ);
      const oldRegs = oldSnapshot.docs.map(doc => ({ id: doc.id, refPath: `event_registrations/${doc.id}`, ...doc.data() }));

      // Fetch new subcollection registrations
      const newQ = query(collectionGroup(db, 'participants'));
      const newSnapshot = await getDocs(newQ);
      const newRegs = newSnapshot.docs.map(doc => ({ id: doc.id, refPath: doc.ref.path, ...doc.data() }));

      // Combine, filter out placeholder docs (which have no name), and sort by timestamp
      const allRegs = [...oldRegs, ...newRegs].filter((r: any) => r.name);
      allRegs.sort((a: any, b: any) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return timeB - timeA;
      });
      
      setRegistrations(allRegs);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
    setLoadingRegs(false);
  };

  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
  }, []);

  const handleOpenModal = (event?: FirestoreEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData(event);
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        date: '',
        description: '',
        guidelines: '',
        prizePool: '',
        image: '',
        type: '',
        mode: 'Offline',
        startDateTime: '',
        endDateTime: '',
        eventType: 'website-form',
        googleFormLink: '',
        registrationStartDateTime: '',
        registrationEndDateTime: '',
        isRegistrationEnabled: true,
        maxParticipants: undefined,
        currentParticipants: 0,
        paymentQrUrl: '',
        feeAmount: 0,
        customFields: [],
        enableReferralCode: false,
        whatsappLink: '',
        slug: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof Event) => {
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
      // Clean up undefined values
      const cleanData = JSON.parse(JSON.stringify(formData));
      
      if (editingEvent) {
        const eventRef = doc(db, 'events', editingEvent.docId);
        await updateDoc(eventRef, cleanData);
      } else {
        const newEvent = { ...cleanData, id: Date.now(), currentParticipants: 0 };
        await addDoc(collection(db, 'events'), newEvent);
      }
      handleCloseModal();
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event");
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Are you sure you want to delete this event AND all its registrations?")) return;
    try {
      await deleteDoc(doc(db, 'events', docId));
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const deleteRegistration = async (id: string, refPath?: string) => {
    if (!window.confirm("Are you sure you want to delete this registration?")) return;
    try {
      const pathToDelete = refPath || `event_registrations/${id}`;
      await deleteDoc(doc(db, pathToDelete));
      fetchRegistrations();
    } catch (error) {
      console.error("Error deleting registration:", error);
    }
  };

  // Custom Fields Builder
  const addCustomField = () => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false
    };
    setFormData(prev => ({ ...prev, customFields: [...(prev.customFields || []), newField] }));
  };

  const updateCustomField = (index: number, updates: Partial<CustomField>) => {
    const newFields = [...(formData.customFields || [])];
    newFields[index] = { ...newFields[index], ...updates };
    setFormData(prev => ({ ...prev, customFields: newFields }));
  };

  const removeCustomField = (index: number) => {
    const newFields = [...(formData.customFields || [])];
    newFields.splice(index, 1);
    setFormData(prev => ({ ...prev, customFields: newFields }));
  };

  const filteredRegs = registrations.filter(reg => 
    regFilterEvent === 'all' || reg.eventId === regFilterEvent
  );

  const exportCSV = () => {
    if (filteredRegs.length === 0) {
      alert("No data to export");
      return;
    }
    
    const fieldIdToLabel: Record<string, string> = {};
    events.forEach(ev => {
      ev.customFields?.forEach(cf => {
        fieldIdToLabel[cf.id] = cf.label;
      });
    });

    const customKeys = new Set<string>();
    filteredRegs.forEach(r => {
      if (r.customData) {
        Object.keys(r.customData).forEach(k => customKeys.add(k));
      }
    });
    
    const customKeyArray = Array.from(customKeys);
    const customHeaders = customKeyArray.map(key => fieldIdToLabel[key] || key);
    
    const hasPayments = filteredRegs.some(r => r.paymentScreenshotUrl);
    
    const headers = ["Event Title", "Name", "Email", "Phone", "Date", ...customHeaders];
    if (hasPayments) headers.push("Payment Screenshot");
    
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
    
    filteredRegs.forEach(r => {
      const dateStr = r.timestamp?.toDate ? r.timestamp.toDate().toLocaleString() : '';
      const formatField = (val: any) => {
        if (val === undefined || val === null) return '""';
        let strVal = String(val);
        if (/^[0-9]{8,20}$/.test(strVal)) return `"=""${strVal}"""`;
        return `"${strVal.replace(/"/g, '""')}"`;
      };

      const row = [
        formatField(r.eventTitle),
        formatField(r.name),
        formatField(r.email),
        formatField(r.phone),
        formatField(dateStr)
      ];
      
      customKeyArray.forEach(key => {
        let val = r.customData ? r.customData[key] : '';
        if (typeof val === 'boolean') val = val ? 'Yes' : 'No';
        if (Array.isArray(val)) val = val.join('; ');
        row.push(formatField(val));
      });
      
      if (hasPayments) {
        row.push(formatField(r.paymentScreenshotUrl || ''));
      }
      
      csvRows.push(row.join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event_registrations_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Manage Events</h2>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'events' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
        >
          Manage Events
        </button>
        <button
          onClick={() => setActiveTab('registrations')}
          className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'registrations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
        >
          Site Registrations
        </button>
      </div>

      {activeTab === 'events' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add New Event
            </button>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Event</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Reg. Type</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Stats</th>
                  <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.docId} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-950 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={event.image || 'https://via.placeholder.com/150'} alt={event.title} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{event.title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">{event.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${event.eventType === 'website-form' ? 'bg-indigo-100 text-indigo-700' : event.eventType === 'google-form' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                        {event.eventType ? event.eventType.replace('-', ' ') : 'Legacy / External'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {event.eventType === 'website-form' ? (() => {
                        const eventRegs = registrations.filter(r => String(r.eventId) === String(event.id));
                        const uniqueUsers = new Set(eventRegs.map(r => (r.email || r.phone || '').toLowerCase().trim()));
                        const duplicates = eventRegs.length - uniqueUsers.size;
                        return (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Total: {eventRegs.length}
                            </span>
                            {duplicates > 0 && (
                              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                {duplicates} Duplicate{duplicates !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        );
                      })() : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenModal(event)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(event.docId)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'registrations' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="w-full md:w-1/3">
              <select 
                value={regFilterEvent}
                onChange={(e) => setRegFilterEvent(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Events</option>
                {events.filter(e => e.eventType === 'website-form').map(e => (
                  <option key={e.id} value={String(e.id)}>{e.title}</option>
                ))}
              </select>
            </div>
            <button onClick={exportCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              Export Spreadsheet
            </button>
          </div>
          
          <div className="mb-4 flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex-1">
              <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                Total Registrations: {filteredRegs.length}
              </span>
            </div>
            <div>
              {(() => {
                const uniqueUsers = new Set(filteredRegs.map(r => (r.email || r.phone || '').toLowerCase().trim()));
                const duplicates = filteredRegs.length - uniqueUsers.size;
                return duplicates > 0 ? (
                  <span className="text-sm text-amber-600 dark:text-amber-500 font-semibold">
                    Potential Duplicates: {duplicates}
                  </span>
                ) : (
                  <span className="text-sm text-green-600 dark:text-green-500 font-semibold">
                    No Duplicates
                  </span>
                );
              })()}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-700">
                  <th className="p-3 font-semibold text-sm">Event</th>
                  <th className="p-3 font-semibold text-sm">Name</th>
                  <th className="p-3 font-semibold text-sm">Contact</th>
                  <th className="p-3 font-semibold text-sm">Date</th>
                  <th className="p-3 font-semibold text-sm">Documents</th>
                  <th className="p-3 font-semibold text-sm text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegs.map(reg => (
                  <tr key={reg.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-3 text-sm">{reg.eventTitle}</td>
                    <td className="p-3 text-sm font-medium">{reg.name}</td>
                    <td className="p-3 text-sm">
                      <div className="text-slate-600">{reg.email}</div>
                      <div className="text-slate-500 text-xs">{reg.phone}</div>
                    </td>
                    <td className="p-3 text-sm text-slate-500">
                      {reg.timestamp?.toDate ? reg.timestamp.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3 text-sm">
                      {reg.paymentScreenshotUrl && (
                        <a href={reg.paymentScreenshotUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-xs mb-1 font-medium bg-blue-50 w-fit px-2 py-1 rounded">
                          <Upload className="w-3 h-3" /> Payment Proof
                        </a>
                      )}
                      {reg.customData && Object.entries(reg.customData).map(([key, value]) => {
                        if (typeof value === 'string' && value.startsWith('http')) {
                          return (
                            <a key={key} href={value} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 text-xs mb-1 font-medium bg-indigo-50 w-fit px-2 py-1 rounded">
                              <Upload className="w-3 h-3" /> Custom File
                            </a>
                          )
                        }
                        return null;
                      })}
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => deleteRegistration(reg.id, reg.refPath)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRegs.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No registrations found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-start justify-center p-4 z-50 overflow-y-auto pt-10 pb-10">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl my-auto flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0 bg-white dark:bg-slate-900 z-10 rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              {/* Event Type Selection */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Registration Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="eventType" value="google-form" checked={formData.eventType === 'google-form'} onChange={(e) => setFormData({...formData, eventType: e.target.value as any})} className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-slate-700">Google Form</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="eventType" value="website-form" checked={formData.eventType === 'website-form'} onChange={(e) => setFormData({...formData, eventType: e.target.value as any})} className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-slate-700">Website Registration (Built-in)</span>
                  </label>
                </div>
              </div>

              {/* Basic Details */}
              <div>
                <h4 className="text-lg font-bold mb-4 text-slate-700 border-l-4 border-blue-500 pl-2">Basic Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input type="text" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date String (Display)</label>
                    <input type="text" value={formData.date || ''} onChange={(e) => setFormData({...formData, date: e.target.value})} placeholder="e.g. 22 Jun 2025" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Event Type Label</label>
                    <input type="text" value={formData.type || ''} onChange={(e) => setFormData({...formData, type: e.target.value})} placeholder="e.g. Workshop" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mode</label>
                    <select value={formData.mode || 'Offline'} onChange={(e) => setFormData({...formData, mode: e.target.value as any})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                      <option value="Offline">Offline</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Event Start & End (Actual Event Time)</label>
                    <div className="flex flex-wrap gap-2">
                      <input type="date" value={(formData.startDateTime || '').split('T')[0] || ''} onChange={(e) => {
                        const time = (formData.startDateTime || '').split('T')[1] || '00:00';
                        setFormData({...formData, startDateTime: e.target.value ? `${e.target.value}T${time}` : ''});
                      }} className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                      <input type="time" value={(formData.startDateTime || '').split('T')[1] || ''} onChange={(e) => {
                        const date = (formData.startDateTime || '').split('T')[0] || new Date().toISOString().split('T')[0];
                        setFormData({...formData, startDateTime: e.target.value ? `${date}T${e.target.value}` : ''});
                      }} className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                      <span className="self-center">to</span>
                      <input type="date" value={(formData.endDateTime || '').split('T')[0] || ''} onChange={(e) => {
                        const time = (formData.endDateTime || '').split('T')[1] || '00:00';
                        setFormData({...formData, endDateTime: e.target.value ? `${e.target.value}T${time}` : ''});
                      }} className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                      <input type="time" value={(formData.endDateTime || '').split('T')[1] || ''} onChange={(e) => {
                        const date = (formData.endDateTime || '').split('T')[0] || new Date().toISOString().split('T')[0];
                        setFormData({...formData, endDateTime: e.target.value ? `${date}T${e.target.value}` : ''});
                      }} className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Poster Image URL</label>
                    <div className="flex gap-2">
                      <input type="url" value={formData.image || ''} onChange={(e) => setFormData({...formData, image: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                      <div className="relative shrink-0">
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingField === 'image'} />
                        <button type="button" className="flex items-center gap-2 bg-slate-100 border border-slate-300 px-4 py-2 rounded-lg font-medium">
                          {uploadingField === 'image' ? 'Uploading...' : 'Upload'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} required></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Guidelines / Rules (Optional)</label>
                    <textarea value={formData.guidelines || ''} onChange={(e) => setFormData({...formData, guidelines: e.target.value})} placeholder="Enter any specific rules or guidelines for this event..." className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={3}></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prize Pool / Rewards (Optional)</label>
                    <input type="text" value={formData.prizePool || ''} onChange={(e) => setFormData({...formData, prizePool: e.target.value})} placeholder="e.g. ₹10K Prize Pool or Goodies Worth ₹5000" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Registration Settings based on Type */}
              <div className={`p-4 rounded-xl border ${formData.eventType === 'google-form' ? 'bg-green-50 border-green-200' : 'bg-indigo-50 border-indigo-200'}`}>
                <h4 className={`text-lg font-bold mb-4 border-l-4 pl-2 ${formData.eventType === 'google-form' ? 'text-green-800 border-green-500' : 'text-indigo-800 border-indigo-500'}`}>
                  {formData.eventType === 'google-form' ? 'Google Form Settings' : 'Website Registration Settings'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Common Start/End for Registrations */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Registration Opens</label>
                    <input type="datetime-local" value={formData.registrationStartDateTime || ''} onChange={(e) => setFormData({...formData, registrationStartDateTime: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Registration Closes</label>
                    <input type="datetime-local" value={formData.registrationEndDateTime || ''} onChange={(e) => setFormData({...formData, registrationEndDateTime: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg" />
                  </div>

                  {formData.eventType === 'google-form' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Google Form URL *</label>
                      <input type="url" value={formData.googleFormLink || ''} onChange={(e) => setFormData({...formData, googleFormLink: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg" required={formData.eventType === 'google-form'} />
                    </div>
                  )}

                  {formData.eventType === 'website-form' && (
                    <>
                      <div className="md:col-span-2 mt-2">
                        <label className="block text-sm font-medium text-slate-700">Custom Registration Route (Optional)</label>
                        <div className="flex items-center">
                          <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-slate-500 text-sm">/register/</span>
                          <input type="text" value={formData.slug || ''} onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})} className="flex-1 p-2 bg-white border border-slate-200 rounded-r-lg outline-none focus:border-indigo-500" placeholder="e.g. hackathon-2026" />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Leave blank to auto-generate from the event title.</p>
                      </div>

                      <div className="flex items-center space-x-2 md:col-span-2 bg-white p-3 rounded-lg border border-slate-200">
                        <input type="checkbox" checked={formData.isRegistrationEnabled ?? true} onChange={(e) => setFormData({...formData, isRegistrationEnabled: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
                        <span className="font-bold text-slate-700">Enable Form Now (Master Switch)</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 md:col-span-2 bg-white p-3 rounded-lg border border-slate-200">
                        <input type="checkbox" checked={formData.enableReferralCode || false} onChange={(e) => setFormData({...formData, enableReferralCode: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
                        <span className="font-bold text-slate-700">Enable Referral Code Field</span>
                      </div>
                      
                      <div className="md:col-span-2 mt-2">
                        <label className="block text-sm font-medium text-slate-700">WhatsApp Group Link (Optional)</label>
                        <input type="url" value={formData.whatsappLink || ''} onChange={(e) => setFormData({...formData, whatsappLink: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" placeholder="https://chat.whatsapp.com/..." />
                        <p className="text-xs text-slate-500 mt-1">If provided, participants will see a 'Join WhatsApp Group' button after successful registration.</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Max Participants (Optional)</label>
                        <input type="number" value={formData.maxParticipants || ''} onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value) || undefined})} className="w-full p-2 border border-slate-300 rounded-lg" placeholder="Leave blank for unlimited" />
                        {editingEvent && (
                          <p className="text-xs text-slate-500 mt-1">Currently registered: {formData.currentParticipants || 0}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Registration Fee (₹)</label>
                        <input type="number" value={formData.feeAmount || 0} onChange={(e) => setFormData({...formData, feeAmount: parseFloat(e.target.value) || 0})} className="w-full p-2 border border-slate-300 rounded-lg" min="0" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Payment QR Code Image (Required if fee &gt; 0)</label>
                        <div className="flex gap-2">
                          <input type="url" value={formData.paymentQrUrl || ''} onChange={(e) => setFormData({...formData, paymentQrUrl: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg" />
                          <div className="relative shrink-0">
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'paymentQrUrl')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingField === 'paymentQrUrl'} />
                            <button type="button" className="flex items-center gap-2 bg-slate-100 border border-slate-300 px-4 py-2 rounded-lg font-medium">
                              {uploadingField === 'paymentQrUrl' ? 'Uploading...' : 'Upload'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Custom Fields Builder for Website Form */}
              {formData.eventType === 'website-form' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-slate-700 border-l-4 border-pink-500 pl-2">Custom Form Fields</h4>
                    <button type="button" onClick={addCustomField} className="text-sm bg-pink-100 text-pink-700 hover:bg-pink-200 px-3 py-1 rounded-md font-medium flex items-center gap-1">
                      <Plus className="w-4 h-4" /> Add Field
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(!formData.customFields || formData.customFields.length === 0) && (
                      <p className="text-sm text-slate-500 italic">No custom fields added. Default fields (Name, Email, Phone) are always collected.</p>
                    )}
                    {formData.customFields?.map((field, idx) => (
                      <div key={field.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="w-full md:w-1/3">
                          <label className="text-xs font-bold text-slate-500 uppercase">Field Label / Question</label>
                          <input type="text" value={field.label} onChange={(e) => updateCustomField(idx, { label: e.target.value })} className="w-full mt-1 p-2 border border-slate-300 rounded focus:ring-1 focus:ring-pink-500" required />
                        </div>
                        <div className="w-full md:w-1/4">
                          <label className="text-xs font-bold text-slate-500 uppercase">Input Type</label>
                          <select value={field.type} onChange={(e) => updateCustomField(idx, { type: e.target.value as any })} className="w-full mt-1 p-2 border border-slate-300 rounded focus:ring-1 focus:ring-pink-500">
                            <option value="text">Short Text</option>
                            <option value="textarea">Long Text</option>
                            <option value="dropdown">Dropdown</option>
                            <option value="checkbox">Multiple Checkboxes</option>
                            <option value="radio">Radio Buttons</option>
                            <option value="file">File Upload</option>
                          </select>
                        </div>
                        <div className="w-full md:w-1/4 flex items-center h-full pt-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={field.required} onChange={(e) => updateCustomField(idx, { required: e.target.checked })} className="w-4 h-4 text-pink-600 rounded" />
                            <span className="text-sm font-medium text-slate-700">Required</span>
                          </label>
                        </div>
                        <div className="pt-6 shrink-0">
                          <button type="button" onClick={() => removeCustomField(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {/* Options for select/radio/checkbox */}
                        {['dropdown', 'checkbox', 'radio'].includes(field.type) && (
                          <div className="w-full mt-2 md:mt-0 p-3 bg-white border border-slate-200 rounded">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Options (One per line)</label>
                            <textarea value={field.options?.join('\n') || ''} onChange={(e) => updateCustomField(idx, { options: e.target.value.split('\n') })} placeholder="1st Year&#10;2nd Year&#10;3rd Year" className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-pink-500" rows={3} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white p-4 -mx-6 -mb-6 rounded-b-2xl">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md">
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsAdmin;
