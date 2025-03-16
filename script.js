const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
minimapCanvas.width = 200;
minimapCanvas.height = 200;

// World settings
const GRID_SIZE = 300;
const WORLD_SIZE = 6000;
let cameraX = 0;
let cameraY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

let dogs = [];

// Handle image upload
document.getElementById('dog-upload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    const img = new Image();
    img.onerror = () => console.error("Failed to load dog image.");
    img.src = event.target.result;
    img.onload = () => {
      // Place dog at the center of the current view
      const dog = {
        x: cameraX + canvas.width / 2,
        y: cameraY + canvas.height / 2,
        img: img,
        scale: 0.5,
        isJumping: false,
        angle: 0,
        spin: 0,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
      };
      dogs.push(dog);
      console.log("Dog added to:", dog.x, dog.y); // Debug log
    };
  };
  reader.readAsDataURL(file);
});

// Drag to scroll
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStartX = e.clientX - cameraX;
  dragStartY = e.clientY - cameraY;
});

canvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    cameraX = e.clientX - dragStartX;
    cameraY = e.clientY - dragStartY;
    // Clamp camera to world bounds
    cameraX = Math.max(-WORLD_SIZE/2 + canvas.width/2, Math.min(WORLD_SIZE/2 - canvas.width/2, cameraX));
    cameraY = Math.max(-WORLD_SIZE/2 + canvas.height/2, Math.min(WORLD_SIZE/2 - canvas.height/2, cameraY));
  }
});

canvas.addEventListener('mouseup', () => isDragging = false);

// Click to make dog jump and spin
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left + cameraX;
  const mouseY = e.clientY - rect.top + cameraY;

  dogs.forEach(dog => {
    const dist = Math.sqrt((mouseX - dog.x)**2 + (mouseY - dog.y)**2);
    if (dist < 50) {
      dog.isJumping = true;
      dog.spin = 2;
      setTimeout(() => dog.isJumping = false, 500);
    }
  });
});

// Draw wagging tail
function drawTail(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(20, -10);
  ctx.lineTo(20, 10);
  ctx.closePath();
  ctx.fillStyle = 'brown';
  ctx.fill();
  ctx.restore();
}

// Animation loop
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  dogs.forEach(dog => {
    if (!dog.img) return;

    // Update position and bounce
    dog.x += dog.speedX;
    dog.y += dog.speedY;
    if (dog.x < -WORLD_SIZE/2 || dog.x > WORLD_SIZE/2) dog.speedX *= -1;
    if (dog.y < -WORLD_SIZE/2 || dog.y > WORLD_SIZE/2) dog.speedY *= -1;

    // Apply spin
    if (dog.spin) {
      dog.angle += dog.spin;
      dog.spin *= 0.9;
      if (Math.abs(dog.spin) < 0.1) dog.spin = 0;
    }

    const screenX = dog.x - cameraX;
    const screenY = dog.y - cameraY;

    // Only draw visible dogs
    if (screenX > -100 && screenX < canvas.width + 100 && screenY > -100 && screenY < canvas.height + 100) {
      ctx.save();
      ctx.translate(screenX, screenY);

      // Wiggle effect
      const wiggleAngle = Math.sin(Date.now() / 200) * 0.2;
      ctx.rotate(wiggleAngle + dog.angle);

      // Jump animation
      if (dog.isJumping) {
        ctx.translate(0, -30 * Math.sin(Date.now() / 100));
      }

      ctx.drawImage(dog.img, -50 * dog.scale, -50 * dog.scale, 100 * dog.scale, 100 * dog.scale);
      ctx.restore();

      // Draw tail
      const tailAngle = Math.sin(Date.now() / 150) * 0.5;
      drawTail(ctx, screenX + 40, screenY + 40, tailAngle);
    }
  });

  // Draw minimap
  minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  const scaleFactor = minimapCanvas.width / WORLD_SIZE;
  dogs.forEach(dog => {
    minimapCtx.fillStyle = '#4CAF50';
    minimapCtx.beginPath();
    minimapCtx.arc(
      (dog.x + WORLD_SIZE/2) * scaleFactor,
      (dog.y + WORLD_SIZE/2) * scaleFactor,
      2, 0, Math.PI * 2
    );
    minimapCtx.fill();
  });
  minimapCtx.strokeStyle = 'white';
  minimapCtx.strokeRect(
    (-cameraX + WORLD_SIZE/2 - canvas.width/2) * scaleFactor,
    (-cameraY + WORLD_SIZE/2 - canvas.height/2) * scaleFactor,
    canvas.width * scaleFactor,
    canvas.height * scaleFactor
  );

  requestAnimationFrame(update);
}

update();
