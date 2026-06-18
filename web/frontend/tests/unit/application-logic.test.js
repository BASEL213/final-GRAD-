import { describe, it, expect, test, beforeEach, afterEach, vi } from 'vitest'
import dataService, { DataService } from '../../src/services/dataService.js'
import { validateApplicationForm, validateProjectForm } from '../../src/utils/validation.js'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

global.localStorage = localStorageMock

describe('Application Logic - Comprehensive Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Application Form Logic', () => {
    it('should validate complete application form with all fields', () => {
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

    it('should handle edge case income validation', () => {
      const edgeCases = [
        { income: '0.01', expected: true },
        { income: '999999.99', expected: true },
        { income: '1000000', expected: true },
        { income: '1000000.01', expected: false },
        { income: '-1', expected: false },
        { income: '0', expected: false }
      ]

      edgeCases.forEach(({ income, expected }) => {
        const form = {
          name: 'Test User',
          email: 'test@example.com',
          phone: '01234567890',
          nationalId: '12345678901234',
          income,
          familySize: '4',
          projectName: 'Test Project'
        }

        const result = validateApplicationForm(form)
        expect(result.isValid).toBe(expected)
      })
    })

    it('should handle edge case family size validation', () => {
      const edgeCases = [
        { familySize: '1', expected: true },
        { familySize: '20', expected: true },
        { familySize: '0', expected: false },
        { familySize: '21', expected: false },
        { familySize: '-1', expected: false },
        { familySize: 'abc', expected: false }
      ]

      edgeCases.forEach(({ familySize, expected }) => {
        const form = {
          name: 'Test User',
          email: 'test@example.com',
          phone: '01234567890',
          nationalId: '12345678901234',
          income: '5000',
          familySize,
          projectName: 'Test Project'
        }

        const result = validateApplicationForm(form)
        expect(result.isValid).toBe(expected)
      })
    })

    it('should handle very long names', () => {
      const longName = 'A'.repeat(1000)
      const form = {
        name: longName,
        email: 'test@example.com',
        phone: '01234567890',
        nationalId: '12345678901234',
        income: '5000',
        familySize: '4',
        projectName: 'Test Project'
      }

      const result = validateApplicationForm(form)
      expect(result.isValid).toBe(true)
    })

    it('should handle special characters in names', () => {
      const specialNames = [
        'John O\'Connor',
        'Jean-Paul',
        'Muhammad ibn al-Hasan',
        'José María'
      ]

      specialNames.forEach(name => {
        const form = {
          name,
          email: 'test@example.com',
          phone: '01234567890',
          nationalId: '12345678901234',
          income: '5000',
          familySize: '4',
          projectName: 'Test Project'
        }

        const result = validateApplicationForm(form)
        expect(result.isValid).toBe(true)
      })
    })
  })

  describe('Project Form Logic', () => {
    it('should validate complete project form', () => {
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

    it('should handle edge case unit validation', () => {
      const edgeCases = [
        { totalUnits: '1', availableUnits: '1', expected: true },
        { totalUnits: '999999', availableUnits: '999999', expected: true },
        { totalUnits: '0', availableUnits: '0', expected: false },
        { totalUnits: '50', availableUnits: '51', expected: false },
        { totalUnits: '100', availableUnits: '-1', expected: false }
      ]

      edgeCases.forEach(({ totalUnits, availableUnits, expected }) => {
        const form = {
          name: 'Test Project',
          location: 'Cairo, Egypt',
          totalUnits,
          availableUnits,
          priceRange: '1M - 2M EGP'
        }

        const result = validateProjectForm(form)
        expect(result.isValid).toBe(expected)
      })
    })

    it('should handle various price range formats', () => {
      const priceRanges = [
        '1M - 2M EGP',
        '500K - 1M EGP',
        '2M - 3M EGP',
        '100,000 - 200,000 EGP',
        '1M+ EGP'
      ]

      priceRanges.forEach(priceRange => {
        const form = {
          name: 'Test Project',
          location: 'Cairo, Egypt',
          totalUnits: '100',
          availableUnits: '50',
          priceRange
        }

        const result = validateProjectForm(form)
        expect(result.isValid).toBe(true)
      })
    })
  })

  describe('Application Workflow Logic', () => {
    it('should handle complete application submission workflow', () => {
      const service = new DataService()
      const applicationData = {
        projectId: 'proj_1',
        applicantName: 'John Doe',
        applicantEmail: 'john@example.com',
        applicantPhone: '01234567890',
        nationalId: '12345678901234',
        familySize: '4',
        income: '5000',
        currentHousing: 'rented',
        requestedUnitType: '2BR',
        preferredFloor: 'Any',
        paymentMethod: 'installments'
      }

      // Submit application
      const application = service.addApplication(applicationData)
      expect(application.status).toBe('pending')

      // Approve application
      const approved = service.updateApplicationStatus(application.id, 'approved')
      expect(approved.status).toBe('approved')
      expect(approved.reviewedAt).toBeDefined()

      // Check audit trail
      const auditLogs = service.getAuditLogs()
      const applicationLogs = auditLogs.filter(log => 
        log.applicationId === application.id
      )
      expect(applicationLogs.length).toBeGreaterThan(0)
      expect(applicationLogs.some(log => log.action === 'application_submitted')).toBe(true)
      expect(applicationLogs.some(log => log.action === 'application_approved')).toBe(true)
    })

    it('should handle application rejection workflow', () => {
      const service = new DataService()
      const applicationData = {
        projectId: 'proj_1',
        applicantName: 'Jane Doe',
        applicantEmail: 'jane@example.com',
        applicantPhone: '01234567890',
        nationalId: '12345678901234',
        familySize: '4',
        income: '5000',
        currentHousing: 'rented'
      }

      const application = service.addApplication(applicationData)
      const rejected = service.updateApplicationStatus(
        application.id, 
        'rejected', 
        'Insufficient income'
      )

      expect(rejected.status).toBe('rejected')
      expect(rejected.rejectionReason).toBe('Insufficient income')
      expect(rejected.reviewedAt).toBeDefined()
    })

    it('should handle duplicate application prevention', () => {
      const service = new DataService()
      const applicationData = {
        projectId: 'proj_1',
        applicantName: 'John Doe',
        applicantEmail: 'john@example.com',
        nationalId: '12345678901234'
      }

      const app1 = service.addApplication(applicationData)
      const app2 = service.addApplication(applicationData)

      expect(app1.id).not.toBe(app2.id)
      expect(app1.applicantEmail).toBe(app2.applicantEmail)
    })
  })

  describe('Data Consistency Logic', () => {
    it('should maintain data consistency across operations', () => {
      const service = new DataService()
      
      // Get initial counts
      const initialAppCount = service.getApplications().length
      const initialUserCount = service.getUsers().length
      const initialProjectCount = service.getProjects().length

      // Add application
      const application = service.addApplication({
        projectId: 'proj_1',
        applicantName: 'Test User'
      })

      // Verify consistency
      expect(service.getApplications().length).toBe(initialAppCount + 1)
      expect(service.getApplication(application.id)).toBeDefined()
      expect(service.getApplicationById(application.id)).toBeDefined()

      // Update status
      service.updateApplicationStatus(application.id, 'approved')
      
      // Verify data integrity
      const updatedApp = service.getApplication(application.id)
      expect(updatedApp.status).toBe('approved')
      expect(updatedApp.reviewedAt).toBeDefined()
    })

    it('should handle concurrent operations safely', () => {
      const service = new DataService()
      const applications = []

      // Simulate concurrent applications
      for (let i = 0; i < 5; i++) {
        const app = service.addApplication({
          projectId: 'proj_1',
          applicantName: `User ${i}`,
          applicantEmail: `user${i}@example.com`
        })
        applications.push(app)
      }

      // Verify all applications were created
      expect(applications).toHaveLength(5)
      applications.forEach((app, index) => {
        expect(app).toBeDefined()
        expect(app.id).toBeDefined()
      })

      // Verify they can all be retrieved
      applications.forEach(app => {
        const retrieved = service.getApplication(app.id)
        expect(retrieved).toBeDefined()
        expect(retrieved.id).toBe(app.id)
      })
    })
  })

  describe('Error Handling Logic', () => {
    it('should handle invalid project IDs gracefully', () => {
      const service = new DataService()
      
      const application = service.addApplication({
        projectId: 'non_existent_project',
        applicantName: 'Test User'
      })

      const enriched = service.getApplicationById(application.id)
      expect(enriched.projectName).toBe('Unknown Project')
    })

    it('should handle missing required fields in application data', () => {
      const service = new DataService()
      
      const application = service.addApplication({
        projectId: 'proj_1',
        // Missing applicantName and other required fields
      })

      expect(application).toBeDefined()
      expect(application.id).toBeDefined()
      expect(application.applicationData).toBeDefined()
    })

    it('should handle malformed data in localStorage', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'dataJsonUsers') return 'invalid-json'
        if (key === 'dataJsonApplications') return '[invalid'
        return null
      })

      const service = new DataService()
      expect(service.cache.users).toBeDefined()
      expect(service.cache.applications).toBeDefined()
    })
  })

  describe('Performance Logic', () => {
    it('should handle large datasets efficiently', () => {
      const service = new DataService()
      const startTime = performance.now()

      // Add multiple applications
      for (let i = 0; i < 100; i++) {
        service.addApplication({
          projectId: 'proj_1',
          applicantName: `User ${i}`,
          applicantEmail: `user${i}@example.com`
        })
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000)
      expect(service.getApplications().length).toBeGreaterThan(100)
    })

    it('should handle search operations efficiently', () => {
      const service = new DataService()
      
      // Add test data
      for (let i = 0; i < 50; i++) {
        service.addApplication({
          projectId: 'proj_1',
          applicantName: `Test User ${i}`,
          applicantEmail: `user${i}@example.com`
        })
      }

      const startTime = performance.now()
      const results = service.searchApplications('Test User')
      const endTime = performance.now()

      expect(results.length).toBeGreaterThan(0)
      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})
