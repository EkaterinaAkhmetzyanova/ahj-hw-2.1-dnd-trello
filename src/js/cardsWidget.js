/* eslint-disable no-unused-vars */
import CardsStorage from './cardsStorage';

export default class CardsWidget {
  constructor() {
    this.parentEl = null;
    this.draggedEl = null;
    this.ghostEl = null;
    this.posY = null;
    this.posX = null;
    this.cardsBox = document.querySelector('.cards-container');
    this.forms = document.querySelectorAll('.new-card-form');
    this.toDo = document.getElementById('todo').querySelector('.cards');
    this.inProgress = document.getElementById('in-progress').querySelector('.cards');
    this.done = document.getElementById('done').querySelector('.cards');
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.load();
    });
    window.addEventListener('beforeunload', this.save);
    // to show a new card window
    this.addBox = document.querySelectorAll('.add-card');
    this.addBox.forEach((item) => item.addEventListener('click', (event) => {
      event.preventDefault();
      if (this.draggedEl) {
        return;
      }
      item.classList.add('hidden');
      const target = event.target.parentElement.querySelector('.new-card-form');
      target.classList.add('active');
    }));

    // to cancel card adding
    this.cancelBtn = document.querySelectorAll('.cancel-btn');
    this.cancelBtn.forEach((item) => item.addEventListener('click', (event) => {
      event.preventDefault();
      for (const form of this.forms) {
        if (form.classList.contains('active')) {
          form.classList.remove('active');
          form.parentElement.querySelector('.add-card').classList.remove('hidden');
          return;
        }
      }
    }));

    // to add a new card
    this.forms.forEach((item) => item.addEventListener('submit', (event) => {
      event.preventDefault();
      if (this.draggedEl) {
        return;
      }
      item.classList.add('active');
      const input = [...item.elements][0];
      input.focus();
      const column = item.closest('.cards-col');
      this.newCard(column, input.value);
      item.reset();
      item.classList.remove('active');
      item.parentElement.querySelector('.add-card').classList.remove('hidden');
      this.save();
    }));

    // to show/hide card delete icon
    this.cardsBox.addEventListener('mouseover', (event) => {
      event.preventDefault();
      if (this.draggedEl) {
        return;
      }
      if (event.target.classList.contains('card')) {
        const card = event.target;
        const deleteCardBtn = card.querySelector('.delete-btn');
        deleteCardBtn.classList.remove('hidden');
      }
    });

    this.cardsBox.addEventListener('mouseout', (event) => {
      event.preventDefault();
      if (this.draggedEl || this.ghostEl) {
        return;
      }
      const previousEl = event.target;
      const currentEl = event.relatedTarget;
      if (previousEl.classList.contains('card') && !currentEl.classList.contains('delete-btn')) {
        const card = previousEl;
        const deleteCardBtn = card.querySelector('.delete-btn');
        deleteCardBtn.classList.add('hidden');
      }
    });

    // dnd listeners
    this.cardsBox.addEventListener('mousedown', (event) => {
      const targetCard = event.target;
      if (targetCard.closest('.card')) {
        this.dragStart(event);
      }
      if (targetCard.closest('.delete-btn')) {
        this.deleteCard(event);
        this.save();
      }
    });
    this.cardsBox.addEventListener('mousemove', (event) => {
      this.dragMove(event);
    });
    this.cardsBox.addEventListener('mouseup', (event) => {
      this.dragEnd(event);
    });
    this.cardsBox.addEventListener('mouseleave', this.dragLeave);
  }

  load() {
    const data = JSON.parse(CardsStorage.load());
    // console.log(data);
    if (data) {
      data.todo.forEach((item) => {
        this.newCard(this.toDo, item);
      });
      data.inProgress.forEach((item) => {
        this.newCard(this.inProgress, item);
      });
      data.done.forEach((item) => {
        this.newCard(this.done, item);
      });
    }
  }

  save() {
    const data = {
      todo: [],
      inProgress: [],
      done: [],
    };
    const toDoCards = this.toDo.querySelectorAll('.card');
    // console.log(toDoCards);
    const inProgressCards = this.inProgress.querySelectorAll('.card');
    // console.log(inProgressCards);
    const doneCards = this.done.querySelectorAll('.card');
    // console.log(doneCards);
    toDoCards.forEach((item) => {
      data.todo.push(item.textContent.replace('×', ''));
    });
    inProgressCards.forEach((item) => {
      data.inProgress.push(item.textContent.replace('×', ''));
    });
    doneCards.forEach((item) => {
      data.done.push(item.textContent.replace('×', ''));
    });
    CardsStorage.save(data);
  }

  newCard(column, value) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
    ${value} 
    <button class="delete-btn hidden">&#215;</button>
    `;
    this.parentEl = column;
    this.parentEl.appendChild(card);
    this.save();
  }

  deleteCard(event) {
    this.targetCard = event.target.parentElement;
    this.targetCard.remove();
    this.save();
  }

  dragStart(event) {
    const targetCard = event.target.closest('.card');
    if (!targetCard || event.target.classList.contains('delete-btn')) {
      return;
    }
    event.preventDefault();
    document.body.style.cursor = 'grabbing';
    this.draggedEl = targetCard;
    this.ghostEl = this.draggedEl.cloneNode(true);
    const { top, left } = this.draggedEl.getBoundingClientRect();
    this.posX = event.clientX - left;
    this.posY = event.clientY - top;
    this.ghostEl.style.width = `${this.draggedEl.offsetWidth}px`;
    this.ghostEl.classList.add('dragged');
    this.draggedEl.classList.add('hidden');
    document.body.appendChild(this.ghostEl);
    this.ghostEl.style.height = `${this.draggedEl.offsetHeight}px`;
    this.ghostEl.style.top = `${event.pageY - this.posY}px`;
    this.ghostEl.style.left = `${event.pageX - this.posX}px`;
  }

  dragMove(event) {
    event.preventDefault();
    if (!this.ghostEl) {
      return;
    }
    this.ghostEl.style.left = `${event.pageX - this.posX}px`;
    this.ghostEl.style.top = `${event.pageY - this.posY}px`;
    this.save();
  }

  dragEnd(event) {
    event.preventDefault();
    if (!this.draggedEl) {
      return;
    }
    const targetPos = document.elementFromPoint(event.clientX, event.clientY);
    const targetBox = targetPos.closest('.cards');
    const { top } = targetPos.getBoundingClientRect();
    if (targetBox && targetBox !== targetPos) {
      if (event.pageY > window.scrollY + top + targetPos.offsetHeight / 2) {
        targetBox.insertBefore(this.draggedEl, targetPos.nextElementSibling);
      } else {
        targetBox.insertBefore(this.draggedEl, targetPos);
      }
    } else if (targetBox) {
      targetBox.append(this.draggedEl);
    } 
    // else {
    //   this.dragLeave();
    //   this.save();
    // }
    document.body.style.cursor = 'auto';
    this.ghostEl.remove();
    this.draggedEl.classList.remove('hidden');
    this.draggedEl = null;
    this.ghostEl = null;
    this.save();
  }

  dragLeave() {
    console.log(this.ghostEl);
    this.ghostEl.remove();
    document.body.style.cursor = 'auto';
    this.draggedEl.classList.remove('hidden');
    this.draggedEl = null;
    this.ghostEl = null;
  }
}
