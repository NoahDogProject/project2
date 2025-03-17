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
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Sign in with Google
document.getElementById('sign-in-button').addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      console.log("Signed in as:", result.user.displayName);
    })
    .catch((error) => {
      console.error("Sign-in error:", error.message);
      alert("Sign-in failed: " + error.message);
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
            document.getElementById('dog-color').value = dogData.color || "#ffcc00";
            document.getElementById('dog-accessory').value = dogData.accessory || "none";
            document.getElementById('dog-name-section').style.display = 'block';
            document.getElementById('dog-customization-section').style.display = 'block';
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
    document.getElementById('dog-customization-section').style.display = 'none';
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
    color: "#ffcc00", // Default color
    accessory: "none", // Default accessory
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection('dogs').add(dog).then((docRef) => {
    console.log("Dog created with ID:", docRef.id);
    // Link the dog to the user
    db.collection('users').doc(userId).set({ dogId: docRef.id });
    document.getElementById('dog-name-section').style.display = 'block';
    document.getElementById('dog-customization-section').style.display = 'block';
  });
}

// Save dog name
document.getElementById('save-dog-name').addEventListener('click', () => {
  const dogName = document.getElementById('dog-name-input').value.trim();
  if (dogName.length < 2 || dogName.length > 20) {
    alert("Dog name must be between 2 and 20 characters.");
    return;
  }

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
});

// Save dog customization
document.getElementById('save-dog-customization').addEventListener('click', () => {
  const dogColor = document.getElementById('dog-color').value;
  const dogAccessory = document.getElementById('dog-accessory').value;
  const user = auth.currentUser;

  if (user) {
    db.collection('users').doc(user.uid).get().then((doc) => {
      if (doc.exists) {
        const dogId = doc.data().dogId;
        db.collection('dogs').doc(dogId).update({
          color: dogColor,
          accessory: dogAccessory
        }).then(() => {
          console.log("Dog customization updated!");
        });
      }
    });
  }
});

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

// Listen for real-time dog updates
dogsRef.onSnapshot((snapshot) => {
  snapshot.docChanges().forEach(change => {
    const dogData = change.doc.data();
    if (change.type === 'added') {
      const img = new Image();
      img.onload = () => {
        if (!dogs.find(d => d.id === change.doc.id)) {
          dogs.push({
            id: change.doc.id,
            x: dogData.x,
            y: dogData.y,
            img: img,
            color: dogData.color || "#ffcc00",
            accessory: dogData.accessory || "none",
            scale: 0.5,
            isJumping: false,
            angle: 0,
            spin: 0,
            speedX: (Math.random() - 0.5) * 2,
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

// Upload dog to Firebase
document.getElementById('dog-upload').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadstart = () => {
    document.getElementById('dog-upload').disabled = true;
    document.getElementById('dog-upload').style.opacity = '0.5';
    document.getElementById('loading-message').style.display = 'block';
  };

  reader.onload = async (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = async () => {
      try {
        await dogsRef.add({
          x: cameraX + canvas.width / 2,
          y: cameraY + canvas.height / 2,
          imgUrl: event.target.result,
          owner: "Anonymous",
          color: "#ffcc00",
          accessory: "none",
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload dog image. Please try again.");
      } finally {
        document.getElementById('dog-upload').disabled = false;
        document.getElementById('dog-upload').style.opacity = '1';
        document.getElementById('loading-message').style.display = 'none';
      }
    };
  };
  reader.readAsDataURL(file);
});

// Animation loop
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  dogs.forEach(dog => {
    if (!dog.img) return;

    const screenX = dog.x - cameraX;
    const screenY = dog.y - cameraY;

    // Only draw visible dogs
    if (screenX > -100 && screenX < canvas.width + 100 && screenY > -100 && screenY < canvas.height + 100) {
      ctx.save();
      ctx.translate(screenX, screenY);

      // Draw dog body with custom color
      ctx.fillStyle = dog.color;
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2); // Draw a circle as the dog's body
      ctx.fill();

      // Draw accessory
      if (dog.accessory && dog.accessory !== "none") {
        const accessoryImg = new Image();
        accessoryImg.src = `${dog.accessory}.png`; // Load accessory image
        ctx.drawImage(accessoryImg, -25, -50, 50, 50); // Draw accessory on top of the dog
      }

      ctx.restore();
    }
  });

  requestAnimationFrame(update);
}

update();
