import React, { useEffect, useRef } from 'react';
import { NavViewKey } from '../../types';
import { getViewUrl } from '../../utils/navigation';
import { 
  ExternalLink, 
  PlusCircle, 
  Copy, 
  RefreshCw, 
  Layers,
  Sparkles
} from 'lucide-react';

interface NavContextMenuProps {
  x: number;
  y: number;
  navKey: NavViewKey;
  label: string;
  onClose: () => void;
  onSelectView: (key: NavViewKey) => void;
}

export const NavContextMenu: React.FC<NavContextMenuProps> = ({
  x,
  y,
  navKey,
  label,
  onClose,
  onSelectView,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or escape
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Constrain inside viewport
  const menuWidth = 230;
  const menuHeight = 180;
  const left = Math.min(x, window.innerWidth - menuWidth - 10);
  const top = Math.min(y, window.innerHeight - menuHeight - 10);

  const handleOpenNewBrowserTab = () => {
    const url = getViewUrl(navKey);
    window.open(url, '_blank');
    onClose();
  };

  const handleCreateQueueBill = () => {
    onSelectView(navKey);
    // Dispatch event to create a new billing queue tab
    setTimeout(() => {
      if (navKey === 'sales_pos') {
        window.dispatchEvent(new CustomEvent('apex:pos:new-queue-bill'));
      } else if (navKey === 'purchase_invoice') {
        window.dispatchEvent(new CustomEvent('apex:purchase:new-queue-bill'));
      } else {
        window.dispatchEvent(new CustomEvent('apex:module:new-queue', { detail: { navKey } }));
      }
    }, 50);
    onClose();
  };

  const handleDuplicateTab = () => {
    onSelectView(navKey);
    setTimeout(() => {
      if (navKey === 'sales_pos') {
        window.dispatchEvent(new CustomEvent('apex:pos:duplicate-queue-bill'));
      }
    }, 50);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ left: `${left}px`, top: `${top}px` }}
      className="fixed z-50 w-58 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 bg-slate-50">
        <span className="truncate">{label}</span>
        <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-mono">Parallel</span>
      </div>

      <div className="p-1 space-y-0.5">
        <button
          onClick={handleCreateQueueBill}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left hover:bg-purple-50 hover:text-purple-700 transition-colors font-medium cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-purple-600" />
          <span>New Billing Queue Tab</span>
        </button>

        <button
          onClick={handleOpenNewBrowserTab}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left hover:bg-slate-100 transition-colors font-medium cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          <span>Open in New Browser Window</span>
        </button>

        {navKey === 'sales_pos' && (
          <button
            onClick={handleDuplicateTab}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left hover:bg-slate-100 transition-colors font-medium cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-600" />
            <span>Duplicate Cart to Queue</span>
          </button>
        )}

        <button
          onClick={() => {
            window.location.reload();
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left hover:bg-slate-100 transition-colors font-medium cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reload Section</span>
        </button>
      </div>
    </div>
  );
};
