let map;
let tesislerData = [];
let inverterlerData = [];
let selectedFacility = null;
let currentUser = null;
let userFacilities = [];
let userInverters = [];

// Kullanıcı oturum kontrolü ve yetkilendirme
function checkUserSession() {
    const savedLogin = sessionStorage.getItem('pixelLogin');
    
    if (!savedLogin) {
        window.location.href = 'login.html';
        return false;
    }
    
    const loginData = JSON.parse(savedLogin);
    currentUser = loginData.user;
    
    // Kullanıcı bilgilerini navbar'a yükle
    loadUserInfo(currentUser);
    
    // Kullanıcı yetkilerini kontrol et
    checkUserPermissions();
    
    return true;
}

// Kullanıcı yetkilerini kontrol et ve sayfayı düzenle
function checkUserPermissions() {
    if (!currentUser || !currentUser.permissions) {
        console.warn('Kullanıcı yetkileri bulunamadı');
        return;
    }
    
    // Navigation menüsünü kullanıcı yetkilerine göre düzenle
    const navItems = document.querySelectorAll('.nav-item .nav-link');
    
    navItems.forEach(link => {
        const href = link.getAttribute('href');
        const icon = link.querySelector('i');
        
        if (icon) {
            if (icon.classList.contains('fa-building') && !currentUser.permissions.includes('facilities')) {
                link.closest('.nav-item').style.display = 'none';
            } else if (icon.classList.contains('fa-microchip') && !currentUser.permissions.includes('inverters')) {
                link.closest('.nav-item').style.display = 'none';
            } else if (icon.classList.contains('fa-users') && !currentUser.permissions.includes('users')) {
                link.closest('.nav-item').style.display = 'none';
            } else if (icon.classList.contains('fa-cog') && !currentUser.permissions.includes('settings')) {
                link.closest('.nav-item').style.display = 'none';
            }
        }
    });
    
    // Sayfa başlığına kullanıcı rolü ekle
    updatePageTitle();
}

// Sayfa başlığını güncelle
function updatePageTitle() {
    const roleTexts = {
        'admin': 'Yönetici',
        'user': 'Kullanıcı',
        'operator': 'Operatör',
        'analyst': 'Analist'
    };
    
    const roleText = roleTexts[currentUser.role] || 'Kullanıcı';
    document.title = `PIXEL - ${roleText} Paneli`;
}

// Navbar'a kullanıcı bilgilerini yükle
function loadUserInfo(user) {
    const userDropdown = document.getElementById('userDropdown');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userDropdown && userName && userAvatar) {
        userName.textContent = user.name;
        userAvatar.src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`;
        userDropdown.style.display = 'block';
    }
    
    // Kullanıcı dropdown menüsünü güncelle
    updateUserDropdownMenu(user);
}

// Kullanıcı dropdown menüsünü güncelle
function updateUserDropdownMenu(user) {
    const dropdown = document.querySelector('#userDropdown .dropdown-menu');
    if (!dropdown) {
        console.error('Dropdown menu bulunamadı!');
        return;
    }
    
    const roleTexts = {
        'admin': { text: 'Yönetici', color: '#ef4444' },
        'user': { text: 'Kullanıcı', color: '#3b82f6' },
        'operator': { text: 'Operatör', color: '#10b981' },
        'analyst': { text: 'Analist', color: '#8b5cf6' }
    };
    
    const role = roleTexts[user.role] || { text: 'Kullanıcı', color: '#6b7280' };
    
    // Mevcut dropdown içeriğini temizle ve yeniden oluştur
    dropdown.innerHTML = `
        <!-- Kullanıcı Bilgi Bölümü -->
        <div class="dropdown-header px-3 py-2" style="background: linear-gradient(135deg, #f8fafc, #e2e8f0); border-bottom: 1px solid #e5e7eb;">
            <div class="d-flex align-items-center mb-2">
                <img src="${user.avatar}" alt="Avatar" class="rounded-circle me-2" width="32" height="32">
                <div>
                    <div class="fw-bold text-dark" style="font-size: 0.9rem;">${user.name}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${user.email}</div>
                </div>
            </div>
            <div class="d-flex align-items-center justify-content-between">
                <span class="badge px-2 py-1" style="background: ${role.color}; color: white; font-size: 0.7rem;">${role.text}</span>
                ${user.department ? `<small class="text-muted" style="font-size: 0.7rem;">${user.department}</small>` : ''}
            </div>
            <div class="mt-2 pt-2" style="border-top: 1px solid #e5e7eb;">
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted" style="font-size: 0.7rem;">Erişilebilir Tesisler</small>
                    <span class="badge bg-primary" style="font-size: 0.7rem;" id="dropdown-facilities-count">-</span>
                </div>
            </div>
        </div>
        
        <!-- Menü Öğeleri -->
        <li><a class="dropdown-item" href="#"><i class="fas fa-user me-2"></i>Profil</a></li>
        <li><a class="dropdown-item" href="#"><i class="fas fa-cog me-2"></i>Ayarlar</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item text-danger" href="#" onclick="handleLogout()"><i class="fas fa-sign-out-alt me-2"></i>Çıkış Yap</a></li>
    `;
    
    console.log('User dropdown menu updated for:', user.name);
    console.log('Dropdown HTML:', dropdown.innerHTML);
}

// Kullanıcının erişebileceği tesisleri filtrele
function filterUserFacilities(allFacilities) {
    if (!currentUser || !currentUser.assignedFacilities) {
        return [];
    }
    
    // Admin kullanıcı tüm tesislere erişebilir
    if (currentUser.assignedFacilities === "*" || currentUser.role === 'admin') {
        userFacilities = allFacilities;
        return allFacilities;
    }
    
    // Belirli tesislere erişimi olan kullanıcılar
    userFacilities = allFacilities.filter(facility => 
        currentUser.assignedFacilities.includes(facility.id)
    );
    
    return userFacilities;
}

// Kullanıcının erişebileceği inverterleri filtrele
function filterUserInverters(allInverters, userFacilities) {
    if (!userFacilities || userFacilities.length === 0) {
        return [];
    }
    
    const facilityIds = userFacilities.map(f => f.id);
    userInverters = allInverters.filter(inverter => 
        facilityIds.includes(inverter.tesisId)
    );
    
    return userInverters;
}

// Tüm verileri yükle ve kullanıcı yetkilerine göre filtrele
async function loadAllData() {
    try {
        // Loading göster
        document.getElementById('loading-indicator').style.display = 'block';
        document.getElementById('desktop-table').style.display = 'none';
        document.getElementById('mobile-cards').style.display = 'none';

        // Paralel olarak her iki JSON dosyasını yükle
        const [tesislerResponse, inverterlerResponse] = await Promise.all([
            fetch('tesisler.json'),
            fetch('inventerler.json')
        ]);
        
        if (!tesislerResponse.ok || !inverterlerResponse.ok) {
            throw new Error('Veri dosyaları yüklenirken hata oluştu');
        }
        
        const tesislerResult = await tesislerResponse.json();
        const inverterlerResult = await inverterlerResponse.json();
        
        // Tüm verileri yükle
        tesislerData = tesislerResult.tesisler;
        inverterlerData = inverterlerResult.inverterler;
        
        // Kullanıcı yetkilerine göre filtrele
        const filteredFacilities = filterUserFacilities(tesislerData);
        const filteredInverters = filterUserInverters(inverterlerData, filteredFacilities);
        
        // Erişilebilir tesis sayısını güncelle
        updateAccessibleFacilitiesCount(filteredFacilities.length);
        
        // Tabloları filtreli verilerle doldur
        populateDesktopTable(filteredFacilities);
        populateMobileCards(filteredFacilities);
        populateInverterTable(filteredInverters, filteredFacilities);
        populateInverterMobileCards(filteredInverters, filteredFacilities);
        
        // Loading gizle, tabloları göster
        document.getElementById('loading-indicator').style.display = 'none';
        
        if (filteredFacilities.length === 0) {
            showNoAccessMessage();
        } else {
            document.getElementById('desktop-table').style.display = 'block';
            document.getElementById('mobile-cards').style.display = 'block';
        }
        
    } catch (error) {
        console.error('Veriler yüklenirken hata:', error);
        document.getElementById('loading-indicator').innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            Veriler yüklenirken hata oluştu: ${error.message}
        `;
    }
}

// Erişilebilir tesis sayısını güncelle
function updateAccessibleFacilitiesCount(count) {
    // Navbar dropdown'daki sayıyı güncelle
    const dropdownCountElement = document.getElementById('dropdown-facilities-count');
    if (dropdownCountElement) {
        dropdownCountElement.textContent = count;
    }
}

// Erişim yok mesajı göster
function showNoAccessMessage() {
    const container = document.querySelector('.container');
    const noAccessCard = document.createElement('div');
    noAccessCard.className = 'modern-card mb-4';
    noAccessCard.innerHTML = `
        <div class="card-body-modern text-center py-5">
            <i class="fas fa-lock fa-3x text-warning mb-3"></i>
            <h5>Erişim Yetkiniz Bulunmuyor</h5>
            <p class="text-muted">Bu hesapla erişebileceğiniz tesis bulunmamaktadır. Lütfen yönetici ile iletişime geçin.</p>
            <button class="btn-primary-modern" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt me-2"></i>Çıkış Yap
            </button>
        </div>
    `;
    
    // Mevcut kartları gizle
    document.querySelector('.modern-card').style.display = 'none';
    container.appendChild(noAccessCard);
}

// Desktop tablosunu doldur (filtreli)
function populateDesktopTable(facilities = userFacilities) {
    const tbody = document.getElementById('tesis-table-body');
    tbody.innerHTML = '';
    
    if (facilities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="fas fa-info-circle me-2"></i>
                    Erişebileceğiniz tesis bulunmamaktadır
                </td>
            </tr>
        `;
        return;
    }
    
    facilities.forEach(tesis => {
        const row = document.createElement('tr');
        const durumClass = tesis.durum === 'aktif' ? 'btn-status-active' : 'btn-status-inactive';
        const durumText = tesis.durum === 'aktif' ? 'Aktif' : 'Deaktif';
        
        row.innerHTML = `
            <td><strong>${tesis.isim}</strong></td>
            <td>${tesis.konum}</td>
            <td>${tesis.toplamEnerji}</td>
            <td>${tesis.gunlukEnerji}</td>
            <td>
                <button class="btn-status ${durumClass}" onclick="showDetail('${tesis.id}')">
                    ${durumText}
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// İnverter tablosunu doldur (filtreli)
function populateInverterTable(inverters = userInverters, facilities = userFacilities) {
    const tbody = document.querySelector('#inventerlar .table-responsive tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (inverters.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="fas fa-info-circle me-2"></i>
                    Erişebileceğiniz inverter bulunmamaktadır
                </td>
            </tr>
        `;
        return;
    }
    
    inverters.forEach(inverter => {
        // İlgili tesis bilgisini bul
        const tesis = facilities.find(t => t.id === inverter.tesisId);
        const tesisAdi = tesis ? tesis.isim : 'Erişim Yok';
        const aylıkEnerji = tesis ? tesis.toplamEnerji : 'N/A';
        const gunlukEnerji = tesis ? tesis.gunlukEnerji : 'N/A';
        
        const durumClass = inverter.durum === 'aktif' ? 'btn-status-active' : 'btn-status-inactive';
        const durumText = inverter.durum === 'aktif' ? 'Aktif' : 'Deaktif';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${inverter.seriNo}</strong></td>
            <td><strong>${tesisAdi}</strong></td>
            <td>${aylıkEnerji}</td>
            <td>${gunlukEnerji}</td>
            <td>
                <button class="btn-status ${durumClass}">
                    ${durumText}
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// İnverter mobile kartlarını doldur (filtreli)
function populateInverterMobileCards(inverters = userInverters, facilities = userFacilities) {
    const container = document.querySelector('#inventerlar .mobile-cards');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (inverters.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-info-circle me-2"></i>
                Erişebileceğiniz inverter bulunmamaktadır
            </div>
        `;
        return;
    }
    
    inverters.forEach(inverter => {
        // İlgili tesis bilgisini bul
        const tesis = facilities.find(t => t.id === inverter.tesisId);
        const tesisAdi = tesis ? tesis.isim : 'Erişim Yok';
        const toplamEnerji = tesis ? tesis.toplamEnerji : 'N/A';
        const yıllıkEnerji = '652.649 kW'; // Sabit değer
        const aylıkEnerji = tesis ? tesis.toplamEnerji : 'N/A';
        const gunlukEnerji = tesis ? tesis.gunlukEnerji : 'N/A';
        
        const durumClass = inverter.durum === 'aktif' ? 'btn-status-active' : 'btn-status-inactive';
        const durumText = inverter.durum === 'aktif' ? 'Aktif' : 'Deaktif';
        
        const card = document.createElement('div');
        card.className = 'mobile-card';
        card.innerHTML = `
            <div class="mobile-card-title">${inverter.seriNo}</div>
            <div class="mobile-card-info">
                <span class="mobile-card-label">Tesis Adı:</span>
                <span class="mobile-card-value">${tesisAdi}</span>
            </div>
            <div class="mobile-card-info">
                <span class="mobile-card-label">Toplam Enerji:</span>
                <span class="mobile-card-value">${toplamEnerji}</span>
            </div>
            <div class="mobile-card-info">
                <span class="mobile-card-label">Yıllık Enerji:</span>
                <span class="mobile-card-value">${yıllıkEnerji}</span>
            </div>
            <div class="mobile-card-info">
                <span class="mobile-card-label">Aylık Enerji:</span>
                <span class="mobile-card-value">${aylıkEnerji}</span>
            </div>
            <div class="mobile-card-info">
                <span class="mobile-card-label">Günlük Enerji:</span>
                <span class="mobile-card-value">${gunlukEnerji}</span>
            </div>
            <div class="text-center mt-3">
                <button class="btn-status ${durumClass}">
                    ${durumText}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Mobile kartları doldur (filtreli)
function populateMobileCards(facilities = userFacilities) {
    const container = document.getElementById('mobile-cards');
    container.innerHTML = '';
    
    if (facilities.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-info-circle me-2"></i>
                Erişebileceğiniz tesis bulunmamaktadır
            </div>
        `;
        return;
    }
    
    facilities.forEach(tesis => {
        const durumClass = tesis.durum === 'aktif' ? 'btn-status-active' : 'btn-status-inactive';
        const durumText = tesis.durum === 'aktif' ? 'Aktif' : 'Deaktif';
        
        const card = document.createElement('div');
        card.className = 'mobile-card';
        card.innerHTML = `
            <div class="mobile-card-title">${tesis.isim}</div>
            <div class="mobile-card-info">
                <span class="mobile-card-label">Konum:</span>
                <span class="mobile-card-value">${tesis.konum}</span>
            </div>
            <div class="mobile-card-info">
                <span class="mobile-card-label">Toplam Enerji:</span>
                <span class="mobile-card-value">${tesis.toplamEnerji}</span>
            </div>
            <div class="mobile-card-info">
                <span class="mobile-card-label">Günlük Enerji:</span>
                <span class="mobile-card-value">${tesis.gunlukEnerji}</span>
            </div>
            <div class="text-center mt-3">
                <button class="btn-status ${durumClass}" onclick="showDetail('${tesis.id}')">
                    ${durumText}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Çıkış yapma fonksiyonu
function handleLogout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        sessionStorage.removeItem('pixelLogin');
        window.location.href = 'login.html';
    }
}

// Navigation
function showDetail(id) {
    // Sadece kullanıcının erişebileceği tesislerde detay göster
    selectedFacility = userFacilities.find(tesis => tesis.id === id);
    
    if (!selectedFacility) {
        alert('Bu tesise erişim yetkiniz bulunmamaktadır.');
        return;
    }
    
    // Detay sayfasındaki verileri güncelle
    document.getElementById('detail-facility-name').textContent = selectedFacility.isim;
    document.getElementById('detail-toplam-enerji').textContent = selectedFacility.toplamEnerji.replace(' kW', '');
    document.getElementById('detail-gunluk-enerji').textContent = selectedFacility.gunlukEnerji.replace(' kW', '');
    
    const durumElement = document.getElementById('detail-durum');
    if (selectedFacility.durum === 'aktif') {
        durumElement.textContent = 'Aktif';
        durumElement.style.background = 'var(--success)';
        durumElement.style.width = '100%';
    } else {
        durumElement.textContent = 'Deaktif';
        durumElement.style.background = 'var(--danger)';
        durumElement.style.width = '100%';
    }
    
    document.getElementById('main-dashboard').style.display = 'none';
    document.getElementById('detail-page').style.display = 'block';
    initCharts();
}

function showDashboard() {
    document.getElementById('main-dashboard').style.display = 'block';
    document.getElementById('detail-page').style.display = 'none';
}

// Map initialization (sadece kullanıcının tesisleri)
function initMap() {
    map = L.map('map').setView([39.1, 35.3], 6);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Sadece kullanıcının erişebileceği tesisleri haritaya ekle
    userFacilities.forEach(tesis => {
        const marker = L.marker([tesis.koordinatlar.lat, tesis.koordinatlar.lng]).addTo(map);
        
        const popupContent = `
            <div style="padding: 10px; text-align: center;">
                <strong style="color: #3b82f6; font-size: 16px;">${tesis.isim}</strong><br>
                <span style="color: #6b7280; margin: 5px 0; display: block;">${tesis.konum}</span>
                <div style="margin: 8px 0;">
                    <small style="color: #6b7280;">Toplam: ${tesis.toplamEnerji}</small><br>
                    <small style="color: #6b7280;">Günlük: ${tesis.gunlukEnerji}</small>
                </div>
                <button onclick="showDetail('${tesis.id}')" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin-top: 8px; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Detayları Gör</button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
    });
    
    // Eğer tesisler varsa haritayı onlara göre ayarla
    if (userFacilities.length > 0) {
        const group = new L.featureGroup(userFacilities.map(tesis => 
            L.marker([tesis.koordinatlar.lat, tesis.koordinatlar.lng])
        ));
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Charts initialization
function initCharts() {
    Chart.defaults.color = '#374151';
    Chart.defaults.borderColor = '#e5e7eb';

    // Chart 1
    new Chart(document.getElementById('chart1'), {
        type: 'doughnut',
        data: {
            labels: ['Üretim', 'Kapasite'],
            datasets: [{
                data: [103.649, 46.351],
                backgroundColor: ['#3b82f6', '#e5e7eb'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                            weight: 500
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });

    // Chart 2 - Line
    new Chart(document.getElementById('chart2'), {
        type: 'line',
        data: {
            labels: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
            datasets: [{
                label: 'Yıllık Enerji (kW)',
                data: [20, 35, 45, 55, 70, 80, 90, 85, 75, 65, 50, 40],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f3f4f6'
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });

    // Chart 3 - Area
    new Chart(document.getElementById('chart3'), {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => i + ':00'),
            datasets: [{
                label: 'Günlük Enerji (kW)',
                data: [0, 0, 0, 0, 0, 5, 15, 25, 35, 45, 50, 55, 60, 55, 50, 45, 35, 25, 15, 10, 5, 0, 0, 0],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#10b981',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f3f4f6'
                    },
                    ticks: {
                        color: '#6b7280',
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 8,
                        color: '#6b7280',
                        font: {
                            size: 11
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Debug fonksiyonları
window.getUserFacilities = function() {
    console.log('Kullanıcının Tesisleri:', userFacilities);
    return userFacilities;
};

window.getUserInverters = function() {
    console.log('Kullanıcının İnverterleri:', userInverters);
    return userInverters;
};

window.getCurrentUserInfo = function() {
    console.log('Mevcut Kullanıcı:', currentUser);
    return currentUser;
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // İlk olarak kullanıcı oturumu kontrol et
    if (!checkUserSession()) {
        return; // Oturum yoksa login sayfasına yönlendirildi
    }
    
    // Tüm verileri yükle ve kullanıcı yetkilerine göre filtrele
    await loadAllData();
    
    // Haritayı başlat (filtreli verilerle)
    initMap();
    
    // Mobile navigation improvements
    initializeMobileNavigation();
    
    // Close mobile menu when nav link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            const navbarToggler = document.querySelector('.navbar-toggler');
            const navbarCollapse = document.querySelector('.navbar-collapse');
            
            if (navbarCollapse.classList.contains('show')) {
                navbarToggler.click();
            }
        });
    });
});

// Mobile navigation enhancements
function initializeMobileNavigation() {
    const userDropdown = document.getElementById('userDropdown');
    const navbarToggler = document.querySelector('.navbar-toggler');
    
    if (userDropdown && navbarToggler) {
        // Mobile'da user dropdown tıklaması
        const userDropdownLink = userDropdown.querySelector('.dropdown-toggle');
        
        if (userDropdownLink) {
            userDropdownLink.addEventListener('click', function(e) {
                console.log('User dropdown clicked, screen width:', window.innerWidth);
                
                // Mobil görünümde mi kontrol et
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const dropdownMenu = userDropdown.querySelector('.dropdown-menu');
                    console.log('Dropdown menu found:', !!dropdownMenu);
                    
                    if (dropdownMenu) {
                        // Dropdown menüyü toggle et
                        if (dropdownMenu.style.display === 'block') {
                            dropdownMenu.style.display = 'none';
                            userDropdown.classList.remove('show');
                            console.log('Dropdown hidden');
                        } else {
                            dropdownMenu.style.display = 'block';
                            userDropdown.classList.add('show');
                            console.log('Dropdown shown');
                        }
                    } else {
                        console.error('Dropdown menu not found!');
                    }
                }
            });
        }
    }
    
    // Window resize eventini dinle
    window.addEventListener('resize', function() {
        const userDropdown = document.getElementById('userDropdown');
        if (userDropdown && window.innerWidth > 768) {
            // Desktop'ta dropdown'ı sıfırla
            const dropdownMenu = userDropdown.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.style.display = '';
                userDropdown.classList.remove('show');
            }
        }
    });
    
    // Document click ile dropdown'ı kapat (mobile)
    document.addEventListener('click', function(e) {
        const userDropdown = document.getElementById('userDropdown');
        if (userDropdown && window.innerWidth <= 768) {
            if (!userDropdown.contains(e.target)) {
                const dropdownMenu = userDropdown.querySelector('.dropdown-menu');
                if (dropdownMenu) {
                    dropdownMenu.style.display = 'none';
                    userDropdown.classList.remove('show');
                }
            }
        }
    });
}

// Debug fonksiyonu - kullanıcı dropdown durumunu kontrol et
function debugUserDropdown() {
    const userDropdown = document.getElementById('userDropdown');
    const dropdownMenu = userDropdown?.querySelector('.dropdown-menu');
    
    console.log('=== User Dropdown Debug ===');
    console.log('User dropdown element:', userDropdown);
    console.log('Dropdown menu element:', dropdownMenu);
    console.log('Current user:', currentUser);
    console.log('Screen width:', window.innerWidth);
    
    if (dropdownMenu) {
        console.log('Dropdown menu HTML:', dropdownMenu.innerHTML);
        console.log('Dropdown menu display:', dropdownMenu.style.display);
        console.log('Dropdown menu classes:', dropdownMenu.classList.toString());
    }
}

// Global debug fonksiyonu
window.debugUserDropdown = debugUserDropdown;