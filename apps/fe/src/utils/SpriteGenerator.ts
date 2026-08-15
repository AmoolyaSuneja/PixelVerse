export const generateProceduralDataURL = (seedId: string): string => {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  drawProceduralCharacter(ctx, 32, 32, seedId, 32, 0, 'down');
  
  return canvas.toDataURL("image/png");
};

export const drawProceduralCharacter = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  seedId: string, // e.g., "procedural:male_1"
  size: number,
  walkCycle: number,
  direction: string
) => {
  const parts = seedId.split(":");
  const id = parts.length > 1 ? parts[1] : "male_1";
  
  // Define vibrant anime-style palettes for the 10 distinct characters
  const palettes: Record<string, { skin: string; hair: string; shirt: string; pants: string; eyeColor: string }> = {
    "male_1": { skin: "#ffe0bd", hair: "#ff3366", shirt: "#00d2ff", pants: "#1a1a2e", eyeColor: "#00d2ff" }, // Vibrant pink hair, blue eyes
    "male_2": { skin: "#d2996c", hair: "#ffffff", shirt: "#ff003c", pants: "#0f0f1b", eyeColor: "#ff003c" }, // White hair, red eyes
    "male_3": { skin: "#ffce9e", hair: "#ffd700", shirt: "#00ff88", pants: "#333333", eyeColor: "#8a2be2" }, // Blonde spiky, purple eyes
    "male_4": { skin: "#ffeadb", hair: "#ff5e00", shirt: "#8a2be2", pants: "#111111", eyeColor: "#00ff88" }, // Orange hair, green eyes
    "male_5": { skin: "#8d5524", hair: "#39ff14", shirt: "#ffff00", pants: "#222222", eyeColor: "#ff00ff" }, // Neon green hair, magenta eyes
    "female_1": { skin: "#ffe0bd", hair: "#00ffff", shirt: "#ff66b2", pants: "#ffffff", eyeColor: "#ff66b2" }, // Cyan hair, pink eyes
    "female_2": { skin: "#d2996c", hair: "#9400d3", shirt: "#00fa9a", pants: "#1a1a2e", eyeColor: "#ffd700" }, // Purple hair, gold eyes
    "female_3": { skin: "#ffce9e", hair: "#ff1493", shirt: "#ff8c00", pants: "#1a2a6c", eyeColor: "#00ffff" }, // Deep pink hair, cyan eyes
    "female_4": { skin: "#ffeadb", hair: "#1e90ff", shirt: "#ff00ff", pants: "#0a0a0a", eyeColor: "#39ff14" }, // Blue hair, neon green eyes
    "female_5": { skin: "#8d5524", hair: "#ff4500", shirt: "#ffffff", pants: "#00008b", eyeColor: "#00d2ff" }, // Orange red hair, blue eyes
  };

  const palette = palettes[id] || palettes["male_1"];
  const isFemale = id.startsWith("female");
  
  ctx.save();
  ctx.translate(x, y);

  // If moving left, flip the canvas horizontally
  if (direction === "left") {
    ctx.scale(-1, 1);
  }

  // Fluid walking animation mechanics
  const isMoving = walkCycle > 0;
  const speed = 1.0; // Fast, real-time animation speed
  const bob = isMoving ? Math.abs(Math.sin(walkCycle * speed)) * 4 : 0;
  const limbSwing = isMoving ? Math.sin(walkCycle * speed) * (size * 0.4) : 0;
  const headTilt = isMoving ? Math.sin(walkCycle * speed * 0.5) * 0.08 : 0;
  
  const bodyY = -bob;

  // Draw Legs
  ctx.strokeStyle = palette.pants;
  ctx.lineWidth = size * 0.25;
  ctx.lineCap = "round";
  
  // Since the character is drawn front-facing, limbs should ONLY swing in the Y-axis (up and down)
  // to simulate stepping forward and backward, regardless of walking direction.
  // We use limbSwing to alternate the left/right pairs.
  const step = limbSwing * 0.5;

  // Left Leg
  ctx.beginPath();
  ctx.moveTo(-size * 0.2, bodyY + size * 0.2);
  ctx.lineTo(-size * 0.2, bodyY + size * 0.6 + step);
  ctx.stroke();

  // Right Leg
  ctx.beginPath();
  ctx.moveTo(size * 0.2, bodyY + size * 0.2);
  ctx.lineTo(size * 0.2, bodyY + size * 0.6 - step);
  ctx.stroke();

  // Draw Torso (Anime Chibi style: small body, big head)
  ctx.fillStyle = palette.shirt;
  const torsoWidth = isFemale ? size * 0.4 : size * 0.5;
  const torsoHeight = size * 0.4;
  ctx.fillRect(-torsoWidth / 2, bodyY - size * 0.15, torsoWidth, torsoHeight);
  
  // Optional Belt/Detail
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(-torsoWidth / 2, bodyY + size * 0.1, torsoWidth, size * 0.08);

  // Draw Arms
  ctx.strokeStyle = palette.shirt;
  ctx.lineWidth = size * 0.15;
  
  // Left Arm (Swings backward when Left Leg swings forward)
  // Left Leg = +step, so Left Arm = -step
  ctx.beginPath();
  ctx.moveTo(-torsoWidth / 2 - size * 0.05, bodyY - size * 0.1);
  ctx.lineTo(-torsoWidth / 2 - size * 0.1, bodyY + size * 0.25 - step);
  ctx.stroke();

  // Right Arm (Swings forward when Right Leg swings backward)
  // Right Leg = -step, so Right Arm = +step
  ctx.beginPath();
  ctx.moveTo(torsoWidth / 2 + size * 0.05, bodyY - size * 0.1);
  ctx.lineTo(torsoWidth / 2 + size * 0.1, bodyY + size * 0.25 + step);
  ctx.stroke();

  // Draw Head (Chibi - very large head)
  ctx.save();
  ctx.translate(0, bodyY - size * 0.5); // move to neck pivot
  ctx.rotate(headTilt); // Head swaying side to side as they walk
  ctx.translate(0, -(bodyY - size * 0.5)); // move back

  ctx.fillStyle = palette.skin;
  const headSize = size * 0.7; // increased head size
  ctx.fillRect(-headSize / 2, bodyY - size * 0.85, headSize, headSize);

  // Draw Anime Eyes (based on direction)
  if (direction !== "up") {
    // Sclera (White part)
    ctx.fillStyle = "#ffffff";
    const eyeWidth = size * 0.18;
    const eyeHeight = size * 0.22;
    const eyeY = bodyY - size * 0.6;
    
    if (direction === "left" || direction === "right") {
      // Side view, one large eye
      ctx.fillRect(size * 0.05, eyeY, eyeWidth, eyeHeight);
      // Iris/Pupil
      ctx.fillStyle = palette.eyeColor;
      ctx.fillRect(size * 0.12, eyeY + size * 0.04, eyeWidth * 0.6, eyeHeight * 0.8);
      // Highlight (Anime twinkle)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(size * 0.15, eyeY + size * 0.06, size * 0.04, size * 0.04);
    } else {
      // Front view, two large eyes
      ctx.fillRect(-size * 0.25, eyeY, eyeWidth, eyeHeight);
      ctx.fillRect(size * 0.07, eyeY, eyeWidth, eyeHeight);
      
      // Irises
      ctx.fillStyle = palette.eyeColor;
      ctx.fillRect(-size * 0.21, eyeY + size * 0.04, eyeWidth * 0.6, eyeHeight * 0.8);
      ctx.fillRect(size * 0.11, eyeY + size * 0.04, eyeWidth * 0.6, eyeHeight * 0.8);
      
      // Highlights
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-size * 0.18, eyeY + size * 0.06, size * 0.04, size * 0.04);
      ctx.fillRect(size * 0.14, eyeY + size * 0.06, size * 0.04, size * 0.04);
    }
  }

  // Draw Hair (Anime Style: Big, spiky or flowy)
  ctx.fillStyle = palette.hair;
  if (isFemale) {
    // Bangs
    ctx.fillRect(-headSize / 2 - size * 0.05, bodyY - size * 0.9, headSize + size * 0.1, headSize * 0.4);
    // Twin tails or long flowing hair
    ctx.fillRect(-headSize / 2 - size * 0.1, bodyY - size * 0.6, size * 0.2, size * 0.6);
    ctx.fillRect(headSize / 2 - size * 0.1, bodyY - size * 0.6, size * 0.2, size * 0.6);
  } else {
    // Spiky protagonist hair
    ctx.beginPath();
    ctx.moveTo(-headSize / 2 - size * 0.1, bodyY - size * 0.5);
    ctx.lineTo(-headSize / 2, bodyY - size * 1.1);
    ctx.lineTo(-size * 0.1, bodyY - size * 0.8);
    ctx.lineTo(size * 0.2, bodyY - size * 1.15);
    ctx.lineTo(headSize / 2, bodyY - size * 0.8);
    ctx.lineTo(headSize / 2 + size * 0.1, bodyY - size * 0.5);
    ctx.fill();
    // Front bangs
    ctx.fillRect(-headSize / 2, bodyY - size * 0.9, headSize, headSize * 0.3);
  }

  ctx.restore(); // restore head rotation
  ctx.restore(); // restore character translation
};
