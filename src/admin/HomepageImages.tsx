import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Upload, Save } from 'lucide-react';

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

      await fetchImages();
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setSaving(null);
    }
  };

  // Ensure these always show up
  const expectedImages = [
    { id: 'hero', label: 'Hero Image' },
    { id: 'lobby', label: 'Lobby Image' },
    { id: 'restaurant', label: 'Restaurant Image' },
  ];

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#d4af37]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Homepage Images</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {expectedImages.map(imgData => {
          const record = images.find(r => r.id === imgData.id);
          const isSaving = saving === imgData.id;

          return (
            <div key={imgData.id} className="bg-[#1a1b1e] border border-[#2a2d32] rounded-lg p-4">
              <h4 className="font-medium text-white mb-4">{imgData.label}</h4>
              
              <div className="aspect-video bg-[#0f1011] rounded overflow-hidden mb-4 border border-[#2a2d32] relative group">
                {record?.url ? (
                  <img src={record.url} className="w-full h-full object-cover" alt={imgData.label} />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-sm text-[#9ca3af]">No Image</div>
                )}
                
                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {isSaving ? (
                    <Loader2 className="animate-spin text-white mb-2" />
                  ) : (
                    <>
                      <Upload className="text-white mb-2" />
                      <span className="text-sm font-medium text-white">Upload Replacement</span>
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

              {record?.url && (
                <div className="text-xs text-[#9ca3af] truncate" title={record.url}>Current: {record.url}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
