import React from 'react';
import { MemoryPanel } from './MemoryPanel';

interface WorkspaceMemoryPanelProps {
  onClose: () => void;
}

export const WorkspaceMemoryPanel: React.FC<WorkspaceMemoryPanelProps> = ({ onClose }) => {
  return <MemoryPanel onClose={onClose} />;
};
