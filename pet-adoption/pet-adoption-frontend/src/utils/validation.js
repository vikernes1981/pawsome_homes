export const validateRegistrationForm = (formData) => {
  const errors = {};

  if (!formData.username.trim()) {
    errors.username = 'Username is required';
  }
  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  }
  if (!formData.password) {
    errors.password = 'Password is required';
  }
  if (!formData.termsAccepted) {
    errors.termsAccepted = 'You must accept the terms';
  }
  if (!formData.privacyAccepted) {
    errors.privacyAccepted = 'You must accept the privacy policy';
  }

  return errors;
};