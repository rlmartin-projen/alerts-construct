export function compact<T>(arr: (T | undefined)[]): T[] {
  return arr.filter(_ => _) as T[];
}
