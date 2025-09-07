import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to vitest globals', () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it('should have jsdom environment', () => {
    expect(window).toBeDefined();
    expect(document).toBeDefined();
  });

  it('should have mocked localStorage', () => {
    expect(localStorage).toBeDefined();
    expect(localStorage.getItem).toBeDefined();
    expect(localStorage.setItem).toBeDefined();
  });
});