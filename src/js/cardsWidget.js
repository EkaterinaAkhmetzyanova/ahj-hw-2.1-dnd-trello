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
    this.state = [];
    this.toDo = document.getElementById('todo').querySelector('.cards');
    this.inProgress = document.getElementById('in-progress').querySelector('.cards');
    this.done = document.getElementById('done').querySelector('.cards');
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.load();
    });
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
      // event.preventDefault();
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
      this.save();
    });
    this.cardsBox.addEventListener('mouseleave', this.dragEnd);
  }

  load() {
    const data = JSON.parse(CardsStorage.load());
    if (data) {
      data.todo.forEach((item) => {
        this.newCard(this.toDoCards(), item);
      });
      data.inProgress.forEach((item) => {
        this.newCard(this.inProgressCards(), item);
      });
      data.done.forEach((item) => {
        this.newCard(this.doneCards(), item);
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
    const inProgressCards = this.inProgress.querySelectorAll('.card');
    const doneCards = this.done.querySelectorAll('.card');
    toDoCards.forEach((item) => {
      data.todo.push(item.textContent);
    });
    inProgressCards.forEach((item) => {
      data.inProgress.push(item.textContent);
    });
    doneCards.forEach((item) => {
      data.done.push(item.textContent);
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
    document.body.style.cursor = 'grabbing';
    const targetCard = event.target.closest('.card');
    if (!targetCard) {
      return;
    }
    this.draggedEl = targetCard;
    this.ghostEl = this.draggedEl.cloneNode(true);
    this.ghostEl.classList.add('dragged');
    const {
      width, height, top, left,
    } = this.draggedEl.getBoundingClientRect();
    this.posX = event.pageX - left;
    this.posY = event.pageY - top;
    document.body.appendChild(this.ghostEl);
    this.draggedEl.classList.add('hidden');
    this.ghostEl.style.width = `${width}px`;
    this.ghostEl.style.height = `${height}px`;
    this.ghostEl.style.top = `${top}`;
    this.ghostEl.style.left = `${left}`;
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
    if (!this.draggedEl || !this.ghostEl) {
      return;
    }
    // const column = document.elementFromPoint(event.clientX, event.clientY).closest('.cards');
    // let closest = document.elementFromPoint(event.clientX, event.clientY);
    // console.log(closest);
    // console.log(column);
    // if (!column) {
    //   this.ghostEl.remove();
    //   return;
    // }
    // if (!closest.closest('.card')) {
    //   closest = column;
    //   column.appendChild(this.ghostEl);
    // } else {
    //   column.insertBefore(this.ghostEl, closest.nextElementSibling);
    // }
    // this.dragLeave();
    // this.save();
    const targetPos = document.elementFromPoint(event.clientX, event.clientY);
    const targetBox = targetPos.closest('.cards');
    const { top } = targetPos.getBoundingClientRect();
    if (targetBox && targetBox !== targetPos) {
      if (event.pageY > window.scrollY + top + targetPos.offsetHeight / 2) {
        targetBox.insertBefore(this.draggedEl, targetPos.nextElementSibling);
      } else {
        targetBox.insertBefore(this.draggedEl, targetPos);
      }
      this.dragLeave();
      this.save();
    } else if (targetBox) {
      targetBox.appendChild(this.draggedEl);
      this.dragLeave();
      this.save();
    } else {
      this.dragLeave();
      this.save();
    }
  }

  dragLeave() {
    document.body.style.cursor = 'auto';
    this.draggedEl.classList.remove('hidden');
    this.ghostEl.classList.remove('dragged');
    this.ghostEl.remove();
    this.draggedEl = null;
    this.ghostEl = null;
  }
}
