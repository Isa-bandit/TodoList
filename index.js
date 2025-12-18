// Защита от повторной инициализации
if (window.todoApp) {
    console.warn('App already initialized');
} else {
    window.todoApp = true;

    // 1. КОНФИГУРАЦИЯ SUPABASE
    const SUPABASE_URL = 'https://xcqpvmhtwxqkyzrmljcr.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_gTeYSlWlBsNBJgcKyFaSqQ_r6G0c_uF';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // 2. DOM ЭЛЕМЕНТЫ
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const authForm = document.getElementById('auth-form');
    const authMessage = document.getElementById('auth-message');
    const todoListEl = document.getElementById('todo-list');
    const modal = document.getElementById('modal');
    const taskInput = document.getElementById('task-input');
    const itemsLeftEl = document.getElementById('items-left');

    // Кнопки
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const addNewBtn = document.getElementById('add-new-btn');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const cancelTaskBtn = document.getElementById('cancel-task-btn');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // 3. СОСТОЯНИЕ
    let currentUser = null;
    let todos = [];
    let currentFilter = 'all';
    let editingId = null;
    let isProcessing = false; // Защита от множественных запросов

    // 4. ВАЛИДАЦИЯ
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePassword(password) {
        return password.length >= 6;
    }

    // 5. АВТОРИЗАЦИЯ
    async function checkUser() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            showApp();
        } else {
            showAuth();
        }
    }

    // Слушатель изменений авторизации
    supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            currentUser = session.user;
            showApp();
        } else {
            currentUser = null;
            showAuth();
        }
    });

    // Вход
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isProcessing) return;
        isProcessing = true;
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Валидация
        if (!validateEmail(email)) {
            showError("Введите корректный email");
            isProcessing = false;
            return;
        }

        if (!validatePassword(password)) {
            showError("Пароль должен быть минимум 6 символов");
            isProcessing = false;
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerText = "Вход...";

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        loginBtn.disabled = false;
        loginBtn.innerText = "Войти";
        isProcessing = false;
        
        if (error) {
            if (error.message.includes("Invalid login credentials")) {
                showError("Неверный email или пароль");
            } else {
                showError(error.message);
            }
        }
    });

    // Регистрация
    signupBtn.addEventListener('click', async () => {
        if (isProcessing) return;
        isProcessing = true;

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Валидация
        if (!email || !password) {
            showError("Введите email и пароль");
            isProcessing = false;
            return;
        }

        if (!validateEmail(email)) {
            showError("Введите корректный email (example@mail.com)");
            isProcessing = false;
            return;
        }

        if (!validatePassword(password)) {
            showError("Пароль должен быть минимум 6 символов");
            isProcessing = false;
            return;
        }

        signupBtn.disabled = true;
        signupBtn.innerText = "Регистрация...";

        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password
        });
        
        signupBtn.disabled = false;
        signupBtn.innerText = "Регистрация";
        isProcessing = false;
        
        if (error) {
            if (error.message.includes("User already registered")) {
                showError("Этот email уже зарегистрирован. Попробуйте войти.");
            } else if (error.message.includes("rate limit")) {
                showError("Слишком много попыток. Подождите 1 минуту.");
            } else {
                showError(error.message);
            }
        } else {
            showError("✓ Регистрация успешна! Вы автоматически вошли в систему.", "green");
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
        }
    });

    // Выход
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
    });

    // 6. ЛОГИКА ЗАДАЧ (CRUD)

    // Получение задач
    async function fetchTodos() {
        if (!currentUser) return;
        
        renderLoading();

        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching todos:', error);
            todoListEl.innerHTML = '<div style="text-align:center; padding:20px; color:red;">⚠ Ошибка загрузки данных</div>';
        } else {
            todos = data || [];
            renderTodos();
        }
    }

    // Добавление задачи
    async function addTodo(taskText) {
        const newTask = {
            task: taskText,
            user_id: currentUser.id,
            completed: false
        };

        const { data, error } = await supabase
            .from('todos')
            .insert([newTask])
            .select();

        if (error) {
            alert('Ошибка добавления: ' + error.message);
        } else {
            todos.unshift(data[0]);
            renderTodos();
            closeModal();
        }
    }

    // Обновление (текст или статус)
    async function updateTodo(id, updates) {
        const index = todos.findIndex(t => t.id === id);
        const oldTodo = { ...todos[index] };
        
        todos[index] = { ...todos[index], ...updates };
        renderTodos();

        const { error } = await supabase
            .from('todos')
            .update(updates)
            .eq('id', id)
            .eq('user_id', currentUser.id);

        if (error) {
            alert('Ошибка обновления');
            todos[index] = oldTodo;
            renderTodos();
        }
    }

    // Удаление
    async function deleteTodo(id) {
        if(!confirm('Удалить эту задачу?')) return;

        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser.id);

        if (error) {
            alert('Ошибка удаления');
        } else {
            todos = todos.filter(t => t.id !== id);
            renderTodos();
        }
    }

    // Очистка выполненных
    clearCompletedBtn.addEventListener('click', async () => {
        const completedIds = todos.filter(t => t.completed).map(t => t.id);
        
        if (completedIds.length === 0) return;

        const { error } = await supabase
            .from('todos')
            .delete()
            .in('id', completedIds)
            .eq('user_id', currentUser.id);

        if (error) {
            alert('Ошибка очистки');
        } else {
            todos = todos.filter(t => !t.completed);
            renderTodos();
        }
    });

    // 7. UI ФУНКЦИИ

    function renderTodos() {
        todoListEl.innerHTML = '';
        
        let filteredTodos = todos;
        if (currentFilter === 'active') filteredTodos = todos.filter(t => !t.completed);
        if (currentFilter === 'completed') filteredTodos = todos.filter(t => t.completed);

        const activeCount = todos.filter(t => !t.completed).length;
        itemsLeftEl.innerText = `${activeCount} задач осталось`;

        if (filteredTodos.length === 0) {
            todoListEl.innerHTML = '<div style="text-align:center; padding:20px; opacity:0.6;">Задач нет</div>';
            return;
        }

        filteredTodos.forEach(todo => {
            const item = document.createElement('div');
            item.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            
            item.innerHTML = `
                <div class="task-info">
                    <div class="task-text">${escapeHtml(todo.task)}</div>
                    <div style="font-size:0.7rem; opacity:0.5;">${new Date(todo.created_at).toLocaleDateString()}</div>
                </div>
                <div class="status">
                    <input type="checkbox" class="status-check" ${todo.completed ? 'checked' : ''}>
                </div>
                <div class="actions">
                    <button class="edit-btn"><i class="fa-solid fa-pen"></i></button>
                    <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            const checkbox = item.querySelector('.status-check');
            checkbox.addEventListener('change', () => updateTodo(todo.id, { completed: checkbox.checked }));

            const delBtn = item.querySelector('.delete-btn');
            delBtn.addEventListener('click', () => deleteTodo(todo.id));

            const editBtn = item.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => openModal(todo));

            todoListEl.appendChild(item);
        });
    }

    function renderLoading() {
        todoListEl.innerHTML = '<div class="loading">Загрузка задач...</div>';
    }

    function escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // 8. УПРАВЛЕНИЕ МОДАЛКОЙ И ФИЛЬТРАМИ

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    addNewBtn.addEventListener('click', () => openModal());
    cancelTaskBtn.addEventListener('click', closeModal);

    function openModal(todoToEdit = null) {
        modal.classList.remove('hidden');
        if (todoToEdit) {
            document.getElementById('modal-title').innerText = "Редактировать задачу";
            taskInput.value = todoToEdit.task;
            editingId = todoToEdit.id;
        } else {
            document.getElementById('modal-title').innerText = "Новая задача";
            taskInput.value = '';
            editingId = null;
        }
        taskInput.focus();
    }

    function closeModal() {
        modal.classList.add('hidden');
        editingId = null;
    }

    saveTaskBtn.addEventListener('click', () => {
        const text = taskInput.value.trim();
        if (!text) {
            alert("Введите текст задачи");
            return;
        }

        if (editingId) {
            updateTodo(editingId, { task: text });
            closeModal();
        } else {
            addTodo(text);
        }
    });

    function showApp() {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        fetchTodos();
    }

    function showAuth() {
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        authMessage.innerText = '';
        todos = [];
    }

    function showError(msg, color = 'red') {
        authMessage.style.color = color;
        authMessage.innerText = msg;
    }

    // Инициализация
    checkUser();
}