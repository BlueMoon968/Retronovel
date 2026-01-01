/**
 * Export Engine - Centralized HTML export system
 * Generates standalone playable HTML files
 */

import { exportRenderFunctions } from './renderEngine';
import { exportTransitionFunctions } from './transitionEngine';

export const generateGameHTML = (project) => {
  const scale = project.settings.scale || 2;
  const displayWidth = 256 * scale;
  const displayHeight = 192 * scale;
  
  const fontFaceCSS = project.settings.customFont 
    ? `@font-face {
        font-family: 'CustomFont';
        src: url('${project.settings.customFont}');
      }`
    : '';

  return `<!DOCTYPE html>
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
    
    // Render functions
    ${exportRenderFunctions()}
    
    // Transition functions
    ${exportTransitionFunctions()}
    
    // Game state
    let currentScene = 0;
    let currentCommand = 0;
    let isTransitioning = false;
    let choicePositions = null;
    
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = false;
    
    const fontFamily = gameData.settings.customFont ? 'CustomFont, dogica, monospace' : 'dogica, monospace';
    
    // Load UI images
    const msgBoxImg = new Image();
    const nameBoxImg = new Image();
    const transitionImg = new Image();
    
    if (gameData.settings.customMsgBox) msgBoxImg.src = gameData.settings.customMsgBox;
    if (gameData.settings.customNameBox) nameBoxImg.src = gameData.settings.customNameBox;
    if (gameData.settings.customTransition) {
      transitionImg.src = gameData.settings.customTransition;
    }
    
    // Execute command
    function executeCommand(command) {
      if (command.type === 'setFlag') {
        gameData.flags = gameData.flags.map(f => 
          f.name === command.flagName 
            ? { ...f, value: command.flagValue }
            : f
        );
        advanceCommand();
      } else if (command.type === 'goto') {
        if (command.useTransition && transitionImg.complete) {
          changeSceneWithTransition(command.targetScene, 0);
        } else {
          currentScene = command.targetScene;
          currentCommand = 0;
          render();
        }
      }
    }
    
    // Advance to next command
    function advanceCommand() {
      const scene = gameData.scenes[currentScene];
      if (currentCommand < scene.commands.length - 1) {
        currentCommand++;
        const nextCommand = scene.commands[currentCommand];
        if (nextCommand.type !== 'dialogue') {
          executeCommand(nextCommand);
        } else {
          render();
        }
      } else if (currentScene < gameData.scenes.length - 1) {
        changeSceneWithTransition(currentScene + 1, 0);
      }
    }
    
    // Scene transition
    function changeSceneWithTransition(newScene, newCommand) {
      if (!transitionImg.complete) {
        currentScene = newScene;
        currentCommand = newCommand;
        render();
        return;
      }
      
      isTransitioning = true;
      const oldScene = captureScene(canvas);
      const newSceneCanvas = document.createElement('canvas');
      newSceneCanvas.width = 256;
      newSceneCanvas.height = 192;
      const newCtx = newSceneCanvas.getContext('2d');
      newCtx.imageSmoothingEnabled = false;
      
      const scene = gameData.scenes[newScene];
      
      // Render new scene background
      if (scene.backgroundImage) {
        const img = new Image();
        img.src = scene.backgroundImage;
        img.onload = () => {
          newCtx.drawImage(img, 0, 0, 256, 192);
          renderCharacter();
        };
      } else {
        newCtx.fillStyle = scene.background;
        newCtx.fillRect(0, 0, 256, 192);
        renderCharacter();
      }
      
      function renderCharacter() {
        if (scene.characterImage) {
          const charImg = new Image();
          charImg.src = scene.characterImage;
          charImg.onload = () => {
            const charWidth = 80;
            const charHeight = 120;
            let charX = (256 - charWidth) / 2;
            if (scene.characterPosition === 'left') charX = 20;
            if (scene.characterPosition === 'right') charX = 256 - charWidth - 20;
            newCtx.drawImage(charImg, charX, 192 - charHeight - 10, charWidth, charHeight);
            doTransition();
          };
        } else if (scene.character) {
          newCtx.fillStyle = '#4a4a4a';
          const charWidth = 64;
          const charHeight = 96;
          let charX = (256 - charWidth) / 2;
          if (scene.characterPosition === 'left') charX = 20;
          if (scene.characterPosition === 'right') charX = 256 - charWidth - 20;
          newCtx.fillRect(charX, 192 - charHeight - 50, charWidth, charHeight);
          doTransition();
        } else {
          doTransition();
        }
      }
      
      function doTransition() {
        const duration = gameData.settings.transitionDuration || 800;
        const startTime = Date.now();
        
        function animate() {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          performGradientWipe(ctx, oldScene, newSceneCanvas, transitionImg, progress, 256, 192);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            isTransitioning = false;
            currentScene = newScene;
            currentCommand = newCommand;
            render();
          }
        }
        
        animate();
      }
    }
    
    // Render current state
    function render() {
      const scene = gameData.scenes[currentScene];
      if (!scene) return;
      
      const command = scene.commands[currentCommand];
      
      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 256, 192);
      
      // Background
      if (scene.backgroundImage) {
        const img = new Image();
        img.src = scene.backgroundImage;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 256, 192);
          drawCharacter();
        };
      } else {
        ctx.fillStyle = scene.background;
        ctx.fillRect(0, 0, 256, 192);
        drawCharacter();
      }
      
      function drawCharacter() {
        if (scene.characterImage) {
          const img = new Image();
          img.src = scene.characterImage;
          img.onload = () => {
            const charWidth = 80;
            const charHeight = 120;
            let charX = (256 - charWidth) / 2;
            if (scene.characterPosition === 'left') charX = 20;
            if (scene.characterPosition === 'right') charX = 256 - charWidth - 20;
            ctx.drawImage(img, charX, 192 - charHeight - 10, charWidth, charHeight);
            drawUI();
          };
        } else if (scene.character) {
          ctx.fillStyle = '#4a4a4a';
          const charWidth = 64;
          const charHeight = 96;
          let charX = (256 - charWidth) / 2;
          if (scene.characterPosition === 'left') charX = 20;
          if (scene.characterPosition === 'right') charX = 256 - charWidth - 20;
          ctx.fillRect(charX, 192 - charHeight - 50, charWidth, charHeight);
          drawUI();
        } else {
          drawUI();
        }
      }
      
      function drawUI() {
        if (!command || command.type !== 'dialogue') {
          drawSceneIndicator(ctx, currentScene, gameData.scenes.length, fontFamily);
          return;
        }
        
        const boxX = 8;
        const boxY = 192 - 60;
        const boxWidth = 256 - 16;
        const boxHeight = 52;

        // Message box
        drawNinePatch(ctx, msgBoxImg, boxX, boxY, boxWidth, boxHeight);
        drawNameBox(ctx, nameBoxImg, command.speaker, boxX, boxY, fontFamily);
        drawDialogueText(ctx, command.text, boxX, boxY, boxWidth, fontFamily);
        
        // Choices (centered)
        choicePositions = drawChoices(ctx, command, 256, 192, fontFamily);
        
        // Arrow if no choices
        if (!command.choices || command.choices.length === 0) {
          const hasMore = currentCommand < scene.commands.length - 1 || currentScene < gameData.scenes.length - 1;
          drawArrow(ctx, boxX, boxY, boxWidth, boxHeight, hasMore);
        }
        
        drawSceneIndicator(ctx, currentScene, gameData.scenes.length, fontFamily);
      }
    }
    
    // Click handler
    canvas.addEventListener('click', (event) => {
      if (isTransitioning) return;
      
      const scene = gameData.scenes[currentScene];
      const command = scene.commands[currentCommand];
      
      // Check for choices
      if (command && command.type === 'dialogue' && choicePositions && choicePositions.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        for (let pos of choicePositions) {
          if (x >= pos.x && x <= pos.x + pos.width &&
              y >= pos.y && y <= pos.y + pos.height) {
            
            // Apply flag if set
            if (pos.choice.setFlag) {
              gameData.flags = gameData.flags.map(f => 
                f.name === pos.choice.setFlag 
                  ? { ...f, value: pos.choice.setFlagValue !== false }
                  : f
              );
            }
            
            // Jump or advance
            if (pos.choice.enableGoto !== false && pos.choice.goto !== undefined) {
              changeSceneWithTransition(pos.choice.goto, 0);
            } else {
              advanceCommand();
            }
            
            return;
          }
        }
        return;
      }
      
      // Normal advancement
      if (command && command.type === 'dialogue') {
        advanceCommand();
      } else {
        executeCommand(command);
      }
    });
    
    // Start game
    render();
  </script>
</body>
</html>`;
};
