// ========== ИГРОВЫЕ ДАННЫЕ ==========

// Настройки по умолчанию
const DEFAULT_SETTINGS = {
    playersCount: 2,
    roundsCount: 12,
    difficulty: 'medium'
};

// Начальное состояние игрока
const INITIAL_PLAYER = {
    money: 5000,
    savings: 0,
    debts: 0,
    investments: 0,
    income: 9200,
    expenses: {
        housing: 2300,
        food: 1800,
        transport: 700,
        utilities: 800,
        education: 900,
        healthcare: 400,
        entertainment: 600,
        savings: 1000,
        debtPayment: 0
    },
    satisfaction: 50,
    netWorthHistory: [5000],
    goals: {
        home: { current: 0, target: 30000, completed: false },
        vacation: { current: 0, target: 15000, completed: false },
        education: { current: 0, target: 20000, completed: false },
        emergency: { current: 0, target: 15000, completed: false }
    }
};

// Колода событий
const EVENT_DECK = [
    {
        type: 'expense',
        value: -6000,
        text: '🔧 Ремонт автомобиля',
        description: 'Поломка двигателя — срочный ремонт'
    },
    {
        type: 'expense',
        value: -4500,
        text: '🏥 Лекарства',
        description: 'Сезонная простуда, нужны лекарства'
    },
    {
        type: 'income',
        value: 8000,
        text: '💼 Квартальная премия',
        description: 'Руководство отметило вашу работу'
    },
    {
        type: 'income',
        value: 5000,
        text: '🎁 Подарок от родственников',
        description: 'Неожиданный денежный перевод'
    },
    {
        type: 'expense',
        value: -3500,
        text: '❄️ Прорвало трубу',
        description: 'Коммунальная авария'
    },
    {
        type: 'opportunity',
        value: -10000,
        text: '📈 Инвестиционная возможность',
        description: 'Друг предлагает войти в бизнес',
        options: ['invest', 'decline']
    },
    {
        type: 'crisis',
        value: -0.2,
        text: '⚡ Сокращение на работе',
        description: 'Доход временно снижен на 20%'
    },
    {
        type: 'income',
        value: 3000,
        text: '🖥 Фриланс',
        description: 'Выполнили заказ в выходные'
    },
    {
        type: 'expense',
        value: -2500,
        text: '📱 Новый телефон',
        description: 'Старый сломался, нужна замена'
    },
    {
        type: 'saving',
        value: -2000,
        text: '🏷 Скидка на страховку',
        description: 'Оформили годовую страховку со скидкой'
    },
    {
        type: 'expense',
        value: -8000,
        text: '👶 Подготовка к школе',
        description: 'Форма, учебники, канцелярия'
    },
    {
        type: 'income',
        value: 4000,
        text: '🚗 Такси в свободное время',
        description: 'Подработка в приложении'
    },
    {
        type: 'expense',
        value: -5500,
        text: '⚖️ Штраф',
        description: 'Административное нарушение'
    },
    {
        type: 'opportunity',
        value: -15000,
        text: '🏢 Недвижимость',
        description: 'Возможность купить гараж и сдавать',
        options: ['invest', 'decline']
    }
];

// Инвестиционные инструменты
const INVESTMENT_TYPES = {
    stocks: {
        name: '📊 Акции',
        baseReturn: 0.08,
        risk: 0.3,
        description: '8% доходность, 30% риск убытка'
    },
    bonds: {
        name: '📉 Облигации',
        baseReturn: 0.04,
        risk: 0.05,
        description: '4% стабильная доходность'
    },
    realty: {
        name: '🏘 Недвижимость',
        baseReturn: 0.06,
        risk: 0.1,
        description: '6% доход + рост стоимости'
    }
};

// Сохранение состояния игры
function saveGameState(player, round, settings) {
    const gameState = {
        player: player,
        currentRound: round,
        settings: settings,
        timestamp: Date.now()
    };
    localStorage.setItem('familyBudgetSave', JSON.stringify(gameState));
}

// Загрузка состояния игры
function loadGameState() {
    const saved = localStorage.getItem('familyBudgetSave');
    return saved ? JSON.parse(saved) : null;
}

// Очистка сохранения
function clearGameState() {
    localStorage.removeItem('familyBudgetSave');
}
