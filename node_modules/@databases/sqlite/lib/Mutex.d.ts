interface Task {
    start: number;
    write: boolean;
    fn: () => Promise<void>;
}
export default class Mutex {
    readonly maxWaitTimeout: number;
    tasks: Task[];
    running: number;
    runningWrite: boolean;
    constructor(maxWaitTimeout?: number);
    _taskStart: (runningWrite: boolean) => void;
    _taskEnd: () => void;
    readLock<T>(fn: () => Promise<T>): Promise<T>;
    writeLock<T>(fn: () => Promise<T>): Promise<T>;
}
export {};
