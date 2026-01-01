import React from 'react';

const ChoiceEditor = ({ dialogue, sceneIndex, dialogueIndex, updateDialogue, totalScenes, flags }) => {
  const addChoice = () => {
    const newChoice = {
      id: Date.now(),
      text: "New choice",
      enableGoto: false,
      goto: Math.min(sceneIndex + 1, totalScenes - 1),
      setFlag: '',
      setFlagValue: true
    };
    updateDialogue(sceneIndex, dialogueIndex, 'choices', [...(dialogue.choices || []), newChoice]);
  };

  const updateChoice = (choiceIndex, field, value) => {
    const newChoices = [...dialogue.choices];
    newChoices[choiceIndex] = { ...newChoices[choiceIndex], [field]: value };
    updateDialogue(sceneIndex, dialogueIndex, 'choices', newChoices);
  };

  const deleteChoice = (choiceIndex) => {
    const newChoices = dialogue.choices.filter((_, i) => i !== choiceIndex);
    updateDialogue(sceneIndex, dialogueIndex, 'choices', newChoices);
  };

  if (!dialogue.choices) return null;

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h5 style={{ fontSize: '11px', color: '#3498db' }}>Choices (Branching)</h5>
        <button onClick={addChoice} style={{ padding: '4px 8px', background: '#3498db', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '9px', fontFamily: 'inherit' }}>+ Choice</button>
      </div>

      {dialogue.choices.length === 0 && (
        <div style={{ padding: '8px', background: '#1a1a2e', border: '1px dashed #4a5568', fontSize: '10px', color: '#666', textAlign: 'center' }}>No choices (linear dialogue)</div>
      )}

      {dialogue.choices.map((choice, idx) => (
        <div key={choice.id} style={{ padding: '8px', background: '#1a1a2e', border: '1px solid #3498db', marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', color: '#3498db' }}>Choice {idx + 1}</span>
            <button onClick={() => deleteChoice(idx)} style={{ padding: '2px 6px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '9px', fontFamily: 'inherit' }}>×</button>
          </div>

          <input type="text" value={choice.text} onChange={(e) => updateChoice(idx, 'text', e.target.value)} placeholder="Choice text..." style={{ width: '100%', padding: '4px', background: '#0f0f1f', border: '1px solid #4a5568', color: '#fff', fontSize: '10px', marginBottom: '6px', fontFamily: 'inherit' }} />

          <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px', marginBottom: '4px' }}>
            <input type="checkbox" checked={choice.enableGoto} onChange={(e) => updateChoice(idx, 'enableGoto', e.target.checked)} style={{ marginRight: '6px' }} />
            Jump to scene
          </label>

          {choice.enableGoto && (
            <input type="number" min="1" max={totalScenes} value={choice.goto + 1} onChange={(e) => updateChoice(idx, 'goto', Math.max(0, Math.min(totalScenes - 1, parseInt(e.target.value) - 1)))} style={{ width: '100%', padding: '4px', background: '#0f0f1f', border: '1px solid #4a5568', color: '#fff', fontSize: '10px', marginBottom: '6px', fontFamily: 'inherit' }} />
          )}

          {flags.length > 0 && (
            <>
              <label style={{ display: 'block', fontSize: '9px', color: '#888', marginBottom: '4px', marginTop: '6px' }}>Optional: Set flag on choice</label>
              <select value={choice.setFlag || ''} onChange={(e) => updateChoice(idx, 'setFlag', e.target.value)} style={{ width: '100%', padding: '4px', background: '#0f0f1f', border: '1px solid #4a5568', color: '#fff', fontSize: '10px', marginBottom: '4px', fontFamily: 'inherit' }}>
                <option value="">-- No flag --</option>
                {flags.map(flag => <option key={flag.id} value={flag.name}>{flag.name}</option>)}
              </select>
              {choice.setFlag && (
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px' }}>
                  <input type="checkbox" checked={choice.setFlagValue !== false} onChange={(e) => updateChoice(idx, 'setFlagValue', e.target.checked)} style={{ marginRight: '6px' }} />
                  Set to {choice.setFlagValue !== false ? 'TRUE' : 'FALSE'}
                </label>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChoiceEditor;
