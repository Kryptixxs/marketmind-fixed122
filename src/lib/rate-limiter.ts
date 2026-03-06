type QueuedCall<T> = {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (err: Error) => void;
};

class RateLimiter {
  private queue: QueuedCall<any>[] = [];
  private timestamps: number[] = [];
  private maxPerWindow: number;
  private windowMs: number;
  private processing = false;

  constructor(maxPerWindow: number, windowMs: number) {
    this.maxPerWindow = maxPerWindow;
    this.windowMs = windowMs;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);

      if (this.timestamps.length >= this.maxPerWindow) {
        const oldestInWindow = this.timestamps[0];
        const waitMs = this.windowMs - (now - oldestInWindow) + 50;
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      const item = this.queue.shift();
      if (!item) break;

      this.timestamps.push(Date.now());
      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (err) {
        item.reject(err as Error);
      }
    }

    this.processing = false;
  }
}

const limiters: Record<string, RateLimiter> = {};

export function getRateLimiter(name: string, maxPerWindow: number, windowMs: number): RateLimiter {
  if (!limiters[name]) {
    limiters[name] = new RateLimiter(maxPerWindow, windowMs);
  }
  return limiters[name];
}

export function getConcurrencyLimiter(maxConcurrent: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  return async function <T>(fn: () => Promise<T>): Promise<T> {
    if (active >= maxConcurrent) {
      await new Promise<void>(resolve => queue.push(resolve));
    }
    active++;
    try {
      return await fn();
    } finally {
      active--;
      const next = queue.shift();
      if (next) next();
    }
  };
}
