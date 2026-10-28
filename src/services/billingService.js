import { createDemoStorage } from '../mocks/demoStorage.js'
import { apiFetch, IS_DEMO_MODE } from './apiClient.js'
import { fetchPlans } from './pricingService.js'

const demoStorage = createDemoStorage('legacyvault-demo-billing')

function makeId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${random}`
}

function makeDemoState() {
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  return {
    subscription: {
      planId: 'essentials',
      billingCycle: 'MONTHLY',
      status: 'ACTIVE',
      startedAt: now.toISOString(),
      currentPeriodEndsAt: periodEnd.toISOString(),
      gracePeriodEndsAt: null,
      autoRenew: true,
    },
    methods: [{
      paymentMethodId: 'demo-method-4242',
      cardholderName: 'Demo Vault Owner',
      brand: 'VISA',
      lastFour: '4242',
      expiryMonth: 12,
      expiryYear: now.getFullYear() + 2,
      billingAddress: null,
      isDefault: true,
      createdAt: now.toISOString(),
      providerPaymentMethodToken: 'pm_mock_demo_success',
    }],
    transactions: [{
      transactionId: 'demo-transaction-initial',
      planId: 'essentials',
      billingCycle: 'MONTHLY',
      amount: 4.99,
      currency: 'USD',
      status: 'SUCCEEDED',
      providerReference: 'demo-provider-reference',
      failureCode: null,
      failureMessage: null,
      paymentMethodBrand: 'VISA',
      paymentMethodLastFour: '4242',
      createdAt: now.toISOString(),
    }],
  }
}

function getDemoState() {
  const state = demoStorage.get() || makeDemoState()
  demoStorage.set(state)
  return state
}

function saveDemoState(state) {
  demoStorage.set(state)
  return state
}

function publicPaymentMethod(method) {
  const result = { ...method }
  delete result.providerPaymentMethodToken
  return result
}

export function getSubscription() {
  if (IS_DEMO_MODE) return Promise.resolve({ ...getDemoState().subscription })
  return apiFetch('/billing/subscription')
}

export function listPaymentMethods() {
  if (IS_DEMO_MODE) {
    return Promise.resolve(getDemoState().methods.map(publicPaymentMethod))
  }
  return apiFetch('/billing/payment-methods')
}

export function addPaymentMethod(data) {
  if (IS_DEMO_MODE) {
    const state = getDemoState()
    const makeDefault = Boolean(data.makeDefault) || state.methods.length === 0
    if (makeDefault) state.methods = state.methods.map((method) => ({ ...method, isDefault: false }))
    const method = {
      paymentMethodId: makeId('demo-method'),
      cardholderName: data.cardholderName.trim(),
      brand: data.brand.toUpperCase(),
      lastFour: data.lastFour,
      expiryMonth: Number(data.expiryMonth),
      expiryYear: Number(data.expiryYear),
      billingAddress: data.billingAddress || null,
      isDefault: makeDefault,
      createdAt: new Date().toISOString(),
      providerPaymentMethodToken: data.providerPaymentMethodToken,
    }
    state.methods.unshift(method)
    saveDemoState(state)
    return Promise.resolve(publicPaymentMethod(method))
  }
  return apiFetch('/billing/payment-methods', { method: 'POST', body: data })
}

export async function checkout(data) {
  if (!IS_DEMO_MODE) return apiFetch('/billing/checkout', { method: 'POST', body: data })

  const state = getDemoState()
  const now = new Date()
  if (data.planId === 'free') {
    state.subscription = {
      planId: 'free',
      billingCycle: data.billingCycle,
      status: 'ACTIVE',
      startedAt: now.toISOString(),
      currentPeriodEndsAt: null,
      gracePeriodEndsAt: null,
      autoRenew: false,
    }
    saveDemoState(state)
    return { result: 'FREE_PLAN_ACTIVATED', transaction: null, subscription: { ...state.subscription } }
  }

  if (!data.acceptRecurringBilling) throw new Error('Recurring-billing consent is required.')
  const method = state.methods.find((item) => item.paymentMethodId === data.paymentMethodId)
  if (!method) throw new Error('Choose a saved demo payment method first.')
  const plans = await fetchPlans()
  const plan = plans.find((item) => item.id === data.planId)
  if (!plan) throw new Error('The selected plan was not found.')

  const amount = Number(plan.price[data.billingCycle.toLowerCase()] || 0)
  const declined = method.providerPaymentMethodToken?.endsWith('_declined')
  const periodEnd = new Date(now)
  if (data.billingCycle === 'YEARLY') periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  else periodEnd.setMonth(periodEnd.getMonth() + 1)

  const transaction = {
    transactionId: makeId('demo-transaction'),
    planId: plan.id,
    billingCycle: data.billingCycle,
    amount,
    currency: plan.currency,
    status: declined ? 'FAILED' : 'SUCCEEDED',
    providerReference: declined ? null : makeId('demo-provider'),
    failureCode: declined ? 'SIMULATED_DECLINE' : null,
    failureMessage: declined ? 'This demo payment was declined by the simulated gateway.' : null,
    paymentMethodBrand: method.brand,
    paymentMethodLastFour: method.lastFour,
    createdAt: now.toISOString(),
  }
  state.transactions.unshift(transaction)

  if (!declined) {
    state.subscription = {
      planId: plan.id,
      billingCycle: data.billingCycle,
      status: 'ACTIVE',
      startedAt: now.toISOString(),
      currentPeriodEndsAt: periodEnd.toISOString(),
      gracePeriodEndsAt: null,
      autoRenew: true,
    }
  }
  saveDemoState(state)
  return {
    result: declined ? 'FAILED' : 'SUCCEEDED',
    transaction: { ...transaction },
    subscription: { ...state.subscription },
  }
}

export function cancelSubscription() {
  if (IS_DEMO_MODE) {
    const state = getDemoState()
    state.subscription = { ...state.subscription, autoRenew: false }
    saveDemoState(state)
    return Promise.resolve({ ...state.subscription })
  }
  return apiFetch('/billing/subscription/cancel', { method: 'POST' })
}

export function listTransactions({ page = 0, size = 20 } = {}) {
  if (IS_DEMO_MODE) {
    const transactions = getDemoState().transactions
    return Promise.resolve({
      transactions: transactions.slice(page * size, (page + 1) * size),
      page,
      size,
      totalElements: transactions.length,
    })
  }
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return apiFetch(`/billing/transactions?${params}`)
}
