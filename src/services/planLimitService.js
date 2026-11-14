import { getSubscription } from './billingService.js'
import { fetchPlans } from './pricingService.js'

export class PlanLimitExceededError extends Error {
  constructor(metric, limit, current, requested) {
    super('The selected plan limit has been reached.')
    this.name = 'PlanLimitExceededError'
    this.code = 'PLAN_LIMIT_EXCEEDED'
    this.metric = metric
    this.limit = limit
    this.current = current
    this.requested = requested
  }
}

export async function getCurrentPlanLimits() {
  const [plans, subscription] = await Promise.all([fetchPlans(), getSubscription()])
  const plan = plans.find((item) => item.id === subscription?.planId) || plans.find((item) => item.id === 'free')
  if (!plan?.limits) throw new Error('Could not load the limits for your current plan.')
  return { plan, limits: plan.limits }
}

export async function assertPlanCapacity(metric, current, requested = 1) {
  const { limits } = await getCurrentPlanLimits()
  const limit = Number(limits[metric])
  if (!Number.isFinite(limit)) throw new Error(`The current plan does not define a ${metric} limit.`)
  if (Number(current) + Number(requested) > limit) {
    throw new PlanLimitExceededError(metric, limit, Number(current), Number(requested))
  }
  return limit
}

export function getPlanLimitMessage(error, language = 'en') {
  if (error?.code !== 'PLAN_LIMIT_EXCEEDED') return null
  const labels = language === 'vi'
    ? {
        collections: 'bộ sưu tập',
        records: 'hồ sơ',
        trustedContacts: 'người liên hệ tin cậy',
        attachmentsPerRecord: 'tài liệu đính kèm cho mỗi hồ sơ',
      }
    : {
        collections: 'collections',
        records: 'records',
        trustedContacts: 'trusted contacts',
        attachmentsPerRecord: 'attachments per record',
      }
  return language === 'vi'
    ? `Bạn đã đạt giới hạn ${labels[error.metric] || 'của gói'} (${error.limit}). Hãy nâng cấp gói để thêm nội dung.`
    : `You’ve reached your ${labels[error.metric] || 'plan'} limit (${error.limit}). Upgrade your plan to add more.`
}
