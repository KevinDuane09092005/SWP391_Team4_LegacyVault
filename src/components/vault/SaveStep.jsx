import FormAlert from '../auth/FormAlert.jsx'
import Icon from '../Icon.jsx'

// The order vaultService.saveAsset works through.
const PROGRESS_STEPS = ['validate', 'documents', 'encryption', 'saving']

// Add Asset — step 4 "Save asset": shows each part of the save as it happens.
// `current` is the step vaultService reported last; `error` is set if saving failed.
export default function SaveStep({ current, error, t }) {
  const currentIndex = PROGRESS_STEPS.indexOf(current)

  return (
    <div className="form-stack">
      <h2 className="step-title">{t.addAsset.steps[3]}</h2>

      <ol className="save-progress" aria-live="polite">
        {PROGRESS_STEPS.map((step, index) => {
          let state = 'pending'
          if (index < currentIndex) state = 'done'
          if (index === currentIndex) state = error ? 'failed' : 'active'
          return (
            <li key={step} className={`save-progress__item save-progress__item--${state}`}>
              <span className="save-progress__icon" aria-hidden="true">
                {state === 'done' && <Icon name="check" size={14} strokeWidth={2.6} />}
                {state === 'active' && <span className="spinner spinner--dark" />}
                {state === 'failed' && <Icon name="close" size={14} strokeWidth={2.6} />}
              </span>
              {t.addAsset.progress[step]}
            </li>
          )
        })}
      </ol>

      {error && <FormAlert tone="danger">{t.errors[error] ?? error ?? t.errors.generic}</FormAlert>}
    </div>
  )
}
