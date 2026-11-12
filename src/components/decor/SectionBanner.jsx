import { useLocation } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { ownerPaths } from '../../vault/paths.js'
import SectionArt from './SectionArt.jsx'

// Illustrated banner on top of each main Vault Owner page (decorative; pages keep their own titles).
// Shown only on the section start pages, not on detail or "new" pages.
const SECTIONS = {
  [ownerPaths.dashboard]: {
    scene: 'overview',
    hue: 'teal',
    vi: { eyebrow: 'Kho di sản · Tổng quan', text: 'Theo dõi tài sản, người nhận và lịch điểm danh ở cùng một nơi.' },
    en: { eyebrow: 'Vault · Overview', text: 'Keep an eye on your assets, recipients and check-ins in one place.' },
  },
  [ownerPaths.assets]: {
    scene: 'assets',
    hue: 'indigo',
    vi: { eyebrow: 'Kho di sản · Tài sản của tôi', text: 'Tài khoản, ví và giấy tờ quan trọng của bạn, sắp xếp gọn ở một nơi.' },
    en: { eyebrow: 'Vault · My assets', text: 'Your accounts, wallets and important papers, organised in one place.' },
  },
  [ownerPaths.contacts]: {
    scene: 'contacts',
    hue: 'amber',
    vi: { eyebrow: 'Bàn giao · Danh bạ tin cậy', text: 'Những người bạn tin tưởng sẽ nhận hoặc thực thi di sản của bạn.' },
    en: { eyebrow: 'Legacy · Contacts', text: 'The people you trust to receive or carry out your legacy.' },
  },
  [ownerPaths.assignments]: {
    scene: 'assignments',
    hue: 'rose',
    vi: { eyebrow: 'Bàn giao · Phân công', text: 'Chọn ai nhận tài sản nào, kèm lời dặn dành cho họ.' },
    en: { eyebrow: 'Legacy · Assignments', text: 'Choose who receives which asset, with your instructions for them.' },
  },
  [ownerPaths.dms]: {
    scene: 'dms',
    hue: 'rose',
    vi: { eyebrow: "Bàn giao · Dead Man's Switch", text: 'Điểm danh định kỳ. Nếu bạn vắng mặt quá lâu, quy trình bàn giao mới được khởi động.' },
    en: { eyebrow: "Legacy · Dead Man's Switch", text: 'Check in regularly. Only a long absence starts the handover process.' },
  },
  [ownerPaths.billing]: {
    scene: 'billing',
    hue: 'indigo',
    vi: { eyebrow: 'Tài khoản · Gói & thanh toán', text: 'Chọn gói phù hợp và quản lý thanh toán của bạn.' },
    en: { eyebrow: 'Account · Plan & billing', text: 'Pick the plan that fits and manage your payments.' },
  },
}

export default function SectionBanner() {
  const { pathname } = useLocation()
  const { language } = useLanguage()
  const section = SECTIONS[pathname.replace(/\/$/, '')]
  if (!section) return null
  const text = section[language === 'vi' ? 'vi' : 'en']

  return (
    <div className={`section-banner section-banner--${section.hue}`}>
      <div className="section-banner__copy">
        <span className="section-banner__eyebrow">{text.eyebrow}</span>
        <p className="section-banner__text">{text.text}</p>
      </div>
      <SectionArt scene={section.scene} className="section-banner__art" />
    </div>
  )
}
