import React, { useState } from 'react';
import CommandEditor from './CommandEditor';

const SharedCommandsManager = ({ 
  sharedCommands, 
  updateSharedCommands, 
  flags, 
  variables, 
  audio, 
  characters, 
  backgrounds,
  totalScenes 
}) => {
  const [expandedCommands, setExpandedCommands] = useState({});

  const addSharedCommand = () => {
    if (sharedCommands.length >= 999) {
      alert('Maximum 999 shared commands reached');
      return;
    }
    
    const newSharedCommand = {
      id: Date.now(),
      name: `Shared Command ${sharedCommands.length + 1}`,
      commands: []
    };
    
    updateSharedCommands([...sharedCommands, newSharedCommand]);
    
    // Auto-expand il nuovo
    setExpandedCommands({
      ...expandedCommands,
      [newSharedCommand.id]: true
    });
  };

  const updateSharedCommand = (index, updates) => {
    const newSharedCommands = [...sharedCommands];
    newSharedCommands[index] = { ...newSharedCommands[index], ...updates };
    updateSharedCommands(newSharedCommands);
  };

  const deleteSharedCommand = (index) => {
    if (confirm('Delete this shared command? This action cannot be undone.')) {
      updateSharedCommands(sharedCommands.filter((_, i) => i !== index));
    }
  };

  const moveSharedCommand = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sharedCommands.length) return;
    
    const newSharedCommands = [...sharedCommands];
    [newSharedCommands[index], newSharedCommands[newIndex]] = 
    [newSharedCommands[newIndex], newSharedCommands[index]];
    updateSharedCommands(newSharedCommands);
  };

  const toggleExpand = (id) => {
    setExpandedCommands({
      ...expandedCommands,
      [id]: !expandedCommands[id]
    });
  };

  return (
    <div style={{ padding: '12px', background: '#2a2a3e', border: '1px solid #4a5568' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '12px', color: '#f39c12' }}>
          Shared Commands ({sharedCommands.length}/999)
        </h4>
        <button 
          onClick={addSharedCommand} 
          disabled={sharedCommands.length >= 999}
          style={{ 
            padding: '6px 12px', 
            background: sharedCommands.length >= 999 ? '#555' : '#27ae60', 
            color: '#fff', 
            border: 'none', 
            cursor: sharedCommands.length >= 999 ? 'not-allowed' : 'pointer', 
            fontSize: '11px', 
            fontFamily: 'inherit' 
          }}
        >
          + New Shared Command
        </button>
      </div>

      {sharedCommands.length === 0 && (
        <div style={{ 
          padding: '24px', 
          background: '#1a1a2e', 
          border: '1px dashed #4a5568', 
          textAlign: 'center', 
          fontSize: '11px', 
          color: '#666' 
        }}>
          No shared commands created.<br/>
          <span style={{ fontSize: '10px', color: '#888' }}>
            Shared commands are reusable command groups.
          </span>
        </div>
      )}

      {sharedCommands.map((sharedCmd, idx) => (
        <div 
          key={sharedCmd.id} 
          style={{ 
            padding: '8px', 
            background: '#1a1a2e', 
            border: '2px solid #e67e22', 
            marginBottom: '8px' 
          }}
        >
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '8px' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              flex: 1,
              cursor: 'pointer'
            }} onClick={() => toggleExpand(sharedCmd.id)}>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleExpand(sharedCmd.id); }}
                style={{ 
                  padding: '2px 6px', 
                  background: '#2a2a3e', 
                  color: '#fff', 
                  border: '1px solid #4a5568', 
                  cursor: 'pointer', 
                  fontSize: '9px', 
                  fontFamily: 'inherit' 
                }}
              >
                {expandedCommands[sharedCmd.id] ? '▼' : '▶'}
              </button>
              
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 'bold', 
                color: '#e67e22' 
              }}>
                #{String(idx + 1).padStart(4, '0')}
              </span>
              
              <span style={{ 
                fontSize: '10px', 
                color: '#fff' 
              }}>
                {sharedCmd.name}
              </span>
              
              <span style={{ 
                fontSize: '9px', 
                color: '#666' 
              }}>
                ({sharedCmd.commands?.length || 0} commands)
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '4px' }}>
              {idx > 0 && (
                <button 
                  onClick={() => moveSharedCommand(idx, 'up')}
                  style={{ 
                    padding: '2px 6px', 
                    background: '#3498db', 
                    color: '#fff', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '10px', 
                    fontFamily: 'inherit' 
                  }}
                >
                  ▲
                </button>
              )}
              {idx < sharedCommands.length - 1 && (
                <button 
                  onClick={() => moveSharedCommand(idx, 'down')}
                  style={{ 
                    padding: '2px 6px', 
                    background: '#3498db', 
                    color: '#fff', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '10px', 
                    fontFamily: 'inherit' 
                  }}
                >
                  ▼
                </button>
              )}
              <button 
                onClick={() => deleteSharedCommand(idx)}
                style={{ 
                  padding: '2px 6px', 
                  background: '#e74c3c', 
                  color: '#fff', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '10px', 
                  fontFamily: 'inherit' 
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Expanded content */}
          {expandedCommands[sharedCmd.id] && (
            <>
              {/* Name editor */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '9px', 
                  color: '#888', 
                  marginBottom: '4px' 
                }}>
                  Name (optional):
                </label>
                <input 
                  type="text" 
                  value={sharedCmd.name} 
                  onChange={(e) => updateSharedCommand(idx, { name: e.target.value })}
                  placeholder="e.g. Player Level Up"
                  style={{ 
                    width: '100%', 
                    padding: '4px', 
                    background: '#0f0f1f', 
                    border: '1px solid #4a5568', 
                    color: '#fff', 
                    fontSize: '11px', 
                    fontFamily: 'inherit' 
                  }} 
                />
              </div>

              {/* Commands */}
              <div style={{ 
                background: '#0f0f1f', 
                padding: '8px', 
                border: '1px dashed #e67e22' 
              }}>
                <CommandEditor 
                  commands={sharedCmd.commands || []} 
                  sceneIndex={0} 
                  updateCommands={(cmds) => updateSharedCommand(idx, { commands: cmds })} 
                  totalScenes={totalScenes} 
                  flags={flags}
                  variables={variables}
                  audio={audio}
                  characters={characters}
                  backgrounds={backgrounds}
                  sharedCommands={sharedCommands}
                collapsedCommands={{}}
                setCollapsedCommands={() => {}}
                />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default SharedCommandsManager;