import FormAlert from '../auth/FormAlert.jsx'
import Icon from '../Icon.jsx'
import { DOCUMENT_RULES, formatFileSize } from '../../vault/documentRules.js'

// Add Asset — step 2 "Upload related documents".
// Files are checked and listed only. Nothing is uploaded (see documentService.js).
export default function DocumentsStep({ files, rejected, onAdd, onRemove, t, maxFiles = DOCUMENT_RULES.maxFiles }) {
  const maxSize = formatFileSize(DOCUMENT_RULES.maxSizeBytes)
  const reasonText = (reason) => {
    if (reason === 'size') return t.documents.reasons.size(maxSize)
    if (reason === 'count') return t.documents.reasons.count(maxFiles)
    return t.documents.reasons[reason]
  }

  const handleChange = (event) => {
    onAdd(Array.from(event.target.files))
    // Clear the input so the same file can be picked again after removing it.
    event.target.value = ''
  }

  return (
    <div className="form-stack">
      <div>
        <h2 className="step-title">{t.documents.title}</h2>
        <p className="step-text">{t.documents.text}</p>
      </div>

      <FormAlert tone="info">{t.documents.demoNote}</FormAlert>

      <div className="file-picker">
        <label className="btn btn-secondary file-picker__button">
          <Icon name="fileText" size={16} />
          {t.documents.choose}
          <input
            id="asset-documents"
            type="file"
            multiple
            accept={DOCUMENT_RULES.accept}
            className="visually-hidden"
            onChange={handleChange}
          />
        </label>
        <p className="file-picker__rules">{t.documents.rules(maxSize, maxFiles)}</p>
      </div>

      {rejected.length > 0 && (
        <FormAlert>
          <p>{t.documents.rejectedTitle}</p>
          <ul className="file-rejections">
            {rejected.map((item, index) => (
              <li key={`${item.name}-${index}`}>
                <strong>{item.name}</strong>: {reasonText(item.reason)}
              </li>
            ))}
          </ul>
        </FormAlert>
      )}

      {files.length === 0 ? (
        <p className="file-list__empty">{t.documents.none}</p>
      ) : (
        <ul className="file-list" aria-live="polite">
          {files.map((item) => (
            <li key={item.id} className="file-list__item">
              <Icon name="fileText" size={18} />
              <span className="file-list__name">{item.name}</span>
              <span className="file-list__size">{formatFileSize(item.size)}</span>
              <span className="badge">{t.documents.ready}</span>
              <button
                type="button"
                className="file-list__remove"
                aria-label={t.documents.removeLabel(item.name)}
                onClick={() => onRemove(item.id)}
              >
                <Icon name="close" size={16} />
                <span>{t.documents.remove}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
