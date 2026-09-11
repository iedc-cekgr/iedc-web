import React, { useState } from 'react';
import { SubWebsite } from '../types';
import { ExternalLink, AlertTriangle, Globe } from 'lucide-react';

interface SubWebsiteViewerProps {
  website: SubWebsite;
  onNavigate: (path: string) => void;
}

const SubWebsiteViewer: React.FC<SubWebsiteViewerProps> = ({ website }) => {
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden">
      {/* Loading Spinner overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-3 border-blue-500/20 border-t-blue-500 animate-spin" />
            <Globe className="w-5 h-5 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Loading {website.name}...
          </p>
        </div>
      )}

      {/* Fallback Screen if external site blocks frame embedding */}
      {iframeError && (
        <div className="absolute inset-0 z-20 bg-slate-900 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">External Site Protected</h3>
            <p className="text-xs text-slate-400">
              This external site (<code className="text-blue-400">{website.targetUrl}</code>) restricts inside-frame embedding for security reasons.
            </p>
          </div>
          <a
            href={website.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg"
          >
            <ExternalLink className="w-4 h-4" />
            Open {website.name} Directly
          </a>
        </div>
      )}

      {/* 100% Full-Screen Clean Embedded Website iframe */}
      <iframe
        id="subwebsite-iframe"
        src={website.targetUrl}
        title={website.name}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setIframeError(true);
        }}
        className="w-full h-full border-none block"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      />
    </div>
  );
};

export default SubWebsiteViewer;
