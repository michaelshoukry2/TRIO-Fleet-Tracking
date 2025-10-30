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

// Initialize default admin user
async function initializeDefaultAdmin() {
    const adminEmail = "admin@triofleet.com";
    const adminPassword = "admin123";
    
    try {
        // Try to create admin user
        await auth.createUserWithEmailAndPassword(adminEmail, adminPassword);
        
        // Save admin data to Firestore
        await db.collection('users').doc(auth.currentUser.uid).set({
            email: adminEmail,
            name: "System Administrator",
            role: "admin",
            office: "Head Office",
            phone: "",
            isActive: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log("Default admin created successfully");
        auth.signOut(); // Sign out after creation
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("Admin user already exists");
        } else {
            console.error("Error creating admin:", error);
        }
    }
}

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
    document.getElementById('userDashboard').classList.add('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
    document.getElementById(screenId).classList.remove('hidden');
}

function switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show active content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Load data for the tab
    if (tabName === 'users') {
        loadAllUsers();
    } else if (tabName === 'vehicles') {
        loadAllVehicles();
    }
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please fill all fields');
        return;
    }

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        await loadUserData();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        showScreen('loginScreen');
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    });
}

async function loadUserData() {
    if (!currentUser) return;

    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            if (userData.role === 'admin') {
                // Show admin dashboard
                document.getElementById('adminInfo').textContent = 
                    `Admin: ${userData.name} | ${userData.office}`;
                showScreen('adminDashboard');
                loadAllUsers();
                loadAllVehicles();
            } else {
                // Show user dashboard
                document.getElementById('userWelcome').textContent = 
                    `${translations[currentLanguage].welcome}, ${userData.name}!`;
                document.getElementById('userInfo').textContent = 
                    `User: ${userData.name} (Driver)`;
                document.getElementById('officeInfo').textContent = 
                    `Office: ${userData.office}`;
                showScreen('userDashboard');
                loadVehicles(userData.office);
                loadTodayAttendance(userData.office);
            }
        } else {
            alert('User data not found. Please contact administrator.');
            await logout();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        alert('Error loading user data');
    }
}

async function createUser() {
    const email = document.getElementById('newUserEmail').value;
    const name = document.getElementById('newUserName').value;
    const role = document.getElementById('newUserRole').value;
    const office = document.getElementById('newUserOffice').value;
    const password = document.getElementById('newUserPassword').value;

    if (!email || !name || !password) {
        alert('Please fill all required fields');
        return;
    }

    try {
        // Create user in Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const newUser = userCredential.user;

        // Save user data to Firestore
        await db.collection('users').doc(newUser.uid).set({
            email: email,
            name: name,
            role: role,
            office: office,
            phone: "",
            isActive: true,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('User created successfully!');
        
        // Clear form
        document.getElementById('newUserEmail').value = '';
        document.getElementById('newUserName').value = '';
        document.getElementById('newUserPassword').value = '';
        
        // Reload user list
        loadAllUsers();
        
        // Sign out the new user (they'll login with their own credentials)
        await auth.signOut();
        // Sign back in as admin
        await auth.signInWithEmailAndPassword(currentUser.email, document.getElementById('password').value);
        
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Error creating user: ' + error.message);
    }
}

async function loadAllUsers() {
    try {
        const usersSnapshot = await db.collection('users').get();
        const userList = document.getElementById('userList');
        userList.innerHTML = '';

        usersSnapshot.forEach(doc => {
            const user = doc.data();
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <div>
                    <strong>${user.name}</strong><br>
                    <small>${user.email} | ${user.role} | ${user.office}</small>
                </div>
                <div class="action-buttons">
                    <button class="action-btn btn-danger" onclick="deleteUser('${doc.id}')">Delete</button>
                </div>
            `;
            userList.appendChild(userItem);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            // Note: In production, you should also delete from Firebase Auth
            await db.collection('users').doc(userId).delete();
            loadAllUsers();
            alert('User deleted successfully');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user');
        }
    }
}

async function createVehicle() {
    const vehicleNumber = document.getElementById('newVehicleNumber').value;
    const driverName = document.getElementById('newVehicleDriver').value;
    const office = document.getElementById('newVehicleOffice').value;

    if (!vehicleNumber || !driverName) {
        alert('Please fill all required fields');
        return;
    }

    try {
        await db.collection('vehicles').add({
            vehicleNumber: vehicleNumber,
            driverName: driverName,
            office: office,
            status: 'active',
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Vehicle added successfully!');
        
        // Clear form
        document.getElementById('newVehicleNumber').value = '';
        document.getElementById('newVehicleDriver').value = '';
        
        // Reload vehicle list
        loadAllVehicles();
        
    } catch (error) {
        console.error('Error creating vehicle:', error);
        alert('Error creating vehicle: ' + error.message);
    }
}

async function loadAllVehicles() {
    try {
        const vehiclesSnapshot = await db.collection('vehicles').get();
        const vehicleList = document.getElementById('vehicleList');
        vehicleList.innerHTML = '';

        vehiclesSnapshot.forEach(doc => {
            const vehicle = doc.data();
            const vehicleItem = document.createElement('div');
            vehicleItem.className = 'user-item';
            vehicleItem.innerHTML = `
                <div>
                    <strong>${vehicle.vehicleNumber}</strong><br>
                    <small>Driver: ${vehicle.driverName} | Office: ${vehicle.office}</small>
                </div>
                <div class="action-buttons">
                    <button class="action-btn btn-danger" onclick="deleteVehicle('${doc.id}')">Delete</button>
                </div>
            `;
            vehicleList.appendChild(vehicleItem);
        });
    } catch (error) {
        console.error('Error loading vehicles:', error);
    }
}

async function deleteVehicle(vehicleId) {
    if (confirm('Are you sure you want to delete this vehicle?')) {
        try {
            await db.collection('vehicles').doc(vehicleId).delete();
            loadAllVehicles();
            alert('Vehicle deleted successfully');
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            alert('Error deleting vehicle');
        }
    }
}

function loadVehicles(office) {
    // This would load from Firestore in real implementation
    const vehicles = [
        { id: '1', number: 'FLEET-001', driver: 'Ahmed Mohamed' },
        { id: '2', number: 'FLEET-002', driver: 'Mohamed Ali' },
        { id: '3', number: 'FLEET-003', driver: 'Hassan Mahmoud' }
    ].filter(v => v.office === office || !office);

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

function generateReport() {
    const month = document.getElementById('reportMonth').value;
    document.getElementById('reportResults').innerHTML = `
        <div class="user-item">
            <strong>Monthly Report for ${month}</strong><br>
            <small>Total Submissions: 45 | On Duty: 38 | Delayed: 5 | Absent: 2</small>
        </div>
        <button class="btn" style="margin-top: 10px;">Export to Excel</button>
    `;
}

// Auth state listener
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        loadUserData();
    } else {
        showScreen('loginScreen');
    }
});

// Initialize
initializeDefaultAdmin();
translatePage();
