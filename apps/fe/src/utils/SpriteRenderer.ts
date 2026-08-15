export const drawSpriteSheetCharacter = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  image: HTMLImageElement,
  seedId: string,
  size: number,
  walkCycle: number,
  direction: string
) => {
  if (!image) return;

  const parts = seedId.split(":");
  const id = parts.length > 1 ? parts[1] : "male_1";
  
  // Calculate a unique hue shift for each character variation
  let hueShift = 0;
  if (id.includes("_2")) hueShift = 60;
  if (id.includes("_3")) hueShift = 120;
  if (id.includes("_4")) hueShift = 180;
  if (id.includes("_5")) hueShift = 240;

  // Assuming a 4x4 or 3x4 grid typical for RPG maker. 
  // We'll estimate the grid size dynamically based on the image's aspect ratio
  // Standard RPG Maker sheets are 3 columns, 4 rows
  const cols = 5; // The AI generated a 5-column sheet based on the output
  const rows = 4;
  
  const frameWidth = image.width / cols;
  const frameHeight = image.height / rows;

  // Determine row based on direction
  let row = 0;
  if (direction === 'down') row = 0;
  else if (direction === 'left') row = 1;
  else if (direction === 'right') row = 2;
  else if (direction === 'up') row = 3;

  // Determine column based on walkCycle (0, 1, 2, 3)
  // walkCycle comes in as an increasing number from the render loop.
  // We can convert it to a discrete frame index.
  const speed = 10; // Frames per cycle step
  const frameIndex = Math.floor((walkCycle / speed) % cols);

  const sourceX = frameIndex * frameWidth;
  const sourceY = row * frameHeight;

  ctx.save();
  
  if (hueShift > 0) {
    ctx.filter = `hue-rotate(${hueShift}deg)`;
  }

  // To avoid stretching, we maintain aspect ratio of the frame
  const scale = size / Math.max(frameWidth, frameHeight) * 1.5;
  const drawWidth = frameWidth * scale;
  const drawHeight = frameHeight * scale;

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    frameWidth,
    frameHeight,
    x - drawWidth / 2,
    y - drawHeight / 2 - (drawHeight * 0.2), // Offset slightly up so feet align
    drawWidth,
    drawHeight
  );

  ctx.restore();
};
