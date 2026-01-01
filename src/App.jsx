import React, { useState, useEffect, useRef } from 'react';
import { 
  drawNinePatch, 
  drawNameBox, 
  drawDialogueText, 
  drawChoices, 
  drawArrow, 
  drawSceneIndicator 
} from './engine/renderEngine';

import { exportRenderFunctions } from './engine/renderEngine';
import ChoiceEditor from './components/ChoiceEditor';
import FlagsManager from './components/FlagsManager';
import { performGradientWipe, captureScene } from './engine/transitionEngine';

// Visual Novel Editor - GBA/NDS Style
// Resolution: 256x192 (NDS single screen)

const VNEditor = () => {
  const [project, setProject] = useState({
    title: "My Visual Novel",
    resolution: [256, 192],
    flags: [],
    settings: {
      scale: 2,
      fontFamily: 'dogica, monospace',
      customFont: null,
      customMsgBox: null,    // Custom message box (NinePatch)
      customNameBox: null    // Custom name box (NinePatch)
    },
    scenes: [
      {
        id: 1,
        background: "#2d5a3d",
        character: null,
        characterImage: null,
        characterPosition: "center",
        backgroundImage: null,
        dialogues: [
          {
            speaker: "Narrator",
            text: "Welcome to the Visual Novel Editor!",
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
  const [activeTab, setActiveTab] = useState('scenes');
  const [isPlaying, setIsPlaying] = useState(false);
  const transitionImageRef = useRef(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  
  const canvasRef = useRef(null);
  const fontFaceRef = useRef(null);
  const msgBoxImageRef = useRef(null);
  const nameBoxImageRef = useRef(null);

  // Load default UI graphics
  useEffect(() => {
    const loadImages = async () => {
      // Force load msgbox
      const msgBoxImg = new Image();
      msgBoxImg.src = '/graphics/msgbox.png';
      await new Promise((resolve) => {
        msgBoxImg.onload = () => {
          msgBoxImageRef.current = msgBoxImg;
          resolve();
        };
        msgBoxImg.onerror = () => {
          console.log('Default msgbox.png not found - using fallback');
          resolve();
        };
      });

      // Force load namebox
      const nameBoxImg = new Image();
      nameBoxImg.src = '/graphics/namebox.png';
      await new Promise((resolve) => {
        nameBoxImg.onload = () => {
          nameBoxImageRef.current = nameBoxImg;
          resolve();
        };
        nameBoxImg.onerror = () => {
          console.log('Default namebox.png not found - using fallback');
          resolve();
        };
      });

      // Force initial render
      setProject(p => ({...p}));
    };

    loadImages();
  }, []);

  // Load custom msgbox if set
  useEffect(() => {
    if (project.settings.customMsgBox) {
      const img = new Image();
      img.src = project.settings.customMsgBox;
      img.onload = () => {
        msgBoxImageRef.current = img;
      };
    }
  }, [project.settings.customMsgBox]);

  // Load custom namebox if set
  useEffect(() => {
    if (project.settings.customNameBox) {
      const img = new Image();
      img.src = project.settings.customNameBox;
      img.onload = () => {
        nameBoxImageRef.current = img;
      };
    }
  }, [project.settings.customNameBox]);

  // Load custom font if available
  useEffect(() => {
    if (project.settings.customFont && !fontFaceRef.current) {
      const fontFace = new FontFace('CustomFont', `url(${project.settings.customFont})`);
      fontFace.load().then((loadedFont) => {
        document.fonts.add(loadedFont);
        fontFaceRef.current = loadedFont;
      });
    }
  }, [project.settings.customFont]);

  // Load default transition
  useEffect(() => {
    const transImg = new Image();
    transImg.src = '/graphics/default_transition.png';
    transImg.onload = () => {
      transitionImageRef.current = transImg;
    };
    transImg.onerror = () => {
      console.log('Default transition.png not found - transitions disabled');
    };
  }, []);

  // Load custom transition if set
  useEffect(() => {
    if (project.settings.customTransition) {
      const img = new Image();
      img.src = project.settings.customTransition;
      img.onload = () => {
        transitionImageRef.current = img;
      };
    }
  }, [project.settings.customTransition]);


  // Force render after font loads
  useEffect(() => {
    document.fonts.ready.then(() => {
      // Force re-render when font is ready
      setProject(p => ({...p}));
    });
  }, []);

  // NinePatch drawing function
  const drawNinePatch = (ctx, image, x, y, width, height) => {
    if (!image || !image.complete) return false;

    const srcSize = 16; // Source image is 16x16
    const corner = 5;   // Corner size
    const edge = 6;     // Edge size (middle section)

    // Draw corners (fixed size)
    // Top-left
    ctx.drawImage(image, 0, 0, corner, corner, x, y, corner, corner);
    // Top-right
    ctx.drawImage(image, srcSize - corner, 0, corner, corner, x + width - corner, y, corner, corner);
    // Bottom-left
    ctx.drawImage(image, 0, srcSize - corner, corner, corner, x, y + height - corner, corner, corner);
    // Bottom-right
    ctx.drawImage(image, srcSize - corner, srcSize - corner, corner, corner, x + width - corner, y + height - corner, corner, corner);

    // Draw edges (stretched)
    // Top edge
    ctx.drawImage(image, corner, 0, edge, corner, x + corner, y, width - (corner * 2), corner);
    // Bottom edge
    ctx.drawImage(image, corner, srcSize - corner, edge, corner, x + corner, y + height - corner, width - (corner * 2), corner);
    // Left edge
    ctx.drawImage(image, 0, corner, corner, edge, x, y + corner, corner, height - (corner * 2));
    // Right edge
    ctx.drawImage(image, srcSize - corner, corner, corner, edge, x + width - corner, y + corner, corner, height - (corner * 2));

    // Draw center (stretched)
    ctx.drawImage(image, corner, corner, edge, edge, x + corner, y + corner, width - (corner * 2), height - (corner * 2));

    return true;
  };

  // Render the preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    const [width, height] = project.resolution;
    
    ctx.imageSmoothingEnabled = false;
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const scene = project.scenes[currentSceneIndex];
    if (!scene) return;

    // LAYER 1: Draw background
    if (scene.backgroundImage) {
      const img = new Image();
      img.src = scene.backgroundImage;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        drawCharacter();
      };
    } else {
      ctx.fillStyle = scene.background;
      ctx.fillRect(0, 0, width, height);
      drawCharacter();
    }

    function drawCharacter() {
      // LAYER 2: Draw character
      if (scene.characterImage) {
        const img = new Image();
        img.src = scene.characterImage;
        const charWidth = 80;
        const charHeight = 120;
        let charX = (width - charWidth) / 2;
        
        if (scene.characterPosition === 'left') charX = 20;
        if (scene.characterPosition === 'right') charX = width - charWidth - 20;
        
        img.onload = () => {
          ctx.drawImage(img, charX, height - charHeight - 10, charWidth, charHeight);
          drawUI();
        };
      } else if (scene.character) {
        // Placeholder
        ctx.fillStyle = '#4a4a4a';
        const charWidth = 64;
        const charHeight = 96;
        let charX = (width - charWidth) / 2;
        
        if (scene.characterPosition === 'left') charX = 20;
        if (scene.characterPosition === 'right') charX = width - charWidth - 20;
        
        ctx.fillRect(charX, height - charHeight - 50, charWidth, charHeight);
        drawUI();
      } else {
        drawUI();
      }
    }

    // LAYER 3
    function drawUI() {
      const dialogue = scene.dialogues[currentDialogueIndex];
      if (!dialogue) return;
      
      const fontFamily = project.settings.customFont ? 'CustomFont, dogica, monospace' : 'dogica, monospace';
      const boxX = 8;
      const boxY = height - 60;
      const boxWidth = width - 16;
      const boxHeight = 52;

      // Message box
      const msgBoxDrawn = drawNinePatch(ctx, msgBoxImageRef.current, boxX, boxY, boxWidth, boxHeight);
      if (!msgBoxDrawn) {
        ctx.fillStyle = 'rgba(20, 20, 30, 0.85)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      }

      // Name box + speaker name
      drawNameBox(ctx, nameBoxImageRef.current, dialogue.speaker, boxX, boxY, fontFamily);

      // Dialogue text
      const lastY = drawDialogueText(ctx, dialogue.text, boxX, boxY, boxWidth, fontFamily);

      // Choices
      drawChoices(ctx, dialogue, boxX, boxY, boxWidth, lastY, 12, fontFamily);

      // Arrow
      const hasMore = currentDialogueIndex < scene.dialogues.length - 1 || currentSceneIndex < project.scenes.length - 1;
      const hasChoices = dialogue.choices && dialogue.choices.length > 0;
      if (!hasChoices) {
        drawArrow(ctx, boxX, boxY, boxWidth, boxHeight, hasMore);
      }

      // Scene indicator
      drawSceneIndicator(ctx, currentSceneIndex, project.scenes.length, fontFamily);
    }

  }, [project, currentSceneIndex, currentDialogueIndex]);

  const handleCanvasClick = (event) => {
    if (!isPlaying) return;
    
    const scene = project.scenes[currentSceneIndex];
    const dialogue = scene.dialogues[currentDialogueIndex];
    
    // Check if there are choices
    if (dialogue.choices && dialogue.choices.length > 0) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;
      
      const [width, height] = project.resolution;
      const boxX = 8;
      const boxY = height - 60;
      const boxWidth = width - 16;
      
      // Calculate choice positions (must match rendering logic)
      const numChoices = dialogue.choices.length;
      const maxChoiceHeight = 14;
      const minChoiceHeight = 10;
      const choiceHeight = numChoices > 3 ? minChoiceHeight : maxChoiceHeight;
      const choiceSpacing = 1;
      const choiceStartY = boxY + 40; // Adjust based on text height
      
      for (let idx = 0; idx < dialogue.choices.length; idx++) {
        const choice = dialogue.choices[idx];
        const choiceY = choiceStartY + (idx * (choiceHeight + choiceSpacing));
        
        if (x >= boxX + 8 && x <= boxX + boxWidth - 8 &&
            y >= choiceY && y <= choiceY + choiceHeight) {
          
          // Apply flag change if set
          if (choice.setFlag) {
            const newFlags = project.flags.map(f => 
              f.name === choice.setFlag 
                ? { ...f, value: choice.setFlagValue !== false }
                : f
            );
            setProject({ ...project, flags: newFlags });
          }
          
          // Jump to scene if enabled, otherwise advance dialogue
          if (choice.enableGoto !== false && choice.goto !== undefined) {
            changeSceneWithTransition(choice.goto);
            setCurrentDialogueIndex(0);
          } else {
            // Just advance to next dialogue
            if (currentDialogueIndex < scene.dialogues.length - 1) {
              setCurrentDialogueIndex(currentDialogueIndex + 1);
            } else if (currentSceneIndex < project.scenes.length - 1) {
              changeSceneWithTransition(currentSceneIndex + 1, 0);
              setCurrentDialogueIndex(0);
            }
          }
          
          return;
        }
      }
      
      return; // Don't advance if choices are present but not clicked
    }
    
    // Normal dialogue advancement (no choices)
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
        backgroundImage: null,
        characterImage: null,
        dialogues: [{ speaker: "Narrator", text: "New dialogue..." }],
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
      speaker: "Character",
      text: "New dialogue..."
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

  // Upload custom font
  const uploadFont = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setProject({
        ...project,
        settings: {
          ...project.settings,
          customFont: e.target.result,
          fontFamily: 'CustomFont, dogica, monospace'
        }
      });
    };
    reader.readAsDataURL(file);
  };

  // Upload custom msgbox
  const uploadMsgBox = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setProject({
        ...project,
        settings: {
          ...project.settings,
          customMsgBox: e.target.result
        }
      });
    };
    reader.readAsDataURL(file);
  };

  // Upload custom namebox
  const uploadNameBox = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setProject({
        ...project,
        settings: {
          ...project.settings,
          customNameBox: e.target.result
        }
      });
    };
    reader.readAsDataURL(file);
  };

  // Export HTML with NinePatch support
  const exportHTML = () => {
    const scale = project.settings.scale;
    const displayWidth = 256 * scale;
    const displayHeight = 192 * scale;
    
    const fontFaceCSS = project.settings.customFont 
      ? `@font-face {
        font-family: 'CustomFont';
        src: url('${project.settings.customFont}');
      }`
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}</title>
  <style>
    @font-face {
      font-family: 'dogica';
      src: url('https://fonts.cdnfonts.com/s/37581/dogica.woff') format('woff');
      font-display: block;
    }
    ${fontFaceCSS}
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: dogica, monospace;
      overflow: hidden;
    }
    #game-container {
      position: relative;
      display: inline-block;
    }
    canvas {
      display: block;
      border: 2px solid #333;
      cursor: pointer;
      width: ${displayWidth}px;
      height: ${displayHeight}px;
      image-rendering: -moz-crisp-edges;
      image-rendering: -webkit-crisp-edges;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
    @media (max-width: ${displayWidth + 40}px) {
      canvas { 
        width: 100vw;
        height: auto;
      }
    }
  </style>
</head>
<body>
  <div id="game-container">
    <canvas id="game" width="256" height="192"></canvas>
  </div>
  <script>
    const gameData = ${JSON.stringify(project, null, 2)};
    
    // Import render functions
    ${exportRenderFunctions()}

    ${performGradientWipe.toString()}
    ${captureScene.toString()}
    
    let currentScene = 0;
    let currentDialogue = 0;
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;
    
    const fontFamily = gameData.settings.customFont ? 'CustomFont, dogica, monospace' : 'dogica, monospace';
    
    // Load transition image
    const transitionImg = new Image();
    if (gameData.settings.customTransition) {
      transitionImg.src = gameData.settings.customTransition;
    }
    let isTransitioning = false;
    
    // Function to change scene with transition
    function changeSceneWithTransition(newScene, newDialogue) {
      if (!transitionImg.complete) {
        currentScene = newScene;
        currentDialogue = newDialogue;
        render();
        return;
      }
      
      const oldScene = captureScene(canvas);
      const newSceneCanvas = document.createElement('canvas');
      newSceneCanvas.width = 256;
      newSceneCanvas.height = 192;
      const newCtx = newSceneCanvas.getContext('2d');
      
      // Render new scene
      const scene = gameData.scenes[newScene];
      if (scene.backgroundImage) {
        const img = new Image();
        img.src = scene.backgroundImage;
        img.onload = () => {
          newCtx.drawImage(img, 0, 0, 256, 192);
          doTransition(oldScene, newSceneCanvas, newScene, newDialogue);
        };
      } else {
        newCtx.fillStyle = scene.background;
        newCtx.fillRect(0, 0, 256, 192);
        doTransition(oldScene, newSceneCanvas, newScene, newDialogue);
      }
    }
    
    function doTransition(oldScene, newScene, newSceneIndex, newDialogue) {
      isTransitioning = true;
      const duration = gameData.settings.transitionDuration || 800;
      const startTime = Date.now();
      
      function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        performGradientWipe(ctx, oldScene, newScene, transitionImg, progress, 256, 192);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          isTransitioning = false;
          currentScene = newSceneIndex;
          currentDialogue = newDialogue;
          render();
        }
      }
      
      animate();
    }

    // Load images
    const msgBoxImg = new Image();
    const nameBoxImg = new Image();
    if (gameData.settings.customMsgBox) msgBoxImg.src = gameData.settings.customMsgBox;
    if (gameData.settings.customNameBox) nameBoxImg.src = gameData.settings.customNameBox;
    
    function render() {
      const [width, height] = gameData.resolution;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      
      const scene = gameData.scenes[currentScene];
      if (!scene) return;
      
      // Background
      if (scene.backgroundImage) {
        const img = new Image();
        img.src = scene.backgroundImage;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          drawCharacter();
        };
      } else {
        ctx.fillStyle = scene.background;
        ctx.fillRect(0, 0, width, height);
        drawCharacter();
      }
      
      function drawCharacter() {
        if (scene.characterImage) {
          const img = new Image();
          img.src = scene.characterImage;
          const charWidth = 80;
          const charHeight = 120;
          let charX = (width - charWidth) / 2;
          
          if (scene.characterPosition === 'left') charX = 20;
          if (scene.characterPosition === 'right') charX = width - charWidth - 20;
          
          img.onload = () => {
            ctx.drawImage(img, charX, height - charHeight - 10, charWidth, charHeight);
            drawUI();
          };
        } else if (scene.character) {
          ctx.fillStyle = '#4a4a4a';
          const charWidth = 64;
          const charHeight = 96;
          let charX = (width - charWidth) / 2;
          
          if (scene.characterPosition === 'left') charX = 20;
          if (scene.characterPosition === 'right') charX = width - charWidth - 20;
          
          ctx.fillRect(charX, height - charHeight - 50, charWidth, charHeight);
          drawUI();
        } else {
          drawUI();
        }
      }
      
      // Use imported functions for UI
      function drawUI() {
        const dialogue = scene.dialogues[currentDialogue];
        if (!dialogue) return;
        
        const boxX = 8;
        const boxY = height - 60;
        const boxWidth = width - 16;
        const boxHeight = 52;

        drawNinePatch(ctx, msgBoxImg, boxX, boxY, boxWidth, boxHeight);
        drawNameBox(ctx, nameBoxImg, dialogue.speaker, boxX, boxY, fontFamily);
        const lastY = drawDialogueText(ctx, dialogue.text, boxX, boxY, boxWidth, fontFamily);
        drawChoices(ctx, dialogue, boxX, boxY, boxWidth, lastY, 12, fontFamily);
        
        const hasMore = currentDialogue < scene.dialogues.length - 1 || currentScene < gameData.scenes.length - 1;
        if (!dialogue.choices || dialogue.choices.length === 0) {
          drawArrow(ctx, boxX, boxY, boxWidth, boxHeight, hasMore);
        }
        
        drawSceneIndicator(ctx, currentScene, gameData.scenes.length, fontFamily);
      }
    }
    
    canvas.addEventListener('click', (event) => {

      if (isTransitioning) return; // Don't click during transition

      const scene = gameData.scenes[currentScene];
      const dialogue = scene.dialogues[currentDialogue];
      
      // Check for choices
      if (dialogue.choices && dialogue.choices.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        const width = gameData.resolution[0];
        const height = gameData.resolution[1];
        const boxX = 8;
        const boxWidth = width - 16;
        
        const numChoices = dialogue.choices.length;
        const maxChoiceHeight = 14;
        const minChoiceHeight = 10;
        const choiceHeight = numChoices > 3 ? minChoiceHeight : maxChoiceHeight;
        const choiceSpacing = 1;
        const choiceStartY = height - 60 + 40;
        
        for (let idx = 0; idx < dialogue.choices.length; idx++) {
          const choice = dialogue.choices[idx];
          const choiceY = choiceStartY + (idx * (choiceHeight + choiceSpacing));
          
          if (x >= boxX + 8 && x <= boxX + boxWidth - 8 &&
              y >= choiceY && y <= choiceY + choiceHeight) {
            
            // Apply flag if set
            if (choice.setFlag) {
              gameData.flags = gameData.flags.map(f => 
                f.name === choice.setFlag 
                  ? { ...f, value: choice.setFlagValue !== false }
                  : f
              );
            }
            
            // Jump or advance
            if (choice.enableGoto !== false && choice.goto !== undefined) {
              changeSceneWithTransition(choice.goto, 0);
            } else {
              if (currentDialogue < scene.dialogues.length - 1) {
                currentDialogue++;
              } else if (currentScene < gameData.scenes.length - 1) {
                changeSceneWithTransition(currentScene + 1, 0);
              }
            }
            
            render();
            return;
          }
        }
        return;
      }
      
      // Normal advancement
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

  // Function to change scene with transition
  const changeSceneWithTransition = (newSceneIndex, newDialogueIndex = 0) => {
    if (!transitionImageRef.current || !canvasRef.current) {
      // No transition available, instant change
      setCurrentSceneIndex(newSceneIndex);
      setCurrentDialogueIndex(newDialogueIndex);
      return;
    }

    // Capture current scene
    const oldScene = captureScene(canvasRef.current);
    
    // Prepare new scene (render it off-screen)
    const newSceneCanvas = document.createElement('canvas');
    newSceneCanvas.width = project.resolution[0];
    newSceneCanvas.height = project.resolution[1];
    const newCtx = newSceneCanvas.getContext('2d', { alpha: false });
    
    // Render new scene to off-screen canvas
    const scene = project.scenes[newSceneIndex];
    if (scene.backgroundImage) {
      const img = new Image();
      img.src = scene.backgroundImage;
      img.onload = () => {
        newCtx.drawImage(img, 0, 0, project.resolution[0], project.resolution[1]);
        startTransition(oldScene, newSceneCanvas, newSceneIndex, newDialogueIndex);
      };
    } else {
      newCtx.fillStyle = scene.background;
      newCtx.fillRect(0, 0, project.resolution[0], project.resolution[1]);
      startTransition(oldScene, newSceneCanvas, newSceneIndex, newDialogueIndex);
    }
  };

  const startTransition = (oldScene, newScene, newSceneIndex, newDialogueIndex) => {
    setIsTransitioning(true);
    const duration = project.settings.transitionDuration;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setTransitionProgress(progress);
      
      // Perform gradient wipe
      const ctx = canvasRef.current.getContext('2d', { alpha: false });
      performGradientWipe(
        ctx,
        oldScene,
        newScene,
        transitionImageRef.current,
        progress,
        project.resolution[0],
        project.resolution[1]
      );
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsTransitioning(false);
        setCurrentSceneIndex(newSceneIndex);
        setCurrentDialogueIndex(newDialogueIndex);
      }
    };
    
    animate();
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
        if (!imported.settings) {
          imported.settings = {
            scale: 2,
            fontFamily: 'dogica, monospace',
            customFont: null,
            customMsgBox: null,
            customNameBox: null,
            customTransition: null,
            transitionDuration: 800 // ms
          };
        }
        if (!imported.flags) {
          imported.flags = [];
        }
        setProject(imported);
        setCurrentSceneIndex(0);
        setCurrentDialogueIndex(0);
      } catch (err) {
        alert('Error loading JSON file');
      }
    };
    reader.readAsText(file);
  };

  // Upload character sprite
  const uploadCharacter = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newChar = {
        id: Date.now(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        data: e.target.result
      };
      setProject({
        ...project,
        characters: [...project.characters, newChar]
      });
    };
    reader.readAsDataURL(file);
  };

  // Upload background
  const uploadBackground = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newBg = {
        id: Date.now(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        data: e.target.result
      };
      setProject({
        ...project,
        backgrounds: [...project.backgrounds, newBg]
      });
    };
    reader.readAsDataURL(file);
  };

  // Delete character
  const deleteCharacter = (id) => {
    setProject({
      ...project,
      characters: project.characters.filter(c => c.id !== id)
    });
  };

  // Delete background
  const deleteBackground = (id) => {
    setProject({
      ...project,
      backgrounds: project.backgrounds.filter(b => b.id !== id)
    });
  };

  const scene = project.scenes[currentSceneIndex];
  const displayWidth = 256 * project.settings.scale;
  const displayHeight = 192 * project.settings.scale;

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
          }}>Retronovel</h1>
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
          {['scenes', 'assets', 'settings', 'export'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px 4px',
                background: activeTab === tab ? '#f39c12' : '#2a2a3e',
                color: activeTab === tab ? '#000' : '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '10px',
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
              <h3 style={{ fontSize: '14px', color: '#f39c12' }}>Scenes</h3>
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
                + New
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
                  Scene {currentSceneIndex + 1} Properties
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

                {project.backgrounds.length > 0 && (
                  <>
                    <label style={{ display: 'block', fontSize: '11px', marginTop: '12px', marginBottom: '4px' }}>
                      Background Image:
                    </label>
                    <select
                      value={scene.backgroundImage || ''}
                      onChange={(e) => updateScene(currentSceneIndex, { backgroundImage: e.target.value || null })}
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
                      <option value="">None (use color)</option>
                      {project.backgrounds.map(bg => (
                        <option key={bg.id} value={bg.data}>{bg.name}</option>
                      ))}
                    </select>
                  </>
                )}

                {project.characters.length > 0 && (
                  <>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>
                      Character Sprite:
                    </label>
                    <select
                      value={scene.characterImage || ''}
                      onChange={(e) => updateScene(currentSceneIndex, { 
                        characterImage: e.target.value || null,
                        character: e.target.value ? 'sprite' : null
                      })}
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
                      <option value="">None</option>
                      {project.characters.map(char => (
                        <option key={char.id} value={char.data}>{char.name}</option>
                      ))}
                    </select>
                  </>
                )}

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
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
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
                  Show Character Placeholder
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
                  <h4 style={{ fontSize: '12px', color: '#f39c12' }}>Dialogues</h4>
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
                    + Dialogue
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
                        Dialogue {dIdx + 1}
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
                      placeholder="Dialogue text..."
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

                    {/* ChoiceEditor */}
                    <ChoiceEditor
                      dialogue={dialogue}
                      sceneIndex={currentSceneIndex}
                      dialogueIndex={dIdx}
                      updateDialogue={updateDialogue}
                      totalScenes={project.scenes.length}
                      flags={project.flags}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div>
            {/* Characters Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{ fontSize: '14px', color: '#f39c12' }}>Character Sprites</h3>
                <label style={{
                  padding: '6px 12px',
                  background: '#27ae60',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontFamily: 'inherit'
                }}>
                  + Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadCharacter}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {project.characters.map(char => (
                  <div
                    key={char.id}
                    style={{
                      background: '#2a2a3e',
                      border: '1px solid #4a5568',
                      padding: '8px',
                      position: 'relative'
                    }}
                  >
                    <img
                      src={char.data}
                      alt={char.name}
                      style={{
                        width: '100%',
                        height: '80px',
                        objectFit: 'contain',
                        marginBottom: '4px',
                        imageRendering: 'pixelated'
                      }}
                    />
                    <div style={{ fontSize: '10px', marginBottom: '4px' }}>{char.name}</div>
                    <button
                      onClick={() => deleteCharacter(char.id)}
                      style={{
                        width: '100%',
                        padding: '4px',
                        background: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontFamily: 'inherit'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              {project.characters.length === 0 && (
                <div style={{
                  padding: '16px',
                  background: '#2a2a3e',
                  border: '1px dashed #4a5568',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#888'
                }}>
                  No sprites uploaded
                </div>
              )}
            </div>

            {/* Backgrounds Section */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{ fontSize: '14px', color: '#f39c12' }}>Backgrounds</h3>
                <label style={{
                  padding: '6px 12px',
                  background: '#27ae60',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontFamily: 'inherit'
                }}>
                  + Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadBackground}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {project.backgrounds.map(bg => (
                  <div
                    key={bg.id}
                    style={{
                      background: '#2a2a3e',
                      border: '1px solid #4a5568',
                      padding: '8px',
                      position: 'relative'
                    }}
                  >
                    <img
                      src={bg.data}
                      alt={bg.name}
                      style={{
                        width: '100%',
                        height: '60px',
                        objectFit: 'cover',
                        marginBottom: '4px',
                        imageRendering: 'pixelated'
                      }}
                    />
                    <div style={{ fontSize: '10px', marginBottom: '4px' }}>{bg.name}</div>
                    <button
                      onClick={() => deleteBackground(bg.id)}
                      style={{
                        width: '100%',
                        padding: '4px',
                        background: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontFamily: 'inherit'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              {project.backgrounds.length === 0 && (
                <div style={{
                  padding: '16px',
                  background: '#2a2a3e',
                  border: '1px dashed #4a5568',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#888'
                }}>
                  No backgrounds uploaded
                </div>
              )}
            </div>

            {/* UI Graphics Section */}
            <div>
              <h3 style={{ fontSize: '14px', color: '#f39c12', marginBottom: '12px' }}>
                UI Graphics (NinePatch 16×16)
              </h3>
              
              {/* MsgBox */}
              <div style={{
                padding: '12px',
                background: '#2a2a3e',
                border: '1px solid #4a5568',
                marginBottom: '12px'
              }}>
                <h4 style={{ fontSize: '11px', marginBottom: '8px', color: '#fff' }}>
                  Message Box
                </h4>
                <label style={{
                  display: 'block',
                  padding: '8px',
                  background: '#27ae60',
                  color: '#fff',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: '10px',
                  marginBottom: '8px',
                  fontFamily: 'inherit'
                }}>
                  Upload Custom MsgBox (16×16)
                  <input
                    type="file"
                    accept="image/png"
                    onChange={uploadMsgBox}
                    style={{ display: 'none' }}
                  />
                </label>
                {project.settings.customMsgBox && (
                  <div style={{ fontSize: '10px', color: '#888' }}>
                    ✓ Custom msgbox loaded
                    <button
                      onClick={() => setProject({
                        ...project,
                        settings: { ...project.settings, customMsgBox: null }
                      })}
                      style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        background: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '9px',
                        fontFamily: 'inherit'
                      }}
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              {/* NameBox */}
              <div style={{
                padding: '12px',
                background: '#2a2a3e',
                border: '1px solid #4a5568'
              }}>
                <h4 style={{ fontSize: '11px', marginBottom: '8px', color: '#fff' }}>
                  Name Box
                </h4>
                <label style={{
                  display: 'block',
                  padding: '8px',
                  background: '#27ae60',
                  color: '#fff',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: '10px',
                  marginBottom: '8px',
                  fontFamily: 'inherit'
                }}>
                  Upload Custom NameBox (16×16)
                  <input
                    type="file"
                    accept="image/png"
                    onChange={uploadNameBox}
                    style={{ display: 'none' }}
                  />
                </label>
                {project.settings.customNameBox && (
                  <div style={{ fontSize: '10px', color: '#888' }}>
                    ✓ Custom namebox loaded
                    <button
                      onClick={() => setProject({
                        ...project,
                        settings: { ...project.settings, customNameBox: null }
                      })}
                      style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        background: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '9px',
                        fontFamily: 'inherit'
                      }}
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              <div style={{
                marginTop: '12px',
                padding: '8px',
                background: 'rgba(52, 152, 219, 0.1)',
                border: '1px solid #3498db',
                fontSize: '10px',
                lineHeight: '1.4',
                color: '#888'
              }}>
                📝 NinePatch format: 16×16 PNG divided into 9 parts (corners + edges + center). 
              </div>
            </div>

              {/* After UI Graphics section */}
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '14px', color: '#f39c12', marginBottom: '12px' }}>
                  Scene Transition
                </h3>
                
                <div style={{
                  padding: '12px',
                  background: '#2a2a3e',
                  border: '1px solid #4a5568'
                }}>
                  <label style={{
                    display: 'block',
                    padding: '8px',
                    background: '#27ae60',
                    color: '#fff',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: '10px',
                    marginBottom: '8px',
                    fontFamily: 'inherit'
                  }}>
                    Upload Custom Transition (256×192)
                    <input
                      type="file"
                      accept="image/png"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setProject({
                            ...project,
                            settings: { ...project.settings, customTransition: ev.target.result }
                          });
                        };
                        reader.readAsDataURL(file);
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                  
                  {project.settings.customTransition && (
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px' }}>
                      ✓ Custom transition loaded
                      <button
                        onClick={() => setProject({
                          ...project,
                          settings: { ...project.settings, customTransition: null }
                        })}
                        style={{
                          marginLeft: '8px',
                          padding: '2px 6px',
                          background: '#e74c3c',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '9px',
                          fontFamily: 'inherit'
                        }}
                      >
                        Reset
                      </button>
                    </div>
                  )}
                  
                  <div style={{ fontSize: '10px', color: '#888', lineHeight: '1.4' }}>
                    📝 Use grayscale gradient image (256×192 PNG). 
                    White areas appear first, black areas last.
                  </div>
                </div>
              </div>
          </div>

        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h3 style={{ fontSize: '14px', color: '#f39c12', marginBottom: '16px' }}>
              Settings
            </h3>

            {/* Viewport Scale */}
            <div style={{
              padding: '12px',
              background: '#2a2a3e',
              border: '1px solid #4a5568',
              marginBottom: '16px'
            }}>
              <h4 style={{ fontSize: '12px', marginBottom: '8px', color: '#f39c12' }}>
                Viewport Scale
              </h4>
              <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px' }}>
                Current: {project.settings.scale}× ({displayWidth}×{displayHeight}px)
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {[1, 2, 3, 4].map(scale => (
                  <button
                    key={scale}
                    onClick={() => setProject({
                      ...project,
                      settings: { ...project.settings, scale }
                    })}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: project.settings.scale === scale ? '#27ae60' : '#1a1a2e',
                      color: '#fff',
                      border: '1px solid #4a5568',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontFamily: 'inherit'
                    }}
                  >
                    {scale}×
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '8px' }}>
                This affects both editor and exported HTML
              </div>
            </div>

            {/* Font Settings */}
            <div style={{
              padding: '12px',
              background: '#2a2a3e',
              border: '1px solid #4a5568',
              marginBottom: '16px'
            }}>
              <h4 style={{ fontSize: '12px', marginBottom: '8px', color: '#f39c12' }}>
                Font Settings
              </h4>
              <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px' }}>
                Default: Dogica (pixel-perfect bitmap font)
              </label>
              
              <label style={{
                display: 'block',
                padding: '8px',
                background: '#27ae60',
                color: '#fff',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: '11px',
                marginBottom: '8px',
                fontFamily: 'inherit'
              }}>
                Upload Custom Font (.ttf, .otf)
                <input
                  type="file"
                  accept=".ttf,.otf"
                  onChange={uploadFont}
                  style={{ display: 'none' }}
                />
              </label>

              {project.settings.customFont && (
                <div style={{
                  padding: '8px',
                  background: '#1a1a2e',
                  border: '1px solid #4a5568',
                  fontSize: '10px',
                  marginBottom: '8px'
                }}>
                  ✓ Custom font loaded
                  <button
                    onClick={() => setProject({
                      ...project,
                      settings: {
                        ...project.settings,
                        customFont: null,
                        fontFamily: 'dogica, monospace'
                      }
                    })}
                    style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      background: '#e74c3c',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '9px',
                      fontFamily: 'inherit'
                    }}
                  >
                    Reset
                  </button>
                </div>
              )}

              <div style={{ fontSize: '10px', color: '#888', marginTop: '8px' }}>
                Recommended: Pixel art fonts for best results
              </div>
            </div>
          </div>
        )}
    
        {/* Flags Manager */}
        <FlagsManager
          flags={project.flags}
          setFlags={(newFlags) => setProject({ ...project, flags: newFlags })}
        />

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
              📦 Export HTML
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
              💾 Export JSON
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
              📁 Import JSON
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
                <li>Export HTML for a standalone file</li>
                <li>Export JSON to save/share projects</li>
                <li>Import JSON to load saved projects</li>
                <li>Settings (scale, font, UI) are saved</li>
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
            Dialogue {currentDialogueIndex + 1} / {scene?.dialogues.length || 0}
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
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
              imageRendering: 'pixelated',
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
          {isPlaying ? 'Click on preview to advance' : 'Press Play to test your visual novel'}
          <br />
          Scale: {project.settings.scale}× • Resolution: {displayWidth}×{displayHeight}
        </div>
      </div>
    </div>
  );
};

export default VNEditor;