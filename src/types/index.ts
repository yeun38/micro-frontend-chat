export interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
}

export interface ChatState {
  messages: Message[]
  isConnected: boolean
  isTyping: boolean
}
