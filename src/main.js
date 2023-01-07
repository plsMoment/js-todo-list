import '../node_modules/normalize.css/normalize.css';
import './style.css';

/*
 * Задание:
 * Реализовать ToDoList приложение которое будет отображать список всех дел
 * Можно: просмотреть список всех дел, добавить todo и удалить, а так же изменить
 *
 * */

class ApiService {
    fetchAllTodos() {
        return fetch('https://jsonplaceholder.typicode.com/posts').then((res) => res.json());
    }

    fetchUser(userId) {
        return fetch(`https://jsonplaceholder.typicode.com/users/${userId}`).then((res) => res.json());
    }

    create(data) {
        return fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }).then((res) => res.json());
    }

    remove(id) {
        return fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
            method: 'DELETE',
        });
    }

    update(id, data) {
        return fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        }).then((res) => res.json());
    }

}

// Отвечает за рендер
class TodoService {
    toToList;
    card;

    constructor(api) {
        this.api = api;
        this.toToList = window.document.querySelector('.todo-list');
        this._handleRemove = this._handleRemove.bind(this);
        this.openUpd = this.openUpd.bind(this);

        this.overlay = document.querySelector('.overlay');
        this.modalUpd = document.querySelector('.modalUpd')

        this.listener = this.closeUpd.bind(this);
        document
            .querySelector('.modalUpd svg')
            .addEventListener('click', this.listener);

        this.submitUpdBtn = document.querySelector('.submit-upd-btn');
        this.submitUpdBtn.addEventListener('click', this._onUpdate.bind(this));
    }

    addTodo(number, userId, title, body) {
        this.toToList.append(this._createTodo(number, userId, title, body));
    }

    _createTodo(number, userId, title, body) {
        const container = document.createElement('div');
        container.classList.add('todo-list__item');
        container.cardId = number;
        container.cardUserId = userId;
        container.classList.add('card');
        const header = document.createElement('div');
        header.classList.add('card__header');
        const content = document.createElement('div');
        const tail = document.createElement('div');
        tail.classList.add('card__tail');

        const numberEl = document.createElement('h3');
        numberEl.append(document.createTextNode(number));
        numberEl.classList.add('card__number');

        const titleEl = document.createElement('h3');
        titleEl.append(document.createTextNode(title));
        titleEl.classList.add('card__title');

        content.append(document.createTextNode(body));
        content.classList.add('card__body');

        const authorEl = document.createElement('i');
        api.fetchUser(userId).then((res) => authorEl.append(document.createTextNode(`Author: ${res.username}`)));
        authorEl.classList.add('card__author');

        const btnEl = document.createElement('button');
        btnEl.append(document.createTextNode('x'));
        btnEl.classList.add('card__remove');

        const btnUpd = document.createElement('button');
        btnUpd.append(document.createTextNode('Upd'));
        btnUpd.classList.add('card__update')

        header.append(numberEl);
        header.append(titleEl);
        header.append(btnEl);
        tail.append(btnUpd);
        tail.append(authorEl);

        container.append(header);
        container.append(content);
        container.append(tail);

        btnEl.addEventListener('click', this._handleRemove);
        btnUpd.addEventListener('click', this.openUpd);

        return container;
    }

    updateTodo(title, body, userId) {
        this.card.cardUserId = userId;
        this.card.getElementsByClassName('card__title')[0].innerText = title;
        this.card.getElementsByClassName('card__body')[0].innerText = body;
        this.api.fetchUser(userId).then((res) => {
            this.card.getElementsByClassName('card__author')[0].innerText = `Author: ${res.username}`
        });
    }

    openUpd(event) {
        this.card = event.target.parentElement.parentElement;
        this.modalUpd.classList.add('active');
        this.overlay.classList.add('active');
        document.getElementById("updForm")
                .elements['userId']
                .value = this.card.cardUserId;
        document.getElementById("updForm")
                .elements['title']
                .value = this.card.getElementsByClassName('card__title')[0].innerText;
        document.getElementById("updForm")
                .elements['body']
                .value = this.card.getElementsByClassName('card__body')[0].innerText;
    }

    closeUpd() {
        document.getElementsByClassName('formUpd-errors')[0].innerHTML = '';
        document.getElementById("updForm").reset();
        this.modalUpd.classList.remove('active');
        this.overlay.classList.remove('active');
    }

    _onUpdate(e) {
        e.preventDefault();
        const formData = {};
        const form = document.getElementById("updForm");

        Array.from(form.elements)
            .filter((item) => !!item.name)
            .forEach((elem) => {
                formData[elem.name] = elem.value;
            });

        if (!this._validateForm(form, formData)) {
            return;
        }

        this.api.update(this.card.cardId, formData).then((data) => {
            this.updateTodo(data.title, data.body, data.userId);
        });

        form.reset();
        this.closeUpd();
    }

    _validateForm(form, formData) {
        const errors = [];
        //вместо if используются отдельные функции-валидаторы
        if (formData.title.length >= 50) {
            errors.push('Поле наименование должно иметь не более 50 символов');
        }
        if (!formData.body.length) {
            errors.push('Поле описание должно быть заполнено');
        }
        if (formData.userId > 10 || formData.userId < 1) {
            errors.push('Поле автор должно иметь значения в диапазоне от 1 до 10');
        }
        if (errors.length) {
            const errorEl = form.getElementsByClassName('formUpd-errors')[0];
            errorEl.innerHTML = errors.map((er) => `<div>${er}</div>`).join('');

            return false;
        }

        return true;
    }

    _handleRemove(event) {
        const card = event.target.parentElement.parentElement;
        this.api.remove(card.cardId).then((res) => {
            if (res.status >= 200 && res.status <= 300) {
                event.target.removeEventListener('click', this._handleRemove);
                card.remove();
            }
        });
    }
}

class MainService {
    constructor(todoService, modalService, api) {
        this.modalService = modalService;
        this.api = api;
        this.todoService = todoService;
        document.getElementsByClassName('app');
        this.btn = document.getElementById('addBtn');
        this.btn.addEventListener('click', (e) => this._onOpenModal(e));
    }

    fetchAllTodo() {
        this.api.fetchAllTodos().then((todos) => {
            todos.forEach((todo) =>
                this.todoService.addTodo(todo.id, todo.userId, todo.title, todo.body)
            );
        });
    }

    _onOpenModal() {
        this.modalService.open();
    }
}

class ModalService {

    constructor(todoService, api) {
        this.api = api;
        this.todoService = todoService;
        this.overlay = document.querySelector('.overlay');
        this.modal = document.querySelector('.modal');

        this.listener = this.close.bind(this);
        document
            .querySelector('.modal svg')
            .addEventListener('click', this.listener);

        this.submitBtn = document.querySelector('.submit-btn');
        this.submitBtn.addEventListener('click', this._onCreate.bind(this));

    }

    open() {
        this.modal.classList.add('active');
        this.overlay.classList.add('active');
    }

    close() {
        document.getElementById("addForm").reset();
        document.getElementsByClassName('form-errors')[0].innerHTML = '';
        this.modal.classList.remove('active');
        this.overlay.classList.remove('active');
    }

    _onCreate(e) {
        e.preventDefault();

        const formData = {};
        const form = document.getElementById("addForm");

        Array.from(form.elements)
            .filter((item) => !!item.name)
            .forEach((elem) => {
                formData[elem.name] = elem.value;
            });

        if (!this._validateForm(form, formData)) {
            return;
        }

        this.api.create(formData).then((data) => {
            this.todoService.addTodo(data.id, data.userId, data.title, data.body);
        });
        form.reset();
        this.close();
    }

    _validateForm(form, formData) {
        const errors = [];
        //вместо if используются отдельные функции-валидаторы
        if (formData.title.length >= 50) {
            errors.push('Поле наименование должно иметь не более 50 символов');
        }
        if (!formData.body.length) {
            errors.push('Поле описание должно быть заполнено');
        }
        if (formData.userId > 10 || formData.userId < 1) {
            errors.push('Поле автор должно иметь значения в диапазоне от 1 до 10');
        }
        if (errors.length) {
            const errorEl = form.getElementsByClassName('form-errors')[0];
            errorEl.innerHTML = errors.map((er) => `<div>${er}</div>`).join('');

            return false;
        }

        return true;
    }
}

const api = new ApiService();
const todoService = new TodoService(api);
const modalService = new ModalService(todoService, api);
const service = new MainService(todoService, modalService, api);
service.fetchAllTodo();
