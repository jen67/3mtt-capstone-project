// FILE: frontend/__tests__/app.test.js

const { formatDateTime, validateDeadline } = require('../app');

describe('formatDateTime', () => {
  test('should format date and time correctly', () => {
    const dateTime = '2023-12-31T23:59:00';
    const formattedDateTime = formatDateTime(dateTime);
    expect(formattedDateTime).toBe('Dec 31, 2023, 11:59 PM');
  });
});

describe('validateDeadline', () => {
  test('should return false for past dates', () => {
    const pastDate = '2000-01-01T00:00:00';
    expect(validateDeadline(pastDate)).toBe(false);
  });

  test('should return true for future dates', () => {
    const futureDate = '3000-01-01T00:00:00';
    expect(validateDeadline(futureDate)).toBe(true);
  });
});