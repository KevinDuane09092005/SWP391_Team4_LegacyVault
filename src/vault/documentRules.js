// Frontend checks for "Upload related documents".
// Files are only checked and listed here; nothing is uploaded (see documentService.js).

export const DOCUMENT_RULES = {
  maxFiles: 5,
  maxSizeBytes: 10 * 1024 * 1024, // 10 MB per file
  extensions: ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'txt'],
  // Value for <input accept>, so the file picker suggests the right files.
  accept: '.pdf,.jpg,.jpeg,.png,.docx,.txt',
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getExtension(fileName) {
  const dot = fileName.lastIndexOf('.')
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase()
}

// Checks newly picked files against the rules and the files already in the list.
// Returns { accepted: [{ id, file, name, size, type }], rejected: [{ name, reason }] }
// where reason is 'type' | 'size' | 'empty' | 'duplicate' | 'count'.
export function checkNewFiles(newFiles, currentFiles, maxFiles = DOCUMENT_RULES.maxFiles) {
  const accepted = []
  const rejected = []
  const knownIds = new Set(currentFiles.map((item) => item.id))

  for (const file of newFiles) {
    const id = `${file.name}-${file.size}-${file.lastModified}`
    let reason
    if (!DOCUMENT_RULES.extensions.includes(getExtension(file.name))) reason = 'type'
    else if (file.size === 0) reason = 'empty'
    else if (file.size > DOCUMENT_RULES.maxSizeBytes) reason = 'size'
    else if (knownIds.has(id)) reason = 'duplicate'
    else if (currentFiles.length + accepted.length >= maxFiles) reason = 'count'

    if (reason) {
      rejected.push({ name: file.name, reason })
    } else {
      knownIds.add(id)
      accepted.push({ id, file, name: file.name, size: file.size, type: file.type })
    }
  }
  return { accepted, rejected }
}
