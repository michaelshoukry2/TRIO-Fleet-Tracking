// Firebase configuration
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let currentLanguage = 'en';

const translations = {
    en: {
        appTitle: "TRIO Fleet Attendance",
        login: "Login",
        email: "Email",
        password: "Password",
        welcome: "Welcome back",
        vehicles: "Vehicles",
        todaySubmissions: "Today's Submissions",
        selectVehicle: "Select Vehicle",
        status: "Status",
        submitAttendance: "Submit Attendance",
        logout: "Logout",
        onDuty: "On Duty",
        delayed: "Delayed",
        absent: "Absent",
        maintenance: "Maintenance",
        vacation: "Vacation",
        delayedHours: "Delayed Hours"
    },
    ar: {
        appTitle: "نظام حضور أسطول تريو",
        login: "تسجيل الدخول",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        welcome: "مرحباً بعودتك",
        vehicles: "المركبات",
        todaySubmissions: "تسجيلات اليوم",
        selectVehicle: "اختر المركبة",
        status: "الحالة",
        submitAttendance: "تسجيل الحضور",
        logout: "تسجيل الخروج",
        onDuty: "في الخدمة",
        delayed: "متأخر",
        absent: "غائب",
        maintenance: "صيانة",
        vacation: "إجازة",
        delayedHours: "ساعات التأخير"
    }
};

function setLanguage(lang) {
    currentLanguage = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    translatePage();
}

function translatePage() {
    const t = translations[currentLanguage];
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (t[key]) {
            element.textContent = t[key];
        }
    });
}

function showScreen(screenId) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboardScreen').classList.add('hidden');
    document.getElementById(screenId).classList.remove('hidden');
}

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please fill all fields');
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            currentUser = userCredential.user;
            loadUserData();
            showScreen('dashboardScreen');
        })
        .catch((error) => {
            alert('Login failed: ' + error.message);
        });
}

function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        showScreen('loginScreen');
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    });
}

function loadUserData() {
    if (!currentUser) return;

    // For demo purposes - in real app, get from Firestore
    const userData = {
        name: currentUser.email.split('@')[0],
        office: 'Giza Office',
        role: 'user'
    };

    document.getElementById('userWelcome').textContent = 
        `${translations[currentLanguage].welcome}, ${userData.name}!`;
    document.getElementById('userInfo').textContent = 
        `User: ${userData.name} (${userData.role})`;
    document.getElementById('officeInfo').textContent = 
        `Office: ${userData.office}`;

    loadVehicles(userData.office);
    loadTodayAttendance(userData.office);
}

function loadVehicles(office) {
    // Demo vehicles - in real app, get from Firestore
    const vehicles = [
        { id: '1', number: 'FLEET-001', driver: 'Ahmed Mohamed' },
        { id: '2', number: 'FLEET-002', driver: 'Mohamed Ali' },
        { id: '3', number: 'FLEET-003', driver: 'Hassan Mahmoud' }
    ];

    const select = document.getElementById('vehicleSelect');
    select.innerHTML = '<option value="">Choose a vehicle</option>';
    
    vehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.id;
        option.textContent = `${vehicle.number} - ${vehicle.driver}`;
        select.appendChild(option);
    });

    document.getElementById('vehicleCount').textContent = vehicles.length;
}

function loadTodayAttendance(office) {
    // Demo attendance data
    const attendance = [
        { vehicle: 'FLEET-001', driver: 'Ahmed Mohamed', status: 'On Duty', time: '08:00 AM' },
        { vehicle: 'FLEET-002', driver: 'Mohamed Ali', status: 'Delayed', delay: 2, time: '09:30 AM' }
    ];

    const list = document.getElementById('attendanceList');
    list.innerHTML = '';

    attendance.forEach(item => {
        const div = document.createElement('div');
        div.className = `attendance-item status-${item.status.toLowerCase().replace(' ', '-')}`;
        
        let content = `
            <strong>${item.vehicle}</strong> - ${item.driver}<br>
            <small>Status: ${item.status} • ${item.time}</small>
        `;
        
        if (item.delay) {
            content += `<br><small>Delayed: ${item.delay}h</small>`;
        }
        
        div.innerHTML = content;
        list.appendChild(div);
    });

    document.getElementById('todayCount').textContent = attendance.length;
}

function toggleDelayHours() {
    const status = document.getElementById('statusSelect').value;
    const delayGroup = document.getElementById('delayHoursGroup');
    
    if (status === 'Delayed') {
        delayGroup.classList.remove('hidden');
    } else {
        delayGroup.classList.add('hidden');
    }
}

function submitAttendance() {
    const vehicleId = document.getElementById('vehicleSelect').value;
    const status = document.getElementById('statusSelect').value;
    const delayHours = document.getElementById('delayHours').value || 0;

    if (!vehicleId) {
        alert('Please select a vehicle');
        return;
    }

    // In real app, save to Firestore
    const vehicleSelect = document.getElementById('vehicleSelect');
    const selectedVehicle = vehicleSelect.options[vehicleSelect.selectedIndex].text;
    
    alert(`Attendance submitted!\nVehicle: ${selectedVehicle}\nStatus: ${status}\nDelayed: ${delayHours}h`);
    
    // Reset form
    document.getElementById('vehicleSelect').value = '';
    document.getElementById('statusSelect').value = 'On Duty';
    document.getElementById('delayHours').value = '0';
    document.getElementById('delayHoursGroup').classList.add('hidden');
    
    // Reload today's attendance
    loadTodayAttendance('Giza Office');
}

// Auth state listener
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        loadUserData();
        showScreen('dashboardScreen');
    } else {
        showScreen('loginScreen');
    }
});

// Initialize
translatePage();
