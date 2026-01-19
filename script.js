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

// Fix for "Client is offline" error
db.settings({ experimentalForceLongPolling: true });

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
        console.log("Usuario detectado:", user.uid);
        // If user is logged in, check their role in DB
        checkUserRole(user.uid);
    } else {
        console.log("No hay usuario activo.");
    }
});

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
            <div id="login-status" style="margin: 1rem 0; color: #ffcc00; display: none;">Iniciando...</div>
            <button class="role-btn" onclick="loginWithGoogle()">
                <span class="icon">G</span> Iniciar Sesión con Google
            </button>
            <button class="role-btn" style="font-size: 0.9rem; opacity: 0.7; border:none; background:none;" onclick="location.reload()">
                ← Volver
            </button>
        `;
    }
}

function showStatus(msg) {
    const el = document.getElementById('login-status');
    if (el) {
        el.style.display = 'block';
        el.innerText = msg;
    }
    console.log("STATUS:", msg);
}

function loginWithGoogle() {
    showStatus("Abriendo ventana de autenticación...");
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            showStatus("Autenticación exitosa. Guardando datos...");
            const user = result.user;
            saveUserRole(user);
        }).catch((error) => {
            console.error(error);
            showStatus("Error: " + error.message);
            alert("Error al iniciar sesión: " + error.message);
        });
}

function saveUserRole(user) {
    const userRef = db.collection('users').doc(user.uid);

    showStatus("Verificando registro en base de datos...");
    userRef.get().then((doc) => {
        if (doc.exists) {
            showStatus("Usuario encontrado. Redirigiendo...");
            const data = doc.data();
            redirectUser(data.role, data.status, data.docs_submitted);
        } else {
            // New user, save role
            showStatus("Registrando nuevo usuario...");
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
                showStatus("Registro completado. Redirigiendo...");
                redirectUser(selectedRole, initialStatus, false);
            }).catch(err => {
                console.error("Error writing to DB:", err);
                showStatus("Error al guardar en base de datos: " + err.message);
                alert("Error base de datos: " + err.message);
            });
        }
    }).catch(err => {
        console.error("Error reading DB:", err);
        showStatus("Error de conexión: " + err.message);
        alert("Error de conexión: " + err.message);
    });
}

function checkUserRole(uid) {
    // showStatus may not exist if called from auto-login, so check safely
    console.log("Verificando rol para:", uid);
    db.collection('users').doc(uid).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            console.log("Datos obtenidos:", data);
            redirectUser(data.role, data.status, data.docs_submitted);
        } else {
            console.log("Usuario autenticado pero sin registro en DB");
            // Could force logout here or ask to select role
            if (selectedRole) {
                // user is in the process of logging in, so we might be in the race condition of 'saveUserRole'
                // do nothing, let saveUserRole handle it
            } else {
                // Orphaned auth user?
                alert("Usuario detectado pero no registrado. Por favor selecciona tu rol.");
                // Optionally: auth.signOut();
            }
        }
    }).catch(err => {
        console.error("Error checkUserRole:", err);
        alert("Error verificando usuario: " + err.message);
    });
}

function redirectUser(role, status, docsSubmitted) {
    console.log("Redirigiendo a:", role, status);
    const p = window.location.pathname;

    // Normalize path just in case
    const isDriverPage = p.includes('driver.html');
    const isRegisterPage = p.includes('driver_register.html');
    const isVerificationPage = p.includes('verification.html');
    const isPassengerPage = p.includes('passenger.html');

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
