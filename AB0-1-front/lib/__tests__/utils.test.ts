import { isCorporateEmail } from '../utils';

describe('isCorporateEmail', () => {
  it('should return true for corporate email domains', () => {
    expect(isCorporateEmail('user@company.com')).toBe(true);
    expect(isCorporateEmail('john@acme.org')).toBe(true);
    expect(isCorporateEmail('dev@startup.io')).toBe(true);
  });

  it('should return false for public email domains', () => {
    expect(isCorporateEmail('user@gmail.com')).toBe(false);
    expect(isCorporateEmail('john@hotmail.com')).toBe(false);
    expect(isCorporateEmail('dev@outlook.com')).toBe(false);
    expect(isCorporateEmail('test@uol.com.br')).toBe(false);
  });

  it('should return false for empty or invalid email', () => {
    expect(isCorporateEmail('')).toBe(false);
    expect(isCorporateEmail('invalid-email')).toBe(false);
  });
});
