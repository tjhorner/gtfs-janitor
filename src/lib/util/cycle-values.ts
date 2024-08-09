export function cycleValues<T extends string[]>(currentValue: string, values: T): T[number] {
  const currentIndex = values.indexOf(currentValue)
  return values[(currentIndex + 1) % values.length]
}