// Input Validation and Error Handling Utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^01[0-9]{9,11}$/;
  return phoneRegex.test(phone);
};

export const validateNationalId = (nationalId) => {
  const idRegex = /^[0-9]{14}$/;
  return idRegex.test(nationalId);
};

export const validateIncome = (income) => {
  const numIncome = parseFloat(income);
  return !isNaN(numIncome) && numIncome > 0 && numIncome <= 1000000;
};

export const validateFamilySize = (familySize) => {
  const numFamilySize = parseInt(familySize);
  return !isNaN(numFamilySize) && numFamilySize > 0 && numFamilySize <= 20;
};

export const validateApplicationForm = (formData) => {
  const errors = {};

  // Name validation
  if (!formData.name || formData.name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters long';
  }

  // Email validation
  if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone validation
  if (!validatePhone(formData.phone)) {
    errors.phone = 'Please enter a valid Egyptian phone number (01xxxxxxxxx)';
  }

  // National ID validation
  if (!validateNationalId(formData.nationalId)) {
    errors.nationalId = 'Please enter a valid 14-digit national ID';
  }

  // Income validation
  if (!validateIncome(formData.income)) {
    errors.income = 'Please enter a valid monthly income';
  }

  // Family size validation
  if (!validateFamilySize(formData.familySize)) {
    errors.familySize = 'Family size must be between 1 and 20';
  }

  // Project validation
  if (!formData.projectName) {
    errors.projectName = 'Please select a housing project';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateProjectForm = (formData) => {
  const errors = {};

  // Project name validation
  if (!formData.name || formData.name.trim().length < 3) {
    errors.name = 'Project name must be at least 3 characters long';
  }

  // Location validation
  if (!formData.location || formData.location.trim().length < 5) {
    errors.location = 'Location must be at least 5 characters long';
  }

  // Total units validation
  const totalUnits = parseInt(formData.totalUnits);
  if (isNaN(totalUnits) || totalUnits <= 0) {
    errors.totalUnits = 'Total units must be greater than 0';
  }

  // Available units validation
  const availableUnits = parseInt(formData.availableUnits);
  if (isNaN(availableUnits) || availableUnits < 0) {
    errors.availableUnits = 'Available units must be greater than or equal to 0';
  }

  // Available units cannot exceed total units
  if (totalUnits && availableUnits && availableUnits > totalUnits) {
    errors.availableUnits = 'Available units cannot exceed total units';
  }

  // Price range validation
  if (!formData.priceRange || formData.priceRange.trim().length < 5) {
    errors.priceRange = 'Please enter a valid price range';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const showError = (message, type = 'danger') => {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText = `
    top: 20px;
    right: 20px;
    z-index: 9999;
    min-width: 300px;
    max-width: 500px;
  `;
  alertDiv.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <div>${message}</div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  
  document.body.appendChild(alertDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.parentNode.removeChild(alertDiv);
    }
  }, 5000);
};

export const showSuccess = (message) => {
  showError(message, 'success');
};

export const showWarning = (message) => {
  showError(message, 'warning');
};
