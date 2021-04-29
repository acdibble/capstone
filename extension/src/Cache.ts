export default class Cache {
  #cache = {} as Record<string, boolean>

  constructor(other?: Record<string, boolean>) {
    if (other) this.#cache = other;
  }

  set(key: string, value: boolean): this {
    this.#cache[key] = value;
    return this;
  }

  get(key: string): boolean {
    return this.#cache[key];
  }

  clear(): this {
    this.#cache = {} as Record<string, boolean>;

    return this;
  }

  toJSON(): Record<string, boolean> {
    return this.#cache;
  }
}
