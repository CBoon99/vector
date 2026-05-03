/**
 * @jest-environment jsdom
 */
import { generateId } from '../utils/id-generator.js';

describe('smoke', () => {
    it('generates ids', () => {
        const a = generateId('t');
        const b = generateId('t');
        expect(a).not.toBe(b);
        expect(a.length).toBeGreaterThan(4);
    });
});
