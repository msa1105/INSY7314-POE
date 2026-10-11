import { describe, expect, test } from 'vitest'
import { checkPassword, validateGig, validateRegister } from '../utils/validation'
import { decodeEntities, formatRand } from '../utils/format'

describe('validation helpers', () => {
  test('checkPassword enforces the same policy as the API', () => {
    expect(checkPassword('Short1!')).toMatch(/at least 8/)
    expect(checkPassword('alllowercase1!')).toMatch(/uppercase/)
    expect(checkPassword('NoNumbers!!')).toMatch(/number/)
    expect(checkPassword('NoSpecial123')).toMatch(/special/)
    expect(checkPassword(`Aa1!${'x'.repeat(130)}`)).toMatch(/at most 128/)
    expect(checkPassword('SecurePass1!')).toBeNull()
  })

  test('validateRegister only allows client or freelancer roles', () => {
    const errors = validateRegister({
      name: 'Al', email: 'a@b.co', password: 'SecurePass1!', confirmPassword: 'SecurePass1!', role: 'admin',
    })
    expect(errors.role).toBeDefined()
  })

  test('validateGig checks price range', () => {
    const base = { title: 'Valid title', description: 'Valid description', category: 'Design' }
    expect(validateGig({ ...base, price: '0' }).price).toBeDefined()
    expect(validateGig({ ...base, price: 'abc' }).price).toBeDefined()
    expect(validateGig({ ...base, price: '100' })).toEqual({})
  })
})

describe('format helpers', () => {
  test('decodeEntities reverses the API\'s HTML escaping', () => {
    expect(decodeEntities('&lt;b&gt;Tom &amp; Jerry&#x27;s&lt;&#x2F;b&gt;')).toBe("<b>Tom & Jerry's</b>")
  })

  test('formatRand formats South African Rand', () => {
    expect(formatRand(1500)).toMatch(/R\s?1[\s, ]500[.,]00/)
  })
})
