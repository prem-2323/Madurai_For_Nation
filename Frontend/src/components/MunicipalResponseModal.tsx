import React, { useEffect, useState } from 'react';
import { UserCheck, Building2 } from 'lucide-react';
import { Modal } from './Common';

interface MunicipalResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    municipalStatus: string;
    assignedOfficerName: string;
    assignedTeam: string;
  }) => Promise<void>;
  saving?: boolean;
  initialStatus?: string;
  initialOfficer?: string;
  initialTeam?: string;
}

export const MunicipalResponseModal: React.FC<MunicipalResponseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  saving = false,
  initialStatus = 'pending',
  initialOfficer = '',
  initialTeam = '',
}) => {
  const [municipalStatus, setMunicipalStatus] = useState(initialStatus);
  const [assignedOfficer, setAssignedOfficer] = useState(initialOfficer);
  const [assignedTeam, setAssignedTeam] = useState(initialTeam);

  useEffect(() => {
    if (isOpen) {
      setMunicipalStatus(initialStatus || 'pending');
      setAssignedOfficer(initialOfficer || '');
      setAssignedTeam(initialTeam || '');
    }
  }, [isOpen, initialStatus, initialOfficer, initialTeam]);

  const handleSave = async () => {
    await onSave({
      municipalStatus,
      assignedOfficerName: assignedOfficer.trim(),
      assignedTeam: assignedTeam.trim(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !saving && onClose()}
      title="Manage Municipal Response"
      footer={
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary hover:bg-emerald-500 text-xs font-bold text-white rounded-lg transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted-text font-bold">
            Municipal Status
          </label>
          <select
            value={municipalStatus}
            onChange={(e) => setMunicipalStatus(e.target.value)}
            className="w-full p-2.5 bg-slate-800 border border-white/5 focus:border-secondary/50 rounded-lg text-xs text-white outline-none cursor-pointer transition-all"
          >
            <option value="pending">Report Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="team_assigned">Team Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted-text font-bold">
            Assigned Officer
          </label>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-muted-text shrink-0" />
            <input
              type="text"
              value={assignedOfficer}
              onChange={(e) => setAssignedOfficer(e.target.value)}
              placeholder="Enter officer name..."
              className="w-full p-2.5 bg-slate-800 border border-white/5 focus:border-secondary/50 rounded-lg text-xs text-white placeholder-muted-text outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted-text font-bold">
            Assigned Team
          </label>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-text shrink-0" />
            <input
              type="text"
              value={assignedTeam}
              onChange={(e) => setAssignedTeam(e.target.value)}
              placeholder="Enter team name..."
              className="w-full p-2.5 bg-slate-800 border border-white/5 focus:border-secondary/50 rounded-lg text-xs text-white placeholder-muted-text outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
