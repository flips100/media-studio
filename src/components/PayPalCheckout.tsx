import { useEffect, useRef, useState } from 'react'

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID?.trim()
const PREMIUM_PRICE = '9.99'
const PAYPAL_SCRIPT_ID = 'paypal-js-sdk'

type PayPalButtonOptions = {
  createOrder: (
    data: unknown,
    actions: { order: { create: (details: { purchase_units: Array<{ amount: { currency_code: string; value: string } }> }) => Promise<string> } },
  ) => Promise<string>
  onApprove: (data: { orderID?: string }) => Promise<void>
  onCancel: () => void
  onError: (error: unknown) => void
}

type PayPalNamespace = {
  Buttons: (options: PayPalButtonOptions) => { render: (container: HTMLElement) => Promise<void> }
}

declare global {
  interface Window {
    paypal?: PayPalNamespace
  }
}

export function PayPalCheckout() {
  const buttonContainerRef = useRef<HTMLDivElement>(null)
  const [sdkReady, setSdkReady] = useState(Boolean(PAYPAL_CLIENT_ID && window.paypal))
  const [status, setStatus] = useState(
    !PAYPAL_CLIENT_ID
      ? 'Add VITE_PAYPAL_CLIENT_ID to enable checkout.'
      : window.paypal
        ? 'Ready for secure checkout.'
        : 'Loading PayPal checkout…',
  )

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) return
    if (window.paypal) return

    let script = document.getElementById(PAYPAL_SCRIPT_ID) as HTMLScriptElement | null
    const onLoad = () => {
      if (window.paypal) {
        setSdkReady(true)
        setStatus('Ready for secure checkout.')
      } else {
        setStatus('PayPal loaded without checkout buttons.')
      }
    }
    const onError = () => setStatus('PayPal could not load. Try again later.')

    if (!script) {
      script = document.createElement('script')
      script.id = PAYPAL_SCRIPT_ID
      script.async = true
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=USD&intent=capture&components=buttons`
      document.head.appendChild(script)
    }

    script.addEventListener('load', onLoad)
    script.addEventListener('error', onError)
    return () => {
      script?.removeEventListener('load', onLoad)
      script?.removeEventListener('error', onError)
    }
  }, [])

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID || !sdkReady || !buttonContainerRef.current || !window.paypal) return
    const container = buttonContainerRef.current
    container.replaceChildren()

    const buttons = window.paypal.Buttons({
      createOrder: async (_data, actions) => actions.order.create({
        purchase_units: [{ amount: { currency_code: 'USD', value: PREMIUM_PRICE } }],
      }),
      onApprove: async (data) => {
        if (!data.orderID) {
          setStatus('PayPal approved the payment, but no order ID was returned.')
          return
        }

        setStatus('Payment approved. Confirming your Premium unlock…')
        try {
          const response = await fetch('/api/paypal/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderID: data.orderID }),
          })
          if (!response.ok) throw new Error(`Capture API returned ${response.status}`)
          setStatus('Premium unlocked. Thanks for your purchase!')
        } catch (error) {
          const detail = error instanceof Error ? error.message : 'capture service unavailable'
          setStatus(`Payment approved, but Premium could not be confirmed yet (${detail}).`)
        }
      },
      onCancel: () => setStatus('Checkout canceled. You can try again anytime.'),
      onError: () => setStatus('PayPal checkout encountered an error. Please try again.'),
    })

    buttons.render(container).catch(() => setStatus('PayPal checkout could not be displayed.'))
    return () => container.replaceChildren()
  }, [sdkReady])

  return (
    <section className="premium-checkout" aria-labelledby="premium-title">
      <div className="premium-copy">
        <span className="premium-eyebrow">Premium</span>
        <h2 id="premium-title">Unlock Media Studio</h2>
        <p>One-time unlock · ${PREMIUM_PRICE} USD</p>
      </div>
      <div className="premium-action">
        <div ref={buttonContainerRef} className="paypal-buttons" />
        {!PAYPAL_CLIENT_ID && <button type="button" className="btn primary" disabled>Unlock Premium</button>}
        <p className="checkout-status" role="status">{status}</p>
      </div>
    </section>
  )
}
