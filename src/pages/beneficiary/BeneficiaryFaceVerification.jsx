import { useEffect, useRef, useState } from 'react'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import Icon from '../../components/Icon.jsx'
import {
  completeBeneficiaryFaceCheckApi,
  createBeneficiaryFaceCheckApi,
  getBeneficiaryFaceCaseStatusApi,
  getBeneficiaryFaceEnrollmentApi,
} from '../../services/beneficiaryFaceService.js'
import './beneficiaryFaceVerification.css'

const MODEL_BASE_PATH = 'https://vladmandic.github.io/human-models/models/'
const SAMPLE_COUNT = 5
const SCAN_TIMEOUT_MS = 45_000

const humanConfig = {
  backend: 'webgl',
  modelBasePath: MODEL_BASE_PATH,
  filter: { enabled: true, flip: false },
  face: {
    enabled: true,
    detector: { rotation: true, return: true, mask: false, minConfidence: 0.6 },
    description: { enabled: true },
    iris: { enabled: true },
    emotion: { enabled: false },
    antispoof: { enabled: true },
    liveness: { enabled: true },
  },
  body: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  segmentation: { enabled: false },
  gesture: { enabled: true },
}

const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length
const percent = (value) => `${Math.round(value * 100)}%`

function stopStream(streamRef, videoRef) {
  streamRef.current?.getTracks().forEach((track) => track.stop())
  streamRef.current = null
  if (videoRef.current) videoRef.current.srcObject = null
}

function cameraErrorMessage(error, copy) {
  if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') return copy.cameraBlocked
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') return copy.cameraUnavailable
  if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') return copy.cameraBusy
  return error?.message || copy.cameraUnavailable
}

export default function BeneficiaryFaceVerification({ caseRef, copy, onVerificationStateChange }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const humanRef = useRef(null)
  const latestFaceRef = useRef(null)
  const challengeRef = useRef(null)
  const onStatusChangeRef = useRef(onVerificationStateChange)

  const [statusRetry, setStatusRetry] = useState(0)
  const [statusLoading, setStatusLoading] = useState(true)
  const [statusError, setStatusError] = useState('')
  const [enrolled, setEnrolled] = useState(false)
  const [verified, setVerified] = useState(false)
  const [consent, setConsent] = useState(false)
  const [starting, setStarting] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [busy, setBusy] = useState(false)
  const [modelStatus, setModelStatus] = useState(copy.modelsReady)
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')
  const [challenge, setChallenge] = useState(null)
  const [result, setResult] = useState(null)
  const [metrics, setMetrics] = useState({ faceCount: 0, confidence: null })

  useEffect(() => {
    onStatusChangeRef.current = onVerificationStateChange
  }, [onVerificationStateChange])

  useEffect(() => {
    let active = true

    Promise.all([
      getBeneficiaryFaceEnrollmentApi(),
      getBeneficiaryFaceCaseStatusApi(caseRef),
    ]).then(([enrollment, kyc]) => {
      if (!active) return
      const hasReference = Boolean(enrollment?.enrolled)
      const passed = String(kyc?.biometric_facial_verification_status || '').toUpperCase() === 'VERIFIED'
      setEnrolled(hasReference)
      setVerified(passed)
      setMessage(passed ? copy.alreadyVerified : hasReference ? copy.enrolledNeedsScan : copy.enrollmentRequired)
      onStatusChangeRef.current?.(passed)
    }).catch((error) => {
      if (!active) return
      setStatusError(error?.message || copy.statusFailure)
      onStatusChangeRef.current?.(false)
    }).finally(() => {
      if (active) setStatusLoading(false)
    })

    return () => { active = false }
  }, [caseRef, copy, statusRetry])

  useEffect(() => () => stopStream(streamRef, videoRef), [])

  async function loadModels() {
    if (humanRef.current) return humanRef.current
    setModelStatus(copy.modelsLoading)
    const { default: Human } = await import('@vladmandic/human')
    const human = new Human(humanConfig)
    await human.load()
    humanRef.current = human
    setModelStatus(copy.modelsReady)
    return human
  }

  async function startCamera() {
    if (!enrolled) {
      setFailure(copy.enrollmentRequired)
      return
    }

    if (!consent) {
      setFailure(copy.consentRequired)
      return
    }

    setStarting(true)
    setFailure('')
    setMessage(copy.cameraPreparing)
    try {
      await loadModels()
      if (!navigator.mediaDevices?.getUserMedia) throw new Error(copy.cameraUnavailable)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCameraActive(true)
      setResult(null)
      setMetrics({ faceCount: 0, confidence: null })
      setMessage(copy.cameraReady)
    } catch (error) {
      stopStream(streamRef, videoRef)
      setCameraActive(false)
      setFailure(cameraErrorMessage(error, copy))
      setMessage('')
      setModelStatus(copy.modelsReady)
    } finally {
      setStarting(false)
    }
  }

  async function beginVerification() {
    if (!enrolled || !consent || !cameraActive || metrics.faceCount !== 1) return
    setBusy(true)
    setFailure('')
    setResult(null)
    setMessage(copy.startingCheck)
    try {
      const session = await createBeneficiaryFaceCheckApi(caseRef)
      const direction = String(session?.challengeDirection || '').toLowerCase()
      if (!session?.sessionId || !['left', 'right'].includes(direction)) {
        throw new Error(copy.sessionFailure)
      }
      challengeRef.current = {
        active: true,
        sessionId: session.sessionId,
        step: 'turn',
        direction,
        startedAt: Date.now(),
        liveSamples: [],
        realSamples: [],
        lastFace: null,
      }
      setChallenge({ step: 'turn', direction })
      setMessage(copy.turnHead(direction))
    } catch (error) {
      challengeRef.current = null
      setChallenge(null)
      setBusy(false)
      setFailure(error?.message || copy.sessionFailure)
      setMessage('')
    }
  }

  function cancelVerification() {
    challengeRef.current = null
    setChallenge(null)
    setBusy(false)
    setMessage(copy.scanCancelled)
  }

  function startOver() {
    setVerified(false)
    setResult(null)
    setFailure('')
    setMessage(copy.enrolledNeedsScan)
    onStatusChangeRef.current?.(false)
  }

  useEffect(() => {
    if (!cameraActive || !humanRef.current) return undefined
    let running = true
    let timerId

    async function submitVerification(active, face, challengeCompleted) {
      setMessage(copy.submittingCheck)
      try {
        const livenessScore = active.liveSamples.length ? average(active.liveSamples) : 0
        const antiSpoofScore = active.realSamples.length ? average(active.realSamples) : 0
        const response = await completeBeneficiaryFaceCheckApi(caseRef, active.sessionId, {
          challengeCompleted,
          livenessScore,
          antiSpoofScore,
          embedding: Array.from(face.embedding),
        })
        const passed = Boolean(response?.passed)
        setResult(response)
        setVerified(passed)
        setMessage(response?.message || (passed ? copy.scanPassed : copy.scanFailed))
        onStatusChangeRef.current?.(passed)
        if (passed) {
          stopStream(streamRef, videoRef)
          setCameraActive(false)
        }
      } catch (error) {
        setFailure(error?.message || copy.scanFailure)
        setMessage('')
      } finally {
        challengeRef.current = null
        setChallenge(null)
        setBusy(false)
      }
    }

    async function detectLoop() {
      if (!running) return
      const video = videoRef.current
      if (video?.readyState >= 2) {
        try {
          const detected = await humanRef.current.detect(video)
          if (!running) return
          const faces = detected.face || []
          const face = faces.length === 1 ? faces[0] : null
          const gestures = (detected.gesture || []).map((item) => item.gesture)
          latestFaceRef.current = face
          setMetrics({ faceCount: faces.length, confidence: face?.faceScore ?? face?.boxScore ?? null })

          const active = challengeRef.current
          if (active?.active) {
            if (Date.now() - active.startedAt > SCAN_TIMEOUT_MS) {
              active.active = false
              challengeRef.current = null
              setChallenge(null)
              setBusy(false)
              setFailure(copy.scanTimeout)
              setMessage('')
            } else if (face && active.step === 'turn' && gestures.includes(`facing ${active.direction}`)) {
              active.step = 'blink'
              setChallenge({ step: 'blink', direction: active.direction })
              setMessage(copy.blinkNow)
            } else if (face && active.step === 'blink' && gestures.some((gesture) => gesture.startsWith('blink '))) {
              active.step = 'sampling'
              setChallenge({ step: 'sampling', direction: active.direction })
              setMessage(copy.holdStill)
            } else if (face && active.step === 'sampling') {
              if (Number.isFinite(face.live) && Number.isFinite(face.real) && face.embedding?.length) {
                active.liveSamples.push(face.live)
                active.realSamples.push(face.real)
                active.lastFace = face
              }
              if (active.liveSamples.length >= SAMPLE_COUNT) {
                active.active = false
                await submitVerification(active, active.lastFace, true)
              }
            }
          }
        } catch (error) {
          if (running) {
            challengeRef.current = null
            setChallenge(null)
            setBusy(false)
            setFailure(error?.message || copy.modelFailure)
            setMessage('')
          }
        }
      }
      if (running) timerId = window.setTimeout(detectLoop, 160)
    }

    void detectLoop()
    return () => {
      running = false
      window.clearTimeout(timerId)
    }
  }, [cameraActive, caseRef, copy])

  const challengePrompt = challenge?.step === 'turn'
    ? copy.turnHead(challenge.direction)
    : challenge?.step === 'blink'
      ? copy.blinkNow
      : challenge?.step === 'sampling'
        ? copy.holdStill
        : ''

  return (
    <div className="flow6-face">
      <header className="flow6-face__header">
        <span className="flow6-face__icon"><Icon name="shieldCheck" size={18} /></span>
        <div>
          <h3 id="flow6-face-title" className="section-title">{copy.title}</h3>
          <p className="page-text">{copy.description}</p>
        </div>
        <span className={`handover-status ${verified ? 'handover-status--success' : 'handover-status--warning'}`}>
          <span className="handover-status__dot" />{verified ? copy.passedBadge : copy.requiredBadge}
        </span>
      </header>

      {statusLoading && <p className="handover-note" role="status">{copy.checkingStatus}</p>}
      {statusError && (
        <FormAlert>
          {statusError}
          <div className="flow6-face__retry">
            <Button
              variant="secondary"
              onClick={() => {
                setStatusLoading(true)
                setStatusError('')
                setStatusRetry((value) => value + 1)
              }}
            >
              {copy.retry}
            </Button>
          </div>
        </FormAlert>
      )}

      {!statusLoading && !statusError && verified && (
        <div className="flow6-face__result flow6-face__result--success" role="status">
          <strong><Icon name="check" size={15} /> {copy.scanPassed}</strong>
          <p>{copy.alreadyVerified}</p>
          <Button variant="secondary" onClick={startOver}>{copy.scanAgain}</Button>
        </div>
      )}

      {!statusLoading && !statusError && !verified && (
        <>
          {!enrolled ? (
            <p className="handover-note" role="status">{copy.enrollmentRequired}</p>
          ) : (
            <>
              <p className="handover-note">{copy.enrolledNeedsScan}</p>
          <label className="handover-check flow6-face__consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              disabled={starting || busy}
            />
            <span>{copy.consent}</span>
          </label>

          <div className={`flow6-face__preview ${cameraActive ? 'is-active' : ''}`}>
            <video ref={videoRef} muted playsInline autoPlay aria-label={copy.livePreview} className={cameraActive ? 'is-visible' : ''} />
            {!cameraActive && (
              <div className="flow6-face__placeholder">
                <span className="flow6-face__camera-icon"><Icon name="eye" size={22} /></span>
                <strong>{copy.livePreview}</strong>
                <span>{copy.cameraInstructions}</span>
              </div>
            )}
            {cameraActive && <div className="flow6-face__guide" aria-hidden="true" />}
            {cameraActive && (
              <div className="flow6-face__camera-status">
                <i className={metrics.faceCount === 1 ? 'is-detected' : ''} />
                {metrics.faceCount === 1 ? copy.oneFace : metrics.faceCount > 1 ? copy.multipleFaces : copy.noFace}
              </div>
            )}
            {challengePrompt && <div className="flow6-face__challenge">{challengePrompt}</div>}
          </div>

          <div className="flow6-face__controls">
            <div className="flow6-face__actions">
              {!cameraActive ? (
                <Button onClick={startCamera} disabled={starting || busy || !consent}>
                  {starting ? copy.preparingCamera : copy.startCamera}
                </Button>
              ) : busy && challenge ? (
                <Button variant="secondary" onClick={cancelVerification}>{copy.cancelScan}</Button>
              ) : (
                <Button onClick={beginVerification} disabled={busy || metrics.faceCount !== 1 || !consent}>
                  {busy ? copy.preparingCheck : result?.passed === false ? copy.scanAgain : copy.startCheck}
                </Button>
              )}
              {cameraActive && !busy && (
                <Button variant="secondary" onClick={() => { stopStream(streamRef, videoRef); setCameraActive(false); setMessage(copy.cameraStopped) }}>
                  {copy.stopCamera}
                </Button>
              )}
            </div>
            <p className="flow6-face__status" role="status">
              {failure || message || (cameraActive ? copy.cameraReady : modelStatus)}
            </p>
            {cameraActive && metrics.confidence != null && (
              <small className="flow6-face__quality">{copy.faceQuality(percent(metrics.confidence))}</small>
            )}
          </div>

          {failure && <FormAlert>{failure}</FormAlert>}
          {result && (
            <div className={`flow6-face__result ${result.passed ? 'flow6-face__result--success' : 'flow6-face__result--failure'}`} role={result.passed ? 'status' : 'alert'}>
              <strong>{result.passed ? copy.scanPassed : copy.scanFailed}</strong>
              <dl>
                <div><dt>{copy.matchScore}</dt><dd>{percent(result.faceMatchScore || 0)}</dd></div>
                <div><dt>{copy.livenessScore}</dt><dd>{percent(result.livenessScore || 0)}</dd></div>
                <div><dt>{copy.antiSpoofScore}</dt><dd>{percent(result.antiSpoofScore || 0)}</dd></div>
              </dl>
              <p>{result.message}</p>
            </div>
          )}

          <div className="flow6-face__privacy">
            <p><Icon name="lock" size={14} /> {copy.privacy}</p>
            <small>{copy.prototypeNotice}</small>
          </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
