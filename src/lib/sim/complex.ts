export type Complex = { re: number; im: number };

export const cadd = (a: Complex, b: Complex): Complex => ({
  re: a.re + b.re,
  im: a.im + b.im,
});

export const cmul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

export const scale = (c: Complex, s: number): Complex => ({
  re: c.re * s,
  im: c.im * s,
});

export const cabs2 = (c: Complex): number => c.re * c.re + c.im * c.im;
