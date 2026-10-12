import { describe, expect, test } from 'vitest'
import { checkPassword, validateGig, validateRegister, validateRequest } from '../utils/validation'
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

  test('validateGig mirrors the API allow-lists', () => {
    const base = { title: 'Valid title', description: 'Valid description', price: '100', category: 'Design' }
    expect(validateGig({ ...base, category: 'Anything goes' }).category).toMatch(/from the list/)
    expect(validateGig({ ...base, price: '10.999' }).price).toMatch(/2 decimal/)
    expect(validateGig({ ...base, price: '1e3' }).price).toBeDefined()
    expect(validateGig({ ...base, title: '<script>x</script>' }).title).toBeDefined()
    expect(validateGig({ ...base, title: '!!!!!!!!' }).title).toMatch(/letter/)
    expect(validateGig({ ...base, description: 'Bad\u0000description' }).description).toBeDefined()
    expect(validateGig({ ...base, description: 'Line one here\nLine two here' })).toEqual({})
  })

  test('validateRegister only allows real-name characters', () => {
    const base = { email: 'a@b.co', password: 'SecurePass1!', confirmPassword: 'SecurePass1!', role: 'client' }
    expect(validateRegister({ ...base, name: 'R0b0t 123' }).name).toBeDefined()
    expect(validateRegister({ ...base, name: "Zoë O'Brien-Nkosi" }).name).toBeUndefined()
    expect(validateRegister({ ...base, name: 'Valid Name', email: `${'a'.repeat(250)}@b.co` }).email).toMatch(/254/)
  })

  test('validateRequest checks details and a 2-decimal offer', () => {
    const base = { details: 'Need a logo for my shop.', amount: '500' }
    expect(validateRequest(base)).toEqual({})
    expect(validateRequest({ ...base, amount: '99.999' }).amount).toMatch(/2 decimal/)
    expect(validateRequest({ ...base, details: 'Bad\u0007details here' }).details).toBeDefined()
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
