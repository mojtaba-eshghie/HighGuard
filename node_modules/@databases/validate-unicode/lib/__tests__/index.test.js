"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const __1 = require("..");

const pairEscaped = '\ud83d\ude00';
const pairUnescaped = '😀';
const escapedInvalidCharPlaceholder = '\uFFFD';
const invalidCharPlaceholder = '�';
test('Our unicode symbol is made of two surrogate pairs', () => {
  expect(pairEscaped).toBe(pairUnescaped);
  expect(escapedInvalidCharPlaceholder).toBe(invalidCharPlaceholder);
});
test('removeInvalidUnicode', () => {
  expect(__1.removeInvalidUnicode(pairUnescaped)).toBe(pairUnescaped);
  expect(__1.removeInvalidUnicode(pairUnescaped[0])).toBe(invalidCharPlaceholder);
  expect(__1.removeInvalidUnicode(pairUnescaped[1])).toBe(invalidCharPlaceholder);
  expect(__1.removeInvalidUnicode(`hello😀`)).toBe(`hello😀`);
  expect(__1.removeInvalidUnicode(`😀world`)).toBe(`😀world`);
  expect(__1.removeInvalidUnicode(`hello😀world`)).toBe(`hello😀world`);
  expect(__1.removeInvalidUnicode(`hello${pairUnescaped[0]}`)).toBe(`hello${invalidCharPlaceholder}`);
  expect(__1.removeInvalidUnicode(`${pairUnescaped[0]}world`)).toBe(`${invalidCharPlaceholder}world`);
  expect(__1.removeInvalidUnicode(`hello${pairUnescaped[0]}world`)).toBe(`hello${invalidCharPlaceholder}world`);
  expect(__1.removeInvalidUnicode(`hello${pairUnescaped[1]}world`)).toBe(`hello${invalidCharPlaceholder}world`);
});
test('isValidUnicode', () => {
  expect(__1.isValidUnicode(pairUnescaped)).toBe(true);
  expect(__1.isValidUnicode(pairUnescaped[0])).toBe(false);
  expect(__1.isValidUnicode(pairUnescaped[1])).toBe(false);
  expect(__1.isValidUnicode(`hello😀world`)).toBe(true);
  expect(__1.isValidUnicode(`hello😀`)).toBe(true);
  expect(__1.isValidUnicode(`😀world`)).toBe(true);
  expect(__1.isValidUnicode(`hello${pairUnescaped[0]}world`)).toBe(false);
  expect(__1.isValidUnicode(`hello${pairUnescaped[1]}world`)).toBe(false);
  expect(__1.isValidUnicode(`${pairUnescaped[0]}world`)).toBe(false);
  expect(__1.isValidUnicode(`${pairUnescaped[1]}world`)).toBe(false);
  expect(__1.isValidUnicode(`hello${pairUnescaped[0]}`)).toBe(false);
  expect(__1.isValidUnicode(`hello${pairUnescaped[1]}`)).toBe(false);
});
test('assertValidUnicode', () => {
  expect(() => __1.default(pairUnescaped)).not.toThrow();
  expect(() => __1.default(pairUnescaped[0])).toThrowError(`This string contains unmatched surrogate pairs: "\\ud83d"`);
  expect(() => __1.default(pairUnescaped[1])).toThrowError(`This string contains unmatched surrogate pairs: "\\ude00"`);
  expect(() => __1.default(`hello😀world`)).not.toThrow();
  expect(() => __1.default(`hello${pairUnescaped[0]}world`)).toThrowError(`This string contains unmatched surrogate pairs: "hello\\ud83dworld"`);
  expect(() => __1.default(`hello${pairUnescaped[1]}world`)).toThrowError(`This string contains unmatched surrogate pairs: "hello\\ude00world"`);
});