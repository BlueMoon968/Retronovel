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

  const audioCommandStyle = {
                padding: '6px',
                background: '#2a2a3e',
                color: '#fff',
                border: '1px solid #4a5568',
                cursor: 'pointer',
                fontSize: '10px',
                textAlign: 'left',
                fontFamily: 'inherit'
              }

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
      case 'playBGM':
        newCommand.audioFile = '';
        newCommand.volume = 100;
        newCommand.pitch = 100;
        newCommand.loop = true;
        break;
      case 'stopBGM':
        break;
      case 'fadeBGM':
        newCommand.duration = 1000;
        newCommand.targetVolume = 0;
        break;
      case 'playBGS':
        newCommand.audioFile = '';
        newCommand.volume = 100;
        newCommand.pitch = 100;
        newCommand.loop = true;
        break;
      case 'stopBGS':
        break;
      case 'fadeBGS':
        newCommand.duration = 1000;
        newCommand.targetVolume = 0;
        break;
      case 'playSFX':
        newCommand.audioFile = '';
        newCommand.volume = 100;
        newCommand.pitch = 100;
        newCommand.pan = 0;
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
          <button onClick={() => addCommand('playBGM')} style={audioCommandStyle}>🎵 Play BGM</button>
          <button onClick={() => addCommand('stopBGM')} style={audioCommandStyle}>⏹️ Stop BGM</button>
          <button onClick={() => addCommand('fadeBGM')} style={audioCommandStyle}>🔉 Fade BGM</button>
          <button onClick={() => addCommand('playBGS')} style={audioCommandStyle}>🌊 Play BGS</button>
          <button onClick={() => addCommand('stopBGS')} style={audioCommandStyle}>⏹️ Stop BGS</button>
          <button onClick={() => addCommand('fadeBGS')} style={audioCommandStyle}>🔉 Fade BGS</button>
          <button onClick={() => addCommand('playSFX')} style={audioCommandStyle}>🔔 Play SFX</button>
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
          {/* PLAY BGM COMMAND */}
          {command.type === 'playBGM' && (
            <>
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                BGM File:
              </label>
              <select 
                value={command.audioFile || ''} 
                onChange={(e) => updateCommand(cmdIdx, { audioFile: e.target.value })} 
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
                <option value="">-- Select BGM --</option>
                {audio.bgm.map(a => <option key={a.id} value={a.data}>{a.name}</option>)}
              </select>
              
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                Volume (%):
              </label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={command.volume} 
                onChange={(e) => updateCommand(cmdIdx, { volume: parseInt(e.target.value) })} 
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
              
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                Pitch (%):
              </label>
              <input 
                type="number" 
                min="50" 
                max="200" 
                value={command.pitch} 
                onChange={(e) => updateCommand(cmdIdx, { pitch: parseInt(e.target.value) })} 
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
                  checked={command.loop} 
                  onChange={(e) => updateCommand(cmdIdx, { loop: e.target.checked })} 
                  style={{ marginRight: '8px' }}
                />
                Loop
              </label>
            </>
          )}

          {/* STOP BGM COMMAND */}
          {command.type === 'stopBGM' && (
            <div style={{
              padding: '8px',
              background: '#1a1a2e',
              border: '1px solid #4a5568',
              fontSize: '11px',
              color: '#888',
              textAlign: 'center'
            }}>
              Stops currently playing BGM
            </div>
          )}

          {/* FADE BGM COMMAND */}
          {command.type === 'fadeBGM' && (
            <>
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                Duration (ms):
              </label>
              <input 
                type="number" 
                min="100" 
                max="5000" 
                step="100" 
                value={command.duration} 
                onChange={(e) => updateCommand(cmdIdx, { duration: parseInt(e.target.value) })} 
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
              
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                Target Volume (%):
              </label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={command.targetVolume} 
                onChange={(e) => updateCommand(cmdIdx, { targetVolume: parseInt(e.target.value) })} 
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#1a1a2e',
                  border: '1px solid #4a5568',
                  color: '#fff',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  marginBottom: '4px'
                }}
              />
              <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
                Set to 0 to fade out and stop
              </div>
            </>
          )}

          {/* PLAY BGS COMMAND */}
          {command.type === 'playBGS' && (
            <>
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                BGS File:
              </label>
              <select 
                value={command.audioFile || ''} 
                onChange={(e) => updateCommand(cmdIdx, { audioFile: e.target.value })} 
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
                <option value="">-- Select BGS --</option>
                {audio.bgs.map(a => <option key={a.id} value={a.data}>{a.name}</option>)}
              </select>
              
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                Volume (%):
              </label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={command.volume} 
                onChange={(e) => updateCommand(cmdIdx, { volume: parseInt(e.target.value) })} 
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
              
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                Pitch (%):
              </label>
              <input 
                type="number" 
                min="50" 
                max="200" 
                value={command.pitch} 
                onChange={(e) => updateCommand(cmdIdx, { pitch: parseInt(e.target.value) })} 
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
                  checked={command.loop} 
                  onChange={(e) => updateCommand(cmdIdx, { loop: e.target.checked })} 
                  style={{ marginRight: '8px' }}
                />
                Loop
              </label>
            </>
          )}

          {/* STOP BGS COMMAND */}
          {command.type === 'stopBGS' && (
            <div style={{
              padding: '8px',
              background: '#1a1a2e',
              border: '1px solid #4a5568',
              fontSize: '11px',
              color: '#888',
              textAlign: 'center'
            }}>
              Stops currently playing BGS
            </div>
          )}

          {/* FADE BGS COMMAND */}
          {command.type === 'fadeBGS' && (
            <>
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                Duration (ms):
              </label>
              <input 
                type="number" 
                min="100" 
                max="5000" 
                step="100" 
                value={command.duration} 
                onChange={(e) => updateCommand(cmdIdx, { duration: parseInt(e.target.value) })} 
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
              
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                Target Volume (%):
              </label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={command.targetVolume} 
                onChange={(e) => updateCommand(cmdIdx, { targetVolume: parseInt(e.target.value) })} 
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#1a1a2e',
                  border: '1px solid #4a5568',
                  color: '#fff',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  marginBottom: '4px'
                }}
              />
              <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
                Set to 0 to fade out and stop
              </div>
            </>
          )}

          {/* PLAY SFX COMMAND */}
          {command.type === 'playSFX' && (
            <>
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                SFX File:
              </label>
              <select 
                value={command.audioFile || ''} 
                onChange={(e) => updateCommand(cmdIdx, { audioFile: e.target.value })} 
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
                <option value="">-- Select SFX --</option>
                {audio.sfx.map(a => <option key={a.id} value={a.data}>{a.name}</option>)}
              </select>
              
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                Volume (%):
              </label>
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={command.volume} 
                onChange={(e) => updateCommand(cmdIdx, { volume: parseInt(e.target.value) })} 
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
              
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                Pitch (%):
              </label>
              <input 
                type="number" 
                min="50" 
                max="200" 
                value={command.pitch} 
                onChange={(e) => updateCommand(cmdIdx, { pitch: parseInt(e.target.value) })} 
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
              
              <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                Pan (-100 to 100):
              </label>
              <input 
                type="number" 
                min="-100" 
                max="100" 
                value={command.pan} 
                onChange={(e) => updateCommand(cmdIdx, { pan: parseInt(e.target.value) })} 
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#1a1a2e',
                  border: '1px solid #4a5568',
                  color: '#fff',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  marginBottom: '4px'
                }}
              />
              <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
                -100 = Left, 0 = Center, 100 = Right
              </div>
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
