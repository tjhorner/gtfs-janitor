export interface IEntityStore<T> {
  get(id: string): Promise<T | undefined>
  getAll(): Promise<T[]>
  add(entity: T): Promise<void>
  update(entity: T): Promise<void>
  delete(id: string): Promise<void>
}
