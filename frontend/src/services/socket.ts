import { io, Socket } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000'

class SocketService {
  private socket: Socket | null = null

  connect() {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    })

    this.socket.on('connect', () => {
      console.log('✅ Socket bağlandı:', this.socket?.id)
    })

    this.socket.on('disconnect', () => {
      console.log('❌ Socket bağlantısı kesildi')
    })

    this.socket.on('error', (error: any) => {
      console.error('Socket hatası:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Orderbook
  subscribeOrderbook(symbol: string, callback: (data: any) => void) {
    if (!this.socket) this.connect()
    this.socket?.emit('subscribe:orderbook', symbol)
    this.socket?.on('orderbook:update', callback)
  }

  unsubscribeOrderbook(symbol: string, callback: (data: any) => void) {
    this.socket?.emit('unsubscribe:orderbook', symbol)
    this.socket?.off('orderbook:update', callback)
  }

  // Trades
  subscribeTrades(symbol: string, callback: (data: any) => void) {
    if (!this.socket) this.connect()
    this.socket?.emit('subscribe:trades', symbol)
    this.socket?.on('trade:new', callback)
  }

  unsubscribeTrades(symbol: string, callback: (data: any) => void) {
    this.socket?.emit('unsubscribe:trades', symbol)
    this.socket?.off('trade:new', callback)
  }

  // News
  subscribeNews(callback: (data: any) => void) {
    if (!this.socket) this.connect()
    this.socket?.emit('subscribe:news')
    this.socket?.on('news:new', callback)
  }

  unsubscribeNews(callback: (data: any) => void) {
    this.socket?.emit('unsubscribe:news')
    this.socket?.off('news:new', callback)
  }

  // Leaderboard
  subscribeLeaderboard(callback: (data: any) => void) {
    if (!this.socket) this.connect()
    this.socket?.emit('subscribe:leaderboard')
    this.socket?.on('leaderboard:update', callback)
  }

  unsubscribeLeaderboard(callback: (data: any) => void) {
    this.socket?.emit('unsubscribe:leaderboard')
    this.socket?.off('leaderboard:update', callback)
  }
}

export const socketService = new SocketService()
