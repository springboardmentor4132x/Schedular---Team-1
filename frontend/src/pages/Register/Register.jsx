import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PhoneInput from '../../components/PhoneInput/PhoneInput';
import PasswordInput from '../../components/PasswordInput/PasswordInput';
import authService from '../../services/authService';
import { registerSchema } from '../../validation/authSchema';
import logo from '../../assets/logo.jpeg';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '', email: '', phone: '', country: '',
      orgName: '', role: '', password: '', confirmPassword: '', terms: false,
    },
    mode: 'onTouched',
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const agreed = watch('terms');

  const onSubmit = async (data) => {
    setServerError('');
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    try {
      await authService.registerUser({
        fullName: data.fullName, email: data.email,
        phone: data.phone, country: data.country,
        orgName: data.orgName || '', role: data.role, password: data.password,
      });
      navigate('/login');
    } catch (err) {
      if (err.message === 'EMAIL_EXISTS') {
        setServerError('Email already registered. Please use a different email or log in.');
      } else if (err.message === 'PHONE_EXISTS') {
        setServerError('Phone number already registered. Please use a different number.');
      } else {
        setServerError('Something went wrong. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">

        <div className="register-header">
          {/* Clickable logo/brand → home */}
          <Link to="/" className="register-logo" aria-label="Go to SocialPilot home">
            <img src={logo} alt="SocialPilot" className="brand-logo" />
            <span className="logo-text">SocialPilot</span>
          </Link>
          <h1 className="register-title">Create your account</h1>
          <p className="register-subtitle">Join SocialPilot to manage your social media accounts.</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError && (
            <div className="form-alert" role="alert">{serverError}</div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">Full Name <span className="required">*</span></label>
              <input id="fullName" type="text"
                className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                placeholder="John Doe" autoComplete="name" {...register('fullName')} />
              {errors.fullName && <p className="field-error" role="alert">{errors.fullName.message}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address <span className="required">*</span></label>
              <input id="email" type="email"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="john@company.com" autoComplete="email" {...register('email')} />
              {errors.email && <p className="field-error" role="alert">{errors.email.message}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number <span className="required">*</span></label>
              <Controller name="phone" control={control}
                render={({ field }) => (
                  <PhoneInput value={field.value} onChange={field.onChange}
                    placeholder="Enter phone number"
                    className={errors.phone ? 'input-error' : ''} />
                )} />
              {errors.phone && <p className="field-error" role="alert">{errors.phone.message}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="country" className="form-label">Country <span className="required">*</span></label>
              <select id="country"
                className={`form-select ${errors.country ? 'input-error' : ''}`}
                {...register('country')}>
                <option value="">Select your country</option>
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
              </select>
              {errors.country && <p className="field-error" role="alert">{errors.country.message}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="orgName" className="form-label">Organisation Name <span className="optional-tag">(Optional)</span></label>
              <input id="orgName" type="text" className="form-input"
                placeholder="Acme Inc." autoComplete="organization" {...register('orgName')} />
            </div>
            <div className="form-group">
              <label htmlFor="role" className="form-label">Role <span className="required">*</span></label>
              <select id="role"
                className={`form-select ${errors.role ? 'input-error' : ''}`}
                {...register('role')}>
                <option value="">Select your role</option>
                <option value="content_creator">Content Creator</option>
                <option value="marketing_team">Marketing Team</option>
                <option value="business_user">Business User</option>
                <option value="administrator">Administrator</option>
              </select>
              {errors.role && <p className="field-error" role="alert">{errors.role.message}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password <span className="required">*</span></label>
              <Controller name="password" control={control}
                render={({ field }) => (
                  <PasswordInput id="password"
                    value={field.value} onChange={field.onChange}
                    onBlur={field.onBlur} ref={field.ref}
                    placeholder="Create a strong password"
                    autoComplete="new-password" showStrength
                    className={errors.password ? 'input-error' : ''} />
                )} />
              {errors.password && <p className="field-error" role="alert">{errors.password.message}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password <span className="required">*</span></label>
              <Controller name="confirmPassword" control={control}
                render={({ field }) => (
                  <PasswordInput id="confirmPassword"
                    value={field.value} onChange={field.onChange}
                    onBlur={field.onBlur} ref={field.ref}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className={errors.confirmPassword ? 'input-error' : ''} />
                )} />
              {errors.confirmPassword && <p className="field-error" role="alert">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div className="form-group terms-group">
            <label className="checkbox-label">
              <input id="terms" type="checkbox" className="checkbox-input" {...register('terms')} />
              <span className="checkbox-custom" />
              <span className="checkbox-text">
                I agree to the{' '}
                <a href="#terms" className="terms-link">Terms &amp; Conditions</a>
                {' '}and{' '}
                <a href="#privacy" className="terms-link">Privacy Policy</a>.
              </span>
            </label>
            {errors.terms && <p className="field-error" role="alert">{errors.terms.message}</p>}
          </div>

          <button id="register-submit-btn" type="submit"
            className={`register-btn ${(!agreed || isLoading) ? 'register-btn--disabled' : ''}`}
            disabled={!agreed || isLoading}>
            {isLoading
              ? <span className="btn-spinner" aria-label="Creating account" />
              : 'Create Account'}
          </button>
        </form>

        <div className="register-footer">
          <p className="register-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="login-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
