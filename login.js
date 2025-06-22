// User Storage - JSON dosyasından yüklenir ve localStorage ile genişletilir
let users = [];
let usersLoaded = false;

// Validation Functions
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password)
    };
}

function validateName(name) {
    return name && name.trim().length >= 2;
}

// Load users from JSON file
async function loadUsersFromJSON() {
    try {
        const response = await fetch('user.json');
        if (!response.ok) {
            throw new Error('Users JSON dosyası yüklenemedi');
        }
        const data = await response.json();
        return data.users.map(user => ({
            ...user,
            avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`,
            createdAt: user.createdAt || new Date().toISOString(),
            lastLogin: user.lastLogin || null,
            assignedFacilities: user.assignedFacilities || [],
            department: user.department || '',
            accessLevel: user.accessLevel || 'limited'
        }));
    } catch (error) {
        console.error('JSON dosyasından kullanıcılar yüklenirken hata:', error);
        return [];
    }
}

// Load additional users from localStorage
function loadUsersFromStorage() {
    try {
        const savedUsers = localStorage.getItem('pixelNewUsers');
        if (savedUsers) {
            return JSON.parse(savedUsers);
        }
        return [];
    } catch (error) {
        console.error('localStorage\'dan kullanıcılar yüklenirken hata:', error);
        return [];
    }
}

// Save new users to localStorage
function saveNewUsersToStorage(newUsers) {
    try {
        localStorage.setItem('pixelNewUsers', JSON.stringify(newUsers));
        console.log('Yeni kullanıcılar localStorage\'a kaydedildi:', newUsers.length, 'kullanıcı');
    } catch (error) {
        console.error('localStorage\'a kaydetme hatası:', error);
    }
}

// Create demo users if nothing is available
function createDemoUsers() {
    return [
        {
            id: 1,
            name: 'Admin User',
            email: 'admin@pixel.com',
            password: 'Admin123',
            role: 'admin',
            avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=3b82f6&color=fff',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isActive: true,
            permissions: ['dashboard', 'facilities', 'inverters', 'users', 'settings'],
            source: 'demo'
        },
        {
            id: 2,
            name: 'Test User',
            email: 'test@pixel.com',
            password: 'Test123',
            role: 'user',
            avatar: 'https://ui-avatars.com/api/?name=Test+User&background=10b981&color=fff',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isActive: true,
            permissions: ['dashboard', 'facilities', 'inverters'],
            source: 'demo'
        }
    ];
}

// Load all users (JSON + localStorage + demo)
async function loadAllUsers() {
    try {
        // 1. JSON dosyasından yükle
        const jsonUsers = await loadUsersFromJSON();
        
        // 2. localStorage'dan yeni kullanıcıları yükle
        const newUsers = loadUsersFromStorage();
        
        // 3. Hepsini birleştir
        let allUsers = [...jsonUsers, ...newUsers];
        
        // 4. Eğer hiç kullanıcı yoksa demo kullanıcıları ekle
        if (allUsers.length === 0) {
            const demoUsers = createDemoUsers();
            allUsers = demoUsers;
            showAlert('Demo kullanıcıları oluşturuldu: admin@pixel.com / Admin123 veya test@pixel.com / Test123', 'info');
        }
        
        users = allUsers;
        usersLoaded = true;
        
        console.log('Tüm kullanıcılar yüklendi:', {
            json: jsonUsers.length,
            localStorage: newUsers.length,
            toplam: users.length
        });
        
        return true;
    } catch (error) {
        console.error('Kullanıcılar yüklenirken hata:', error);
        users = createDemoUsers();
        usersLoaded = true;
        return false;
    }
}

// Add new user to localStorage
function addNewUser(userData) {
    const newUsers = loadUsersFromStorage();
    const newUser = {
        ...userData,
        id: Date.now(),
        source: 'localStorage',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    
    newUsers.push(newUser);
    saveNewUsersToStorage(newUsers);
    
    // Ana kullanıcı listesine de ekle
    users.push(newUser);
    
    return newUser;
}

// Ensure users are loaded
async function ensureUsersLoaded() {
    if (!usersLoaded) {
        await loadAllUsers();
    }
}

// Form Toggle Functions
function showLogin() {
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById('loginForm').classList.add('active');
    hideAllAlerts();
}

function showRegister() {
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById('registerForm').classList.add('active');
    hideAllAlerts();
}

// Password Strength Checker
function checkPasswordStrength(password) {
    let strength = 0;
    const requirements = validatePassword(password);

    Object.keys(requirements).forEach((req, index) => {
        const element = document.getElementById(`req${index + 1}`);
        if (element) {
            const icon = element.querySelector('i');
            
            if (requirements[req]) {
                element.classList.add('valid');
                icon.className = 'fas fa-check';
                strength++;
            } else {
                element.classList.remove('valid');
                icon.className = 'fas fa-times';
            }
        }
    });

    return strength;
}

// Form Validation
async function validateForm(formType) {
    await ensureUsersLoaded();
    
    let isValid = true;
    
    if (formType === 'login') {
        const email = document.getElementById('loginEmail');
        const password = document.getElementById('loginPassword');
        
        // Email validation
        if (!validateEmail(email.value)) {
            showFieldError(email, 'Geçerli bir e-posta adresi giriniz');
            isValid = false;
        } else {
            hideFieldError(email);
        }
        
        // Password validation
        if (!password.value.trim()) {
            showFieldError(password, 'Şifre boş bırakılamaz');
            isValid = false;
        } else {
            hideFieldError(password);
        }
    } else if (formType === 'register') {
        const name = document.getElementById('registerName');
        const email = document.getElementById('registerEmail');
        const password = document.getElementById('registerPassword');
        const passwordConfirm = document.getElementById('registerPasswordConfirm');
        const agreeTerms = document.getElementById('agreeTerms');
        
        // Name validation
        if (!validateName(name.value)) {
            showFieldError(name, 'Ad soyad en az 2 karakter olmalıdır');
            isValid = false;
        } else {
            hideFieldError(name);
        }
        
        // Email validation
        if (!validateEmail(email.value)) {
            showFieldError(email, 'Geçerli bir e-posta adresi giriniz');
            isValid = false;
        } else if (users.find(u => u.email === email.value)) {
            showFieldError(email, 'Bu e-posta adresi zaten kullanılıyor');
            isValid = false;
        } else {
            hideFieldError(email);
        }
        
        // Password validation
        const passwordStrength = checkPasswordStrength(password.value);
        if (passwordStrength < 3) {
            showFieldError(password, 'Şifre güvenlik koşullarını sağlamalıdır');
            isValid = false;
        } else {
            hideFieldError(password);
        }
        
        // Password confirmation
        if (password.value !== passwordConfirm.value) {
            showFieldError(passwordConfirm, 'Şifreler eşleşmiyor');
            isValid = false;
        } else {
            hideFieldError(passwordConfirm);
        }
        
        // Terms agreement
        if (!agreeTerms.checked) {
            showAlert('Kullanım koşullarını kabul etmelisiniz', 'danger');
            isValid = false;
        }
    }
    
    return isValid;
}

function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.add('error');
    const errorMsg = formGroup.querySelector('.error-message');
    if (errorMsg) errorMsg.textContent = message;
}

function hideFieldError(field) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.remove('error');
}

// Alert Functions
function showAlert(message, type) {
    hideAllAlerts();
    const alert = document.getElementById(`${type}Alert`);
    const messageSpan = document.getElementById(`${type}Message`);
    messageSpan.textContent = message;
    alert.classList.add('show');
    
    setTimeout(() => {
        alert.classList.remove('show');
    }, 5000);
}

function hideAllAlerts() {
    document.querySelectorAll('.alert-modern').forEach(alert => {
        alert.classList.remove('show');
    });
}

// Form Submission Handlers
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    if (!(await validateForm('login'))) return;
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    
    // Add loading state
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Check if user exists and is active
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            if (!user.isActive) {
                submitBtn.classList.remove('btn-loading');
                submitBtn.disabled = false;
                showAlert('Hesabınız deaktif durumda. Lütfen yönetici ile iletişime geçin.', 'danger');
                return;
            }
            
            // Update last login for localStorage users
            if (user.source === 'localStorage') {
                user.lastLogin = new Date().toISOString();
                const newUsers = loadUsersFromStorage();
                const userIndex = newUsers.findIndex(u => u.id === user.id);
                if (userIndex !== -1) {
                    newUsers[userIndex].lastLogin = user.lastLogin;
                    saveNewUsersToStorage(newUsers);
                }
            }
            
            // Store login info (sadece sessionStorage kullan)
            const loginData = {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    permissions: user.permissions,
                    assignedFacilities: user.assignedFacilities,
                    department: user.department,
                    accessLevel: user.accessLevel,
                    source: user.source || 'json'
                },
                timestamp: new Date().toISOString()
            };
            
            sessionStorage.setItem('pixelLogin', JSON.stringify(loginData));
            
            showSuccessPage('Giriş Başarılı', `Hoş geldiniz ${user.name}! Dashboard'a yönlendiriliyorsunuz...`, () => {
                window.location.href = 'index.html';
            });
        } else {
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
            showAlert('E-posta veya şifre hatalı', 'danger');
        }
    }, 1500);
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    if (!(await validateForm('register'))) return;
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const submitBtn = document.querySelector('#registerForm button[type="submit"]');
    
    // Add loading state
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Create new user data
        const userData = {
            name: name.trim(),
            email: email,
            password: password,
            role: 'user',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=3b82f6&color=fff`,
            isActive: true,
            permissions: ['dashboard', 'facilities']
        };
        
        // Add to localStorage and users array
        const newUser = addNewUser(userData);
        
        // Auto-login after registration
        const loginData = {
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                avatar: newUser.avatar,
                permissions: newUser.permissions,
                source: newUser.source
            },
            timestamp: new Date().toISOString()
        };
        
        sessionStorage.setItem('pixelLogin', JSON.stringify(loginData));
        
        showSuccessPage('Kayıt Başarılı', `Hoş geldiniz ${newUser.name}! Hesabınız oluşturuldu ve localStorage'a kaydedildi. Dashboard'a yönlendiriliyorsunuz...`, () => {
            window.location.href = 'index.html';
        });
    }, 2000);
}

// Auto-login check
async function checkAutoLogin() {
    const savedLogin = sessionStorage.getItem('pixelLogin');
    
    if (savedLogin) {
        const loginData = JSON.parse(savedLogin);
        showAlert(`Hoş geldiniz ${loginData.user.name}! Dashboard'a yönlendiriliyorsunuz...`, 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Load all users
    await loadAllUsers();
    
    // Show available users info
    if (users.length > 0) {
        setTimeout(() => {
            const jsonUsers = users.filter(u => u.source !== 'localStorage').slice(0, 2);
            const localUsers = users.filter(u => u.source === 'localStorage').slice(0, 2);
            
            let message = '';
            if (jsonUsers.length > 0) {
                const jsonList = jsonUsers.map(u => `${u.email} / ${u.password}`).join(' | ');
                message += `JSON kullanıcıları: ${jsonList}`;
            }
            
            if (localUsers.length > 0) {
                if (message) message += ' | ';
                message += `Kayıtlı kullanıcılar: ${localUsers.length} adet`;
            }
            
            if (message) {
                showAlert(message, 'info');
            }
        }, 1000);
    }
}

// Display current users (for debugging)
function showCurrentUsers() {
    console.log('Mevcut kullanıcılar:', users);
    console.log('JSON kullanıcıları:', users.filter(u => u.source !== 'localStorage'));
    console.log('localStorage kullanıcıları:', users.filter(u => u.source === 'localStorage'));
}

// Global functions
window.pixelLogout = function() {
    sessionStorage.removeItem('pixelLogin');
    window.location.href = 'login.html';
};

window.getCurrentUser = function() {
    const savedLogin = sessionStorage.getItem('pixelLogin');
    if (savedLogin) {
        const loginData = JSON.parse(savedLogin);
        return loginData.user;
    }
    return null;
};

window.isUserLoggedIn = function() {
    const savedLogin = sessionStorage.getItem('pixelLogin');
    return !!savedLogin;
};

window.showCurrentUsers = showCurrentUsers; // Debug için

// Success Page Function
function showSuccessPage(title, message, callback) {
    document.querySelectorAll('.auth-form, .form-toggle').forEach(el => {
        el.style.display = 'none';
    });
    
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successPageMessage').textContent = message;
    document.getElementById('successPage').style.display = 'block';
    
    let countdown = 3;
    const countdownEl = document.getElementById('countdown');
    
    const timer = setInterval(() => {
        countdown--;
        countdownEl.textContent = `${countdown} saniye sonra yönlendirileceksiniz...`;
        
        if (countdown <= 0) {
            clearInterval(timer);
            callback();
        }
    }, 1000);
}

// Social login handlers
function handleGoogleLogin() {
    showAlert('Google ile giriş yapma özelliği yakında aktif olacak.', 'info');
}

function handleGoogleRegister() {
    showAlert('Google ile kayıt olma özelliği yakında aktif olacak.', 'info');
}

// Forgot password handler
async function showForgotPassword() {
    await ensureUsersLoaded();
    
    const email = prompt('Şifre sıfırlama bağlantısı gönderilecek e-posta adresinizi giriniz:');
    
    if (email) {
        if (validateEmail(email)) {
            const user = users.find(u => u.email === email);
            if (user) {
                if (user.isActive) {
                    showAlert('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.', 'success');
                } else {
                    showAlert('Bu hesap deaktif durumda. Lütfen yönetici ile iletişime geçin.', 'danger');
                }
            } else {
                showAlert('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.', 'danger');
            }
        } else {
            showAlert('Geçerli bir e-posta adresi giriniz.', 'danger');
        }
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Form submissions
    document.getElementById('loginForm').addEventListener('submit', handleLoginSubmit);
    document.getElementById('registerForm').addEventListener('submit', handleRegisterSubmit);

    // Password strength checker
    const registerPassword = document.getElementById('registerPassword');
    if (registerPassword) {
        registerPassword.addEventListener('input', function() {
            const password = this.value;
            const strength = checkPasswordStrength(password);
            const strengthFill = document.getElementById('strengthFill');
            
            if (strengthFill) {
                const percentage = (strength / 3) * 100;
                strengthFill.style.width = percentage + '%';
            }
        });
    }

    // Real-time validation
    document.getElementById('loginEmail').addEventListener('blur', function() {
        if (this.value && !validateEmail(this.value)) {
            showFieldError(this, 'Geçerli bir e-posta adresi giriniz');
        } else {
            hideFieldError(this);
        }
    });

    document.getElementById('registerEmail').addEventListener('blur', async function() {
        if (this.value) {
            await ensureUsersLoaded();
            if (!validateEmail(this.value)) {
                showFieldError(this, 'Geçerli bir e-posta adresi giriniz');
            } else if (users.find(u => u.email === this.value)) {
                showFieldError(this, 'Bu e-posta adresi zaten kullanılıyor');
            } else {
                hideFieldError(this);
            }
        }
    });

    document.getElementById('registerName').addEventListener('blur', function() {
        if (this.value && !validateName(this.value)) {
            showFieldError(this, 'Ad soyad en az 2 karakter olmalıdır');
        } else {
            hideFieldError(this);
        }
    });

    const registerPasswordConfirm = document.getElementById('registerPasswordConfirm');
    if (registerPasswordConfirm) {
        registerPasswordConfirm.addEventListener('input', function() {
            const password = document.getElementById('registerPassword').value;
            if (this.value && this.value !== password) {
                showFieldError(this, 'Şifreler eşleşmiyor');
            } else {
                hideFieldError(this);
            }
        });
    }

    // Enhanced form interactions
    document.querySelectorAll('.form-control-modern').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.parentNode.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentNode.parentNode.classList.remove('focused');
        });

        // Clear error on input
        input.addEventListener('input', function() {
            if (this.parentNode.parentNode.classList.contains('error')) {
                hideFieldError(this);
            }
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            const activeForm = document.querySelector('.auth-form.active');
            if (activeForm) {
                const submitBtn = activeForm.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            }
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Add login page class to body
    document.body.classList.add('login-page');
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Check for auto-login and load users
    await checkAutoLogin();
});