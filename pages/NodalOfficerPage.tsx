import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';
import { sendGoogleScriptPayload, logApprovalAction, getApprovalConfig, ApprovalConfig } from '../utils/googleScript';
import logo from '../images/logo.png';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  ExternalLink, 
  MapPin, 
  Calendar, 
  UserCheck, 
  FileText, 
  Shield, 
  RefreshCw,
  Trophy,
  Lock,
  User,
  LogOut,
  ArrowLeft,
  Eye,
  ShieldCheck
} from 'lucide-react';

interface FirestoreEvent extends Event {
  docId: string;
}

interface NodalOfficerPageProps {
  onNavigate?: (path: string) => void;
}

const NodalOfficerPage: React.FC<NodalOfficerPageProps> = ({ onNavigate }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('iedc_nodal_auth') === 'true';
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Portal state
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Action Modals
  const [approvingEvent, setApprovingEvent] = useState<FirestoreEvent | null>(null);
  const [rejectingEvent, setRejectingEvent] = useState<FirestoreEvent | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Config State
  const [config, setConfig] = useState<ApprovalConfig>({
    nodalOfficerEmail: 'nodalofficer@ce-kgr.org',
    webhookUrl: '',
    nodalOfficerUsername: 'nodalofficer',
    nodalOfficerPassword: 'nodal@123'
  });

  useEffect(() => {
    const fetchConfig = async () => {
      const cfg = await getApprovalConfig();
      setConfig(cfg);
    };
    fetchConfig();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsData = querySnapshot.docs.map(docSnap => ({
        docId: docSnap.id,
        ...docSnap.data()
      })) as FirestoreEvent[];

      eventsData.sort((a, b) => b.id - a.id);
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const validUsername = config.nodalOfficerUsername || 'nodalofficer';
      const validPassword = config.nodalOfficerPassword || 'nodal@123';

      const inputUser = username.trim().toLowerCase();
      const targetUser = validUsername.trim().toLowerCase();

      // Check credentials
      if ((inputUser === targetUser || inputUser === 'nodalofficer') && password === validPassword) {
        setIsAuthenticated(true);
        sessionStorage.setItem('iedc_nodal_auth', 'true');
        sessionStorage.setItem('iedc_nodal_user', config.nodalOfficerEmail || inputUser);
      } else {
        setLoginError('Invalid Username or Password. Please try again.');
      }
    } catch (err) {
      console.error("Nodal login error:", err);
      setLoginError('Authentication failed. Please check credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('iedc_nodal_auth');
    sessionStorage.removeItem('iedc_nodal_user');
  };

  const handleApprove = async () => {
    if (!approvingEvent) return;
    setIsSubmittingAction(true);
    try {
      const nowIso = new Date().toISOString();
      const officerEmail = config.nodalOfficerEmail || 'nodalofficer@ce-kgr.org';
      const eventRef = doc(db, 'events', approvingEvent.docId);

      await updateDoc(eventRef, {
        approvalStatus: 'approved',
        approvedAt: nowIso,
        reviewedBy: officerEmail,
        rejectionReason: null
      });

      sendGoogleScriptPayload({
        action: 'EVENT_APPROVED',
        eventId: approvingEvent.id,
        eventTitle: approvingEvent.title,
        eventType: approvingEvent.type,
        actorEmail: officerEmail,
        actorRole: 'NODAL_OFFICER',
        timestamp: nowIso
      }).catch(err => console.error("Webhook error:", err));

      logApprovalAction({
        eventId: approvingEvent.id,
        eventTitle: approvingEvent.title,
        eventType: approvingEvent.type,
        action: 'APPROVED',
        actionDate: nowIso,
        actorEmail: officerEmail,
        actorRole: 'NODAL_OFFICER',
        notes: 'Approved by Nodal Officer Portal'
      }).catch(err => console.error("Log error:", err));

      setActionMessage(`Event "${approvingEvent.title}" has been APPROVED and is now published!`);
      setTimeout(() => setActionMessage(''), 5000);
      setApprovingEvent(null);
      await fetchEvents();
    } catch (error) {
      console.error("Error approving event:", error);
      alert("Failed to approve event.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingEvent) return;
    if (!rejectionReason.trim()) {
      alert("Please enter a reason for rejection.");
      return;
    }

    setIsSubmittingAction(true);
    try {
      const nowIso = new Date().toISOString();
      const officerEmail = config.nodalOfficerEmail || 'nodalofficer@ce-kgr.org';
      const eventRef = doc(db, 'events', rejectingEvent.docId);

      await updateDoc(eventRef, {
        approvalStatus: 'rejected',
        rejectedAt: nowIso,
        reviewedBy: officerEmail,
        rejectionReason: rejectionReason.trim()
      });

      sendGoogleScriptPayload({
        action: 'EVENT_REJECTED',
        eventId: rejectingEvent.id,
        eventTitle: rejectingEvent.title,
        eventType: rejectingEvent.type,
        actorEmail: officerEmail,
        actorRole: 'NODAL_OFFICER',
        rejectionReason: rejectionReason.trim(),
        timestamp: nowIso
      }).catch(err => console.error("Webhook error:", err));

      logApprovalAction({
        eventId: rejectingEvent.id,
        eventTitle: rejectingEvent.title,
        eventType: rejectingEvent.type,
        action: 'REJECTED',
        actionDate: nowIso,
        actorEmail: officerEmail,
        actorRole: 'NODAL_OFFICER',
        rejectionReason: rejectionReason.trim(),
        notes: 'Rejected by Nodal Officer Portal'
      }).catch(err => console.error("Log error:", err));

      setActionMessage(`Event "${rejectingEvent.title}" has been REJECTED.`);
      setTimeout(() => setActionMessage(''), 5000);
      setRejectingEvent(null);
      setRejectionReason('');
      await fetchEvents();
    } catch (error) {
      console.error("Error rejecting event:", error);
      alert("Failed to reject event.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const pendingEvents = events.filter(e => e.approvalStatus === 'pending');
  const historyEvents = events.filter(e => e.approvalStatus === 'approved' || e.approvalStatus === 'rejected');

  const filteredPending = pendingEvents.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.type && e.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredHistory = historyEvents.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.type && e.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // UNAUTHENTICATED LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 py-12 font-sans text-slate-800">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <img src={logo} alt="IEDC Logo" className="h-14 w-auto object-contain mx-auto" />
            <div>
              <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck size={14} />
                <span>Nodal Officer Portal</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Officer Authentication</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Sign in with your Nodal Officer credentials to review events</p>
            </div>
          </div>

          {/* Error Alert */}
          {loginError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-relaxed">{loginError}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Username / Email</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 text-slate-900 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  placeholder="nodalofficer"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 text-slate-900 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loggingIn ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Access Nodal Officer Portal</span>
                </>
              )}
            </button>
          </form>

          {onNavigate && (
            <div className="text-center pt-3 border-t border-slate-100">
              <button
                onClick={() => onNavigate('/')}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Website Home
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // AUTHENTICATED NODAL OFFICER PORTAL
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-16">
      {/* Top Standalone Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="IEDC Logo" className="h-10 w-auto object-contain" />
            <div className="h-6 w-[1px] bg-slate-700 hidden sm:block" />
            <div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Official Portal</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">Nodal Officer Event Approvals</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authenticated Officer</span>
              <span className="text-xs font-semibold text-white">{config.nodalOfficerEmail || 'nodalofficer@ce-kgr.org'}</span>
            </div>

            <button
              onClick={handleLogout}
              className="py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 border border-red-500/40 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Banner Alert */}
        {actionMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-semibold">{actionMessage}</span>
            </div>
          </div>
        )}

        {/* Tab Controls & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeTab === 'pending'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Clock size={16} />
              <span>Pending Requests</span>
              {pendingEvents.length > 0 && (
                <span className="bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded-full text-xs">
                  {pendingEvents.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText size={16} />
              <span>Decision History</span>
              <span className="bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full text-xs">
                {historyEvents.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={fetchEvents}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              title="Refresh List"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 font-medium">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading pending event approval requests...
          </div>
        ) : activeTab === 'pending' ? (
          /* PENDING EVENT CARDS */
          <div className="space-y-6">
            {filteredPending.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-2xs space-y-3">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto opacity-80" />
                <h3 className="text-xl font-bold text-slate-900">No Pending Requests</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All submitted event approval requests have been reviewed.
                </p>
              </div>
            ) : (
              filteredPending.map((event) => (
                <div
                  key={event.docId}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col lg:flex-row"
                >
                  {/* Poster Image */}
                  <div className="lg:w-96 h-64 lg:h-auto relative bg-slate-900 shrink-0">
                    <img
                      src={event.image || 'https://via.placeholder.com/400x300'}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-amber-500 text-slate-900 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                      <Clock size={14} />
                      <span>Pending Approval</span>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1 rounded-xl flex items-center gap-1.5">
                      {event.mode === 'Online' ? <ExternalLink size={14} /> : <MapPin size={14} />}
                      <span>{event.mode || 'Offline'}</span>
                    </div>
                  </div>

                  {/* Details & Actions */}
                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                          {event.type || 'Event'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          Submitted: {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-slate-900 leading-snug">{event.title}</h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {event.description}
                      </p>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-medium text-slate-700">
                        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <Calendar size={16} className="text-blue-500 shrink-0" />
                          <span>Date: {event.date || (event.startDateTime ? new Date(event.startDateTime).toLocaleString() : 'TBA')}</span>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <FileText size={16} className="text-indigo-500 shrink-0" />
                          <span>Reg Mode: {event.eventType === 'website-form' ? 'Website Built-in Form' : 'Google Form'}</span>
                        </div>

                        {event.prizePool && (
                          <div className="flex items-center gap-2 bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-amber-900 font-semibold sm:col-span-2">
                            <Trophy size={16} className="text-amber-500 shrink-0" />
                            <span>Prize Pool: {event.prizePool}</span>
                          </div>
                        )}

                        {event.speakerName && (
                          <div className="flex items-center gap-2 bg-purple-50 p-2.5 rounded-xl border border-purple-100 text-purple-900 sm:col-span-2">
                            <UserCheck size={16} className="text-purple-500 shrink-0" />
                            <span>Speaker: {event.speakerName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setRejectingEvent(event);
                          setRejectionReason('');
                        }}
                        className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-colors flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        <span>Reject Event</span>
                      </button>

                      <button
                        onClick={() => setApprovingEvent(event)}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        <span>Approve & Publish</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* HISTORY TABLE */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Decision History</h3>
              <span className="text-xs text-slate-500">{filteredHistory.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="p-4">Event</th>
                    <th className="p-4">Decision</th>
                    <th className="p-4">Reviewed Date</th>
                    <th className="p-4">Reviewed By</th>
                    <th className="p-4">Notes / Rejection Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredHistory.map((event) => (
                    <tr key={event.docId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <img
                            src={event.image || 'https://via.placeholder.com/80'}
                            alt={event.title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-800">{event.title}</p>
                            <span className="text-[10px] text-slate-500 font-medium">{event.type}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        {event.approvalStatus === 'approved' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[11px] border border-emerald-200">
                            <CheckCircle size={12} /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 font-bold rounded-full text-[11px] border border-red-200">
                            <XCircle size={12} /> Rejected
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-slate-600 font-medium">
                        {event.approvedAt
                          ? new Date(event.approvedAt).toLocaleString()
                          : event.rejectedAt
                          ? new Date(event.rejectedAt).toLocaleString()
                          : 'N/A'}
                      </td>

                      <td className="p-4 text-slate-700 font-semibold">
                        {event.reviewedBy || config.nodalOfficerEmail}
                      </td>

                      <td className="p-4 max-w-xs">
                        {event.approvalStatus === 'rejected' ? (
                          <p className="text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100 text-[11px]">
                            {event.rejectionReason || 'No reason specified.'}
                          </p>
                        ) : (
                          <span className="text-slate-400 italic">Approved for public display</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400 font-medium">
                        No decision records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* APPROVAL MODAL */}
      {approvingEvent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Approve Event?</h3>
                <p className="text-xs text-slate-500">This event will be published live on the website.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-800">{approvingEvent.title}</p>
              <p className="text-slate-500">{approvingEvent.type} • {approvingEvent.date}</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setApprovingEvent(null)}
                disabled={isSubmittingAction}
                className="px-4 py-2 text-slate-600 font-semibold text-xs hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmittingAction}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2"
              >
                {isSubmittingAction ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Confirm & Publish</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectingEvent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reject Event Request</h3>
                <p className="text-xs text-slate-500">Provide a mandatory reason so admins can revise it.</p>
              </div>
            </div>

            <div className="p-3 bg-red-50 rounded-2xl border border-red-100 text-xs">
              <p className="font-bold text-red-900">{rejectingEvent.title}</p>
              <p className="text-red-700 mt-0.5">{rejectingEvent.type}</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Event poster image resolution is low, or guidelines need to be updated."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setRejectingEvent(null);
                  setRejectionReason('');
                }}
                disabled={isSubmittingAction}
                className="px-4 py-2 text-slate-600 font-semibold text-xs hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmittingAction || !rejectionReason.trim()}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2"
              >
                {isSubmittingAction ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Submit Rejection</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodalOfficerPage;
