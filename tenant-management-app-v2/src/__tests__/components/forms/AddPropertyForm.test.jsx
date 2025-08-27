import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AddPropertyForm from '../../../components/forms/AddPropertyForm'

describe('AddPropertyForm', () => {
  it('renders correctly', () => {
    render(<AddPropertyForm onSuccess={() => {}} onCancel={() => {}} />)
    expect(screen.getByLabelText('Property Name')).toBeInTheDocument()
  })
})
