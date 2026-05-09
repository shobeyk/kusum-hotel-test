import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Edit2, Loader2, Save, X, Plus, Upload, Trash2, AlertTriangle, Bed } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoomsManager() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit & Add State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<any>({ name: '', price: 0, description: '', image_url: '' });
  
  // Actions states
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    const { data } = await supabase.from('rooms').select('*').order('created_at');
    setRooms(data || []);
    setLoading(false);
  };

  const startEdit = (room: any) => {
    setEditingId(room.id);
    setIsAdding(false);
    setEditForm(room);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setEditForm({ name: '', price: 0, description: '', image_url: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `room-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('hotel-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('hotel-images')
        .getPublicUrl(filePath);

      setEditForm({ ...editForm, image_url: data.publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const saveRoom = async () => {
    if (!editForm.name) {
      toast.error('Room name is required');
      return;
    }
    if (!editForm.price || editForm.price <= 0) {
      toast.error('Valid price is required');
      return;
    }

    setSaving(true);

    try {
      if (isAdding) {
        const { error } = await supabase.from('rooms').insert([editForm]);
        if (error) throw error;
        toast.success('Room created successfully!');
      } else {
        const { error } = await supabase.from('rooms').update({
          name: editForm.name,
          price: editForm.price,
          description: editForm.description,
          image_url: editForm.image_url
        }).eq('id', editingId);
        if (error) throw error;
        toast.success('Room updated successfully!');
      }
      
      setEditingId(null);
      setIsAdding(false);
      fetchRooms();
    } catch (error: any) {
      toast.error('Error saving room: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) throw error;
      toast.success('Room deleted successfully!');
      setDeletingId(null);
      fetchRooms();
    } catch (error: any) {
      toast.error('Error deleting room: ' + error.message);
    }
  };

  if (loading && rooms.length === 0) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#d4af37]" /></div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between border-b border-[#2a2d32] pb-4">
        <h3 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Rooms Management</h3>
        <button 
          onClick={startAdd}
          className="bg-[#d4af37] text-black px-5 py-2.5 rounded shadow flex items-center font-medium hover:bg-[#f3e5ab] transition-all"
        >
          <Plus className="h-5 w-5 mr-2" /> Add New Room
        </button>
      </div>

      {/* Adding / Editing Form Area */}
      {(isAdding || editingId) && (
        <div className="bg-[#1a1b1e] border border-[#d4af37]/30 shadow-2xl rounded-xl p-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#2a2d32]">
            <h4 className="text-xl font-medium text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {isAdding ? 'Create a New Room' : `Edit ${editForm.name}`}
            </h4>
            <button onClick={cancelEdit} className="text-[#9ca3af] hover:text-white p-2 bg-[#0f1011] rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Col: Form fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Room Name <span className="text-red-400">*</span></label>
                <input 
                  className="w-full bg-[#0f1011] border border-[#2a2d32] rounded-lg p-3.5 text-white focus:border-[#d4af37] transition-colors outline-none" 
                  placeholder="e.g. Deluxe AC Room"
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-2">Price per Night (₹) <span className="text-red-400">*</span></label>
                <input 
                  type="number"
                  className="w-full bg-[#0f1011] border border-[#2a2d32] rounded-lg p-3.5 text-white focus:border-[#d4af37] transition-colors outline-none" 
                  value={editForm.price} 
                  onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})} 
                />
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-[#9ca3af]">Description</label>
                  <span className="text-xs text-[#9ca3af]/50 italic">Optional</span>
                </div>
                <textarea 
                  className="w-full bg-[#0f1011] border border-[#2a2d32] rounded-lg p-3.5 text-white focus:border-[#d4af37] transition-colors outline-none" 
                  rows={5}
                  placeholder="Describe the room layout, features, and vibe..."
                  value={editForm.description} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})} 
                />
              </div>
            </div>

            {/* Right Col: Image Upload */}
            <div className="space-y-6">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-medium text-[#9ca3af]">Room Image Preview</label>
              </div>
              <div 
                className="aspect-video bg-[#0f1011] border-2 border-dashed border-[#2a2d32] rounded-xl overflow-hidden relative group transition-colors hover:border-[#d4af37]/50"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {editForm.image_url ? (
                  <img src={editForm.image_url} alt="Room Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-[#9ca3af]">
                    <ImageIcon className="h-10 w-10 mb-3 opacity-30" />
                    <span className="text-sm font-medium mb-1">Drag & Drop Image Here</span>
                    <span className="text-xs opacity-70">or click to browse files</span>
                  </div>
                )}
                
                <label className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                  {uploading ? (
                    <Loader2 className="animate-spin text-[#d4af37] h-8 w-8 mb-2" />
                  ) : (
                    <>
                      <Upload className="text-white h-8 w-8 mb-2" />
                      <span className="text-sm font-semibold text-white uppercase tracking-wider">{editForm.image_url ? 'Replace Image' : 'Upload Image'}</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    disabled={uploading}
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                  />
                </label>
              </div>
              
              <div className="pt-2">
                <label className="block text-xs text-[#9ca3af] mb-1">Or paste an image URL directly</label>
                <input 
                  className="w-full bg-[#0f1011] border border-[#2a2d32] rounded p-2.5 text-xs text-white focus:border-[#d4af37] transition-colors outline-none" 
                  placeholder="https://..."
                  value={editForm.image_url} 
                  onChange={e => setEditForm({...editForm, image_url: e.target.value})} 
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#2a2d32] flex justify-end gap-3">
            <button 
              onClick={cancelEdit} 
              className="px-6 py-2.5 bg-[#2a2d32] hover:bg-[#32363b] text-white rounded font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={saveRoom} 
              disabled={saving || uploading}
              className="px-8 py-2.5 bg-[#d4af37] text-black font-semibold rounded shadow-md shadow-[#d4af37]/10 flex items-center hover:bg-[#f3e5ab] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
              {isAdding ? 'Create Room' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Grid of existing rooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {rooms.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center p-16 bg-[#1a1b1e] border border-[#2a2d32] rounded-xl border-dashed">
            <Bed className="h-12 w-12 text-[#9ca3af]/50 mb-4" />
            <h4 className="text-xl font-medium text-white mb-2">No Rooms Found</h4>
            <p className="text-[#9ca3af] mb-6 text-center max-w-sm">You haven't added any rooms yet. Add your first room to display it on the website.</p>
            <button onClick={startAdd} className="bg-transparent border border-[#d4af37] text-[#d4af37] px-6 py-2 rounded font-medium hover:bg-[#d4af37]/10 transition-colors">
              Add First Room
            </button>
          </div>
        )}

        {rooms.map((room) => (
          <div 
            key={room.id} 
            className={`flex flex-col bg-[#1a1b1e] border rounded-xl overflow-hidden shadow-lg transition-all 
              ${editingId === room.id ? 'border-[#d4af37] ring-1 ring-[#d4af37]' : 'border-[#2a2d32] hover:border-[#4a4d52]'}`}
          >
            {/* Image Section */}
            <div className="aspect-video bg-[#0f1011] relative border-b border-[#2a2d32]">
              {room.image_url ? (
                <img src={room.image_url} alt={room.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#2a2d32]/30">
                  <ImageIcon className="h-8 w-8 text-[#9ca3af]/30" />
                </div>
              )}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-sm font-semibold text-[#d4af37] border border-[#d4af37]/30">
                ₹{room.price}
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex-1 flex flex-col">
              <h4 className="text-lg font-bold text-white mb-2 line-clamp-1">{room.name}</h4>
              <p className="text-[#9ca3af] text-sm flex-1 line-clamp-3 mb-6">
                {room.description || <span className="italic opacity-50">No description provided.</span>}
              </p>
              
              <div className="flex gap-3 mt-auto pt-4 border-t border-[#2a2d32]">
                <button 
                  onClick={() => startEdit(room)} 
                  className="flex-1 bg-[#2a2d32] hover:bg-[#32363b] text-white py-2 rounded flex justify-center items-center font-medium transition-colors text-sm"
                >
                  <Edit2 className="h-4 w-4 mr-2 text-[#d4af37]" /> Edit Room
                </button>
                <button 
                  onClick={() => setDeletingId(room.id)}
                  className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded flex justify-center items-center transition-colors"
                  title="Delete Room"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1b1e] border border-[#2a2d32] rounded-xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-center text-white mb-2">Delete Room?</h3>
              <p className="text-center text-[#9ca3af] mb-8">
                Are you sure you want to delete this room? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeletingId(null)}
                  className="flex-1 px-4 py-2.5 border border-[#2a2d32] rounded font-medium hover:bg-[#2a2d32] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => confirmDelete(deletingId)}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
                >
                  Yes, Delete Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

