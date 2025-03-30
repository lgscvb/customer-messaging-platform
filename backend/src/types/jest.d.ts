// Jest 全局類型定義
import '@types/jest';

declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any[]> {
      (...args: Y): T;
      mockImplementation(fn: (...args: Y) => T): this;
      mockImplementationOnce(fn: (...args: Y) => T): this;
      mockReturnValue(value: T): this;
      mockReturnValueOnce(value: T): this;
      mockResolvedValue(value: T): this;
      mockResolvedValueOnce(value: T): this;
      mockRejectedValue(value: any): this;
      mockRejectedValueOnce(value: any): this;
      mockReturnThis(): this;
      mockName(name: string): this;
      getMockName(): string;
      mock: {
        calls: Y[];
        instances: T[];
        invocationCallOrder: number[];
        results: Array<{ type: string; value: any }>;
      };
      mockClear(): this;
      mockReset(): this;
      mockRestore(): this;
    }

    interface Matchers<R> {
      not: Matchers<R>;
      rejects: Matchers<Promise<R>>;
      resolves: Matchers<Promise<R>>;
      toHaveProperty(propertyPath: string, value?: any): R;
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toBeNull(): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toBeGreaterThan(expected: number): R;
      toBeLessThan(expected: number): R;
      toHaveLength(expected: number): R;
      toContain(expected: any): R;
      toThrow(expected?: string | Error | RegExp): R;
      toBeCalledWith(...args: any[]): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(expected: number): R;
      toHaveBeenCalled(): R;
      toBeCalled(): R;
    }

    interface ExpectStatic {
      (actual: any): Matchers<void>;
      stringContaining(expected: string): any;
      arrayContaining(expected: any[]): any;
      objectContaining(expected: object): any;
      any(constructor: any): any;
      anything(): any;
    }
  }

  // 全局 Jest 函數
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function test(name: string, fn: () => void | Promise<void>): void;
  function beforeEach(fn: () => void | Promise<void>): void;
  function afterEach(fn: () => void | Promise<void>): void;
  function beforeAll(fn: () => void | Promise<void>): void;
  function afterAll(fn: () => void | Promise<void>): void;
  
  const expect: jest.ExpectStatic;
  
  function jest(actual: any): jest.Matchers<void>;
  namespace jest {
    function fn(): jest.Mock;
    function fn<T>(): jest.Mock<T>;
    function fn<T, Y extends any[]>(implementation?: (...args: Y) => T): jest.Mock<T, Y>;
    function clearAllMocks(): void;
    function resetAllMocks(): void;
    function restoreAllMocks(): void;
    function setTimeout(timeout: number): void;
    function mock(moduleName: string, factory?: any, options?: any): void;
  }
}
