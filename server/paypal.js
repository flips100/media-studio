/**
 * PayPal REST helpers (Orders v2).
 * Env: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, optional PAYPAL_API_BASE
 * (default sandbox: https://api-m.sandbox.paypal.com ; live: https://api-m.paypal.com)
 */

const DEFAULT_BASE =
  process.env.PAYPAL_API_BASE ||
  (process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com')

function credentialsOk() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
}

async function getAccessToken() {
  if (!credentialsOk()) {
    throw new Error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET')
  }
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString('base64')
  const res = await fetch(`${DEFAULT_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error_description || data?.error || 'PayPal auth failed')
  }
  return data.access_token
}

/**
 * @param {{ amount: string, currency?: string, description?: string }} opts
 */
export async function createOrder({ amount, currency = 'USD', description = 'Media Studio Premium' }) {
  const token = await getAccessToken()
  const res = await fetch(`${DEFAULT_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description,
          amount: {
            currency_code: currency,
            value: String(amount),
          },
        },
      ],
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data) || 'create order failed')
  }
  return data
}

/** @param {string} orderId */
export async function captureOrder(orderId) {
  const token = await getAccessToken()
  const res = await fetch(`${DEFAULT_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data) || 'capture failed')
  }
  return data
}

export { credentialsOk, DEFAULT_BASE as paypalApiBase }
