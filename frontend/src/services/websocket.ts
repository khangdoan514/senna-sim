// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET SERVICE — src/services/websocket.ts
// ═══════════════════════════════════════════════════════════════════════════
//
// Thin wrapper around the native WebSocket API for the simulation stream.
// Handles reconnection and message parsing so page components stay clean.
// ═══════════════════════════════════════════════════════════════════════════

import type { SimFrame } from '../types'

type StatusCallback = (status: 'connecting' | 'live' | 'disconnected' | 'error') => void
type FrameCallback  = (frame: SimFrame) => void

export class SimulationSocket {
  private ws:       WebSocket | null = null
  private sessionId: string

  onStatus: StatusCallback = () => {}
  onFrame:  FrameCallback  = () => {}

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  get wsUrl(): string {
    const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000')
      .replace(/^http/, 'ws')
    return `${base}/ws/simulation/${this.sessionId}`
  }

  connect(speed = 1.0): void {
    this.disconnect()
    this.onStatus('connecting')

    this.ws = new WebSocket(this.wsUrl)

    this.ws.onopen = () => {
      this.onStatus('live')
      this.ws?.send(JSON.stringify({ action: 'start', speed }))
    }

    this.ws.onmessage = (e) => {
      try {
        const frame: SimFrame = JSON.parse(e.data)
        this.onFrame(frame)
        if (frame.progress >= 100) {
          this.onStatus('disconnected')
          this.ws?.close()
        }
      } catch {
        console.error('[SimSocket] Bad frame', e.data)
      }
    }

    this.ws.onerror = () => this.onStatus('error')
    this.ws.onclose = () => this.onStatus('disconnected')
  }

  send(action: 'pause' | 'resume' | 'speed', value?: number): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, value }))
    }
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null
  }
}
