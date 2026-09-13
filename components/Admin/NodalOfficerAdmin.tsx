import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Event } from '../../types';
import { sendGoogleScriptPayload, logApprovalAction } from '../../utils/googleScript';
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
  Filter
} from 'lucide-react';

interface FirestoreEvent extends Event {
  docId: string;
}

interface NodalOfficerAdminProps {
  userEmail?: string;
}

const NodalOfficerAdmin: React.FC<NodalOfficerAdminProps> = ({ userEmail = 'nodalofficer@ce-kgr.org' }) => {
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'history'>('pending');
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Rejection Modal state
  const [rejectingEvent, setRejectingEvent] = useState<FirestoreEvent | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Approval Modal state
  const [approvingEvent, setApprovingEvent] = useState<FirestoreEvent | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsData = querySnapshot.docs.map(docSnap => ({
        docId: docSnap.id,
        ...docSnap.data()
      })) as FirestoreEvent[];

      // Sort by creation time / ID
      eventsData.sort((a, b) => b.id - a.id);
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events for Nodal Officer:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleApprove = async () => {
    if (!approvingEvent) return;
    setIsSubmittingAction(true);
    try {
      const nowIso = new Date().toISOString();
      const eventRef = doc(db, 'events', approvingEvent.docId);

      await updateDoc(eventRef, {
        approvalStatus: 'approved',
        approvedAt: nowIso,
        reviewedBy: userEmail,
        rejectionReason: null
      });

      // Send Google Apps Script notification in background
      sendGoogleScriptPayload({
        action: 'EVENT_APPROVED',
        eventId: approvingEvent.id,
        eventTitle: approvingEvent.title,
        eventType: approvingEvent.type,
        actorEmail: userEmail,
        actorRole: 'NODAL_OFFICER',
        timestamp: nowIso
      }).catch(err => console.error("Webhook error:", err));

      // Record in Firestore approval logs in background
      logApprovalAction({
        eventId: approvingEvent.id,
        eventTitle: approvingEvent.title,
        eventType: approvingEvent.type,
        action: 'APPROVED',
        actionDate: nowIso,
        actorEmail: userEmail,
        actorRole: 'NODAL_OFFICER',
        notes: 'Approved by Nodal Officer portal'
      }).catch(err => console.error("Log error:", err));

      setActionSuccessMessage(`Event "${approvingEvent.title}" has been APPROVED and is now live!`);
      setTimeout(() => setActionSuccessMessage(''), 5000);
      setApprovingEvent(null);
      await fetchEvents();
    } catch (error) {
      console.error("Error approving event:", error);
      alert("Failed to approve event. Please try again.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingEvent) return;
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejecting this event.");
      return;
    }

    setIsSubmittingAction(true);
    try {
      const nowIso = new Date().toISOString();
      const eventRef = doc(db, 'events', rejectingEvent.docId);

      await updateDoc(eventRef, {
        approvalStatus: 'rejected',
        rejectedAt: nowIso,
        reviewedBy: userEmail,
        rejectionReason: rejectionReason.trim()
      });

      // Send Google Apps Script notification in background
      sendGoogleScriptPayload({
        action: 'EVENT_REJECTED',
        eventId: rejectingEvent.id,
        eventTitle: rejectingEvent.title,
        eventType: rejectingEvent.type,
        actorEmail: userEmail,
        actorRole: 'NODAL_OFFICER',
        rejectionReason: rejectionReason.trim(),
        timestamp: nowIso
      }).catch(err => console.error("Webhook error:", err));

      // Record in Firestore approval logs in background
      logApprovalAction({
        eventId: rejectingEvent.id,
        eventTitle: rejectingEvent.title,
        eventType: rejectingEvent.type,
        action: 'REJECTED',
        actionDate: nowIso,
        actorEmail: userEmail,
        actorRole: 'NODAL_OFFICER',
        rejectionReason: rejectionReason.trim(),
        notes: 'Rejected by Nodal Officer portal'
      }).catch(err => console.error("Log error:", err));

      setActionSuccessMessage(`Event "${rejectingEvent.title}" has been REJECTED.`);
      setTimeout(() => setActionSuccessMessage(''), 5000);
      setRejectingEvent(null);
      setRejectionReason('');
      await fetchEvents();
    } catch (error) {
      console.error("Error rejecting event:", error);
      alert("Failed to reject event. Please try again.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Filter events
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-300 mb-1 font-semibold text-xs uppercase tracking-wider">
            <Shield size={16} />
            <span>Nodal Officer Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Event Approval Dashboard</h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">Review event requests before publication on the official website</p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20">
          <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider block">Logged in Officer</span>
            <span className="text-xs font-semibold text-white">{userEmail}</span>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{actionSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeSubTab === 'pending'
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
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeSubTab === 'history'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText size={16} />
            <span>Approval History</span>
            <span className="bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full text-xs">
              {historyEvents.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or type..."
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

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 font-medium">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Fetching pending event approval requests...
        </div>
      ) : activeSubTab === 'pending' ? (
        /* PENDING REQUESTS CARDS LIST */
        <div className="space-y-6">
          {filteredPending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
              <h3 className="text-lg font-bold text-slate-800">All Caught Up!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                There are no pending event approval requests requiring your attention right now.
              </p>
            </div>
          ) : (
            filteredPending.map((event) => (
              <div
                key={event.docId}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col lg:flex-row"
              >
                {/* Poster Image */}
                <div className="lg:w-80 h-56 lg:h-auto relative bg-slate-900 shrink-0">
                  <img
                    src={event.image || 'https://via.placeholder.com/400x300'}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-amber-500 text-slate-900 font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                    <Clock size={13} />
                    <span>Pending Approval</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    {event.mode === 'Online' ? <ExternalLink size={13} /> : <MapPin size={13} />}
                    <span>{event.mode || 'Offline'}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {event.type || 'Event'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Submitted: {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 leading-snug">{event.title}</h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {event.description}
                    </p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <Calendar size={15} className="text-blue-500 shrink-0" />
                        <span>Date: {event.date || (event.startDateTime ? new Date(event.startDateTime).toLocaleString() : 'TBA')}</span>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <FileText size={15} className="text-indigo-500 shrink-0" />
                        <span>Reg. Mode: {event.eventType === 'website-form' ? 'Website Built-in Form' : 'Google Form'}</span>
                      </div>

                      {event.prizePool && (
                        <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-lg border border-amber-100 text-amber-900 font-semibold sm:col-span-2">
                          <Trophy size={15} className="text-amber-500 shrink-0" />
                          <span>Prize Pool: {event.prizePool}</span>
                        </div>
                      )}

                      {event.speakerName && (
                        <div className="flex items-center gap-2 bg-purple-50 p-2 rounded-lg border border-purple-100 text-purple-900 sm:col-span-2">
                          <UserCheck size={15} className="text-purple-500 shrink-0" />
                          <span>Speaker: {event.speakerName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setRejectingEvent(event);
                        setRejectionReason('');
                      }}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-colors flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      <span>Reject Event</span>
                    </button>

                    <button
                      onClick={() => setApprovingEvent(event)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
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
        /* HISTORY TAB TABLE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Past Decision History</h3>
            <span className="text-xs text-slate-500">{filteredHistory.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="p-3.5">Event</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Reviewed Date</th>
                  <th className="p-3.5">Reviewed By</th>
                  <th className="p-3.5">Notes / Rejection Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredHistory.map((event) => (
                  <tr key={event.docId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
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

                    <td className="p-3.5">
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

                    <td className="p-3.5 text-slate-600 font-medium">
                      {event.approvedAt
                        ? new Date(event.approvedAt).toLocaleString()
                        : event.rejectedAt
                        ? new Date(event.rejectedAt).toLocaleString()
                        : 'N/A'}
                    </td>

                    <td className="p-3.5 text-slate-700 font-semibold">
                      {event.reviewedBy || userEmail}
                    </td>

                    <td className="p-3.5 max-w-xs">
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
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                      No approval history records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPROVAL CONFIRMATION MODAL */}
      {approvingEvent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Approve Event?</h3>
                <p className="text-xs text-slate-500">This will make the event live on the public website.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
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
                  <span>Confirm Approval</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingEvent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reject Event Request</h3>
                <p className="text-xs text-slate-500">Please state the reason so admins can revise the event.</p>
              </div>
            </div>

            <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs">
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
                placeholder="e.g. Incomplete guidelines, poster image resolution is low, or incorrect event date."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
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

export default NodalOfficerAdmin;
