import LinkedList from './libs/LinkedList';
declare class WaitQueue<T> {
    [Symbol.iterator]: () => {
        next: () => {
            value: any;
            done: boolean;
        };
    };
    queue: LinkedList;
    listeners: LinkedList;
    get length(): number;
    empty(): void;
    clear(): void;
    clearListeners(): void;
    unshift(...items: T[]): number;
    push(...items: T[]): number;
    shift(): Promise<T>;
    pop(): Promise<T>;
    private _flush;
}
export = WaitQueue;
