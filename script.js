const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let dogs = []; // Array to store dog images

// Handle image upload
document.getElementById('dog-upload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      dogs.push({
        img: img,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        angle: 0, // For spin effect
        spin: 0, // For spin effect
      });
    };
  };
  reader.readAsDataURL(file);
});

// Draw a wagging tail
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

// Handle click to "boop" dogs
canvas.addEventListener('click', function(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  dogs.forEach(dog => {
    if (mouseX > dog.x && mouseX < dog.x + 100 && mouseY > dog.y && mouseY < dog.y + 100) {
      dog.speedY = -5; // Make the dog jump
      dog.spin = 2; // Add a spin effect
    }
  });
});

// Animation loop
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  dogs.forEach(dog => {
    // Update position
    dog.x += dog.speedX;
    dog.y += dog.speedY;

    // Bounce off walls with dynamic bounce
    if (dog.x < 0 || dog.x > canvas.width) {
      dog.speedX *= -1;
      dog.speedY += (Math.random() - 0.5) * 2; // Add some vertical bounce
    }
    if (dog.y < 0 || dog.y > canvas.height) {
      dog.speedY *= -1;
      dog.speedX += (Math.random() - 0.5) * 2; // Add some horizontal bounce
    }

    // Apply spin effect
    if (dog.spin) {
      dog.angle += dog.spin;
      dog.spin *= 0.9; // Slow down spin over time
      if (Math.abs(dog.spin) < 0.1) dog.spin = 0; // Stop spinning
    }

    // Add wiggle effect
    const wiggleAngle = Math.sin(Date.now() / 200) * 0.2; // Adjust speed/intensity

    // Draw dog image with wiggle and spin
    ctx.save();
    ctx.translate(dog.x + 50, dog.y + 50);
    ctx.rotate(wiggleAngle + dog.angle); // Combine wiggle and spin
    ctx.drawImage(dog.img, -50, -50, 100, 100);
    ctx.restore();

    // Draw wagging tail
    const tailAngle = Math.sin(Date.now() / 150) * 0.5; // Tail wag speed
    drawTail(ctx, dog.x + 80, dog.y + 40, tailAngle); // Adjust tail position
  });

  requestAnimationFrame(update);
}

update();
