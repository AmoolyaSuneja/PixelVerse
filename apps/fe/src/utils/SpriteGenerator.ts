export const generateProceduralDataURL = (seedId: string): string => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  drawProceduralCharacter(ctx, 64, 64, seedId, 64, 0, 'down');
  
  return canvas.toDataURL("image/png");
};

// Helper for drawing rounded rectangles safely across all TS versions
const drawRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
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
  const id = parts.length > 1 ? parts[1] : "red";
  
  // Define vibrant palettes based on distinct colors
  const palettes: Record<string, { body: string; shadow: string; visor: string; visorHighlight: string; backpack: string }> = {
    "red": { body: "#C51111", shadow: "#7A0838", visor: "#E5F0F9", visorHighlight: "#90AFC5", backpack: "#8B0000" },
    "blue": { body: "#132ED1", shadow: "#09158E", visor: "#E5F0F9", visorHighlight: "#90AFC5", backpack: "#0000D3" },
    "yellow": { body: "#F5F557", shadow: "#C38822", visor: "#E5F0F9", visorHighlight: "#90AFC5", backpack: "#C3C300" },
    "orange": { body: "#F07D0D", shadow: "#B33E15", visor: "#E5F0F9", visorHighlight: "#90AFC5", backpack: "#B35A00" },
    "green": { body: "#117F2D", shadow: "#0A4D2E", visor: "#E5F0F9", visorHighlight: "#90AFC5", backpack: "#005900" },
    "cyan": { body: "#38FEDC", shadow: "#24A8BE", visor: "#E5F0F9", visorHighlight: "#90AFC5", backpack: "#00A8A8" },
    "purple": { body: "#6B2FBB", shadow: "#3B177C", visor: "#E5F0F9", visorHighlight: "#90AFC5", backpack: "#4B0082" },
    "pink": { body: "#ED54BA", shadow: "#AB2BAD", visor: "#E5F0F9", visorHighlight: "#90AFC5", backpack: "#D12A9E" },
  };

  const palette = palettes[id] || palettes["red"];
  
  ctx.save();
  ctx.translate(x, y);

  // If moving left, flip the canvas horizontally
  if (direction === "left") {
    ctx.scale(-1, 1);
  }

  // Fluid waddling animation mechanics (only legs move, body bobs slightly)
  const isMoving = walkCycle > 0;
  const speed = 1.0; 
  const bob = isMoving ? Math.abs(Math.sin(walkCycle * speed)) * (size * 0.05) : 0;
  
  // Waddle offset for stubby legs
  const legOffset = isMoving ? Math.sin(walkCycle * speed) * (size * 0.1) : 0;
  
  const bodyY = -bob;

  // Thick brutalist outlines
  const outline = size * 0.12;

  ctx.lineWidth = outline;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Dimensions
  const bodyWidth = size * 0.65;
  const bodyHeight = size * 0.8;
  const legWidth = size * 0.25;
  const legHeight = size * 0.3;
  
  // Draw Backpack (if not facing completely forward or backward)
  if (direction !== "up") {
    ctx.fillStyle = palette.body;
    ctx.strokeStyle = "#000000";
    if (direction === "right" || direction === "left") {
      drawRoundRect(ctx, -bodyWidth / 2 - size * 0.2, bodyY - bodyHeight / 2 + size * 0.15, size * 0.3, bodyHeight * 0.6, size * 0.1);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Draw Legs (Stubby and simple)
  ctx.fillStyle = palette.body;
  ctx.strokeStyle = "#000000";

  // Left Leg
  drawRoundRect(ctx, -bodyWidth / 2 + size * 0.05, bodyY + bodyHeight / 3 - legOffset, legWidth, legHeight, legWidth / 2);
  ctx.fill();
  ctx.stroke();

  // Right Leg
  drawRoundRect(ctx, bodyWidth / 2 - legWidth - size * 0.05, bodyY + bodyHeight / 3 + legOffset, legWidth, legHeight, legWidth / 2);
  ctx.fill();
  ctx.stroke();

  // Draw Main Body (Bean shape)
  ctx.fillStyle = palette.body;
  ctx.strokeStyle = "#000000";
  drawRoundRect(ctx, -bodyWidth / 2, bodyY - bodyHeight / 2, bodyWidth, bodyHeight, bodyWidth / 2);
  ctx.fill();
  ctx.stroke();

  // Draw Visor (Goggles)
  if (direction !== "up") {
    const visorWidth = direction === "down" ? size * 0.5 : size * 0.45;
    const visorHeight = size * 0.3;
    const visorX = direction === "down" ? -visorWidth / 2 : -size * 0.05;
    const visorY = bodyY - size * 0.25;

    // Visor base (thick black outline)
    ctx.fillStyle = palette.visorHighlight;
    ctx.strokeStyle = "#000000";
    drawRoundRect(ctx, visorX, visorY, visorWidth, visorHeight, visorHeight / 2);
    ctx.fill();
    ctx.stroke();
    
    // Visor reflection
    ctx.fillStyle = palette.visor;
    drawRoundRect(ctx, visorX + size * 0.08, visorY + size * 0.08, visorWidth * 0.7, visorHeight * 0.5, visorHeight / 3);
    ctx.fill();
  }

  ctx.restore();
};
