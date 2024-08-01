export async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (localStorage.getItem(key)) {
    return JSON.parse(localStorage.getItem(key)!)
  }

  const result = await fn()
  localStorage.setItem(key, JSON.stringify(result))

  return result
}