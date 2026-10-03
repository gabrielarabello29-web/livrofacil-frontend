import { describe, expect, it } from 'vitest'
import { obterClienteId } from '../context/AuthContext'

describe('obterClienteId', () => {
  it('prefers a UUID from the authenticated user', () => {
    expect(obterClienteId({ id: 17, uuid: '8b8b1c85-3f82-4d24-945d-3f262629e20d' })).toBe(
      '8b8b1c85-3f82-4d24-945d-3f262629e20d',
    )
  })

  it('does not treat a numeric or arbitrary string id as a UUID', () => {
    expect(obterClienteId({ id: 17 })).toBeNull()
    expect(obterClienteId({ id: 'cliente-17' })).toBeNull()
  })

  it('accepts a UUID in id when the API omits the uuid property', () => {
    expect(obterClienteId({ id: '8b8b1c85-3f82-4d24-945d-3f262629e20d' })).toBe(
      '8b8b1c85-3f82-4d24-945d-3f262629e20d',
    )
  })
})