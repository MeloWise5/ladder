import React, { useEffect, useRef } from 'react'

const STEP       = 7     // pixels between data points
const SPEED      = 1.2   // pixels scrolled per animation frame
const VOLATILITY = 18    // max price swing per step
const LOOKBACK   = 12    // bars behind current to detect local extremes

function LoginBackground() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx    = canvas.getContext('2d')
        let animId

        const resize = () => {
            canvas.width  = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        // ─── Data ────────────────────────────────────────────────────
        let prices    = []
        let markers   = []   // { baseX, y, isBuy, age }
        let scrollOff = 0    // 0 → STEP, smooth sub-pixel scroll

        const bufferCount = () => Math.ceil(canvas.width / STEP) + 100

        const nextPrice = (last) => {
            const mid = canvas.height * 0.52
            let p = last + (Math.random() - 0.49) * VOLATILITY + (mid - last) * 0.012
            return Math.max(canvas.height * 0.15, Math.min(canvas.height * 0.85, p))
        }

        // Seed initial price history
        let seed = canvas.height * 0.52
        for (let i = 0; i < bufferCount(); i++) {
            seed = nextPrice(seed)
            prices.push(seed)
        }

        // ─── Add one new data point ──────────────────────────────────
        const addPoint = () => {
            prices.push(nextPrice(prices[prices.length - 1]))

            // Scroll all markers left one step
            markers = markers
                .map(m => ({ ...m, baseX: m.baseX - STEP }))
                .filter(m => m.baseX > -120)

            // Detect local extreme LB bars behind the newest point
            const len = prices.length
            if (len > LOOKBACK * 2 + 1) {
                const pIdx   = len - LOOKBACK - 1
                const pivot  = prices[pIdx]
                const before = prices.slice(pIdx - LOOKBACK, pIdx)
                const after  = prices.slice(pIdx + 1,        pIdx + LOOKBACK + 1)

                // In canvas coords: larger y = lower price
                // isMax (y-maximum) → price trough → BUY
                // isMin (y-minimum) → price peak   → SELL
                const isBuy  = before.every(v => v <= pivot) && after.every(v => v <= pivot)
                const isSell = before.every(v => v >= pivot) && after.every(v => v >= pivot)

                if (isBuy || isSell) {
                    const baseX = canvas.width - LOOKBACK * STEP
                    const last  = markers[markers.length - 1]
                    // Enforce minimum spacing between markers
                    if (!last || (baseX - last.baseX) > STEP * 20) {
                        markers.push({ baseX, y: pivot, isBuy, age: 0 })
                    }
                }
            }

            // Trim buffer
            if (prices.length > bufferCount() + 30) prices.shift()
        }

        // ─── Draw a ladder icon ──────────────────────────────────────
        const drawLadder = (x, y, isBuy, alpha) => {
            const color   = isBuy ? '#00e676' : '#ff5252'
            const railW   = 14
            const ladderH = 28
            // Ladder sits below the dot for BUY, above for SELL
            const top     = isBuy ? y + 14 : y - 14 - ladderH

            ctx.save()
            ctx.globalAlpha = alpha
            ctx.strokeStyle = color
            ctx.fillStyle   = color
            ctx.lineWidth   = 2
            ctx.lineCap     = 'round'
            ctx.lineJoin    = 'round'

            // Connector line from dot to ladder
            ctx.beginPath()
            ctx.moveTo(x, y + (isBuy ?  4 : -4))
            ctx.lineTo(x, isBuy ? top : top + ladderH)
            ctx.stroke()

            // Left rail
            ctx.beginPath()
            ctx.moveTo(x - railW / 2, top)
            ctx.lineTo(x - railW / 2, top + ladderH)
            ctx.stroke()

            // Right rail
            ctx.beginPath()
            ctx.moveTo(x + railW / 2, top)
            ctx.lineTo(x + railW / 2, top + ladderH)
            ctx.stroke()

            // 4 rungs
            for (let r = 0; r <= 3; r++) {
                const ry = top + (ladderH / 3) * r
                ctx.beginPath()
                ctx.moveTo(x - railW / 2, ry)
                ctx.lineTo(x + railW / 2, ry)
                ctx.stroke()
            }

            // Price dot
            ctx.beginPath()
            ctx.arc(x, y, 4.5, 0, Math.PI * 2)
            ctx.fill()

            // Arrow triangle
            ctx.beginPath()
            if (isBuy) {
                const tip = top - 7
                ctx.moveTo(x,     tip)
                ctx.lineTo(x - 5, tip + 7)
                ctx.lineTo(x + 5, tip + 7)
            } else {
                const tip = top + ladderH + 7
                ctx.moveTo(x,     tip)
                ctx.lineTo(x - 5, tip - 7)
                ctx.lineTo(x + 5, tip - 7)
            }
            ctx.fill()

            // BUY / SELL label
            ctx.font      = 'bold 9px monospace'
            ctx.textAlign = 'center'
            ctx.fillText(isBuy ? 'BUY' : 'SELL', x, isBuy ? top - 12 : top + ladderH + 19)

            ctx.restore()
        }

        // ─── Main animation loop ─────────────────────────────────────
        const draw = () => {
            const W = canvas.width
            const H = canvas.height
            ctx.clearRect(0, 0, W, H)

            // Advance scroll; add a new data point every STEP pixels
            scrollOff += SPEED
            if (scrollOff >= STEP) {
                scrollOff -= STEP
                addPoint()
            }

            markers.forEach(m => m.age++)

            // Subtle horizontal grid lines
            ctx.strokeStyle = 'rgba(255,255,255,0.04)'
            ctx.lineWidth   = 1
            for (let i = 1; i <= 5; i++) {
                ctx.beginPath()
                ctx.moveTo(0, H * i / 6)
                ctx.lineTo(W, H * i / 6)
                ctx.stroke()
            }

            // Visible slice of price array
            const visible  = Math.ceil(W / STEP) + 4
            const startIdx = Math.max(0, prices.length - visible - 1)

            // Area fill under the price line
            const firstX = W - (prices.length - 1 - startIdx) * STEP - scrollOff
            ctx.beginPath()
            ctx.moveTo(firstX, prices[startIdx])
            for (let i = startIdx + 1; i < prices.length; i++) {
                const x = W - (prices.length - 1 - i) * STEP - scrollOff
                ctx.lineTo(x, prices[i])
            }
            const rightX = W - scrollOff
            ctx.lineTo(rightX, H)
            ctx.lineTo(firstX,  H)
            ctx.closePath()
            const areaGrad = ctx.createLinearGradient(0, H * 0.1, 0, H * 0.9)
            areaGrad.addColorStop(0,   'rgba(41,182,246,0.18)')
            areaGrad.addColorStop(0.6, 'rgba(41,182,246,0.06)')
            areaGrad.addColorStop(1,   'rgba(41,182,246,0.00)')
            ctx.fillStyle = areaGrad
            ctx.fill()

            // Price line — green when price rises, red when it falls
            ctx.lineWidth = 2.5
            ctx.lineJoin  = 'round'
            ctx.lineCap   = 'round'
            for (let i = startIdx + 1; i < prices.length; i++) {
                const x1 = W - (prices.length - i)       * STEP - scrollOff
                const x2 = W - (prices.length - 1 - i)   * STEP - scrollOff
                const y1 = prices[i - 1]
                const y2 = prices[i]
                ctx.beginPath()
                ctx.moveTo(x1, y1)
                ctx.lineTo(x2, y2)
                // Lower y on canvas = higher price = going up = green
                ctx.strokeStyle = y2 <= y1 ? '#66bb6a' : '#ef5350'
                ctx.stroke()
            }

            // Ladder buy / sell markers
            markers.forEach(m => {
                const x = m.baseX - scrollOff
                if (x < -120 || x > W + 120) return
                drawLadder(x, m.y, m.isBuy, Math.min(1, m.age / 30))
            })

            animId = requestAnimationFrame(draw)
        }

        draw()

        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener('resize', resize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: 0.28,
                pointerEvents: 'none',
            }}
        />
    )
}

export default LoginBackground
