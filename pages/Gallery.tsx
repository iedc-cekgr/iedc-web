import React, { useState, useEffect } from 'react';
import { Camera, Maximize2, ExternalLink } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { formatImageUrl } from '../constants';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { GalleryItem } from '../types';

const Gallery: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'gallery'));
        const galleryData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
        
        // Restore original order for seeded items, and put newly added ones at the top
        const originalOrder = [14, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        galleryData.sort((a: any, b: any) => {
          const indexA = originalOrder.indexOf(a.id);
          const indexB = originalOrder.indexOf(b.id);
          
          if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Keep original order
          if (indexA === -1 && indexB !== -1) return -1; // New items (not in array) go first
          if (indexA !== -1 && indexB === -1) return 1;
          return b.id - a.id; // If both are new, sort by ID descending (newest first)
        });

        setItems(galleryData);
      } catch (error) {
        console.error("Error fetching gallery:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const categories = ['All', ...new Set(items.map(item => item.category))];

  const filteredItems = filter === 'All' 
    ? items 
    : items.filter(item => item.category === filter);

  if (loading) {
    return (
      <div className="pt-40 px-6 max-w-7xl mx-auto pb-20 flex justify-center items-center min-h-[50vh]">
        <p className="text-2xl font-black uppercase">Loading Vault...</p>
      </div>
    );
  }

  return (
    <div className="pt-40 px-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-20 border-b-[8px] border-black dark:border-white pb-12">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">THE VAULT.</h1>
          <p className="text-2xl font-black uppercase text-indigo-600">Visual proof of our impact.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 border-[3px] rounded-[10px] border-black dark:border-white text-sm font-black uppercase transition-all
                ${filter === cat 
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-none translate-x-1 translate-y-1' 
                  : 'bg-[#FFDE03] text-black dark:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:bg-[#00FFFF]'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredItems.map((item: any) => {
          const cardInner = (
            <>
              <div className="relative aspect-square overflow-hidden border-b-[4px] border-black dark:border-white">
                <img 
                  src={formatImageUrl(item.image)} 
                  alt={item.title} 
                  className="w-full h-full object-cover md:grayscale md:group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white dark:bg-slate-900 border-[2px] border-black dark:border-white font-black uppercase text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                    {item.category}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black dark:bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  {item.driveLink ? (
                    <ExternalLink className="text-white w-10 h-10" />
                  ) : (
                    <Maximize2 className="text-white w-10 h-10" />
                  )}
                </div>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 h-full">
                <h3 className="text-xl font-black uppercase leading-tight line-clamp-2">{item.title}</h3>
              </div>
            </>
          );

          return (
            <GlassCard key={item.id} className="p-0 border-black dark:border-white group overflow-hidden bg-black dark:bg-white flex flex-col h-full">
              {item.driveLink ? (
                <a href={item.driveLink} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                  {cardInner}
                </a>
              ) : (
                <div className="block w-full h-full">
                  {cardInner}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border-[4px] border-dashed border-black dark:border-white bg-gray-50">
          <Camera size={64} className="mb-6 opacity-20" />
          <h2 className="text-3xl font-black uppercase opacity-20">Nothing captured yet.</h2>
        </div>
      )}
    </div>
  );
};

export default Gallery;
