import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import PaymentFlowScreen from '../../components/billing/PaymentFlowScreen.jsx'
import BillingToggle from '../../components/pricing/BillingToggle.jsx'
import PlanCard from '../../components/pricing/PlanCard.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import { ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { pricingContent } from '../../data/pricingContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import useAsync from '../../hooks/useAsync.js'
import { fetchPlans } from '../../services/pricingService.js'
import {
  addPaymentMethod,
  checkout,
  getSubscription,
  listPaymentMethods,
  listTransactions,
  setDefaultPaymentMethod,
  setAutoRenew,
  updatePaymentMethod,
} from '../../services/billingService.js'
import '../../styles/billing.css'
import '../../styles/pricing.css'

const planDividerAssets = {
  free: '/assets/figma-pricing/plan-divider.svg',
  essentials: '/assets/figma-pricing/family-divider.svg',
  plus: '/assets/figma-pricing/professional-divider.svg',
}

function initialCheckoutCard() {
  const year = new Date().getFullYear() + 2
  return {
    cardholderName: 'Jordan Lee',
    cardNumber: '4242 4242 4242 4242',
    expiry: `08 / ${year}`,
    cvv: '123',
    country: 'US',
    postalCode: '94107',
    makeDefault: true,
  }
}

function identifyCardBrand(number) {
  if (number.startsWith('4')) return 'VISA'
  if (/^(5[1-5]|2[2-7])/.test(number)) return 'MASTERCARD'
  if (/^3[47]/.test(number)) return 'AMEX'
  return 'OTHER'
}

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
        intro: 'Quản lý gói dịch vụ, phương thức thanh toán và lịch sử giao dịch.',
        current: 'Gói hiện tại',
        status: 'Trạng thái',
        renew: 'Tự động gia hạn',
        periodEnd: 'Kết thúc chu kỳ hiện tại',
        renewEnabled: 'Đã bật',
        renewDisabled: 'Đã tắt',
        renewalTurnedOn: 'Đã bật tự động gia hạn.',
        renewalTurnedOff: 'Đã tắt tự động gia hạn.',
        switchPlan: 'Đổi gói',
        managePaymentMethods: 'Quản lý phương thức thanh toán',
        backToBilling: 'Quay lại thanh toán',
        choose: 'Chọn gói',
        chooseIntro: 'Ba lựa chọn rõ ràng cho cá nhân, gia đình và người cần thêm dung lượng lưu trữ.',
        backToPlans: 'Quay lại chọn gói',
        checkoutTitle: 'Thanh toán an toàn',
        demoProvider: 'Cổng thanh toán mô phỏng',
        providerHint: 'Bước này mô phỏng việc chuyển sang nhà cung cấp thanh toán. Không có dữ liệu thẻ thật nào được gửi.',
        selectedPlan: 'Gói đã chọn',
        billingCycle: 'Chu kỳ thanh toán',
        totalDue: 'Tổng tiền hôm nay',
        payNow: 'Thanh toán mô phỏng',
        activateFree: 'Kích hoạt gói miễn phí',
        addMethodHint: 'Thêm phương thức mô phỏng ở mục bên dưới rồi quay lại đây.',
        monthly: 'Hàng tháng',
        yearly: 'Hàng năm',
        paymentMethod: 'Phương thức thanh toán',
        noMethods: 'Chưa có phương thức thanh toán nào được lưu.',
        addMethod: 'Thêm phương thức thử nghiệm',
        cardholder: 'Tên chủ thẻ (mô phỏng)',
        brand: 'Loại thẻ',
        lastFour: '4 số cuối giả lập',
        expiryMonth: 'Tháng hết hạn',
        expiryYear: 'Năm hết hạn',
        makeDefault: 'Thêm và đặt làm phương thức mặc định',
        decline: 'Mô phỏng giao dịch bị từ chối',
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
        methodsHeading: 'Phương thức thanh toán',
        methodsIntro: 'Xem các thẻ đã lưu hoặc thêm phương thức thanh toán mới.',
        savedCards: 'Thẻ đã lưu',
        paymentMethodsCount: 'phương thức thanh toán',
        defaultLabel: 'Mặc định',
        setDefaultMethod: 'Đặt làm mặc định',
        settingDefault: 'Đang cập nhật…',
        editDetails: 'Chỉnh sửa',
        editCardHeading: 'Chỉnh sửa phương thức thanh toán',
        editCardIntro: 'Cập nhật ngày hết hạn hoặc địa chỉ thanh toán. Số thẻ đã được bảo vệ và không thể chỉnh sửa.',
        saveChanges: 'Lưu thay đổi',
        savingChanges: 'Đang lưu…',
        addressLine1: 'Địa chỉ thanh toán',
        city: 'Thành phố',
        savedMethodUpdated: 'Đã cập nhật phương thức thanh toán.',
        expires: 'Hết hạn',
        choosePaymentMethod: 'Chọn phương thức thanh toán',
        continueToReview: 'Tiếp tục',
        paymentCardholder: 'Tên chủ thẻ',
        methodsTopline: 'Quản lý thanh toán tài khoản.',
        vaultProtected: 'Vault được bảo vệ',
        paymentMethodSingular: 'phương thức thanh toán',
        addPaymentMethodAction: 'Thêm phương thức thanh toán',
        addCardHeading: 'Thêm phương thức thanh toán',
        addCardIntro: 'Thêm thẻ để thanh toán an toàn và không gián đoạn.',
        cardNumber: 'Số thẻ',
        cardNumberFormat: 'Nhập 16 chữ số thử nghiệm, ví dụ 4242 4242 4242 4242.',
        useSavedCard: 'Hoặc dùng thẻ đã lưu',
        expiry: 'Ngày hết hạn',
        expiryFormat: 'Nhập theo định dạng MM / YYYY.',
        cvv: 'CVV',
        country: 'Quốc gia',
        postalCode: 'Mã bưu chính',
        setDefault: 'Đặt làm phương thức mặc định',
        cancelCard: 'Hủy',
        saveCard: 'Lưu thẻ',
        savingCard: 'Đang lưu…',
        paymentDataNote: 'Bản demo: số thẻ đầy đủ và CVV chỉ ở trong trình duyệt, không được lưu hoặc gửi đi.',
        reviewHeading: 'Xác nhận gói dịch vụ',
        reviewIntro: 'Kiểm tra thông tin trước khi xác nhận.',
        backToPayment: 'Quay lại',
        demoReviewNote: 'Đây là giao dịch mô phỏng. Không có khoản tiền thật nào được thu.',
        demoOnlyNote: 'Bản demo học tập — không có khoản tiền thật nào được thu hoặc email nào được gửi.',
        processing: 'Đang xử lý…',
        secureBilling: 'Thanh toán an toàn',
        amountPaid: 'Số tiền đã thanh toán',
        transactionId: 'Mã giao dịch',
        downloadReceipt: 'Tải biên nhận',
        successTitle: 'Thanh toán thành công',
        successIntro: 'Thanh toán của bạn đã hoàn tất. Cảm ơn bạn đã bảo vệ di sản số của mình.',
        demoSuccessNote: 'Bản demo thành công. Không có khoản tiền thật hoặc email biên nhận nào được gửi.',
        failureTitle: 'Thanh toán thất bại',
        failureIntro: 'Cổng thanh toán mô phỏng đã từ chối giao dịch. Kiểm tra thông tin thẻ thử nghiệm hoặc chọn thẻ khác.',
        paymentAmount: 'Số tiền thanh toán',
        tryAgain: 'Thử lại',
        useDifferentCard: 'Dùng thẻ khác',
        notCharged: 'Bạn chưa bị tính phí. Đây chỉ là kết quả mô phỏng.',
        noPaymentRequired: 'Không cần thanh toán',
        active: 'Đang hoạt động',
        yes: 'Có',
        no: 'Không',
      }
    : {
        title: 'Plan & billing',
        intro: 'Manage your plan, payment methods, and transaction history.',
        current: 'Current plan',
        status: 'Status',
        renew: 'Auto-renew',
        periodEnd: 'Current period ends',
        renewEnabled: 'On',
        renewDisabled: 'Off',
        renewalTurnedOn: 'Auto-renewal is on.',
        renewalTurnedOff: 'Auto-renewal is off.',
        switchPlan: 'Switch plan',
        managePaymentMethods: 'Manage payment methods',
        backToBilling: 'Back to billing',
        choose: 'Choose a plan',
        chooseIntro: 'Compare the options for individuals, families, and larger digital estates.',
        backToPlans: 'Back to plan selection',
        checkoutTitle: 'Secure checkout',
        demoProvider: 'Simulated payment provider',
        providerHint: 'This step imitates handing off to a payment provider. No real card details are sent.',
        selectedPlan: 'Selected plan',
        billingCycle: 'Billing cycle',
        totalDue: 'Total due today',
        payNow: 'Pay (simulation)',
        activateFree: 'Activate free plan',
        addMethodHint: 'Add a simulated method in the section below, then return here.',
        monthly: 'Monthly',
        yearly: 'Yearly',
        paymentMethod: 'Payment method',
        noMethods: 'No payment methods saved yet.',
        addMethod: 'Add a test payment method',
        cardholder: 'Cardholder name (simulated)',
        brand: 'Card brand',
        lastFour: 'Fake last four digits',
        expiryMonth: 'Expiry month',
        expiryYear: 'Expiry year',
        makeDefault: 'Add and set as default',
        decline: 'Simulate a declined transaction',
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
        methodsHeading: 'Payment Methods',
        methodsIntro: 'View saved cards or add a new payment method.',
        savedCards: 'Saved cards',
        paymentMethodsCount: 'payment methods',
        defaultLabel: 'Default',
        setDefaultMethod: 'Set as default',
        settingDefault: 'Updating…',
        editDetails: 'Edit',
        editCardHeading: 'Edit payment method',
        editCardIntro: 'Update the expiry date or billing address. The card number is protected and cannot be changed here.',
        saveChanges: 'Save changes',
        savingChanges: 'Saving…',
        addressLine1: 'Billing address',
        city: 'City',
        savedMethodUpdated: 'Payment method updated.',
        expires: 'Expires',
        choosePaymentMethod: 'Choose a payment method',
        continueToReview: 'Continue',
        paymentCardholder: 'Cardholder Name',
        methodsTopline: 'Manage your account payments.',
        vaultProtected: 'Vault protected',
        paymentMethodSingular: 'payment method',
        addPaymentMethodAction: 'Add Payment Method',
        addCardHeading: 'Add Payment Method',
        addCardIntro: 'Add a card for secure, uninterrupted billing.',
        cardNumber: 'Card Number',
        cardNumberFormat: 'Enter 16 demo digits, such as 4242 4242 4242 4242.',
        useSavedCard: 'Or use saved card',
        expiry: 'Expiry',
        expiryFormat: 'Enter the date as MM / YYYY.',
        cvv: 'CVV',
        country: 'Country',
        postalCode: 'Postal Code',
        setDefault: 'Set as default',
        cancelCard: 'Cancel',
        saveCard: 'Save Card',
        savingCard: 'Saving…',
        paymentDataNote: 'Demo only — the full card number and CVV stay in this browser and are never stored or sent.',
        reviewHeading: 'Review your plan',
        reviewIntro: 'Check the details before you confirm.',
        backToPayment: 'Back',
        demoReviewNote: 'This is a simulated transaction. No real payment will be made.',
        demoOnlyNote: 'Student-project demo — no real payment or receipt email is sent.',
        processing: 'Processing…',
        secureBilling: 'Secure billing',
        amountPaid: 'Amount paid',
        transactionId: 'Transaction ID',
        downloadReceipt: 'Download Receipt',
        successTitle: 'Payment Successful',
        successIntro: 'Your payment is complete. Thank you for keeping your digital legacy protected.',
        demoSuccessNote: 'Demo successful. No real charge or receipt email was made.',
        failureTitle: 'Payment Failed',
        failureIntro: 'The simulated payment gateway declined the transaction. Check your test card details or choose another card.',
        paymentAmount: 'Payment amount',
        tryAgain: 'Try Again',
        useDifferentCard: 'Use a Different Card',
        notCharged: 'You have not been charged. This is a simulated result.',
        noPaymentRequired: 'No payment required',
        active: 'Active',
        yes: 'Yes',
        no: 'No',
      }

  const { status, data, error: loadError, reload } = useAsync(loadBillingSnapshot, 'owner-billing')
  const plans = data?.plans || []
  const subscription = data?.subscription
  const [methodsOverride, setMethodsOverride] = useState(null)
  const methods = methodsOverride ?? data?.methods ?? []
  const transactions = data?.transactions || []
  const [planOverride, setPlanOverride] = useState(null)
  const [cycleOverride, setCycleOverride] = useState(null)
  const [methodOverride, setMethodOverride] = useState(null)
  const selectedPlanId = planOverride ?? (requestedPlanIsValid ? requestedPlan : subscription?.planId || 'free')
  const billingCycle = cycleOverride ?? (requestedCycle === 'yearly' ? 'YEARLY' : subscription?.billingCycle || 'MONTHLY')
  const selectedMethodId = methodOverride ?? methods.find((method) => method.isDefault)?.paymentMethodId ?? ''
  const [acceptRecurring, setAcceptRecurring] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(null)
  const [methodScreenMode, setMethodScreenMode] = useState('checkout')
  const [checkoutCard, setCheckoutCard] = useState(initialCheckoutCard)
  const [editingMethod, setEditingMethod] = useState(null)
  const [editForm, setEditForm] = useState({ expiry: '', line1: '', city: '', postalCode: '', country: 'US' })
  const [checkoutMethod, setCheckoutMethod] = useState(null)
  const [checkoutOutcome, setCheckoutOutcome] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  const updateCheckoutCard = (field, value) => {
    let nextValue = value
    if (field === 'cardNumber') {
      const digits = String(value).replace(/\D/g, '').slice(0, 16)
      nextValue = digits.match(/.{1,4}/g)?.join(' ') || ''
    } else if (field === 'cvv') {
      nextValue = String(value).replace(/\D/g, '').slice(0, 4)
    } else if (field === 'expiry') {
      const digits = String(value).replace(/\D/g, '').slice(0, 6)
      nextValue = digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits
    }
    setCheckoutCard((previous) => ({ ...previous, [field]: nextValue }))
  }

  const saveCheckoutCard = async (event) => {
    event.preventDefault()
    setBusy(true)
    setActionError(null)
    setMessage(null)
    try {
      const number = checkoutCard.cardNumber.replace(/\D/g, '')
      const expiryDigits = checkoutCard.expiry.replace(/\D/g, '')
      const expiryMonth = Number(expiryDigits.slice(0, 2))
      const expiryYear = Number(expiryDigits.slice(2))
      const expiryDate = new Date(expiryYear, expiryMonth - 1, 1)
      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)

      if (number.length !== 16) throw new Error(copy.cardNumberFormat)
      if (!expiryMonth || expiryMonth > 12 || expiryDate < currentMonth) throw new Error(copy.expiryFormat)

      const isDeclinedDemoCard = number === '4000000000000002'
      const randomPart = globalThis.crypto?.randomUUID?.().replaceAll('-', '') || String(Date.now())
      const saved = await addPaymentMethod({
        // Only safe metadata and the fake gateway token go to the API. PAN and CVV stay in this component.
        providerPaymentMethodToken: `pm_mock_${randomPart}${isDeclinedDemoCard ? '_declined' : ''}`,
        cardholderName: checkoutCard.cardholderName.trim(),
        brand: identifyCardBrand(number),
        lastFour: number.slice(-4),
        expiryMonth,
        expiryYear,
        billingAddress: { country: checkoutCard.country, postalCode: checkoutCard.postalCode.trim() },
        makeDefault: checkoutCard.makeDefault || methods.length === 0,
      })

      setMethodsOverride((current) => {
        const existing = current ?? methods
        return [saved, ...existing.map((method) => ({
          ...method,
          isDefault: saved.isDefault ? false : method.isDefault,
        }))]
      })
      setMethodOverride(saved.paymentMethodId)
      setCheckoutMethod(saved)
      setAcceptRecurring(false)
      setCheckoutCard({ cardholderName: '', cardNumber: '', expiry: '', cvv: '', country: 'US', postalCode: '', makeDefault: true })
      setCheckoutStep('methods')
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
      setCheckoutOutcome({
        ...result,
        method: freePlan ? null : (checkoutMethod || methods.find((method) => method.paymentMethodId === selectedMethodId)),
      })
      setCheckoutStep(succeeded ? 'success' : 'failure')
      setAcceptRecurring(false)
      reload()
    } catch (checkoutError) {
      setActionError(checkoutError)
    } finally {
      setBusy(false)
    }
  }

  const startCheckoutForPlan = (plan) => {
    setPlanOverride(plan.id)
    setMethodScreenMode('checkout')
    setActionError(null)
    setMessage(null)
    setCheckoutOutcome(null)
    setAcceptRecurring(false)
    const defaultMethod = methods.find((method) => method.isDefault) || methods[0] || null
    setCheckoutMethod(defaultMethod)
    setMethodOverride(defaultMethod?.paymentMethodId || null)
    setCheckoutCard(initialCheckoutCard())
    setCheckoutStep(plan.id === 'free' ? 'review' : 'methods')
  }

  const updateAutoRenewal = async (enabled) => {
    setBusy(true)
    setActionError(null)
    setMessage(null)
    try {
      await setAutoRenew(enabled)
      setMessage({ tone: 'success', text: enabled ? copy.renewalTurnedOn : copy.renewalTurnedOff })
      reload()
    } catch (renewalError) {
      setActionError(renewalError)
    } finally {
      setBusy(false)
    }
  }

  const openPaymentMethods = () => {
    setMethodScreenMode('manage')
    setActionError(null)
    setMessage(null)
    setCheckoutStep('methods')
  }

  const makeMethodDefault = async (method) => {
    setBusy(true)
    setActionError(null)
    setMessage(null)
    try {
      const updatedMethod = await setDefaultPaymentMethod(method.paymentMethodId)
      setMethodsOverride(methods.map((savedMethod) => ({
        ...savedMethod,
        isDefault: savedMethod.paymentMethodId === updatedMethod.paymentMethodId,
      })))
      setMethodOverride(updatedMethod.paymentMethodId)
      setCheckoutMethod(updatedMethod)
      reload()
    } catch (defaultError) {
      setActionError(defaultError)
    } finally {
      setBusy(false)
    }
  }

  const startEditingMethod = (method) => {
    setEditingMethod(method)
    setEditForm({
      expiry: `${String(method.expiryMonth).padStart(2, '0')} / ${method.expiryYear}`,
      line1: method.billingAddress?.line1 || '',
      city: method.billingAddress?.city || '',
      postalCode: method.billingAddress?.postalCode || '',
      country: method.billingAddress?.country || 'US',
    })
    setActionError(null)
    setCheckoutStep('edit-card')
  }

  const updateEditForm = (field, value) => {
    let nextValue = value
    if (field === 'expiry') {
      const digits = String(value).replace(/\D/g, '').slice(0, 6)
      nextValue = digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits
    }
    setEditForm((previous) => ({ ...previous, [field]: nextValue }))
  }

  const saveEditedMethod = async (event) => {
    event.preventDefault()
    if (!editingMethod) return

    setBusy(true)
    setActionError(null)
    const expiryDigits = editForm.expiry.replace(/\D/g, '')
    const expiryMonth = Number(expiryDigits.slice(0, 2))
    const expiryYear = Number(expiryDigits.slice(2))
    const expiryDate = new Date(expiryYear, expiryMonth - 1, 1)
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    try {
      if (expiryDigits.length !== 6 || !expiryMonth || expiryMonth > 12 || expiryDate < currentMonth) {
        throw new Error(copy.expiryFormat)
      }

      const updatedMethod = await updatePaymentMethod(editingMethod.paymentMethodId, {
        expiryMonth,
        expiryYear,
        billingAddress: {
          line1: editForm.line1.trim(),
          city: editForm.city.trim(),
          postalCode: editForm.postalCode.trim(),
          country: editForm.country,
        },
      })
      setMethodsOverride(methods.map((method) => (
        method.paymentMethodId === updatedMethod.paymentMethodId ? updatedMethod : method
      )))
      setCheckoutMethod(updatedMethod)
      setEditingMethod(null)
      setCheckoutStep('methods')
      reload()
    } catch (updateError) {
      setActionError(updateError)
    } finally {
      setBusy(false)
    }
  }

  const currentPlan = plans.find((plan) => plan.id === subscription?.planId)
  const chosenPlan = plans.find((plan) => plan.id === selectedPlanId)
  const selectedPrice = chosenPlan?.price?.[billingCycle.toLowerCase()]
  const formattedSelectedPrice = chosenPlan
    ? new Intl.NumberFormat(isVietnamese ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: chosenPlan.currency,
      }).format(Number(selectedPrice || 0))
    : '—'

  const chosenPlanName = planText[chosenPlan?.id]?.name || chosenPlan?.id || '—'
  const activeCheckoutMethod = checkoutMethod || methods.find((method) => method.paymentMethodId === selectedMethodId) || null
  const checkoutMethods = activeCheckoutMethod && !methods.some((method) => method.paymentMethodId === activeCheckoutMethod.paymentMethodId)
    ? [activeCheckoutMethod, ...methods]
    : methods

  const returnToBilling = () => {
    setCheckoutStep(null)
    setMethodScreenMode('checkout')
    setCheckoutOutcome(null)
    setCheckoutMethod(null)
    setEditingMethod(null)
    setAcceptRecurring(false)
    setActionError(null)
    reload()
  }

  const downloadReceipt = () => {
    const transaction = checkoutOutcome?.transaction
    const receipt = [
      'LegacyVault — DEMO RECEIPT',
      `Plan: ${chosenPlanName}`,
      `Billing cycle: ${billingCycle === 'YEARLY' ? copy.yearly : copy.monthly}`,
      `Amount: ${formattedSelectedPrice}`,
      `Payment method: ${activeCheckoutMethod ? `${activeCheckoutMethod.brand} ending in ${activeCheckoutMethod.lastFour}` : copy.noPaymentRequired}`,
      `Transaction: ${transaction?.transactionId || 'No payment required'}`,
      'No real payment was taken.',
    ].join('\n')
    const url = URL.createObjectURL(new Blob([receipt], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'legacyvault-demo-receipt.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const flowProps = {
    step: checkoutStep,
    mode: methodScreenMode,
    copy,
    planName: chosenPlanName,
    billingCycle,
    formattedPrice: formattedSelectedPrice,
    language,
    methods: checkoutMethods,
    selectedMethodId: activeCheckoutMethod?.paymentMethodId || '',
    onSelectMethod: (method) => {
      setCheckoutMethod(method)
      setMethodOverride(method.paymentMethodId)
    },
    onMakeDefault: makeMethodDefault,
    onEditMethod: startEditingMethod,
    onAddMethod: () => {
      setCheckoutCard(initialCheckoutCard())
      setActionError(null)
      setCheckoutStep('add-card')
    },
    onContinueMethods: () => {
      setActionError(null)
      setAcceptRecurring(false)
      setCheckoutStep('review')
    },
    onBackMethods: () => {
      setActionError(null)
      setCheckoutStep(methodScreenMode === 'manage' ? null : 'plans')
    },
    card: checkoutCard,
    onCardChange: updateCheckoutCard,
    onSubmit: saveCheckoutCard,
    editingMethod,
    editForm,
    onEditChange: updateEditForm,
    onSubmitEdit: saveEditedMethod,
    onCancelEdit: () => {
      setActionError(null)
      setEditingMethod(null)
      setCheckoutStep('methods')
    },
    onCancel: () => {
      setActionError(null)
      setCheckoutCard(initialCheckoutCard())
      setCheckoutStep('methods')
    },
    busy,
    error: actionError,
    method: activeCheckoutMethod,
    acceptRecurring,
    onAcceptRecurring: setAcceptRecurring,
    onConfirm: submitCheckout,
    onBack: () => {
      setActionError(null)
      setCheckoutStep(selectedPlanId === 'free' ? 'plans' : 'methods')
    },
    isFreePlan: selectedPlanId === 'free',
    outcome: checkoutOutcome,
    onBackToBilling: returnToBilling,
    onTryAgain: () => {
      setCheckoutStep('review')
      setActionError(null)
    },
    onDifferentCard: () => {
      setActionError(null)
      setCheckoutStep('methods')
    },
    onDownloadReceipt: downloadReceipt,
  }

  if (checkoutStep && checkoutStep !== 'plans') return <PaymentFlowScreen {...flowProps} />

  if (checkoutStep === 'plans') {
    return (
      <OwnerLayout showDemoBanner={false}>
        <div className="billing-plan-selection">
          <button type="button" className="billing-plan-selection__back" onClick={() => setCheckoutStep(null)}>
            <span aria-hidden="true">←</span>{copy.backToBilling}
          </button>
          <div className="billing-plan-heading">
            <div>
              <h1 className="page-title">{copy.choose}</h1>
              <p className="page-text">{copy.chooseIntro}</p>
            </div>
            <div className="billing-cycle-picker">
              <span id="billing-cycle-label">{copy.billingCycle}</span>
              <BillingToggle
                value={billingCycle.toLowerCase()}
                onChange={(cycle) => setCycleOverride(cycle.toUpperCase())}
                labelledBy="billing-cycle-label"
                options={[
                  { value: 'monthly', label: copy.monthly },
                  { value: 'yearly', label: copy.yearly },
                ]}
              />
            </div>
          </div>
          {status === 'loading' && <LoadingState label={copy.loading} />}
          {status === 'error' && <ErrorState message={loadError?.message || copy.loading} retryLabel={copy.retry} onRetry={reload} />}
          {status === 'ready' && (
            <div className="plan-grid billing-plan-grid">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  billing={billingCycle.toLowerCase()}
                  content={pricingContent[language]}
                  onSelect={startCheckoutForPlan}
                  dividerSrc={planDividerAssets[plan.id]}
                  isCurrentPlan={subscription?.status === 'ACTIVE' && subscription.planId === plan.id}
                  currentPlanLabel={copy.current}
                />
              ))}
            </div>
          )}
        </div>
      </OwnerLayout>
    )
  }

  return (
    <OwnerLayout showDemoBanner={false}>
      <div className="page-head">
        <div>
          <h1 className="page-title">{copy.title}</h1>
          <p className="page-text">{copy.intro}</p>
        </div>
      </div>

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
              <div>
                <dt>{copy.renew}</dt>
                <dd>
                  {subscription?.planId !== 'free' ? (
                    <label className="billing-renewal-switch">
                      <input
                        type="checkbox"
                        role="switch"
                        aria-label={copy.renew}
                        checked={Boolean(subscription?.autoRenew)}
                        onChange={(event) => updateAutoRenewal(event.target.checked)}
                        disabled={busy || (subscription?.status !== 'ACTIVE' && !subscription?.autoRenew)}
                      />
                      <span className="billing-renewal-switch__track" aria-hidden="true" />
                      <span className="billing-renewal-switch__state">
                        {subscription?.autoRenew ? copy.renewEnabled : copy.renewDisabled}
                      </span>
                    </label>
                  ) : <span>{copy.renewDisabled}</span>}
                </dd>
              </div>
              <div><dt>{copy.periodEnd}</dt><dd>{localDate(subscription?.currentPeriodEndsAt, language)}</dd></div>
            </dl>
            <div className="billing-panel__actions">
              <Button onClick={() => setCheckoutStep('plans')}>{copy.switchPlan}</Button>
              <Button variant="secondary" onClick={openPaymentMethods}>{copy.managePaymentMethods}</Button>
            </div>
          </section>

          <section className="card billing-panel" aria-labelledby="billing-transactions-title">
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
