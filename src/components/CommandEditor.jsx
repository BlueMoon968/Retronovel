import React, { useState } from 'react';
import ChoiceEditor from './ChoiceEditor';

/**
 * CommandEditor - Manages scene commands (dialogues, flags, goto)
 * Commands execute sequentially in a scene
 */
const CommandEditor = ({ 
  commands, 
  sceneIndex, 
  updateCommands, 
  totalScenes, 
  flags 
}) => {
  const [showCommandMenu, setShowCommandMenu] = useState(false);

  const addCommand = (type) => {
    const newCommand = {
      id: Date.now(),
      type: type
    };

    switch (type) {
      case 'dialogue':
        newCommand.speaker = 'Narrator';
        newCommand.text = 'New dialogue...';
        newCommand.choices = [];
        break;
      case 'setFlag':
        newCommand.flagName = flags.length > 0 ? flags[0].name : '';
        newCommand.flagValue = true;
        break;
      case 'goto':
        newCommand.targetScene = Math.min(sceneIndex + 1, totalScenes - 1);
        newCommand.useTransition = true;
        break;
    }

    updateCommands([...commands, newCommand]);
    setShowCommandMenu(false);
  };

  const updateCommand = (commandIndex, updates) => {
    const newCommands = [...commands];
    newCommands[commandIndex] = { ...newCommands[commandIndex], ...updates };
    updateCommands(newCommands);
  };

  const deleteCommand = (commandIndex) => {
    if (commands.length > 1) {
      updateCommands(commands.filter((_, i) => i !== commandIndex));
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <h4 style={{ fontSize: '12px', color: '#f39c12' }}>Commands</h4>
        <button
          onClick={() => setShowCommandMenu(!showCommandMenu)}
          style={{
            padding: '4px 8px',
            background: '#27ae60',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '10px',
            fontFamily: 'inherit'
          }}
        >
          + Command
        </button>
      </div>

      {/* Command type menu */}
      {showCommandMenu && (
        <div style={{
          padding: '8px',
          background: '#1a1a2e',
          border: '2px solid #27ae60',
          marginBottom: '8px'
        }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>
            Select command type:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => addCommand('dialogue')}
              style={{
                padding: '6px',
                background: '#2a2a3e',
                color: '#fff',
                border: '1px solid #4a5568',
                cursor: 'pointer',
                fontSize: '10px',
                textAlign: 'left',
                fontFamily: 'inherit'
              }}
            >
              💬 Add Dialogue
            </button>
            <button
              onClick={() => addCommand('setFlag')}
              style={{
                padding: '6px',
                background: '#2a2a3e',
                color: '#fff',
                border: '1px solid #4a5568',
                cursor: 'pointer',
                fontSize: '10px',
                textAlign: 'left',
                fontFamily: 'inherit'
              }}
            >
              🚩 Set Flag
            </button>
            <button
              onClick={() => addCommand('goto')}
              style={{
                padding: '6px',
                background: '#2a2a3e',
                color: '#fff',
                border: '1px solid #4a5568',
                cursor: 'pointer',
                fontSize: '10px',
                textAlign: 'left',
                fontFamily: 'inherit'
              }}
            >
              ➡️ Goto Scene
            </button>
          </div>
          <button
            onClick={() => setShowCommandMenu(false)}
            style={{
              width: '100%',
              marginTop: '6px',
              padding: '4px',
              background: '#e74c3c',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '9px',
              fontFamily: 'inherit'
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Command list */}
      {commands.map((command, cmdIdx) => (
        <div
          key={command.id}
          style={{
            padding: '8px',
            background: '#2a2a3e',
            border: '1px solid #4a5568',
            marginBottom: '8px'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '11px', color: '#f39c12' }}>
              {command.type === 'dialogue' && '💬 Dialogue'}
              {command.type === 'setFlag' && '🚩 Set Flag'}
              {command.type === 'goto' && '➡️ Goto'}
              {' #' + (cmdIdx + 1)}
            </span>
            {commands.length > 1 && (
              <button
                onClick={() => deleteCommand(cmdIdx)}
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
            )}
          </div>

          {/* DIALOGUE COMMAND */}
          {command.type === 'dialogue' && (
            <>
              <input
                type="text"
                value={command.speaker}
                onChange={(e) => updateCommand(cmdIdx, { speaker: e.target.value })}
                placeholder="Speaker"
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#1a1a2e',
                  border: '1px solid #4a5568',
                  color: '#fff',
                  fontSize: '11px',
                  marginBottom: '6px',
                  fontFamily: 'inherit'
                }}
              />
              
              <textarea
                value={command.text}
                onChange={(e) => updateCommand(cmdIdx, { text: e.target.value })}
                placeholder="Dialogue text..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#1a1a2e',
                  border: '1px solid #4a5568',
                  color: '#fff',
                  fontSize: '11px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />

              {/* Choices for this dialogue */}
              <ChoiceEditor
                dialogue={command}
                sceneIndex={sceneIndex}
                dialogueIndex={cmdIdx}
                updateDialogue={(_, __, field, value) => updateCommand(cmdIdx, { [field]: value })}
                totalScenes={totalScenes}
                flags={flags}
              />
            </>
          )}

          {/* SET FLAG COMMAND */}
          {command.type === 'setFlag' && (
            <>
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                Select flag:
              </label>
              <select
                value={command.flagName || ''}
                onChange={(e) => updateCommand(cmdIdx, { flagName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#1a1a2e',
                  border: '1px solid #4a5568',
                  color: '#fff',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  marginBottom: '8px'
                }}
              >
                <option value="">-- Select Flag --</option>
                {flags.map(flag => (
                  <option key={flag.id} value={flag.name}>{flag.name}</option>
                ))}
              </select>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '11px',
                color: command.flagValue ? '#27ae60' : '#e74c3c'
              }}>
                <input
                  type="checkbox"
                  checked={command.flagValue}
                  onChange={(e) => updateCommand(cmdIdx, { flagValue: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Set to {command.flagValue ? 'TRUE' : 'FALSE'}
              </label>
            </>
          )}

          {/* GOTO COMMAND */}
          {command.type === 'goto' && (
            <>
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                Target scene:
              </label>
              <input
                type="number"
                min="1"
                max={totalScenes}
                value={command.targetScene + 1}
                onChange={(e) => updateCommand(cmdIdx, { 
                  targetScene: Math.max(0, Math.min(totalScenes - 1, parseInt(e.target.value) - 1))
                })}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#1a1a2e',
                  border: '1px solid #4a5568',
                  color: '#fff',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  marginBottom: '8px'
                }}
              />

              <label style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '11px',
                color: '#888'
              }}>
                <input
                  type="checkbox"
                  checked={command.useTransition}
                  onChange={(e) => updateCommand(cmdIdx, { useTransition: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Use transition effect
              </label>
            </>
          )}
        </div>
      ))}

      {commands.length === 0 && (
        <div style={{
          padding: '16px',
          background: '#2a2a3e',
          border: '1px dashed #4a5568',
          textAlign: 'center',
          fontSize: '11px',
          color: '#666'
        }}>
          No commands. Click "+ Command" to add.
        </div>
      )}
    </div>
  );
};

export default CommandEditor;
