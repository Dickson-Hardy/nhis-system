import { EventEmitter } from 'events'

export interface SyncEvent {
  type: string
  data: any
  timestamp: number
  source: string
}

export interface SyncOptions {
  autoReconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

export class RealTimeSync extends EventEmitter {
  private static instance: RealTimeSync
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private isConnected = false
  private options: SyncOptions

  private constructor(options: SyncOptions = {}) {
    super()
    this.options = {
      autoReconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...options
    }
  }

  static getInstance(options?: SyncOptions): RealTimeSync {
    if (!RealTimeSync.instance) {
      RealTimeSync.instance = new RealTimeSync(options)
    }
    return RealTimeSync.instance
  }

  /**
   * Connect to WebSocket server
   */
  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url)
        
        this.ws.onopen = () => {
          this.isConnected = true
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.emit('connected')
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const syncEvent: SyncEvent = JSON.parse(event.data)
            this.handleSyncEvent(syncEvent)
          } catch (error) {
            console.error('Error parsing sync event:', error)
          }
        }

        this.ws.onclose = (event) => {
          this.isConnected = false
          this.stopHeartbeat()
          this.emit('disconnected', event)
          
          if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts!) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          this.emit('error', error)
          reject(error)
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.stopHeartbeat()
    this.isConnected = false
  }

  /**
   * Send data to WebSocket server
   */
  send(type: string, data: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false
    }

    try {
      const syncEvent: SyncEvent = {
        type,
        data,
        timestamp: Date.now(),
        source: 'facility-dashboard'
      }
      
      this.ws.send(JSON.stringify(syncEvent))
      return true
    } catch (error) {
      console.error('Error sending sync event:', error)
      return false
    }
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(eventType: string, callback: (data: any) => void): void {
    this.on(eventType, callback)
  }

  /**
   * Unsubscribe from specific event types
   */
  unsubscribe(eventType: string, callback: (data: any) => void): void {
    this.off(eventType, callback)
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * Handle incoming sync events
   */
  private handleSyncEvent(event: SyncEvent): void {
    // Emit the event type for subscribers
    this.emit(event.type, event.data)
    
    // Emit a generic sync event
    this.emit('sync', event)
    
    // Handle specific event types
    switch (event.type) {
      case 'claim_updated':
        this.handleClaimUpdate(event.data)
        break
      case 'batch_updated':
        this.handleBatchUpdate(event.data)
        break
      case 'notification_received':
        this.handleNotificationReceived(event.data)
        break
      case 'status_change':
        this.handleStatusChange(event.data)
        break
      case 'payment_update':
        this.handlePaymentUpdate(event.data)
        break
      default:
        // Unknown event type, just emit it
        break
    }
  }

  /**
   * Handle claim updates
   */
  private handleClaimUpdate(data: any): void {
    // Emit specific claim update events
    this.emit('claim_updated', data)
    
    // Update local storage or state if needed
    if (typeof window !== 'undefined') {
      // Update claims in localStorage for offline access
      const existingClaims = JSON.parse(localStorage.getItem('facility_claims') || '[]')
      const updatedClaims = existingClaims.map((claim: any) => 
        claim.id === data.id ? { ...claim, ...data } : claim
      )
      localStorage.setItem('facility_claims', JSON.stringify(updatedClaims))
    }
  }

  /**
   * Handle batch updates
   */
  private handleBatchUpdate(data: any): void {
    // Emit specific batch update events
    this.emit('batch_updated', data)
    
    // Update local storage or state if needed
    if (typeof window !== 'undefined') {
      const existingBatches = JSON.parse(localStorage.getItem('facility_batches') || '[]')
      const updatedBatches = existingBatches.map((batch: any) => 
        batch.id === data.id ? { ...batch, ...data } : batch
      )
      localStorage.setItem('facility_batches', JSON.stringify(updatedBatches))
    }
  }

  /**
   * Handle notification updates
   */
  private handleNotificationReceived(data: any): void {
    // Emit specific notification events
    this.emit('notification_received', data)
    
    // Show browser notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title, {
        body: data.message,
        icon: '/placeholder-logo.png'
      })
    }
  }

  /**
   * Handle status changes
   */
  private handleStatusChange(data: any): void {
    // Emit specific status change events
    this.emit('status_change', data)
    
    // Update UI components that show status
    this.emit('ui_update_required', {
      type: 'status_change',
      data
    })
  }

  /**
   * Handle payment updates
   */
  private handlePaymentUpdate(data: any): void {
    // Emit specific payment update events
    this.emit('payment_update', data)
    
    // Update financial displays
    this.emit('financial_update_required', data)
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      this.emit('reconnecting', this.reconnectAttempts)
      
      // Attempt to reconnect
      if (this.ws && this.ws.readyState === WebSocket.CLOSED) {
        this.connect(this.ws.url)
      }
    }, this.options.reconnectInterval)
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send('heartbeat', { timestamp: Date.now() })
      }
    }, this.options.heartbeatInterval)
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * Simulate real-time updates for development/testing
   */
  simulateRealTimeUpdates(): void {
    if (typeof window === 'undefined') return
    
    // Simulate claim updates every 30 seconds
    setInterval(() => {
      this.emit('claim_updated', {
        id: Math.floor(Math.random() * 1000),
        status: ['submitted', 'awaiting_verification', 'verified', 'rejected'][Math.floor(Math.random() * 4)],
        updatedAt: new Date().toISOString()
      })
    }, 30000)

    // Simulate batch updates every 60 seconds
    setInterval(() => {
      this.emit('batch_updated', {
        id: Math.floor(Math.random() * 100),
        status: ['draft', 'submitted', 'approved', 'closed'][Math.floor(Math.random() * 4)],
        updatedAt: new Date().toISOString()
      })
    }, 60000)

    // Simulate notifications every 45 seconds
    setInterval(() => {
      this.emit('notification_received', {
        id: Math.floor(Math.random() * 1000),
        title: 'System Update',
        message: 'Your batch has been processed',
        type: 'info',
        category: 'batch'
      })
    }, 45000)
  }
}

// Export singleton instance
export const realTimeSync = RealTimeSync.getInstance()

// Export types for use in components
export type { SyncEvent, SyncOptions }
