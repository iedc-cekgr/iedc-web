import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { EventApprovalLog } from '../../types';
import { getApprovalConfig, saveApprovalConfig, ApprovalConfig } from '../../utils/googleScript';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  PlusCircle, 
  RefreshCw, 
  Settings, 
  Save, 
  Link as LinkIcon, 
  Mail, 
  HelpCircle 
} from 'lucide-react';

const ApprovalLogsAdmin: React.FC = () => {
  const [logs, setLogs] = useState<EventApprovalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  // Config State
  const [config, setConfig] = useState<ApprovalConfig>({
    nodalOfficerEmail: 'nodalofficer@ce-kgr.org',
    webhookUrl: ''
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  const fetchLogsAndConfig = async () => {
    setLoading(true);
    try {
      // 1. Fetch Config
      const fetchedConfig = await getApprovalConfig();
      setConfig(fetchedConfig);

      // 2. Fetch Logs
      const logsSnapshot = await getDocs(query(collection(db, 'approval_logs')));
      const fetchedLogs = logsSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as EventApprovalLog[];

      // Sort newest first
      fetchedLogs.sort((a, b) => {
        const timeA = new Date(a.actionDate).getTime() || 0;
        const timeB = new Date(b.actionDate).getTime() || 0;
        return timeB - timeA;
      });

      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Error fetching approval logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsAndConfig();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await saveApprovalConfig(config);
      if (config.webhookUrl) {
        localStorage.setItem('iedc_gas_webhook_url', config.webhookUrl);
      }
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 4000);
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Failed to save configuration.");
    } finally {
      setSavingConfig(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.rejectionReason && log.rejectionReason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (actionFilter === 'ALL') return matchesSearch;
    return matchesSearch && log.action === actionFilter;
  });

  // Export to Excel (.xlsx)
  const exportToExcel = () => {
    if (filteredLogs.length === 0) {
      alert("No log data available to export.");
      return;
    }

    const exportData = filteredLogs.map((log, index) => ({
      "Sl No": index + 1,
      "Timestamp": new Date(log.actionDate).toLocaleString(),
      "Event Title": log.eventTitle,
      "Event Type": log.eventType || 'N/A',
      "Action": log.action,
      "Rejection Reason": log.rejectionReason || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Auto-fit column widths
    const columnWidths = [
      { wch: 8 },  // Sl No
      { wch: 22 }, // Timestamp
      { wch: 30 }, // Event Title
      { wch: 15 }, // Event Type
      { wch: 15 }, // Action
      { wch: 35 }  // Rejection Reason
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Approval Logs");

    const fileName = `IEDC_Event_Approval_Logs_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-8">
      {/* Settings Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-base border-b border-slate-100 pb-3">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>Approval Workflow & Google Script Settings</span>
        </div>

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Nodal Officer Email Address *
            </label>
            <input
              type="email"
              value={config.nodalOfficerEmail}
              onChange={(e) => setConfig({ ...config, nodalOfficerEmail: e.target.value })}
              placeholder="nodalofficer@ce-kgr.org"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Approval request notifications will be directed to this address.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
              Google Apps Script Web App URL
            </label>
            <input
              type="url"
              value={config.webhookUrl}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Web app URL deployed from `google_apps_script.gs` for Google Sheets logging & emails.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              Nodal Officer Login Username
            </label>
            <input
              type="text"
              value={config.nodalOfficerUsername || ''}
              onChange={(e) => setConfig({ ...config, nodalOfficerUsername: e.target.value })}
              placeholder="nodalofficer@ce-kgr.org"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Username for Nodal Officer login page (`/nodal-officer`).</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              Nodal Officer Login Password
            </label>
            <input
              type="text"
              value={config.nodalOfficerPassword || ''}
              onChange={(e) => setConfig({ ...config, nodalOfficerPassword: e.target.value })}
              placeholder="NodalOfficer2026!"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Password for Nodal Officer login page (`/nodal-officer`).</p>
          </div>

          <div className="md:col-span-2 flex items-center justify-between pt-2">
            {configSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Settings saved successfully!
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">See file google_apps_script.gs in project for setup instructions.</span>
            )}

            <button
              type="submit"
              disabled={savingConfig}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              {savingConfig ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Audit Logs Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Approval Activity Audit Logs</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Historical log of all event creations, approvals, and rejections</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATED">Created</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="RESUBMITTED">Resubmitted</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search log records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            {/* Export Excel Button */}
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0"
            >
              <Download size={15} />
              <span>Export Excel (.xlsx)</span>
            </button>

            {/* Refresh */}
            <button
              onClick={fetchLogsAndConfig}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 font-medium">
            <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading audit logs...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Event Title</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Rejection Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.actionDate).toLocaleString()}
                    </td>

                    <td className="p-3.5 font-bold text-slate-900">
                      {log.eventTitle}
                      {log.eventType && (
                        <span className="block text-[10px] font-normal text-slate-400">{log.eventType}</span>
                      )}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      {log.action === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] border border-emerald-200">
                          <CheckCircle size={12} /> Approved
                        </span>
                      )}
                      {log.action === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 font-bold rounded-full text-[10px] border border-red-200">
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                      {log.action === 'CREATED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-full text-[10px] border border-blue-200">
                          <PlusCircle size={12} /> Created
                        </span>
                      )}
                      {log.action === 'RESUBMITTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-full text-[10px] border border-amber-200">
                          <RefreshCw size={12} /> Resubmitted
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 max-w-sm">
                      {log.rejectionReason ? (
                        <p className="text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 text-[11px] font-medium">
                          <strong>Reason:</strong> {log.rejectionReason}
                        </p>
                      ) : (
                        <span className="text-slate-400">{log.notes || 'N/A'}</span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-400 font-medium">
                      No matching audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalLogsAdmin;
