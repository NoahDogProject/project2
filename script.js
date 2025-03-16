const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let dogs = [];
let cameraX = 0; // Camera's X offset
let cameraY = 0; // Camera's Y offset
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// Handle image upload (dogs spawn near the camera's current view)
document.getElementById('dog-upload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      dogs.push({
        img: img,
        x: cameraX + canvas.width/2 + (Math.random() - 0.5) * 200, // Center of view
        y: cameraY + canvas.height/2 + (Math.random() - 0.5) * 200,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        angle: 0,
        spin: 0,
      });
    };
  };
  reader.readAsDataURL(file);
});

// Mouse drag to scroll (like Mii Channel)
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStartX = e.clientX - cameraX;
  dragStartY = e.clientY - cameraY;
});

canvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    cameraX = e.clientX - dragStartX;
    cameraY = e.clientY - dragStartY;
  }
});

canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

// Arrow keys to scroll
document.addEventListener('keydown', (e) => {
  const scrollSpeed = 20;
  switch(e.key) {
    case 'ArrowUp': cameraY += scrollSpeed; break;
    case 'ArrowDown': cameraY -= scrollSpeed; break;
    case 'ArrowLeft': cameraX += scrollSpeed; break;
    case 'ArrowRight': cameraX -= scrollSpeed; break;
  }
});

// Draw wagging tail (same as before)
function drawTail(ctx, x, y, angle) { /* ... */ }

// Click to "boop" dogs (same as before)
canvas.addEventListener('click', function(event) { /* ... */ });

// Animation loop
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  dogs.forEach(dog => {
    dog.x += dog.speedX;
    dog.y += dog.speedY;

    // Optional: Bounce off "infinite" boundaries (adjust as needed)
    // if (dog.x < -1000 || dog.x > 1000) dog.speedX *= -1;
    // if (dog.y < -1000 || dog.y > 1000) dog.speedY *= -1;

    // Apply spin
    if (dog.spin) { /* ... */ }

    // Draw dog relative to camera
    ctx.save();
    ctx.translate(dog.x - cameraX + 50, dog.y - cameraY + 50); // Offset by camera
    ctx.rotate(wiggleAngle + dog.angle);
    ctx.drawImage(dog.img, -50, -50, 100, 100);
    ctx.restore();

    // Draw tail relative to camera
    const tailAngle = Math.sin(Date.now() / 150) * 0.5;
    drawTail(ctx, dog.x - cameraX + 80, dog.y - cameraY + 40, tailAngle);
  });

  requestAnimationFrame(update);
}

update();
