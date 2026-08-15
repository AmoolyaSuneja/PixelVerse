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
  
  // Define palettes for the 10 distinct characters
  const palettes: Record<string, { skin: string; hair: string; shirt: string; pants: string }> = {
    "male_1": { skin: "#f1c27d", hair: "#5c3a21", shirt: "#3498db", pants: "#2c3e50" },
    "male_2": { skin: "#8d5524", hair: "#1a1a1a", shirt: "#e74c3c", pants: "#2980b9" },
    "male_3": { skin: "#e0ac69", hair: "#f1c40f", shirt: "#2ecc71", pants: "#7f8c8d" },
    "male_4": { skin: "#ffdbac", hair: "#d35400", shirt: "#9b59b6", pants: "#c0392b" },
    "male_5": { skin: "#c68642", hair: "#333333", shirt: "#f1c40f", pants: "#2c3e50" },
    "female_1": { skin: "#f1c27d", hair: "#f1c40f", shirt: "#ff9ff3", pants: "#ffffff" },
    "female_2": { skin: "#8d5524", hair: "#1a1a1a", shirt: "#00d2d3", pants: "#2c3e50" },
    "female_3": { skin: "#e0ac69", hair: "#5c3a21", shirt: "#ff9f43", pants: "#2980b9" },
    "female_4": { skin: "#ffdbac", hair: "#d35400", shirt: "#222f3e", pants: "#222f3e" },
    "female_5": { skin: "#c68642", hair: "#9b59b6", shirt: "#ffffff", pants: "#2980b9" },
  };

  const palette = palettes[id] || palettes["male_1"];
  const isFemale = id.startsWith("female");
  
  ctx.save();
  ctx.translate(x, y);

  // If moving left, flip the canvas horizontally
  if (direction === "left") {
    ctx.scale(-1, 1);
  }

  // Bobbing effect for walking
  const isMoving = walkCycle > 0;
  const bob = isMoving ? Math.abs(Math.sin(walkCycle)) * 4 : 0;
  const limbSwing = isMoving ? Math.sin(walkCycle) * 12 : 0;
  const bodyY = -bob;

  // Draw Legs
  ctx.strokeStyle = palette.pants;
  ctx.lineWidth = size * 0.25;
  ctx.lineCap = "round";
  
  // Left Leg
  ctx.beginPath();
  ctx.moveTo(-size * 0.2, bodyY + size * 0.2);
  ctx.lineTo(-size * 0.2 + limbSwing, bodyY + size * 0.6);
  ctx.stroke();

  // Right Leg
  ctx.beginPath();
  ctx.moveTo(size * 0.2, bodyY + size * 0.2);
  ctx.lineTo(size * 0.2 - limbSwing, bodyY + size * 0.6);
  ctx.stroke();

  // Draw Torso
  ctx.fillStyle = palette.shirt;
  const torsoWidth = isFemale ? size * 0.5 : size * 0.6;
  const torsoHeight = size * 0.5;
  ctx.fillRect(-torsoWidth / 2, bodyY - size * 0.3, torsoWidth, torsoHeight);
  
  // Optional Belt/Detail
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(-torsoWidth / 2, bodyY + size * 0.1, torsoWidth, size * 0.1);

  // Draw Arms
  ctx.strokeStyle = palette.shirt;
  ctx.lineWidth = size * 0.2;
  
  // Left Arm (Behind Torso if walking right)
  ctx.beginPath();
  ctx.moveTo(-torsoWidth / 2 - size * 0.1, bodyY - size * 0.2);
  ctx.lineTo(-torsoWidth / 2 - size * 0.1 - limbSwing, bodyY + size * 0.2);
  ctx.stroke();

  // Right Arm (In Front)
  ctx.beginPath();
  ctx.moveTo(torsoWidth / 2 + size * 0.1, bodyY - size * 0.2);
  ctx.lineTo(torsoWidth / 2 + size * 0.1 + limbSwing, bodyY + size * 0.2);
  ctx.stroke();

  // Draw Head
  ctx.fillStyle = palette.skin;
  const headSize = size * 0.5;
  ctx.fillRect(-headSize / 2, bodyY - size * 0.8, headSize, headSize);

  // Draw Eyes (based on direction)
  ctx.fillStyle = "#000000";
  if (direction === "up") {
    // No eyes visible from back
  } else if (direction === "left" || direction === "right") {
    // Side view, one eye
    ctx.fillRect(size * 0.1, bodyY - size * 0.65, size * 0.1, size * 0.1);
  } else {
    // Front view, two eyes
    ctx.fillRect(-size * 0.15, bodyY - size * 0.65, size * 0.1, size * 0.1);
    ctx.fillRect(size * 0.05, bodyY - size * 0.65, size * 0.1, size * 0.1);
  }

  // Draw Hair
  ctx.fillStyle = palette.hair;
  if (isFemale) {
    // Long hair
    ctx.fillRect(-headSize / 2 - 2, bodyY - size * 0.8 - 4, headSize + 4, headSize * 0.6);
    // Hair trailing down back
    ctx.fillRect(-headSize / 2 - 2, bodyY - size * 0.4, headSize + 4, size * 0.4);
  } else {
    // Short hair
    ctx.fillRect(-headSize / 2 - 2, bodyY - size * 0.8 - 4, headSize + 4, headSize * 0.4);
  }

  ctx.restore();
};
