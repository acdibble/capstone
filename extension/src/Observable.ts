/* eslint-disable lines-between-class-members */
type Callback<T> = (this: Observable<T>, value: T) => void

export default class Observable<T> {
  #value: T
  callbacks = new Map<symbol, Callback<T>>()

  constructor(value: T) {
    this.#value = value;
  }

  peek(): T {
    return this.#value;
  }

  onChange(cb: Callback<T>, callImmediately = true): () => void {
    // eslint-disable-next-line symbol-description
    const id = Symbol();
    this.callbacks.set(id, cb);
    if (callImmediately) cb.call(this, this.#value);
    return () => this.callbacks.delete(id);
  }

  update(callback: (value: T) => T): void
  update(newValue: T): void
  update(arg0: T | ((value: T) => T)): void {
    if (typeof arg0 === 'function') {
      this.#value = (arg0 as (value: T) => T)(this.#value);
    } else if (typeof arg0 === typeof this.#value) {
      this.#value = arg0;
    } else {
      throw new TypeError();
    }
    this.callbacks.forEach((cb) => {
      cb.call(this, this.#value);
    });
  }
}
