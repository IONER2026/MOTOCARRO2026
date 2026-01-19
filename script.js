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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const roleSelection = document.getElementById('role-selection');
const authContainer = document.getElementById('auth-container');

// State
let selectedRole = null;

// prevent auth state from triggering if we are just selecting a role
let isSelectingRole = false;

// Check if user is already logged in
auth.onAuthStateChanged(user => {
    if (user) {
        // If user is logged in, check their role in DB
        checkUserRole(user.uid);
    }
});

if (roleSelection) {
    // Only present on index.html
}

function selectRole(role) {
    isSelectingRole = true;
    selectedRole = role;
    if (roleSelection) roleSelection.style.display = 'none';
    if (authContainer) {
        authContainer.classList.remove('hidden');
        // Inject Login Form based on role
        authContainer.innerHTML = `
            <h2>Ingreso ${role === 'driver' ? 'Conductor' : 'Pasajero'}</h2>
            <p>Usa tu cuenta de Google para continuar</p>
            <button class="role-btn" onclick="loginWithGoogle()">
                <span class="icon">G</span> Iniciar Sesión con Google
            </button>
            <button class="role-btn" style="font-size: 0.9rem; opacity: 0.7; border:none;" style="background:none;" onclick="location.reload()">
                ← Volver
            </button>
        `;
    }
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
            const data = doc.data();
            redirectUser(data.role, data.status, data.docs_submitted);
        } else {
            // New user, save role
            // Drivers start as 'pending'. Passengers are approved.
            const initialStatus = selectedRole === 'driver' ? 'pending' : 'approved';

            userRef.set({
                email: user.email,
                displayName: user.displayName,
                role: selectedRole,
                status: initialStatus,
                docs_submitted: false,
                photoURL: user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                redirectUser(selectedRole, initialStatus, false);
            });
        }
    });
}

function checkUserRole(uid) {
    db.collection('users').doc(uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            redirectUser(data.role, data.status, data.docs_submitted);
        } else {
            // User authenticated but no DB record? Logout or handle error
            console.log("User has no role in DB");
        }
    });
}

function redirectUser(role, status, docsSubmitted) {
    const p = window.location.pathname;

    // Normalize path just in case
    const isDriverPage = p.includes('driver.html');
    const isRegisterPage = p.includes('driver_register.html');
    const isVerificationPage = p.includes('verification.html');
    const isPassengerPage = p.includes('passenger.html');
    const isIndexPage = p.endsWith('/') || p.includes('index.html');

    if (role === 'driver') {
        if (status === 'approved') {
            if (!isDriverPage) window.location.href = 'driver.html';
        } else if (!docsSubmitted) {
            if (!isRegisterPage) window.location.href = 'driver_register.html';
        } else {
            if (!isVerificationPage) window.location.href = 'verification.html';
        }
    } else {
        // Passenger
        if (!isPassengerPage) window.location.href = 'passenger.html';
    }
}
