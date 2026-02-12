// ========== УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ ==========

class UIManager {
    constructor(game) {
        this.game = game;
        this.chart = null;
    }

    // Инициализация графиков
    initChart() {
        const ctx = document.getElementById('wealth-chart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: this.game.player.netWorthHistory.length }, (_, i) => `Месяц ${i}`),
                datasets: [{
                    label: 'Чистая стоимость',
                    data: this.game.player.netWorthHistory,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true
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
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    }
                }
            }
        });
    }

    // Обновление графиков
    updateChart() {
        if (this.chart) {
            this.chart.data.labels = Array.from({ length: this.game.player.netWorthHistory.length }, (_, i) => `Месяц ${i}`);
            this.chart.data.datasets[0].data = this.game.player.netWorthHistory;
            this.chart.update();
        }
    }

    // Обновление панели статистики
    updateStats() {
        const player = this.game.player;
        
        document.getElementById('stat-money').textContent = `${Math.round(player.money).toLocaleString()} ₸`;
        document.getElementById('stat-savings').textContent = `${Math.round(player.savings).toLocaleString()} ₸`;
        document.getElementById('stat-investments').textContent = `${Math.round(player.investments).toLocaleString()} ₸`;
        document.getElementById('stat-debts').textContent = `${Math.round(player.debts).toLocaleString()} ₸`;
        document.getElementById('stat-satisfaction').textContent = `${Math.round(player.satisfaction)}%`;
        document.getElementById('net-worth').textContent = `${Math.round(this.game.calculateNetWorth()).toLocaleString()} ₸`;
        document.getElementById('current-round').textContent = this.game.currentRound;
    }

    // Обновление таблицы бюджета
    updateBudgetTable() {
        const container = document.getElementById('budget-categories');
        const expenses = this.game.player.expenses;
        
        let html = '';
        let totalExpenses = 0;
        
        // Категории расходов
        const categories = [
            { key: 'housing', name: '🏠 Жильё', min: 1500, max: 3500 },
            { key: 'food', name: '🍎 Еда', min: 1200, max: 2500 },
            { key: 'transport', name: '🚗 Транспорт', min: 400, max: 1200 },
            { key: 'utilities', name: '💡 Коммунальные', min: 500, max: 1500 },
            { key: 'education', name: '📚 Образование', min: 500, max: 2000 },
            { key: 'healthcare', name: '⚕️ Медицина', min: 200, max: 1000 },
            { key: 'entertainment', name: '🎮 Развлечения', min: 300, max: 1500 },
            { key: 'savings', name: '💰 Сбережения', min: 0, max: 3000 },
            { key: 'debtPayment', name: '💳 Погашение долгов', min: 0, max: 2000 }
        ];
        
        categories.forEach(cat => {
            const value = expenses[cat.key] || 0;
            totalExpenses += value;
            
            html += `
                <div class="budget-row">
                    <span>${cat.name}</span>
                    <span class="budget-amount">${Math.round(value).toLocaleString()} ₸</span>
                    <input type="range" 
                           id="budget-${cat.key}"
                           min="${cat.min}" 
                           max="${cat.max}" 
                           value="${value}"
                           step="100"
                           onchange="game.adjustExpense('${cat.key}', this.value)">
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Обновляем суммы
        document.getElementById('total-income').textContent = `${Math.round(this.game.player.income).toLocaleString()} ₸`;
        document.getElementById('total-expenses').textContent = `${Math.round(totalExpenses).toLocaleString()} ₸`;
        document.getElementById('balance').textContent = `${Math.round(this.game.player.income - totalExpenses).toLocaleString()} ₸`;
    }

    // Обновление карточки события
    updateEventCard(event) {
        if (!event) {
            document.getElementById('event-card').style.display = 'none';
            return;
        }
        
        document.getElementById('event-card').style.display = 'block';
        document.getElementById('event-title').textContent = event.text;
        document.getElementById('event-description').textContent = event.description || '';
        
        const valueEl = document.getElementById('event-value');
        if (event.value) {
            valueEl.style.display = 'block';
            valueEl.className = `event-value ${event.value > 0 ? 'positive' : 'negative'}`;
            valueEl.textContent = `${event.value > 0 ? '+' : ''}${event.value.toLocaleString()} ₸`;
        } else {
            valueEl.style.display = 'none';
        }
        
        // Кнопки действий
        const actionsContainer = document.getElementById('event-actions');
        if (event.options) {
            let buttons = '';
            if (event.options.includes('invest')) {
                buttons += `<button class="btn btn-primary" onclick="game.handleInvestment()">💰 Инвестировать</button>`;
            }
            buttons += `<button class="btn btn-outline" onclick="game.skipEvent()">Пропустить</button>`;
            actionsContainer.innerHTML = buttons;
        } else {
            actionsContainer.innerHTML = `
                <button class="btn btn-primary" onclick="game.acceptEvent()">Применить</button>
            `;
        }
    }

    // Обновление фазы игры
    updatePhase(phase) {
        // Обновляем индикаторы фаз
        document.querySelectorAll('.phase').forEach(el => el.classList.remove('active'));
        document.getElementById(`phase-${phase}`).classList.add('active');
        
        // Обновляем контент фазы
        const contentEl = document.getElementById('phase-content');
        
        switch(phase) {
            case 'income':
                contentEl.innerHTML = `
                    <h4>💰 Получение дохода</h4>
                    <p>Основной доход: ${this.game.player.income.toLocaleString()} ₸</p>
                    ${this.game.player.investments > 0 ? `<p>Доход от инвестиций: +${Math.round(this.game.player.investments * 0.08).toLocaleString()} ₸</p>` : ''}
                `;
                break;
            case 'expenses':
                contentEl.innerHTML = `
                    <h4>📉 Оплата расходов</h4>
                    <p>Фиксированные расходы: ${Object.values(this.game.player.expenses).reduce((a,b) => a + b, 0).toLocaleString()} ₸</p>
                    <p>Вы можете отрегулировать бюджет выше</p>
                `;
                break;
            case 'event':
                contentEl.innerHTML = `
                    <h4>🎲 Неожиданное событие</h4>
                    <p>Смотрите карточку события справа</p>
                `;
                break;
            case 'decision':
                contentEl.innerHTML = `
                    <h4>🤔 Примите решение</h4>
                    <div class="decision-buttons">
                        <button class="btn btn-outline" onclick="game.transferToSavings()">🏦 Перевести в сбережения</button>
                        <button class="btn btn-outline" onclick="game.showInvestModal()">📈 Инвестировать</button>
                        <button class="btn btn-outline" onclick="game.takeLoan()">💳 Взять кредит</button>
                        <button class="btn btn-outline" onclick="game.payDebt()">📉 Погасить долг</button>
                    </div>
                `;
                break;
            case 'result':
                const netWorth = this.game.calculateNetWorth();
                contentEl.innerHTML = `
                    <h4>📊 Итог раунда</h4>
                    <p>Чистая стоимость: ${Math.round(netWorth).toLocaleString()} ₸</p>
                    <p>Изменение: ${netWorth - this.game.player.netWorthHistory[this.game.player.netWorthHistory.length - 2] || 0} ₸</p>
                `;
                break;
        }
    }

    // Показать модальное окно
    showModal(title, description, actions = null) {
        const modal = document.getElementById('event-modal');
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-description').textContent = description;
        
        if (actions) {
            document.getElementById('modal-actions').innerHTML = actions;
        }
        
        modal.classList.add('active');
    }

    // Закрыть модальное окно
    closeModal() {
        document.getElementById('event-modal').classList.remove('active');
    }

    // Показать финальный экран
    showFinalScreen() {
        const player = this.game.player;
        const netWorth = this.game.calculateNetWorth();
        const goalsCompleted = Object.values(player.goals).filter(g => g.completed).length;
        
        // Определяем рейтинг
        let rating, ratingClass;
        if (netWorth > 50000 && goalsCompleted >= 3) {
            rating = '🟢 Финансовая независимость';
            ratingClass = 'final-rating success';
        } else if (netWorth > 20000 && goalsCompleted >= 2) {
            rating = '🟡 Стабильность';
            ratingClass = 'final-rating warning';
        } else {
            rating = '🔴 Финансовый хаос';
            ratingClass = 'final-rating danger';
        }
        
        document.getElementById('final-networth').textContent = `${Math.round(netWorth).toLocaleString()} ₸`;
        document.getElementById('final-goals').textContent = `${goalsCompleted}/4`;
        document.getElementById('final-stability').textContent = 
            player.savings >= player.income * 3 ? 'A+' : 
            player.savings >= player.income * 1.5 ? 'B' : 'C';
        
        const ratingEl = document.getElementById('final-rating');
        ratingEl.textContent = rating;
        ratingEl.className = ratingClass;
        
        // Переключаем экраны
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('final-screen').classList.add('active');
    }
}

// Инициализация UI при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем сохранение для кнопки "Продолжить"
    if (localStorage.getItem('familyBudgetSave')) {
        document.getElementById('continue-game-btn').style.display = 'block';
    }
});
