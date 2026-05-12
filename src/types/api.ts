export type QueryOptions = {
  where?: Record<string, unknown>
  orderBy?: Record<string, 'asc' | 'desc'>
}

export type ApiCollection<T> = T[] | {
  data: T[]
  meta?: Record<string, unknown>
  links?: Record<string, unknown>
}

export type ApiResource<T> = T | {
  data: T
}

export type ApiTable = {
  list<T = any>(options?: QueryOptions): Promise<T[]>
  get<T = any>(id: string): Promise<T | null>
  count(options?: QueryOptions): Promise<number>
  create<T = any>(data: any): Promise<T>
  update<T = any>(id: string, data: any): Promise<T | null>
  delete(id: string): Promise<unknown>
}

export type StorageUploadResult = {
  path: string
  publicUrl: string
}
