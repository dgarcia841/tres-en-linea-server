export function choose<T>(...args: T[]) {
    return args[Math.floor(Math.random() * args.length)];
}