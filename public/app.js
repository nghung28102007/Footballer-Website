// DOM Elements
// Auth elements
const authSection = document.getElementById('auth-section');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

// User profile elements
const avatarContainer = document.getElementById('avatar-container');
const avatarImg = document.getElementById('avatar-img');
const avatarDropdown = document.getElementById('avatar-dropdown');
const userInfo = document.getElementById('user-info');
const viewProfileBtn = document.getElementById('view-profile-btn');
const editProfileBtn = document.getElementById('edit-profile-btn');
const changeAvatarBtn = document.getElementById('change-avatar-btn');
const avatarFileInput = document.getElementById('avatar-file-input');
const logoutBtn = document.getElementById('logout-btn');

// Player upload elements
const playerUploadSection = document.getElementById('player-upload-section');
const playerUploadForm = document.getElementById('player-upload-form');

// Search elements
const searchSection = document.getElementById('search-section');
const searchInput = document.getElementById('search-input');
const searchType = document.getElementById('search-type');
const searchBtn = document.getElementById('search-btn');
const clearBtn = document.getElementById('clear-btn');

// Player list elements
const playerListSection = document.getElementById('player-list-section');
const playerList = document.getElementById('player-list');

// Modal elements
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');
const modalBody = document.getElementById('modal-body');

// Current user state
let currentUser = null;
let playersUnsubscribe = null;

// Load Firebase SDK scripts
document.write('<script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"></script>');
document.write('<script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-auth-compat.js"></script>');
document.write('<script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js"></script>');
document.write('<script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-storage-compat.js"></script>');

// Initialize Firebase with configuration
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Firebase
  firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  });

  // Get Firebase services
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();

  // Auth state change listener
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      currentUser = user;
      
      // Update UI for authenticated user
      authSection.classList.add('hidden');
      avatarContainer.classList.remove('hidden');
      playerUploadSection.classList.remove('hidden');
      searchSection.classList.remove('hidden');
      playerListSection.classList.remove('hidden');
      
      // Update user info
      updateUserInfo();
      
      // Start listening for players
      startPlayersListener();
    } else {
      // User is signed out
      currentUser = null;
      
      // Update UI for unauthenticated user
      authSection.classList.remove('hidden');
      avatarContainer.classList.add('hidden');
      playerUploadSection.classList.add('hidden');
      searchSection.classList.add('hidden');
      playerListSection.classList.add('hidden');
      
      // Clear players list
      playerList.innerHTML = '';
      
      // Unsubscribe from players listener if active
      if (playersUnsubscribe) {
        playersUnsubscribe();
        playersUnsubscribe = null;
      }
    }
  });

  // Login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      await auth.signInWithEmailAndPassword(email, password);
      loginForm.reset();
    } catch (error) {
      alert(`Login error: ${error.message}`);
    }
  });

  // Signup form submission
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const displayName = document.getElementById('signup-displayName').value;
    
    try {
      // Create user
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      
      // Update profile with display name
      await userCredential.user.updateProfile({
        displayName: displayName
      });
      
      // Create user document in Firestore
      await db.collection('users').doc(userCredential.user.uid).set({
        email: email,
        displayName: displayName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      signupForm.reset();
    } catch (error) {
      alert(`Signup error: ${error.message}`);
    }
  });

  // Avatar click to toggle dropdown
  avatarImg.addEventListener('click', () => {
    avatarDropdown.classList.toggle('hidden');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!avatarContainer.contains(e.target)) {
      avatarDropdown.classList.add('hidden');
    }
  });

  // Update user info in dropdown
  function updateUserInfo() {
    if (currentUser) {
      // Update avatar image
      if (currentUser.photoURL) {
        avatarImg.src = currentUser.photoURL;
      } else {
        avatarImg.src = 'https://via.placeholder.com/40';
      }
      
      // Update user info in dropdown
      userInfo.innerHTML = `
        <p><strong>${currentUser.displayName || 'User'}</strong></p>
        <p>${currentUser.email}</p>
      `;
    }
  }

  // View profile button
  viewProfileBtn.addEventListener('click', () => {
    modalBody.innerHTML = `
      <h2>User Profile</h2>
      <p><strong>Name:</strong> ${currentUser.displayName || 'Not set'}</p>
      <p><strong>Email:</strong> ${currentUser.email}</p>
    `;
    modal.classList.remove('hidden');
    avatarDropdown.classList.add('hidden');
  });

  // Edit profile button
  editProfileBtn.addEventListener('click', async () => {
    const newDisplayName = prompt('Enter new display name:', currentUser.displayName || '');
    
    if (newDisplayName !== null && newDisplayName.trim() !== '') {
      try {
        // Update profile in Firebase Auth
        await currentUser.updateProfile({
          displayName: newDisplayName
        });
        
        // Update user document in Firestore
        await db.collection('users').doc(currentUser.uid).update({
          displayName: newDisplayName
        });
        
        // Update user info in dropdown
        updateUserInfo();
        
        alert('Profile updated successfully!');
      } catch (error) {
        alert(`Error updating profile: ${error.message}`);
      }
    }
    
    avatarDropdown.classList.add('hidden');
  });

  // Change avatar button
  changeAvatarBtn.addEventListener('click', () => {
    avatarFileInput.click();
    avatarDropdown.classList.add('hidden');
  });

  // Avatar file input change
  avatarFileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      
      try {
        // Upload file to Firebase Storage
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`avatars/${currentUser.uid}/${Date.now()}_${file.name}`);
        
        // Upload file
        await fileRef.put(file);
        
        // Get download URL
        const downloadURL = await fileRef.getDownloadURL();
        
        // Update user profile with new photo URL
        await currentUser.updateProfile({
          photoURL: downloadURL
        });
        
        // Update user document in Firestore
        await db.collection('users').doc(currentUser.uid).update({
          photoURL: downloadURL
        });
        
        // Update avatar in UI
        avatarImg.src = downloadURL;
        
        alert('Avatar updated successfully!');
      } catch (error) {
        alert(`Error updating avatar: ${error.message}`);
      }
    }
  });

  // Logout button
  logoutBtn.addEventListener('click', async () => {
    try {
      await auth.signOut();
      avatarDropdown.classList.add('hidden');
    } catch (error) {
      alert(`Logout error: ${error.message}`);
    }
  });

  // Player upload form submission
  playerUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('player-name').value;
    const team = document.getElementById('player-team').value;
    const position = document.getElementById('player-position').value;
    const nationality = document.getElementById('player-nationality').value;
    const imageFile = document.getElementById('player-image').files[0];
    
    if (!imageFile) {
      alert('Please select an image for the player');
      return;
    }
    
    try {
      // Upload image to Firebase Storage
      const storageRef = storage.ref();
      const fileRef = storageRef.child(`players/${Date.now()}_${imageFile.name}`);
      
      // Show loading state
      const submitBtn = playerUploadForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'Uploading...';
      submitBtn.disabled = true;
      
      // Upload file
      await fileRef.put(imageFile);
      
      // Get download URL
      const imageUrl = await fileRef.getDownloadURL();
      
      // Save player data to Firestore
      await db.collection('players').add({
        name,
        name_lowercase: name.toLowerCase(),
        team,
        position,
        nationality,
        imageUrl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: currentUser.uid
      });
      
      // Reset form
      playerUploadForm.reset();
      
      // Restore button state
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
      
      alert('Player added successfully!');
    } catch (error) {
      alert(`Error adding player: ${error.message}`);
    }
  });

  // Start real-time players listener
  function startPlayersListener() {
    // Unsubscribe from previous listener if exists
    if (playersUnsubscribe) {
      playersUnsubscribe();
    }
    
    // Create new listener
    playersUnsubscribe = db.collection('players')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        renderPlayersList(snapshot);
      }, (error) => {
        console.error('Error listening to players:', error);
      });
  }

  // Render players list
  function renderPlayersList(snapshot) {
    playerList.innerHTML = '';
    
    if (snapshot.empty) {
      playerList.innerHTML = '<li class="no-players">No players found</li>';
      return;
    }
    
    snapshot.forEach((doc) => {
      const player = doc.data();
      const playerItem = document.createElement('li');
      playerItem.className = 'player-item';
      
      playerItem.innerHTML = `
        <img src="${player.imageUrl}" alt="${player.name}" class="player-image">
        <div class="player-details">
          <h3>${player.name}</h3>
          <p><strong>Team:</strong> ${player.team}</p>
          <p><strong>Position:</strong> ${player.position}</p>
          <p><strong>Nationality:</strong> ${player.nationality}</p>
        </div>
      `;
      
      playerList.appendChild(playerItem);
    });
  }

  // Search button click
  searchBtn.addEventListener('click', () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const searchTypeValue = searchType.value;
    
    if (searchTerm === '') {
      alert('Please enter a search term');
      return;
    }
    
    // Unsubscribe from current listener
    if (playersUnsubscribe) {
      playersUnsubscribe();
    }
    
    let query;
    
    if (searchTypeValue === 'exact') {
      // Exact match search
      query = db.collection('players').where('name_lowercase', '==', searchTerm);
    } else {
      // Prefix match search
      query = db.collection('players')
        .orderBy('name_lowercase')
        .startAt(searchTerm)
        .endAt(searchTerm + '\uf8ff');
    }
    
    // Execute search query
    playersUnsubscribe = query.onSnapshot((snapshot) => {
      renderPlayersList(snapshot);
    }, (error) => {
      console.error('Error searching players:', error);
    });
  });

  // Clear search button click
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    startPlayersListener();
  });

  // Modal close button
  modalClose.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
});