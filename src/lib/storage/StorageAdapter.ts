export interface StorageAdapter {
   save(key: string, data: unknown): Promise<void>
   load(key: string): Promise<unknown | null>
   delete(key: string): Promise<void>
   list(): Promise<string[]>
}
