declare module 'lodash/debounce' {
  import { DebouncedFunc, DebounceSettings } from 'lodash';
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: DebounceSettings
  ): DebouncedFunc<T>;
  export = debounce;
}
