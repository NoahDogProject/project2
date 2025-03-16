const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
minimapCanvas.width = 200;
minimapCanvas.height = 200;

// World settings
const GRID_SIZE = 300; // Space between dogs
const WORLD_SIZE = 6000; // "Infinite" space
let cameraX = 0;
let cameraY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// Dogs array (initially empty)
let dogs = [];

// Handle image upload
document.getElementById('dog-upload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      // Add the uploaded dog to the grid
      const dog = {
        x: cameraX + canvas.width / 2, // Place near the center of the view
        y: cameraY + canvas.height / 2,
        img: img,
        scale: 0.5,
        isJumping: false,
        angle: 0, // For spin effect
        spin: 0, // For spin effect
        speedX: (Math.random() - 0.5) * 2, // Random movement
        speedY: (Math.random() - 0.5) * 2,
      };
      dogs.push(dog); // Add to the dogs array
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
    cameraX = Math.max(-WORLD_SIZE / 2 + canvas.width / 2, Math.min(WORLD_SIZE / 2 - canvas.width / 2, cameraX));
    cameraY = Math.max(-WORLD_SIZE / 2 + canvas.height / 2, Math.min(WORLD_SIZE / 2 - canvas.height / 2, cameraY));
  }
});

canvas.addEventListener('mouseup', () => isDragging = false);

// Click to make dog jump and spin
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left + cameraX;
  const mouseY = e.clientY - rect.top + cameraY;

  dogs.forEach(dog => {
    const dist = Math.sqrt((mouseX - dog.x) ** 2 + (mouseY - dog.y) ** 2);
    if (dist < 50) { // Click radius
      dog.isJumping = true;
      dog.spin = 2; // Add spin effect
      setTimeout(() => dog.isJumping = false, 500); // Reset jump after 0.5s
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
  ctx.lineTo(20, -10); // Tail shape
  ctx.lineTo(20, 10);
  ctx.closePath();
  ctx.fillStyle = 'brown';
  ctx.fill();
  ctx.restore();
}

// Main loop
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw dogs
  dogs.forEach(dog => {
    if (!dog.img) return; // Skip if no image is loaded

    // Update position with random movement
    dog.x += dog.speedX;
    dog.y += dog.speedY;

    // Bounce off walls
    if (dog.x < -WORLD_SIZE / 2 || dog.x > WORLD_SIZE / 2) dog.speedX *= -1;
    if (dog.y < -WORLD_SIZE / 2 || dog.y > WORLD_SIZE / 2) dog.speedY *= -1;

    // Apply spin effect
    if (dog.spin) {
      dog.angle += dog.spin;
      dog.spin *= 0.9; // Slow down spin over time
      if (Math.abs(dog.spin) < 0.1) dog.spin = 0; // Stop spinning
    }

    const screenX = dog.x - cameraX;
    const screenY = dog.y - cameraY;

    // Only draw dogs near the camera
    if (
      screenX > -100 && screenX < canvas.width + 100 &&
      screenY > -100 && screenY < canvas.height + 100
    ) {
      ctx.save();
      ctx.translate(screenX, screenY);

      // Wiggle effect
      const wiggleAngle = Math.sin(Date.now() / 200) * 0.2;

      // Jump animation
      if (dog.isJumping) {
        ctx.translate(0, -30 * Math.sin(Date.now() / 100));
      }

      // Draw dog image with wiggle and spin
      ctx.rotate(wiggleAngle + dog.angle);
      ctx.drawImage(dog.img, -50 * dog.scale, -50 * dog.scale, 100 * dog.scale, 100 * dog.scale);
      ctx.restore();

      // Draw wagging tail
      const tailAngle = Math.sin(Date.now() / 150) * 0.5;
      drawTail(ctx, screenX + 40, screenY + 40, tailAngle);
    }
  });

  // Draw minimap
  minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  const scaleFactor = minimapCanvas.width / WORLD_SIZE;
  // Draw all dogs as dots
  dogs.forEach(dog => {
    minimapCtx.fillStyle = '#4CAF50';
    minimapCtx.beginPath();
    minimapCtx.arc(
      (dog.x + WORLD_SIZE / 2) * scaleFactor,
      (dog.y + WORLD_SIZE / 2) * scaleFactor,
      2, 0, Math.PI * 2
    );
    minimapCtx.fill();
  });
  // Draw viewport rectangle
  minimapCtx.strokeStyle = 'white';
  minimapCtx.strokeRect(
    (-cameraX + WORLD_SIZE / 2 - canvas.width / 2) * scaleFactor,
    (-cameraY + WORLD_SIZE / 2 - canvas.height / 2) * scaleFactor,
    canvas.width * scaleFactor,
    canvas.height * scaleFactor
  );

  requestAnimationFrame(update);
}

update();
