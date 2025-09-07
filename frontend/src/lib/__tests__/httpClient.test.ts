import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Simple test to verify test setup
describe('HttpClient', () => {
  it('should be able to run tests', () => {
    expect(true).toBe(true);
  });

  it('should have axios available', () => {
    expect(axios).toBeDefined();
  });
});