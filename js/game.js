// ========== ОСНОВНАЯ ЛОГИКА ИГРЫ ==========

class FamilyBudgetGame {
    constructor() {
        this.player = JSON.parse(JSON.stringify(INITIAL_PLAYER));
        this.settings = { ...DEFAULT_SETTINGS };
        this.currentRound = 1;
        this.currentPhase = 'income';
        this.currentEvent = null;
        this.ui = new UIManager(this);
        this.initEventListeners();
    }

    // Инициализация обработчиков событий
    initEventListeners() {
        // Главное меню
        document.getElementById('new-game-btn').addEventListener('click', () => this.startNewGame());
        document.getElementById('continue-game-btn').addEventListener('click', () => this.loadGame());
        document.getElementById('rules-btn').addEventListener('click', () => this.showRules());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());
        
        // Настройки
        document.getElementById('save-settings-btn').addEventListener('click', () => this.saveSettings());
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.showMenu());
        document.getElementById('back-from-rules').addEventListener('click', () => this.showMenu());
        
        // Игровой экран
        document.getElementById('next-phase-btn').addEventListener('click', () => this.nextPhase());
        document.getElementById('save-game-btn').addEventListener('click', () => this.saveGame());
        document.getElementById('menu-from-game-btn').addEventListener('click', () => this.showMenu());
        
        // Финальный экран
        document.getElementById('new-game-final').addEventListener('click', () => this.startNewGame());
        document.getElementById('export-pdf').addEventListener('click', () => this.exportPDF());
    }

    // ========== УПРАВЛЕНИЕ ЭКРАНАМИ ==========
    
    showMenu() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('main-menu').classList.add('active');
        
        // Проверяем наличие сохранения
        const continueBtn = document.getElementById('continue-game-btn');
        continueBtn.style.display = localStorage.getItem('familyBudgetSave') ? 'block' : 'none';
    }

    showRules() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('rules-screen').classList.add('active');
    }

    showSettings() {
        // Загружаем текущие настройки
        document.getElementById('players-count').value = this.settings.playersCount;
        document.getElementById('rounds-count').value = this.settings.roundsCount;
        document.getElementById('difficulty-level').value = this.settings.difficulty;
        
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('settings-screen').classList.add('active');
    }

    // ========== НАСТРОЙКИ ==========

    saveSettings() {
        this.settings = {
            playersCount: parseInt(document.getElementById('players-count').value),
            roundsCount: parseInt(document.getElementById('rounds-count').value),
            difficulty: document.getElementById('difficulty-level').value
        };
        
        document.getElementById('max-rounds').textContent = `/${this.settings.roundsCount}`;
        this.showMenu();
    }

    // ========== НОВАЯ ИГРА ==========

    startNewGame() {
        // Сброс состояния
        this.player = JSON.parse(JSON.stringify(INITIAL_PLAYER));
        this.currentRound = 1;
        this.currentPhase = 'income';
        
        // Обновляем UI
        document.getElementById('max-rounds').textContent = `/${this.settings.roundsCount}`;
        
        // Переключаем экран
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('game-screen').classList.add('active');
        
        // Инициализация графиков
        setTimeout(() => {
            this.ui.initChart();
            this.ui.updateBudgetTable();
            this.ui.updateStats();
        }, 100);
    }

    // ========== СОХРАНЕНИЕ / ЗАГРУЗКА ==========

    saveGame() {
        saveGameState(this.player, this.currentRound, this.settings);
        alert('💾 Игра сохранена!');
    }

    loadGame() {
        const saved = loadGameState();
        if (saved) {
            this.player = saved.player;
            this.currentRound = saved.currentRound;
            this.settings = saved.settings;
            
            document.getElementById('max-rounds').textContent = `/${this.settings.roundsCount}`;
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('game-screen').classList.add('active');
            
            setTimeout(() => {
                this.ui.initChart();
                this.ui.updateBudgetTable();
                this.ui.updateStats();
                this.ui.updateChart();
            }, 100);
        }
    }

    // ========== ИГРОВАЯ ЛОГИКА ==========

    // Расчет чистой стоимости
    calculateNetWorth() {
        return this.player.money + this.player.savings + this.player.investments - this.player.debts;
    }

    // Фазы раунда
    nextPhase() {
        const phases = ['income', 'expenses', 'event', 'decision', 'result'];
        const currentIndex = phases.indexOf(this.currentPhase);
        
        if (currentIndex < phases.length - 1) {
            // Переход к следующей фазе
            this.currentPhase = phases[currentIndex + 1];
            
            // Выполняем логику фазы
            switch(this.currentPhase) {
                case 'income':
                    this.processIncome();
                    break;
                case 'expenses':
                    this.processExpenses();
                    break;
                case 'event':
                    this.drawEvent();
                    break;
                case 'result':
                    this.processRoundResult();
                    break;
            }
            
            this.ui.updatePhase(this.currentPhase);
        } else {
            // Завершение раунда
            this.endRound();
        }
    }

    // Обработка доходов
    processIncome() {
        // Основной доход
        this.player.money += this.player.income;
        
        // Доход от инвестиций
        if (this.player.investments > 0) {
            const investmentType = INVESTMENT_TYPES.stocks;
            let return_rate = investmentType.baseReturn;
            
            // Риск падения
            if (Math.random() < investmentType.risk) {
                this.player.investments *= 0.9;
                this.ui.showModal('📉 Рынок упал', 'Инвестиции потеряли 10% стоимости');
            } else {
                const profit = this.player.investments * return_rate;
                this.player.money += profit;
            }
        }
        
        this.ui.updateStats();
    }

    // Обработка расходов
    processExpenses() {
        const totalExpenses = Object.values(this.player.expenses).reduce((a, b) => a + b, 0);
        this.player.money -= totalExpenses;
        
        // Проверка на банкротство
        if (this.player.money < -this.player.income * 2) {
            this.ui.showModal('💔 Банкротство', 'У вас критический долг. Игра окончена.');
            setTimeout(() => this.ui.showFinalScreen(), 2000);
        }
        
        this.ui.updateStats();
    }

    // Вытянуть событие
    drawEvent() {
        // Редкость событий зависит от сложности
        let eventChance = 1;
        if (this.settings.difficulty === 'easy') eventChance = 0.7;
        if (this.settings.difficulty === 'hard') eventChance = 1.3;
        
        if (Math.random() < 0.8 * eventChance) {
            const randomIndex = Math.floor(Math.random() * EVENT_DECK.length);
            this.currentEvent = { ...EVENT_DECK[randomIndex] };
            
            // Модификатор сложности
            if (this.currentEvent.value < 0 && this.settings.difficulty === 'hard') {
                this.currentEvent.value *= 1.3;
            }
            
            this.ui.updateEventCard(this.currentEvent);
        } else {
            this.ui.updateEventCard(null);
        }
    }

    // Принять событие
    acceptEvent() {
        if (!this.currentEvent) return;
        
        if (this.currentEvent.type === 'crisis') {
            // Процентное изменение дохода
            this.player.income *= (1 + this.currentEvent.value);
        } else if (this.currentEvent.value) {
            this.player.money += this.currentEvent.value;
            
            // Проверка на отрицательный баланс
            if (this.player.money < 0) {
                this.autoLoan();
            }
        }
        
        this.currentEvent = null;
        this.ui.updateEventCard(null);
        this.ui.updateStats();
        this.ui.closeModal();
    }

    // Пропустить событие
    skipEvent() {
        this.currentEvent = null;
        this.ui.updateEventCard(null);
        this.ui.closeModal();
    }

    // Автоматический кредит при отрицательном балансе
    autoLoan() {
        const loanAmount = -this.player.money + 5000;
        this.player.money += loanAmount;
        this.player.debts += loanAmount * 1.15;
        this.player.expenses.debtPayment += loanAmount * 0.15;
        
        this.ui.showModal('💳 Автокредит', `Для покрытия расходов взят кредит ${Math.round(loanAmount).toLocaleString()} ₸`);
    }

    // Взять кредит
    takeLoan() {
        const amount = 10000;
        this.player.money += amount;
        this.player.debts += amount * 1.15;
        this.player.expenses.debtPayment += amount * 0.15;
        
        this.ui.showModal('💳 Кредит оформлен', `Сумма: ${amount.toLocaleString()} ₸, ставка 15%`);
        this.ui.updateStats();
        this.ui.updateBudgetTable();
    }

    // Погасить долг
    payDebt() {
        if (this.player.debts <= 0) {
            alert('У вас нет долгов!');
            return;
        }
        
        const maxPayment = Math.min(this.player.money, this.player.debts);
        if (maxPayment > 0) {
            this.player.money -= maxPayment;
            this.player.debts -= maxPayment;
            this.player.expenses.debtPayment = this.player.debts * 0.15;
            
            this.ui.showModal('✅ Долг погашен', `Выплачено: ${maxPayment.toLocaleString()} ₸`);
            this.ui.updateStats();
            this.ui.updateBudgetTable();
        }
    }

    // Перевести в сбережения
    transferToSavings() {
        const amount = Math.min(this.player.money, 5000);
        if (amount > 0) {
            this.player.money -= amount;
            this.player.savings += amount;
            
            // Обновляем цель резервного фонда
            this.player.goals.emergency.current = this.player.savings;
            
            this.ui.showModal('🏦 Сбережения', `Переведено: ${amount.toLocaleString()} ₸`);
            this.ui.updateStats();
        }
    }

    // Показать модалку инвестиций
    showInvestModal() {
        let buttons = '';
        for (const [key, type] of Object.entries(INVESTMENT_TYPES)) {
            buttons += `<button class="btn btn-outline" onclick="game.invest('${key}', 5000)">${type.name}</button>`;
        }
        
        this.ui.showModal(
            '📈 Инвестирование',
            'Выберите инструмент:',
            buttons + '<button class="btn btn-secondary" onclick="ui.closeModal()">Отмена</button>'
        );
    }

    // Инвестировать
    invest(type, amount) {
        if (this.player.money < amount) {
            alert('Недостаточно средств!');
            return;
        }
        
        this.player.money -= amount;
        this.player.investments += amount;
        
        this.ui.closeModal();
        this.ui.showModal('✅ Инвестиция', `Вложено ${amount.toLocaleString()} ₸ в ${INVESTMENT_TYPES[type].name}`);
        this.ui.updateStats();
    }

    // Обработка решения по инвестициям из события
    handleInvestment() {
        if (this.currentEvent && this.currentEvent.value < 0) {
            const amount = Math.abs(this.currentEvent.value);
            this.invest('stocks', amount);
            this.currentEvent = null;
            this.ui.updateEventCard(null);
        }
    }

    // Результат раунда
    processRoundResult() {
        // Обновляем историю чистой стоимости
        const netWorth = this.calculateNetWorth();
        this.player.netWorthHistory.push(netWorth);
        
        // Обновляем удовлетворенность
        this.player.satisfaction = Math.min(100, 50 + 
            (this.player.savings / 5000) * 10 + 
            (this.player.investments / 10000) * 5 - 
            (this.player.debts / 10000) * 15);
        
        this.ui.updateChart();
    }

    // Завершение раунда
    endRound() {
        if (this.currentRound >= this.settings.roundsCount) {
            this.ui.showFinalScreen();
        } else {
            this.currentRound++;
            this.currentPhase = 'income';
            this.ui.updatePhase('income');
            this.ui.updateStats();
            
            // Проверка целей
            this.checkGoals();
        }
    }

    // Проверка выполнения целей
    checkGoals() {
        const goals = this.player.goals;
        
        // Накопления на дом
        if (!goals.home.completed && this.player.savings >= goals.home.target) {
            goals.home.completed = true;
            this.player.satisfaction += 15;
            this.ui.showModal('🏆 Цель достигнута!', 'Вы накопили на дом! +15% удовлетворенности');
        }
        
        // Отпуск
        if (!goals.vacation.completed && this.player.savings >= goals.vacation.target * 0.5) {
            // Прогресс
        }
    }

    // Регулировка расходов (вызывается из слайдера)
    adjustExpense(category, value) {
        this.player.expenses[category] = parseInt(value);
        this.ui.updateBudgetTable();
    }

    // Экспорт в PDF
    exportPDF() {
        alert('📄 PDF отчет — функция в разработке');
    }
}

// Глобальный экземпляр игры
let game;
window.onload = () => {
    game = new FamilyBudgetGame();
    window.game = game; // Для вызова из onclick
    window.ui = game.ui; // Для вызова из onclick
    game.showMenu();
};
