import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Promoter } from '../../types';
import { ToggleLeft, ToggleRight, Trash2, Plus, Download, Save, Check, RefreshCw, Calendar, Edit3, Search, Minus, X } from 'lucide-react';
import RethinkModal from './RethinkModal';

const LeaderboardAdmin: React.FC = () => {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isVisible, setIsVisible] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const [gformValues, setGformValues] = useState<Record<string, number>>({});
  const [savingGformId, setSavingGformId] = useState<string | null>(null);

  const [eventStats, setEventStats] = useState<Record<string, { site: number, gform: number }>>({});

  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; type: 'promoter' | 'reset'; name?: string } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Edit Promoter Modal State
  const [editingPromoter, setEditingPromoter] = useState<Promoter | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSiteReferrals, setEditSiteReferrals] = useState(0);
  const [editGformReferrals, setEditGformReferrals] = useState(0);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchEvents();
  }, []);

  // Fetch promoters and their event-specific stats whenever selection changes
  useEffect(() => {
    fetchPromotersAndStats();
  }, [selectedEventId]);

  const fetchSettings = async () => {
    try {
      const settingsDocRef = doc(db, 'config', 'leaderboard_settings');
      const settingsSnap = await getDoc(settingsDocRef);
      if (settingsSnap.exists()) {
        setIsVisible(settingsSnap.data().isVisible || false);
      } else {
        await setDoc(settingsDocRef, { isVisible: false });
        setIsVisible(false);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ docId: doc.id, ...doc.data() });
      });
      // Sort events by date if available
      list.sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
      setEvents(list);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  const fetchPromotersAndStats = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch all promoters
      const promotersSnap = await getDocs(collection(db, 'promoters'));
      const list: Promoter[] = [];
      promotersSnap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() as Omit<Promoter, 'id'> });
      });

      const gformMap: Record<string, number> = {};
      const statsMap: Record<string, { site: number, gform: number }> = {};

      // 2. If a specific event is selected, fetch event referrals
      if (selectedEventId) {
        const referralsRef = collection(db, 'event_referrals');
        const q = query(referralsRef, where('eventId', '==', selectedEventId));
        const referralsSnap = await getDocs(q);
        
        referralsSnap.forEach((doc) => {
          const data = doc.data();
          statsMap[data.promoterId] = {
            site: data.siteReferrals || 0,
            gform: data.gformReferrals || 0
          };
        });

        // Set inputs to show event-specific counts
        list.forEach(p => {
          const stats = statsMap[p.id!] || { site: 0, gform: 0 };
          gformMap[p.id!] = stats.gform;
        });

        setEventStats(statsMap);
      } else {
        // "All Events" mode: Show global stats from main promoter doc
        list.forEach(p => {
          gformMap[p.id!] = p.gformReferrals || 0;
        });
      }

      // Sort by totals depending on mode
      list.sort((a, b) => {
        if (selectedEventId) {
          const aTotal = (statsMap[a.id!]?.site || 0) + (statsMap[a.id!]?.gform || 0);
          const bTotal = (statsMap[b.id!]?.site || 0) + (statsMap[b.id!]?.gform || 0);
          return bTotal - aTotal;
        }
        return b.totalReferrals - a.totalReferrals;
      });

      setPromoters(list);
      setGformValues(gformMap);
    } catch (err: any) {
      console.error("Error fetching promoters database:", err);
      setError("Failed to sync promoters and event stats.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    setSettingsLoading(true);
    try {
      const settingsDocRef = doc(db, 'config', 'leaderboard_settings');
      const nextVal = !isVisible;
      await updateDoc(settingsDocRef, { isVisible: nextVal });
      setIsVisible(nextVal);
    } catch (err) {
      console.error("Error updating settings:", err);
      alert("Failed to toggle leaderboard visibility.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (val.trim()) {
      const firstName = val.trim().split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
      const randomDigits = Math.floor(100 + Math.random() * 900);
      setCode(`REF-${firstName}-${randomDigits}`);
    } else {
      setCode('');
    }
  };

  const handleAddPromoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setAddLoading(true);
    setError('');

    const uppercaseCode = code.trim().toUpperCase();

    try {
      const promotersRef = collection(db, 'promoters');
      const q = query(promotersRef, where('code', '==', uppercaseCode));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error(`Referral code "${uppercaseCode}" is already taken. Please choose or generate another.`);
      }

      const newPromoter: Omit<Promoter, 'id'> = {
        name: name.trim(),
        code: uppercaseCode,
        siteReferrals: 0,
        gformReferrals: 0,
        totalReferrals: 0,
        isActive: true,
        createdAt: new Date()
      };

      await addDoc(promotersRef, newPromoter);
      setName('');
      setCode('');
      fetchPromotersAndStats();
    } catch (err: any) {
      setError(err.message || "Failed to add promoter.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const docRef = doc(db, 'promoters', id);
      await updateDoc(docRef, { isActive: !currentStatus });
      setPromoters(prev => prev.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p));
    } catch (err) {
      console.error("Error toggling active state:", err);
      alert("Failed to update status.");
    }
  };

  // Recalculates and updates the global sum in `promoters` collection for a campaigner
  const updateGlobalReferrals = async (promoterId: string) => {
    try {
      const q = query(collection(db, 'event_referrals'), where('promoterId', '==', promoterId));
      const querySnap = await getDocs(q);
      let sumSite = 0;
      let sumGForm = 0;
      querySnap.forEach((doc) => {
        const data = doc.data();
        sumSite += (data.siteReferrals || 0);
        sumGForm += (data.gformReferrals || 0);
      });
      
      await updateDoc(doc(db, 'promoters', promoterId), {
        siteReferrals: sumSite,
        gformReferrals: sumGForm,
        totalReferrals: sumSite + sumGForm
      });
    } catch (err) {
      console.error("Error recalculating global stats:", err);
    }
  };

  const handleUpdateGFormReferrals = async (id: string, promoter: Promoter) => {
    if (!selectedEventId) {
      alert("To update referrals, please select a specific event from the dropdown at the top first.");
      return;
    }

    const val = gformValues[id];
    if (val === undefined || val < 0) return;

    setSavingGformId(id);
    try {
      const eventReferralRef = doc(db, 'event_referrals', `${selectedEventId}_${id}`);
      const snap = await getDoc(eventReferralRef);
      
      const selectedEvent = events.find(e => e.docId === selectedEventId);
      const eventTitle = selectedEvent?.title || 'Unknown Event';

      let siteRef = 0;
      if (snap.exists()) {
        siteRef = snap.data().siteReferrals || 0;
        await updateDoc(eventReferralRef, {
          gformReferrals: val,
          totalReferrals: siteRef + val,
          lastUpdated: new Date()
        });
      } else {
        await setDoc(eventReferralRef, {
          eventId: selectedEventId,
          eventTitle: eventTitle,
          promoterId: id,
          promoterName: promoter.name,
          promoterCode: promoter.code,
          siteReferrals: 0,
          gformReferrals: val,
          totalReferrals: val,
          lastUpdated: new Date()
        });
      }

      // 2. Recalculate and write global total count
      await updateGlobalReferrals(id);
      
      // 3. Reload state
      await fetchPromotersAndStats();
      
      setSavingGformId(null);
    } catch (err) {
      console.error("Error updating event referrals:", err);
      alert("Failed to update event referrals.");
      setSavingGformId(null);
    }
  };

  // Promoter Editing Modal Logic
  const handleOpenEditModal = (promoter: Promoter) => {
    setEditingPromoter(promoter);
    setEditName(promoter.name);
    setEditCode(promoter.code);
    setEditIsActive(promoter.isActive);
    setEditSiteReferrals(selectedEventId ? (eventStats[promoter.id!]?.site || 0) : (promoter.siteReferrals || 0));
    setEditGformReferrals(selectedEventId ? (eventStats[promoter.id!]?.gform || 0) : (promoter.gformReferrals || 0));
    setEditError('');
  };

  const handleSaveEditedPromoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromoter || !editingPromoter.id) return;
    if (!editName.trim() || !editCode.trim()) {
      setEditError('Name and Referral Code are required.');
      return;
    }

    setEditLoading(true);
    setEditError('');
    const uppercaseCode = editCode.trim().toUpperCase();

    try {
      // Check code uniqueness if code changed
      if (uppercaseCode !== editingPromoter.code) {
        const promotersRef = collection(db, 'promoters');
        const q = query(promotersRef, where('code', '==', uppercaseCode));
        const snap = await getDocs(q);
        const duplicate = snap.docs.find(d => d.id !== editingPromoter.id);
        if (duplicate) {
          throw new Error(`Referral code "${uppercaseCode}" is already taken by another promoter.`);
        }
      }

      // Update main promoter document
      const promoterDocRef = doc(db, 'promoters', editingPromoter.id);
      
      if (selectedEventId) {
        // Event-specific edit
        const eventReferralRef = doc(db, 'event_referrals', `${selectedEventId}_${editingPromoter.id}`);
        const snap = await getDoc(eventReferralRef);
        const selectedEvent = events.find(e => e.docId === selectedEventId);
        const eventTitle = selectedEvent?.title || 'Unknown Event';
        const totalRef = editSiteReferrals + editGformReferrals;

        if (snap.exists()) {
          await updateDoc(eventReferralRef, {
            promoterName: editName.trim(),
            promoterCode: uppercaseCode,
            siteReferrals: editSiteReferrals,
            gformReferrals: editGformReferrals,
            totalReferrals: totalRef,
            lastUpdated: new Date()
          });
        } else {
          await setDoc(eventReferralRef, {
            eventId: selectedEventId,
            eventTitle: eventTitle,
            promoterId: editingPromoter.id,
            promoterName: editName.trim(),
            promoterCode: uppercaseCode,
            siteReferrals: editSiteReferrals,
            gformReferrals: editGformReferrals,
            totalReferrals: totalRef,
            lastUpdated: new Date()
          });
        }
        await updateGlobalReferrals(editingPromoter.id);
      } else {
        // Global edit
        const totalRef = editSiteReferrals + editGformReferrals;
        await updateDoc(promoterDocRef, {
          siteReferrals: editSiteReferrals,
          gformReferrals: editGformReferrals,
          totalReferrals: totalRef
        });
      }

      // Update main info (Name, Code, Status)
      await updateDoc(promoterDocRef, {
        name: editName.trim(),
        code: uppercaseCode,
        isActive: editIsActive
      });

      setEditingPromoter(null);
      await fetchPromotersAndStats();
    } catch (err: any) {
      console.error("Error saving promoter:", err);
      setEditError(err.message || 'Failed to update promoter details.');
    } finally {
      setEditLoading(false);
    }
  };

  const confirmAction = async () => {
    if (!deleteTarget) return;
    setIsActionLoading(true);
    try {
      if (deleteTarget.type === 'promoter' && deleteTarget.id) {
        await deleteDoc(doc(db, 'promoters', deleteTarget.id));
        const querySnapshot = await getDocs(query(collection(db, 'event_referrals'), where('promoterId', '==', deleteTarget.id)));
        const deletePromises = querySnapshot.docs.map(document => deleteDoc(doc(db, 'event_referrals', document.id)));
        await Promise.all(deletePromises);
        await fetchPromotersAndStats();
      } else if (deleteTarget.type === 'reset') {
        if (selectedEventId) {
          const q = query(collection(db, 'event_referrals'), where('eventId', '==', selectedEventId));
          const querySnap = await getDocs(q);
          const deletePromises = querySnap.docs.map(docSnapshot => deleteDoc(doc(db, 'event_referrals', docSnapshot.id)));
          await Promise.all(deletePromises);

          const promotersSnap = await getDocs(collection(db, 'promoters'));
          const updatePromises = promotersSnap.docs.map(async (pDoc) => {
            await updateGlobalReferrals(pDoc.id);
          });
          await Promise.all(updatePromises);
        } else {
          const referralsSnap = await getDocs(collection(db, 'event_referrals'));
          const deletePromises = referralsSnap.docs.map(docSnapshot => deleteDoc(doc(db, 'event_referrals', docSnapshot.id)));
          await Promise.all(deletePromises);

          const promotersSnap = await getDocs(collection(db, 'promoters'));
          const updatePromises = promotersSnap.docs.map(async (pDoc) => {
            await updateDoc(doc(db, 'promoters', pDoc.id), {
              siteReferrals: 0,
              gformReferrals: 0,
              totalReferrals: 0
            });
          });
          await Promise.all(updatePromises);
        }
        await fetchPromotersAndStats();
      }
    } catch (err) {
      console.error("Error executing action:", err);
      alert("Failed to complete action.");
    } finally {
      setIsActionLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleExportCSV = () => {
    if (promoters.length === 0) return;
    
    const eventLabel = selectedEventId 
      ? events.find(e => e.docId === selectedEventId)?.title || 'Event' 
      : 'All Events Combined';
      
    const headers = ['Name', 'Referral Code', 'Site Referrals', 'Google Form Referrals', 'Total Referrals', 'Active'];
    const rows = promoters.map(p => {
      const site = selectedEventId ? (eventStats[p.id!]?.site || 0) : (p.siteReferrals || 0);
      const gform = selectedEventId ? (eventStats[p.id!]?.gform || 0) : (p.gformReferrals || 0);
      const total = site + gform;
      
      return [
        p.name,
        p.code,
        site,
        gform,
        total,
        p.isActive ? 'Yes' : 'No'
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + `Event: ${eventLabel}\n`
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `iedc_leaderboard_export_${selectedEventId ? 'event' : 'global'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPromoters = promoters.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Header section with visibility toggle */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-[3px] sm:border-[4px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-black dark:text-white tracking-tight">Leaderboard Control Panel</h2>
          <p className="text-xs sm:text-sm font-bold uppercase text-slate-500 mt-1">Manage event promoters, referral codes, and public visibility settings.</p>
        </div>
        <button
          onClick={handleToggleVisibility}
          disabled={settingsLoading}
          className={`w-full sm:w-auto flex items-center justify-center gap-3 px-5 py-3 border-[3px] sm:border-[4px] border-black dark:border-white font-black text-xs sm:text-sm uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all text-white ${
            isVisible ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {settingsLoading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : isVisible ? (
            <>
              <ToggleRight className="w-5 h-5 sm:w-6 sm:h-6" />
              Public Leaderboard: ENABLED
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              Public Leaderboard: DISABLED
            </>
          )}
        </button>
      </div>

      {/* Event Selection Dropdown */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-[3px] sm:border-[4px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border-2 border-black rounded-lg text-indigo-600 shrink-0">
          <Calendar className="w-6 h-6" />
        </div>
        <div className="flex-1 w-full space-y-1">
          <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400">Select Event View</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full max-w-md p-3 border-2 border-black dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-black dark:text-white font-bold text-xs sm:text-sm rounded-lg outline-none focus:border-indigo-500"
          >
            <option value="">All Events (Combined Overall Standings)</option>
            {events.map(e => (
              <option key={e.docId} value={e.docId}>{e.title} ({e.date || 'No Date'})</option>
            ))}
          </select>
        </div>
        {!selectedEventId && (
          <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 text-amber-900 dark:text-amber-250 text-xs font-black uppercase rounded-lg">
            NOTE: Select a specific event above to enter manual GForm registrations for that event.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Form to add new promoter */}
        <div className="lg:col-span-1 p-4 sm:p-6 bg-white dark:bg-slate-900 border-[3px] sm:border-[4px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl h-fit">
          <h3 className="text-lg sm:text-xl font-black uppercase text-black dark:text-white border-b-2 border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#FF00FF]" /> Add New Promoter
          </h3>
          
          <form onSubmit={handleAddPromoter} className="space-y-4 sm:space-y-5 mt-4 sm:mt-5">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">Promoter Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Amal Dev"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={addLoading}
                className="w-full p-3 border-2 border-black dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-black dark:text-white outline-none font-bold text-xs sm:text-sm focus:border-[#FF00FF] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">Referral Code *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. REF-AMAL-492"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={addLoading}
                  className="w-full p-3 border-2 border-black dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-black dark:text-white outline-none font-bold text-xs sm:text-sm focus:border-[#00FFFF] transition-colors uppercase pr-10"
                />
                <button
                  type="button"
                  onClick={() => handleNameChange(name)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-black dark:hover:text-white"
                  title="Regenerate random code"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Codes auto-generate, but can be customized.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 font-bold text-xs uppercase rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={addLoading || !name.trim() || !code.trim()}
              className="w-full bg-[#00FFFF] text-black border-[3px] border-black font-black py-3 uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              {addLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Register Promoter'}
            </button>
          </form>
        </div>

        {/* Database List */}
        <div className="lg:col-span-2 p-4 sm:p-6 bg-white dark:bg-slate-900 border-[3px] sm:border-[4px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
          {/* Header & Controls */}
          <div className="flex flex-col space-y-4 border-b-2 border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-lg sm:text-xl font-black uppercase text-black dark:text-white flex items-center gap-2">
                {selectedEventId ? 'Event Standings' : 'Lifetime Standings'} ({filteredPromoters.length})
              </h3>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportCSV}
                  disabled={promoters.length === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#FFDE03] text-black border-2 border-black font-black px-3 py-2 text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button
                  onClick={() => setDeleteTarget({ type: 'reset', name: selectedEventId ? `Event Referrals` : `All Lifetime Referrals` })}
                  disabled={promoters.length === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-500 text-white border-2 border-black font-black px-3 py-2 text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Reset Stats
                </button>
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search promoter name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border-2 border-black dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-black dark:text-white text-xs font-bold rounded-lg outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-black dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
              <p className="font-bold uppercase text-slate-500 text-sm">Loading database...</p>
            </div>
          ) : filteredPromoters.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-black uppercase text-slate-400 text-base">
                {searchQuery ? 'No promoters match your search.' : 'No campaigners registered yet.'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View Card List (< md screens) */}
              <div className="block md:hidden mt-4 space-y-3">
                {filteredPromoters.map((promoter) => {
                  const site = selectedEventId ? (eventStats[promoter.id!]?.site || 0) : (promoter.siteReferrals || 0);
                  const gform = selectedEventId ? (eventStats[promoter.id!]?.gform || 0) : (promoter.gformReferrals || 0);
                  const total = site + gform;

                  return (
                    <div 
                      key={promoter.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/60 border-2 border-black dark:border-slate-700 rounded-xl space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-black text-black dark:text-white text-base uppercase leading-snug">
                            {promoter.name}
                          </h4>
                          <code className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 border border-slate-300 dark:border-slate-600 rounded text-pink-600 dark:text-pink-400 font-mono font-black text-xs inline-block mt-1">
                            {promoter.code}
                          </code>
                        </div>
                        <button
                          onClick={() => handleToggleActive(promoter.id!, promoter.isActive)}
                          className="shrink-0 focus:outline-none"
                        >
                          {promoter.isActive ? (
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-black uppercase bg-green-100 text-green-800 border border-green-300 rounded">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-300 rounded">
                              Inactive
                            </span>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200 dark:border-slate-700 text-center">
                        <div>
                          <span className="block text-[10px] font-black uppercase text-slate-500">Site Auto</span>
                          <span className="font-black text-sm text-slate-800 dark:text-slate-200">{site}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-black uppercase text-slate-500">GForm</span>
                          <span className="font-black text-sm text-slate-800 dark:text-slate-200">{gform}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-black uppercase text-slate-500">Total</span>
                          <span className="font-black text-base text-blue-600 dark:text-blue-400">{total}</span>
                        </div>
                      </div>

                      {/* GForm Edit & Action Controls */}
                      <div className="flex flex-col gap-2 pt-1">
                        <div className="flex items-center gap-1.5 w-full">
                          <span className="text-[10px] font-black uppercase text-slate-500 shrink-0">Manual GForm:</span>
                          <div className="flex items-center gap-1 flex-1">
                            <button
                              type="button"
                              disabled={!selectedEventId}
                              onClick={() => {
                                const curr = gformValues[promoter.id!] || 0;
                                setGformValues({ ...gformValues, [promoter.id!]: Math.max(0, curr - 1) });
                              }}
                              className="p-1 border border-black dark:border-slate-700 bg-slate-200 dark:bg-slate-700 font-bold rounded disabled:opacity-40 text-xs"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              disabled={!selectedEventId}
                              placeholder={!selectedEventId ? "Select event" : "0"}
                              value={gformValues[promoter.id!] === undefined ? 0 : gformValues[promoter.id!]}
                              onChange={(e) => {
                                const v = parseInt(e.target.value) || 0;
                                setGformValues({ ...gformValues, [promoter.id!]: v < 0 ? 0 : v });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateGFormReferrals(promoter.id!, promoter);
                              }}
                              className="w-full p-1.5 border-2 border-black dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-xs rounded disabled:opacity-50"
                            />
                            <button
                              type="button"
                              disabled={!selectedEventId}
                              onClick={() => {
                                const curr = gformValues[promoter.id!] || 0;
                                setGformValues({ ...gformValues, [promoter.id!]: curr + 1 });
                              }}
                              className="p-1 border border-black dark:border-slate-700 bg-slate-200 dark:bg-slate-700 font-bold rounded disabled:opacity-40 text-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateGFormReferrals(promoter.id!, promoter)}
                              disabled={!selectedEventId}
                              className="p-1.5 border border-black dark:border-slate-700 bg-green-400 text-black hover:bg-green-500 font-bold rounded disabled:opacity-50 shrink-0"
                              title={selectedEventId ? "Save GForm Count" : "Select an event to update counts"}
                            >
                              {savingGformId === promoter.id ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-1">
                          <button
                            onClick={() => handleOpenEditModal(promoter)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-black dark:border-slate-700 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs rounded hover:bg-blue-200"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit Promoter
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: promoter.id, type: 'promoter', name: promoter.name })}
                            className="p-1.5 border border-black dark:border-slate-700 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold text-xs rounded hover:bg-red-200"
                            title="Delete Promoter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View Table (>= md screens) */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar mt-6">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b-4 border-black dark:border-slate-800 text-slate-500 uppercase text-xs font-black">
                      <th className="pb-3">Promoter</th>
                      <th className="pb-3 px-2">Referral Code</th>
                      <th className="pb-3 px-2 text-center">Site Auto</th>
                      <th className="pb-3 px-2 text-center w-40">GForm Manual</th>
                      <th className="pb-3 px-2 text-center">Total</th>
                      <th className="pb-3 px-2 text-center">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-800">
                    {filteredPromoters.map((promoter) => {
                      const site = selectedEventId ? (eventStats[promoter.id!]?.site || 0) : (promoter.siteReferrals || 0);
                      const gform = selectedEventId ? (eventStats[promoter.id!]?.gform || 0) : (promoter.gformReferrals || 0);
                      const total = site + gform;

                      return (
                        <tr key={promoter.id} className="text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="py-4">
                            <div className="font-black text-black dark:text-white uppercase">{promoter.name}</div>
                          </td>
                          <td className="py-4 px-2">
                            <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-pink-600 font-black text-xs">
                              {promoter.code}
                            </code>
                          </td>
                          <td className="py-4 px-2 text-center text-slate-600 dark:text-slate-400">
                            {site}
                          </td>
                          <td className="py-4 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                disabled={!selectedEventId}
                                onClick={() => {
                                  const curr = gformValues[promoter.id!] || 0;
                                  setGformValues({ ...gformValues, [promoter.id!]: Math.max(0, curr - 1) });
                                }}
                                className="p-1 border border-black dark:border-slate-700 bg-slate-200 dark:bg-slate-700 font-bold rounded disabled:opacity-40 text-xs"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                disabled={!selectedEventId}
                                placeholder={!selectedEventId ? "Select event" : "0"}
                                value={gformValues[promoter.id!] === undefined ? 0 : gformValues[promoter.id!]}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value) || 0;
                                  setGformValues({ ...gformValues, [promoter.id!]: v < 0 ? 0 : v });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateGFormReferrals(promoter.id!, promoter);
                                }}
                                className="w-14 p-1 border-2 border-black dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-bold text-xs rounded disabled:opacity-50"
                              />
                              <button
                                type="button"
                                disabled={!selectedEventId}
                                onClick={() => {
                                  const curr = gformValues[promoter.id!] || 0;
                                  setGformValues({ ...gformValues, [promoter.id!]: curr + 1 });
                                }}
                                className="p-1 border border-black dark:border-slate-700 bg-slate-200 dark:bg-slate-700 font-bold rounded disabled:opacity-40 text-xs"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleUpdateGFormReferrals(promoter.id!, promoter)}
                                disabled={!selectedEventId}
                                className="p-1.5 border border-black dark:border-slate-700 bg-green-400 text-black hover:bg-green-500 rounded disabled:opacity-50"
                                title={selectedEventId ? "Save Manual Count" : "Select an event to update counts"}
                              >
                                {savingGformId === promoter.id ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center font-black text-black dark:text-white text-base">
                            {total}
                          </td>
                          <td className="py-4 px-2 text-center">
                            <button
                              onClick={() => handleToggleActive(promoter.id!, promoter.isActive)}
                              className="focus:outline-none"
                              title={promoter.isActive ? 'Mark as Inactive' : 'Mark as Active'}
                            >
                              {promoter.isActive ? (
                                <span className="inline-flex px-2 py-1 text-[10px] font-black uppercase bg-green-100 text-green-800 border border-green-300 rounded">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-1 text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-300 rounded">
                                  Inactive
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditModal(promoter)}
                                className="p-2 border-2 border-black bg-blue-100 dark:bg-blue-950 hover:bg-blue-200 text-blue-700 dark:text-blue-300 rounded transition-colors"
                                title="Edit Promoter"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ id: promoter.id, type: 'promoter', name: promoter.name })}
                                className="p-2 border-2 border-black bg-red-100 dark:bg-red-950 hover:bg-red-200 text-red-600 dark:text-red-400 rounded transition-colors"
                                title="Delete Promoter"
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
            </>
          )}
        </div>
      </div>

      {/* Edit Promoter Modal */}
      {editingPromoter && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border-[4px] border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xl font-black uppercase text-black dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" /> Edit Promoter Details
              </h3>
              <button
                onClick={() => setEditingPromoter(null)}
                className="p-1 text-slate-400 hover:text-black dark:hover:text-white rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedPromoter} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Promoter Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 border-2 border-black dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-black dark:text-white font-bold text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Referral Code *
                </label>
                <input
                  type="text"
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  className="w-full p-3 border-2 border-black dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-black dark:text-white font-bold text-sm uppercase outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Site Auto Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editSiteReferrals}
                    onChange={(e) => setEditSiteReferrals(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 border-2 border-black dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-black dark:text-white font-bold text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    GForm Manual Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editGformReferrals}
                    onChange={(e) => setEditGformReferrals(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 border-2 border-black dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-black dark:text-white font-bold text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Account Status
                </label>
                <button
                  type="button"
                  onClick={() => setEditIsActive(!editIsActive)}
                  className={`w-full py-2.5 px-4 font-black uppercase text-xs border-2 border-black rounded-lg flex items-center justify-between ${
                    editIsActive ? 'bg-green-100 text-green-800 border-green-500' : 'bg-red-100 text-red-800 border-red-500'
                  }`}
                >
                  <span>Status: {editIsActive ? 'Active' : 'Inactive'}</span>
                  <span>{editIsActive ? 'Click to Disable' : 'Click to Enable'}</span>
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 font-bold text-xs uppercase rounded-lg">
                  {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPromoter(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-2 border-black dark:border-slate-700 font-black text-xs uppercase rounded-lg text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 bg-blue-600 text-white border-2 border-black font-black text-xs uppercase rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none flex items-center gap-2"
                >
                  {editLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rethink Delete Warning Modal */}
      <RethinkModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.type === 'promoter' ? "Rethink Promoter Deletion" : "Rethink Leaderboard Reset"}
        description={
          deleteTarget?.type === 'promoter' 
            ? "Are you sure you want to delete this promoter and all their associated referral records?" 
            : "WARNING: This will permanently reset all referral counts to 0 for the selected scope. This action cannot be undone."
        }
        itemName={deleteTarget?.name}
        confirmText="Yes, Rethink & Delete"
        cancelText="Keep Data"
        onConfirm={confirmAction}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isActionLoading}
      />
    </div>
  );
};

export default LeaderboardAdmin;
