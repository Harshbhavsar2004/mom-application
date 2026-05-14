import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import LoadingState from './LoadingState';

const AssetProvisioning = ({ visitData, onUpdate, onBack, onNext }) => {
  const assets = visitData.assets || [];
  const [newAsset, setNewAsset] = useState({ name: "", type: "Deliverable" });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAddAsset = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/server/agenda_function/speaker/upload-asset", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.status === "success") {
        const updatedAssets = [...assets, { 
          id: Date.now().toString(),
          name: file.name,
          fileKey: result.data.fileKey,
          type: file.type || "application/octet-stream"
        }];
        onUpdate({ ...visitData, assets: updatedAssets });
      } else {
        alert("Upload failed: " + result.message);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAsset = (id) => {
    const updatedAssets = assets.filter(a => a.id !== id);
    onUpdate({ ...visitData, assets: updatedAssets });
  };

  return (
    <div className="console-card">
      <div className="p-8 border-b border-slate-300 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Speaker Assets</h3>
          <p className="text-sm text-slate-500 font-medium">Provision internal deliverables and technical resources.</p>
        </div>
        <div className="flex gap-4">
           <input 
             type="file"
             className="hidden"
             ref={fileInputRef}
             onChange={handleAddAsset}
           />
           <Button 
            className="bg-slate-800 text-white h-9 px-4 rounded font-bold text-xs flex items-center gap-2" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
           >
              <span className="material-symbols-outlined text-[16px]">
                {uploading ? 'sync' : 'cloud_upload'}
              </span>
              {uploading ? 'Uploading...' : 'Upload Resource'}
           </Button>
        </div>
      </div>
      <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]">
        {loading ? (
          <div className="col-span-full">
            <LoadingState message="Initializing Technical Resources..." />
          </div>
        ) : (
          <>
            {assets.map((asset) => (
              <div key={asset.id} className="p-5 rounded-lg border border-slate-300 flex items-center gap-4 hover:bg-slate-50 transition-all cursor-default group shadow-sm bg-white">
                 <div className="size-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 uppercase text-[10px] font-black">
                   {asset.type[0]}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{asset.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{asset.type}</p>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 text-slate-300 hover:text-red-600 rounded opacity-0 group-hover:opacity-100"
                   onClick={() => handleDeleteAsset(asset.id)}
                 >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                 </Button>
              </div>
            ))}
            {assets.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-6">
                <div className="size-16 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mx-auto border border-dashed border-slate-300">
                  <span className="material-symbols-outlined text-[32px]">folder_special</span>
                </div>
                <div className="space-y-2">
                   <h4 className="text-base font-bold text-slate-800">No Assets Provisioned</h4>
                   <p className="text-sm text-slate-500 max-w-xs mx-auto font-medium lead-relaxed">Provision technical blueprints, briefing books, and speaker bios here.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="p-6 bg-slate-50 border-t border-slate-300 flex justify-end gap-3 rounded-b-lg">
        <Button variant="ghost" className="font-bold text-slate-500 text-xs h-9 px-6" onClick={onBack}>Back</Button>
        <Button className="bg-primary text-white font-bold text-xs h-9 px-8 rounded shadow-md font-poppins" onClick={onNext}>Verify Final Architecture</Button>
      </div>
    </div>
  );
};

export default AssetProvisioning;
