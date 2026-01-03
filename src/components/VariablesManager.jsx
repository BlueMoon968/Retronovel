import React from 'react';

const VariablesManager = ({ variables, updateVariables }) => {
  const addVariable = () => {
    if (variables.length >= 999) {
      alert('Maximum 999 variables reached');
      return;
    }
    const newVariable = {
      id: Date.now(),
      name: `var_${variables.length + 1}`,
      value: 0
    };
    updateVariables([...variables, newVariable]);
  };

    const updateVariable = (id, field, value) => {
    if (field === 'value') {
        // Allow empty string temporarily during editing
        if (value === '') {
        updateVariables(variables.map(v => v.id === id ? { ...v, [field]: value } : v));
        return;
        }
        // Otherwise clamp value
        value = Math.max(0, Math.min(255, parseInt(value) || 0));
    }
    updateVariables(variables.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

  const deleteVariable = (id) => {
    updateVariables(variables.filter(v => v.id !== id));
  };

  return (
    <div style={{ padding: '12px', background: '#2a2a3e', border: '1px solid #4a5568', marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '11px', color: '#3498db' }}>Variables ({variables.length}/999)</h4>
        <button onClick={addVariable} disabled={variables.length >= 999} style={{ padding: '4px 10px', background: variables.length >= 999 ? '#555' : '#3498db', color: '#fff', border: 'none', cursor: variables.length >= 999 ? 'not-allowed' : 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>+ Var</button>
        </div>

      {variables.length === 0 && (
        <div style={{ padding: '16px', background: '#1a1a2e', border: '1px dashed #4a5568', textAlign: 'center', fontSize: '11px', color: '#666' }}>No variables created</div>
      )}

        {variables.map(variable => (
        <div key={variable.id} style={{ padding: '8px', background: '#1a1a2e', border: '1px solid #4a5568', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
            type="text" 
            value={variable.name} 
            onChange={(e) => updateVariable(variable.id, 'name', e.target.value)} 
            placeholder="var_name"
            style={{ flex: 1, padding: '4px', background: '#0f0f1f', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit' }} 
            />
            <input 
            type="text" 
            value={variable.value} 
            onChange={(e) => {
                const val = e.target.value;
                // Allow empty or numbers only
                if (val === '' || /^\d+$/.test(val)) {
                const numVal = val === '' ? '' : parseInt(val);
                if (val === '' || (numVal >= 0 && numVal <= 255)) {
                    updateVariable(variable.id, 'value', val === '' ? '' : numVal);
                }
                }
            }}
            onBlur={(e) => {
                // On blur, ensure valid value
                if (e.target.value === '') {
                updateVariable(variable.id, 'value', 0);
                }
            }}
            placeholder="0-255"
            style={{ width: '60px', padding: '4px', background: '#0f0f1f', border: '1px solid #4a5568', color: '#3498db', fontSize: '11px', fontFamily: 'inherit', textAlign: 'center' }} 
            />
            <button onClick={() => deleteVariable(variable.id)} style={{ padding: '4px 8px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>×</button>
        </div>
        ))}
    </div>
  );
};

export default VariablesManager;