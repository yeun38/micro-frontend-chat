declare module 'mfeHost/sharedEmotionStore' {
  interface EmotionRecord {
    emotion: string
    intensity: number
    date: string
    source: 'chatbot' | 'manual' | 'imported'
  }
  interface SharedEmotionState {
    emotionRecords: EmotionRecord[]
    getRecentOrders: (userId: string, limit: number) => Promise<unknown[]>
    setEmotionRecordsFromOrders: (orders: unknown[]) => void
    getRecentWeekRecords: (baseDate?: string) => EmotionRecord[]
  }
  interface Store {
    getState: () => SharedEmotionState
    subscribe: (listener: () => void) => () => void
  }
  export const useSharedEmotionStore: Store
}

declare module 'mfeHost/EmotionStoreInitializer' {
  const EmotionStoreInitializer: React.ComponentType
  export default EmotionStoreInitializer
}

declare module 'auth/services/orderService' {
  interface Order {
    id: string
    [key: string]: unknown
  }
  export function getRecentOrders(userId: string, count?: number): Promise<Order[]>
}
