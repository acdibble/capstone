/* eslint-disable lines-between-class-members */
type Callback<T> = (value: T) => void

export default class Observable<T> {
  #value: T
  callbacks: Callback<T>[] = []

  constructor(value: T) {
    this.#value = value;
  }

  get value(): T {
    return this.#value;
  }

  watch(cb: Callback<T>): void {
    this.callbacks.push(cb);
    cb(this.value);
  }

  update(callback: (value: T) => T): void
  update(newValue: T): void
  update(arg0: T | ((value: T) => T)): void {
    if (typeof arg0 === 'function') {
      this.#value = (arg0 as (value: T) => T)(this.#value);
    } else if (typeof arg0 === typeof this.value) {
      this.#value = arg0;
    } else {
      throw new TypeError();
    }
    this.callbacks.forEach((cb) => {
      cb(this.#value);
    });
  }
}
