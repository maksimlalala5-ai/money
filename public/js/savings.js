// savings.js - Управление накоплениями
console.log('💰 Загрузка модуля накоплений...');

// Инициализация модуля
function initializeSavingsModule() {
    console.log('🔧 Инициализация модуля накоплений...');
    
    // Настраиваем форму добавления накоплений
    const savingForm = document.getElementById('savingForm');
    if (savingForm) {
        savingForm.removeEventListener('submit', handleSavingSubmit);
        savingForm.addEventListener('submit', handleSavingSubmit);
        console.log('✅ Форма накоплений инициализирована');
    }
    
    // Настраиваем кнопку открытия модального окна
    const addSavingBtn = document.querySelector('button[onclick*="showAddSavingModal"]');
    if (addSavingBtn) {
        addSavingBtn.onclick = () => window.UI.showAddSavingModal();
    }
}

// Обработка формы накоплений
async function handleSavingSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('savingTitle').value.trim();
    const target = parseFloat(document.getElementById('savingAmount').value);
    const current = parseFloat(document.getElementById('savingCurrent').value) || 0;
    const targetDate = document.getElementById('savingDate').value;
    const category = document.getElementById('savingCategory').value.trim();
    
    if (!title || !target || target <= 0) {
        window.UI.showNotification('Заполните обязательные поля', 'error');
        return;
    }
    
    if (current > target) {
        window.UI.showNotification('Текущая сумма не может превышать целевую', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.innerHTML = '<div class="spinner"></div> Создание...';
    submitBtn.disabled = true;
    
    try {
        await window.Data.addSaving({
            title,
            target,
            current,
            targetDate: targetDate ? new Date(targetDate) : null,
            category: category || undefined
        });
        
        window.UI.showNotification('Накопление успешно создано', 'success');
        window.UI.closeModal('addSavingModal');
        
        // Обновляем страницу накоплений
        if (document.getElementById('savings').classList.contains('active')) {
            await window.Data.loadSavingsData?.();
        }
        
    } catch (error) {
        window.UI.showNotification(error.message, 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}
// === Функции для работы с Firestore (добавить перед экспортом) ===

async function addSaving(savingData) {
    try {
        const { db } = window.firebaseApp.getFirebaseServices();
        const user = window.Auth?.getCurrentUser?.();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        if (!window.firebase || !window.firebase.firestore) {
            throw new Error('Firebase Firestore не инициализирован');
        }
        
        const saving = {
            ...savingData,
            userId: user.uid,
            progress: (savingData.current / savingData.target) * 100,
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('savings').add(saving);
        console.log('💰 Накопление добавлено:', docRef.id);
        
        return { success: true, id: docRef.id };
        
    } catch (error) {
        console.error('❌ Ошибка добавления накопления:', error);
        throw error;
    }
}

async function getSavings() {
    try {
        const { db } = window.firebaseApp.getFirebaseServices();
        const user = window.Auth?.getCurrentUser?.();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        const snapshot = await db.collection('savings')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        const savings = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            savings.push({
                id: doc.id,
                ...data,
                // Конвертируем Firebase Timestamp в Date если нужно
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
            });
        });
        
        console.log(`💰 Загружено ${savings.length} накоплений`);
        return savings;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки накоплений:', error);
        throw error;
    }
}

async function updateSaving(savingId, updateData) {
    try {
        const { db } = window.firebaseApp.getFirebaseServices();
        const user = window.Auth?.getCurrentUser?.();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        if (!window.firebase || !window.firebase.firestore) {
            throw new Error('Firebase Firestore не инициализирован');
        }
        
        await db.collection('savings').doc(savingId).update({
            ...updateData,
            progress: (updateData.current / updateData.target) * 100,
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('💰 Накопление обновлено:', savingId);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Ошибка обновления накопления:', error);
        throw error;
    }
}

async function deleteSaving(savingId) {
    try {
        const { db } = window.firebaseApp.getFirebaseServices();
        const user = window.Auth?.getCurrentUser?.();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        const savingDoc = await db.collection('savings').doc(savingId).get();
        
        if (!savingDoc.exists) throw new Error('Накопление не найдено');
        if (savingDoc.data().userId !== user.uid) throw new Error('Нет прав для удаления');
        
        await db.collection('savings').doc(savingId).delete();
        console.log('🗑️ Накопление удалено:', savingId);
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Ошибка удаления накопления:', error);
        throw error;
    }
}

// Экспорт функций
window.Savings = {
    initialize: initializeSavingsModule,
    handleSavingSubmit
};

console.log('✅ Модуль накоплений загружен');

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initializeSavingsModule);