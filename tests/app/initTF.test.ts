/* eslint-disable */
// Mock TensorFlow to avoid loading heavy native code during tests
jest.mock('@tensorflow/tfjs', () => ({
  setBackend: jest.fn().mockResolvedValue(undefined),
  ready: jest.fn().mockResolvedValue(undefined),
  default: {
    setBackend: jest.fn().mockResolvedValue(undefined),
    ready: jest.fn().mockResolvedValue(undefined),
  },
}))

import { ensureTensorFlowReady } from '../../app/initTF'

describe('ensureTensorFlowReady', () => {
  it('sets window.tf and returns a tf instance', async () => {
    const tf = await ensureTensorFlowReady()
    expect(tf).toBeDefined()
    expect((global as any).window.tf).toBeDefined()
  })
})
