import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronDown, faFolder, faFile } from '@fortawesome/free-solid-svg-icons';

// Component library definition:
// Anatomy: Expandable lists (Property → Floor → Room).
// Visuals: text-body-base, indentations mapped with color-border-base vertical lines.

export interface TreeNodeData {
  id: string;
  label: string;
  isLeaf?: boolean;
  children?: TreeNodeData[];
  data?: any; // Extra payload
}

interface TreeViewProps {
  nodes: TreeNodeData[];
  onNodeClick?: (node: TreeNodeData) => void;
  className?: string;
}

const TreeNode: React.FC<{ node: TreeNodeData; onNodeClick?: (node: TreeNodeData) => void; level: number }> = ({ node, onNodeClick, level }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLeaf = node.isLeaf || !node.children || node.children.length === 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-2 px-2 hover:bg-[#F8FAFC] rounded-md cursor-pointer transition-colors text-[16px] text-[#334155] ${level > 0 ? 'ml-4' : ''}`}
        onClick={() => {
          if (!isLeaf) setIsExpanded(!isExpanded);
          if (onNodeClick) onNodeClick(node);
        }}
      >
        {!isLeaf ? (
          <button 
            onClick={handleToggle}
            className="w-5 h-5 flex items-center justify-center text-[#64748B] hover:text-[#0F766E]"
            aria-label="Toggle node"
          >
            <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} className="text-[12px]" />
          </button>
        ) : (
          <span className="w-5 inline-block" /> // Spacer for alignment
        )}
        
        <span className="text-[#64748B]">
          <FontAwesomeIcon icon={isLeaf ? faFile : faFolder} />
        </span>
        <span className="font-medium text-[#1E293B]">{node.label}</span>
      </div>
      
      {!isLeaf && isExpanded && node.children && (
        <div className="relative">
          {/* Vertical line indicator */}
          <div className="absolute top-0 bottom-0 left-[26px] border-l border-[#E2E8F0]" />
          <div className="ml-5">
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} onNodeClick={onNodeClick} level={level + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const TreeView: React.FC<TreeViewProps> = ({ nodes, onNodeClick, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      {nodes.map(node => (
        <TreeNode key={node.id} node={node} onNodeClick={onNodeClick} level={0} />
      ))}
    </div>
  );
};
