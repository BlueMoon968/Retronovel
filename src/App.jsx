import React, { useState, useEffect, useRef } from 'react';

// Visual Novel Editor - GBA/NDS Style
// Resolution: 256x192 (NDS single screen)

const VNEditor = () => {
  const [project, setProject] = useState({
    title: "My Visual Novel",
    resolution: [256, 192],
    scenes: [
      {
        id: 1,
        background: "#2d5a3d",
        character: null,
        characterPosition: "center",
        dialogues: [
          {
            speaker: "Narratore",
            text: "Benvenuto nel Visual Novel Editor!",
          }
        ],
        choices: []
      }
    ],
    characters: [],
    backgrounds: []
  });

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('scenes'); // scenes, characters, settings
  const [isPlaying, setIsPlaying] = useState(false);
  
  const canvasRef = useRef(null);

  // Render the preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const [width, height] = project.resolution;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const scene = project.scenes[currentSceneIndex];
    if (!scene) return;

    // Draw background
    ctx.fillStyle = scene.background;
    ctx.fillRect(0, 0, width, height);

    // Draw character placeholder (if exists)
    if (scene.character) {
      ctx.fillStyle = '#4a4a4a';
      const charWidth = 64;
      const charHeight = 96;
      let charX = (width - charWidth) / 2;
      
      if (scene.characterPosition === 'left') charX = 20;
      if (scene.characterPosition === 'right') charX = width - charWidth - 20;
      
      ctx.fillRect(charX, height - charHeight - 50, charWidth, charHeight);
    }

    // Draw dialogue box
    const dialogue = scene.dialogues[currentDialogueIndex];
    if (dialogue) {
      // Box background
      ctx.fillStyle = 'rgba(20, 20, 30, 0.85)';
      ctx.fillRect(8, height - 60, width - 16, 52);
      
      // Box border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, height - 60, width - 16, 52);

      // Speaker name
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(dialogue.speaker, 16, height - 48);

      // Dialogue text
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      
      // Word wrap
      const maxWidth = width - 32;
      const words = dialogue.text.split(' ');
      let line = '';
      let y = height - 34;
      const lineHeight = 12;

      for (let word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line, 16, y);
          line = word + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 16, y);

      // Arrow indicator
      if (currentDialogueIndex < scene.dialogues.length - 1 || currentSceneIndex < project.scenes.length - 1) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(width - 20, height - 16);
        ctx.lineTo(width - 16, height - 12);
        ctx.lineTo(width - 20, height - 8);
        ctx.fill();
      }
    }

    // Draw scene indicator
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 60, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText(`Scene ${currentSceneIndex + 1}/${project.scenes.length}`, 4, 10);

  }, [project, currentSceneIndex, currentDialogueIndex]);

  // Handle canvas click to advance dialogue
  const handleCanvasClick = () => {
    if (!isPlaying) return;
    
    const scene = project.scenes[currentSceneIndex];
    
    if (currentDialogueIndex < scene.dialogues.length - 1) {
      setCurrentDialogueIndex(currentDialogueIndex + 1);
    } else if (currentSceneIndex < project.scenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
      setCurrentDialogueIndex(0);
    }
  };

  // Add new scene
  const addScene = () => {
    setProject({
      ...project,
      scenes: [...project.scenes, {
        id: project.scenes.length + 1,
        background: "#2d5a3d",
        character: null,
        characterPosition: "center",
        dialogues: [{ speaker: "Narratore", text: "Nuovo dialogo..." }],
        choices: []
      }]
    });
  };

  // Update scene
  const updateScene = (index, updates) => {
    const newScenes = [...project.scenes];
    newScenes[index] = { ...newScenes[index], ...updates };
    setProject({ ...project, scenes: newScenes });
  };

  // Add dialogue to scene
  const addDialogue = (sceneIndex) => {
    const newScenes = [...project.scenes];
    newScenes[sceneIndex].dialogues.push({
      speaker: "Personaggio",
      text: "Nuovo dialogo..."
    });
    setProject({ ...project, scenes: newScenes });
  };

  // Update dialogue
  const updateDialogue = (sceneIndex, dialogueIndex, field, value) => {
    const newScenes = [...project.scenes];
    newScenes[sceneIndex].dialogues[dialogueIndex][field] = value;
    setProject({ ...project, scenes: newScenes });
  };

  // Delete dialogue
  const deleteDialogue = (sceneIndex, dialogueIndex) => {
    const newScenes = [...project.scenes];
    if (newScenes[sceneIndex].dialogues.length > 1) {
      newScenes[sceneIndex].dialogues.splice(dialogueIndex, 1);
      setProject({ ...project, scenes: newScenes });
    }
  };

  // Delete scene
  const deleteScene = (index) => {
    if (project.scenes.length > 1) {
      const newScenes = project.scenes.filter((_, i) => i !== index);
      setProject({ ...project, scenes: newScenes });
      if (currentSceneIndex >= newScenes.length) {
        setCurrentSceneIndex(newScenes.length - 1);
      }
    }
  };

  // Export HTML
  const exportHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: monospace;
      overflow: hidden;
    }
    #game-container {
      position: relative;
      display: inline-block;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
    canvas {
      display: block;
      border: 2px solid #333;
      cursor: pointer;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
    @media (max-width: 600px) {
      canvas { max-width: 100vw; height: auto; }
    }
  </style>
</head>
<body>
  <div id="game-container">
    <canvas id="game" width="256" height="192"></canvas>
  </div>
  <script>
    const gameData = ${JSON.stringify(project, null, 2)};
    
    let currentScene = 0;
    let currentDialogue = 0;
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    
    function render() {
      const [width, height] = gameData.resolution;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      
      const scene = gameData.scenes[currentScene];
      if (!scene) return;
      
      // Background
      ctx.fillStyle = scene.background;
      ctx.fillRect(0, 0, width, height);
      
      // Character
      if (scene.character) {
        ctx.fillStyle = '#4a4a4a';
        const charWidth = 64;
        const charHeight = 96;
        let charX = (width - charWidth) / 2;
        
        if (scene.characterPosition === 'left') charX = 20;
        if (scene.characterPosition === 'right') charX = width - charWidth - 20;
        
        ctx.fillRect(charX, height - charHeight - 50, charWidth, charHeight);
      }
      
      // Dialogue
      const dialogue = scene.dialogues[currentDialogue];
      if (dialogue) {
        ctx.fillStyle = 'rgba(20, 20, 30, 0.85)';
        ctx.fillRect(8, height - 60, width - 16, 52);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(8, height - 60, width - 16, 52);
        
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(dialogue.speaker, 16, height - 48);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        
        const maxWidth = width - 32;
        const words = dialogue.text.split(' ');
        let line = '';
        let y = height - 34;
        const lineHeight = 12;
        
        for (let word of words) {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, 16, y);
            line = word + ' ';
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 16, y);
        
        if (currentDialogue < scene.dialogues.length - 1 || currentScene < gameData.scenes.length - 1) {
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.moveTo(width - 20, height - 16);
          ctx.lineTo(width - 16, height - 12);
          ctx.lineTo(width - 20, height - 8);
          ctx.fill();
        }
      }
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, 60, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      ctx.fillText('Scene ' + (currentScene + 1) + '/' + gameData.scenes.length, 4, 10);
    }
    
    canvas.addEventListener('click', () => {
      const scene = gameData.scenes[currentScene];
      
      if (currentDialogue < scene.dialogues.length - 1) {
        currentDialogue++;
      } else if (currentScene < gameData.scenes.length - 1) {
        currentScene++;
        currentDialogue = 0;
      }
      
      render();
    });
    
    render();
  </script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const exportJSON = () => {
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const importJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        setProject(imported);
        setCurrentSceneIndex(0);
        setCurrentDialogueIndex(0);
      } catch (err) {
        alert('Errore nel caricamento del file JSON');
      }
    };
    reader.readAsText(file);
  };

  const scene = project.scenes[currentSceneIndex];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      display: 'flex',
      fontFamily: '"Courier New", monospace',
      color: '#e0e0e0',
      overflow: 'hidden'
    }}>
      {/* Left Panel - Editor */}
      <div style={{
        width: '320px',
        background: 'rgba(15, 15, 25, 0.8)',
        borderRight: '2px solid #4a5568',
        overflowY: 'auto',
        padding: '16px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{
            fontSize: '18px',
            color: '#f39c12',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>VN Editor</h1>
          <input
            type="text"
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              background: '#2a2a3e',
              border: '1px solid #4a5568',
              color: '#fff',
              fontSize: '12px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          {['scenes', 'export'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px',
                background: activeTab === tab ? '#f39c12' : '#2a2a3e',
                color: activeTab === tab ? '#000' : '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                fontFamily: 'inherit'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Scenes Tab */}
        {activeTab === 'scenes' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h3 style={{ fontSize: '14px', color: '#f39c12' }}>Scene</h3>
              <button
                onClick={addScene}
                style={{
                  padding: '6px 12px',
                  background: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontFamily: 'inherit'
                }}
              >
                + Nuova
              </button>
            </div>

            {/* Scene List */}
            <div style={{ marginBottom: '16px' }}>
              {project.scenes.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setCurrentSceneIndex(idx);
                    setCurrentDialogueIndex(0);
                  }}
                  style={{
                    padding: '8px',
                    background: currentSceneIndex === idx ? '#4a5568' : '#2a2a3e',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    border: '1px solid #4a5568',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '12px' }}>Scene {idx + 1}</span>
                  {project.scenes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScene(idx);
                      }}
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
              ))}
            </div>

            {/* Scene Properties */}
            {scene && (
              <div style={{
                padding: '12px',
                background: '#2a2a3e',
                border: '1px solid #4a5568',
                marginBottom: '16px'
              }}>
                <h4 style={{ fontSize: '12px', marginBottom: '8px', color: '#f39c12' }}>
                  Proprietà Scene {currentSceneIndex + 1}
                </h4>
                
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>
                  Background Color:
                </label>
                <input
                  type="color"
                  value={scene.background}
                  onChange={(e) => updateScene(currentSceneIndex, { background: e.target.value })}
                  style={{ width: '100%', height: '32px', marginBottom: '12px' }}
                />

                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>
                  Character Position:
                </label>
                <select
                  value={scene.characterPosition}
                  onChange={(e) => updateScene(currentSceneIndex, { characterPosition: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: '#1a1a2e',
                    border: '1px solid #4a5568',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'inherit',
                    marginBottom: '12px'
                  }}
                >
                  <option value="left">Sinistra</option>
                  <option value="center">Centro</option>
                  <option value="right">Destra</option>
                </select>

                <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px' }}>
                  <input
                    type="checkbox"
                    checked={scene.character !== null}
                    onChange={(e) => updateScene(currentSceneIndex, { 
                      character: e.target.checked ? 'placeholder' : null 
                    })}
                    style={{ marginRight: '8px' }}
                  />
                  Mostra Personaggio
                </label>
              </div>
            )}

            {/* Dialogues */}
            {scene && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <h4 style={{ fontSize: '12px', color: '#f39c12' }}>Dialoghi</h4>
                  <button
                    onClick={() => addDialogue(currentSceneIndex)}
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
                    + Dialogo
                  </button>
                </div>

                {scene.dialogues.map((dialogue, dIdx) => (
                  <div
                    key={dIdx}
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
                        Dialogo {dIdx + 1}
                      </span>
                      {scene.dialogues.length > 1 && (
                        <button
                          onClick={() => deleteDialogue(currentSceneIndex, dIdx)}
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
                    
                    <input
                      type="text"
                      value={dialogue.speaker}
                      onChange={(e) => updateDialogue(currentSceneIndex, dIdx, 'speaker', e.target.value)}
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
                      value={dialogue.text}
                      onChange={(e) => updateDialogue(currentSceneIndex, dIdx, 'text', e.target.value)}
                      placeholder="Testo del dialogo..."
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div>
            <h3 style={{ fontSize: '14px', color: '#f39c12', marginBottom: '16px' }}>
              Export & Import
            </h3>
            
            <button
              onClick={exportHTML}
              style={{
                width: '100%',
                padding: '12px',
                background: '#3498db',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                marginBottom: '8px',
                fontWeight: 'bold',
                fontFamily: 'inherit'
              }}
            >
              📦 Esporta HTML
            </button>
            
            <button
              onClick={exportJSON}
              style={{
                width: '100%',
                padding: '12px',
                background: '#9b59b6',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                marginBottom: '8px',
                fontWeight: 'bold',
                fontFamily: 'inherit'
              }}
            >
              💾 Esporta JSON
            </button>
            
            <label style={{
              width: '100%',
              padding: '12px',
              background: '#e67e22',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'block',
              textAlign: 'center',
              fontWeight: 'bold',
              fontFamily: 'inherit'
            }}>
              📁 Importa JSON
              <input
                type="file"
                accept=".json"
                onChange={importJSON}
                style={{ display: 'none' }}
              />
            </label>

            <div style={{
              marginTop: '24px',
              padding: '12px',
              background: 'rgba(52, 152, 219, 0.1)',
              border: '1px solid #3498db',
              fontSize: '11px',
              lineHeight: '1.6'
            }}>
              <strong style={{ color: '#3498db' }}>💡 Info:</strong>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>Esporta HTML per un file standalone</li>
                <li>Esporta JSON per salvare/condividere</li>
                <li>Importa JSON per caricare progetti</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Center Panel - Preview */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative'
      }}>
        <div style={{
          marginBottom: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              if (!isPlaying) {
                setCurrentSceneIndex(0);
                setCurrentDialogueIndex(0);
              }
            }}
            style={{
              padding: '10px 20px',
              background: isPlaying ? '#e74c3c' : '#27ae60',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              fontFamily: 'inherit'
            }}
          >
            {isPlaying ? '⏹ Stop' : '▶ Play'}
          </button>

          <div style={{
            padding: '8px 16px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid #4a5568',
            fontSize: '11px'
          }}>
            Scene {currentSceneIndex + 1} / {project.scenes.length} • 
            Dialogo {currentDialogueIndex + 1} / {scene?.dialogues.length || 0}
          </div>
        </div>

        <div style={{
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          border: '3px solid #4a5568'
        }}>
          <canvas
            ref={canvasRef}
            width="256"
            height="192"
            onClick={handleCanvasClick}
            style={{
              display: 'block',
              imageRendering: 'pixelated',
              imageRendering: 'crisp-edges',
              width: '512px',
              height: '384px',
              cursor: isPlaying ? 'pointer' : 'default'
            }}
          />
        </div>

        <div style={{
          marginTop: '16px',
          fontSize: '11px',
          color: '#aaa',
          textAlign: 'center'
        }}>
          {isPlaying ? 'Clicca sulla preview per avanzare' : 'Premi Play per testare la visual novel'}
        </div>
      </div>
    </div>
  );
};

export default VNEditor;