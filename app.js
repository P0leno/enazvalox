// Инициализация Telegram Mini App
let tg = window.Telegram?.WebApp;

// Инициализация приложения при загрузке
if (tg) {
    tg.ready();
    tg.expand(); // Разворачиваем приложение на весь экран
    console.log('Telegram Web App инициализирован');
    
    // Настройка цветовой схемы Telegram
    tg.setHeaderColor('#667eea');
    tg.setBackgroundColor('#667eea');
}

// Данные о предметах (хранятся в LocalStorage, можно использовать Telegram CloudStorage)
let subjects = JSON.parse(localStorage.getItem('subjects')) || [
    { name: 'Математика', grade: 5 },
    { name: 'Русский язык', grade: 4 },
    { name: 'Английский язык', grade: 5 }
];

// Функция для расчета статистики
function calculateStats() {
    const totalSubjects = subjects.length;
    const totalGrade = subjects.reduce((sum, subject) => sum + subject.grade, 0);
    const averageGrade = totalSubjects > 0 ? (totalGrade / totalSubjects).toFixed(2) : 0;
    const excellentCount = subjects.filter(s => s.grade === 5).length;
    
    // Простой расчет прогресса (можно улучшить)
    const improvement = totalSubjects > 0 ? Math.round((excellentCount / totalSubjects) * 100) : 0;
    
    // Обновление UI
    document.getElementById('averageGrade').textContent = averageGrade;
    document.getElementById('totalSubjects').textContent = totalSubjects;
    document.getElementById('excellentCount').textContent = excellentCount;
    document.getElementById('improvement').textContent = improvement + '%';
    
    updateAchievements();
}

// Функция для отображения предметов
function renderSubjects() {
    const subjectsList = document.getElementById('subjectsList');
    subjectsList.innerHTML = '';
    
    if (subjects.length === 0) {
        subjectsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Пока нет предметов. Добавьте первый предмет!</p>';
        return;
    }
    
    subjects.forEach((subject, index) => {
        const subjectItem = document.createElement('div');
        subjectItem.className = 'subject-item';
        subjectItem.innerHTML = `
            <div class="subject-name">${subject.name}</div>
            <div class="subject-grade">
                <div class="grade-badge grade-${subject.grade}">${subject.grade}</div>
                <button class="delete-btn" onclick="deleteSubject(${index})" title="Удалить">×</button>
            </div>
        `;
        subjectsList.appendChild(subjectItem);
    });
}

// Функция для обновления достижений
function updateAchievements() {
    const achievementsList = document.getElementById('achievementsList');
    achievementsList.innerHTML = '';
    
    const achievements = [];
    
    // Проверка различных достижений
    const excellentCount = subjects.filter(s => s.grade === 5).length;
    const goodCount = subjects.filter(s => s.grade === 4).length;
    const totalSubjects = subjects.length;
    
    if (excellentCount >= 5) {
        achievements.push({ icon: '⭐', name: 'Звезда' });
    }
    if (totalSubjects >= 10) {
        achievements.push({ icon: '📚', name: 'Эрудит' });
    }
    if (excellentCount === totalSubjects && totalSubjects > 0) {
        achievements.push({ icon: '🏆', name: 'Отличник' });
    }
    if (totalSubjects >= 5) {
        achievements.push({ icon: '🎯', name: 'Упорство' });
    }
    if (goodCount + excellentCount === totalSubjects && totalSubjects > 0) {
        achievements.push({ icon: '✨', name: 'Успех' });
    }
    
    if (achievements.length === 0) {
        achievementsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Продолжайте учиться, чтобы получить достижения!</p>';
        return;
    }
    
    achievements.forEach(achievement => {
        const achievementItem = document.createElement('div');
        achievementItem.className = 'achievement-item';
        achievementItem.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-name">${achievement.name}</div>
        `;
        achievementsList.appendChild(achievementItem);
    });
}

// Функция для открытия модального окна
function addSubject() {
    document.getElementById('subjectModal').style.display = 'block';
    document.getElementById('subjectName').focus();
}

// Функция для закрытия модального окна
function closeModal() {
    document.getElementById('subjectModal').style.display = 'none';
    document.getElementById('subjectForm').reset();
}

// Функция для сохранения предмета
function saveSubject(event) {
    event.preventDefault();
    
    const subjectName = document.getElementById('subjectName').value;
    const subjectGrade = parseInt(document.getElementById('subjectGrade').value);
    
    // Проверка на дубликаты
    if (subjects.some(s => s.name.toLowerCase() === subjectName.toLowerCase())) {
        alert('Этот предмет уже добавлен!');
        return;
    }
    
    subjects.push({ name: subjectName, grade: subjectGrade });
    saveData();
    renderSubjects();
    calculateStats();
    closeModal();
}

// Функция для удаления предмета
function deleteSubject(index) {
    if (confirm('Вы уверены, что хотите удалить этот предмет?')) {
        subjects.splice(index, 1);
        saveData();
        renderSubjects();
        calculateStats();
    }
}

// Функция для очистки данных
function clearData() {
    if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
        subjects = [];
        saveData();
        renderSubjects();
        calculateStats();
    }
}

// Функция для сохранения данных
function saveData() {
    localStorage.setItem('subjects', JSON.stringify(subjects));
    
    // Если используется Telegram CloudStorage (доступно в ботах)
    if (tg && tg.CloudStorage) {
        tg.CloudStorage.setItem('subjects', JSON.stringify(subjects));
    }
}

// Функция для загрузки данных из Telegram CloudStorage (если доступно)
function loadDataFromTelegram() {
    if (tg && tg.CloudStorage) {
        tg.CloudStorage.getItem('subjects', function(err, value) {
            if (!err && value) {
                try {
                    const tgSubjects = JSON.parse(value);
                    if (tgSubjects.length > 0) {
                        subjects = tgSubjects;
                        renderSubjects();
                        calculateStats();
                    }
                } catch (e) {
                    console.error('Ошибка при загрузке данных из Telegram CloudStorage:', e);
                }
            }
        });
    }
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('subjectModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Загрузка данных из Telegram CloudStorage (если доступно)
    loadDataFromTelegram();
    
    // Отображение данных
    renderSubjects();
    calculateStats();
    
    console.log('Приложение инициализировано');
    
    // Показываем кнопку "Назад" если приложение открыто в Telegram
    if (tg) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            tg.close();
        });
    }
});
