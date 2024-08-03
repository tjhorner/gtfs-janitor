import jsonata from "jsonata"

export function jsonataFilter(expression: string) {
  const filter = jsonata(`$filter($,function($v,$i,$a){${expression}})`)
  return <T>(data: T[]): Promise<T[]> => filter.evaluate(data)
}
