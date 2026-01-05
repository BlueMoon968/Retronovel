import React, { useState, useRef } from 'react';
import ChoiceEditor from './ChoiceEditor';
import BranchingEditor from './BranchingEditor';

const CommandEditor = ({ commands, sceneIndex, updateCommands, totalScenes, flags, variables, audio, characters, backgrounds, sharedCommands, onJumpToCommand }) => {
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [, forceUpdate] = useState(0);
  const collapsedCommands = useRef({});

  if (!audio) {
    audio = { bgm: [], bgs: [], sfx: [] };
  }

  if (!variables) {
    variables = []
  }

  if (!sharedCommands) {
    sharedCommands = []
  }

  const commandCategories = {
    'Dialogues & Logic': [
      { type: 'dialogue', icon: '💬', label: 'Add Dialogue' },
      { type: 'branching', icon: '🔀', label: 'Branching' },
      { type: 'setFlag', icon: '🚩', label: 'Set Flag' },
      { type: 'setVariable', icon: '🔢', label: 'Set Variable' },
      { type: 'callSharedCommand', icon: '📞', label: 'Call Shared Command' },
      { type: 'goto', icon: '➡️', label: 'Goto Scene' },
      { type: 'showCharacter', icon: '👤', label: 'Show/Change Character' },
      { type: 'hideCharacter', icon: '👻', label: 'Hide Character' },
      { type: 'showBackground', icon: '🖼️', label: 'Show/Change Background' },
      { type: 'hideBackground', icon: '🚫', label: 'Hide Background' }
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
      case 'branching':
        newCommand.label = '';
        newCommand.conditions = [
          {
            id: Date.now(),
            type: 'if',
            checkType: 'flag',
            flagName: flags.length > 0 ? flags[0].name : '',
            variableName: variables.length > 0 ? variables[0].name : '',
            operator: '==',
            compareValue: true,
            commands: []
          }
        ];
        break;
      case 'setFlag':
        newCommand.flagName = flags.length > 0 ? flags[0].name : '';
        newCommand.flagValue = true;
        break;
      case 'setVariable':
        newCommand.variableName = project.variables?.length > 0 ? project.variables[0].name : '';
        newCommand.variableValue = 0;
        newCommand.operation = 'set'; // set, add, subtract
      case 'callSharedCommand':  // ← AGGIUNGI
        newCommand.sharedCommandId = sharedCommands.length > 0 ? sharedCommands[0].id : null;
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
      case 'showCharacter':
        newCommand.charIndex = 0;
        newCommand.sprite = '';
        newCommand.position = 'center';
        newCommand.animated = false;
        newCommand.frames = 1;
        newCommand.frameSpeed = 100;
        newCommand.faded = false;
        newCommand.fadeDuration = 500;
        break;
      case 'hideCharacter':
        newCommand.charIndex = 0;
        newCommand.faded = false;
        newCommand.fadeDuration = 500;
        break;
      case 'showBackground':
        newCommand.backgroundImage = '';
        newCommand.faded = false;
        newCommand.fadeDuration = 500;
        break;
      case 'hideBackground':
        newCommand.faded = false;
        newCommand.fadeDuration = 500;
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
    collapsedCommands.current = {
      ...collapsedCommands.current,
      [index]: !collapsedCommands.current[index]
    };
    forceUpdate(prev => prev + 1);
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
    if (command.type === 'branching') return `Branch: ${command.label || 'Conditional'}`;
    if (command.type === 'setFlag') return `Set ${command.flagName} = ${command.flagValue}`;
    if (command.type === 'setVariable') return `Set ${command.variableName} ${command.operation} ${command.variableValue}`;
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
        <div key={command.id} style={{ padding: '6px', background: '#2a2a3e', border: '1px solid #4a5568', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsedCommands.current[cmdIdx] ? '0' : '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer' }} onClick={() => onJumpToCommand && onJumpToCommand(cmdIdx)}>
              <button onClick={(e) => {
                e.stopPropagation()
                toggleCollapse(cmdIdx)
              }} style={{ padding: '4px 8px', background: '#1a1a2e', color: '#fff', border: '1px solid #4a5568', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>
                {collapsedCommands.current[cmdIdx] ? '▶' : '▼'}
              </button>
              <span style={{ fontSize: '11px', color: '#f39c12' }}>
                {getCommandIcon(command.type)} {collapsedCommands.current[cmdIdx] ? getCommandLabel(command) : `#${cmdIdx + 1}`}
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

          {!collapsedCommands.current[cmdIdx] && (
            <>
              {/* DIALOGUE COMMAND */}
              {command.type === 'dialogue' && (
                <>
                  <input type="text" value={command.speaker} onChange={(e) => updateCommand(cmdIdx, { speaker: e.target.value })} placeholder="Speaker" style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', marginBottom: '6px', fontFamily: 'inherit' }} />
                  <textarea value={command.text} onChange={(e) => updateCommand(cmdIdx, { text: e.target.value })} placeholder="Dialogue text..." rows="3" style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', resize: 'vertical', fontFamily: 'inherit' }} />
                  <ChoiceEditor dialogue={command} sceneIndex={sceneIndex} dialogueIndex={cmdIdx} updateDialogue={(_, __, field, value) => updateCommand(cmdIdx, { [field]: value })} totalScenes={totalScenes} flags={flags} variables={variables}/>
                </>
              )}
              {/* BRANCHING COMMAND */}
              {command.type === 'branching' && (
                <BranchingEditor 
                  branching={command} 
                  sceneIndex={sceneIndex} 
                  commandIndex={cmdIdx} 
                  updateBranching={(updated) => updateCommand(cmdIdx, updated)} 
                  totalScenes={totalScenes} 
                  flags={flags}
                  variables={variables}
                  audio={audio}
                  characters={characters}
                  backgrounds={backgrounds}
                  sharedCommands={sharedCommands}
                />
              )}
              {/* SET FLAG COMMAND */}
              {command.type === 'setFlag' && (
                <>
                  <label style={{ display: 'block', fontSize: '9px', color: '#888', marginBottom: '2px' }}>Flag:</label>
                  <select 
                    value={command.flagName || ''} 
                    onChange={(e) => updateCommand(cmdIdx, { flagName: e.target.value })} 
                    style={{ width: '100%', padding: '4px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '10px', fontFamily: 'inherit', marginBottom: '6px' }}
                  >
                    <option value="">-- Select --</option>
                    {flags.map(flag => <option key={flag.id} value={flag.name}>{flag.name}</option>)}
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: command.flagValue ? '#27ae60' : '#e74c3c' }}>
                    <input type="checkbox" checked={command.flagValue} onChange={(e) => updateCommand(cmdIdx, { flagValue: e.target.checked })} style={{ marginRight: '6px' }} />
                    {command.flagValue ? 'TRUE' : 'FALSE'}
                  </label>
                </>
              )}

              {/* SET VARIABLE COMMAND */}
              {command.type === 'setVariable' && (
                <>
                  <label style={{ display: 'block', fontSize: '9px', color: '#888', marginBottom: '2px' }}>Variable:</label>
                  <select 
                    value={command.variableName || ''} 
                    onChange={(e) => updateCommand(cmdIdx, { variableName: e.target.value })} 
                    style={{ width: '100%', padding: '4px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '10px', fontFamily: 'inherit', marginBottom: '6px' }}
                  >
                    <option value="">-- Select --</option>
                    {variables.map(variable => <option key={variable.id} value={variable.name}>{variable.name}</option>)}
                  </select>
                  
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '9px', color: '#888', marginBottom: '2px' }}>Operation:</label>
                      <select 
                        value={command.operation || 'set'} 
                        onChange={(e) => updateCommand(cmdIdx, { operation: e.target.value })} 
                        style={{ width: '100%', padding: '4px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '10px', fontFamily: 'inherit' }}
                      >
                        <option value="set">Set</option>
                        <option value="add">Add</option>
                        <option value="subtract">Sub</option>
                      </select>
                    </div>
                    
                    <div style={{ width: '70px' }}>
                      <label style={{ display: 'block', fontSize: '9px', color: '#888', marginBottom: '2px' }}>Value:</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="255" 
                        value={command.variableValue || 0} 
                        onChange={(e) => updateCommand(cmdIdx, { variableValue: Math.max(0, Math.min(255, parseInt(e.target.value) || 0)) })} 
                        style={{ width: '100%', padding: '4px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '10px', fontFamily: 'inherit', textAlign: 'center' }} 
                      />
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '8px', color: '#666', padding: '4px', background: '#1a1a2e', border: '1px solid #333' }}>
                    {command.operation === 'set' && '= exact value'}
                    {command.operation === 'add' && '+ (max 255)'}
                    {command.operation === 'subtract' && '- (min 0)'}
                  </div>
                </>
              )}

              {/* CALL SHARED COMMAND */}
              {command.type === 'callSharedCommand' && (
                <>
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                    Shared Command:
                  </label>
                  <select 
                    value={command.sharedCommandId || ''} 
                    onChange={(e) => updateCommand(cmdIdx, { sharedCommandId: parseInt(e.target.value) })} 
                    style={{ 
                      width: '100%', 
                      padding: '6px', 
                      background: '#1a1a2e', 
                      border: '1px solid #e67e22', 
                      color: '#fff', 
                      fontSize: '11px', 
                      fontFamily: 'inherit',
                      marginBottom: '8px'
                    }}
                  >
                    {sharedCommands.length === 0 ? (
                      <option value="">-- No shared commands available --</option>
                    ) : (
                      <>
                        <option value="">-- Select shared command --</option>
                        {sharedCommands.map((sc, idx) => (
                          <option key={sc.id} value={sc.id}>
                            #{String(idx + 1).padStart(4, '0')} - {sc.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  
                  {command.sharedCommandId && (
                    <div style={{ 
                      padding: '8px', 
                      background: '#1a1a2e', 
                      border: '1px solid #e67e22', 
                      fontSize: '9px', 
                      color: '#e67e22' 
                    }}>
                      ℹ️ This will execute all commands from the selected shared command
                    </div>
                  )}
                  
                  {sharedCommands.length === 0 && (
                    <div style={{ 
                      padding: '8px', 
                      background: '#1a1a2e', 
                      border: '1px solid #666', 
                      fontSize: '9px', 
                      color: '#666',
                      textAlign: 'center'
                    }}>
                      Create shared commands in the "Shared" tab
                    </div>
                  )}
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

              {/* SHOW CHARACTER */}
              {command.type === 'showCharacter' && (
                <>
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Character Slot (0-2):</label>
                  <input type="number" min="0" max="2" value={command.charIndex} onChange={(e) => updateCommand(cmdIdx, { charIndex: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }} />
                  
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Sprite:</label>
                  <select value={command.sprite || ''} onChange={(e) => updateCommand(cmdIdx, { sprite: e.target.value })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }}>
                    <option value="">-- Select Sprite --</option>
                    {characters.map(char => <option key={char.id} value={char.data}>{char.name}</option>)}
                  </select>
                  
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Position:</label>
                  <select value={command.position} onChange={(e) => updateCommand(cmdIdx, { position: e.target.value })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }}>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                  
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                    <input type="checkbox" checked={command.animated} onChange={(e) => updateCommand(cmdIdx, { animated: e.target.checked })} style={{ marginRight: '8px' }} />
                    Animated Spritesheet
                  </label>
                  
                  {command.animated && (
                    <>
                      <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Frames:</label>
                      <input type="number" min="1" max="20" value={command.frames} onChange={(e) => updateCommand(cmdIdx, { frames: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }} />
                      
                      <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Frame Speed (ms):</label>
                      <input type="number" min="50" max="1000" step="50" value={command.frameSpeed} onChange={(e) => updateCommand(cmdIdx, { frameSpeed: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }} />
                    </>
                  )}
                  
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                    <input type="checkbox" checked={command.faded} onChange={(e) => updateCommand(cmdIdx, { faded: e.target.checked })} style={{ marginRight: '8px' }} />
                    Fade In
                  </label>
                  
                  {command.faded && (
                    <>
                      <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Fade Duration (ms):</label>
                      <input type="number" min="100" max="2000" step="100" value={command.fadeDuration} onChange={(e) => updateCommand(cmdIdx, { fadeDuration: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit' }} />
                    </>
                  )}
                </>
              )}

              {/* HIDE CHARACTER */}
              {command.type === 'hideCharacter' && (
                <>
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Character Slot (0-2):</label>
                  <input type="number" min="0" max="2" value={command.charIndex} onChange={(e) => updateCommand(cmdIdx, { charIndex: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }} />
                  
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                    <input type="checkbox" checked={command.faded} onChange={(e) => updateCommand(cmdIdx, { faded: e.target.checked })} style={{ marginRight: '8px' }} />
                    Fade Out
                  </label>
                  
                  {command.faded && (
                    <>
                      <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Fade Duration (ms):</label>
                      <input type="number" min="100" max="2000" step="100" value={command.fadeDuration} onChange={(e) => updateCommand(cmdIdx, { fadeDuration: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit' }} />
                    </>
                  )}
                </>
              )}

              {/* SHOW BACKGROUND */}
              {command.type === 'showBackground' && (
                <>
                  <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Background:</label>
                  <select value={command.backgroundImage || ''} onChange={(e) => updateCommand(cmdIdx, { backgroundImage: e.target.value })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }}>
                    <option value="">-- Select Background --</option>
                    {backgrounds.map(bg => <option key={bg.id} value={bg.data}>{bg.name}</option>)}
                  </select>
                  
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                    <input type="checkbox" checked={command.faded} onChange={(e) => updateCommand(cmdIdx, { faded: e.target.checked })} style={{ marginRight: '8px' }} />
                    Crossfade
                  </label>
                  
                  {command.faded && (
                    <>
                      <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Fade Duration (ms):</label>
                      <input type="number" min="100" max="2000" step="100" value={command.fadeDuration} onChange={(e) => updateCommand(cmdIdx, { fadeDuration: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit' }} />
                    </>
                  )}
                </>
              )}

              {/* HIDE BACKGROUND */}
              {command.type === 'hideBackground' && (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                    <input type="checkbox" checked={command.faded} onChange={(e) => updateCommand(cmdIdx, { faded: e.target.checked })} style={{ marginRight: '8px' }} />
                    Fade Out
                  </label>
                  
                  {command.faded && (
                    <>
                      <label style={{ display: 'block', fontSize: '10px', color: '#888', marginBottom: '4px' }}>Fade Duration (ms):</label>
                      <input type="number" min="100" max="2000" step="100" value={command.fadeDuration} onChange={(e) => updateCommand(cmdIdx, { fadeDuration: parseInt(e.target.value) })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit' }} />
                    </>
                  )}
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