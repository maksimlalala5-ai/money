// mobile-menu.js - Управление мобильным меню
console.log('📱 Загрузка мобильного меню...');

function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebar = document.getElementById('closeSidebar');
    
    if (!mobileMenuToggle || !sidebar) {
        console.warn('Элементы мобильного меню не найдены');
        return;
    }
    
    // Открытие меню
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.add('mobile-open');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Закрытие меню
    function closeMobileMenu() {
        sidebar.classList.remove('mobile-open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Кнопка закрытия
    if (closeSidebar) {
        closeSidebar.addEventListener('click', closeMobileMenu);
    }
    
    // Клик по overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Закрытие при клике на пункт меню (на мобильных)
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
    
    // Обновление информации пользователя в меню
    function updateMobileMenuUserInfo(user, userData) {
        const avatar = document.getElementById('sidebarUserAvatar');
        const name = document.getElementById('sidebarUserName');
        const email = document.getElementById('sidebarUserEmail');
        
        if (avatar) {
            avatar.textContent = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
        }
        if (name) {
            name.textContent = user.displayName || userData?.name || 'Пользователь';
        }
        if (email) {
            email.textContent = user.email || '';
        }
    }
    
    // Экспортируем функцию обновления
    window.updateMobileMenuUserInfo = updateMobileMenuUserInfo;
    
    console.log('✅ Мобильное меню инициализировано');
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initializeMobileMenu);

// Экспорт
window.MobileMenu = {
    initialize: initializeMobileMenu
};