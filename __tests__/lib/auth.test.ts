/**
 * Auth utility tests
 */

import { resolveEmail } from '@/lib/auth';

describe('resolveEmail', () => {
  it('should return canonical email for aliased addresses', () => {
    const result = resolveEmail('laren@farther.com');
    expect(result).toBe('lauren.moone@farther.com');
  });

  it('should return lowercased email for non-aliased addresses', () => {
    const result = resolveEmail('John.Doe@Farther.com');
    expect(result).toBe('john.doe@farther.com');
  });

  it('should trim whitespace', () => {
    const result = resolveEmail('  test@farther.com  ');
    expect(result).toBe('test@farther.com');
  });

  it('should handle empty strings', () => {
    const result = resolveEmail('');
    expect(result).toBe('');
  });
});
