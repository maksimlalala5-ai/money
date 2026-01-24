// data.js - Работа с данными Firestore
console.log('📊 Загрузка модуля данных...');

// Используем window.firebase напрямую для избежания дублирующих объявлений

// Категории транзакций
const CATEGORIES = {
    income: [
        { id: 'salary', name: 'Зарплата', icon: '💼', color: '#48bb78' },
        { id: 'freelance', name: 'Фриланс', icon: '💻', color: '#4299e1' },
        { id: 'investment', name: 'Инвестиции', icon: '📈', color: '#ed8936' },
        { id: 'gift', name: 'Подарки', icon: '🎁', color: '#ed64a6' },
        { id: 'other_income', name: 'Другое', icon: '💰', color: '#9f7aea' }
    ],
    expense: [
        { id: 'food', name: 'Продукты', icon: '🛒', color: '#48bb78' },
        { id: 'transport', name: 'Транспорт', icon: '🚗', color: '#4299e1' },
        { id: 'housing', name: 'Жилье', icon: '🏠', color: '#ed8936' },
        { id: 'utilities', name: 'Коммуналка', icon: '💡', color: '#f56565' },
        { id: 'entertainment', name: 'Развлечения', icon: '🎬', color: '#805ad5' },
        { id: 'health', name: 'Здоровье', icon: '🏥', color: '#48bb78' },
        { id: 'education', name: 'Образование', icon: '📚', color: '#ed8936' },
        { id: 'shopping', name: 'Покупки', icon: '🛍️', color: '#a0aec0' },
        { id: 'other_expense', name: 'Другое', icon: '📦', color: '#718096' }
    ]
};

// Получение услуг Firebase
function getFirebaseServices() {
    try {
        if (!window.firebaseApp) {
            throw new Error('Модуль Firebase не инициализирован');
        }
        return window.firebaseApp.getFirebaseServices();
    } catch (error) {
        console.error('❌ Ошибка получения Firebase сервисов:', error);
        throw error;
    }
}

// === ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ===

// Обновление задачи
async function updateTask(taskId, updateData) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        if (!window.firebase || !window.firebase.firestore) {
            throw new Error('Firebase Firestore не инициализирован');
        }
        
        await db.collection('tasks').doc(taskId).update({
            ...updateData,
            updatedAt: window.firebase && window.firebase.firestore
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : null
        });
        
        console.log('📝 Задача обновлена:', taskId);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Ошибка обновления задачи:', error);
        throw error;
    }
}

// Удаление задачи
async function deleteTask(taskId) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        // Проверяем принадлежность задачи
        const taskDoc = await db.collection('tasks').doc(taskId).get();
        
        if (!taskDoc.exists) throw new Error('Задача не найдена');
        if (taskDoc.data().userId !== user.uid) throw new Error('Нет прав для удаления');
        
        await db.collection('tasks').doc(taskId).delete();
        console.log('🗑️ Задача удалена:', taskId);
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Ошибка удаления задачи:', error);
        throw error;
    }
}

// Удаление цели
async function deleteGoal(goalId) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        const goalDoc = await db.collection('goals').doc(goalId).get();
        
        if (!goalDoc.exists) throw new Error('Цель не найдена');
        if (goalDoc.data().userId !== user.uid) throw new Error('Нет прав для удаления');
        
        await db.collection('goals').doc(goalId).delete();
        console.log('🗑️ Цель удалена:', goalId);
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Ошибка удаления цели:', error);
        throw error;
    }
}

// Обновление цели
async function updateGoal(goalId, updateData) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        if (!window.firebase || !window.firebase.firestore) {
            throw new Error('Firebase Firestore не инициализирован');
        }
        
        await db.collection('goals').doc(goalId).update({
            ...updateData,
            updatedAt: window.firebase && window.firebase.firestore
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : null
        });
        
        console.log('🎯 Цель обновлена:', goalId);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Ошибка обновления цели:', error);
        throw error;
    }
}


// === ТРАНЗАКЦИИ ===

// Добавление транзакции
async function addTransaction(transactionData) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        // Проверяем Firebase
        if (!window.firebase || !window.firebase.firestore) {
            throw new Error('Firebase Firestore не инициализирован');
        }
        
        const transaction = {
            ...transactionData,
            userId: user.uid,
            createdAt: window.firebase && window.firebase.firestore
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : null,
            updatedAt: window.firebase && window.firebase.firestore
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : null
        };
        
        const docRef = await db.collection('transactions').add(transaction);
        console.log('✅ Транзакция добавлена:', docRef.id);
        
        return { success: true, id: docRef.id };
        
    } catch (error) {
        console.error('❌ Ошибка добавления транзакции:', error);
        throw error;
    }
}

// Получение транзакций пользователя
async function getTransactions(limit = 50, startAfter = null) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        let query = db.collection('transactions')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .limit(limit);
        
        if (startAfter) {
            query = query.startAfter(startAfter);
        }
        
        const snapshot = await query.get();
        const transactions = [];
        
        snapshot.forEach(doc => {
            transactions.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`📋 Загружено ${transactions.length} транзакций`);
        return transactions;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки транзакций:', error);
        throw error;
    }
}

// Удаление транзакции
async function deleteTransaction(transactionId) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        // Проверяем, принадлежит ли транзакция пользователю
        const transactionDoc = await db.collection('transactions').doc(transactionId).get();
        
        if (!transactionDoc.exists) {
            throw new Error('Транзакция не найдена');
        }
        
        if (transactionDoc.data().userId !== user.uid) {
            throw new Error('Нет прав для удаления этой транзакции');
        }
        
        await db.collection('transactions').doc(transactionId).delete();
        console.log('🗑️ Транзакция удалена:', transactionId);
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Ошибка удаления транзакции:', error);
        throw error;
    }
}

// === ЦЕЛИ ===

// Добавление финансовой цели
async function addGoal(goalData) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        if (!window.firebase || !window.firebase.firestore) {
            throw new Error('Firebase Firestore не инициализирован');
        }
        
        const goal = {
            ...goalData,
            userId: user.uid,
            progress: (goalData.current / goalData.target) * 100,
            createdAt: window.firebase && window.firebase.firestore
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : null,
            updatedAt: window.firebase && window.firebase.firestore
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : null
        };
        
        const docRef = await db.collection('goals').add(goal);
        console.log('🎯 Цель добавлена:', docRef.id);
        
        return { success: true, id: docRef.id };
        
    } catch (error) {
        console.error('❌ Ошибка добавления цели:', error);
        throw error;
    }
}

// Обновление финансовой цели
async function updateGoal(goalId, updateData) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        if (!window.firebase || !window.firebase.firestore) {
            throw new Error('Firebase Firestore не инициализирован');
        }
        
        // Проверяем принадлежность цели
        const goalDoc = await db.collection('goals').doc(goalId).get();
        
        if (!goalDoc.exists) throw new Error('Цель не найдена');
        if (goalDoc.data().userId !== user.uid) throw new Error('Нет прав для редактирования');
        
        const updatedGoal = {
            ...updateData,
            progress: (updateData.current / updateData.target) * 100,
            updatedAt: window.firebase && window.firebase.firestore
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : null
        };
        
        await db.collection('goals').doc(goalId).update(updatedGoal);
        console.log('🎯 Цель обновлена:', goalId);
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Ошибка обновления цели:', error);
        throw error;
    }
}

// Получение целей пользователя
async function getGoals() {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        const snapshot = await db.collection('goals')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        const goals = [];
        snapshot.forEach(doc => {
            goals.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`🎯 Загружено ${goals.length} целей`);
        return goals;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки целей:', error);
        throw error;
    }
}

// === НАКОПЛЕНИЯ ===

// Добавление раздела накоплений
async function addSaving(savingData) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        if (!window.firebase || !window.firebase.firestore) {
            throw new Error('Firebase Firestore не инициализирован');
        }
        
        const saving = {
            ...savingData,
            userId: user.uid,
            progress: (savingData.current / savingData.target) * 100,
            createdAt: window.firebase && window.firebase.firestore
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : null,
            updatedAt: window.firebase && window.firebase.firestore
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : null
        };
        
        const docRef = await db.collection('savings').add(saving);
        console.log('💰 Раздел накоплений добавлен:', docRef.id);
        
        return { success: true, id: docRef.id };
        
    } catch (error) {
        console.error('❌ Ошибка добавления раздела накоплений:', error);
        throw error;
    }
}

// Получение разделов накоплений пользователя
async function getSavings() {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        const snapshot = await db.collection('savings')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        const savings = [];
        snapshot.forEach(doc => {
            savings.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`💰 Загружено ${savings.length} разделов накоплений`);
        return savings;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки разделов накоплений:', error);
        throw error;
    }
}

// Обновление раздела накоплений
async function updateSaving(savingId, updateData) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        if (!window.firebase || !window.firebase.firestore) {
            throw new Error('Firebase Firestore не инициализирован');
        }
        
        // Проверяем принадлежность раздела
        const savingDoc = await db.collection('savings').doc(savingId).get();
        
        if (!savingDoc.exists) throw new Error('Раздел накоплений не найден');
        if (savingDoc.data().userId !== user.uid) throw new Error('Нет прав для редактирования');
        
        const updatedSaving = {
            ...updateData,
            progress: (updateData.current / updateData.target) * 100,
            updatedAt: window.firebase && window.firebase.firestore
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : null
        };
        
        await db.collection('savings').doc(savingId).update(updatedSaving);
        console.log('💰 Раздел накоплений обновлен:', savingId);
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Ошибка обновления раздела накоплений:', error);
        throw error;
    }
}

// Удаление раздела накоплений
async function deleteSaving(savingId) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        // Проверяем принадлежность раздела
        const savingDoc = await db.collection('savings').doc(savingId).get();
        
        if (!savingDoc.exists) throw new Error('Раздел накоплений не найден');
        if (savingDoc.data().userId !== user.uid) throw new Error('Нет прав для удаления');
        
        await db.collection('savings').doc(savingId).delete();
        console.log('🗑️ Раздел накоплений удален:', savingId);
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Ошибка удаления раздела накоплений:', error);
        throw error;
    }
}

// === ЗАДАЧИ ===

// Добавление задачи
async function addTask(taskData) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        if (!window.firebase || !window.firebase.firestore) {
            throw new Error('Firebase Firestore не инициализирован');
        }
        
        const task = {
            ...taskData,
            userId: user.uid,
            completed: false,
            createdAt: window.firebase && window.firebase.firestore
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : null,
            updatedAt: window.firebase && window.firebase.firestore
                ? window.firebase.firestore.FieldValue.serverTimestamp()
                : null
        };
        
        const docRef = await db.collection('tasks').add(task);
        console.log('📝 Задача добавлена:', docRef.id);
        
        return { success: true, id: docRef.id };
        
    } catch (error) {
        console.error('❌ Ошибка добавления задачи:', error);
        throw error;
    }
}

// Получение задач пользователя
async function getTasks() {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        const snapshot = await db.collection('tasks')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        const tasks = [];
        snapshot.forEach(doc => {
            tasks.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`📝 Загружено ${tasks.length} задач`);
        return tasks;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки задач:', error);
        throw error;
    }
}

// === АНАЛИТИКА ===

// Получение статистики
async function getAnalytics(period = 'month') {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        
        // Получаем транзакции за период
        const snapshot = await db.collection('transactions')
            .where('userId', '==', user.uid)
            .where('createdAt', '>=', startDate)
            .get();
        
        let totalIncome = 0;
        let totalExpense = 0;
        const categories = {};
        
        snapshot.forEach(doc => {
            const data = doc.data();
            
            if (data.type === 'income') {
                totalIncome += parseFloat(data.amount) || 0;
            } else if (data.type === 'expense') {
                totalExpense += parseFloat(data.amount) || 0;
                
                // Группируем по категориям
                const category = data.category || 'other';
                if (!categories[category]) {
                    categories[category] = 0;
                }
                categories[category] += parseFloat(data.amount) || 0;
            }
        });
        
        // Преобразуем категории для диаграммы
        const categoryData = Object.entries(categories).map(([category, amount]) => ({
            category,
            amount
        }));
        
        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            categories: categoryData,
            period: period
        };
        
    } catch (error) {
        console.error('❌ Ошибка загрузки аналитики:', error);
        throw error;
    }
}

// === ДОЛГИ ===

// Добавление долга
async function addDebt(debtData) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        if (!window.firebase || !window.firebase.firestore) {
            throw new Error('Firebase Firestore не инициализирован');
        }
        
        const debt = {
            ...debtData,
            userId: user.uid,
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('debts').add(debt);
        console.log('💸 Долг добавлен:', docRef.id);
        
        return { success: true, id: docRef.id };
        
    } catch (error) {
        console.error('❌ Ошибка добавления долга:', error);
        throw error;
    }
}

// Получение долгов
async function getDebts() {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        const snapshot = await db.collection('debts')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        const debts = [];
        snapshot.forEach(doc => {
            debts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`💸 Загружено ${debts.length} долгов`);
        return debts;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки долгов:', error);
        throw error;
    }
}

// Обновление долга
async function updateDebt(debtId, updateData) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        if (!window.firebase || !window.firebase.firestore) {
            throw new Error('Firebase Firestore не инициализирован');
        }
        
        // Проверяем принадлежность долга
        const debtDoc = await db.collection('debts').doc(debtId).get();
        
        if (!debtDoc.exists) throw new Error('Долг не найден');
        if (debtDoc.data().userId !== user.uid) throw new Error('Нет прав для редактирования');
        
        await db.collection('debts').doc(debtId).update({
            ...updateData,
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('💸 Долг обновлен:', debtId);
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Ошибка обновления долга:', error);
        throw error;
    }
}

// Удаление долга
async function deleteDebt(debtId) {
    try {
        const { db } = getFirebaseServices();
        const user = window.Auth.getCurrentUser();
        
        if (!user) throw new Error('Пользователь не авторизован');
        
        // Проверяем принадлежность долга
        const debtDoc = await db.collection('debts').doc(debtId).get();
        
        if (!debtDoc.exists) throw new Error('Долг не найден');
        if (debtDoc.data().userId !== user.uid) throw new Error('Нет прав для удаления');
        
        await db.collection('debts').doc(debtId).delete();
        console.log('🗑️ Долг удален:', debtId);
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Ошибка удаления долга:', error);
        throw error;
    }
}

window.Data = {
    CATEGORIES,
    addTransaction,
    getTransactions,
    deleteTransaction,
    updateTask,       
    deleteTask,       
    updateGoal,       
    deleteGoal,
    addGoal,
    getGoals,
    addTask,
    getTasks,
    getAnalytics,
    addDebt,          
    getDebts,         
    updateDebt,       
    deleteDebt,       
    addSaving,        
    getSavings,       
    updateSaving,     
    deleteSaving     
};
