export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  checkLimit(identifier: string, limit: number = 60, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const requests = this.requests.get(identifier)!;
    
    // Remove old requests outside the current window
    const recentRequests = requests.filter(time => time > windowStart);
    this.requests.set(identifier, recentRequests);
    
    // Check if under limit
    if (recentRequests.length < limit) {
      recentRequests.push(now);
      return true;
    }
    
    return false;
  }

  getRemainingRequests(identifier: string, limit: number = 60): number {
    const now = Date.now();
    const windowStart = now - 60000;
    
    if (!this.requests.has(identifier)) {
      return limit;
    }
    
    const requests = this.requests.get(identifier)!;
    const recentRequests = requests.filter(time => time > windowStart);
    
    return Math.max(0, limit - recentRequests.length);
  }
}
