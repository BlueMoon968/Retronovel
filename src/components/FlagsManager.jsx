import React from 'react';

const FlagsManager = ({ flags, updateFlags }) => {
  const addFlag = () => {
    if (flags.length >= 999) {
      alert('Maximum 999 flags reached');
      return;
    }
    const newFlag = {
      id: Date.now(),
      name: `flag_${flags.length + 1}`,
      value: false
    };
    updateFlags([...flags, newFlag]);
  };

  const updateFlag = (id, field, value) => {
    updateFlags(flags.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const deleteFlag = (id) => {
    updateFlags(flags.filter(f => f.id !== id));
  };

  return (
    <div style={{ padding: '12px', background: '#2a2a3e', border: '1px solid #4a5568' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '12px', color: '#f39c12' }}>Flags ({flags.length}/999)</h4>
        <button onClick={addFlag} disabled={flags.length >= 999} style={{ padding: '6px 12px', background: flags.length >= 999 ? '#555' : '#27ae60', color: '#fff', border: 'none', cursor: flags.length >= 999 ? 'not-allowed' : 'pointer', fontSize: '11px', fontFamily: 'inherit' }}>+ Flag</button>
      </div>

      {flags.length === 0 && (
        <div style={{ padding: '16px', background: '#1a1a2e', border: '1px dashed #4a5568', textAlign: 'center', fontSize: '11px', color: '#666' }}>No flags created</div>
      )}

      {flags.map(flag => (
        <div key={flag.id} style={{ padding: '8px', background: '#1a1a2e', border: '1px solid #4a5568', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="text" value={flag.name} onChange={(e) => updateFlag(flag.id, 'name', e.target.value)} style={{ flex: 1, padding: '4px', background: '#0f0f1f', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit' }} />
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: flag.value ? '#27ae60' : '#e74c3c', minWidth: '60px' }}>
            <input type="checkbox" checked={flag.value} onChange={(e) => updateFlag(flag.id, 'value', e.target.checked)} style={{ marginRight: '6px' }} />
            {flag.value ? 'TRUE' : 'FALSE'}
          </label>
          <button onClick={() => deleteFlag(flag.id)} style={{ padding: '4px 8px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>×</button>
        </div>
      ))}
    </div>
  );
};

export default FlagsManager;
