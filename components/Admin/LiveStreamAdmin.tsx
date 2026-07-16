import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Save, RefreshCw, AlertCircle, ToggleLeft, ToggleRight, Radio, Calendar, Info } from 'lucide-react';

interface StreamSettings {
  youtubeId: string;
  status: 'upcoming' | 'live' | 'ended';
  scheduledTime: string;
  title: string;
  description: string;
  showIeeePartner: boolean;
  showIeeeLogoImage: boolean;
}

const LiveStreamAdmin: React.FC = () => {
  const [settings, setSettings] = useState<StreamSettings>({
    youtubeId: '',
    status: 'upcoming',
    scheduledTime: '',
    title: 'CEK SUPER LEAGUE SEASON 1 - MEGA FOOTBALL AUCTION',
    description: 'Watch the live auction of CEK Super League Season 1, where teams bid for the finest players.',
    showIeeePartner: false,
    showIeeeLogoImage: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'config', 'live_stream');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setSettings({
          youtubeId: data.youtubeId || '',
          status: data.status || 'upcoming',
          scheduledTime: data.scheduledTime || '',
          title: data.title || 'CEK SUPER LEAGUE SEASON 1 - MEGA FOOTBALL AUCTION',
          description: data.description || '',
          showIeeePartner: data.showIeeePartner || false,
          showIeeeLogoImage: data.showIeeeLogoImage || false
        });
      } else {
        // Initialize with default settings
        await setDoc(docRef, settings);
      }
    } catch (err) {
      console.error("Error fetching stream settings:", err);
      setMessage({ type: 'error', text: 'Failed to load live stream configuration.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const docRef = doc(db, 'config', 'live_stream');
      await setDoc(docRef, {
        ...settings,
        updatedAt: new Date()
      });
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (err) {
      console.error("Error saving stream settings:", err);
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggleLive = async () => {
    setSaving(true);
    setMessage(null);
    const newStatus = settings.status === 'live' ? 'ended' : 'live';
    try {
      const docRef = doc(db, 'config', 'live_stream');
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      setSettings(prev => ({ ...prev, status: newStatus }));
      setMessage({ type: 'success', text: `Stream marked as ${newStatus.toUpperCase()}!` });
    } catch (err) {
      console.error("Error toggling live state:", err);
      setMessage({ type: 'error', text: 'Failed to update live status.' });
    } finally {
      setSaving(false);
    }
  };

  // Helper to extract video ID from various YouTube URL formats
  const handleUrlPaste = (val: string) => {
    let extractedId = val.trim();
    
    // Check if it's a URL
    if (extractedId.includes('youtube.com') || extractedId.includes('youtu.be')) {
      try {
        const url = new URL(extractedId);
        if (extractedId.includes('youtu.be/')) {
          extractedId = url.pathname.slice(1);
        } else if (url.searchParams.has('v')) {
          extractedId = url.searchParams.get('v') || '';
        } else if (extractedId.includes('embed/')) {
          extractedId = url.pathname.split('embed/')[1]?.split('?')[0] || '';
        } else if (extractedId.includes('live/')) {
          extractedId = url.pathname.split('live/')[1]?.split('?')[0] || '';
        }
      } catch (e) {
        // Fallback to original value if URL parsing fails
      }
    }
    
    setSettings(prev => ({ ...prev, youtubeId: extractedId }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
        <p className="font-bold uppercase text-slate-500 text-sm">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Header Banner */}
      <div className="p-6 bg-white dark:bg-slate-900 border-[4px] border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase text-black dark:text-white tracking-tight">CSL Live Stream Config</h2>
          <p className="text-sm font-bold uppercase text-slate-500 mt-1">Configure YouTube Live embed, statuses, and custom headers.</p>
        </div>
        
        <button
          type="button"
          onClick={handleQuickToggleLive}
          disabled={saving}
          className={`flex items-center gap-3 px-6 py-3 border-[4px] border-black dark:border-white font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all text-white ${
            settings.status === 'live' ? 'bg-red-600' : 'bg-slate-700 hover:bg-red-500'
          }`}
        >
          {saving ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : settings.status === 'live' ? (
            <>
              <Radio className="w-6 h-6 animate-pulse" />
              STREAM IS LIVE: END IT
            </>
          ) : (
            <>
              <Radio className="w-6 h-6" />
              GO LIVE NOW
            </>
          )}
        </button>
      </div>

      {message && (
        <div className={`p-4 border-2 border-black font-bold text-sm uppercase rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Stream Settings */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border-[4px] border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl space-y-6">
          <h3 className="text-xl font-black uppercase text-black dark:text-white border-b-2 border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500" /> YouTube Stream Settings
          </h3>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              YouTube Video ID / URL *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. dQw4w9WgXcQ or paste full YouTube URL"
              value={settings.youtubeId}
              onChange={(e) => handleUrlPaste(e.target.value)}
              className="w-full p-3 border-2 border-black dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-black dark:text-white outline-none font-bold focus:border-[#00FFFF]"
            />
            <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              You can paste any YouTube URL (live, watch link, mobile, or embed format) and we will extract the ID.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                Stream Status *
              </label>
              <select
                value={settings.status}
                onChange={(e) => setSettings(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full p-3 border-2 border-black dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-black dark:text-white font-bold rounded-lg outline-none focus:border-[#FFDE03]"
              >
                <option value="upcoming">Upcoming (Show Countdown)</option>
                <option value="live">Live Now (Show Stream & Live Badges)</option>
                <option value="ended">Ended (Show Stream Ended Message)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                Scheduled Time (For Countdown)
              </label>
              <input
                type="datetime-local"
                value={settings.scheduledTime}
                onChange={(e) => setSettings(prev => ({ ...prev, scheduledTime: e.target.value }))}
                disabled={settings.status !== 'upcoming'}
                className="w-full p-3 border-2 border-black dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-black dark:text-white outline-none font-bold focus:border-[#FFDE03] disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              Event Title
            </label>
            <input
              type="text"
              required
              value={settings.title}
              onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. CEK SUPER LEAGUE SEASON 1 - MEGA FOOTBALL AUCTION"
              className="w-full p-3 border-2 border-black dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-black dark:text-white outline-none font-bold focus:border-[#FF00FF]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              Event Description
            </label>
            <textarea
              rows={4}
              value={settings.description}
              onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide context about the live stream event..."
              className="w-full p-3 border-2 border-black dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-black dark:text-white outline-none font-bold focus:border-[#FF00FF]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#00FFFF] text-black border-[4px] border-black font-black py-3 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-2"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Save Stream Configuration'}
          </button>
        </div>

        {/* Sidebar Controls (Partner details, instructions) */}
        <div className="lg:col-span-1 space-y-8">
          {/* Partners Visibility */}
          <div className="p-6 bg-white dark:bg-slate-900 border-[4px] border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl space-y-6">
            <h3 className="text-xl font-black uppercase text-black dark:text-white border-b-2 border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Partner Settings
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border-2 border-black rounded-lg bg-slate-50 dark:bg-slate-800">
                <div>
                  <div className="font-black text-sm uppercase text-black dark:text-white">IEDC CEK</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Branding & Ecosystem Partner</div>
                </div>
                <span className="inline-flex px-2.5 py-1 text-[10px] font-black uppercase bg-green-150 text-green-800 border border-green-300 rounded">
                  ALWAYS ON
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, showIeeePartner: !prev.showIeeePartner }))}
                className="w-full flex items-center justify-between p-3 border-2 border-black rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div>
                  <div className="font-black text-sm uppercase text-left text-black dark:text-white">IEEE CEK Partner</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Technical Partner display</div>
                </div>
                <div className="text-slate-800 dark:text-slate-200">
                  {settings.showIeeePartner ? (
                    <div className="flex items-center gap-1.5 text-green-600 font-black text-xs uppercase">
                      <ToggleRight className="w-8 h-8" />
                      ACTIVE
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400 font-black text-xs uppercase">
                      <ToggleLeft className="w-8 h-8" />
                      HIDDEN
                    </div>
                  )}
                </div>
              </button>

              {settings.showIeeePartner && (
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, showIeeeLogoImage: !prev.showIeeeLogoImage }))}
                  className="w-full flex items-center justify-between p-3 border-2 border-black rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors animate-in slide-in-from-top-2 duration-250"
                >
                  <div>
                    <div className="font-black text-sm uppercase text-left text-black dark:text-white">IEEE Logo Type</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Logo Image vs Text Placeholder</div>
                  </div>
                  <div className="text-slate-800 dark:text-slate-200">
                    {settings.showIeeeLogoImage ? (
                      <div className="flex items-center gap-1.5 text-indigo-600 font-black text-xs uppercase">
                        <ToggleRight className="w-8 h-8" />
                        IMAGE
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-500 font-black text-xs uppercase">
                        <ToggleLeft className="w-8 h-8" />
                        TEXT ONLY
                      </div>
                    )}
                  </div>
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase">
              Note: Keep IEEE Logo Type set to "Text Only" until you save the real logo file to `images/ieee_logo.png` on your computer, then toggle it to "Image".
            </p>
          </div>

          {/* Quick Info / Live URLs */}
          <div className="p-6 bg-[#FFDE03] text-black border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl space-y-4">
            <h3 className="text-xl font-black uppercase border-b-2 border-black pb-3">
              Event Shortcuts
            </h3>
            <p className="text-sm font-bold leading-tight">
              Users can view the live streaming page by typing these short links into their browser:
            </p>
            <div className="space-y-2 text-xs font-mono font-bold">
              <div className="bg-white p-2 border-2 border-black rounded">
                /csl
              </div>
              <div className="bg-white p-2 border-2 border-black rounded">
                /live
              </div>
              <div className="bg-white p-2 border-2 border-black rounded">
                /auction
              </div>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-700">
              When accessing through a mapped domain (e.g. cslauction.com), the root homepage `/` will serve this page automatically.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LiveStreamAdmin;
