import { memo, type ReactNode } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error' | 'retrying' | 'skipped';

export interface BaseNodeData {
  label: string;
  icon?: string;
  config: Record<string, unknown>;
  executionStatus?: ExecutionStatus;
  executionError?:  string;
  retryAttempt?:    number;
}

interface HandleConfig {
  id: string;
  label?: string;
  position: Position;
  type: 'source' | 'target';
  style?: React.CSSProperties;
}

interface BaseNodeProps extends NodeProps {
  data: BaseNodeData;
  handles?: HandleConfig[];
  categoryColor: string;
  children?: ReactNode;
}

const STATUS_CONFIG: Record<ExecutionStatus, { borderColor: string; badge: string | null; badgeColor: string; showPulse: boolean }> = {
  idle:     { borderColor: 'transparent', badge: null,  badgeColor: '',        showPulse: false },
  running:  { borderColor: '#f59e0b',     badge: '●',   badgeColor: '#f59e0b', showPulse: true  },
  success:  { borderColor: '#10b981',     badge: '✓',   badgeColor: '#10b981', showPulse: false },
  error:    { borderColor: '#ef4444',     badge: '✕',   badgeColor: '#ef4444', showPulse: false },
  retrying: { borderColor: '#f59e0b',     badge: '↻',   badgeColor: '#f59e0b', showPulse: true  },
  skipped:  { borderColor: '#6b7280',     badge: '—',   badgeColor: '#6b7280', showPulse: false },
};

export const BaseNode = memo(function BaseNode({ data, selected, handles = [], categoryColor, children }: BaseNodeProps) {
  const status = data.executionStatus ?? 'idle';
  const statusCfg = STATUS_CONFIG[status];
  const borderColor = selected ? '#ffffff' : status !== 'idle' ? statusCfg.borderColor : categoryColor;

  return (
    <div
      className={`base-node ${status !== 'idle' ? `base-node--${status}` : ''} ${selected ? 'base-node--selected' : ''}`}
      style={{ '--node-border-color': borderColor, '--node-category-color': categoryColor } as React.CSSProperties}
    >
      {statusCfg.showPulse && <div className="base-node__pulse-ring" style={{ borderColor: statusCfg.borderColor }} />}
      {statusCfg.badge && (
        <div className="base-node__status-badge" style={{ background: statusCfg.badgeColor }}>
          {statusCfg.badge}
          {status === 'retrying' && data.retryAttempt && <span className="base-node__retry-count">{data.retryAttempt}</span>}
        </div>
      )}
      <div className="base-node__header" style={{ borderBottomColor: `${categoryColor}40` }}>
        {data.icon && <span className="base-node__icon">{data.icon}</span>}
        <span className="base-node__label" title={data.label}>{data.label}</span>
      </div>
      {children && <div className="base-node__body">{children}</div>}
      {status === 'error' && data.executionError && (
        <div className="base-node__error-bar">
          <span className="base-node__error-icon">⚠</span>
          <span className="base-node__error-text">{data.executionError}</span>
        </div>
      )}
      {handles.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type={handle.type}
          position={handle.position}
          style={{ background: categoryColor, border: '2px solid #0f1117', width: 10, height: 10, ...handle.style }}
          title={handle.label}
        />
      ))}
    </div>
  );
});
