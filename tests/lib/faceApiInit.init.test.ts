/* eslint-disable */
// Mock heavy native libs used by initTF to keep tests fast and isolated
jest.mock('@tensorflow/tfjs', () => ({
  setBackend: jest.fn().mockResolvedValue(undefined),
  ready: jest.fn().mockResolvedValue(undefined),
  default: {
    setBackend: jest.fn().mockResolvedValue(undefined),
    ready: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@vladmandic/face-api', () => ({ default: { loadModels: jest.fn() } }))

import { ensureFaceApiReady } from '../../app/initTF'

describe('faceApi ensure ready', () => {
  it('initializes TensorFlow and face-api without throwing', async () => {
    const faceapi = await ensureFaceApiReady()
    expect(faceapi).toBeDefined()
    expect((global as any).window.tf).toBeDefined()
  })
})
