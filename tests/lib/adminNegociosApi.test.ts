/* eslint-disable */
jest.mock('../../lib/backendUrl', () => ({ getBackendOrigin: () => 'http://test-backend' }))
jest.mock('axios', () => ({ post: jest.fn() }))

const axios = require('axios')
const { archivarNegocio } = require('../../lib/adminNegociosApi')

describe('adminNegociosApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls axios.post with correct URL and payload when archiving', async () => {
    axios.post.mockResolvedValue({ data: { success: true } })

    const result = await archivarNegocio({ negocioId: 'n1', motivo: '  motivo  ', adminUid: 'admin1' })

    expect(axios.post).toHaveBeenCalledWith(
      'http://test-backend/api/admin/negocios/n1/archivar',
      { motivo: 'motivo', adminUid: 'admin1' },
      { withCredentials: true }
    )

    expect(result).toEqual({ success: true })
  })
})
