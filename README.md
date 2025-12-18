# Glass To-Do List 🚀

Современное веб-приложение для управления задачами с стеклянным дизайном и полноценной авторизацией.

## 📋 Функционал

- ✅ Создание, редактирование, удаление задач
- ✅ Отметка выполнения задач
- ✅ Фильтрация: Все/Активные/Выполненные
- ✅ Счетчик оставшихся задач
- ✅ Очистка выполненных задач
- 🔐 Авторизация пользователей
- 💾 Данные сохраняются в облачной БД

## 🛠 Технологии

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Supabase (BaaS)
- **Database:** PostgreSQL
- **Authentication:** Supabase Auth
- **Icons:** Font Awesome 6
- **Fonts:** Google Fonts (Poppins)

## 🗄 База данных

### Таблица `todos`
```sql
id (bigint, primary key, auto-increment)
task (text)
completed (boolean, default: false)
created_at (timestamptz, default: now())
user_id (uuid, foreign key → auth.users.id)
```

### Политики безопасности (RLS)
Включены 4 политики для полного CRUD:
- `Users can view own todos` - SELECT
- `Users can insert own todos` - INSERT  
- `Users can update own todos` - UPDATE
- `Users can delete own todos` - DELETE

**Все политики используют:** `(auth.uid() = user_id)`

## 🔌 API Настройки

```javascript
    const SUPABASE_URL = 'https://xcqpvmhtwxqkyzrmljcr.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_gTeYSlWlBsNBJgcKyFaSqQ_r6G0c_uF';
```

## 🚀 Установка и запуск

1. **Клонируй репозиторий**
```bash
git clone https://github.com/Isa-bandit/TO-do.git
cd todo-list
```

2. **Открой в браузере**
```bash
# Просто открой index.html в браузере
# Или используй Live Server в VS Code
```

3. **Настройка БД**
- Таблица `todos` создана
- RLS политики настроены
- Foreign key на `auth.users.id` установлен

<img width="1316" height="562" alt="screenshot-20251204-154333" src="https://github.com/user-attachments/assets/4c76af17-3c3e-45b0-9f90-c751bed26a5e" />

## 🔐 Авторизация

### Для тестирования:
- **Email:** любой валидный формат (test@test.com)
- **Password:** минимум 6 символов

### Важно:
- Подтверждение email отключено в настройках Supabase
- Пользователи видят только свои задачи
- Сессии сохраняются между перезагрузками

## 📁 Структура проекта

```
project/
├── index.html          # Основная разметка
├── style.css           # Стили (glassmorphism дизайн)
├── index.js            # Логика приложения
└── image.png           # Иконка приложения
```

## 🎨 Особенности дизайна

- **Glassmorphism** - стеклянный эффект
- **Адаптивный дизайн** - работает на всех устройствах
- **Интуитивный интерфейс** - понятное управление
- **Smooth animations** - плавные переходы

## 🔄 Основные функции JS

### Работа с задачами
```javascript
// Получение задач
supabase.from('todos').select('*').eq('user_id', user.id)

// Добавление задачи
supabase.from('todos').insert([{task, user_id, completed: false}])

// Обновление задачи  
supabase.from('todos').update(updates).eq('id', id).eq('user_id', user.id)

// Удаление задачи
supabase.from('todos').delete().eq('id', id).eq('user_id', user.id)
```

### Авторизация
```javascript
// Вход
supabase.auth.signInWithPassword({email, password})

// Регистрация
supabase.auth.signUp({email, password})

// Выход
supabase.auth.signOut()
```

## ⚙️ Настройки Supabase

### Authentication → Settings
- ✅ Confirm email: **DISABLED** (для тестирования)
- ✅ Secure email change: **ENABLED**

### Database → Tables
- ✅ Table `todos` created
- ✅ RLS: **ENABLED**
- ✅ Policies: **4 configured**

## 🐛 Возможные проблемы

1. **"Invalid email format"**
   - Используй email в правильном формате (test@example.com)

2. **"Password too weak"** 
   - Пароль должен быть минимум 6 символов

3. **Ошибки загрузки задач**
   - Проверь подключение к интернету
   - Убедись что RLS политики настроены правильно
  ![Uploading screenshot-20251204-154333.png…]()

4. **Ссылка на презентацию** [https://www.figma.com/make/ApF2WZipta5V1ExIsmdKGl/Design-Glass-To-Do-List?node-id=0-4&t=FO4sTrSKN4h0M8uC-1](https://www.canva.com/design/DAG7RuQs9bE/jO6VMujbk4Pz3s2oIXzG3Q/edit?utm_content=DAG7RuQs9bE&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

## 📞 Поддержка

Если возникли проблемы с настройкой БД или авторизацией - проверь настройки Supabase в панели управления.

---

**Разработано с использованием Supabase** 🚀
