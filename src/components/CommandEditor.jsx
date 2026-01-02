import React, { useState } from 'react';
import ChoiceEditor from './ChoiceEditor';

const CommandEditor = ({ commands, sceneIndex, updateCommands, totalScenes, flags, audio }) => {
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [collapsedCommands, setCollapsedCommands] = useState({});

  if (!audio) {
    audio = { bgm: [], bgs: [], sfx: [] };
  }

  const commandCategories = {
    'Dialogues & Logic': [
      { type: 'dialogue', icon: '💬', label: 'Add Dialogue' },
      { type: 'setFlag', icon: '🚩', label: 'Set Flag' },
      { type: 'goto', icon: '➡️', label: 'Goto Scene' }
    ],
    'Audio Manager': [
      { type: 'playBGM', icon: '🎵', label: 'Play BGM' },
      { type: 'stopBGM', icon: '⏹️', label: 'Stop BGM' },
      { type: 'fadeBGM', icon: '🔉', label: 'Fade BGM' },
      { type: 'playBGS', icon: '🌊', label: 'Play BGS' },
      { type: 'stopBGS', icon: '⏹️', label: 'Stop BGS' },
      { type: 'fadeBGS', icon: '🔉', label: 'Fade BGS' },
      { type: 'playSFX', icon: '🔔', label: 'Play SFX' }
    ]
  };

  const addCommand = (type) => {
    const newCommand = { id: Date.now(), type: type };

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
      case 'playBGS':
        newCommand.audioFile = '';
        newCommand.volume = 100;
        newCommand.pitch = 100;
        newCommand.loop = true;
        break;
      case 'stopBGM':
      case 'stopBGS':
        break;
      case 'fadeBGM':
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
    updateCommands(commands.filter((_, i) => i !== commandIndex));
  };

  const moveCommand = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= commands.length) return;
    
    const newCommands = [...commands];
    [newCommands[index], newCommands[newIndex]] = [newCommands[newIndex], newCommands[index]];
    updateCommands(newCommands);
  };

  const toggleCollapse = (index) => {
    setCollapsedCommands({
      ...collapsedCommands,
      [index]: !collapsedCommands[index]
    });
  };

  const getCommandIcon = (type) => {
    for (let category in commandCategories) {
      const cmd = commandCategories[category].find(c => c.type === type);
      if (cmd) return cmd.icon;
    }
    return '⚙️';
  };

  const getCommandLabel = (command) => {
    if (command.type === 'dialogue') return `${command.speaker}: ${command.text.substring(0, 30)}...`;
    if (command.type === 'setFlag') return `Set ${command.flagName} = ${command.flagValue}`;
    if (command.type === 'goto') return `Goto Scene ${command.targetScene + 1}`;
    if (command.type === 'playBGM') return `Play BGM`;
    if (command.type === 'playBGS') return `Play BGS`;
    if (command.type === 'playSFX') return `Play SFX`;
    return command.type;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h4 style={{ fontSize: '12px', color: '#f39c12' }}>Commands</h4>
        <button onClick={() => setShowCommandMenu(true)} style={{ padding: '4px 8px', background: '#27ae60', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>
          + Command
        </button>
      </div>

      {/* Modal Command Menu */}
      {showCommandMenu && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCommandMenu(false)}>
          <div style={{ background: '#1a1a2e', border: '2px solid #f39c12', borderRadius: '8px', padding: '24px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '24px', color: '#fff', textAlign: 'center', marginBottom: '24px', fontFamily: 'inherit' }}>COMMANDS</h2>
            
            {Object.entries(commandCategories).map(([category, cmds]) => (
              <div key={category} style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', color: '#f39c12', marginBottom: '12px', borderBottom: '1px solid #4a5568', paddingBottom: '4px' }}>{category}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {cmds.map(cmd => (
                    <button key={cmd.type} onClick={() => addCommand(cmd.type)} style={{ padding: '12px', background: '#2a2a3e', color: '#fff', border: '1px solid #4a5568', cursor: 'pointer', fontSize: '11px', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s' }} onMouseOver={(e) => e.target.style.background = '#3a3a4e'} onMouseOut={(e) => e.target.style.background = '#2a2a3e'}>
                      <div style={{ fontSize: '18px', marginBottom: '4px' }}>{cmd.icon}</div>
                      {cmd.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            <button onClick={() => setShowCommandMenu(false)} style={{ width: '100%', marginTop: '16px', padding: '12px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Command list */}
      {commands.map((command, cmdIdx) => (
        <div key={command.id} style={{ padding: '8px', background: '#2a2a3e', border: '1px solid #4a5568', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsedCommands[cmdIdx] ? '0' : '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <button onClick={() => toggleCollapse(cmdIdx)} style={{ padding: '4px 8px', background: '#1a1a2e', color: '#fff', border: '1px solid #4a5568', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>
                {collapsedCommands[cmdIdx] ? '▶' : '▼'}
              </button>
              <span style={{ fontSize: '11px', color: '#f39c12' }}>
                {getCommandIcon(command.type)} {collapsedCommands[cmdIdx] ? getCommandLabel(command) : `#${cmdIdx + 1}`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {cmdIdx > 0 && (
                <button onClick={() => moveCommand(cmdIdx, 'up')} style={{ padding: '2px 6px', background: '#3498db', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>▲</button>
              )}
              {cmdIdx < commands.length - 1 && (
                <button onClick={() => moveCommand(cmdIdx, 'down')} style={{ padding: '2px 6px', background: '#3498db', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>▼</button>
              )}
              <button onClick={() => deleteCommand(cmdIdx)} style={{ padding: '2px 6px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>×</button>
            </div>
          </div>

          {!collapsedCommands[cmdIdx] && (
            <>
              {/* DIALOGUE COMMAND */}
              {command.type === 'dialogue' && (
                <>
                  <input type="text" value={command.speaker} onChange={(e) => updateCommand(cmdIdx, { speaker: e.target.value })} placeholder="Speaker" style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', marginBottom: '6px', fontFamily: 'inherit' }} />
                  <textarea value={command.text} onChange={(e) => updateCommand(cmdIdx, { text: e.target.value })} placeholder="Dialogue text..." rows="3" style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', resize: 'vertical', fontFamily: 'inherit' }} />
                  <ChoiceEditor dialogue={command} sceneIndex={sceneIndex} dialogueIndex={cmdIdx} updateDialogue={(_, __, field, value) => updateCommand(cmdIdx, { [field]: value })} totalScenes={totalScenes} flags={flags} />
                </>
              )}

              {/* SET FLAG COMMAND */}
              {command.type === 'setFlag' && (
                <>
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Select flag:</label>
                  <select value={command.flagName || ''} onChange={(e) => updateCommand(cmdIdx, { flagName: e.target.value })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }}>
                    <option value="">-- Select Flag --</option>
                    {flags.map(flag => <option key={flag.id} value={flag.name}>{flag.name}</option>)}
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: command.flagValue ? '#27ae60' : '#e74c3c' }}>
                    <input type="checkbox" checked={command.flagValue} onChange={(e) => updateCommand(cmdIdx, { flagValue: e.target.checked })} style={{ marginRight: '8px' }} />
                    Set to {command.flagValue ? 'TRUE' : 'FALSE'}
                  </label>
                </>
              )}

              {/* GOTO COMMAND */}
              {command.type === 'goto' && (
                <>
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Target scene:</label>
                  <input type="number" min="1" max={totalScenes} value={command.targetScene + 1} onChange={(e) => updateCommand(cmdIdx, { targetScene: Math.max(0, Math.min(totalScenes - 1, parseInt(e.target.value) - 1)) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: '#888' }}>
                    <input type="checkbox" checked={command.useTransition} onChange={(e) => updateCommand(cmdIdx, { useTransition: e.target.checked })} style={{ marginRight: '8px' }} />
                    Use transition effect
                  </label>
                </>
              )}

              {/* PLAY BGM */}
              {command.type === 'playBGM' && (
                <>
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>BGM File:</label>
                  <select value={command.audioFile || ''} onChange={(e) => updateCommand(cmdIdx, { audioFile: e.target.value })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }}>
                    <option value="">-- Select BGM --</option>
                    {audio.bgm.map(a => <option key={a.id} value={a.data}>{a.name}</option>)}
                  </select>
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Volume (%):</label>
                  <input type="number" min="0" max="100" value={command.volume} onChange={(e) => updateCommand(cmdIdx, { volume: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Pitch (%):</label>
                  <input type="number" min="50" max="200" value={command.pitch} onChange={(e) => updateCommand(cmdIdx, { pitch: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: '#888' }}>
                    <input type="checkbox" checked={command.loop} onChange={(e) => updateCommand(cmdIdx, { loop: e.target.checked })} style={{ marginRight: '8px' }} />
                    Loop
                  </label>
                </>
              )}

              {/* STOP BGM */}
              {command.type === 'stopBGM' && (
                <div style={{ padding: '8px', background: '#1a1a2e', border: '1px solid #4a5568', fontSize: '11px', color: '#888', textAlign: 'center' }}>Stops currently playing BGM</div>
              )}

              {/* FADE BGM */}
              {command.type === 'fadeBGM' && (
                <>
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Duration (ms):</label>
                  <input type="number" min="100" max="5000" step="100" value={command.duration} onChange={(e) => updateCommand(cmdIdx, { duration: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Target Volume (%):</label>
                  <input type="number" min="0" max="100" value={command.targetVolume} onChange={(e) => updateCommand(cmdIdx, { targetVolume: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '4px' }} />
                  <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>Set to 0 to fade out and stop</div>
                </>
              )}

              {/* PLAY BGS */}
              {command.type === 'playBGS' && (
                <>
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>BGS File:</label>
                  <select value={command.audioFile || ''} onChange={(e) => updateCommand(cmdIdx, { audioFile: e.target.value })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }}>
                    <option value="">-- Select BGS --</option>
                    {audio.bgs.map(a => <option key={a.id} value={a.data}>{a.name}</option>)}
                  </select>
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Volume (%):</label>
                  <input type="number" min="0" max="100" value={command.volume} onChange={(e) => updateCommand(cmdIdx, { volume: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Pitch (%):</label>
                  <input type="number" min="50" max="200" value={command.pitch} onChange={(e) => updateCommand(cmdIdx, { pitch: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: '#888' }}>
                    <input type="checkbox" checked={command.loop} onChange={(e) => updateCommand(cmdIdx, { loop: e.target.checked })} style={{ marginRight: '8px' }} />
                    Loop
                  </label>
                </>
              )}

              {/* STOP BGS */}
              {command.type === 'stopBGS' && (
                <div style={{ padding: '8px', background: '#1a1a2e', border: '1px solid #4a5568', fontSize: '11px', color: '#888', textAlign: 'center' }}>Stops currently playing BGS</div>
              )}

              {/* FADE BGS */}
              {command.type === 'fadeBGS' && (
                <>
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Duration (ms):</label>
                  <input type="number" min="100" max="5000" step="100" value={command.duration} onChange={(e) => updateCommand(cmdIdx, { duration: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Target Volume (%):</label>
                  <input type="number" min="0" max="100" value={command.targetVolume} onChange={(e) => updateCommand(cmdIdx, { targetVolume: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '4px' }} />
                  <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>Set to 0 to fade out and stop</div>
                </>
              )}

              {/* PLAY SFX */}
              {command.type === 'playSFX' && (
                <>
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>SFX File:</label>
                  <select value={command.audioFile || ''} onChange={(e) => updateCommand(cmdIdx, { audioFile: e.target.value })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }}>
                    <option value="">-- Select SFX --</option>
                    {audio.sfx.map(a => <option key={a.id} value={a.data}>{a.name}</option>)}
                  </select>
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Volume (%):</label>
                  <input type="number" min="0" max="100" value={command.volume} onChange={(e) => updateCommand(cmdIdx, { volume: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Pitch (%):</label>
                  <input type="number" min="50" max="200" value={command.pitch} onChange={(e) => updateCommand(cmdIdx, { pitch: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Pan (-100 to 100):</label>
                  <input type="number" min="-100" max="100" value={command.pan} onChange={(e) => updateCommand(cmdIdx, { pan: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '4px' }} />
                  <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>-100 = Left, 0 = Center, 100 = Right</div>
                </>
              )}
            </>
          )}
        </div>
      ))}

      {commands.length === 0 && (
        <div style={{ padding: '16px', background: '#2a2a3e', border: '1px dashed #4a5568', textAlign: 'center', fontSize: '11px', color: '#666' }}>No commands. Click "+ Command" to add.</div>
      )}
    </div>
  );
};

export default CommandEditor;