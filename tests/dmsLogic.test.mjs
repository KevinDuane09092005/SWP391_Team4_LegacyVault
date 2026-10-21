import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeDmsView,
  formatTimeInterval,
  formatCountdown,
  dateLabel,
  futureDate,
} from '../src/vault/dmsLogic.js'

test('formatTimeInterval formats seconds into clear Vietnamese and English strings', () => {
  // Test seconds (< 60s)
  assert.equal(formatTimeInterval(30, true), '30 Giây (30s)')
  assert.equal(formatTimeInterval(30, false), '30 Seconds (30s)')
  assert.equal(formatTimeInterval(50, true), '50 Giây (50s)')

  // Test minutes
  assert.equal(formatTimeInterval(60, true), '1 Phút (60s)')
  assert.equal(formatTimeInterval(300, true), '5 Phút (300s)')
  assert.equal(formatTimeInterval(300, false), '5 Minutes (300s)')

  // Test production days
  assert.equal(formatTimeInterval(86400, true), '1 Ngày')
  assert.equal(formatTimeInterval(604800, true), '7 Ngày (1 tuần)')
  assert.equal(formatTimeInterval(604800, false), '7 Days (1 week)')
  assert.equal(formatTimeInterval(1209600, true), '14 Ngày (2 tuần)')
  assert.equal(formatTimeInterval(2592000, true), '1 Tháng (30 ngày)')
  assert.equal(formatTimeInterval(7776000, true), '3 Tháng (90 ngày)')
  assert.equal(formatTimeInterval(31536000, true), '1 Năm (365 ngày)')
})

test('formatCountdown handles seconds, minutes, hours and days', () => {
  // 30 seconds
  assert.equal(formatCountdown(30 * 1000), '00:00:30')
  // 1 minute 15 seconds
  assert.equal(formatCountdown(75 * 1000), '00:01:15')
  // 2 hours 5 minutes 10 seconds
  assert.equal(formatCountdown((2 * 3600 + 5 * 60 + 10) * 1000), '02:05:10')
  // 3 days 4 hours
  assert.match(formatCountdown((3 * 86400 + 4 * 3600) * 1000), /^3d 04:00:00$/)
})

test('computeDmsView handles short test interval (30s) correctly', () => {
  const now = Date.now()
  const intervalMs = 30 * 1000 // 30s
  const nextCheckIn = new Date(now + 25 * 1000) // 25s left -> active
  const graceEndsAt = new Date(now + (25 + 50) * 1000)

  // 1. Normal active state
  const view1 = computeDmsView({
    configured: true,
    now,
    nextCheckIn,
    graceEndsAt,
    intervalMs,
  })
  assert.equal(view1, 'active')

  // 2. Due soon threshold for 30s is 10s
  const view2 = computeDmsView({
    configured: true,
    now,
    nextCheckIn: new Date(now + 8 * 1000), // 8s left
    graceEndsAt,
    intervalMs,
  })
  assert.equal(view2, 'soon')

  // 3. Past due date -> warning (grace period)
  const view3 = computeDmsView({
    configured: true,
    now,
    nextCheckIn: new Date(now - 5 * 1000), // 5s past due
    graceEndsAt: new Date(now + 45 * 1000),
    intervalMs,
  })
  assert.equal(view3, 'warning')

  // 4. Past grace deadline -> triggered
  const view4 = computeDmsView({
    configured: true,
    now,
    nextCheckIn: new Date(now - 60 * 1000),
    graceEndsAt: new Date(now - 10 * 1000), // 10s past grace
    intervalMs,
  })
  assert.equal(view4, 'triggered')
})

test('futureDate calculates future timestamp in seconds', () => {
  const base = new Date('2026-01-01T00:00:00.000Z')
  const future = futureDate(base, 30) // 30 seconds
  assert.equal(future.getTime() - base.getTime(), 30000)
})
