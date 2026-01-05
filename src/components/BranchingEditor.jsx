import React, { useState } from 'react';
import CommandEditor from './CommandEditor';

const BranchingEditor = ({ 
  branching, 
  sceneIndex, 
  commandIndex, 
  updateBranching, 
  totalScenes, 
  flags, 
  variables,
  audio,
  characters,
  backgrounds,
  sharedCommands,
  collapsedCommands,
  setCollapsedCommands
}) => {
  const [expandedBranches, setExpandedBranches] = useState({ 0: true });

  const addElseIf = () => {
    const newConditions = [...branching.conditions];
    const elseIndex = newConditions.findIndex(c => c.type === 'else');
    
    const newElseIf = {
      id: Date.now(),
      type: 'elseif',
      checkType: 'flag',
      flagName: flags.length > 0 ? flags[0].name : '',
      variableName: variables.length > 0 ? variables[0].name : '',
      operator: '==',
      compareValue: true,
      commands: []
    };
    
    if (elseIndex !== -1) {
      newConditions.splice(elseIndex, 0, newElseIf);
    } else {
      newConditions.push(newElseIf);
    }
    
    updateBranching({ ...branching, conditions: newConditions });
  };

  const addElse = () => {
    const hasElse = branching.conditions.some(c => c.type === 'else');
    if (hasElse) return;
    
    updateBranching({
      ...branching,
      conditions: [...branching.conditions, {
        id: Date.now(),
        type: 'else',
        commands: []
      }]
    });
  };

  const updateCondition = (condIndex, updates) => {
    const newConditions = [...branching.conditions];
    newConditions[condIndex] = { ...newConditions[condIndex], ...updates };
    updateBranching({ ...branching, conditions: newConditions });
  };

  const deleteCondition = (condIndex) => {
    const newConditions = branching.conditions.filter((_, i) => i !== condIndex);
    updateBranching({ ...branching, conditions: newConditions });
  };

  const updateConditionCommands = (condIndex, commands) => {
    updateCondition(condIndex, { commands });
  };

  const toggleExpand = (index) => {
    setExpandedBranches({
      ...expandedBranches,
      [index]: !expandedBranches[index]
    });
  };

  const getBranchLabel = (condition, index) => {
    if (condition.type === 'if') return 'IF';
    if (condition.type === 'elseif') return `ELSE IF #${index}`;
    if (condition.type === 'else') return 'ELSE';
    return '';
  };

  const getBranchColor = (condition) => {
    if (condition.type === 'if') return '#3498db';
    if (condition.type === 'elseif') return '#9b59b6';
    if (condition.type === 'else') return '#95a5a6';
    return '#fff';
  };

  const hasElse = branching.conditions.some(c => c.type === 'else');

  return (
    <div style={{ padding: '8px', background: '#1a1a2e', border: '2px solid #f39c12', marginTop: '8px' }}>
      {/* Label */}
      <div style={{ marginBottom: '8px' }}>
        <label style={{ display: 'block', fontSize: '9px', color: '#f39c12', marginBottom: '2px' }}>Branch Label (optional):</label>
        <input 
          type="text" 
          value={branching.label || ''} 
          onChange={(e) => updateBranching({ ...branching, label: e.target.value })} 
          placeholder="e.g. Check Player Health"
          style={{ width: '100%', padding: '4px', background: '#0f0f1f', border: '1px solid #4a5568', color: '#f39c12', fontSize: '10px', fontFamily: 'inherit' }} 
        />
      </div>

      {/* Conditions */}
      {branching.conditions.map((condition, condIdx) => (
        <div key={condition.id || condIdx} style={{ marginBottom: '8px', border: `1px solid ${getBranchColor(condition)}`, background: '#2a2a3e', padding: '6px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer' }} onClick={() => toggleExpand(condIdx)}>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleExpand(condIdx); }} 
                style={{ padding: '2px 6px', background: '#1a1a2e', color: '#fff', border: '1px solid #4a5568', cursor: 'pointer', fontSize: '9px', fontFamily: 'inherit' }}
              >
                {expandedBranches[condIdx] ? '▼' : '▶'}
              </button>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: getBranchColor(condition) }}>
                {getBranchLabel(condition, condIdx)}
              </span>
              {condition.type !== 'else' && (
                <span style={{ fontSize: '9px', color: '#888' }}>
                  ({condition.checkType === 'flag' ? condition.flagName : condition.variableName} {condition.operator} {condition.checkType === 'flag' ? (condition.compareValue ? 'TRUE' : 'FALSE') : condition.compareValue})
                </span>
              )}
              <span style={{ fontSize: '9px', color: '#666' }}>
                ({condition.commands?.length || 0} commands)
              </span>
            </div>
            
            {condition.type !== 'if' && (
              <button onClick={() => deleteCondition(condIdx)} style={{ padding: '2px 6px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '9px', fontFamily: 'inherit' }}>×</button>
            )}
          </div>

          {/* Condition Settings */}
          {expandedBranches[condIdx] && condition.type !== 'else' && (
            <div style={{ marginBottom: '8px', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                <select 
                  value={condition.checkType} 
                  onChange={(e) => updateCondition(condIdx, { checkType: e.target.value })} 
                  style={{ flex: 1, padding: '4px', background: '#0f0f1f', border: '1px solid #4a5568', color: '#fff', fontSize: '9px', fontFamily: 'inherit' }}
                >
                  <option value="flag">Flag</option>
                  <option value="variable">Variable</option>
                </select>

                {condition.checkType === 'flag' ? (
                  <select 
                    value={condition.flagName || ''} 
                    onChange={(e) => updateCondition(condIdx, { flagName: e.target.value })} 
                    style={{ flex: 2, padding: '4px', background: '#0f0f1f', border: '1px solid #4a5568', color: '#fff', fontSize: '9px', fontFamily: 'inherit' }}
                  >
                    <option value="">-- Select Flag --</option>
                    {flags.map(flag => <option key={flag.id} value={flag.name}>{flag.name}</option>)}
                  </select>
                ) : (
                  <select 
                    value={condition.variableName || ''} 
                    onChange={(e) => updateCondition(condIdx, { variableName: e.target.value })} 
                    style={{ flex: 2, padding: '4px', background: '#0f0f1f', border: '1px solid #4a5568', color: '#fff', fontSize: '9px', fontFamily: 'inherit' }}
                  >
                    <option value="">-- Select Variable --</option>
                    {variables.map(variable => <option key={variable.id} value={variable.name}>{variable.name}</option>)}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <select 
                  value={condition.operator} 
                  onChange={(e) => updateCondition(condIdx, { operator: e.target.value })} 
                  style={{ flex: 1, padding: '4px', background: '#0f0f1f', border: '1px solid #4a5568', color: '#fff', fontSize: '9px', fontFamily: 'inherit' }}
                >
                  <option value="==">=</option>
                  <option value="!=">≠</option>
                  {condition.checkType === 'variable' && (
                    <>
                      <option value=">">{'>'}</option>
                      <option value="<">{'<'}</option>
                      <option value=">=">{'>='}</option>
                      <option value="<=">{'<='}</option>
                    </>
                  )}
                </select>

                {condition.checkType === 'flag' ? (
                  <select 
                    value={condition.compareValue ? 'true' : 'false'} 
                    onChange={(e) => updateCondition(condIdx, { compareValue: e.target.value === 'true' })} 
                    style={{ flex: 1, padding: '4px', background: '#0f0f1f', border: '1px solid #4a5568', color: '#fff', fontSize: '9px', fontFamily: 'inherit' }}
                  >
                    <option value="true">TRUE</option>
                    <option value="false">FALSE</option>
                  </select>
                ) : (
                  <input 
                    type="number" 
                    min="0" 
                    max="255" 
                    value={condition.compareValue || 0} 
                    onChange={(e) => updateCondition(condIdx, { compareValue: Math.max(0, Math.min(255, parseInt(e.target.value) || 0)) })} 
                    style={{ flex: 1, padding: '4px', background: '#0f0f1f', border: '1px solid #4a5568', color: '#3498db', fontSize: '9px', fontFamily: 'inherit', textAlign: 'center' }} 
                  />
                )}
              </div>
            </div>
          )}

          {/* Commands inside branch */}
          {expandedBranches[condIdx] && (
            <div style={{ background: '#0f0f1f', padding: '6px', border: '1px dashed #4a5568' }}>
              <CommandEditor 
                commands={condition.commands || []} 
                sceneIndex={sceneIndex} 
                updateCommands={(cmds) => updateConditionCommands(condIdx, cmds)} 
                totalScenes={totalScenes} 
                flags={flags}
                variables={variables}
                audio={audio}
                characters={characters}
                backgrounds={backgrounds}
                sharedCommands={sharedCommands}
                collapsedCommands={collapsedCommands}  // ← AGGIUNGI
                setCollapsedCommands={setCollapsedCommands}  // ← AGGIUNGI     
              />
            </div>
          )}
        </div>
      ))}

      {/* Add Else If / Else buttons */}
      <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
        <button onClick={addElseIf} style={{ flex: 1, padding: '6px', background: '#9b59b6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold', fontFamily: 'inherit' }}>
          + Else If
        </button>
        {!hasElse && (
          <button onClick={addElse} style={{ flex: 1, padding: '6px', background: '#95a5a6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold', fontFamily: 'inherit' }}>
            + Else
          </button>
        )}
      </div>
    </div>
  );
};

export default BranchingEditor;