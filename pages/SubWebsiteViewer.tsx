import React from 'react';
import { SubWebsite } from '../types';

interface SubWebsiteViewerProps {
  website: SubWebsite;
  onNavigate: (path: string) => void;
}

const SubWebsiteViewer: React.FC<SubWebsiteViewerProps> = ({ website }) => {
  return (
    <div className="fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-white dark:bg-slate-950">
      <iframe
        id="subwebsite-iframe"
        src={website.targetUrl}
        title={website.name}
        className="w-full h-full border-none block"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      />
    </div>
  );
};

export default SubWebsiteViewer;
