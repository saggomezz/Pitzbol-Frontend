/* eslint-disable */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

// Mock framer-motion to simple button wrapper used by the component
jest.mock('framer-motion', () => ({
  motion: {
    button: (props: any) => React.createElement('button', props, props.children),
  },
}))

// Mock fetch to return sample rating stats
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ stats: { averageRating: 4.2, totalRatings: 10 } }),
  })
) as any

const PlaceRating = require('../../app/components/PlaceRating').default

describe('PlaceRating component', () => {
  it('renders average rating and total ratings after fetch', async () => {
    render(React.createElement(PlaceRating, { placeName: 'Test Place' }))

    await waitFor(() => expect(screen.getByText(/10 calificaciones/)).toBeInTheDocument())
  })
})
