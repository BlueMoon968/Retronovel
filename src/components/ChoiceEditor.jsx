import React from 'react';

const ChoiceEditor = ({ dialogue, sceneIndex, dialogueIndex, updateDialogue, totalScenes, flags }) => {
  const choices = dialogue.choices || [];

  const addChoice = () => {
    const newChoices = [...choices, { text: "New choice", goto: sceneIndex + 1 }];
    updateDialogue(sceneIndex, dialogueIndex, 'choices', newChoices);
  };

  const updateChoice = (choiceIndex, field, value) => {
    const newChoices = [...choices];
    newChoices[choiceIndex][field] = value;
    updateDialogue(sceneIndex, dialogueIndex, 'choices', newChoices);
  };

  const deleteChoice = (choiceIndex) => {
    const newChoices = choices.filter((_, i) => i !== choiceIndex);
    updateDialogue(sceneIndex, dialogueIndex, 'choices', newChoices);
  };

  return (
    <div style={{
      padding: '8px',
      background: '#1a1a2e',
      border: '1px solid #4a5568',
      marginTop: '8px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{ fontSize: '10px', color: '#f39c12' }}>Choices (Branching)</span>
        <button
          onClick={addChoice}
          style={{
            padding: '2px 6px',
            background: '#27ae60',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '9px',
            fontFamily: 'inherit'
          }}
        >
          + Choice
        </button>
      </div>

      {choices.map((choice, idx) => (
        <div
          key={idx}
          style={{
            padding: '6px',
            background: '#2a2a3e',
            border: '1px solid #4a5568',
            marginBottom: '4px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '9px', color: '#888' }}>Choice {idx + 1}</span>
            <button
              onClick={() => deleteChoice(idx)}
              style={{
                padding: '1px 4px',
                background: '#e74c3c',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '8px',
                fontFamily: 'inherit'
              }}
            >
              ×
            </button>
          </div>

          <input
            type="text"
            value={choice.text}
            onChange={(e) => updateChoice(idx, 'text', e.target.value)}
            placeholder="Choice text"
            style={{
              width: '100%',
              padding: '4px',
              background: '#16213e',
              border: '1px solid #4a5568',
              color: '#fff',
              fontSize: '10px',
              marginBottom: '4px',
              fontFamily: 'inherit'
            }}
          />

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: '#888' }}>→ Go to scene:</span>
            <input
              type="number"
              min="1"
              max={totalScenes}
              value={choice.goto + 1}
              onChange={(e) => updateChoice(idx, 'goto', Math.max(0, Math.min(totalScenes - 1, parseInt(e.target.value) - 1)))}
              style={{
                width: '50px',
                padding: '2px 4px',
                background: '#16213e',
                border: '1px solid #4a5568',
                color: '#fff',
                fontSize: '10px',
                fontFamily: 'inherit'
              }}
            />
          </div>

        <div style={{ marginTop: '4px' }}>
                <label style={{ fontSize: '9px', color: '#888', display: 'block', marginBottom: '2px' }}>
                  Set flag (optional):
                </label>
                <select
                  value={choice.setFlag || ''}
                  onChange={(e) => updateChoice(idx, 'setFlag', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '2px 4px',
                    background: '#16213e',
                    border: '1px solid #4a5568',
                    color: '#fff',
                    fontSize: '10px',
                    fontFamily: 'inherit'
                  }}
                >
                  {flags.map(flag => (
                    <option key={flag.id} value={flag.name}>{flag.name}</option>
                  ))}
                  <option value="">None</option>
                  {/* */}
                </select>
                {choice.setFlag && (
                  <label style={{ fontSize: '9px', color: '#888', display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                    <input
                      type="checkbox"
                      checked={choice.setFlagValue !== false}
                      onChange={(e) => updateChoice(idx, 'setFlagValue', e.target.checked)}
                      style={{ marginRight: '4px' }}
                    />
                    Set to {choice.setFlagValue !== false ? 'TRUE' : 'FALSE'}
                  </label>
                )}
              </div>
        </div>
      ))}


      {choices.length === 0 && (
        <div style={{
          padding: '8px',
          textAlign: 'center',
          fontSize: '9px',
          color: '#666'
        }}>
          No choices (linear dialogue)
        </div>
      )}
    </div>
  );
};

export default ChoiceEditor;