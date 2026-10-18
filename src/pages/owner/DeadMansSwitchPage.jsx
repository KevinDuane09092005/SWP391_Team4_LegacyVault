import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Shield,
  CalendarDays,
  AlertTriangle,
  RotateCcw,
  Settings,
} from 'lucide-react'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import { LoadingState, ErrorState } from '../../components/vault/PageStates.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { computeDmsView, dateLabel, formatCountdown } from '../../vault/dmsLogic.js'
import {
  getDmsStatusApi,
  saveDmsConfigApi,
  checkInDmsApi,
  emergencyCheckInDmsApi,
  getDmsAuditLogsApi,
  getHandoverCasesApi,
} from '../../services/dmsService.js'

export default function DeadMansSwitchPage() {
  const { language } = useLanguage()
  const isVi = language === 'vi'
  const navigate = useNavigate()
  const location = useLocation()

  // Real backend states
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState(null)
  const [dmsData, setDmsData] = useState(null)
  const [logs, setLogs] = useState([])
  const [handoverCases, setHandoverCases] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [apiError, setApiError] = useState('')
  const [successToast, setSuccessToast] = useState('')
  const [clock, setClock] = useState(Date.now())
  const [simulatedOffsetDays, setSimulatedOffsetDays] = useState(0) // for presentation testing

  // Form states for config
  const [formInterval, setFormInterval] = useState(30)
  const [formGrace, setFormGrace] = useState(7)
  const [isEditingConfig, setIsEditingConfig] = useState(false)

  // Live timer tick every 1 second
  useEffect(() => {
    const timerId = setInterval(() => setClock(Date.now()), 1000)
    return () => clearInterval(timerId)
  }, [])

  // Auto-dismiss success toast
  useEffect(() => {
    if (successToast) {
      const t = setTimeout(() => setSuccessToast(''), 5000)
      return () => clearTimeout(t)
    }
  }, [successToast])

  // Map API audit logs to UI format (100% from backend, no fake fallback)
  const mapAuditLogs = useCallback((apiLogs) => {
    if (!Array.isArray(apiLogs) || apiLogs.length === 0) {
      return []
    }
    return apiLogs.map((log) => {
      let title = isVi ? 'Xác thực nhịp tim' : 'Owner Heartbeat Confirmed'
      let via = isVi ? 'Hệ thống tự động' : 'System Heartbeat'

      if (log.checkInType === 'MANUAL_DASHBOARD') {
        title = isVi ? 'Điểm danh thủ công trên bảng điều khiển' : 'Manual Dashboard Check-in'
        via = isVi ? 'Bảng điều khiển web' : 'Manual Dashboard'
      } else if (log.checkInType === 'EMERGENCY_RESTORE') {
        title = isVi ? 'Khôi phục trạng thái an toàn khẩn cấp' : 'Emergency State Restored'
        via = isVi ? 'Xác thực khẩn cấp' : 'Emergency Check-in'
      } else if (log.checkInType === 'WEB_APP_LOGIN') {
        title = isVi ? 'Xác thực đăng nhập chủ tài khoản' : 'Owner Heartbeat Confirmed'
        via = isVi ? 'Đăng nhập ứng dụng web' : 'Web App Login'
      }

      return {
        id: log.logId,
        title,
        via,
        date: dateLabel(log.recordedAt, isVi ? 'vi-VN' : 'en-US'),
        status: log.status || 'verified',
      }
    })
  }, [isVi])

  // Load DMS status, audit logs, and handover cases directly from Backend API
  const loadDmsData = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
    if (!token) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    setLoading(true)
    setPageError(null)

    try {
      // 1. GET /api/v1/dms/status
      const statusData = await getDmsStatusApi()
      setDmsData(statusData)
      setFormInterval(statusData?.checkInIntervalDays || 30)
      setFormGrace(statusData?.gracePeriodDays || 7)

      // 2. GET /api/v1/dms/audit-logs
      try {
        const logsData = await getDmsAuditLogsApi()
        setLogs(Array.isArray(logsData) ? mapAuditLogs(logsData) : [])
      } catch (logErr) {
        console.warn('Failed to fetch audit logs:', logErr)
        setLogs([])
      }

      // 3. GET /api/v1/handover/cases
      try {
        const casesData = await getHandoverCasesApi()
        setHandoverCases(Array.isArray(casesData) ? casesData : [])
      } catch (caseErr) {
        console.warn('Failed to fetch handover cases:', caseErr)
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('legacyvault-access-token')
        navigate('/login', {
          state: {
            from: location.pathname,
            message: isVi
              ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
              : 'Session expired. Please log in again.',
          },
        })
        return
      }
      setPageError(err.data?.error || err.data?.message || err.message || (isVi ? 'Không thể tải dữ liệu DMS từ máy chủ.' : 'Failed to load DMS data from server.'))
    } finally {
      setLoading(false)
    }
  }, [isVi, location.pathname, mapAuditLogs, navigate])

  // Initial fetch on mount
  useEffect(() => {
    loadDmsData()
  }, [loadDmsData])

  // 2. POST /api/v1/dms/config: Save DMS configuration to backend
  const saveConfig = async () => {
    setSyncing(true)
    setApiError('')
    setSuccessToast('')

    try {
      const res = await saveDmsConfigApi({
        checkInIntervalDays: formInterval,
        gracePeriodDays: formGrace,
      })
      setSimulatedOffsetDays(0)
      setIsEditingConfig(false)
      setSuccessToast(
        res.message ||
          (isVi
            ? "Cấu hình Dead Man's Switch đã được lưu thành công!"
            : "Dead Man's Switch configuration saved successfully!"),
      )
      // Refresh status from backend
      const updated = await getDmsStatusApi()
      setDmsData(updated)
      setFormInterval(updated?.checkInIntervalDays || 30)
      setFormGrace(updated?.gracePeriodDays || 7)
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('legacyvault-access-token')
        navigate('/login', {
          state: {
            from: location.pathname,
            message: isVi
              ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
              : 'Session expired. Please log in again.',
          },
        })
        return
      }
      setApiError(err.data?.error || err.data?.message || err.message)
    } finally {
      setSyncing(false)
    }
  }

  // 3. POST /api/v1/dms/check-in: Heartbeat confirmation (Reset timer)
  const handleCheckIn = async () => {
    setSyncing(true)
    setApiError('')
    setSuccessToast('')

    try {
      const res = await checkInDmsApi()
      setSimulatedOffsetDays(0)
      setSuccessToast(
        res.message ||
          (isVi
            ? 'Xác thực nhịp tim thành công. Bộ đếm đã được đặt lại về trạng thái an toàn.'
            : 'Heartbeat confirmed. Timer has been reset to active state.'),
      )
      const [updatedStatus, updatedLogs] = await Promise.all([
        getDmsStatusApi(),
        getDmsAuditLogsApi().catch(() => []),
      ])
      setDmsData(updatedStatus)
      setLogs(mapAuditLogs(updatedLogs))
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('legacyvault-access-token')
        navigate('/login', {
          state: {
            from: location.pathname,
            message: isVi
              ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
              : 'Session expired. Please log in again.',
          },
        })
        return
      }
      setApiError(err.data?.error || err.data?.message || err.message)
    } finally {
      setSyncing(false)
    }
  }

  // 4. POST /api/v1/dms/emergency-check-in: Emergency Check-in during Grace Period
  const handleEmergencyCheckIn = async () => {
    setSyncing(true)
    setApiError('')
    setSuccessToast('')

    try {
      const res = await emergencyCheckInDmsApi()
      setSimulatedOffsetDays(0)
      setSuccessToast(
        res.message ||
          (isVi
            ? 'Đã hủy kích hoạt chuyển giao khẩn cấp! Trạng thái két đã được khôi phục an toàn.'
            : 'Emergency check-in confirmed. Safe state restored!'),
      )
      const [updatedStatus, updatedLogs] = await Promise.all([
        getDmsStatusApi(),
        getDmsAuditLogsApi().catch(() => []),
      ])
      setDmsData(updatedStatus)
      setLogs(mapAuditLogs(updatedLogs))
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('legacyvault-access-token')
        navigate('/login', {
          state: {
            from: location.pathname,
            message: isVi
              ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
              : 'Session expired. Please log in again.',
          },
        })
        return
      }
      setApiError(err.data?.error || err.data?.message || err.message)
    } finally {
      setSyncing(false)
    }
  }

  // Real backend calculations
  const simulatedNow = clock + simulatedOffsetDays * 86400000
  const interval = dmsData?.checkInIntervalDays || 30
  const grace = dmsData?.gracePeriodDays || 7
  const lastCheck = dmsData?.lastCheckInAt || new Date().toISOString()
  const due = dmsData?.nextCheckInAt
    ? new Date(dmsData.nextCheckInAt)
    : new Date(new Date(lastCheck).getTime() + interval * 86400000)
  const graceEnd = new Date(due.getTime() + grace * 86400000)

  const elapsed = due.getTime() - simulatedNow
  const graceRemaining = graceEnd.getTime() - simulatedNow

  // Derive DMS View: supports backend statuses 'active', 'due_soon', 'grace_period', 'triggered'
  const dms = computeDmsView({
    configured: !!dmsData,
    now: simulatedNow,
    nextCheckIn: due,
    graceEndsAt: graceEnd,
    backendStatus: simulatedOffsetDays !== 0 ? null : dmsData?.status,
    apiError,
  })

  const dueText = dateLabel(due, isVi ? 'vi-VN' : 'en-US')
  const lastText = dateLabel(lastCheck, isVi ? 'vi-VN' : 'en-US')
  const graceText = dateLabel(graceEnd, isVi ? 'vi-VN' : 'en-US')

  return (
    <OwnerLayout>
      <div className="flow-page-head">
        <div>
          <h1>{isVi ? "Công tắc an toàn (Dead Man's Switch)" : "Dead Man's Switch (DMS)"}</h1>
          <p>
            {isVi
              ? 'Tự động kích hoạt quy trình chuyển giao di sản số nếu chủ tài khoản không phản hồi sau một khoảng thời gian thiết lập.'
              : 'Automated fail-safe trigger that initiates handover verification if you are unable to check in.'}
          </p>
        </div>
        {!loading && dmsData && (
          <span
            className={`badge ${
              dms === 'active'
                ? 'green'
                : dms === 'soon'
                ? 'amber'
                : 'red'
            }`}
          >
            {dms === 'active'
              ? isVi ? '● ĐANG GIÁM SÁT' : '● MONITORING ACTIVE'
              : dms === 'soon'
              ? isVi ? '● SẮP ĐẾN HẠN' : '● CHECK-IN DUE SOON'
              : dms === 'warning'
              ? isVi ? '● ĐANG TRONG THỜI GIAN ÂN HẠN' : '● GRACE PERIOD WARNING'
              : dms === 'triggered'
              ? isVi ? '● ĐÃ KÍCH HOẠT CHUYỂN GIAO' : '● HANDOVER TRIGGERED'
              : isVi ? '● LỖI TRẠNG THÁI' : '● STATUS ERROR'}
          </span>
        )}
      </div>

      {loading && (
        <LoadingState
          label={isVi ? "Đang đồng bộ trạng thái Dead Man's Switch từ máy chủ…" : "Syncing Dead Man's Switch from server…"}
        />
      )}

      {!loading && pageError && (
        <ErrorState
          message={pageError}
          retryLabel={isVi ? 'Thử lại' : 'Retry'}
          onRetry={loadDmsData}
        />
      )}

      {!loading && !pageError && (
        <>
          {successToast && (
            <div style={{ marginBottom: '16px' }}>
              <FormAlert tone="success">{successToast}</FormAlert>
            </div>
          )}

          {apiError && (
            <div style={{ marginBottom: '16px' }}>
              <FormAlert tone="error">{apiError}</FormAlert>
            </div>
          )}

          {/* CẤU HÌNH / THAY ĐỔI THAM SỐ DMS */}
          {(!dmsData || isEditingConfig) && (
            <div className="dms-grid">
              <section className="panel config-card">
                <h3>{isVi ? 'Cấu hình chu kỳ điểm danh tự động' : 'Configure Automated Trigger'}</h3>
                <label className="flow-form-label">
                  {isVi ? 'Chu kỳ điểm danh định kỳ' : 'Check-in Interval'}
                </label>
                <select
                  value={formInterval}
                  onChange={(e) => setFormInterval(Number(e.target.value))}
                >
                  <option value={30}>{isVi ? '1 Tháng (30 ngày - Mặc định)' : '1 Month (30 Days - Default)'}</option>
                  <option value={90}>{isVi ? '3 Tháng (90 ngày)' : '3 Months (90 Days)'}</option>
                  <option value={180}>{isVi ? '6 Tháng (180 ngày)' : '6 Months (180 Days)'}</option>
                  <option value={365}>{isVi ? '1 Năm (365 ngày)' : '12 Months (365 Days)'}</option>
                </select>
                <p>
                  {isVi
                    ? 'Khoảng thời gian định kỳ bạn cần đăng nhập hoặc xác nhận để hệ thống biết bạn vẫn an toàn.'
                    : 'The maximum frequency you are required to sign in and confirm you are safe.'}
                </p>

                <label className="flow-form-label">
                  {isVi ? 'Thời gian ân hạn bổ sung' : 'Grace Period'}
                </label>
                <select
                  value={formGrace}
                  onChange={(e) => setFormGrace(Number(e.target.value))}
                >
                  <option value={7}>{isVi ? '7 Ngày (Mặc định)' : '7 Days (Default)'}</option>
                  <option value={14}>{isVi ? '14 Ngày (Khuyên dùng)' : '14 Days (Recommended)'}</option>
                  <option value={30}>{isVi ? '30 Ngày' : '30 Days'}</option>
                </select>
                <p>
                  {isVi
                    ? 'Thời gian chờ thêm sau khi quá hạn trước khi hệ thống gửi cảnh báo và bàn giao cho người thi hành.'
                    : 'Extra time granted after a missed check-in before official handover procedures start.'}
                </p>

                <label className="flow-form-label">
                  {isVi ? 'Đại diện thi hành nhận thông báo' : 'Notification Contact'}
                </label>
                <div className="readonly">
                  {dmsData?.executorName
                    ? `${dmsData.executorName} (Executor) — ${dmsData.executorEmail || 'No email'}`
                    : isVi
                    ? 'Chưa chỉ định người thi hành (Vui lòng gán trong mục Danh bạ)'
                    : 'No executor assigned (Please assign in Contacts)'}
                </div>
                <p>
                  {isVi
                    ? 'Hệ thống sẽ bảo mật và gửi thông báo kiểm tra đến liên hệ này khi bước vào giai đoạn ân hạn.'
                    : 'We will securely contact this executor once the grace period begins.'}
                </p>

                <hr style={{ margin: '20px 0', borderColor: 'var(--color-border)', opacity: 0.5 }} />

                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button onClick={saveConfig} disabled={syncing}>
                    {syncing
                      ? isVi ? 'Đang lưu...' : 'Saving…'
                      : isVi ? 'Lưu cấu hình lên máy chủ' : 'Save Configuration'}
                  </Button>
                  {dmsData && (
                    <Button variant="secondary" onClick={() => setIsEditingConfig(false)}>
                      {isVi ? 'Hủy' : 'Cancel'}
                    </Button>
                  )}
                </div>
              </section>

              <aside className="how-card">
                <h3>
                  <Shield size={20} />
                  {isVi ? 'Cơ chế hoạt động ra sao?' : 'How does it work?'}
                </h3>
                <p>
                  {isVi
                    ? '1. Định kỳ theo chu kỳ đã chọn, bạn chỉ cần đăng nhập web hoặc bấm nút "Điểm danh" để đặt lại bộ đếm.'
                    : '1. Periodically, you simply log in or click "Check-in Now" to reset the countdown timer.'}
                </p>
                <p>
                  {isVi
                    ? '2. Nếu bạn quên hoặc vắng mặt quá hạn, hệ thống sẽ kích hoạt Thời gian ân hạn (Grace Period) và gửi nhiều cảnh báo khẩn cấp đến bạn.'
                    : '2. If you miss a deadline, the Grace Period begins and urgent alerts are sent to prevent false triggers.'}
                </p>
                <p>
                  {isVi
                    ? '3. Nếu hết thời gian ân hạn mà không có phản hồi, hồ sơ chuyển giao sẽ được kích hoạt để người thi hành và công chứng viên làm thủ tục giải phóng tài sản cho người thừa kế.'
                    : '3. If the grace period expires without check-in, legal verification opens to securely release designated assets to beneficiaries.'}
                </p>
              </aside>
            </div>
          )}

          {/* STATE 2: ACTIVE */}
          {!isEditingConfig && dms === 'active' && (
            <>
              <div className="dms-grid">
                <section className="panel timer-card">
                  <div className="timer-label">
                    {isVi ? 'HẠN ĐIỂM DANH TIẾP THEO TRONG' : 'NEXT CHECK-IN DUE IN'}
                  </div>
                  <div className="timer-value">{formatCountdown(elapsed)}</div>
                  <Button onClick={handleCheckIn} disabled={syncing}>
                    <CalendarDays size={18} />
                    {syncing
                      ? isVi ? 'Đang cập nhật...' : 'Checking in…'
                      : isVi ? 'Điểm danh ngay (Đặt lại thời gian)' : 'Check-in Now (Reset Timer)'}
                  </Button>
                </section>

                <section className="panel parameters">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0 }}>{isVi ? 'Tham số đang áp dụng' : 'Active Parameters'}</h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingConfig(true)}
                      className="auth-link"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      <Settings size={15} />
                      {isVi ? 'Thay đổi' : 'Edit'}
                    </button>
                  </div>
                  <div>
                    <span>{isVi ? 'Chu kỳ kiểm tra' : 'Check-in Interval'}</span>
                    <b>{interval === 90 ? (isVi ? '3 Tháng' : '3 Months') : `${interval} ${isVi ? 'Ngày' : 'Days'}`}</b>
                  </div>
                  <div>
                    <span>{isVi ? 'Thời gian ân hạn' : 'Grace Period'}</span>
                    <b>{grace} {isVi ? 'Ngày' : 'Days'}</b>
                  </div>
                  <div>
                    <span>{isVi ? 'Lần điểm danh gần nhất' : 'Last Check-in'}</span>
                    <b>{lastText}</b>
                  </div>
                  <div>
                    <span>{isVi ? 'Hạn chót tiếp theo' : 'Next Deadline'}</span>
                    <b>{dueText}</b>
                  </div>
                  <div>
                    <span>{isVi ? 'Đại diện thi hành' : 'Designated Executor'}</span>
                    <b>
                      {dmsData?.executorName
                        ? `${dmsData.executorName} (${dmsData.executorEmail || ''})`
                        : (isVi ? 'Chưa chỉ định' : 'None')}
                    </b>
                  </div>
                </section>
              </div>

              <h3 className="audit-heading">
                {isVi ? 'Nhật ký điểm danh (Check-In Audit Log)' : 'Check-In Audit Log'}
              </h3>
              <div className="panel audit-table">
                {logs.map((item, idx) => (
                  <div className="audit-row" key={item.id || idx}>
                    <div>
                      <b>{item.title}</b>
                      <small>{item.via}</small>
                    </div>
                    <span>{item.date}</span>
                    <span className="badge green">{isVi ? 'Hợp lệ' : 'Verified'}</span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-muted)' }}>
                    {isVi ? 'Chưa có nhật ký điểm danh nào được ghi nhận trên máy chủ.' : 'No audit logs recorded on the server yet.'}
                  </div>
                )}
              </div>
            </>
          )}

          {/* STATE 3: DUE SOON or GRACE WARNING */}
          {!isEditingConfig && (dms === 'soon' || dms === 'warning') && (
            <>
              <div
                className={`state-notice ${dms === 'warning' ? 'red-notice' : 'amber-notice'}`}
              >
                <AlertTriangle size={22} style={{ flexShrink: 0 }} />
                <span>
                  {dms === 'soon'
                    ? isVi
                      ? `Hạn kiểm tra an toàn tiếp theo của bạn là ngày ${dueText}. Hãy bấm điểm danh ngay để giữ kho tài sản luôn được bảo vệ an toàn.`
                      : `Your scheduled check-in window closes on ${dueText}. Check in on time to maintain active vault security.`
                    : isVi
                    ? `CẢNH BÁO: Bạn đã bỏ lỡ hạn điểm danh ngày ${dueText}! Hệ thống đã chuyển sang đếm ngược ${grace} ngày ân hạn khẩn cấp. Hãy bấm xác nhận ngay để hủy kích hoạt chuyển giao!`
                    : `WARNING: You missed the check-in deadline (${dueText}). The ${grace}-day Grace Period has been initiated. Check in immediately to restore your safe status.`}
                </span>
              </div>

              <div className="dms-grid">
                <section
                  className={`panel timer-card bordered ${
                    dms === 'warning' ? 'red-border' : 'amber-border'
                  }`}
                >
                  <div className="timer-label" style={{ color: dms === 'warning' ? '#dc2626' : '#d97706' }}>
                    {dms === 'soon'
                      ? isVi ? 'THỜI GIAN CÒN LẠI ĐẾN HẠN' : 'TIME UNTIL DEADLINE'
                      : isVi ? 'THỜI GIAN ÂN HẠN CÒN LẠI' : 'GRACE PERIOD REMAINING'}
                  </div>
                  <div
                    className="timer-value"
                    style={{ color: dms === 'warning' ? '#dc2626' : '#d97706' }}
                  >
                    {formatCountdown(dms === 'soon' ? elapsed : graceRemaining)}
                  </div>
                  <Button
                    onClick={dms === 'warning' ? handleEmergencyCheckIn : handleCheckIn}
                    disabled={syncing}
                    style={{
                      background: dms === 'warning' ? '#dc2626' : '#d97706',
                      color: '#ffffff',
                    }}
                  >
                    <CalendarDays size={18} />
                    {syncing
                      ? (isVi ? 'Đang xác thực…' : 'Processing…')
                      : dms === 'soon'
                      ? (isVi ? 'Điểm danh ngay' : 'Check-in Now')
                      : (isVi ? 'Điểm danh khẩn cấp (Hủy báo động)' : 'Emergency Check-in (Restore Safe State)')}
                  </Button>
                </section>

                <section className="panel timeline">
                  <div className="timeline-head">
                    <h3>{isVi ? 'Tiến trình thời gian' : 'Handoff Timeline'}</h3>
                    <span className={`badge ${dms === 'warning' ? 'red' : 'amber'}`}>
                      {dms === 'warning' ? (isVi ? 'KHẨN CẤP' : 'ACTIVE GRACE') : (isVi ? 'SẮP ĐẾN HẠN' : 'UPCOMING')}
                    </span>
                  </div>
                  <div className="timeline-item t1">
                    <div className="timeline-dot" />
                    <div>
                      <b>{isVi ? 'Hạn điểm danh định kỳ' : 'Check-In Deadline'}</b>
                      <small>{dueText}</small>
                    </div>
                  </div>
                  <div className="timeline-item t2">
                    <div className="timeline-dot" />
                    <div>
                      <b>{isVi ? 'Hết hạn thời gian ân hạn' : 'Grace Period Expiration'}</b>
                      <small>{graceText}</small>
                    </div>
                  </div>
                </section>
              </div>

              <h3 className="audit-heading">
                {isVi ? 'Nhật ký điểm danh (Check-In Audit Log)' : 'Check-In Audit Log'}
              </h3>
              <div className="panel audit-table">
                {logs.map((item, idx) => (
                  <div className="audit-row" key={item.id || idx}>
                    <div>
                      <b>{item.title}</b>
                      <small>{item.via}</small>
                    </div>
                    <span>{item.date}</span>
                    <span className="badge green">{isVi ? 'Hợp lệ' : 'Verified'}</span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-muted)' }}>
                    {isVi ? 'Chưa có nhật ký điểm danh nào được ghi nhận trên máy chủ.' : 'No audit logs recorded on the server yet.'}
                  </div>
                )}
              </div>
            </>
          )}

          {/* STATE 4: TRIGGERED */}
          {!isEditingConfig && dms === 'triggered' && (
            <section className="panel triggered-panel">
              <div className="trigger-icon">
                <AlertTriangle size={36} />
              </div>
              <h2>{isVi ? 'Quy trình chuyển giao di sản đã kích hoạt' : 'Handover Process Activated'}</h2>
              <p>
                {isVi
                  ? 'Hạn điểm danh định kỳ và thời gian ân hạn đã kết thúc mà không có phản hồi từ chủ tài khoản.'
                  : 'The scheduled check-in interval and grace period have expired without owner confirmation.'}
              </p>

              <div className="trigger-detail">
                <b>{isVi ? 'Hồ sơ bàn giao' : 'Handover Case'}</b>
                <span>
                  {handoverCases.length > 0
                    ? `${handoverCases[0].caseNumber} (${handoverCases[0].status})`
                    : (isVi ? 'Đã tạo phiên bàn giao di sản số' : 'Handover case initiated')}
                </span>
              </div>
              <div className="trigger-detail">
                <b>{isVi ? 'Thông báo người thi hành' : 'Executor Notification'}</b>
                <span>
                  {dmsData?.executorName
                    ? `${dmsData.executorName} (${dmsData.executorEmail || ''})`
                    : (isVi ? 'Đã gửi thông báo bảo mật đến người giám sát' : 'Security notice sent to designated executor')}
                </span>
              </div>
              <div className="trigger-detail">
                <b>{isVi ? 'Trạng thái két số' : 'Vault Access Status'}</b>
                <span>{isVi ? 'Đã khóa — Yêu cầu xác thực công chứng pháp lý' : 'Locked — legal verification required'}</span>
              </div>

              <div className="trigger-footnote">
                {isVi
                  ? 'Bước tiếp theo: Flow 5 — Xác thực pháp lý và công chứng trước khi tài sản được giải phóng cho người thụ hưởng.'
                  : 'Next step: Flow 5 — Legal Verification before any assets are released.'}
              </div>

              <div style={{ marginTop: 24 }}>
                <Button variant="secondary" onClick={handleCheckIn} disabled={syncing}>
                  <RotateCcw size={16} />
                  {isVi ? 'Khôi phục lại két (Reset Demo)' : 'Reset Demo State'}
                </Button>
              </div>
            </section>
          )}

          {/* Presentation Demo Simulator Bar */}
          <div className="sim-bar">
            <span style={{ fontWeight: 600 }}>
              {isVi ? '🛠 Công cụ mô phỏng demo:' : '🛠 Demo Presentation Simulator:'}
            </span>
            <button
              type="button"
              onClick={() => {
                setSimulatedOffsetDays(0)
              }}
            >
              {isVi ? '1. Trạng thái bình thường (Active)' : '1. Normal Active'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSimulatedOffsetDays(interval - 2)
              }}
            >
              {isVi ? '2. Sắp đến hạn (Due Soon)' : '2. Due Soon (< 3 days)'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSimulatedOffsetDays(interval + 3)
              }}
            >
              {isVi ? '3. Đang ân hạn (Grace Warning)' : '3. Grace Period Warning'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSimulatedOffsetDays(interval + grace + 1)
              }}
            >
              {isVi ? '4. Kích hoạt chuyển giao (Triggered)' : '4. Triggered Handover'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditingConfig(true)
              }}
            >
              {isVi ? 'Cấu hình lại' : 'Re-configure'}
            </button>
          </div>
        </>
      )}
    </OwnerLayout>
  )
}
