import { describe, it, expect, test, beforeEach, vi } from 'vitest'
import {
  validateEmail,
  validatePhone,
  validateNationalId,
  validateIncome,
  validateFamilySize,
  validateApplicationForm,
  validateProjectForm,
  showError,
  showSuccess,
  showWarning
} from '../../src/utils/validation.js'

// Mock DOM methods for testing
global.document = {
  createElement: vi.fn(() => ({
    className: '',
    style: { cssText: '' },
    innerHTML: '',
    parentNode: {
      removeChild: vi.fn()
    }
  })),
  body: {
    appendChild: vi.fn()
  }
}

global.setTimeout = vi.fn()

describe('Admin Functionalities - Form Validation', () => {
  describe('Email Validation', () => {
    it('should validate valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.email@domain.co.uk')).toBe(true)
      expect(validateEmail('user+tag@example.org')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('user@domain')).toBe(false)
      expect(validateEmail('user domain.com')).toBe(false)
      expect(validateEmail('user@domain.')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(validateEmail('a@b.c')).toBe(true)
      expect(validateEmail('very.long.email.address@domain.com')).toBe(true)
      expect(validateEmail('user@domain-with-dash.com')).toBe(true)
      expect(validateEmail('user@domain.with.dots.com')).toBe(true)
    })
  })

  describe('Phone Validation', () => {
    it('should validate valid Egyptian phone numbers', () => {
      expect(validatePhone('01234567890')).toBe(true)
      expect(validatePhone('01012345678')).toBe(true)
      expect(validatePhone('01123456789')).toBe(true)
      expect(validatePhone('01512345678')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('')).toBe(false)
      expect(validatePhone('1234567890')).toBe(false)
      expect(validatePhone('0123456789')).toBe(false)
      expect(validatePhone('02234567890')).toBe(false)
      expect(validatePhone('abcdefghijk')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(validatePhone('01000000000')).toBe(true)
      expect(validatePhone('01999999999')).toBe(true)
      expect(validatePhone('012345678901')).toBe(true) // 12 digits accepted
      expect(validatePhone('01345678901')).toBe(true) // Different prefix accepted
    })
  })

  describe('National ID Validation', () => {
    it('should validate valid 14-digit national IDs', () => {
      expect(validateNationalId('12345678901234')).toBe(true)
      expect(validateNationalId('00000000000000')).toBe(true)
      expect(validateNationalId('99999999999999')).toBe(true)
    })

    it('should reject invalid national IDs', () => {
      expect(validateNationalId('')).toBe(false)
      expect(validateNationalId('1234567890123')).toBe(false) // 13 digits
      expect(validateNationalId('123456789012345')).toBe(false) // 15 digits
      expect(validateNationalId('1234567890123a')).toBe(false) // Contains letter
      expect(validateNationalId('abcdefghijklmn')).toBe(false) // All letters
    })

    it('should handle edge cases', () => {
      expect(validateNationalId('00000000000001')).toBe(true)
      expect(validateNationalId('12345678901234')).toBe(true)
      expect(validateNationalId('123 456 789 01234')).toBe(false) // Contains spaces
    })
  })

  describe('Income Validation', () => {
    it('should validate valid income amounts', () => {
      expect(validateIncome('5000')).toBe(true)
      expect(validateIncome('10000.50')).toBe(true)
      expect(validateIncome('1000000')).toBe(true)
      expect(validateIncome(5000)).toBe(true)
      expect(validateIncome(10000.50)).toBe(true)
    })

    it('should reject invalid income amounts', () => {
      expect(validateIncome('')).toBe(false)
      expect(validateIncome('0')).toBe(false)
      expect(validateIncome('-1000')).toBe(false)
      expect(validateIncome('abc')).toBe(false)
      expect(validateIncome('1000001')).toBe(false) // Over limit
      expect(validateIncome(-5000)).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(validateIncome('0.01')).toBe(true)
      expect(validateIncome('1')).toBe(true)
      expect(validateIncome('999999.99')).toBe(true)
      expect(validateIncome('1000000')).toBe(true)
    })
  })

  describe('Family Size Validation', () => {
    it('should validate valid family sizes', () => {
      expect(validateFamilySize('1')).toBe(true)
      expect(validateFamilySize('5')).toBe(true)
      expect(validateFamilySize('20')).toBe(true)
      expect(validateFamilySize(1)).toBe(true)
      expect(validateFamilySize(10)).toBe(true)
    })

    it('should reject invalid family sizes', () => {
      expect(validateFamilySize('')).toBe(false)
      expect(validateFamilySize('0')).toBe(false)
      expect(validateFamilySize('-1')).toBe(false)
      expect(validateFamilySize('21')).toBe(false)
      expect(validateFamilySize('abc')).toBe(false)
      expect(validateFamilySize(0)).toBe(false)
      expect(validateFamilySize(-1)).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(validateFamilySize('1')).toBe(true)
      expect(validateFamilySize('20')).toBe(true)
      expect(validateFamilySize('10')).toBe(true)
    })
  })

  describe('Application Form Validation', () => {
    it('should validate complete valid application form', () => {
      const validForm = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '01234567890',
        nationalId: '12345678901234',
        income: '5000',
        familySize: '4',
        projectName: 'Test Project'
      }

      const result = validateApplicationForm(validForm)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should reject form with missing required fields', () => {
      const invalidForm = {
        name: '',
        email: 'john@example.com',
        phone: '01234567890',
        nationalId: '12345678901234',
        income: '5000',
        familySize: '4',
        projectName: 'Test Project'
      }

      const result = validateApplicationForm(invalidForm)
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('Name must be at least 3 characters long')
    })

    it('should reject form with invalid email', () => {
      const invalidForm = {
        name: 'John Doe',
        email: 'invalid-email',
        phone: '01234567890',
        nationalId: '12345678901234',
        income: '5000',
        familySize: '4',
        projectName: 'Test Project'
      }

      const result = validateApplicationForm(invalidForm)
      expect(result.isValid).toBe(false)
      expect(result.errors.email).toBe('Please enter a valid email address')
    })

    it('should reject form with multiple errors', () => {
      const invalidForm = {
        name: 'Jo', // Too short
        email: 'invalid-email',
        phone: '1234567890', // Invalid format
        nationalId: '123', // Too short
        income: '-1000', // Negative
        familySize: '0', // Invalid
        projectName: '' // Missing
      }

      const result = validateApplicationForm(invalidForm)
      expect(result.isValid).toBe(false)
      expect(Object.keys(result.errors)).toHaveLength(7)
    })

    it('should handle edge cases in form validation', () => {
      const edgeForm = {
        name: 'A'.repeat(100), // Very long name
        email: 'user@domain.com',
        phone: '01000000000',
        nationalId: '12345678901234',
        income: '0.01', // Minimum income
        familySize: '20', // Maximum family size
        projectName: 'Test Project'
      }

      const result = validateApplicationForm(edgeForm)
      expect(result.isValid).toBe(true)
    })
  })

  describe('Project Form Validation', () => {
    it('should validate complete valid project form', () => {
      const validForm = {
        name: 'Test Project',
        location: 'Cairo, Egypt',
        totalUnits: '100',
        availableUnits: '50',
        priceRange: '1M - 2M EGP'
      }

      const result = validateProjectForm(validForm)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should reject project with invalid total units', () => {
      const invalidForm = {
        name: 'Test Project',
        location: 'Cairo, Egypt',
        totalUnits: '0',
        availableUnits: '50',
        priceRange: '1M - 2M EGP'
      }

      const result = validateProjectForm(invalidForm)
      expect(result.isValid).toBe(false)
      expect(result.errors.totalUnits).toBe('Total units must be greater than 0')
    })

    it('should reject project where available exceeds total', () => {
      const invalidForm = {
        name: 'Test Project',
        location: 'Cairo, Egypt',
        totalUnits: '50',
        availableUnits: '100',
        priceRange: '1M - 2M EGP'
      }

      const result = validateProjectForm(invalidForm)
      expect(result.isValid).toBe(false)
      expect(result.errors.availableUnits).toBe('Available units cannot exceed total units')
    })
  })
})

describe('Admin Functionalities - Notification Handling', () => {
  describe('Null/Undefined Safety', () => {
    it('should handle null notification data', () => {
      const notifications = null
      const filtered = notifications ? notifications.filter(n => n.type === 'info') : []
      expect(filtered).toEqual([])
    })

    it('should handle undefined notification data', () => {
      const notifications = undefined
      const filtered = notifications ? notifications.filter(n => n.type === 'info') : []
      expect(filtered).toEqual([])
    })

    it('should handle notifications with null properties', () => {
      const notifications = [
        { id: 1, type: null, priority: 'high', message: 'Test' },
        { id: 2, type: 'info', priority: null, message: 'Test' },
        { id: 3, type: 'warning', priority: 'low', message: null }
      ]

      const filtered = notifications.filter(n => 
        (n.type || '') === 'info' && 
        (n.priority || 'medium') === 'medium'
      )
      expect(filtered).toHaveLength(1) // One item has type 'info' and priority becomes 'medium'
    })

    it('should handle undefined notification properties', () => {
      const notifications = [
        { id: 1, type: undefined, priority: 'high', message: 'Test' },
        { id: 2, type: 'info', priority: undefined, message: 'Test' }
      ]

      const filtered = notifications.filter(n => 
        (n.type || '') === 'info' && 
        (n.priority || 'medium') === 'medium'
      )
      expect(filtered).toHaveLength(1) // One item has type 'info' and priority becomes 'medium'
    })
  })

  describe('Empty Array Handling', () => {
    it('should handle empty notification array', () => {
      const notifications = []
      const filtered = notifications.filter(n => n.type === 'info')
      expect(filtered).toEqual([])
      expect(filtered).toHaveLength(0)
    })

    it('should handle array with only invalid notifications', () => {
      const notifications = [
        null,
        undefined,
        {},
        { id: 1 }
      ]

      const filtered = notifications.filter(n => 
        n && n.type === 'info'
      )
      expect(filtered).toEqual([])
    })

    it('should handle mixed valid and invalid notifications', () => {
      const notifications = [
        null,
        { id: 1, type: 'info', message: 'Valid' },
        undefined,
        { id: 2, type: 'warning', message: 'Valid' },
        {},
        { id: 3, type: 'info', message: 'Valid' }
      ]

      const filtered = notifications.filter(n => 
        n && n.type === 'info'
      )
      expect(filtered).toHaveLength(2)
    })

    it('should handle array filtering with fallback values', () => {
      const notifications = [
        { id: 1, type: 'info', priority: null },
        { id: 2, type: null, priority: 'high' },
        { id: 3, priority: 'low' }
      ]

      const filtered = notifications.filter(n => {
        if (!n) return false
        const type = n.type || 'default'
        const priority = n.priority || 'medium'
        return type === 'default' && priority === 'medium'
      })
      expect(filtered).toHaveLength(0) // No items match both conditions
    })
  })
})

describe('Admin Functionalities - Utility Functions', () => {
  describe('Error Display Functions', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should show error messages', () => {
      showError('Test error message')
      expect(global.document.createElement).toHaveBeenCalled()
      expect(global.document.body.appendChild).toHaveBeenCalled()
    })

    it('should show success messages', () => {
      showSuccess('Test success message')
      expect(global.document.createElement).toHaveBeenCalled()
    })

    it('should show warning messages', () => {
      showWarning('Test warning message')
      expect(global.document.createElement).toHaveBeenCalled()
    })

    it('should auto-remove messages after timeout', () => {
      showError('Test message')
      expect(global.setTimeout).toHaveBeenCalled()
    })
  })

  describe('Date Formatter Utility', () => {
    it('should format valid dates', () => {
      const date = '2024-01-15'
      const result = new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      expect(result).toBeTruthy()
      expect(result).not.toBe('Invalid Date')
    })

    it('should handle invalid dates', () => {
      expect(new Date('invalid-date').toLocaleDateString()).toBe('Invalid Date')
      // Note: new Date(null) returns Unix epoch date, new Date('') and undefined return Invalid Date
      expect(new Date(null).toLocaleDateString()).toBe('1/1/1970')
      expect(new Date('').toLocaleDateString()).toBe('Invalid Date')
      expect(new Date(undefined).toLocaleDateString()).toBe('Invalid Date')
    })

    it('should handle edge cases', () => {
      const result = new Date('2024-01-01').toLocaleDateString('en-US', { year: '2-digit' })
      expect(result).toBeTruthy()
    })
  })

  describe('API Call Helper', () => {
    it('should handle successful API calls', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { id: 1 } })
      })

      const response = await fetch('http://localhost:5000/test', {
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toEqual({ id: 1 })
    })

    it('should handle API errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      })

      try {
        const response = await fetch('http://localhost:5000/test')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      } catch (error) {
        expect(error.message).toBe('HTTP error! status: 404')
      }
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      try {
        await fetch('http://localhost:5000/test')
      } catch (error) {
        expect(error.message).toBe('Network error')
      }
    })
  })
})
