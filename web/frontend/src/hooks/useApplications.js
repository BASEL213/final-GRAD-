import { useState, useEffect, useCallback } from 'react';

// Custom hook for applications management
export const useApplications = (params = {}) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Fallback data
  const fallbackApplications = [
    {
      _id: 'fallback-1',
      name: 'mahmoud el sayed ahmed',
      email: 'mahmoud@gamil.com',
      phone: '01289215667',
      projectName: 'new cairo',
      status: 'pending',
      createdAt: new Date('2026-04-02T20:36:16.919Z'),
      nationalId: '12345678955534',
      familySize: 4,
      income: 12000,
      currentHousing: 'I live in Alexandria with my family',
      documents: {
        nationalIdCopy: 'uploaded',
        incomeCertificate: 'uploaded',
        birthCertificate: 'uploaded'
      }
    },
    {
      _id: 'fallback-2',
      name: 'hisham ashraf',
      email: 'final@test.com',
      phone: '01000000000',
      projectName: 'new alamien',
      status: 'pending',
      createdAt: new Date('2026-04-02T20:26:21.093Z'),
      nationalId: '12345678901234',
      familySize: 3,
      income: 5000,
      currentHousing: 'I live in Alexandria with my family',
      documents: {
        nationalIdCopy: 'uploaded',
        incomeCertificate: 'uploaded',
        birthCertificate: 'uploaded'
      }
    },
    {
      _id: 'fallback-3',
      name: 'Fatma Ali',
      email: 'fatma@example.com',
      phone: '01022222222',
      projectName: 'Alexandria Coastal Towers',
      status: 'approved',
      createdAt: new Date('2026-04-02T20:22:00.446Z'),
      nationalId: '22222222222222',
      familySize: 3,
      income: 12000,
      currentHousing: 'Living with parents',
      reviewedAt: new Date('2026-04-02T20:22:50.383Z'),
      reviewedBy: 'Admin User',
      documents: {
        nationalIdCopy: 'uploaded',
        incomeCertificate: 'uploaded',
        birthCertificate: 'uploaded'
      }
    },
    {
      _id: 'fallback-4',
      name: 'Hassan Omar',
      email: 'hassan@example.com',
      phone: '01033333333',
      projectName: 'New Capital City Complex',
      status: 'rejected',
      createdAt: new Date('2026-04-02T20:21:38.192Z'),
      nationalId: '33333333333333',
      familySize: 5,
      income: 18000,
      currentHousing: 'Shared accommodation',
      rejectionReason: 'uploaded documents not completed',
      reviewedAt: new Date('2026-04-02T20:23:14.525Z'),
      reviewedBy: 'Admin User',
      documents: {
        nationalIdCopy: 'uploaded',
        incomeCertificate: 'uploaded',
        birthCertificate: 'uploaded'
      }
    },
    {
      _id: 'fallback-5',
      name: 'Test User',
      email: 'test@example.com',
      phone: '01012345678',
      projectName: 'Cairo Garden Residences',
      status: 'pending',
      createdAt: new Date('2026-04-02T20:06:31.867Z'),
      nationalId: '11111111111111',
      familySize: 4,
      income: 15000,
      currentHousing: 'Currently living in rented apartment in Cairo',
      documents: {
        nationalIdCopy: 'uploaded',
        incomeCertificate: 'uploaded',
        birthCertificate: 'uploaded'
      }
    }
  ];

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try API first
      const response = await fetch(`http://localhost:5000/api/applications`);
      
      if (!response.ok) {
        throw new Error('API not responding');
      }
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setApplications(data.data);
        setPagination({
          page: data.page || 1,
          limit: data.limit || 10,
          total: data.total || data.data.length,
          pages: data.pages || 1,
        });
      } else {
        throw new Error('No data from API');
      }
    } catch (err) {
      console.log('API failed, using fallback data:', err.message);
      // Use fallback data
      setApplications(fallbackApplications);
      setPagination({
        page: 1,
        limit: 10,
        total: fallbackApplications.length,
        pages: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Refetch function
  const refetch = useCallback(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Auto-fetch on mount and when params change
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    loading,
    error,
    pagination,
    refetch,
  };
};

// Custom hook for single application
export const useApplication = (id) => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback application data
  const fallbackApplication = {
    _id: id || 'fallback-1',
    name: 'mahmoud el sayed ahmed',
    email: 'mahmoud@gamil.com',
    phone: '01289215667',
    projectName: 'new cairo',
    status: 'pending',
    createdAt: new Date('2026-04-02T20:36:16.919Z'),
    nationalId: '12345678955534',
    familySize: 4,
    income: 12000,
    currentHousing: 'I live in Alexandria with my family',
    documents: {
      nationalIdCopy: 'uploaded',
      incomeCertificate: 'uploaded',
      birthCertificate: 'uploaded'
    }
  };

  const fetchApplication = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      
      // Try API first
      const response = await fetch(`http://localhost:5000/api/applications/${id}`);
      
      if (!response.ok) {
        throw new Error('API not responding');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setApplication(data.data);
      } else {
        throw new Error('No data from API');
      }
    } catch (err) {
      console.log('API failed, using fallback data:', err.message);
      // Use fallback data
      setApplication(fallbackApplication);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  return {
    application,
    loading,
    error,
    refetch: fetchApplication,
  };
};

// Custom hook for status updates
export const useStatusUpdate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateStatus = useCallback(async (id, statusData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await applicationsAPI.updateStatus(id, statusData);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error updating status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateStatus,
    loading,
    error,
  };
};
