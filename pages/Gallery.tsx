import React, { useState, useEffect } from 'react';
import { Camera, Maximize2, ExternalLink } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { GALLERY_ITEMS, formatImageUrl } from '../constants';
import { GalleryItem } from '../types';

const Gallery: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const [localItems, setLocalItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('admin_gallery_items');
    if (stored) {
      try {
        setLocalItems(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse local gallery items', e);
      }
    }
  }, []);

  // Show newest local items first, then the static constants
  const allGalleryItems = [...[...localItems].reverse(), ...GALLERY_ITEMS];
  const categories = ['All', ...new Set(allGalleryItems.map(item => item.category))];

  const filteredItems = filter === 'All' 
    ? allGalleryItems 
    : allGalleryItems.filter(item => item.category === filter);

  return (
    <div className="pt-40 px-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-20 border-b-[8px] border-black pb-12">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">THE VAULT.</h1>
          <p className="text-2xl font-black uppercase text-indigo-600">Visual proof of our impact.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 border-[3px] border-black text-sm font-black uppercase transition-all
                ${filter === cat 
                  ? 'bg-black text-white shadow-none translate-x-1 translate-y-1' 
                  : 'bg-[#FFDE03] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#00FFFF]'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredItems.map((item) => {
          const content = (
            <GlassCard key={item.id} className="p-0 border-black group overflow-hidden bg-black h-full cursor-pointer transition-transform hover:-translate-y-1">
              <div className="relative aspect-square overflow-hidden border-b-[4px] border-black">
                <img 
                  src={formatImageUrl(item.image)} 
                  alt={item.title} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white border-[2px] border-black font-black uppercase text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {item.category}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                   {item.link ? <ExternalLink className="text-white w-10 h-10" /> : <Maximize2 className="text-white w-10 h-10" />}
                </div>
              </div>
              <div className="p-6 bg-white flex justify-between items-start gap-2 h-full">
                <h3 className="text-xl font-black uppercase leading-tight line-clamp-2">{item.title}</h3>
                {item.link && <ExternalLink size={20} className="text-blue-600 flex-shrink-0" />}
              </div>
            </GlassCard>
          );

          if (item.link) {
            return (
              <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="block h-full">
                {content}
              </a>
            );
          }

          return <div key={item.id} className="block h-full">{content}</div>;
        })}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border-[4px] border-dashed border-black bg-gray-50">
          <Camera size={64} className="mb-6 opacity-20" />
          <h2 className="text-3xl font-black uppercase opacity-20">Nothing captured yet.</h2>
        </div>
      )}
    </div>
  );
};

export default Gallery;
