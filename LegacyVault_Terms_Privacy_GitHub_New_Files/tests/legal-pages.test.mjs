import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { legalContent } from '../src/data/legalContent.js'

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

for (const kind of ['terms', 'privacy']) {
  test(`${kind}: complete English and Vietnamese documents`, () => {
    for (const language of ['en', 'vi']) {
      const page = legalContent[language][kind]
      assert.ok(page.title && page.subtitle && page.lead && page.highlight)
      assert.ok(page.sections.length >= 12)
      assert.equal(new Set(page.sections.map(x => x.id)).size, page.sections.length)
      assert.ok(page.sections.every(x => x.title && (x.paragraphs?.length || x.bullets?.length)))
      assert.ok(page.sections.every(x => [...(x.paragraphs || []), ...(x.bullets || [])].every(text => text.length > 35)))
    }
  })
  test(`${kind}: language versions have matching anchors`, () => {
    assert.deepEqual(
      legalContent.en[kind].sections.map(s => s.id),
      legalContent.vi[kind].sections.map(s => s.id),
    )
  })
}

test('terms: covers inheritance, Dead Man’s Switch, legal checks, and third parties', () => {
  for (const language of ['en', 'vi']) {
    const ids = legalContent[language].terms.sections.map(s => s.id)
    for (const required of ['people', 'dms', 'verification', 'handover', 'third-parties', 'privacy']) {
      assert.ok(ids.includes(required), `${language} missing ${required}`)
    }
  }
})

test('privacy: covers AI-provider processing, consent, access, retention and rights', () => {
  for (const language of ['en', 'vi']) {
    const ids = legalContent[language].privacy.sections.map(s => s.id)
    for (const required of ['categories', 'lawful-basis', 'sharing', 'ai', 'storage', 'rights', 'incidents']) {
      assert.ok(ids.includes(required), `${language} missing ${required}`)
    }
  }
})

test('routes replace existing placeholders and retain backward compatible URLs', () => {
  const app = source('../src/App.jsx')
  assert.match(app, /path="\/terms" element=\{<LegalDocumentPage kind="terms"/)
  assert.match(app, /path="\/terms-of-service" element=\{<LegalDocumentPage kind="terms"/)
  assert.match(app, /path="\/privacy" element=\{<LegalDocumentPage kind="privacy"/)
  assert.match(app, /path="\/privacy-policy" element=\{<LegalDocumentPage kind="privacy"/)
  assert.match(app, /FloatingAIChat/)
  assert.match(app, /path="\/dashboard\/owner"/)
})

test('registration links are still valid and footer exposes both pages', () => {
  const registration = source('../src/pages/auth/RegisterPage.jsx')
  assert.ok(registration.includes('href="/terms"'))
  assert.ok(registration.includes('href="/privacy"'))
  const footerContent = source('../src/data/landingContent.js')
  assert.match(footerContent, /label: 'Terms', to: '\/terms'/)
  assert.match(footerContent, /label: 'Điều khoản', to: '\/terms'/)
  assert.match(footerContent, /to: '\/privacy'/)
})

test('pages use global language switch and do not introduce an acceptance bypass', () => {
  const view = source('../src/pages/LegalDocumentPage.jsx')
  assert.match(view, /useLanguage\(\)/)
  assert.match(view, /<LanguageSwitcher/)
  assert.match(view, /<ThemeToggle/)
  assert.match(view, /window\.print\(\)/)
  assert.doesNotMatch(view, /localStorage\.setItem\(['"]termsAccepted/)
})
