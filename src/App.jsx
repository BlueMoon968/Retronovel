import React, { useState, useEffect, useRef } from 'react';
import CommandEditor from './components/CommandEditor';
import FlagsManager from './components/FlagsManager';
import { drawNinePatch, drawNameBox, drawDialogueText, drawChoices, drawArrow, drawSceneIndicator } from './engine/renderEngine';
import { performGradientWipe, captureScene } from './engine/transitionEngine';
import { generateGameHTML } from './engine/exportEngine';

const VNEditor = () => {
  const [project, setProject] = useState({
    title: "My Visual Novel",
    resolution: [256, 192],
    flags: [],
    settings: { scale: 2, fontFamily: 'dogica, monospace', customFont: null, customMsgBox: null, customNameBox: null, customTransition: null, transitionDuration: 800 },
    scenes: [{ id: 1, name: "Scene 1", background: "#2d5a3d", character: null, characterImage: null, characterPosition: "center", backgroundImage: null, commands: [{ id: Date.now(), type: "dialogue", speaker: "Narrator", text: "Welcome to the Visual Novel Editor!", choices: [] }] }],
    characters: [],
    backgrounds: []
  });

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('scenes');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [choicePositions, setChoicePositions] = useState(null);
  
  const canvasRef = useRef(null);
  const msgBoxImageRef = useRef(null);
  const nameBoxImageRef = useRef(null);
  const transitionImageRef = useRef(null);

  useEffect(() => {
    const loadImages = async () => {
      const msgBoxImg = new Image();
      msgBoxImg.src = '/graphics/msgbox.png';
      await new Promise(resolve => { msgBoxImg.onload = () => { msgBoxImageRef.current = msgBoxImg; resolve(); }; msgBoxImg.onerror = () => resolve(); });
      const nameBoxImg = new Image();
      nameBoxImg.src = '/graphics/namebox.png';
      await new Promise(resolve => { nameBoxImg.onload = () => { nameBoxImageRef.current = nameBoxImg; resolve(); }; nameBoxImg.onerror = () => resolve(); });
      setProject(p => ({...p}));
    };
    loadImages();
  }, []);

  useEffect(() => {
    if (project.settings.customMsgBox) {
      const img = new Image();
      img.src = project.settings.customMsgBox;
      img.onload = () => { msgBoxImageRef.current = img; };
    }
  }, [project.settings.customMsgBox]);

  useEffect(() => {
    if (project.settings.customNameBox) {
      const img = new Image();
      img.src = project.settings.customNameBox;
      img.onload = () => { nameBoxImageRef.current = img; };
    }
  }, [project.settings.customNameBox]);

  useEffect(() => {
    const loadTransition = async () => {
      const transImg = new Image();
      transImg.crossOrigin = "anonymous";
      transImg.src = project.settings.customTransition || '/graphics/default_transition.png';
      await new Promise(resolve => {
        transImg.onload = () => { transitionImageRef.current = transImg; console.log('Transition loaded:', transImg.width, 'x', transImg.height); resolve(); };
        transImg.onerror = () => { console.error('Failed to load transition'); transitionImageRef.current = null; resolve(); };
      });
    };
    loadTransition();
  }, [project.settings.customTransition]);

  useEffect(() => {
    document.fonts.ready.then(() => setProject(p => ({...p})));
  }, []);

  const executeCommand = (command) => {
    if (command.type === 'setFlag') {
      setProject({ ...project, flags: project.flags.map(f => f.name === command.flagName ? { ...f, value: command.flagValue } : f) });
      advanceCommand();
    } else if (command.type === 'goto') {
      command.useTransition ? changeSceneWithTransition(command.targetScene, 0) : (setCurrentSceneIndex(command.targetScene), setCurrentCommandIndex(0));
    }
  };

  const advanceCommand = () => {
    const scene = project.scenes[currentSceneIndex];
    if (currentCommandIndex < scene.commands.length - 1) {
      const nextIndex = currentCommandIndex + 1;
      setCurrentCommandIndex(nextIndex);
      if (scene.commands[nextIndex].type !== 'dialogue') executeCommand(scene.commands[nextIndex]);
    } else if (currentSceneIndex < project.scenes.length - 1) {
      changeSceneWithTransition(currentSceneIndex + 1, 0);
    }
  };

  const changeSceneWithTransition = (newSceneIndex, newCommandIndex = 0) => {
    if (!transitionImageRef.current || !canvasRef.current) {
      setCurrentSceneIndex(newSceneIndex);
      setCurrentCommandIndex(newCommandIndex);
      return;
    }
    setIsTransitioning(true);
    const oldScene = captureScene(canvasRef.current);
    const newSceneCanvas = document.createElement('canvas');
    newSceneCanvas.width = project.resolution[0];
    newSceneCanvas.height = project.resolution[1];
    const newCtx = newSceneCanvas.getContext('2d', { alpha: false });
    newCtx.imageSmoothingEnabled = false;
    const scene = project.scenes[newSceneIndex];
    let assetsToLoad = 0, assetsLoaded = 0;
    const checkComplete = () => { assetsLoaded++; if (assetsLoaded === assetsToLoad) startTransition(oldScene, newSceneCanvas, newSceneIndex, newCommandIndex); };
    if (scene.backgroundImage) {
      assetsToLoad++;
      const bgImg = new Image();
      bgImg.onload = () => { newCtx.drawImage(bgImg, 0, 0, project.resolution[0], project.resolution[1]); checkComplete(); };
      bgImg.onerror = () => checkComplete();
      bgImg.src = scene.backgroundImage;
    } else {
      newCtx.fillStyle = scene.background;
      newCtx.fillRect(0, 0, project.resolution[0], project.resolution[1]);
    }
    if (scene.characterImage) {
      assetsToLoad++;
      const charImg = new Image();
      charImg.onload = () => {
        const charWidth = 80, charHeight = 120;
        let charX = (project.resolution[0] - charWidth) / 2;
        if (scene.characterPosition === 'left') charX = 20;
        if (scene.characterPosition === 'right') charX = project.resolution[0] - charWidth - 20;
        newCtx.drawImage(charImg, charX, project.resolution[1] - charHeight - 10, charWidth, charHeight);
        checkComplete();
      };
      charImg.onerror = () => checkComplete();
      charImg.src = scene.characterImage;
    } else if (scene.character) {
      newCtx.fillStyle = '#4a4a4a';
      const charWidth = 64, charHeight = 96;
      let charX = (project.resolution[0] - charWidth) / 2;
      if (scene.characterPosition === 'left') charX = 20;
      if (scene.characterPosition === 'right') charX = project.resolution[0] - charWidth - 20;
      newCtx.fillRect(charX, project.resolution[1] - charHeight - 50, charWidth, charHeight);
    }
    if (assetsToLoad === 0) startTransition(oldScene, newSceneCanvas, newSceneIndex, newCommandIndex);
  };

  const startTransition = (oldScene, newScene, newSceneIndex, newCommandIndex) => {
    const duration = project.settings.transitionDuration || 800;
    const startTime = Date.now();
    const ctx = canvasRef.current.getContext('2d', { alpha: false });
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      performGradientWipe(ctx, oldScene, newScene, transitionImageRef.current, progress, project.resolution[0], project.resolution[1]);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsTransitioning(false);
        setCurrentSceneIndex(newSceneIndex);
        setCurrentCommandIndex(newCommandIndex);
      }
    };
    requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    const [width, height] = project.resolution;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    const scene = project.scenes[currentSceneIndex];
    if (!scene) return;
    if (scene.backgroundImage) {
      const img = new Image();
      img.src = scene.backgroundImage;
      img.onload = () => { ctx.drawImage(img, 0, 0, width, height); drawCharacter(); };
    } else {
      ctx.fillStyle = scene.background;
      ctx.fillRect(0, 0, width, height);
      drawCharacter();
    }
    function drawCharacter() {
      if (scene.characterImage) {
        const img = new Image();
        img.src = scene.characterImage;
        const charWidth = 80, charHeight = 120;
        let charX = (width - charWidth) / 2;
        if (scene.characterPosition === 'left') charX = 20;
        if (scene.characterPosition === 'right') charX = width - charWidth - 20;
        img.onload = () => { ctx.drawImage(img, charX, height - charHeight - 10, charWidth, charHeight); drawUI(); };
      } else if (scene.character) {
        ctx.fillStyle = '#4a4a4a';
        const charWidth = 64, charHeight = 96;
        let charX = (width - charWidth) / 2;
        if (scene.characterPosition === 'left') charX = 20;
        if (scene.characterPosition === 'right') charX = width - charWidth - 20;
        ctx.fillRect(charX, height - charHeight - 50, charWidth, charHeight);
        drawUI();
      } else {
        drawUI();
      }
    }
    function drawUI() {
      const command = scene.commands[currentCommandIndex];
      if (!command || command.type !== 'dialogue') {
        drawSceneIndicator(ctx, currentSceneIndex, project.scenes.length, 'dogica, monospace');
        return;
      }
      const fontFamily = 'dogica, monospace';
      const boxX = 8, boxY = height - 60, boxWidth = width - 16, boxHeight = 52;
      const msgBoxDrawn = drawNinePatch(ctx, msgBoxImageRef.current, boxX, boxY, boxWidth, boxHeight);
      if (!msgBoxDrawn) {
        ctx.fillStyle = 'rgba(20, 20, 30, 0.85)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      }
      drawNameBox(ctx, nameBoxImageRef.current, command.speaker, boxX, boxY, fontFamily);
      drawDialogueText(ctx, command.text, boxX, boxY, boxWidth, fontFamily);
      const positions = drawChoices(ctx, command, width, height, fontFamily);
      setChoicePositions(positions);
      if (!command.choices || command.choices.length === 0) {
        const hasMore = currentCommandIndex < scene.commands.length - 1 || currentSceneIndex < project.scenes.length - 1;
        drawArrow(ctx, boxX, boxY, boxWidth, boxHeight, hasMore);
      }
      drawSceneIndicator(ctx, currentSceneIndex, project.scenes.length, fontFamily);
    }
  }, [project, currentSceneIndex, currentCommandIndex]);

  const handleCanvasClick = (event) => {
    if (!isPlaying || isTransitioning) return;
    const scene = project.scenes[currentSceneIndex];
    const command = scene.commands[currentCommandIndex];
    if (command && command.type === 'dialogue' && choicePositions && choicePositions.length > 0) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;
      for (let pos of choicePositions) {
        if (x >= pos.x && x <= pos.x + pos.width && y >= pos.y && y <= pos.y + pos.height) {
          if (pos.choice.setFlag) {
            setProject({ ...project, flags: project.flags.map(f => f.name === pos.choice.setFlag ? { ...f, value: pos.choice.setFlagValue !== false } : f) });
          }
          pos.choice.enableGoto !== false && pos.choice.goto !== undefined ? changeSceneWithTransition(pos.choice.goto, 0) : advanceCommand();
          return;
        }
      }
      return;
    }
    command && command.type === 'dialogue' ? advanceCommand() : command && executeCommand(command);
  };

  const addScene = () => setProject({ ...project, scenes: [...project.scenes, { id: project.scenes.length + 1, name: `Scene ${project.scenes.length + 1}`, background: "#2d5a3d", character: null, characterPosition: "center", backgroundImage: null, characterImage: null, commands: [{ id: Date.now(), type: "dialogue", speaker: "Narrator", text: "New dialogue...", choices: [] }] }] });
  const updateScene = (index, updates) => { const newScenes = [...project.scenes]; newScenes[index] = { ...newScenes[index], ...updates }; setProject({ ...project, scenes: newScenes }); };
  const deleteScene = (index) => { if (project.scenes.length > 1) { const newScenes = project.scenes.filter((_, i) => i !== index); setProject({ ...project, scenes: newScenes }); if (currentSceneIndex >= newScenes.length) setCurrentSceneIndex(newScenes.length - 1); } };

  const uploadCharacter = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => setProject({ ...project, characters: [...project.characters, { id: Date.now(), name: file.name.replace(/\.[^/.]+$/, ""), data: ev.target.result }] }); reader.readAsDataURL(file); };
  const uploadBackground = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => setProject({ ...project, backgrounds: [...project.backgrounds, { id: Date.now(), name: file.name.replace(/\.[^/.]+$/, ""), data: ev.target.result }] }); reader.readAsDataURL(file); };
  const deleteCharacter = (id) => setProject({ ...project, characters: project.characters.filter(c => c.id !== id) });
  const deleteBackground = (id) => setProject({ ...project, backgrounds: project.backgrounds.filter(b => b.id !== id) });

  const uploadCustomMsgBox = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => setProject({ ...project, settings: { ...project.settings, customMsgBox: ev.target.result } }); reader.readAsDataURL(file); };
  const uploadCustomNameBox = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => setProject({ ...project, settings: { ...project.settings, customNameBox: ev.target.result } }); reader.readAsDataURL(file); };
  const uploadCustomTransition = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => setProject({ ...project, settings: { ...project.settings, customTransition: ev.target.result } }); reader.readAsDataURL(file); };

  const exportHTML = () => { const html = generateGameHTML(project); const blob = new Blob([html], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${project.title.replace(/\s+/g, '_')}.html`; a.click(); URL.revokeObjectURL(url); };
  const exportJSON = () => { const json = JSON.stringify(project, null, 2); const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${project.title.replace(/\s+/g, '_')}.json`; a.click(); URL.revokeObjectURL(url); };
  const importJSON = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { try { const imported = JSON.parse(ev.target.result); if (!imported.settings) imported.settings = { scale: 2, fontFamily: 'dogica, monospace', customFont: null, customMsgBox: null, customNameBox: null, customTransition: null, transitionDuration: 800 }; if (!imported.flags) imported.flags = []; imported.scenes = imported.scenes.map((scene, idx) => { if (scene.dialogues && !scene.commands) { scene.commands = scene.dialogues.map((d, i) => ({ id: Date.now() + i, type: 'dialogue', ...d })); delete scene.dialogues; } if (!scene.name) scene.name = `Scene ${idx + 1}`; return scene; }); setProject(imported); setCurrentSceneIndex(0); setCurrentCommandIndex(0); } catch (err) { alert('Error loading JSON: ' + err.message); } }; reader.readAsText(file); };

  const scene = project.scenes[currentSceneIndex];
  const displayWidth = 256 * project.settings.scale;
  const displayHeight = 192 * project.settings.scale;

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', display: 'flex', fontFamily: '"Courier New", monospace', color: '#e0e0e0', overflow: 'hidden' }}>
      <div style={{ width: '320px', background: 'rgba(15, 15, 25, 0.8)', borderRight: '2px solid #4a5568', overflowY: 'auto', padding: '16px' }}>
        <h1 style={{ fontSize: '18px', color: '#f39c12', marginBottom: '8px' }}>Retronovel</h1>
        <input type="text" value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} style={{ width: '100%', padding: '8px', background: '#2a2a3e', border: '1px solid #4a5568', color: '#fff', fontSize: '12px', fontFamily: 'inherit' }} />
        
        <div style={{ display: 'flex', gap: '4px', marginTop: '16px', marginBottom: '16px' }}>
          {['scenes', 'assets', 'settings', 'export'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '8px 4px', background: activeTab === tab ? '#f39c12' : '#2a2a3e', color: activeTab === tab ? '#000' : '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'inherit' }}>{tab}</button>
          ))}
        </div>

        {activeTab === 'scenes' && scene && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', color: '#f39c12' }}>Scenes</h3>
              <button onClick={addScene} style={{ padding: '6px 12px', background: '#27ae60', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}>+ New</button>
            </div>
            {project.scenes.map((s, idx) => (
              <div key={s.id} style={{ padding: '8px', background: currentSceneIndex === idx ? '#4a5568' : '#2a2a3e', marginBottom: '4px', border: '1px solid #4a5568' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="text" value={s.name || `Scene ${idx + 1}`} onChange={(e) => updateScene(idx, { name: e.target.value })} onClick={(e) => e.stopPropagation()} style={{ flex: 1, padding: '4px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit' }} />
                  <span style={{ fontSize: '10px', color: '#888' }}>#{s.id}</span>
                  {project.scenes.length > 1 && <button onClick={(e) => { e.stopPropagation(); deleteScene(idx); }} style={{ padding: '2px 6px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>×</button>}
                </div>
                <div onClick={() => { setCurrentSceneIndex(idx); setCurrentCommandIndex(0); }} style={{ padding: '4px 0', cursor: 'pointer', fontSize: '10px', color: '#888' }}>Click to edit</div>
              </div>
            ))}
            <div style={{ padding: '12px', background: '#2a2a3e', border: '1px solid #4a5568', marginTop: '16px' }}>
              <h4 style={{ fontSize: '12px', marginBottom: '8px', color: '#f39c12' }}>Scene {currentSceneIndex + 1} Properties</h4>
              <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Background Color:</label>
              <input type="color" value={scene.background} onChange={(e) => updateScene(currentSceneIndex, { background: e.target.value })} style={{ width: '100%', height: '32px', marginBottom: '12px' }} />
              {project.backgrounds.length > 0 && (
                <>
                  <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Background Image:</label>
                  <select value={scene.backgroundImage || ''} onChange={(e) => updateScene(currentSceneIndex, { backgroundImage: e.target.value || null })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '12px' }}>
                    <option value="">None</option>
                    {project.backgrounds.map(bg => <option key={bg.id} value={bg.data}>{bg.name}</option>)}
                  </select>
                </>
              )}
              {project.characters.length > 0 && (
                <>
                  <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Character Sprite:</label>
                  <select value={scene.characterImage || ''} onChange={(e) => updateScene(currentSceneIndex, { characterImage: e.target.value || null, character: e.target.value ? 'sprite' : null })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '12px' }}>
                    <option value="">None</option>
                    {project.characters.map(char => <option key={char.id} value={char.data}>{char.name}</option>)}
                  </select>
                </>
              )}
              <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Character Position:</label>
              <select value={scene.characterPosition} onChange={(e) => updateScene(currentSceneIndex, { characterPosition: e.target.value })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '12px' }}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px' }}>
                <input type="checkbox" checked={scene.character !== null} onChange={(e) => updateScene(currentSceneIndex, { character: e.target.checked ? 'placeholder' : null })} style={{ marginRight: '8px' }} />
                Show Character Placeholder
              </label>
            </div>
            <CommandEditor commands={scene.commands} sceneIndex={currentSceneIndex} updateCommands={(cmds) => updateScene(currentSceneIndex, { commands: cmds })} totalScenes={project.scenes.length} flags={project.flags} />
          </div>
        )}

        {activeTab === 'assets' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', color: '#f39c12' }}>Character Sprites</h3>
                <label style={{ padding: '6px 12px', background: '#27ae60', color: '#fff', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}>+ Upload<input type="file" accept="image/*" onChange={uploadCharacter} style={{ display: 'none' }} /></label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {project.characters.map(char => (
                  <div key={char.id} style={{ background: '#2a2a3e', border: '1px solid #4a5568', padding: '8px' }}>
                    <img src={char.data} alt={char.name} style={{ width: '100%', height: '80px', objectFit: 'contain', marginBottom: '4px', imageRendering: 'pixelated' }} />
                    <div style={{ fontSize: '10px', marginBottom: '4px' }}>{char.name}</div>
                    <button onClick={() => deleteCharacter(char.id)} style={{ width: '100%', padding: '4px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>Delete</button>
                  </div>
                ))}
              </div>
              {project.characters.length === 0 && <div style={{ padding: '16px', background: '#2a2a3e', border: '1px dashed #4a5568', textAlign: 'center', fontSize: '11px', color: '#888' }}>No sprites loaded</div>}
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', color: '#f39c12' }}>Backgrounds</h3>
                <label style={{ padding: '6px 12px', background: '#27ae60', color: '#fff', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}>+ Upload<input type="file" accept="image/*" onChange={uploadBackground} style={{ display: 'none' }} /></label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {project.backgrounds.map(bg => (
                  <div key={bg.id} style={{ background: '#2a2a3e', border: '1px solid #4a5568', padding: '8px' }}>
                    <img src={bg.data} alt={bg.name} style={{ width: '100%', height: '60px', objectFit: 'cover', marginBottom: '4px', imageRendering: 'pixelated' }} />
                    <div style={{ fontSize: '10px', marginBottom: '4px' }}>{bg.name}</div>
                    <button onClick={() => deleteBackground(bg.id)} style={{ width: '100%', padding: '4px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>Delete</button>
                  </div>
                ))}
              </div>
              {project.backgrounds.length === 0 && <div style={{ padding: '16px', background: '#2a2a3e', border: '1px dashed #4a5568', textAlign: 'center', fontSize: '11px', color: '#888' }}>No backgrounds loaded</div>}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3 style={{ fontSize: '14px', color: '#f39c12', marginBottom: '12px' }}>Settings</h3>
            <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Preview Scale ({project.settings.scale}×):</label>
            <input type="range" min="1" max="4" value={project.settings.scale} onChange={(e) => setProject({ ...project, settings: { ...project.settings, scale: parseInt(e.target.value) } })} style={{ width: '100%', marginBottom: '16px' }} />
            <label style={{ fontSize: '11px', marginBottom: '4px', display: 'block' }}>Transition Duration ({project.settings.transitionDuration}ms):</label>
            <input type="range" min="200" max="2000" step="100" value={project.settings.transitionDuration} onChange={(e) => setProject({ ...project, settings: { ...project.settings, transitionDuration: parseInt(e.target.value) } })} style={{ width: '100%', marginBottom: '16px' }} />
            <div style={{ padding: '12px', background: '#2a2a3e', border: '1px solid #4a5568', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', marginBottom: '8px', color: '#f39c12' }}>Custom UI Graphics</h4>
              <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', cursor: 'pointer', padding: '8px', background: '#1a1a2e', border: '1px solid #4a5568', textAlign: 'center' }}>Upload Message Box (16×16 PNG)<input type="file" accept="image/png" onChange={uploadCustomMsgBox} style={{ display: 'none' }} /></label>
              <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', cursor: 'pointer', padding: '8px', background: '#1a1a2e', border: '1px solid #4a5568', textAlign: 'center' }}>Upload Name Box (16×16 PNG)<input type="file" accept="image/png" onChange={uploadCustomNameBox} style={{ display: 'none' }} /></label>
              <label style={{ display: 'block', fontSize: '11px', cursor: 'pointer', padding: '8px', background: '#1a1a2e', border: '1px solid #4a5568', textAlign: 'center' }}>Upload Transition Gradient (256×192 PNG)<input type="file" accept="image/png" onChange={uploadCustomTransition} style={{ display: 'none' }} /></label>
            </div>
            <FlagsManager flags={project.flags} updateFlags={(flags) => setProject({ ...project, flags })} />
          </div>
        )}

        {activeTab === 'export' && (
          <div>
            <h3 style={{ fontSize: '14px', color: '#f39c12', marginBottom: '16px' }}>Export & Import</h3>
            <button onClick={exportHTML} style={{ width: '100%', padding: '12px', background: '#3498db', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold', fontFamily: 'inherit' }}>📦 Export HTML</button>
            <button onClick={exportJSON} style={{ width: '100%', padding: '12px', background: '#9b59b6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', marginBottom: '8px', fontWeight: 'bold', fontFamily: 'inherit' }}>💾 Export JSON</button>
            <label style={{ width: '100%', padding: '12px', background: '#e67e22', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'block', textAlign: 'center', fontWeight: 'bold', fontFamily: 'inherit' }}>📁 Import JSON<input type="file" accept=".json" onChange={importJSON} style={{ display: 'none' }} /></label>
            <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(52, 152, 219, 0.1)', border: '1px solid #3498db', fontSize: '11px', lineHeight: '1.6' }}>
              <strong style={{ color: '#3498db' }}>💡 Info:</strong>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>HTML = standalone playable file</li>
                <li>JSON = save/share project</li>
                <li>Old projects auto-convert</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => { setIsPlaying(!isPlaying); if (!isPlaying) { setCurrentSceneIndex(0); setCurrentCommandIndex(0); } }} style={{ padding: '10px 20px', background: isPlaying ? '#e74c3c' : '#27ae60', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', fontFamily: 'inherit' }}>{isPlaying ? '⏹ Stop' : '▶ Play'}</button>
          <div style={{ padding: '8px 16px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid #4a5568', fontSize: '11px' }}>Scene {currentSceneIndex + 1} / {project.scenes.length} • Command {currentCommandIndex + 1} / {scene?.commands.length || 0}</div>
        </div>
        <div style={{ position: 'relative', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)', border: '3px solid #4a5568' }}>
          <canvas ref={canvasRef} width="256" height="192" onClick={handleCanvasClick} style={{ display: 'block', width: `${displayWidth}px`, height: `${displayHeight}px`, imageRendering: 'pixelated', cursor: isPlaying ? 'pointer' : 'default' }} />
        </div>
        <div style={{ marginTop: '16px', fontSize: '11px', color: '#aaa', textAlign: 'center' }}>{isPlaying ? 'Click to advance' : 'Press Play to test'}<br />Scale: {project.settings.scale}× • Resolution: {displayWidth}×{displayHeight}</div>
      </div>
    </div>
  );
};

export default VNEditor;
