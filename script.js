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
        speedY: (Math.random() - 0.5) * 2
      });
    };
  };
  reader.readAsDataURL(file);
});

// Animation loop
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  dogs.forEach(dog => {
    dog.x += dog.speedX;
    dog.y += dog.speedY;
    
    // Bounce off walls
    if (dog.x < 0 || dog.x > canvas.width) dog.speedX *= -1;
    if (dog.y < 0 || dog.y > canvas.height) dog.speedY *= -1;
    
    ctx.drawImage(dog.img, dog.x, dog.y, 100, 100); // Draw dog image
  });
  
  requestAnimationFrame(update);
}
update();