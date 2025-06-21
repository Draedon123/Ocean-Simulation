class MersenneTwister {
  public static readonly WORD_SIZE: number = 32;
  public static readonly RECURSION_DEGREE: number = 624;
  public static readonly MIDDLE_WORD: number = 397;
  public static readonly ONE_WORD_SEPARATION_POINT: number = 31;
  public static readonly MATRIX_A_BOTTOM_ROW: number = 0x9908b0df;
  public static readonly TEMPERING_BIT_SHIFT_1: number = 11;
  public static readonly TEMPERING_BIT_SHIFT_2: number = 7;
  public static readonly TEMPERING_BIT_SHIFT_3: number = 15;
  public static readonly TEMPERING_BIT_SHIFT_4: number = 18;
  public static readonly TEMPERING_MASK_1: number = 0x9d2c5680;
  public static readonly TEMPERING_MASK_2: number = 0xefc60000;
  public static readonly UPPER_MASK: number =
    0xffffffff << MersenneTwister.ONE_WORD_SEPARATION_POINT;
  public static readonly LOWER_MASK: number =
    0xffffffff >>>
    (MersenneTwister.WORD_SIZE - MersenneTwister.ONE_WORD_SEPARATION_POINT);
  public static readonly f: number = 1812433253;

  private state: number[];
  private stateIndex: number;

  constructor(public seed: number) {
    this.state = [];
    this.stateIndex = 0;

    this.setSeed(seed);
  }

  public setSeed(seed: number): void {
    this.state[0] = seed;

    for (let i = 1; i < MersenneTwister.RECURSION_DEGREE; i++) {
      seed =
        MersenneTwister.f *
          (seed ^ (seed >>> (MersenneTwister.WORD_SIZE - 2))) +
        i;
      this.state[i] = seed;
    }
  }

  /**
   * @returns { number } random int 0- 2^31-1
   */
  public randomInt(): number {
    let j = this.stateIndex - (MersenneTwister.RECURSION_DEGREE - 1);
    if (j < 0) {
      j += MersenneTwister.RECURSION_DEGREE;
    }

    let x =
      (this.getState() & MersenneTwister.UPPER_MASK) |
      (this.getState(j) & MersenneTwister.LOWER_MASK);
    let xA = x >>> 1;

    if (x & 0x00000001) {
      xA ^= MersenneTwister.MATRIX_A_BOTTOM_ROW;
    }

    j =
      this.stateIndex -
      (MersenneTwister.RECURSION_DEGREE - MersenneTwister.MIDDLE_WORD);
    if (j < 0) {
      j += MersenneTwister.RECURSION_DEGREE;
    }

    x = this.getState(j) ^ xA;
    this.state[this.stateIndex++] = x;

    if (this.stateIndex >= MersenneTwister.RECURSION_DEGREE) {
      this.stateIndex = 0;
    }

    let y = x ^ (x >>> MersenneTwister.TEMPERING_BIT_SHIFT_1);
    y ^=
      (y << MersenneTwister.TEMPERING_BIT_SHIFT_2) &
      MersenneTwister.TEMPERING_MASK_1;
    y ^=
      (y << MersenneTwister.TEMPERING_BIT_SHIFT_3) &
      MersenneTwister.TEMPERING_MASK_2;
    y ^= y >>> MersenneTwister.TEMPERING_BIT_SHIFT_4;

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

const twister = new MersenneTwister(0);

function random(min: number, max: number): number {
  if (import.meta.env.DEV) {
    return twister.randomFloatRange(min, max);
  } else {
    const range = max - min;

    return range * Math.random() + min;
  }
}

export { random };
