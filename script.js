const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
minimapCanvas.width = 200;
minimapCanvas.height = 200;

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCDjErhIZZy04f1_ZXj0C6dGQxVvTfTBYI",
  authDomain: "dogblob-c0124.firebaseapp.com",
  databaseURL: "https://dogblob-c0124-default-rtdb.firebaseio.com",
  projectId: "dogblob-c0124",
  storageBucket: "dogblob-c0124.firebasestorage.app",
  messagingSenderId: "495549636725",
  appId: "1:495549636725:web:d2c6d4b906436a7f3ad83c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Sign in with Google
document.getElementById('sign-in-button').addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then((result) => {
    console.log("Signed in as:", result.user.displayName);
  }).catch((error) => {
    console.error("Sign-in error:", error);
  });
});

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    console.log("User signed in:", user.uid);
    document.getElementById('sign-in-button').style.display = 'none';
    document.getElementById('user-profile').style.display = 'block';
    document.getElementById('user-avatar').src = user.photoURL;
    document.getElementById('user-name').textContent = user.displayName;
    document.getElementById('dog-upload').disabled = false;

    // Check if the user already has a dog
    db.collection('users').doc(user.uid).get().then((doc) => {
      if (!doc.exists) {
        // Create a new dog for the user
        createDogForUser(user.uid);
      } else {
        // Load the user's dog
        const dogId = doc.data().dogId;
        db.collection('dogs').doc(dogId).get().then((dogDoc) => {
          if (dogDoc.exists) {
            const dogData = dogDoc.data();
            console.log("Dog loaded:", dogData.name);
            document.getElementById('dog-name-input').value = dogData.name;
            document.getElementById('dog-name-section').style.display = 'block';
          }
        });
      }
    });
  } else {
    // User is signed out
    console.log("User signed out");
    document.getElementById('sign-in-button').style.display = 'block';
    document.getElementById('user-profile').style.display = 'none';
    document.getElementById('dog-upload').disabled = true;
    document.getElementById('dog-name-section').style.display = 'none';
  }
});

// Create a new dog for the user
function createDogForUser(userId) {
  const dog = {
    owner: userId,
    x: 0,
    y: 0,
    name: "Unnamed Dog", // Default name
    imgUrl: "", // Placeholder for dog image
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection('dogs').add(dog).then((docRef) => {
    console.log("Dog created with ID:", docRef.id);
    // Link the dog to the user
    db.collection('users').doc(userId).set({ dogId: docRef.id });
    document.getElementById('dog-name-section').style.display = 'block';
  });
}

// Save dog name
document.getElementById('save-dog-name').addEventListener('click', () => {
  const dogName = document.getElementById('dog-name-input').value;
  if (dogName.trim()) {
    const user = auth.currentUser;
    if (user) {
      db.collection('users').doc(user.uid).get().then((doc) => {
        if (doc.exists) {
          const dogId = doc.data().dogId;
          db.collection('dogs').doc(dogId).update({ name: dogName }).then(() => {
            console.log("Dog name updated:", dogName);
          });
        }
      });
    }
  }
});

// Rest of your game logic (animations, minimap, etc.) goes here
// Multiplayer dogs array
let dogs = [];
const dogsRef = db.collection('dogs');

// World settings
const GRID_SIZE = 300;
const WORLD_SIZE = 6000;
let cameraX = 0;
let cameraY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// Listen for real-time dog updates (initial positions only)
dogsRef.onSnapshot((snapshot) => {
  snapshot.docChanges().forEach(change => {
    const dogData = change.doc.data();
    if (change.type === 'added') {
      const img = new Image();
      img.onload = () => {
        if (!dogs.find(d => d.id === change.doc.id)) {
          dogs.push({
            id: change.doc.id,
            x: dogData.x, // Initial position from Firestore
            y: dogData.y,
            img: img,
            scale: 0.5,
            isJumping: false,
            angle: 0,
            spin: 0,
            speedX: (Math.random() - 0.5) * 2, // Local movement
            speedY: (Math.random() - 0.5) * 2
          });
        }
      };
      img.src = dogData.imgUrl;
    } else if (change.type === 'removed') {
      dogs = dogs.filter(d => d.id !== change.doc.id);
    }
  });
});

// Upload dog to Firebase (store initial position only)
document.getElementById('dog-upload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = async (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = async () => {
      await dogsRef.add({
        x: cameraX + canvas.width / 2, // Initial position
        y: cameraY + canvas.height / 2,
        imgUrl: event.target.result,
        owner: "Anonymous",
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
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
    cameraX = Math.max(-WORLD_SIZE/2 + canvas.width/2, Math.min(WORLD_SIZE/2 - canvas.width/2, cameraX));
    cameraY = Math.max(-WORLD_SIZE/2 + canvas.height/2, Math.min(WORLD_SIZE/2 - canvas.height/2, cameraY));
  }
});

canvas.addEventListener('mouseup', () => isDragging = false);

// Arrow key controls
document.addEventListener('keydown', (e) => {
  const scrollSpeed = 20;
  switch(e.key) {
    case 'ArrowUp': cameraY += scrollSpeed; break;
    case 'ArrowDown': cameraY -= scrollSpeed; break;
    case 'ArrowLeft': cameraX += scrollSpeed; break;
    case 'ArrowRight': cameraX -= scrollSpeed; break;
  }
  cameraX = Math.max(-WORLD_SIZE/2 + canvas.width/2, Math.min(WORLD_SIZE/2 - canvas.width/2, cameraX));
  cameraY = Math.max(-WORLD_SIZE/2 + canvas.height/2, Math.min(WORLD_SIZE/2 - canvas.height/2, cameraY));
});

// Click to make dog jump and spin (local only)
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

    // Update position and bounce (local movement)
    dog.x += dog.speedX;
    dog.y += dog.speedY;
    if (dog.x < -WORLD_SIZE/2 || dog.x > WORLD_SIZE/2) dog.speedX *= -1;
    if (dog.y < -WORLD_SIZE/2 || dog.y > WORLD_SIZE/2) dog.speedY *= -1;

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

  // Draw dogs on minimap
  dogs.forEach(dog => {
    const minimapX = (dog.x + WORLD_SIZE / 2) * scaleFactor;
    const minimapY = (dog.y + WORLD_SIZE / 2) * scaleFactor;
    minimapCtx.fillStyle = '#4CAF50';
    minimapCtx.beginPath();
    minimapCtx.arc(minimapX, minimapY, 2, 0, Math.PI * 2);
    minimapCtx.fill();
  });

  // Draw viewport rectangle
  const viewportX = (cameraX + WORLD_SIZE / 2) * scaleFactor;
  const viewportY = (cameraY + WORLD_SIZE / 2) * scaleFactor;
  const viewportWidth = canvas.width * scaleFactor;
  const viewportHeight = canvas.height * scaleFactor;
  minimapCtx.strokeStyle = 'white';
  minimapCtx.strokeRect(viewportX - viewportWidth / 2, viewportY - viewportHeight / 2, viewportWidth, viewportHeight);

  requestAnimationFrame(update);
}

update();
