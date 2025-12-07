import React from 'react';
import Sidebar from '../sidebar.jsx';

export default function SidebarDrawer({
  open = false,
  activePanel = 'home',
  onSelect = () => {},
  onClose = () => {},
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 md:hidden"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
      <div
        className="absolute inset-y-0 left-0 w-full max-w-xs bg-white/65 backdrop-blur-lg p-4 shadow-2xl shadow-slate-500/30"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRight: '1px solid rgba(0,0,0,0.06)' }}
      >
        <Sidebar
          active={activePanel}
          onChange={(panel) => {
            onSelect(panel);
          }}
          variant="embedded"
          widthClass="w-full"
        />
      </div>
    </div>
  );
}
