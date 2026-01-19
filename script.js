// Configuración de Firebase - ¡A REEMPLAZAR CON TUS DATOS NUEVOS!
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "NUMERO",
    appId: "ID"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized");
} catch (e) {
    console.error("Error initializing Firebase (Wait for config):", e);
}

// DOM Elements
const roleSelection = document.getElementById('role-selection');
const authContainer = document.getElementById('auth-container');

function selectRole(role) {
    console.log(`User selected role: ${role}`);

    // Animation to switch views
    roleSelection.style.display = 'none';
    authContainer.classList.remove('hidden');

    // Inject Login Form based on role
    authContainer.innerHTML = `
        <h2>Ingreso ${role === 'driver' ? 'Conductor' : 'Pasajero'}</h2>
        <p>Conectando con Google...</p>
        <button class="role-btn" onclick="loginWithGoogle('${role}')">
            Iniciar Sesión con Google
        </button>
        <button class="role-btn" style="font-size: 0.9rem; opacity: 0.7;" onclick="location.reload()">
            ← Volver
        </button>
    `;
}

function loginWithGoogle(role) {
    // Placeholder for Auth Logic
    alert(`Iniciando sesión como ${role}... (Necesitamos configurar Firebase Console primero)`);
}
