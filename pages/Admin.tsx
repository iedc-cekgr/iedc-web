import React, { useState, useEffect } from 'react';
import { Lock, User, LogOut, Plus, Image as ImageIcon, Link as LinkIcon, Type, Trash2 } from 'lucide-react';
import { GalleryItem } from '../types';

interface AdminProps {
  onNavigate: (path: string) => void;
}

const Admin: React.FC<AdminProps> = ({ onNavigate }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Gallery Form State
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryCategory, setGalleryCategory] = useState('Event');
  const [galleryImage, setGalleryImage] = useState('');
  const [galleryLink, setGalleryLink] = useState('');
  const [gallerySuccess, setGallerySuccess] = useState('');
  const [savedItems, setSavedItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    if (isLoggedIn) {
      loadSavedItems();
    }
  }, [isLoggedIn]);

  const loadSavedItems = () => {
    const stored = localStorage.getItem('admin_gallery_items');
    if (stored) {
      setSavedItems(JSON.parse(stored));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default mock credentials: admin / admin123
    if (username === 'admin' && password === 'admin123') {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  const handleAddGalleryItem = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const stored = localStorage.getItem('admin_gallery_items');
      const items: GalleryItem[] = stored ? JSON.parse(stored) : [];
      
      const newItem: GalleryItem = {
        id: `local-${Date.now()}`,
        title: galleryTitle,
        category: galleryCategory,
        image: galleryImage,
        link: galleryLink || undefined,
      };

      items.push(newItem);
      localStorage.setItem('admin_gallery_items', JSON.stringify(items));
      setSavedItems(items);
      
      setGallerySuccess('Event added to gallery successfully!');
      setGalleryTitle('');
      setGalleryImage('');
      setGalleryLink('');
      
      setTimeout(() => setGallerySuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save gallery item');
    }
  };

  const handleDeleteItem = (id: string | number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      const updatedItems = savedItems.filter(item => item.id !== id);
      localStorage.setItem('admin_gallery_items', JSON.stringify(updatedItems));
      setSavedItems(updatedItems);
    }
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
          <header className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Lock className="text-blue-400" />
              <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate('/')} 
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                Back to Site
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-700 text-sm sm:text-base"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </header>
          
          <main className="p-8">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <Plus size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Add Event to Gallery</h2>
                  <p className="text-sm text-slate-500">This will appear in the main gallery immediately.</p>
                </div>
              </div>

              {gallerySuccess && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                  {gallerySuccess}
                </div>
              )}

              <form onSubmit={handleAddGalleryItem} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Event Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Type className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={galleryTitle}
                      onChange={(e) => setGalleryTitle(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                      placeholder="e.g. Hack The Mind 2025"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={galleryCategory}
                    onChange={(e) => setGalleryCategory(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  >
                    <option value="Event">Event</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Competition">Competition</option>
                    <option value="Talk Session">Talk Session</option>
                    <option value="Industrial Visit">Industrial Visit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Poster Image URL (Cloudinary, Imgur, etc.)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ImageIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="url"
                      value={galleryImage}
                      onChange={(e) => setGalleryImage(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                      placeholder="https://res.cloudinary.com/..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Google Drive / Photos Link (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="url"
                      value={galleryLink}
                      onChange={(e) => setGalleryLink(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Users will be redirected here when they click the image.</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add to Gallery
                </button>
              </form>
            </div>

            {/* Manage Added Items */}
            <div className="max-w-2xl mx-auto mt-8 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Manage Added Events</h2>
              
              {savedItems.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                  <p>No custom events added yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-16 h-16 object-cover rounded-md border border-slate-200 flex-shrink-0"
                          onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')}
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-800 truncate">{item.title}</h3>
                          <p className="text-sm text-slate-500">{item.category}</p>
                          {item.link && (
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block max-w-[200px] sm:max-w-[300px]">
                              {item.link}
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="Delete Event"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px]"></div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden border border-slate-100">
        {/* Decorative background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-slate-800 to-slate-900"></div>
        
        <div className="relative flex justify-center mb-8 mt-4">
          <div className="bg-white p-4 rounded-full shadow-lg border border-slate-100">
            <Lock className="w-8 h-8 text-slate-800" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">Admin Login</h2>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                placeholder="Enter admin username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                placeholder="Enter admin password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 text-white font-medium py-3 rounded-lg hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all shadow-lg"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <button 
            onClick={() => onNavigate('/')}
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            &larr; Return to main site
          </button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
