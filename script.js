const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
minimapCanvas.width = 200;
minimapCanvas.height = 200;

// World settings (like Mii Channel's grid)
const GRID_SIZE = 300; // Space between dogs
const WORLD_SIZE = 6000; // "Infinite" space (adjust as needed)
let cameraX = 0;
let cameraY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// Dogs are placed in a grid
let dogs = [];
for (let x = -WORLD_SIZE/2; x < WORLD_SIZE/2; x += GRID_SIZE) {
  for (let y = -WORLD_SIZE/2; y < WORLD_SIZE/2; y += GRID_SIZE) {
    dogs.push({
      x: x,
      y: y,
      img: null, // Loaded after upload
      scale: 0.5, // Mii-style scaling
      isJumping: false
    });
  }
}

// Load a dog image into ALL grid slots (for testing)
document.getElementById('dog-upload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      dogs.forEach(dog => dog.img = img); // Assign to all dogs
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

// Click to make dog jump (Mii-style)
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left + cameraX;
  const mouseY = e.clientY - rect.top + cameraY;

  dogs.forEach(dog => {
    const dist = Math.sqrt((mouseX - dog.x)**2 + (mouseY - dog.y)**2);
    if (dist < 50) { // Click radius
      dog.isJumping = true;
      setTimeout(() => dog.isJumping = false, 500);
    }
  });
});

// Main loop
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw dogs
  dogs.forEach(dog => {
    if (!dog.img) return;

    const screenX = dog.x - cameraX;
    const screenY = dog.y - cameraY;

    // Only draw dogs near the camera
    if (
      screenX > -100 && screenX < canvas.width + 100 &&
      screenY > -100 && screenY < canvas.height + 100
    ) {
      ctx.save();
      ctx.translate(screenX, screenY);
      // Jump animation
      if (dog.isJumping) {
        ctx.translate(0, -30 * Math.sin(Date.now() / 100));
      }
      ctx.drawImage(dog.img, -50 * dog.scale, -50 * dog.scale, 100 * dog.scale, 100 * dog.scale);
      ctx.restore();
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
      (dog.x + WORLD_SIZE/2) * scaleFactor,
      (dog.y + WORLD_SIZE/2) * scaleFactor,
      2, 0, Math.PI * 2
    );
    minimapCtx.fill();
  });
  // Draw viewport rectangle
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
