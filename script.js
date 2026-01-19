// Configuración de Firebase - CHARAPA EXPRESS
const firebaseConfig = {
    apiKey: "AIzaSyDkxUrxIx7MAWwls-NY0Lwwb6lc176fSuM",
    authDomain: "motocarro2026-6d261.firebaseapp.com",
    projectId: "motocarro2026-6d261",
    storageBucket: "motocarro2026-6d261.firebasestorage.app",
    messagingSenderId: "892971790055",
    appId: "1:892971790055:web:708339c84105791b70fc42"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const roleSelection = document.getElementById('role-selection');
const authContainer = document.getElementById('auth-container');

// State
let selectedRole = null;

// Check if user is already logged in
auth.onAuthStateChanged(user => {
    if (user) {
        checkUserRole(user.uid);
    }
});

function selectRole(role) {
    selectedRole = role;
    roleSelection.style.display = 'none';
    authContainer.classList.remove('hidden');

    // Inject Login Form based on role
    authContainer.innerHTML = `
        <h2>Ingreso ${role === 'driver' ? 'Conductor' : 'Pasajero'}</h2>
        <p>Usa tu cuenta de Google para continuar</p>
        <button class="role-btn" onclick="loginWithGoogle()">
            <span class="icon">G</span> Iniciar Sesión con Google
        </button>
        <button class="role-btn" style="font-size: 0.9rem; opacity: 0.7; border:none;" onclick="location.reload()">
            ← Volver
        </button>
    `;
}

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            saveUserRole(user);
        }).catch((error) => {
            console.error(error);
            alert("Error al iniciar sesión: " + error.message);
        });
}

function saveUserRole(user) {
    const userRef = db.collection('users').doc(user.uid);

    userRef.get().then((doc) => {
        if (doc.exists) {
            // User exists, redirect based on stored role
            const data = doc.data();
            redirectUser(data.role);
        } else {
            // New user, save role
            userRef.set({
                email: user.email,
                displayName: user.displayName,
                role: selectedRole,
                photoURL: user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                redirectUser(selectedRole);
            });
        }
    });
}

function checkUserRole(uid) {
    db.collection('users').doc(uid).get().then((doc) => {
        if (doc.exists) {
            redirectUser(doc.data().role);
        }
    });
}

function redirectUser(role) {
    if (role === 'driver') {
        window.location.href = 'driver.html';
    } else {
        window.location.href = 'passenger.html';
    }
}
