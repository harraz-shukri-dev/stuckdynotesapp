import React, { useEffect } from 'react'
import confetti from 'canvas-confetti'

export default function Confetti() {
  useEffect(() => {
    const duration = 2500
    const end = Date.now() + duration

    const colors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ec4899']

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
        zIndex: 9999,
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
        zIndex: 9999,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }

    frame()
  }, [])

  return null // purely imperative via canvas-confetti
}
