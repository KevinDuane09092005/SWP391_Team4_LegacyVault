import Button from '../Button.jsx'
import Icon from '../Icon.jsx'
import OwnerLayout from '../vault/OwnerLayout.jsx'
import '../../styles/billing-flow.css'

const iconBase = '/assets/figma-billing'

function SecureBadge({ failed = false, label }) {
  return (
    <span className="billing-flow__secure-badge">
      <img src={`${iconBase}/${failed ? 'failure-shield.svg' : 'shield-check.svg'}`} alt="" />
      {label}
    </span>
  )
}

function StandaloneFrame({ children, failed = false, footer = {} }) {
  return (
    <main className="billing-flow">
      <div className="billing-flow__topline">
        <span className="billing-flow__topline-label">Billing</span>
        {footer.secureLabel && <SecureBadge failed={failed} label={footer.secureLabel} />}
      </div>
      <div className="billing-flow__stage">
        {children}
        {footer.note && (
          <p className="billing-flow__secure-note">
            <img src={`${iconBase}/lock-keyhole.svg`} alt="" />
            {footer.note}
          </p>
        )}
      </div>
    </main>
  )
}

function BillingError({ error }) {
  if (!error) return null
  return <p className="billing-flow__error" role="alert">{error.message || String(error)}</p>
}

function FormField({ label, children, className = '' }) {
  return (
    <label className={`billing-flow__field ${className}`.trim()}>
      <span className="billing-flow__field-label">{label}</span>
      {children}
    </label>
  )
}

function readableBrand(brand = '') {
  const normalized = String(brand).toLowerCase()
  if (normalized === 'amex') return 'American Express'
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Card'
}

function PaymentMethodsScreen({
  methods = [],
  selectedMethodId,
  onSelectMethod,
  onAddMethod,
  onContinueMethods,
  onBackMethods,
  onMakeDefault,
  onEditMethod,
  copy,
  mode,
  busy,
  error,
}) {
  const isManageMode = mode === 'manage'

  return (
    <div className="billing-methods-screen">
      <div className="billing-methods-screen__topline">
        <div><strong>Billing</strong><span>{copy.methodsTopline}</span></div>
        <span className="billing-methods-screen__protected">
          <img src={`${iconBase}/shield-check.svg`} alt="" />
          {copy.vaultProtected}
        </span>
      </div>

      <header className="billing-methods-screen__heading">
        <h1>{copy.methodsHeading}</h1>
        <p>{copy.methodsIntro}</p>
      </header>

      <section className="billing-methods-screen__panel" aria-labelledby="billing-method-list-title">
        <div className="billing-methods-screen__list-heading">
          <h2 id="billing-method-list-title">{copy.savedCards}</h2>
          <span>{methods.length} {methods.length === 1 ? copy.paymentMethodSingular : copy.paymentMethodsCount}</span>
        </div>

        {methods.length ? (
          <div
            className={`billing-methods-screen__list${isManageMode ? ' billing-methods-screen__list--manage' : ''}`}
            role={isManageMode ? undefined : 'radiogroup'}
            aria-label={isManageMode ? undefined : copy.choosePaymentMethod}
          >
            {methods.map((method) => {
              const selected = method.paymentMethodId === selectedMethodId
              const content = (
                <>
                  <span className="billing-methods-screen__card-icon" aria-hidden="true">
                    <img src={`${iconBase}/credit-card.svg`} alt="" />
                  </span>
                  <span className="billing-methods-screen__method-copy">
                    <strong>{readableBrand(method.brand)} •••• {method.lastFour}</strong>
                    <small>{copy.expires} {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear} · {method.cardholderName}</small>
                  </span>
                  {isManageMode ? (
                    <span className="billing-methods-screen__card-actions">
                      <button
                        type="button"
                        className="billing-methods-screen__edit"
                        onClick={() => onEditMethod(method)}
                        disabled={busy}
                      >
                        {copy.editDetails}
                      </button>
                      {method.isDefault ? (
                        <span className="billing-methods-screen__default">{copy.defaultLabel}</span>
                      ) : (
                        <button
                          type="button"
                          className="billing-methods-screen__set-default"
                          onClick={() => onMakeDefault(method)}
                          disabled={busy}
                        >
                          {busy ? copy.settingDefault : copy.setDefaultMethod}
                        </button>
                      )}
                    </span>
                  ) : (
                    <>
                      {method.isDefault && <span className="billing-methods-screen__default">{copy.defaultLabel}</span>}
                      <span className="billing-methods-screen__radio" aria-hidden="true" />
                    </>
                  )}
                </>
              )
              return isManageMode ? (
                <div
                  key={method.paymentMethodId}
                  className={`billing-methods-screen__method billing-methods-screen__method--static${method.isDefault ? ' is-selected' : ''}`}
                >
                  {content}
                </div>
              ) : (
                <button
                  key={method.paymentMethodId}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`billing-methods-screen__method${selected ? ' is-selected' : ''}`}
                  onClick={() => onSelectMethod(method)}
                >
                  {content}
                </button>
              )
            })}
          </div>
        ) : (
          <p className="billing-methods-screen__empty">{copy.noMethods}</p>
        )}

        <button type="button" className="billing-methods-screen__add" onClick={onAddMethod}>
          <span aria-hidden="true">+</span>{copy.addPaymentMethodAction}
        </button>
        <BillingError error={error} />
      </section>

      <div className="billing-methods-screen__actions">
        {isManageMode ? (
          <Button variant="secondary" onClick={onBackMethods}>{copy.backToBilling}</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onBackMethods}>{copy.backToPlans}</Button>
            <Button onClick={onContinueMethods} disabled={!selectedMethodId}>{copy.continueToReview}</Button>
          </>
        )}
      </div>
    </div>
  )
}

function AddPaymentMethodScreen({
  card,
  onCardChange,
  onSubmit,
  onCancel,
  copy,
  busy,
  error,
}) {
  return (
    <StandaloneFrame footer={{ secureLabel: copy.secureBilling, note: copy.paymentDataNote }}>
      <form className="billing-flow__card billing-flow__card--form" onSubmit={onSubmit}>
        <div className="billing-flow__title-group">
          <h1>{copy.addCardHeading}</h1>
          <p>{copy.addCardIntro}</p>
        </div>

        <div className="billing-flow__form-fields">
          <FormField label={copy.paymentCardholder}>
            <input
              className="billing-flow__input"
              autoComplete="cc-name"
              maxLength={100}
              value={card.cardholderName}
              onChange={(event) => onCardChange('cardholderName', event.target.value)}
              required
            />
          </FormField>

          <FormField label={copy.cardNumber}>
            <span className="billing-flow__input-with-icon">
              <input
                className="billing-flow__input"
                inputMode="numeric"
                autoComplete="off"
                maxLength={19}
                value={card.cardNumber}
                onChange={(event) => onCardChange('cardNumber', event.target.value)}
                pattern="(?:[0-9]{4} ){3}[0-9]{4}|[0-9]{16}"
                title={copy.cardNumberFormat}
                required
              />
              <img src={`${iconBase}/credit-card.svg`} alt="" />
            </span>
          </FormField>

          <div className="billing-flow__field-grid">
            <FormField label={copy.expiry}>
              <input
                className="billing-flow__input"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM / YYYY"
                maxLength={9}
                value={card.expiry}
                onChange={(event) => onCardChange('expiry', event.target.value)}
                pattern="(?:0?[1-9]|1[0-2])\s*/\s*20[0-9]{2}"
                title={copy.expiryFormat}
                required
              />
            </FormField>
            <FormField label={copy.cvv}>
              <span className="billing-flow__input-with-icon">
                <input
                  className="billing-flow__input"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  value={card.cvv}
                  onChange={(event) => onCardChange('cvv', event.target.value)}
                  pattern="[0-9]{3,4}"
                  required
                />
                <Icon name="circleHelp" size={16} className="billing-flow__field-icon" />
              </span>
            </FormField>
          </div>

          <div className="billing-flow__field-grid">
            <FormField label={copy.country}>
              <span className="billing-flow__input-with-icon">
                <select
                  className="billing-flow__input"
                  autoComplete="country"
                  value={card.country}
                  onChange={(event) => onCardChange('country', event.target.value)}
                >
                  <option value="US">United States</option>
                  <option value="VN">Vietnam</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
                <Icon name="chevronDown" size={16} className="billing-flow__field-icon" />
              </span>
            </FormField>
            <FormField label={copy.postalCode}>
              <input
                className="billing-flow__input"
                autoComplete="postal-code"
                maxLength={20}
                value={card.postalCode}
                onChange={(event) => onCardChange('postalCode', event.target.value)}
                required
              />
            </FormField>
          </div>

          <label className="billing-flow__check">
            <input
              type="checkbox"
              checked={card.makeDefault}
              onChange={(event) => onCardChange('makeDefault', event.target.checked)}
            />
            <span>{copy.setDefault}</span>
          </label>
        </div>

        <BillingError error={error} />
        <div className="billing-flow__form-actions">
          <Button variant="secondary" type="button" onClick={onCancel}>{copy.cancelCard}</Button>
          <Button type="submit" disabled={busy}>{busy ? copy.savingCard : copy.saveCard}</Button>
        </div>
      </form>
    </StandaloneFrame>
  )
}

function EditPaymentMethodScreen({
  method,
  form,
  onChange,
  onSubmit,
  onCancel,
  copy,
  busy,
  error,
}) {
  if (!method) return null

  return (
    <StandaloneFrame>
      <form className="billing-flow__card billing-flow__card--form" onSubmit={onSubmit}>
        <div className="billing-flow__title-group">
          <h1>{copy.editCardHeading}</h1>
          <p>{copy.editCardIntro}</p>
        </div>

        <div className="billing-flow__form-fields">
          <div className="billing-flow__review-method">
            <span className="billing-method-option__icon" aria-hidden="true">
              <img src={`${iconBase}/credit-card.svg`} alt="" />
            </span>
            <span>
              <strong>{readableBrand(method.brand)} •••• {method.lastFour}</strong>
              <small>{copy.paymentCardholder}: {method.cardholderName}</small>
            </span>
          </div>

          <FormField label={copy.expiry}>
            <input
              className="billing-flow__input"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM / YYYY"
              maxLength={9}
              value={form.expiry}
              onChange={(event) => onChange('expiry', event.target.value)}
              pattern="(?:0?[1-9]|1[0-2])\s*/\s*20[0-9]{2}"
              title={copy.expiryFormat}
              required
            />
          </FormField>

          <FormField label={copy.addressLine1}>
            <input
              className="billing-flow__input"
              autoComplete="address-line1"
              maxLength={200}
              value={form.line1}
              onChange={(event) => onChange('line1', event.target.value)}
            />
          </FormField>

          <div className="billing-flow__field-grid">
            <FormField label={copy.city}>
              <input
                className="billing-flow__input"
                autoComplete="address-level2"
                maxLength={100}
                value={form.city}
                onChange={(event) => onChange('city', event.target.value)}
              />
            </FormField>
            <FormField label={copy.postalCode}>
              <input
                className="billing-flow__input"
                autoComplete="postal-code"
                maxLength={20}
                value={form.postalCode}
                onChange={(event) => onChange('postalCode', event.target.value)}
              />
            </FormField>
          </div>

          <FormField label={copy.country}>
            <span className="billing-flow__input-with-icon">
              <select
                className="billing-flow__input"
                autoComplete="country"
                value={form.country}
                onChange={(event) => onChange('country', event.target.value)}
              >
                <option value="US">United States</option>
                <option value="VN">Vietnam</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
              <Icon name="chevronDown" size={16} className="billing-flow__field-icon" />
            </span>
          </FormField>
        </div>

        <BillingError error={error} />
        <div className="billing-flow__form-actions">
          <Button variant="secondary" type="button" onClick={onCancel}>{copy.cancelCard}</Button>
          <Button type="submit" disabled={busy}>{busy ? copy.savingChanges : copy.saveChanges}</Button>
        </div>
      </form>
    </StandaloneFrame>
  )
}

function CheckoutReviewScreen({
  copy,
  planName,
  billingCycle,
  formattedPrice,
  method,
  acceptRecurring,
  onAcceptRecurring,
  onConfirm,
  onBack,
  busy,
  isFreePlan,
  error,
}) {
  return (
    <StandaloneFrame footer={{ secureLabel: copy.secureBilling, note: copy.demoOnlyNote }}>
      <section className="billing-flow__card billing-flow__card--review">
        <div className="billing-flow__title-group">
          <h1>{copy.reviewHeading}</h1>
          <p>{copy.reviewIntro}</p>
        </div>

        <dl className="billing-flow__summary">
          <div><dt>{copy.plan}</dt><dd>{planName}</dd></div>
          <div><dt>{copy.billingCycle}</dt><dd>{billingCycle === 'YEARLY' ? copy.yearly : copy.monthly}</dd></div>
          <div className="billing-flow__summary-total"><dt>{copy.totalDue}</dt><dd>{formattedPrice}</dd></div>
        </dl>

        {!isFreePlan && method && (
          <div className="billing-flow__review-method">
            <span className="billing-method-option__icon" aria-hidden="true">
              <img src={`${iconBase}/credit-card.svg`} alt="" />
            </span>
            <span><strong>{method.brand} •••• {method.lastFour}</strong><small>{method.cardholderName}</small></span>
          </div>
        )}

        {!isFreePlan && (
          <label className="billing-flow__consent">
            <input type="checkbox" checked={acceptRecurring} onChange={(event) => onAcceptRecurring(event.target.checked)} />
            <span>{copy.consent}</span>
          </label>
        )}

        <p className="billing-flow__demo-note">{copy.demoReviewNote}</p>
        <BillingError error={error} />
        <div className="billing-flow__review-actions">
          <Button variant="secondary" onClick={onBack}>{copy.backToPayment}</Button>
          <Button onClick={onConfirm} disabled={busy || (!isFreePlan && !acceptRecurring)}>
            {busy ? copy.processing : isFreePlan ? copy.activateFree : `${copy.payNow} · ${formattedPrice}`}
          </Button>
        </div>
      </section>
    </StandaloneFrame>
  )
}

function ResultScreen({
  isSuccess,
  copy,
  outcome,
  formattedPrice,
  method,
  onBackToBilling,
  onTryAgain,
  onDifferentCard,
  onDownloadReceipt,
  language,
}) {
  const transaction = outcome?.transaction
  const amount = transaction?.amount == null
    ? formattedPrice
    : `${new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: transaction.currency || 'USD',
    }).format(Number(transaction.amount))} ${transaction.currency || 'USD'}`
  const transactionId = transaction?.transactionId
    ? `LV-${transaction.transactionId.replace(/[^a-zA-Z0-9]/g, '').slice(-12).toUpperCase()}`
    : '—'
  const paymentLabel = method ? `${readableBrand(method.brand)} •••• ${method.lastFour}` : copy.noPaymentRequired
  const dateText = transaction?.createdAt
    ? new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'long' }).format(new Date(transaction.createdAt))
    : new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'long' }).format(new Date())

  return (
    <StandaloneFrame failed={!isSuccess} footer={{ secureLabel: copy.secureBilling, note: copy.demoOnlyNote }}>
      <section className={`billing-flow__card billing-flow__card--result${isSuccess ? '' : ' is-failed'}`} aria-live="polite">
        <span className={`billing-flow__result-icon${isSuccess ? '' : ' is-failed'}`} aria-hidden="true">
          {isSuccess ? <Icon name="check" size={22} /> : <img src={`${iconBase}/failure-alert.svg`} alt="" />}
        </span>
        <h1>{isSuccess ? copy.successTitle : copy.failureTitle}</h1>
        <p className="billing-flow__result-description">
          {isSuccess ? copy.successIntro : copy.failureIntro}
        </p>

        <dl className={`billing-flow__result-summary${isSuccess ? '' : ' is-failed'}`}>
          {isSuccess ? (
            <>
              <div className="billing-flow__result-amount"><dt>{copy.amountPaid}</dt><dd>{amount}</dd></div>
              <div><dt>{copy.transactionId}</dt><dd>{transactionId}</dd></div>
              <div><dt>{copy.paymentMethod}</dt><dd>{paymentLabel}</dd></div>
              <div><dt>{copy.date}</dt><dd>{dateText}</dd></div>
            </>
          ) : (
            <>
              <div className="billing-flow__result-amount"><dt>{copy.paymentAmount}</dt><dd>{amount}</dd></div>
              <div className="billing-flow__result-method">
                <dt><img src={`${iconBase}/failure-credit-card.svg`} alt="" />{paymentLabel}</dt>
              </div>
            </>
          )}
        </dl>

        {isSuccess ? (
          <div className="billing-flow__result-actions">
            <Button variant="secondary" onClick={onDownloadReceipt} icon="download">{copy.downloadReceipt}</Button>
            <Button onClick={onBackToBilling}>{copy.backToBilling}</Button>
          </div>
        ) : (
          <div className="billing-flow__result-actions">
            <Button onClick={onTryAgain}>{copy.tryAgain}</Button>
            <Button variant="secondary" onClick={onDifferentCard}>{copy.useDifferentCard}</Button>
          </div>
        )}
        <p className="billing-flow__result-footnote">{isSuccess ? copy.demoSuccessNote : copy.notCharged}</p>
      </section>
    </StandaloneFrame>
  )
}

export default function PaymentFlowScreen(props) {
  let screen = null
  if (props.step === 'methods') screen = <PaymentMethodsScreen {...props} />
  if (props.step === 'add-card') screen = <AddPaymentMethodScreen {...props} />
  if (props.step === 'edit-card') screen = <EditPaymentMethodScreen {...props} />
  if (props.step === 'review') screen = <CheckoutReviewScreen {...props} />
  if (props.step === 'success') screen = <ResultScreen {...props} isSuccess />
  if (props.step === 'failure') screen = <ResultScreen {...props} isSuccess={false} />
  if (!screen) return null
  return <OwnerLayout showDemoBanner={false}>{screen}</OwnerLayout>
}
