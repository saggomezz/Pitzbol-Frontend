/* eslint-disable */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const AdminEditableLocation = require('../../app/components/AdminEditableLocation').default

describe('AdminEditableLocation reverse geocoding', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    // @ts-ignore
    global.fetch = jest.fn(async (input: any) => {
      const url = typeof input === 'string' ? input : input.url
      if (url.includes('/api/lugares/geocode')) {
        return { ok: true, json: async () => ({ success: true, latitud: '20.673', longitud: '-103.343' }) }
      }
      if (url.includes('/api/lugares/reverse-geocode')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            address: {
              road: 'Calle Falsa',
              city: 'Guadalajara',
              state: 'Jalisco',
              neighbourhood: 'Centro',
              house_number: '123',
              postcode: '44100',
              display_name: 'Calle Falsa 123, Centro, Guadalajara, Jalisco'
            }
          })
        }
      }
      return { ok: true, json: async () => ({}) }
    })
  })

  it('calculates coordinates and fills city/state', async () => {
    const onSave = jest.fn(async () => Promise.resolve())
    const onCoordinatesChange = jest.fn()
    const onEditModeChange = jest.fn()

    render(
      React.createElement(AdminEditableLocation, {
        location: '',
        latitud: '',
        longitud: '',
        onSave,
        onCoordinatesChange,
        onEditModeChange,
        forceEditMode: true,
      })
    )

    const calle = screen.getByPlaceholderText(/Calle/i)
    fireEvent.change(calle, { target: { value: 'Calle Falsa' } })

    const numero = screen.getByPlaceholderText(/Número/i)
    fireEvent.change(numero, { target: { value: '123' } })

    const cp = screen.getByPlaceholderText(/Código Postal/i)
    fireEvent.change(cp, { target: { value: '44100' } })

    const geocodeBtn = screen.getByRole('button', { name: /Calcular coordenadas en el mapa/i })
    fireEvent.click(geocodeBtn)

    await waitFor(() => expect(screen.getByPlaceholderText(/Latitud/i)).toHaveValue('20.673'))
    await waitFor(() => expect(screen.getByPlaceholderText(/Longitud/i)).toHaveValue('-103.343'))
    await waitFor(() => expect(screen.getByPlaceholderText(/Ciudad/i)).toHaveValue('Guadalajara'))
    await waitFor(() => expect(screen.getByPlaceholderText(/Estado/i)).toHaveValue('Jalisco'))
  })
})
