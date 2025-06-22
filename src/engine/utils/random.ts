// not static properties on class because Terser won't treeshake the class

const WORD_SIZE: number = 32;
const RECURSION_DEGREE: number = 624;
const MIDDLE_WORD: number = 397;
const ONE_WORD_SEPARATION_POINT: number = 31;
const MATRIX_A_BOTTOM_ROW: number = 0x9908b0df;
const TEMPERING_BIT_SHIFT_1: number = 11;
const TEMPERING_BIT_SHIFT_2: number = 7;
const TEMPERING_BIT_SHIFT_3: number = 15;
const TEMPERING_BIT_SHIFT_4: number = 18;
const TEMPERING_MASK_1: number = 0x9d2c5680;
const TEMPERING_MASK_2: number = 0xefc60000;
const UPPER_MASK: number = 0xffffffff << ONE_WORD_SEPARATION_POINT;
const LOWER_MASK: number =
  0xffffffff >>> (WORD_SIZE - ONE_WORD_SEPARATION_POINT);
const f: number = 1812433253;

class MersenneTwister {
  private state: number[];
  private stateIndex: number;

  constructor(public seed: number) {
    this.state = [];
    this.stateIndex = 0;

    this.setSeed(seed);
  }

  public setSeed(seed: number): void {
    this.state[0] = seed;

    for (let i = 1; i < RECURSION_DEGREE; i++) {
      seed = f * (seed ^ (seed >>> (WORD_SIZE - 2))) + i;
      this.state[i] = seed;
    }
  }

  /**
   * @returns { number } random int 0- 2^31-1
   */
  public randomInt(): number {
    let j = this.stateIndex - (RECURSION_DEGREE - 1);
    if (j < 0) {
      j += RECURSION_DEGREE;
    }

    let x = (this.getState() & UPPER_MASK) | (this.getState(j) & LOWER_MASK);
    let xA = x >>> 1;

    if (x & 0x00000001) {
      xA ^= MATRIX_A_BOTTOM_ROW;
    }

    j = this.stateIndex - (RECURSION_DEGREE - MIDDLE_WORD);
    if (j < 0) {
      j += RECURSION_DEGREE;
    }

    x = this.getState(j) ^ xA;
    this.state[this.stateIndex++] = x;

    if (this.stateIndex >= RECURSION_DEGREE) {
      this.stateIndex = 0;
    }

    let y = x ^ (x >>> TEMPERING_BIT_SHIFT_1);
    y ^= (y << TEMPERING_BIT_SHIFT_2) & TEMPERING_MASK_1;
    y ^= (y << TEMPERING_BIT_SHIFT_3) & TEMPERING_MASK_2;
    y ^= y >>> TEMPERING_BIT_SHIFT_4;

    return 0x7fffffff & y;
  }

  public randomFloat(): number {
    return this.randomInt() / 2147483647;
  }

  public randomFloatRange(min: number, max: number): number {
    const range = max - min;

    return range * this.randomFloat() + min;
  }

  private getState(index = this.stateIndex): number {
    return this.state[index];
  }
}

/*@__PURE__*/
// MersenneTwister is only used in development for reproducable random numbers
const twister = import.meta.env.DEV
  ? new MersenneTwister(0)
  : (null as unknown as MersenneTwister);

function random(min: number, max: number): number {
  if (import.meta.env.DEV) {
    return twister.randomFloatRange(min, max);
  } else {
    const range = max - min;

    return range * Math.random() + min;
  }
}

export { random };
