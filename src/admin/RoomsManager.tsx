import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Edit2, Loader2, Save, X } from 'lucide-react';

export default function RoomsManager() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

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
    setEditForm(room);
  };

  const saveEdit = async () => {
    setSaving(true);
    const { error } = await supabase.from('rooms').update({
      name: editForm.name,
      price: editForm.price,
      description: editForm.description,
      image_url: editForm.image_url
    }).eq('id', editingId);

    setSaving(false);
    if (!error) {
      setEditingId(null);
      fetchRooms();
    } else {
      alert("Error saving room: " + error.message);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#d4af37]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Room Management</h3>
      </div>

      <div className="bg-[#1a1b1e] border border-[#2a2d32] rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-[#2a2d32]">
          <thead className="bg-[#0f1011]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Room Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Price/Night</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#9ca3af] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2d32]">
            {rooms.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-[#9ca3af]">No rooms found. Please add them in Supabase.</td>
              </tr>
            )}
            {rooms.map((room) => (
              <tr key={room.id}>
                {editingId === room.id ? (
                  <td colSpan={3} className="px-6 py-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-[#9ca3af] mb-1">Room Name</label>
                        <input className="w-full bg-[#0f1011] border border-[#2a2d32] rounded p-2 text-white" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs text-[#9ca3af] mb-1">Description</label>
                        <textarea className="w-full bg-[#0f1011] border border-[#2a2d32] rounded p-2 text-white" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={3} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-[#9ca3af] mb-1">Price</label>
                          <input type="number" className="w-full bg-[#0f1011] border border-[#2a2d32] rounded p-2 text-white" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs text-[#9ca3af] mb-1">Image URL</label>
                          <input className="w-full bg-[#0f1011] border border-[#2a2d32] rounded p-2 text-white" value={editForm.image_url} onChange={e => setEditForm({...editForm, image_url: e.target.value})} />
                        </div>
                      </div>
                      {editForm.image_url && (
                        <div className="mt-2 text-xs text-[#9ca3af]">
                          Image Preview:
                          <img src={editForm.image_url} alt="Preview" className="h-24 object-cover mt-1 rounded border border-[#2a2d32]" />
                        </div>
                      )}
                      <div className="pt-2 flex justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm border border-[#2a2d32] rounded hover:bg-[#2a2d32]">Cancel</button>
                        <button onClick={saveEdit} disabled={saving} className="px-3 py-1.5 text-sm bg-[#d4af37] text-black rounded flex items-center hover:bg-[#f3e5ab]">
                          {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save
                        </button>
                      </div>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-16 w-16 flex-shrink-0 bg-[#0f1011] rounded border border-[#2a2d32] overflow-hidden leading-none">
                          {room.image_url ? (
                            <img src={room.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-[#9ca3af]">No Img</div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{room.name}</div>
                          <div className="text-sm text-[#9ca3af] line-clamp-1">{room.description || 'No description'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">₹{room.price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => startEdit(room)} className="text-[#d4af37] hover:text-[#f3e5ab] flex items-center ml-auto">
                        <Edit2 className="h-4 w-4 mr-1" /> Edit
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
