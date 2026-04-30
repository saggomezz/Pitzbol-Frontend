/* eslint-disable */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

const EliminarNegocioModal = require('../../app/components/EliminarNegocioModal').default

describe('EliminarNegocioModal', () => {
  it('calls onConfirm with trimmed reason', () => {
    const onClose = jest.fn()
    const onConfirm = jest.fn()

    render(
      React.createElement(EliminarNegocioModal, {
        open: true,
        onClose,
        onConfirm,
      })
    )

    const textarea = screen.getByPlaceholderText(/Motivo de eliminación \(opcional\)\.\.\./i)
    fireEvent.change(textarea, { target: { value: '  Razón de prueba  ' } })

    const eliminarBtn = screen.getByRole('button', { name: /Eliminar/i })
    fireEvent.click(eliminarBtn)

    expect(onConfirm).toHaveBeenCalledWith('Razón de prueba')
  })
})
