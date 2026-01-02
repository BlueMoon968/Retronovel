import React, { useState, useEffect, useRef } from 'react';
import CommandEditor from './components/CommandEditor';
import FlagsManager from './components/FlagsManager';
import { drawNinePatch, drawNameBox, drawDialogueText, drawChoices, drawArrow, drawSceneIndicator } from './engine/renderEngine';
import { performGradientWipe, captureScene } from './engine/transitionEngine';
import { generateGameHTML } from './engine/exportEngine';
import { audioManager } from './engine/audioEngine';

const VNEditor = () => {
  const [project, setProject] = useState({
    title: "My Visual Novel",
    resolution: [256, 192],
    flags: [],
    settings: { scale: 2, fontFamily: 'dogica, monospace', customFont: null, customMsgBox: null, customNameBox: null, customTransition: null, transitionDuration: 800,     masterVolumeBGM: 1.0,
    masterVolumeBGS: 1.0,
    masterVolumeSFX: 1.0,
    systemSFX: {
      cursor: '/audio/sfx/cursor.ogg',
      confirm: '/audio/sfx/confirm.ogg',
      buzzer: '/audio/sfx/buzzer.ogg',
      lettersound: '/audio/sfx/lettersound.ogg'
    },
    letterSoundEnabled: true },
    scenes: [
      {
        id: 1,
        name: "Scene 1",
        background: "#2d5a3d",
        backgroundImage: null,  // Initial background
        backgroundVisible: true,
        characters: [
          { sprite: null, position: 'center', visible: false, animated: false, frames: 1, frameSpeed: 100, opacity: 1 },
          { sprite: null, position: 'center', visible: false, animated: false, frames: 1, frameSpeed: 100, opacity: 1 },
          { sprite: null, position: 'center', visible: false, animated: false, frames: 1, frameSpeed: 100, opacity: 1 }
        ],
        commands: [
          {
            id: Date.now(),
            type: 'dialogue',
            speaker: "Narrator",
            text: "Welcome to the Visual Novel Editor!",
            choices: []
          }
        ]
      }
    ],
    characters: [],
    backgrounds: [],
    audio: {
      bgm: [],
      bgs: [],
      sfx: []
    }
  });

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('scenes');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [choicePositions, setChoicePositions] = useState(null);
  const [characterFrames, setCharacterFrames] = useState([0, 0, 0]);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);
  
  const canvasRef = useRef(null);
  const msgBoxImageRef = useRef(null);
  const nameBoxImageRef = useRef(null);
  const transitionImageRef = useRef(null);
  const lastExecutedCommand = useRef(null);

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

  // Auto-execute non-dialogue commands when playing
  useEffect(() => {
    if (!isPlaying) return;
    
    const scene = project.scenes[currentSceneIndex];
    const command = scene?.commands[currentCommandIndex];
    
    if (command && command.type !== 'dialogue') {
      const commandKey = `${currentSceneIndex}-${currentCommandIndex}`;
      
      if (lastExecutedCommand.current !== commandKey) {
        lastExecutedCommand.current = commandKey;
        executeCommand(command); // Già async
      }
    }
  }, [isPlaying, currentSceneIndex, currentCommandIndex, project.scenes]);

  // Reset all data after stop - Returning to Editor Mode
  useEffect(() => {
    if (!isPlaying) {
      lastExecutedCommand.current = null;
      audioManager.stopAll();

      // Reset characters to initial state
      const scene = project.scenes[currentSceneIndex];
      if (scene && scene.characters) {
        const initialChars = [
          { sprite: scene.characters[0]?.sprite || null, position: scene.characters[0]?.position || 'center', visible: !!scene.characters[0]?.sprite, animated: scene.characters[0]?.animated || false, frames: scene.characters[0]?.frames || 1, frameSpeed: scene.characters[0]?.frameSpeed || 100, opacity: 1 },
          { sprite: null, position: 'center', visible: false, animated: false, frames: 1, frameSpeed: 100, opacity: 1 },
          { sprite: null, position: 'center', visible: false, animated: false, frames: 1, frameSpeed: 100, opacity: 1 }
        ];
        updateScene(currentSceneIndex, { characters: initialChars, backgroundVisible: true });
      }
      setBackgroundOpacity(1);
      setCharacterFrames([0, 0, 0]);
    }
  }, [isPlaying, currentSceneIndex]);

  // Character sprite animation
  useEffect(() => {
    if (!isPlaying) return;
    
    const scene = project.scenes[currentSceneIndex];
    const intervals = [];
    
    scene.characters.forEach((char, idx) => {
      if (char.visible && char.animated && char.frames > 1) {
        const interval = setInterval(() => {
          setCharacterFrames(prev => {
            const newFrames = [...prev];
            newFrames[idx] = (newFrames[idx] + 1) % char.frames;
            return newFrames;
          });
        }, char.frameSpeed);
        intervals.push(interval);
      }
    });
    
    return () => intervals.forEach(clearInterval);
  }, [isPlaying, currentSceneIndex, project.scenes]);

  useEffect(() => {
    document.fonts.ready.then(() => setProject(p => ({...p})));
  }, []);

  const executeCommand = async (command) => {
    if (command.type === 'setFlag') {
      setProject({ ...project, flags: project.flags.map(f => f.name === command.flagName ? { ...f, value: command.flagValue } : f) });
      advanceCommand();
    } else if (command.type === 'goto') {
      command.useTransition ? changeSceneWithTransition(command.targetScene, 0) : (setCurrentSceneIndex(command.targetScene), setCurrentCommandIndex(0));
    } else if (command.type === 'playBGM') {
      if (command.audioFile) audioManager.playBGM(command.audioFile, command.volume / 100, command.pitch / 100, command.loop);
      advanceCommand();
    } else if (command.type === 'stopBGM') {
      audioManager.stopBGM();
      advanceCommand();
    } else if (command.type === 'fadeBGM') {
      audioManager.fadeBGM(command.duration, command.targetVolume / 100);
      advanceCommand();
    } else if (command.type === 'playBGS') {
      if (command.audioFile) audioManager.playBGS(command.audioFile, command.volume / 100, command.pitch / 100, command.loop);
      advanceCommand();
    } else if (command.type === 'stopBGS') {
      audioManager.stopBGS();
      advanceCommand();
    } else if (command.type === 'fadeBGS') {
      audioManager.fadeBGS(command.duration, command.targetVolume / 100);
      advanceCommand();
    } else if (command.type === 'playSFX') {
      if (command.audioFile) audioManager.playSFX(command.audioFile, command.volume / 100, command.pitch / 100, command.pan / 100);
      advanceCommand();
    } else if (command.type === 'showCharacter') {
      const scene = project.scenes[currentSceneIndex];
      const chars = [...(scene.characters || [
        { sprite: null, position: 'center', visible: false, animated: false, frames: 1, frameSpeed: 100, opacity: 1 },
        { sprite: null, position: 'center', visible: false, animated: false, frames: 1, frameSpeed: 100, opacity: 1 },
        { sprite: null, position: 'center', visible: false, animated: false, frames: 1, frameSpeed: 100, opacity: 1 }
      ])];
      
      chars[command.charIndex] = {
        sprite: command.sprite,
        position: command.position,
        visible: true,
        animated: command.animated,
        frames: command.frames || 1,
        frameSpeed: command.frameSpeed || 100,
        opacity: command.faded ? 0 : 1
      };
      
      updateScene(currentSceneIndex, { characters: chars });
      
      if (command.faded) {
        await new Promise(resolve => setTimeout(resolve, 50));
        await fadeCharacter(command.charIndex, 1, command.fadeDuration);
      }
      
      advanceCommand();
    } else if (command.type === 'hideCharacter') {
      if (command.faded) {
        await fadeCharacter(command.charIndex, 0, command.fadeDuration);
      }
      
      const scene = project.scenes[currentSceneIndex];
      const chars = [...scene.characters];
      chars[command.charIndex] = { ...chars[command.charIndex], visible: false, opacity: 1 };
      
      updateScene(currentSceneIndex, { characters: chars });
      advanceCommand();
    } else if (command.type === 'showBackground') {
      if (command.faded) {
        await fadeBackground(0, command.fadeDuration);
      }
      
      updateScene(currentSceneIndex, {
        backgroundImage: command.backgroundImage,
        backgroundVisible: true
      });
      
      if (command.faded) {
        await fadeBackground(1, command.fadeDuration);
      }
      advanceCommand();
    } else if (command.type === 'hideBackground') {
      if (command.faded) {
        await fadeBackground(0, command.fadeDuration);
      }
      
      updateScene(currentSceneIndex, { backgroundVisible: false });
      setBackgroundOpacity(1);
      advanceCommand();
    }
  };

  const advanceCommand = () => {
    const scene = project.scenes[currentSceneIndex];
    if (currentCommandIndex < scene.commands.length - 1) {
      const nextIndex = currentCommandIndex + 1;
      setCurrentCommandIndex(nextIndex);
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
        const charWidth = charImg.width, charHeight = charImg.height;
        let charX = (project.resolution[0] - charWidth) / 2;
        if (scene.characterPosition === 'left') charX = 0;
        if (scene.characterPosition === 'right') charX = project.resolution[0] - charWidth;
        newCtx.drawImage(charImg, charX, project.resolution[1] - charHeight, charWidth, charHeight);
        checkComplete();
      };
      charImg.onerror = () => checkComplete();
      charImg.src = scene.characterImage;
    } else if (scene.character) {
      newCtx.fillStyle = '#4a4a4a';
      const charWidth = 64, charHeight = 96;
      let charX = (project.resolution[0] - charWidth) / 2;
      if (scene.characterPosition === 'left') charX = 0;
      if (scene.characterPosition === 'right') charX = project.resolution[0] - charWidth;
      newCtx.fillRect(charX, project.resolution[1] - charHeight, charWidth, charHeight);
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

  const fadeCharacter = (charIndex, targetOpacity, duration) => {
    return new Promise(resolve => {
      const startTime = Date.now();
      let animationFrame;
      
      const animate = () => {
        const scene = project.scenes[currentSceneIndex];
        if (!scene || !scene.characters || !scene.characters[charIndex]) {
          resolve();
          return;
        }
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const startOpacity = scene.characters[charIndex].opacity || 0;
        const currentOpacity = startOpacity + (targetOpacity - startOpacity) * progress;
        
        setProject(prev => {
          const newScenes = [...prev.scenes];
          const newChars = [...newScenes[currentSceneIndex].characters];
          newChars[charIndex] = { ...newChars[charIndex], opacity: currentOpacity };
          newScenes[currentSceneIndex] = { ...newScenes[currentSceneIndex], characters: newChars };
          return { ...prev, scenes: newScenes };
        });
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  };

  const fadeBackground = (targetOpacity, duration) => {
    return new Promise(resolve => {
      const startOpacity = backgroundOpacity;
      const startTime = Date.now();
      let animationFrame;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentOpacity = startOpacity + (targetOpacity - startOpacity) * progress;
        
        setBackgroundOpacity(currentOpacity);
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    const [width, height] = project.resolution;
    
    const scene = project.scenes[currentSceneIndex];
    if (!scene) return;

    if (!scene.characters) {
      scene.characters = [
        { sprite: null, position: 'center', visible: false, animated: false, frames: 1, frameSpeed: 100, opacity: 1 },
        { sprite: null, position: 'center', visible: false, animated: false, frames: 1, frameSpeed: 100, opacity: 1 },
        { sprite: null, position: 'center', visible: false, animated: false, frames: 1, frameSpeed: 100, opacity: 1 }
      ];
    }

    // Helper to load image as promise
    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        if (!src) {
          resolve(null);
          return;
        }
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };

    // Main render function
    const render = async () => {
      // Disable smoothing globally
      ctx.imageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      
      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      // STEP 1: Background
      if (scene.backgroundVisible !== false) {
        if (scene.backgroundImage) {
          const bgImg = await loadImage(scene.backgroundImage);
          if (bgImg) {
            ctx.globalAlpha = backgroundOpacity;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(bgImg, 0, 0, width, height);
            ctx.globalAlpha = 1;
          }
        } else {
          ctx.globalAlpha = backgroundOpacity;
          ctx.fillStyle = scene.background;
          ctx.fillRect(0, 0, width, height);
          ctx.globalAlpha = 1;
        }
      }

      // STEP 2: Characters (load all first)
      const charImages = await Promise.all(
        scene.characters.map(char => 
          (char.visible && char.sprite) ? loadImage(char.sprite) : Promise.resolve(null)
        )
      );

      scene.characters.forEach((char, idx) => {
        if (!char.visible || !charImages[idx]) return;

        const img = charImages[idx];
        let sourceWidth = img.width;
        let sourceHeight = img.height;
        let sourceX = 0;
        
        if (char.animated && char.frames > 1) {
          sourceWidth = img.width / char.frames;
          sourceX = characterFrames[idx] * sourceWidth;
        }
        
        let charX = Math.floor(width/4 - sourceWidth/4);
        if (char.position === 'left') charX = 0;
        if (char.position === 'right') charX = width - sourceWidth;
        
        const charY = Math.floor(height - sourceHeight);
        
        // CRITICAL: Set smoothing OFF right before draw
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        
        ctx.globalAlpha = char.opacity || 1;
        ctx.drawImage(img, sourceX, 0, sourceWidth, img.height, charX, charY, sourceWidth, img.height);
        ctx.globalAlpha = 1;
      });

      // STEP 3: UI (always on top)
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
    };

    render();
  }, [project, currentSceneIndex, currentCommandIndex, backgroundOpacity, characterFrames]);

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

  const uploadAudio = (type, event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setProject({
        ...project,
        audio: {
          ...project.audio,
          [type]: [...project.audio[type], {
            id: Date.now(),
            name: file.name.replace(/\.[^/.]+$/, ""),
            data: e.target.result
          }]
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const deleteAudio = (type, id) => {
    setProject({
      ...project,
      audio: {
        ...project.audio,
        [type]: project.audio[type].filter(a => a.id !== id)
      }
    });
  };

  const uploadSystemSFX = (type, event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setProject({
        ...project,
        settings: {
          ...project.settings,
          systemSFX: {
            ...project.settings.systemSFX,
            [type]: e.target.result
          }
        }
      });
    };
    reader.readAsDataURL(file);
  };

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
              <h4 style={{ fontSize: '12px', marginBottom: '8px', color: '#f39c12' }}>
                Scene {currentSceneIndex + 1} Properties
              </h4>
              
              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Background Color:</label>
              <input type="color" value={scene.background} onChange={(e) => updateScene(currentSceneIndex, { background: e.target.value })} style={{ width: '100%', height: '32px', marginBottom: '12px' }} />

              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Initial Background Image:</label>
              <select value={scene.backgroundImage || ''} onChange={(e) => updateScene(currentSceneIndex, { backgroundImage: e.target.value || null, backgroundVisible: true })} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '12px' }}>
                <option value="">None (use color)</option>
                {project.backgrounds.map(bg => <option key={bg.id} value={bg.data}>{bg.name}</option>)}
              </select>

              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Initial Character Sprite:</label>
              <select value={scene.characters?.[0]?.sprite || ''} onChange={(e) => { const chars = scene.characters || [{ sprite: null, position: 'center', visible: false, animated: false, frames: 1, frameSpeed: 100, opacity: 1 }, { sprite: null, position: 'center', visible: false, animated: false, frames: 1, frameSpeed: 100, opacity: 1 }, { sprite: null, position: 'center', visible: false, animated: false, frames: 1, frameSpeed: 100, opacity: 1 }]; chars[0] = { ...chars[0], sprite: e.target.value || null, visible: !!e.target.value }; updateScene(currentSceneIndex, { characters: chars }); }} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '12px' }}>
                <option value="">None</option>
                {project.characters.map(char => <option key={char.id} value={char.data}>{char.name}</option>)}
              </select>
              
              {scene.characters?.[0]?.sprite && (
                <>
                  <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Character Position:</label>
                  <select value={scene.characters[0].position} onChange={(e) => { const chars = [...scene.characters]; chars[0] = { ...chars[0], position: e.target.value }; updateScene(currentSceneIndex, { characters: chars }); }} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '12px' }}>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                  
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', marginBottom: '8px' }}>
                    <input type="checkbox" checked={scene.characters[0].animated || false} onChange={(e) => { const chars = [...scene.characters]; chars[0] = { ...chars[0], animated: e.target.checked }; updateScene(currentSceneIndex, { characters: chars }); }} style={{ marginRight: '8px' }} />
                    Animated Character
                  </label>
                  
                  {scene.characters[0].animated && (
                    <>
                      <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Frames:</label>
                      <input type="number" min="1" max="20" value={scene.characters[0].frames || 1} onChange={(e) => { const chars = [...scene.characters]; chars[0] = { ...chars[0], frames: parseInt(e.target.value) }; updateScene(currentSceneIndex, { characters: chars }); }} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit', marginBottom: '8px' }} />
                      
                      <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Frame Speed (ms):</label>
                      <input type="number" min="50" max="1000" step="50" value={scene.characters[0].frameSpeed || 100} onChange={(e) => { const chars = [...scene.characters]; chars[0] = { ...chars[0], frameSpeed: parseInt(e.target.value) }; updateScene(currentSceneIndex, { characters: chars }); }} style={{ width: '100%', padding: '6px', background: '#1a1a2e', border: '1px solid #4a5568', color: '#fff', fontSize: '11px', fontFamily: 'inherit' }} />
                    </>
                  )}
                </>
              )}
            </div>
            <CommandEditor commands={scene.commands} sceneIndex={currentSceneIndex} updateCommands={(cmds) => updateScene(currentSceneIndex, { commands: cmds })} totalScenes={project.scenes.length} flags={project.flags} audio={project.audio} onJumpToCommand={(index) => setCurrentCommandIndex(index)} characters={project.characters} backgrounds={project.backgrounds}/>
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

            {/* CUSTOM UI GRAPHICS */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '14px', color: '#f39c12', marginBottom: '12px' }}>Custom UI Graphics</h3>
              
              {/* Message Box */}
              <div style={{ padding: '12px', background: '#2a2a3e', border: '1px solid #4a5568', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#f39c12' }}>Message Box (16×16 PNG)</span>
                  {project.settings.customMsgBox && (
                    <button onClick={() => setProject({ ...project, settings: { ...project.settings, customMsgBox: null } })} style={{ padding: '4px 8px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>Remove</button>
                  )}
                </div>
                {project.settings.customMsgBox ? (
                  <img src={project.settings.customMsgBox} alt="Custom MsgBox" style={{ width: '64px', height: '64px', objectFit: 'contain', imageRendering: 'pixelated', background: '#1a1a2e', border: '1px solid #4a5568', padding: '4px' }} />
                ) : (
                  <label style={{ display: 'block', padding: '12px', background: '#1a1a2e', border: '1px dashed #4a5568', textAlign: 'center', cursor: 'pointer', fontSize: '10px', color: '#888' }}>
                    Click to upload
                    <input type="file" accept="image/png" onChange={uploadCustomMsgBox} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              {/* Name Box */}
              <div style={{ padding: '12px', background: '#2a2a3e', border: '1px solid #4a5568', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#f39c12' }}>Name Box (16×16 PNG)</span>
                  {project.settings.customNameBox && (
                    <button onClick={() => setProject({ ...project, settings: { ...project.settings, customNameBox: null } })} style={{ padding: '4px 8px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>Remove</button>
                  )}
                </div>
                {project.settings.customNameBox ? (
                  <img src={project.settings.customNameBox} alt="Custom NameBox" style={{ width: '64px', height: '64px', objectFit: 'contain', imageRendering: 'pixelated', background: '#1a1a2e', border: '1px solid #4a5568', padding: '4px' }} />
                ) : (
                  <label style={{ display: 'block', padding: '12px', background: '#1a1a2e', border: '1px dashed #4a5568', textAlign: 'center', cursor: 'pointer', fontSize: '10px', color: '#888' }}>
                    Click to upload
                    <input type="file" accept="image/png" onChange={uploadCustomNameBox} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              {/* Transition Gradient */}
              <div style={{ padding: '12px', background: '#2a2a3e', border: '1px solid #4a5568' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#f39c12' }}>Transition Gradient (256×192 PNG)</span>
                  {project.settings.customTransition && (
                    <button onClick={() => setProject({ ...project, settings: { ...project.settings, customTransition: null } })} style={{ padding: '4px 8px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>Remove</button>
                  )}
                </div>
                {project.settings.customTransition ? (
                  <img src={project.settings.customTransition} alt="Custom Transition" style={{ width: '100%', height: 'auto', objectFit: 'contain', imageRendering: 'pixelated', background: '#1a1a2e', border: '1px solid #4a5568', padding: '4px' }} />
                ) : (
                  <label style={{ display: 'block', padding: '12px', background: '#1a1a2e', border: '1px dashed #4a5568', textAlign: 'center', cursor: 'pointer', fontSize: '10px', color: '#888' }}>
                    Click to upload
                    <input type="file" accept="image/png" onChange={uploadCustomTransition} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '14px', color: '#f39c12', marginBottom: '12px' }}>Audio Files</h3>
              
              {/* BGM */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#3498db' }}>🎵 BGM</span>
                  <label style={{ padding: '4px 8px', background: '#27ae60', color: '#fff', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>+ Upload<input type="file" accept=".ogg" onChange={(e) => uploadAudio('bgm', e)} style={{ display: 'none' }} /></label>
                </div>
                {project.audio.bgm.map(a => (
                  <div key={a.id} style={{ padding: '6px', background: '#2a2a3e', border: '1px solid #4a5568', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px' }}>{a.name}</span>
                    <button onClick={() => deleteAudio('bgm', a.id)} style={{ padding: '2px 6px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '9px', fontFamily: 'inherit' }}>×</button>
                  </div>
                ))}
              </div>

              {/* BGS */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#3498db' }}>🎵 BGS</span>
                  <label style={{ padding: '4px 8px', background: '#27ae60', color: '#fff', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>+ Upload<input type="file" accept=".ogg" onChange={(e) => uploadAudio('bgs', e)} style={{ display: 'none' }} /></label>
                </div>
                {project.audio.bgs.map(a => (
                  <div key={a.id} style={{ padding: '6px', background: '#2a2a3e', border: '1px solid #4a5568', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px' }}>{a.name}</span>
                    <button onClick={() => deleteAudio('bgs', a.id)} style={{ padding: '2px 6px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '9px', fontFamily: 'inherit' }}>×</button>
                  </div>
                ))}
              </div>

              {/* SFX */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#3498db' }}>🎵 SFX</span>
                  <label style={{ padding: '4px 8px', background: '#27ae60', color: '#fff', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit' }}>+ Upload<input type="file" accept=".ogg" onChange={(e) => uploadAudio('sfx', e)} style={{ display: 'none' }} /></label>
                </div>
                {project.audio.sfx.map(a => (
                  <div key={a.id} style={{ padding: '6px', background: '#2a2a3e', border: '1px solid #4a5568', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px' }}>{a.name}</span>
                    <button onClick={() => deleteAudio('sfx', a.id)} style={{ padding: '2px 6px', background: '#e74c3c', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '9px', fontFamily: 'inherit' }}>×</button>
                  </div>
                ))}
              </div>
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
            <FlagsManager flags={project.flags} updateFlags={(flags) => setProject({ ...project, flags })} />
            {/* MASTER VOLUME */}
            <div style={{ 
              padding: '12px', 
              background: '#2a2a3e', 
              border: '1px solid #4a5568', 
              marginBottom: '16px' 
            }}>
              <h4 style={{ 
                fontSize: '12px', 
                marginBottom: '12px', 
                color: '#f39c12' 
              }}>
                Master Volume
              </h4>
              
              <label style={{ 
                display: 'block', 
                fontSize: '11px', 
                marginBottom: '4px',
                color: '#888'
              }}>
                BGM: {Math.round(project.settings.masterVolumeBGM * 100)}%
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={project.settings.masterVolumeBGM * 100} 
                onChange={(e) => setProject({ 
                  ...project, 
                  settings: { 
                    ...project.settings, 
                    masterVolumeBGM: parseInt(e.target.value) / 100 
                  } 
                })} 
                style={{ 
                  width: '100%', 
                  marginBottom: '12px' 
                }} 
              />
              
              <label style={{ 
                display: 'block', 
                fontSize: '11px', 
                marginBottom: '4px',
                color: '#888'
              }}>
                BGS: {Math.round(project.settings.masterVolumeBGS * 100)}%
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={project.settings.masterVolumeBGS * 100} 
                onChange={(e) => setProject({ 
                  ...project, 
                  settings: { 
                    ...project.settings, 
                    masterVolumeBGS: parseInt(e.target.value) / 100 
                  } 
                })} 
                style={{ 
                  width: '100%', 
                  marginBottom: '12px' 
                }} 
              />
              
              <label style={{ 
                display: 'block', 
                fontSize: '11px', 
                marginBottom: '4px',
                color: '#888'
              }}>
                SFX: {Math.round(project.settings.masterVolumeSFX * 100)}%
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={project.settings.masterVolumeSFX * 100} 
                onChange={(e) => setProject({ 
                  ...project, 
                  settings: { 
                    ...project.settings, 
                    masterVolumeSFX: parseInt(e.target.value) / 100 
                  } 
                })} 
                style={{ 
                  width: '100%' 
                }} 
              />
            </div>

            {/* SYSTEM SFX */}
            <div style={{ 
              padding: '12px', 
              background: '#2a2a3e', 
              border: '1px solid #4a5568', 
              marginBottom: '16px' 
            }}>
              <h4 style={{ 
                fontSize: '12px', 
                marginBottom: '12px', 
                color: '#f39c12' 
              }}>
                System SFX
              </h4>
              
              {/* Cursor */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ 
                  fontSize: '10px', 
                  display: 'block', 
                  marginBottom: '4px', 
                  textTransform: 'capitalize',
                  color: '#888'
                }}>
                  Cursor:
                </label>
                <select 
                  value={project.settings.systemSFX.cursor || '/audio/sfx/cursor.ogg'} 
                  onChange={(e) => setProject({ 
                    ...project, 
                    settings: { 
                      ...project.settings, 
                      systemSFX: { 
                        ...project.settings.systemSFX, 
                        cursor: e.target.value 
                      } 
                    } 
                  })} 
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: '#1a1a2e',
                    border: '1px solid #4a5568',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="/audio/sfx/cursor.ogg">Default (cursor.ogg)</option>
                  {project.audio.sfx.map(a => (
                    <option key={a.id} value={a.data}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Confirm */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ 
                  fontSize: '10px', 
                  display: 'block', 
                  marginBottom: '4px', 
                  textTransform: 'capitalize',
                  color: '#888'
                }}>
                  Confirm:
                </label>
                <select 
                  value={project.settings.systemSFX.confirm || '/audio/sfx/confirm.ogg'} 
                  onChange={(e) => setProject({ 
                    ...project, 
                    settings: { 
                      ...project.settings, 
                      systemSFX: { 
                        ...project.settings.systemSFX, 
                        confirm: e.target.value 
                      } 
                    } 
                  })} 
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: '#1a1a2e',
                    border: '1px solid #4a5568',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="/audio/sfx/confirm.ogg">Default (confirm.ogg)</option>
                  {project.audio.sfx.map(a => (
                    <option key={a.id} value={a.data}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Buzzer */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ 
                  fontSize: '10px', 
                  display: 'block', 
                  marginBottom: '4px', 
                  textTransform: 'capitalize',
                  color: '#888'
                }}>
                  Buzzer:
                </label>
                <select 
                  value={project.settings.systemSFX.buzzer || '/audio/sfx/buzzer.ogg'} 
                  onChange={(e) => setProject({ 
                    ...project, 
                    settings: { 
                      ...project.settings, 
                      systemSFX: { 
                        ...project.settings.systemSFX, 
                        buzzer: e.target.value 
                      } 
                    } 
                  })} 
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: '#1a1a2e',
                    border: '1px solid #4a5568',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="/audio/sfx/buzzer.ogg">Default (buzzer.ogg)</option>
                  {project.audio.sfx.map(a => (
                    <option key={a.id} value={a.data}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Letter Sound */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ 
                  fontSize: '10px', 
                  display: 'block', 
                  marginBottom: '4px', 
                  textTransform: 'capitalize',
                  color: '#888'
                }}>
                  Letter Sound:
                </label>
                <select 
                  value={project.settings.systemSFX.lettersound || '/audio/sfx/lettersound.ogg'} 
                  onChange={(e) => setProject({ 
                    ...project, 
                    settings: { 
                      ...project.settings, 
                      systemSFX: { 
                        ...project.settings.systemSFX, 
                        lettersound: e.target.value 
                      } 
                    } 
                  })} 
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: '#1a1a2e',
                    border: '1px solid #4a5568',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'inherit',
                    marginBottom: '8px'
                  }}
                >
                  <option value="/audio/sfx/lettersound.ogg">Default (lettersound.ogg)</option>
                  {project.audio.sfx.map(a => (
                    <option key={a.id} value={a.data}>{a.name}</option>
                  ))}
                </select>
                
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: '#888'
                }}>
                  <input 
                    type="checkbox" 
                    checked={project.settings.letterSoundEnabled} 
                    onChange={(e) => setProject({ 
                      ...project, 
                      settings: { 
                        ...project.settings, 
                        letterSoundEnabled: e.target.checked 
                      } 
                    })} 
                    style={{ marginRight: '8px' }}
                  />
                  Enable Letter Sound (Typewriter)
                </label>
              </div>
            </div>
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
