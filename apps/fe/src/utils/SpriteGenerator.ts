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
  
  // Define highly detailed character colors based on Killua and Sailor Moon
  const palettes: Record<string, any> = {
    "male_1": { skin: "#ffe0bd", hair: "#e0e5eb", shirt: "#ffffff", undershirt: "#1a1a2e", pants: "#4a4e69", eyeColor: "#00d2ff", shoes: "#3f37c9" }, // Killua
    "male_2": { skin: "#d2996c", hair: "#ff3366", shirt: "#111", undershirt: "#ff003c", pants: "#0f0f1b", eyeColor: "#ff003c", shoes: "#111" },
    "male_3": { skin: "#ffce9e", hair: "#ffd700", shirt: "#333", undershirt: "#00ff88", pants: "#222", eyeColor: "#8a2be2", shoes: "#fff" },
    "male_4": { skin: "#ffeadb", hair: "#ff5e00", shirt: "#fff", undershirt: "#8a2be2", pants: "#111", eyeColor: "#00ff88", shoes: "#ff5e00" },
    "male_5": { skin: "#8d5524", hair: "#39ff14", shirt: "#222", undershirt: "#ffff00", pants: "#111", eyeColor: "#ff00ff", shoes: "#39ff14" },
    "female_1": { skin: "#ffe0bd", hair: "#ffd700", collar: "#00008b", bow: "#ff0000", skirt: "#00008b", eyeColor: "#00d2ff", boots: "#ff0000", tiara: "#ffd700" }, // Sailor Moon
    "female_2": { skin: "#d2996c", hair: "#9400d3", collar: "#1a1a2e", bow: "#ffd700", skirt: "#1a1a2e", eyeColor: "#ffd700", boots: "#1a1a2e", tiara: "#ff0000" },
    "female_3": { skin: "#ffce9e", hair: "#ff1493", collar: "#1a2a6c", bow: "#ff8c00", skirt: "#1a2a6c", eyeColor: "#00ffff", boots: "#ff8c00", tiara: "#00ffff" },
    "female_4": { skin: "#ffeadb", hair: "#1e90ff", collar: "#0a0a0a", bow: "#ff00ff", skirt: "#0a0a0a", eyeColor: "#39ff14", boots: "#ff00ff", tiara: "#ff00ff" },
    "female_5": { skin: "#8d5524", hair: "#ff4500", collar: "#00008b", bow: "#ffffff", skirt: "#00008b", eyeColor: "#00d2ff", boots: "#ffffff", tiara: "#ff4500" },
  };

  const palette = palettes[id] || palettes["male_1"];
  const isFemale = id.startsWith("female");
  
  ctx.save();
  ctx.translate(x, y);

  if (direction === "left") ctx.scale(-1, 1);

  const isMoving = walkCycle > 0;
  const speed = 0.5;
  const bob = isMoving ? Math.abs(Math.sin(walkCycle * speed)) * (size * 0.1) : 0;
  const limbSwing = isMoving ? Math.sin(walkCycle * speed) * (size * 0.4) : 0;
  const bodyY = -bob;

  // -- LEGS --
  ctx.lineWidth = size * 0.2;
  ctx.lineCap = "round";
  
  // Left Leg (Back)
  ctx.strokeStyle = isFemale ? "#ffe0bd" : palette.pants;
  ctx.beginPath();
  ctx.moveTo(-size * 0.15, bodyY + size * 0.2);
  ctx.lineTo(-size * 0.15 + limbSwing, bodyY + size * 0.6);
  ctx.stroke();

  if (isFemale) {
    // Female Boots
    ctx.strokeStyle = palette.boots;
    ctx.beginPath();
    ctx.moveTo(-size * 0.15 + (limbSwing * 0.5), bodyY + size * 0.4);
    ctx.lineTo(-size * 0.15 + limbSwing, bodyY + size * 0.6);
    ctx.stroke();
  } else {
    // Male Shoes
    ctx.fillStyle = palette.shoes;
    ctx.beginPath();
    ctx.arc(-size * 0.15 + limbSwing + size * 0.05, bodyY + size * 0.6, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Right Leg (Front)
  ctx.strokeStyle = isFemale ? "#ffe0bd" : palette.pants;
  ctx.beginPath();
  ctx.moveTo(size * 0.15, bodyY + size * 0.2);
  ctx.lineTo(size * 0.15 - limbSwing, bodyY + size * 0.6);
  ctx.stroke();

  if (isFemale) {
    // Female Boots
    ctx.strokeStyle = palette.boots;
    ctx.beginPath();
    ctx.moveTo(size * 0.15 - (limbSwing * 0.5), bodyY + size * 0.4);
    ctx.lineTo(size * 0.15 - limbSwing, bodyY + size * 0.6);
    ctx.stroke();
  } else {
    // Male Shoes
    ctx.fillStyle = palette.shoes;
    ctx.beginPath();
    ctx.arc(size * 0.15 - limbSwing + size * 0.05, bodyY + size * 0.6, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // -- LEFT ARM (Back) --
  ctx.strokeStyle = isFemale ? "#ffffff" : palette.undershirt;
  ctx.lineWidth = size * 0.15;
  ctx.beginPath();
  ctx.moveTo(-size * 0.25, bodyY - size * 0.1);
  ctx.lineTo(-size * 0.25 - limbSwing, bodyY + size * 0.3);
  ctx.stroke();

  // -- TORSO --
  const torsoWidth = size * 0.5;
  const torsoHeight = size * 0.45;
  
  if (isFemale) {
    // Sailor Uniform Leotard
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-torsoWidth / 2, bodyY - size * 0.15, torsoWidth, torsoHeight);
    
    // Pleated Skirt
    ctx.fillStyle = palette.skirt;
    ctx.beginPath();
    ctx.moveTo(-torsoWidth / 2, bodyY + size * 0.2);
    ctx.lineTo(torsoWidth / 2, bodyY + size * 0.2);
    ctx.lineTo(torsoWidth / 2 + size * 0.1, bodyY + size * 0.4);
    ctx.lineTo(-torsoWidth / 2 - size * 0.1, bodyY + size * 0.4);
    ctx.fill();
    
    if (direction === "down" || direction === "left" || direction === "right") {
      // Sailor Collar
      ctx.fillStyle = palette.collar;
      ctx.beginPath();
      ctx.moveTo(-torsoWidth / 2, bodyY - size * 0.15);
      ctx.lineTo(torsoWidth / 2, bodyY - size * 0.15);
      ctx.lineTo(0, bodyY + size * 0.1);
      ctx.fill();
      
      // Red Bow
      ctx.fillStyle = palette.bow;
      ctx.beginPath();
      ctx.moveTo(0, bodyY);
      ctx.lineTo(-size * 0.15, bodyY - size * 0.05);
      ctx.lineTo(-size * 0.15, bodyY + size * 0.1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, bodyY);
      ctx.lineTo(size * 0.15, bodyY - size * 0.05);
      ctx.lineTo(size * 0.15, bodyY + size * 0.1);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, bodyY, size * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Killua's Undershirt (V-Neck)
    ctx.fillStyle = palette.undershirt;
    ctx.fillRect(-torsoWidth / 2, bodyY - size * 0.15, torsoWidth, torsoHeight);
    
    // Killua's Over-shirt
    ctx.fillStyle = palette.shirt;
    ctx.beginPath();
    ctx.moveTo(-torsoWidth / 2, bodyY - size * 0.15);
    ctx.lineTo(torsoWidth / 2, bodyY - size * 0.15);
    ctx.lineTo(torsoWidth / 2, bodyY + size * 0.15);
    ctx.lineTo(size * 0.1, bodyY + size * 0.2);
    ctx.lineTo(0, bodyY); // V-neck
    ctx.lineTo(-size * 0.1, bodyY + size * 0.2);
    ctx.lineTo(-torsoWidth / 2, bodyY + size * 0.15);
    ctx.fill();
  }

  // -- RIGHT ARM (Front) --
  ctx.strokeStyle = isFemale ? "#ffffff" : palette.undershirt;
  ctx.beginPath();
  ctx.moveTo(size * 0.25, bodyY - size * 0.1);
  ctx.lineTo(size * 0.25 + limbSwing, bodyY + size * 0.3);
  ctx.stroke();

  if (!isFemale) {
    // Killua's short sleeves
    ctx.strokeStyle = palette.shirt;
    ctx.lineWidth = size * 0.18;
    ctx.beginPath();
    ctx.moveTo(size * 0.25, bodyY - size * 0.1);
    ctx.lineTo(size * 0.25 + (limbSwing * 0.3), bodyY + size * 0.05);
    ctx.stroke();
  }

  // -- HEAD --
  const headSize = size * 0.7;
  ctx.fillStyle = palette.skin;
  ctx.fillRect(-headSize / 2, bodyY - size * 0.85, headSize, headSize);

  // Eyes
  if (direction !== "up") {
    ctx.fillStyle = "#ffffff";
    const eyeWidth = size * 0.18;
    const eyeHeight = size * 0.22;
    const eyeY = bodyY - size * 0.6;
    
    if (direction === "left" || direction === "right") {
      ctx.fillRect(size * 0.05, eyeY, eyeWidth, eyeHeight);
      ctx.fillStyle = palette.eyeColor;
      ctx.fillRect(size * 0.12, eyeY + size * 0.04, eyeWidth * 0.6, eyeHeight * 0.8);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(size * 0.15, eyeY + size * 0.06, size * 0.04, size * 0.04);
    } else {
      ctx.fillRect(-size * 0.25, eyeY, eyeWidth, eyeHeight);
      ctx.fillRect(size * 0.07, eyeY, eyeWidth, eyeHeight);
      ctx.fillStyle = palette.eyeColor;
      ctx.fillRect(-size * 0.21, eyeY + size * 0.04, eyeWidth * 0.6, eyeHeight * 0.8);
      ctx.fillRect(size * 0.11, eyeY + size * 0.04, eyeWidth * 0.6, eyeHeight * 0.8);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-size * 0.18, eyeY + size * 0.06, size * 0.04, size * 0.04);
      ctx.fillRect(size * 0.14, eyeY + size * 0.06, size * 0.04, size * 0.04);
    }
  }

  // -- HAIR --
  ctx.fillStyle = palette.hair;
  if (isFemale) {
    // Sailor Moon Hair
    // Tiara
    if (direction === "down") {
      ctx.fillStyle = palette.tiara;
      ctx.fillRect(-size * 0.25, bodyY - size * 0.75, size * 0.5, size * 0.05);
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(-size * 0.05, bodyY - size * 0.78, size * 0.1, size * 0.1);
      ctx.fillStyle = palette.hair;
    }
    
    // Front Bangs
    ctx.beginPath();
    ctx.arc(0, bodyY - size * 0.85, size * 0.4, Math.PI, 0);
    ctx.fill();
    
    // Odango (Meatballs)
    ctx.beginPath();
    ctx.arc(-size * 0.35, bodyY - size * 0.9, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.35, bodyY - size * 0.9, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Long Twin-tails
    ctx.beginPath();
    ctx.moveTo(-size * 0.35, bodyY - size * 0.9);
    ctx.quadraticCurveTo(-size * 0.6, bodyY, -size * 0.3, bodyY + size * 0.5);
    ctx.lineTo(-size * 0.1, bodyY - size * 0.7);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(size * 0.35, bodyY - size * 0.9);
    ctx.quadraticCurveTo(size * 0.6, bodyY, size * 0.3, bodyY + size * 0.5);
    ctx.lineTo(size * 0.1, bodyY - size * 0.7);
    ctx.fill();
  } else {
    // Killua Spiky Hair
    ctx.beginPath();
    ctx.moveTo(-headSize / 2 - size * 0.1, bodyY - size * 0.5);
    
    // Left Spikes
    ctx.lineTo(-headSize / 2, bodyY - size * 1.1);
    ctx.lineTo(-size * 0.2, bodyY - size * 0.85);
    
    // Top Spikes
    ctx.lineTo(-size * 0.1, bodyY - size * 1.25);
    ctx.lineTo(size * 0.1, bodyY - size * 0.9);
    ctx.lineTo(size * 0.3, bodyY - size * 1.2);
    
    // Right Spikes
    ctx.lineTo(headSize / 2, bodyY - size * 0.85);
    ctx.lineTo(headSize / 2 + size * 0.1, bodyY - size * 0.5);
    
    // Fill top
    ctx.fill();
    
    // Front Bangs (covering forehead)
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, bodyY - size * 0.85);
    ctx.lineTo(-size * 0.15, bodyY - size * 0.65);
    ctx.lineTo(0, bodyY - size * 0.8);
    ctx.lineTo(size * 0.15, bodyY - size * 0.65);
    ctx.lineTo(size * 0.3, bodyY - size * 0.85);
    ctx.fill();
  }

  ctx.restore();
};
