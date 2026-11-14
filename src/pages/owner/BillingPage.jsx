import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import PaymentFlowScreen from '../../components/billing/PaymentFlowScreen.jsx'
import BillingToggle from '../../components/pricing/BillingToggle.jsx'
import PlanCard from '../../components/pricing/PlanCard.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import PageHeader from '../../components/vault/PageHeader.jsx'
import { ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { pricingContent } from '../../data/pricingContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import useAsync from '../../hooks/useAsync.js'
import { getAssetsListApi } from '../../services/vaultService.js'
import { getContactsApi } from '../../services/contactService.js'
import { countOwnedVaults } from '../../mocks/mockVaultStore.js'
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

function attachmentCount(asset) {
  const attachmentUrl = asset?.attachmentUrl ?? asset?.attachment_url
  if (typeof attachmentUrl === 'string' && attachmentUrl.trim()) {
    return attachmentUrl.split(',').filter((item) => item.trim()).length
  }
  const documents = asset?.documents ?? asset?.relatedDocuments
  return Array.isArray(documents) ? documents.length : 0
}

async function loadBillingSnapshot(ownerId) {
  const [plans, subscription, methods, transactionPage, assetsResult, contactsResult] = await Promise.all([
    fetchPlans(),
    getSubscription(),
    listPaymentMethods(),
    listTransactions({ page: 0, size: 20 }),
    getAssetsListApi().then((assets) => ({ ok: true, assets })).catch(() => ({ ok: false, assets: null })),
    getContactsApi().then((contacts) => ({ ok: true, contacts })).catch(() => ({ ok: false, contacts: null })),
  ])
  const assets = Array.isArray(assetsResult.assets) ? assetsResult.assets : null
  return {
    plans,
    subscription,
    methods,
    transactions: transactionPage.transactions || [],
    usage: {
      collections: Number.isFinite(ownerId) || typeof ownerId === 'string' ? countOwnedVaults(ownerId) : null,
      records: assets?.length ?? null,
      trustedContacts: contactsResult.ok ? contactsResult.contacts.length : null,
      attachmentsPerRecord: assets ? Math.max(0, ...assets.map(attachmentCount)) : null,
    },
  }
}

function planOverageWarning(plan, usage, isVietnamese) {
  if (!plan?.limits || !usage) return null
  const labels = isVietnamese
    ? { collections: 'bộ sưu tập', records: 'hồ sơ', trustedContacts: 'người liên hệ tin cậy', attachmentsPerRecord: 'tài liệu đính kèm trên một hồ sơ' }
    : { collections: 'collections', records: 'records', trustedContacts: 'trusted contacts', attachmentsPerRecord: 'attachments on a single record' }
  const overages = Object.keys(labels)
    .filter((metric) => usage[metric] != null && Number(usage[metric]) > Number(plan.limits[metric]))
    .map((metric) => `${usage[metric]} ${labels[metric]} (limit ${plan.limits[metric]})`)
  if (overages.length === 0) return null
  return isVietnamese
    ? `Mức sử dụng hiện tại vượt quá giới hạn của gói này: ${overages.join(', ')}. Hãy nâng cấp hoặc giảm mức sử dụng trong 7 ngày. Nội dung hiện có sẽ không tự động bị xóa; việc thêm nội dung mới sẽ bị giới hạn theo gói.`
    : `Your current usage exceeds this plan: ${overages.join(', ')}. Upgrade or reduce your usage within 7 days. Existing data will not be deleted automatically; adding more will be blocked by the plan limits.`
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
  const { user } = useAuth()
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
        checkoutTitle: 'Xác nhận gói dịch vụ',
        demoProvider: 'Thông tin thanh toán',
        providerHint: 'Số thẻ và mã bảo mật không được lưu vào tài khoản hoặc gửi đến LegacyVault.',
        selectedPlan: 'Gói đã chọn',
        billingCycle: 'Chu kỳ thanh toán',
        totalDue: 'Tổng tiền hôm nay',
        payNow: 'Xác nhận đăng ký',
        activateFree: 'Kích hoạt gói miễn phí',
        addMethodHint: 'Thêm phương thức thanh toán bên dưới rồi quay lại đây.',
        monthly: 'Hàng tháng',
        yearly: 'Hàng năm',
        paymentMethod: 'Phương thức thanh toán',
        noMethods: 'Chưa có phương thức thanh toán nào được lưu.',
        addMethod: 'Thêm phương thức thanh toán',
        cardholder: 'Tên chủ thẻ',
        brand: 'Loại thẻ',
        lastFour: '4 số cuối',
        expiryMonth: 'Tháng hết hạn',
        expiryYear: 'Năm hết hạn',
        makeDefault: 'Thêm và đặt làm phương thức mặc định',
        decline: 'Không thể hoàn tất thanh toán',
        consent: 'Tôi đồng ý với khoản thanh toán định kỳ theo chu kỳ đã chọn.',
        transactions: 'Lịch sử giao dịch',
        noTransactions: 'Chưa có giao dịch.',
        date: 'Ngày',
        plan: 'Gói',
        amount: 'Số tiền',
        result: 'Kết quả',
        loading: 'Đang tải thông tin thanh toán…',
        retry: 'Thử lại',
        saved: 'Đã lưu phương thức thanh toán.',
        checkedOut: 'Đã cập nhật gói dịch vụ.',
        canceled: 'Đã tắt tự động gia hạn.',
        missingMethod: 'Hãy thêm và chọn phương thức thanh toán trước.',
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
        cardNumberFormat: 'Nhập số thẻ gồm 16 chữ số.',
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
        paymentDataNote: 'Số thẻ và mã bảo mật chỉ dùng để nhận diện thẻ; không được lưu hoặc gửi đến LegacyVault.',
        reviewHeading: 'Xác nhận gói dịch vụ',
        reviewIntro: 'Kiểm tra thông tin trước khi xác nhận.',
        backToPayment: 'Quay lại',
        demoReviewNote: 'Trang này chưa thu tiền. Gói sẽ được cập nhật sau khi bạn xác nhận.',
        demoOnlyNote: 'Gói dịch vụ sẽ được cập nhật sau khi xác nhận; trang này chưa thu tiền.',
        processing: 'Đang xử lý…',
        secureBilling: 'Thông tin thanh toán',
        amountPaid: 'Giá gói dịch vụ',
        transactionId: 'Mã giao dịch',
        downloadReceipt: 'Tải tóm tắt thanh toán',
        successTitle: 'Đã kích hoạt gói dịch vụ',
        successIntro: 'Gói dịch vụ bạn chọn hiện đã được áp dụng.',
        demoSuccessNote: 'Gói dịch vụ đã được cập nhật. Chưa có khoản thanh toán nào được thu.',
        failureTitle: 'Chưa thể hoàn tất thanh toán',
        failureIntro: 'Yêu cầu thanh toán chưa hoàn tất. Gói hiện tại của bạn không thay đổi.',
        paymentAmount: 'Giá gói dịch vụ',
        tryAgain: 'Thử lại',
        useDifferentCard: 'Dùng thẻ khác',
        notCharged: 'Chưa có khoản thanh toán nào được thu.',
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
        checkoutTitle: 'Confirm your plan',
        demoProvider: 'Payment details',
        providerHint: 'Your card number and security code are not stored in your account or sent to LegacyVault.',
        selectedPlan: 'Selected plan',
        billingCycle: 'Billing cycle',
        totalDue: 'Total due today',
        payNow: 'Confirm subscription',
        activateFree: 'Activate free plan',
        addMethodHint: 'Add a payment method below, then return here.',
        monthly: 'Monthly',
        yearly: 'Yearly',
        paymentMethod: 'Payment method',
        noMethods: 'No payment methods saved yet.',
        addMethod: 'Add a payment method',
        cardholder: 'Cardholder name',
        brand: 'Card brand',
        lastFour: 'Last four digits',
        expiryMonth: 'Expiry month',
        expiryYear: 'Expiry year',
        makeDefault: 'Add and set as default',
        decline: 'Unable to complete payment',
        consent: 'I agree to the recurring charge for the selected billing cycle.',
        transactions: 'Transactions',
        noTransactions: 'No transactions yet.',
        date: 'Date',
        plan: 'Plan',
        amount: 'Amount',
        result: 'Result',
        loading: 'Loading billing information…',
        retry: 'Try again',
        saved: 'Payment method saved.',
        checkedOut: 'Your subscription has been updated.',
        canceled: 'Auto-renewal has been turned off.',
        missingMethod: 'Add and select a payment method first.',
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
        cardNumberFormat: 'Enter a 16-digit card number.',
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
        paymentDataNote: 'Your card number and security code are used only to identify the card; they are not stored or sent to LegacyVault.',
        reviewHeading: 'Review your plan',
        reviewIntro: 'Check the details before you confirm.',
        backToPayment: 'Back',
        demoReviewNote: 'No payment will be collected from this page. Your plan updates after confirmation.',
        demoOnlyNote: 'Your plan updates after confirmation; no payment is collected from this page.',
        processing: 'Processing…',
        secureBilling: 'Billing details',
        amountPaid: 'Plan amount',
        transactionId: 'Transaction ID',
        downloadReceipt: 'Download billing summary',
        successTitle: 'Subscription activated',
        successIntro: 'Your selected plan is now active.',
        demoSuccessNote: 'Your plan has been updated. No payment was collected.',
        failureTitle: 'Payment not completed',
        failureIntro: 'We could not complete this billing request. Your current plan has not changed.',
        paymentAmount: 'Plan amount',
        tryAgain: 'Try Again',
        useDifferentCard: 'Use a Different Card',
        notCharged: 'No payment was collected.',
        noPaymentRequired: 'No payment required',
        active: 'Active',
        yes: 'Yes',
        no: 'No',
      }

  const { status, data, error: loadError, reload } = useAsync(
    () => loadBillingSnapshot(user?.id),
    `${user?.id}-owner-billing`,
  )
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
  const downgradeWarning = planOverageWarning(chosenPlan, data?.usage, isVietnamese)
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
      'LegacyVault — BILLING SUMMARY',
      `Plan: ${chosenPlanName}`,
      `Billing cycle: ${billingCycle === 'YEARLY' ? copy.yearly : copy.monthly}`,
      `Plan amount: ${formattedSelectedPrice}`,
      `Payment method: ${activeCheckoutMethod ? `${activeCheckoutMethod.brand} ending in ${activeCheckoutMethod.lastFour}` : copy.noPaymentRequired}`,
      `Reference: ${transaction?.transactionId || 'No payment required'}`,
      'Payment collected: No',
    ].join('\n')
    const url = URL.createObjectURL(new Blob([receipt], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'legacyvault-billing-summary.txt'
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
    planWarning: checkoutStep === 'review' ? downgradeWarning : null,
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
      <PageHeader scene="billing" hue="indigo" title={copy.title} description={copy.intro} />

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
                {currentPlan?.price && (
                  <p className="billing-plan-price">
                    <strong>
                      {new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
                        style: 'currency',
                        currency: currentPlan.currency || 'USD',
                      }).format(Number(currentPlan.price[subscription?.billingCycle === 'YEARLY' ? 'yearly' : 'monthly'] || 0))}
                    </strong>
                    <span>
                      {subscription?.billingCycle === 'YEARLY'
                        ? (language === 'vi' ? ' / năm' : ' / year')
                        : (language === 'vi' ? ' / tháng' : ' / month')}
                    </span>
                  </p>
                )}
              </div>
              <span className={`badge ${subscription?.status && subscription.status !== 'ACTIVE' ? 'amber' : 'green'}`}>
                {subscription?.status || copy.active}
              </span>
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
                        <td className="billing-table__amount">{new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', { style: 'currency', currency: transaction.currency }).format(Number(transaction.amount))}</td>
                        <td>
                          <span className={`badge ${transaction.status === 'SUCCEEDED' ? 'green' : 'red'}`}>
                            {transaction.status === 'SUCCEEDED' ? copy.success : copy.failed}
                          </span>
                        </td>
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
