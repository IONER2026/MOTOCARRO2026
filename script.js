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

// Simplify: Remove forced settings to see if default works better
// db.settings({ ... });

// DOM Elements
const roleSelection = document.getElementById('role-selection');
const authContainer = document.getElementById('auth-container');

// State
let selectedRole = null;
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

function showStatus(msg, isError = false) {
    const el = document.getElementById('login-status');
    if (el) {
        el.style.display = 'block';
        el.innerText = msg;
        el.style.color = isError ? '#ff4444' : '#ffcc00';
    }
    console.log("STATUS:", msg);
}

function loginWithGoogle() {
    showStatus("Verificando conexión...");
    if (!navigator.onLine) {
        showStatus("Error: No tienes conexión a internet.", true);
        return;
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            showStatus("Autenticación exitosa. Guardando datos...");
            const user = result.user;
            saveUserRole(user);
        }).catch((error) => {
            console.error(error);
            showStatus("Error: " + error.message, true);
        });
}

// Helper to retry operations
async function retryOperation(operation, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await db.enableNetwork(); // Force network enable before op
            return await operation();
        } catch (err) {
            console.log(`Intento ${i + 1} fallido:`, err);
            if (i === maxRetries - 1) throw err;
            await new Promise(r => setTimeout(r, 1000)); // Wait 1s
        }
    }
}

function saveUserRole(user) {
    const userRef = db.collection('users').doc(user.uid);

    showStatus("Conectando base de datos...", false);

    retryOperation(() => userRef.get())
        .then((doc) => {
            if (doc && doc.exists) {
                showStatus("Usuario encontrado. Redirigiendo...", false);
                const data = doc.data();
                redirectUser(data.role, data.status, data.docs_submitted);
            } else {
                // New user, save role
                showStatus("Registrando nuevo usuario...", false);
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
                    showStatus("Registro completado. Redirigiendo...", false);
                    redirectUser(selectedRole, initialStatus, false);
                }).catch(err => {
                    throw err; // Pass to helper catch
                });
            }
        }).catch(err => {
            console.error("Error DB:", err);
            if (err.message.includes("offline")) {
                showStatus("Error: El cliente está offline. Revisa tu conexión.", true);
            } else {
                showStatus("Error base de datos: " + err.message, true);
            }
        });
}

function checkUserRole(uid) {
    console.log("Verificando rol para:", uid);

    retryOperation(() => db.collection('users').doc(uid).get())
        .then((doc) => {
            if (doc && doc.exists) {
                const data = doc.data();
                console.log("Datos obtenidos:", data);
                redirectUser(data.role, data.status, data.docs_submitted);
            } else {
                console.log("Usuario autenticado pero sin registro en DB");
                if (!isSelectingRole) {
                    // Might be a returning user who got wiped or error
                    // Do nothing, wait for them to click a role
                }
            }
        }).catch(err => {
            console.error("Error checkUserRole:", err);
            // Don't alert here to avoid spamming if it's just a temporary glitch on load
            console.log("Reintentando conexión...");
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
