import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import { ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { pricingContent } from '../../data/pricingContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import useAsync from '../../hooks/useAsync.js'
import { fetchPlans } from '../../services/pricingService.js'
import {
  addPaymentMethod,
  cancelSubscription,
  checkout,
  getSubscription,
  listPaymentMethods,
  listTransactions,
} from '../../services/billingService.js'
import '../../styles/billing.css'

const today = new Date()

async function loadBillingSnapshot() {
  const [plans, subscription, methods, transactionPage] = await Promise.all([
    fetchPlans(),
    getSubscription(),
    listPaymentMethods(),
    listTransactions({ page: 0, size: 20 }),
  ])
  return { plans, subscription, methods, transactions: transactionPage.transactions || [] }
}

function localDate(value, language) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        dateStyle: 'medium',
      }).format(date)
}

export default function BillingPage() {
  const { language } = useLanguage()
  const [searchParams] = useSearchParams()
  const requestedPlan = searchParams.get('plan')
  const requestedCycle = searchParams.get('billing')
  const requestedPlanIsValid = ['free', 'essentials', 'plus'].includes(requestedPlan)
  const isVietnamese = language === 'vi'
  const planText = pricingContent[language].plans
  const copy = isVietnamese
    ? {
        title: 'Gói dịch vụ & thanh toán',
        intro: 'Quản lý gói LegacyVault và lịch sử thanh toán mô phỏng.',
        simulation: 'Mô phỏng học tập: không nhập số thẻ hoặc CVV thật. Hệ thống chỉ lưu 4 số cuối và mã thanh toán giả; không có khoản tiền nào bị thu.',
        current: 'Gói hiện tại',
        status: 'Trạng thái',
        renew: 'Tự động gia hạn',
        periodEnd: 'Kết thúc chu kỳ hiện tại',
        cancel: 'Tắt tự động gia hạn',
        choose: 'Chọn gói',
        monthly: 'Hàng tháng',
        yearly: 'Hàng năm',
        paymentMethod: 'Phương thức thanh toán',
        noMethods: 'Chưa có phương thức thanh toán mô phỏng.',
        addMethod: 'Thêm phương thức thử nghiệm',
        cardholder: 'Tên chủ thẻ (mô phỏng)',
        brand: 'Loại thẻ',
        lastFour: '4 số cuối giả lập',
        expiryMonth: 'Tháng hết hạn',
        expiryYear: 'Năm hết hạn',
        makeDefault: 'Thêm và đặt làm phương thức mặc định',
        decline: 'Mô phỏng giao dịch bị từ chối',
        submitCheckout: 'Xác nhận gói (mô phỏng)',
        consent: 'Tôi đồng ý với khoản thanh toán định kỳ theo chu kỳ đã chọn.',
        transactions: 'Lịch sử giao dịch',
        noTransactions: 'Chưa có giao dịch.',
        date: 'Ngày',
        plan: 'Gói',
        amount: 'Số tiền',
        result: 'Kết quả',
        loading: 'Đang tải thông tin thanh toán…',
        retry: 'Thử lại',
        saved: 'Đã lưu phương thức thanh toán mô phỏng.',
        checkedOut: 'Đã xử lý yêu cầu gói dịch vụ.',
        canceled: 'Đã tắt tự động gia hạn.',
        missingMethod: 'Hãy thêm và chọn một phương thức thanh toán mô phỏng trước.',
        missingConsent: 'Vui lòng xác nhận đồng ý thanh toán định kỳ.',
        success: 'Thành công',
        failed: 'Thất bại',
        active: 'Đang hoạt động',
        yes: 'Có',
        no: 'Không',
      }
    : {
        title: 'Plan & billing',
        intro: 'Manage your LegacyVault plan and simulated payment history.',
        simulation: 'Student-project simulation: do not enter a real card number or CVV. Only the last four digits and a fake provider token are stored; no money is charged.',
        current: 'Current plan',
        status: 'Status',
        renew: 'Auto-renew',
        periodEnd: 'Current period ends',
        cancel: 'Turn off auto-renew',
        choose: 'Choose a plan',
        monthly: 'Monthly',
        yearly: 'Yearly',
        paymentMethod: 'Payment method',
        noMethods: 'No simulated payment methods saved.',
        addMethod: 'Add a test payment method',
        cardholder: 'Cardholder name (simulated)',
        brand: 'Card brand',
        lastFour: 'Fake last four digits',
        expiryMonth: 'Expiry month',
        expiryYear: 'Expiry year',
        makeDefault: 'Add and set as default',
        decline: 'Simulate a declined transaction',
        submitCheckout: 'Confirm plan (simulation)',
        consent: 'I agree to the recurring charge for the selected billing cycle.',
        transactions: 'Transactions',
        noTransactions: 'No transactions yet.',
        date: 'Date',
        plan: 'Plan',
        amount: 'Amount',
        result: 'Result',
        loading: 'Loading billing information…',
        retry: 'Try again',
        saved: 'Simulated payment method saved.',
        checkedOut: 'Plan request processed.',
        canceled: 'Auto-renewal has been turned off.',
        missingMethod: 'Add and select a simulated payment method first.',
        missingConsent: 'Please confirm recurring billing consent.',
        success: 'Succeeded',
        failed: 'Failed',
        active: 'Active',
        yes: 'Yes',
        no: 'No',
      }

  const { status, data, error: loadError, reload } = useAsync(loadBillingSnapshot, 'owner-billing')
  const plans = data?.plans || []
  const subscription = data?.subscription
  const methods = data?.methods || []
  const transactions = data?.transactions || []
  const [planOverride, setPlanOverride] = useState(null)
  const [cycleOverride, setCycleOverride] = useState(null)
  const [methodOverride, setMethodOverride] = useState(null)
  const selectedPlanId = planOverride ?? (requestedPlanIsValid ? requestedPlan : subscription?.planId || 'free')
  const billingCycle = cycleOverride ?? (requestedCycle === 'yearly' ? 'YEARLY' : subscription?.billingCycle || 'MONTHLY')
  const selectedMethodId = methodOverride ?? methods.find((method) => method.isDefault)?.paymentMethodId ?? ''
  const [card, setCard] = useState({
    cardholderName: '',
    brand: 'VISA',
    lastFour: '',
    expiryMonth: String(today.getMonth() + 1),
    expiryYear: String(today.getFullYear() + 1),
    simulateDecline: false,
  })
  const [acceptRecurring, setAcceptRecurring] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  const updateCard = (field) => (event) => {
    const value = field === 'simulateDecline' ? event.target.checked : event.target.value
    setCard((previous) => ({ ...previous, [field]: value }))
  }

  const saveCard = async (event) => {
    event.preventDefault()
    setBusy(true)
    setActionError(null)
    setMessage(null)
    try {
      const randomPart = globalThis.crypto?.randomUUID?.().replaceAll('-', '') || String(Date.now())
      const token = `pm_mock_${randomPart}${card.simulateDecline ? '_declined' : ''}`
      const saved = await addPaymentMethod({
        providerPaymentMethodToken: token,
        cardholderName: card.cardholderName.trim(),
        brand: card.brand,
        lastFour: card.lastFour,
        expiryMonth: Number(card.expiryMonth),
        expiryYear: Number(card.expiryYear),
        billingAddress: null,
        makeDefault: methods.length === 0,
      })
      setMethodOverride(saved.paymentMethodId)
      setCard((current) => ({ ...current, cardholderName: '', lastFour: '', simulateDecline: false }))
      setMessage({ tone: 'success', text: copy.saved })
      reload()
    } catch (saveError) {
      setActionError(saveError)
    } finally {
      setBusy(false)
    }
  }

  const submitCheckout = async (event) => {
    event.preventDefault()
    setActionError(null)
    setMessage(null)
    const freePlan = selectedPlanId === 'free'
    if (!freePlan && !selectedMethodId) {
      setActionError(new Error(copy.missingMethod))
      return
    }
    if (!freePlan && !acceptRecurring) {
      setActionError(new Error(copy.missingConsent))
      return
    }

    setBusy(true)
    try {
      const result = await checkout({
        planId: selectedPlanId,
        billingCycle,
        paymentMethodId: freePlan ? null : selectedMethodId,
        acceptRecurringBilling: freePlan ? false : acceptRecurring,
      })
      const succeeded = result.result === 'SUCCEEDED' || result.result === 'FREE_PLAN_ACTIVATED'
      setMessage({
        tone: succeeded ? 'success' : 'error',
        text: result.result === 'FAILED'
          ? (result.transaction?.failureMessage || copy.failed)
          : `${copy.checkedOut} ${result.result}`,
      })
      setAcceptRecurring(false)
      reload()
    } catch (checkoutError) {
      setActionError(checkoutError)
    } finally {
      setBusy(false)
    }
  }

  const stopRenewal = async () => {
    setBusy(true)
    setActionError(null)
    setMessage(null)
    try {
      await cancelSubscription()
      setMessage({ tone: 'success', text: copy.canceled })
      reload()
    } catch (cancelError) {
      setActionError(cancelError)
    } finally {
      setBusy(false)
    }
  }

  const currentPlan = plans.find((plan) => plan.id === subscription?.planId)
  const chosenPlan = plans.find((plan) => plan.id === selectedPlanId)
  const selectedPrice = chosenPlan?.price?.[billingCycle.toLowerCase()]

  return (
    <OwnerLayout>
      <div className="page-head">
        <div>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-text">{copy.intro}</p>
        </div>
      </div>

      <FormAlert tone="info">{copy.simulation}</FormAlert>
      {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}
      {actionError && <FormAlert>{actionError.message}</FormAlert>}
      {status === 'loading' && <LoadingState label={copy.loading} />}
      {status === 'error' && <ErrorState message={loadError?.message || copy.loading} retryLabel={copy.retry} onRetry={reload} />}

      {status === 'ready' && (
        <div className="billing-grid">
          <section className="card billing-panel" aria-labelledby="billing-current-title">
            <div className="billing-panel__heading">
              <div>
                <h2 id="billing-current-title" className="section-title">{copy.current}</h2>
                <p className="billing-plan-name">{planText[currentPlan?.id]?.name || currentPlan?.id || 'Free'}</p>
              </div>
              <span className="badge badge--accent">{subscription?.status || copy.active}</span>
            </div>
            <dl className="billing-summary">
              <div><dt>{copy.status}</dt><dd>{subscription?.status || 'ACTIVE'}</dd></div>
              <div><dt>{copy.renew}</dt><dd>{subscription?.autoRenew ? copy.yes : copy.no}</dd></div>
              <div><dt>{copy.periodEnd}</dt><dd>{localDate(subscription?.currentPeriodEndsAt, language)}</dd></div>
            </dl>
            {subscription?.autoRenew && (
              <Button variant="secondary" onClick={stopRenewal} disabled={busy}>{copy.cancel}</Button>
            )}
          </section>

          <section className="card billing-panel" aria-labelledby="billing-checkout-title">
            <h2 id="billing-checkout-title" className="section-title">{copy.choose}</h2>
            <form className="billing-form" onSubmit={submitCheckout}>
              <label className="billing-field">
                <span>{copy.choose}</span>
                <select className="field__input" value={selectedPlanId} onChange={(event) => setPlanOverride(event.target.value)}>
                  {plans.map((plan) => <option key={plan.id} value={plan.id}>{planText[plan.id]?.name || plan.id}</option>)}
                </select>
              </label>
              {chosenPlan && (
                <p className="billing-price">
                  {new Intl.NumberFormat(isVietnamese ? 'vi-VN' : 'en-US', {
                    style: 'currency',
                    currency: chosenPlan.currency,
                  }).format(Number(selectedPrice || 0))}
                  {' · '}{billingCycle === 'YEARLY' ? copy.yearly : copy.monthly}
                </p>
              )}
              <label className="billing-field">
                <span>{isVietnamese ? 'Chu kỳ thanh toán' : 'Billing cycle'}</span>
                <select className="field__input" value={billingCycle} onChange={(event) => setCycleOverride(event.target.value)}>
                  <option value="MONTHLY">{copy.monthly}</option>
                  <option value="YEARLY">{copy.yearly}</option>
                </select>
              </label>
              {chosenPlan?.id !== 'free' && (
                <>
                  <label className="billing-field">
                    <span>{copy.paymentMethod}</span>
                    <select className="field__input" value={selectedMethodId} onChange={(event) => setMethodOverride(event.target.value)} required>
                      <option value="">{copy.paymentMethod}</option>
                      {methods.map((method) => (
                        <option key={method.paymentMethodId} value={method.paymentMethodId}>
                          {method.brand} •••• {method.lastFour}{method.isDefault ? ' (default)' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="billing-check">
                    <input type="checkbox" checked={acceptRecurring} onChange={(event) => setAcceptRecurring(event.target.checked)} />
                    <span>{copy.consent}</span>
                  </label>
                </>
              )}
              <Button type="submit" disabled={busy}>{copy.submitCheckout}</Button>
            </form>
          </section>

          <section className="card billing-panel" aria-labelledby="billing-method-title">
            <h2 id="billing-method-title" className="section-title">{copy.paymentMethod}</h2>
            {methods.length === 0 ? <p className="page-text">{copy.noMethods}</p> : (
              <ul className="billing-method-list">
                {methods.map((method) => (
                  <li key={method.paymentMethodId}>
                    <span>{method.brand} •••• {method.lastFour}</span>
                    <small>{method.cardholderName}{method.isDefault ? ' · default' : ''}</small>
                  </li>
                ))}
              </ul>
            )}
            <form className="billing-form" onSubmit={saveCard}>
              <label className="billing-field">
                <span>{copy.cardholder}</span>
                <input className="field__input" value={card.cardholderName} onChange={updateCard('cardholderName')} maxLength={100} required />
              </label>
              <label className="billing-field">
                <span>{copy.brand}</span>
                <select className="field__input" value={card.brand} onChange={updateCard('brand')}>
                  <option value="VISA">Visa</option>
                  <option value="MASTERCARD">Mastercard</option>
                  <option value="AMEX">American Express</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="billing-field">
                <span>{copy.lastFour}</span>
                <input className="field__input" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={card.lastFour} onChange={updateCard('lastFour')} placeholder="1234" required />
              </label>
              <div className="billing-expiry">
                <label className="billing-field">
                  <span>{copy.expiryMonth}</span>
                  <input className="field__input" type="number" min="1" max="12" value={card.expiryMonth} onChange={updateCard('expiryMonth')} required />
                </label>
                <label className="billing-field">
                  <span>{copy.expiryYear}</span>
                  <input className="field__input" type="number" min={today.getFullYear()} max="2100" value={card.expiryYear} onChange={updateCard('expiryYear')} required />
                </label>
              </div>
              <label className="billing-check">
                <input type="checkbox" checked={card.simulateDecline} onChange={updateCard('simulateDecline')} />
                <span>{copy.decline}</span>
              </label>
              <Button type="submit" variant="secondary" disabled={busy}>{copy.makeDefault}</Button>
            </form>
          </section>

          <section className="card billing-panel billing-panel--wide" aria-labelledby="billing-transactions-title">
            <h2 id="billing-transactions-title" className="section-title">{copy.transactions}</h2>
            {transactions.length === 0 ? <p className="page-text">{copy.noTransactions}</p> : (
              <div className="billing-table-wrap">
                <table className="billing-table">
                  <thead><tr><th>{copy.date}</th><th>{copy.plan}</th><th>{copy.amount}</th><th>{copy.result}</th></tr></thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.transactionId}>
                        <td>{localDate(transaction.createdAt, language)}</td>
                        <td>{planText[transaction.planId]?.name || transaction.planId}</td>
                        <td>{new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', { style: 'currency', currency: transaction.currency }).format(Number(transaction.amount))}</td>
                        <td>{transaction.status === 'SUCCEEDED' ? copy.success : copy.failed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </OwnerLayout>
  )
}
