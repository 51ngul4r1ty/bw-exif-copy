import { dctCos1, dctCos3, dctCos6, dctSin1, dctSin3, dctSin6, dctSqrt1d2, dctSqrt2 } from "./dctConstants.ts";

// A port of poppler's IDCT method which in turn is taken from:
//   Christoph Loeffler, Adriaan Ligtenberg, George S. Moschytz,
//   "Practical Fast 1-D DCT Algorithms with 11 Multiplications",
//   IEEE Intl. Conf. on Acoustics, Speech & Signal Processing, 1989,
//   988-991.
export function quantizeAndInverse(component: any, zz: any, dataOut: any, dataIn: any) {
  var qt = component.quantizationTable;
  var v0, v1, v2, v3, v4, v5, v6, v7, t;
  var p = dataIn;
  var i;

  // dequant
  for (i = 0; i < 64; i++) p[i] = zz[i] * qt[i];

  // inverse DCT on rows
  for (i = 0; i < 8; ++i) {
    var row = 8 * i;

    // check for all-zero AC coefficients
    if (
      p[1 + row] == 0 &&
      p[2 + row] == 0 &&
      p[3 + row] == 0 &&
      p[4 + row] == 0 &&
      p[5 + row] == 0 &&
      p[6 + row] == 0 &&
      p[7 + row] == 0
    ) {
      t = (dctSqrt2 * p[0 + row] + 512) >> 10;
      p[0 + row] = t;
      p[1 + row] = t;
      p[2 + row] = t;
      p[3 + row] = t;
      p[4 + row] = t;
      p[5 + row] = t;
      p[6 + row] = t;
      p[7 + row] = t;
      continue;
    }

    // stage 4
    v0 = (dctSqrt2 * p[0 + row] + 128) >> 8;
    v1 = (dctSqrt2 * p[4 + row] + 128) >> 8;
    v2 = p[2 + row];
    v3 = p[6 + row];
    v4 = (dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128) >> 8;
    v7 = (dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128) >> 8;
    v5 = p[3 + row] << 4;
    v6 = p[5 + row] << 4;

    // stage 3
    t = (v0 - v1 + 1) >> 1;
    v0 = (v0 + v1 + 1) >> 1;
    v1 = t;
    t = (v2 * dctSin6 + v3 * dctCos6 + 128) >> 8;
    v2 = (v2 * dctCos6 - v3 * dctSin6 + 128) >> 8;
    v3 = t;
    t = (v4 - v6 + 1) >> 1;
    v4 = (v4 + v6 + 1) >> 1;
    v6 = t;
    t = (v7 + v5 + 1) >> 1;
    v5 = (v7 - v5 + 1) >> 1;
    v7 = t;

    // stage 2
    t = (v0 - v3 + 1) >> 1;
    v0 = (v0 + v3 + 1) >> 1;
    v3 = t;
    t = (v1 - v2 + 1) >> 1;
    v1 = (v1 + v2 + 1) >> 1;
    v2 = t;
    t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
    v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
    v7 = t;
    t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
    v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
    v6 = t;

    // stage 1
    p[0 + row] = v0 + v7;
    p[7 + row] = v0 - v7;
    p[1 + row] = v1 + v6;
    p[6 + row] = v1 - v6;
    p[2 + row] = v2 + v5;
    p[5 + row] = v2 - v5;
    p[3 + row] = v3 + v4;
    p[4 + row] = v3 - v4;
  }

  // inverse DCT on columns
  for (i = 0; i < 8; ++i) {
    var col = i;

    // check for all-zero AC coefficients
    if (
      p[1 * 8 + col] == 0 &&
      p[2 * 8 + col] == 0 &&
      p[3 * 8 + col] == 0 &&
      p[4 * 8 + col] == 0 &&
      p[5 * 8 + col] == 0 &&
      p[6 * 8 + col] == 0 &&
      p[7 * 8 + col] == 0
    ) {
      t = (dctSqrt2 * dataIn[i + 0] + 8192) >> 14;
      p[0 * 8 + col] = t;
      p[1 * 8 + col] = t;
      p[2 * 8 + col] = t;
      p[3 * 8 + col] = t;
      p[4 * 8 + col] = t;
      p[5 * 8 + col] = t;
      p[6 * 8 + col] = t;
      p[7 * 8 + col] = t;
      continue;
    }

    // stage 4
    v0 = (dctSqrt2 * p[0 * 8 + col] + 2048) >> 12;
    v1 = (dctSqrt2 * p[4 * 8 + col] + 2048) >> 12;
    v2 = p[2 * 8 + col];
    v3 = p[6 * 8 + col];
    v4 = (dctSqrt1d2 * (p[1 * 8 + col] - p[7 * 8 + col]) + 2048) >> 12;
    v7 = (dctSqrt1d2 * (p[1 * 8 + col] + p[7 * 8 + col]) + 2048) >> 12;
    v5 = p[3 * 8 + col];
    v6 = p[5 * 8 + col];

    // stage 3
    t = (v0 - v1 + 1) >> 1;
    v0 = (v0 + v1 + 1) >> 1;
    v1 = t;
    t = (v2 * dctSin6 + v3 * dctCos6 + 2048) >> 12;
    v2 = (v2 * dctCos6 - v3 * dctSin6 + 2048) >> 12;
    v3 = t;
    t = (v4 - v6 + 1) >> 1;
    v4 = (v4 + v6 + 1) >> 1;
    v6 = t;
    t = (v7 + v5 + 1) >> 1;
    v5 = (v7 - v5 + 1) >> 1;
    v7 = t;

    // stage 2
    t = (v0 - v3 + 1) >> 1;
    v0 = (v0 + v3 + 1) >> 1;
    v3 = t;
    t = (v1 - v2 + 1) >> 1;
    v1 = (v1 + v2 + 1) >> 1;
    v2 = t;
    t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
    v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
    v7 = t;
    t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
    v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
    v6 = t;

    // stage 1
    p[0 * 8 + col] = v0 + v7;
    p[7 * 8 + col] = v0 - v7;
    p[1 * 8 + col] = v1 + v6;
    p[6 * 8 + col] = v1 - v6;
    p[2 * 8 + col] = v2 + v5;
    p[5 * 8 + col] = v2 - v5;
    p[3 * 8 + col] = v3 + v4;
    p[4 * 8 + col] = v3 - v4;
  }

  // convert to 8-bit integers
  for (i = 0; i < 64; ++i) {
    var sample = 128 + ((p[i] + 8) >> 4);
    dataOut[i] = sample < 0 ? 0 : sample > 0xff ? 0xff : sample;
  }
};
