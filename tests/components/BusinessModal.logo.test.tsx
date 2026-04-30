/* eslint-disable */
import React from 'react'
import { render, waitFor, screen, fireEvent } from '@testing-library/react'

// Mock next-intl used by the component
jest.mock('next-intl', () => ({
  useTranslations: () => (k: string) => k,
  NextIntlClientProvider: ({ children }: any) => children,
}))

// Mock local static asset import and next/image to avoid Jest parsing PNG
jest.mock('../../app/components/logoPitzbol.png', () => 'logo-mock')
jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => React.createElement('img', props) }))
// Stub the map picker which depends on ESM-only `react-leaflet` to avoid transform issues
jest.mock('../../app/components/MinimapaLocationPicker', () => ({ __esModule: true, default: (props: any) => React.createElement('div', null, 'map-stub') }))

const BusinessModal = require('../../app/components/BusinessModal').default

describe('BusinessModal logo handling', () => {
  it('advances modal flow and renders file inputs for logo and gallery', async () => {
    // Mock fetch calls used by the modal (uniqueness, geocode, reverse-geocode)
    // Provide realistic responses so the component can progress without external services.
    // @ts-ignore
    global.fetch = jest.fn(async (input: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/business/validate-uniqueness')) {
        return { ok: true, json: async () => ({ valid: true }) };
      }
      if (url.includes('/api/lugares/geocode')) {
        return { ok: true, json: async () => ({ success: true, latitud: '20.673', longitud: '-103.343' }) };
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
        };
      }
      if (url.includes('/api/colonias')) {
        return { ok: true, json: async () => ({ colonias: [] }) };
      }
      return { ok: true, json: async () => ({}) };
    })

    render(React.createElement(BusinessModal, { isOpen: true, onClose: () => {} }))

    // Fill step 0 (brand identity)
    const nameInput = screen.getByPlaceholderText(/businessName|Nombre del Negocio|Nombre del negocio/i)
    fireEvent.change(nameInput, { target: { value: 'Mi Tienda' } })

    const categorySelect = screen.getByRole('combobox')
    fireEvent.change(categorySelect, { target: { value: 'Restaurante / Cafetería' } })

    const emailInput = screen.getByPlaceholderText(/businessEmail|Correo|Correo de Negocios|Correo electrónico/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const phoneInput = screen.getByPlaceholderText(/whatsappPhone|WhatsApp|Teléfono/i)
    fireEvent.change(phoneInput, { target: { value: '5512345678' } })

    // Click next to go to address step
    const nextBtn = screen.getByRole('button', { name: /nextStep|Siguiente Paso|Next Step/i })
    fireEvent.click(nextBtn)

    // Fill address fields in step 1
    const calle = await screen.findByPlaceholderText(/Calle/i)
    fireEvent.change(calle, { target: { value: 'Calle Falsa' } })
    const numero = screen.getByPlaceholderText(/Número/i)
    fireEvent.change(numero, { target: { value: '123' } })
    const colonia = screen.getByPlaceholderText(/Colonia/i)
    fireEvent.change(colonia, { target: { value: 'Centro' } })
    const cp = screen.getByPlaceholderText(/Código Postal/i)
    fireEvent.change(cp, { target: { value: '44100' } })

    // Trigger geocoding (button exists in the DOM)
    const geocodeBtn = screen.getByRole('button', { name: /Calcular coordenadas en el mapa/i })
    fireEvent.click(geocodeBtn)

    // Wait for city/state to be populated by reverse geocode
    await waitFor(() => expect(screen.getByPlaceholderText(/Ciudad/i)).toHaveValue('Guadalajara'))
    await waitFor(() => expect(screen.getByPlaceholderText(/Estado/i)).toHaveValue('Jalisco'))

    // Proceed to photos step
    const nextPhotosBtn = screen.getByRole('button', { name: /nextPhotos|Siguiente: Imagen del Negocio|Next: Business Image/i })
    fireEvent.click(nextPhotosBtn)

    await waitFor(() => {
      const files = document.querySelectorAll('input[type="file"]')
      expect(files.length).toBeGreaterThan(0)
    })
  })
})
