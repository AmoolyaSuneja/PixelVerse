export const drawBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  vibe: string,
  timestamp: number
) => {
  // Clear the canvas
  ctx.clearRect(0, 0, width, height);
  const GRID_SIZE = 50;

  switch (vibe) {
    case "space": {
      ctx.fillStyle = "#0A0A1A";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#FFFFFF";
      for (let i = 0; i < 200; i++) {
        // Pseudo-random based on index so they stay in place, but twinkle based on timestamp
        const x = (Math.sin(i * 100) * 0.5 + 0.5) * width;
        const y = (Math.cos(i * 123) * 0.5 + 0.5) * height;
        const size = (Math.sin(i * 321) * 0.5 + 0.5) * 2 + 1;
        const twinkle = Math.sin(timestamp * 0.002 + i) * 0.5 + 0.5;
        
        ctx.globalAlpha = twinkle;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    
    case "ocean": {
      ctx.fillStyle = "#001E36";
      ctx.fillRect(0, 0, width, height);
      
      // Draw grid slightly visible
      ctx.strokeStyle = "rgba(0, 150, 255, 0.2)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y <= height; y += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Bubbles
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 50; i++) {
        const startX = (Math.sin(i * 100) * 0.5 + 0.5) * width;
        const speed = (Math.cos(i * 200) * 0.5 + 0.5) * 50 + 20; // pixels per second
        const yOffset = (timestamp * speed) / 1000;
        const y = height - ((yOffset + i * 50) % height);
        const wobble = Math.sin(timestamp * 0.002 + i) * 10;
        const size = (Math.sin(i * 50) * 0.5 + 0.5) * 6 + 2;

        ctx.beginPath();
        ctx.arc(startX + wobble, y, size, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case "lava": {
      ctx.fillStyle = "#2D0A00";
      ctx.fillRect(0, 0, width, height);
      
      // Magma cracks
      for (let i = 0; i < 20; i++) {
        const pulse = Math.sin(timestamp * 0.001 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, ${50 + pulse * 100}, 0, ${0.3 + pulse * 0.3})`;
        
        const cx = (Math.sin(i * 77) * 0.5 + 0.5) * width;
        const cy = (Math.cos(i * 88) * 0.5 + 0.5) * height;
        const radius = (Math.sin(i * 99) * 0.5 + 0.5) * 100 + 50;
        
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const r = radius + Math.sin(a * 3 + timestamp * 0.002 + i) * 20;
          ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        ctx.fill();
      }
      
      // Grid
      ctx.strokeStyle = "rgba(255, 100, 0, 0.2)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y <= height; y += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      break;
    }

    case "matrix": {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = "#00FF00";
      ctx.font = "16px monospace";
      for (let i = 0; i < width / 30; i++) {
        const speed = (Math.sin(i * 100) * 0.5 + 0.5) * 200 + 50;
        const offset = (timestamp * speed) / 1000;
        const y = (offset + Math.sin(i * 50) * height) % height;
        
        ctx.globalAlpha = 1 - (y / height);
        // Random characters
        const char = String.fromCharCode(0x30A0 + Math.floor(Math.sin(timestamp * 0.01 + i) * 0.5 + 0.5) * 96);
        ctx.fillText(char, i * 30, y);
      }
      ctx.globalAlpha = 1;
      break;
    }

    case "forest": {
      ctx.fillStyle = "#1A401A";
      ctx.fillRect(0, 0, width, height);
      
      // Grid
      ctx.strokeStyle = "rgba(0, 255, 0, 0.1)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y <= height; y += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      
      // Leaves falling
      ctx.fillStyle = "#32CD32";
      for (let i = 0; i < 40; i++) {
        const speedY = (Math.sin(i * 100) * 0.5 + 0.5) * 50 + 20;
        const speedX = (Math.cos(i * 200) * 0.5 + 0.5) * 30 + 10;
        const offset = timestamp / 1000;
        const y = (Math.sin(i * 30) * height + offset * speedY) % height;
        const x = (Math.cos(i * 40) * width + offset * speedX) % width;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(timestamp * 0.001 * (i % 2 === 0 ? 1 : -1));
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }

    case "snow": {
      ctx.fillStyle = "#E0FFFF";
      ctx.fillRect(0, 0, width, height);
      
      // Grid
      ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y <= height; y += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      ctx.fillStyle = "#FFFFFF";
      for (let i = 0; i < 100; i++) {
        const speed = (Math.sin(i * 100) * 0.5 + 0.5) * 100 + 50;
        const yOffset = (timestamp * speed) / 1000;
        const y = (Math.sin(i * 20) * height + yOffset) % height;
        const x = (Math.cos(i * 30) * width + Math.sin(timestamp * 0.001 + i) * 20) % width;
        const size = (Math.sin(i * 40) * 0.5 + 0.5) * 3 + 1;
        
        ctx.beginPath();
        ctx.arc(Math.abs(x), Math.abs(y), size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case "desert": {
      ctx.fillStyle = "#EDC9AF";
      ctx.fillRect(0, 0, width, height);
      
      // Heat waves
      ctx.fillStyle = "rgba(255, 140, 0, 0.1)";
      for (let i = 0; i < 5; i++) {
        const yOffset = Math.sin(timestamp * 0.002 + i) * 20;
        ctx.fillRect(0, i * 200 + yOffset, width, 100);
      }

      // Dust
      ctx.fillStyle = "rgba(139, 69, 19, 0.4)";
      for (let i = 0; i < 50; i++) {
        const speed = (Math.sin(i * 10) * 0.5 + 0.5) * 200 + 100;
        const offset = (timestamp * speed) / 1000;
        const x = (Math.cos(i * 20) * width + offset) % width;
        const y = (Math.sin(i * 30) * height) % height;
        
        ctx.beginPath();
        ctx.arc(Math.abs(x), Math.abs(y), 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case "clouds": {
      ctx.fillStyle = "#87CEEB";
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      for (let i = 0; i < 15; i++) {
        const speed = (Math.sin(i * 15) * 0.5 + 0.5) * 50 + 20;
        const offset = (timestamp * speed) / 1000;
        const x = (Math.cos(i * 25) * width + offset) % width;
        const y = (Math.sin(i * 35) * height) % height;
        
        // Simple cloud shape
        ctx.beginPath();
        ctx.arc(Math.abs(x), Math.abs(y), 40, 0, Math.PI * 2);
        ctx.arc(Math.abs(x) + 30, Math.abs(y) - 20, 50, 0, Math.PI * 2);
        ctx.arc(Math.abs(x) + 70, Math.abs(y), 40, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case "cyberpunk": {
      ctx.fillStyle = "#0A001F";
      ctx.fillRect(0, 0, width, height);
      
      // Perspective lines
      ctx.strokeStyle = "#FF00FF";
      ctx.lineWidth = 2;
      for (let i = 0; i < width; i += 100) {
        ctx.beginPath();
        ctx.moveTo(width / 2, height / 2);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      
      // Horizontal moving lines
      ctx.strokeStyle = "#00FFFF";
      const speed = 200;
      const offset = (timestamp * speed) / 1000;
      for (let i = 0; i < 5; i++) {
        const y = (offset + i * 200) % height;
        if (y > height / 2) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }
      break;
    }

    case "grid":
    default: {
      ctx.fillStyle = "#FDFBF7";
      ctx.fillRect(0, 0, width, height);
      
      // Draw Grid
      ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      break;
    }
  }
};
