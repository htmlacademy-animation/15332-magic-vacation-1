import throttle from 'lodash/throttle';

export default class FullPageScroll {
  constructor() {
    this.THROTTLE_TIMEOUT = 2000;

    this.screenElements = document.querySelectorAll(`.screen:not(.screen--result)`);
    this.menuElements = document.querySelectorAll(`.page-header__menu .js-menu-link`);
    this.screenOverlay = document.querySelector(`.js-overlay`);

    this.activeScreen = 0;
    this.prevScreen = null;
    this.onScrollHandler = this.onScroll.bind(this);
    this.onUrlHashChangedHandler = this.onUrlHashChanged.bind(this);
    this.overlayTransitions = [
      [`story`, `prizes`]
    ];
  }

  init() {
    document.addEventListener(`wheel`, throttle(this.onScrollHandler, this.THROTTLE_TIMEOUT, {trailing: true}));
    window.addEventListener(`popstate`, this.onUrlHashChangedHandler);

    this.onUrlHashChanged();
  }

  onScroll(evt) {
    const currentPosition = this.activeScreen;
    const newPosition = this.reCalculateActiveScreenPosition(evt.deltaY);

    if (currentPosition !== newPosition) {
      const newHash = this.screenElements[newPosition].id;

      this.changeHash(newHash);
    }
  }

  changeHash(newHash) {
    location.hash = newHash;
  }

  onUrlHashChanged() {
    const newIndex = Array.from(this.screenElements).findIndex((screen) => location.hash.slice(1) === screen.id);
    this.prevScreen = this.activeScreen;
    this.activeScreen = (newIndex < 0) ? 0 : newIndex;

    this.changePageDisplay();
  }

  changePageDisplay() {
    this.changeActiveMenuItem();
    this.changeScreen();
    this.emitChangeDisplayEvent();
  }

  changeScreen() {
    if (this.needOverlayTransition()) {
      this.showOverlay();
    } else {
      this.changeVisibilityDisplay();
    }
  }

  changeVisibilityDisplay() {
    this.screenElements.forEach((screen) => {
      screen.classList.add(`screen--hidden`);
      screen.classList.remove(`active`);
    });
    this.screenElements[this.activeScreen].classList.remove(`screen--hidden`);
    setTimeout(() => {
      this.screenElements[this.activeScreen].classList.add(`active`);
    }, 100);
  }

  changeActiveMenuItem() {
    const activeItem = Array.from(this.menuElements).find((item) => item.dataset.href === this.screenElements[this.activeScreen].id);
    if (activeItem) {
      this.menuElements.forEach((item) => item.classList.remove(`active`));
      activeItem.classList.add(`active`);
    }
  }

  emitChangeDisplayEvent() {
    const event = new CustomEvent(`screenChanged`, {
      detail: {
        'screenId': this.activeScreen,
        'screenName': this.screenElements[this.activeScreen].id,
        'screenElement': this.screenElements[this.activeScreen]
      }
    });

    document.body.dispatchEvent(event);
  }

  reCalculateActiveScreenPosition(delta) {
    if (delta > 0) {
      return Math.min(this.screenElements.length - 1, this.activeScreen + 1);
    } else {
      return Math.max(0, this.activeScreen - 1);
    }
  }

  needOverlayTransition() {
    if (!this.prevScreen) {
      return false;
    }

    const prevName = this.screenElements[this.prevScreen].id;
    const activeName = this.screenElements[this.activeScreen].id;

    return this.overlayTransitions.some((transition) => {
      return prevName === transition[0] && activeName === transition[1];
    });
  }

  showOverlay() {
    this.screenOverlay.classList.add(`screen__overlay--active`);
    this.screenOverlay.addEventListener(`transitionend`, () => {
      this.changeVisibilityDisplay();

      setTimeout(() => {
        this.screenOverlay.classList.remove(`screen__overlay--active`);
      }, 100);
    }, {once: true});
  }
}
