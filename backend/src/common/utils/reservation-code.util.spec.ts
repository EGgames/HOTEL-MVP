import { generateReservationCode } from './reservation-code.util';

describe('generateReservationCode', () => {
  it('returns a string of length 8', () => {
    const code = generateReservationCode();
    expect(code).toHaveLength(8);
  });

  it('contains only uppercase letters and digits', () => {
    const code = generateReservationCode();
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('generates different codes on successive calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateReservationCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
