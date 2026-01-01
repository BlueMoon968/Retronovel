import React from 'react';

const FlagsManager = ({ flags, setFlags }) => {
  const addFlag = () => {
    if (flags.length >= 999) {
      alert('Maximum 999 flags reached');
      return;
    }
    const newFlags = [...flags, { id: Date.now(), name: `flag_${flags.length + 1}`, value: false }];
    setFlags(newFlags);
  };

  const updateFlag = (id, field, value) => {
    const newFlags = flags.map(f => f.id === id ? { ...f, [field]: value } : f);
    setFlags(newFlags);
  };

  const deleteFlag = (id) => {
    setFlags(flags.filter(f => f.id !== id));
  };

  return (
    <div style={{
      padding: '12px',
      background: '#2a2a3e',
      border: '1px solid #4a5568',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <h4 style={{ fontSize: '12px', color: '#f39c12' }}>
          Flags ({flags.length}/999)
        </h4>
        <button
          onClick={addFlag}
          disabled={flags.length >= 999}
          style={{
            padding: '4px 8px',
            background: flags.length >= 999 ? '#666' : '#27ae60',
            color: '#fff',
            border: 'none',
            cursor: flags.length >= 999 ? 'not-allowed' : 'pointer',
            fontSize: '10px',
            fontFamily: 'inherit'
          }}
        >
          + Flag
        </button>
      </div>

      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {flags.map(flag => (
          <div
            key={flag.id}
            style={{
              padding: '6px',
              background: '#1a1a2e',
              border: '1px solid #4a5568',
              marginBottom: '4px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              value={flag.name}
              onChange={(e) => updateFlag(flag.id, 'name', e.target.value)}
              style={{
                flex: 1,
                padding: '4px',
                background: '#16213e',
                border: '1px solid #4a5568',
                color: '#fff',
                fontSize: '10px',
                fontFamily: 'inherit'
              }}
            />
            <label style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '10px',
              color: flag.value ? '#27ae60' : '#666'
            }}>
              <input
                type="checkbox"
                checked={flag.value}
                onChange={(e) => updateFlag(flag.id, 'value', e.target.checked)}
                style={{ marginRight: '4px' }}
              />
              {flag.value ? 'TRUE' : 'FALSE'}
            </label>
            <button
              onClick={() => deleteFlag(flag.id)}
              style={{
                padding: '2px 6px',
                background: '#e74c3c',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '9px',
                fontFamily: 'inherit'
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {flags.length === 0 && (
        <div style={{
          padding: '12px',
          textAlign: 'center',
          fontSize: '10px',
          color: '#666'
        }}>
          No flags defined
        </div>
      )}
    </div>
  );
};

export default FlagsManager;