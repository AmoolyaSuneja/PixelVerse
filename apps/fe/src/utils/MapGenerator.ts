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

  // Helper to get pseudo-random deterministic positions based on index
  const getPos = (i: number, maxW: number, maxH: number) => {
    const x = Math.abs(Math.sin(i * 1234.56)) * maxW;
    const y = Math.abs(Math.cos(i * 7890.12)) * maxH;
    return { x, y };
  };

  const drawProp = (type: string, x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000";
    ctx.lineJoin = "round";
    
    switch (type) {
      case "desk":
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(-30, -10, 60, 20);
        ctx.strokeRect(-30, -10, 60, 20);
        ctx.fillStyle = "#A9A9A9";
        ctx.fillRect(-15, -25, 30, 15);
        ctx.strokeRect(-15, -25, 30, 15);
        ctx.fillStyle = "#1E90FF";
        ctx.fillRect(-12, -22, 24, 9);
        break;
      
      case "asteroid":
        ctx.fillStyle = "#696969";
        ctx.beginPath();
        ctx.moveTo(-20, -10); ctx.lineTo(-10, -25); ctx.lineTo(15, -20);
        ctx.lineTo(25, 0); ctx.lineTo(10, 20); ctx.lineTo(-15, 15);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;

      case "coral":
        ctx.fillStyle = "#FF7F50";
        ctx.beginPath();
        ctx.moveTo(0, 20); ctx.lineTo(-10, 0); ctx.lineTo(-20, -10);
        ctx.lineTo(-5, -5); ctx.lineTo(0, -20); ctx.lineTo(5, -5);
        ctx.lineTo(20, -10); ctx.lineTo(10, 0); ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;

      case "volcano":
        ctx.fillStyle = "#2D0A00";
        ctx.beginPath();
        ctx.moveTo(-40, 30); ctx.lineTo(-15, -10);
        ctx.lineTo(15, -10); ctx.lineTo(40, 30);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#FF4500";
        ctx.beginPath();
        ctx.moveTo(-15, -10); ctx.lineTo(-5, 0); ctx.lineTo(5, -15);
        ctx.lineTo(15, -10); ctx.lineTo(0, -5);
        ctx.fill();
        break;

      case "server":
        ctx.fillStyle = "#1A1A1A";
        ctx.fillRect(-15, -40, 30, 80);
        ctx.strokeRect(-15, -40, 30, 80);
        ctx.fillStyle = "#00FF00";
        ctx.fillRect(-5, -30, 10, 5);
        ctx.fillRect(-5, -10, 10, 5);
        ctx.fillRect(-5, 10, 10, 5);
        break;

      case "tree":
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(-5, 10, 10, 20);
        ctx.strokeRect(-5, 10, 10, 20);
        ctx.fillStyle = "#228B22";
        ctx.beginPath();
        ctx.moveTo(-25, 10); ctx.lineTo(0, -30); ctx.lineTo(25, 10);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;

      case "snowman":
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath(); ctx.arc(0, 15, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -10, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#FFA500";
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(15, -5); ctx.lineTo(0, 0); ctx.fill(); ctx.stroke();
        break;

      case "cactus":
        ctx.fillStyle = "#2E8B57";
        ctx.fillRect(-8, -30, 16, 60);
        ctx.strokeRect(-8, -30, 16, 60);
        ctx.fillRect(-20, -10, 12, 12);
        ctx.strokeRect(-20, -10, 12, 12);
        ctx.fillRect(8, -20, 12, 12);
        ctx.strokeRect(8, -20, 12, 12);
        break;

      case "pillar":
        ctx.fillStyle = "#F5F5DC";
        ctx.fillRect(-15, -40, 30, 80);
        ctx.strokeRect(-15, -40, 30, 80);
        ctx.fillRect(-20, -45, 40, 10);
        ctx.strokeRect(-20, -45, 40, 10);
        ctx.fillRect(-20, 35, 40, 10);
        ctx.strokeRect(-20, 35, 40, 10);
        ctx.beginPath(); ctx.moveTo(-5, -35); ctx.lineTo(-5, 35); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(5, -35); ctx.lineTo(5, 35); ctx.stroke();
        break;

      case "neon_sign":
        ctx.fillStyle = "#000000";
        ctx.fillRect(-25, -15, 50, 30);
        ctx.strokeStyle = "#FF00FF";
        ctx.strokeRect(-25, -15, 50, 30);
        ctx.fillStyle = "#00FFFF";
        ctx.font = "900 12px sans-serif";
        ctx.fillText("NEON", -16, 4);
        break;
    }
    ctx.restore();
  };

  switch (vibe) {
    case "space": {
      ctx.fillStyle = "#0A0A1A";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#FFFFFF";
      for (let i = 0; i < 200; i++) {
        const { x, y } = getPos(i, width, height);
        const size = (Math.sin(i * 321) * 0.5 + 0.5) * 2 + 1;
        const twinkle = Math.sin(timestamp * 0.002 + i) * 0.5 + 0.5;
        ctx.globalAlpha = twinkle;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      
      for (let i = 0; i < 15; i++) {
        const { x, y } = getPos(i + 1000, width, height);
        drawProp("asteroid", x, y);
      }
      break;
    }
    
    case "ocean": {
      ctx.fillStyle = "#001E36";
      ctx.fillRect(0, 0, width, height);
      
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 50; i++) {
        const { x } = getPos(i, width, height);
        const speed = (Math.cos(i * 200) * 0.5 + 0.5) * 50 + 20;
        const yOffset = (timestamp * speed) / 1000;
        const y = height - ((yOffset + i * 50) % height);
        const wobble = Math.sin(timestamp * 0.002 + i) * 10;
        const size = (Math.sin(i * 50) * 0.5 + 0.5) * 6 + 2;
        ctx.beginPath(); ctx.arc(x + wobble, y, size, 0, Math.PI * 2); ctx.stroke();
      }

      for (let i = 0; i < 20; i++) {
        const { x, y } = getPos(i + 2000, width, height);
        drawProp("coral", x, y);
      }
      break;
    }

    case "lava": {
      ctx.fillStyle = "#2D0A00";
      ctx.fillRect(0, 0, width, height);
      
      for (let i = 0; i < 20; i++) {
        const pulse = Math.sin(timestamp * 0.001 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, ${50 + pulse * 100}, 0, ${0.3 + pulse * 0.3})`;
        const { x, y } = getPos(i, width, height);
        const radius = (Math.sin(i * 99) * 0.5 + 0.5) * 100 + 50;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const r = radius + Math.sin(a * 3 + timestamp * 0.002 + i) * 20;
          ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        }
        ctx.fill();
      }

      for (let i = 0; i < 15; i++) {
        const { x, y } = getPos(i + 3000, width, height);
        drawProp("volcano", x, y);
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
        const char = String.fromCharCode(0x30A0 + Math.floor(Math.sin(timestamp * 0.01 + i) * 0.5 + 0.5) * 96);
        ctx.fillText(char, i * 30, y);
      }
      ctx.globalAlpha = 1;

      for (let i = 0; i < 25; i++) {
        const { x, y } = getPos(i + 4000, width, height);
        drawProp("server", x, y);
      }
      break;
    }

    case "forest": {
      ctx.fillStyle = "#1A401A";
      ctx.fillRect(0, 0, width, height);
      
      for (let i = 0; i < 40; i++) {
        const { x, y } = getPos(i + 5000, width, height);
        drawProp("tree", x, y);
      }

      ctx.fillStyle = "#32CD32";
      for (let i = 0; i < 40; i++) {
        const speedY = (Math.sin(i * 100) * 0.5 + 0.5) * 50 + 20;
        const speedX = (Math.cos(i * 200) * 0.5 + 0.5) * 30 + 10;
        const offset = timestamp / 1000;
        const y = (Math.sin(i * 30) * height + offset * speedY) % height;
        const x = (Math.cos(i * 40) * width + offset * speedX) % width;
        ctx.save(); ctx.translate(x, y);
        ctx.rotate(timestamp * 0.001 * (i % 2 === 0 ? 1 : -1));
        ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      break;
    }

    case "snow": {
      ctx.fillStyle = "#E0FFFF";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 20; i++) {
        const { x, y } = getPos(i + 6000, width, height);
        drawProp("snowman", x, y);
      }
      
      ctx.fillStyle = "#FFFFFF";
      for (let i = 0; i < 100; i++) {
        const speed = (Math.sin(i * 100) * 0.5 + 0.5) * 100 + 50;
        const yOffset = (timestamp * speed) / 1000;
        const y = (Math.sin(i * 20) * height + yOffset) % height;
        const x = (Math.cos(i * 30) * width + Math.sin(timestamp * 0.001 + i) * 20) % width;
        const size = (Math.sin(i * 40) * 0.5 + 0.5) * 3 + 1;
        ctx.beginPath(); ctx.arc(Math.abs(x), Math.abs(y), size, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }

    case "desert": {
      ctx.fillStyle = "#EDC9AF";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 30; i++) {
        const { x, y } = getPos(i + 7000, width, height);
        drawProp("cactus", x, y);
      }
      
      ctx.fillStyle = "rgba(139, 69, 19, 0.4)";
      for (let i = 0; i < 50; i++) {
        const speed = (Math.sin(i * 10) * 0.5 + 0.5) * 200 + 100;
        const offset = (timestamp * speed) / 1000;
        const x = (Math.cos(i * 20) * width + offset) % width;
        const y = (Math.sin(i * 30) * height) % height;
        ctx.beginPath(); ctx.arc(Math.abs(x), Math.abs(y), 2, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }

    case "clouds": {
      ctx.fillStyle = "#87CEEB";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 15; i++) {
        const { x, y } = getPos(i + 8000, width, height);
        drawProp("pillar", x, y);
      }
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      for (let i = 0; i < 15; i++) {
        const speed = (Math.sin(i * 15) * 0.5 + 0.5) * 50 + 20;
        const offset = (timestamp * speed) / 1000;
        const x = (Math.cos(i * 25) * width + offset) % width;
        const y = (Math.sin(i * 35) * height) % height;
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

      for (let i = 0; i < 20; i++) {
        const { x, y } = getPos(i + 9000, width, height);
        drawProp("neon_sign", x, y);
      }
      
      ctx.strokeStyle = "#00FFFF";
      const speed = 200;
      const offset = (timestamp * speed) / 1000;
      for (let i = 0; i < 5; i++) {
        const y = (offset + i * 200) % height;
        if (y > height / 2) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
      }
      break;
    }

    case "grid":
    default: {
      ctx.fillStyle = "#FDFBF7";
      ctx.fillRect(0, 0, width, height);
      
      ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y <= height; y += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      for (let i = 0; i < 30; i++) {
        const { x, y } = getPos(i + 10000, width, height);
        drawProp("desk", x, y);
      }
      break;
    }
  }
};
