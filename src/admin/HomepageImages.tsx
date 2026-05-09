import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomepageImages() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    const { data } = await supabase.from('page_images').select('*');
    if (data) setImages(data);
    setLoading(false);
  };

  const uploadImage = async (id: string, file: File) => {
    try {
      setSaving(id);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('hotel-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('hotel-images')
        .getPublicUrl(filePath);

      const url = data.publicUrl;

      // Update DB record
      const { error: dbError } = await supabase
        .from('page_images')
        .upsert({ id, url });

      if (dbError) throw dbError;

      toast.success('Image updated successfully');
      await fetchImages();
    } catch (error: any) {
      toast.error('Error uploading image: ' + error.message);
    } finally {
      setSaving(null);
    }
  };

  const deleteGalleryImage = async (id: string) => {
    try {
      const { error } = await supabase.from('page_images').delete().eq('id', id);
      if (error) throw error;
      toast.success('Gallery image removed');
      fetchImages();
    } catch (error: any) {
      toast.error('Error removing image: ' + error.message);
    }
  };

  const handleGalleryUpload = (file: File) => {
    const galleryCount = galleryImages.length;
    if (galleryCount >= 6) {
      toast.error('Maximum 6 gallery images allowed. Please remove one first.');
      return;
    }
    const id = `gallery_${Date.now()}`;
    uploadImage(id, file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropGallery = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleGalleryUpload(e.dataTransfer.files[0]);
    }
  };

  // Core Images
  const expectedImages = [
    { id: 'hero', label: 'Hero Section Image', desc: 'Main image seen when landing on the website' },
    { id: 'restaurant', label: 'Restaurant Image', desc: 'Image shown in the Dining section' },
  ];

  const galleryImages = images.filter(img => img.id.startsWith('gallery_'));

  if (loading && images.length === 0) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#d4af37]" /></div>;

  return (
    <div className="space-y-12 pb-10">
      <div>
        <div className="border-b border-[#2a2d32] pb-4 mb-6">
          <h3 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Homepage Images</h3>
          <p className="text-[#9ca3af] mt-2">Manage the main visual sections of your website's homepage.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {expectedImages.map(imgData => {
            const record = images.find(r => r.id === imgData.id);
            const isSaving = saving === imgData.id;

            return (
              <div key={imgData.id} className="bg-[#1a1b1e] border border-[#2a2d32] rounded-xl overflow-hidden shadow-lg flex flex-col transition-all hover:border-[#4a4d52]">
                <div className="aspect-[4/3] bg-[#0f1011] relative group border-b border-[#2a2d32]"
                     onDragOver={handleDragOver}
                     onDrop={(e) => {
                       e.preventDefault();
                       if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                         uploadImage(imgData.id, e.dataTransfer.files[0]);
                       }
                     }}>
                  {record?.url ? (
                    <img src={record.url} className="w-full h-full object-cover" alt={imgData.label} />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-sm text-[#9ca3af]">
                      <ImageIcon className="h-8 w-8 mb-2 opacity-30" />
                      No Image Set
                    </div>
                  )}
                  
                  <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                    {isSaving ? (
                      <Loader2 className="animate-spin text-[#d4af37] h-8 w-8 mb-2" />
                    ) : (
                      <>
                        <Upload className="text-white h-8 w-8 mb-2" />
                        <span className="text-sm font-semibold text-white uppercase tracking-wider">Upload Replacement</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      disabled={isSaving}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          uploadImage(imgData.id, e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-white mb-1 text-lg">{imgData.label}</h4>
                    <p className="text-xs text-[#9ca3af]">{imgData.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="border-b border-[#2a2d32] pb-4 gap-4 mb-6 flex flex-col md:flex-row md:items-end justify-between">
          <div>
            <h3 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Photo Gallery</h3>
            <p className="text-[#9ca3af] mt-2">Manage the photo gallery shown at the bottom of the homepage.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${galleryImages.length >= 6 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20'}`}>
              {galleryImages.length}/6 Images Used
            </span>
            {galleryImages.length < 6 && (
              <label className="bg-[#d4af37] text-black px-4 py-2 rounded shadow flex items-center font-medium hover:bg-[#f3e5ab] transition-all cursor-pointer text-sm">
                <Upload className="h-4 w-4 mr-2" /> Upload Gallery Image
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleGalleryUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>

        {galleryImages.length === 0 && (
          <div 
            className="flex flex-col items-center justify-center p-16 bg-[#1a1b1e] border-2 border-dashed border-[#2a2d32] rounded-xl hover:border-[#d4af37]/50 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDropGallery}
          >
            <ImageIcon className="h-12 w-12 text-[#9ca3af]/50 mb-4" />
            <h4 className="text-xl font-medium text-white mb-2">Gallery is empty</h4>
            <p className="text-[#9ca3af] mb-4 text-center max-w-sm">Drag and drop images here, or use the upload button above.</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {galleryImages.map(img => (
            <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-[#0f1011] border border-[#2a2d32]">
              <img src={img.url} className="w-full h-full object-cover" alt="Gallery" />
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => deleteGalleryImage(img.id)}
                  className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors shadow-lg"
                  title="Remove Image"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
          
          {galleryImages.length > 0 && galleryImages.length < 6 && (
            <label 
              className="relative aspect-square rounded-xl overflow-hidden bg-[#1a1b1e] border-2 border-dashed border-[#2a2d32] hover:border-[#d4af37]/50 transition-colors flex flex-col items-center justify-center cursor-pointer group"
              onDragOver={handleDragOver}
              onDrop={handleDropGallery}
            >
              <Upload className="h-6 w-6 text-[#9ca3af] group-hover:text-[#d4af37] mb-2 transition-colors" />
              <span className="text-xs text-[#9ca3af] font-medium group-hover:text-[#d4af37] transition-colors">Add Image</span>
              {saving?.startsWith('gallery_') && (
                <div className="absolute inset-0 bg-[#1a1b1e]/80 flex items-center justify-center">
                  <Loader2 className="animate-spin text-[#d4af37]" />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleGalleryUpload(e.target.files[0]);
                  }
                }}
              />
            </label>
          )}
          {saving?.startsWith('gallery_') && galleryImages.length === 0 && (
             <div className="relative aspect-square rounded-xl overflow-hidden bg-[#1a1b1e] border-2 border-[#2a2d32] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#d4af37] h-8 w-8" />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
