import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApp } from '../../context/AppContext';
import PasswordInput from '../../components/PasswordInput/PasswordInput';
import authService from '../../services/authService';
import { loginSchema } from '../../validation/authSchema';
import logo from '../../assets/logo.jpeg';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [rememberMe, setRememberMe] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const emailVal = watch('email');
  const passwordVal = watch('password');
  const isDisabled = !emailVal.trim() || !passwordVal || isLoading;

  const onSubmit = async (data) => {
    setServerError('');
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    try {
      const user = await authService.loginUser(data.email, data.password);
      if (!user) {
        setServerError('Invalid email or password.');
        setIsLoading(false);
        return;
      }
      authService.saveSession(user, rememberMe);
      setUser(user);
      navigate('/dashboard');
    } catch {
      setServerError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-header">
          {/* Clickable logo/brand → home */}
          <Link to="/" className="login-logo" aria-label="Go to SocialPilot home">
            <img src={logo} alt="SocialPilot" className="brand-logo" />
            <span className="login-logo-text">SocialPilot</span>
          </Link>
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Sign in to your SocialPilot account.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError && (
            <div className="form-alert" role="alert">{serverError}</div>
          )}

          <div className="login-form-group">
            <label htmlFor="email" className="login-label">
              Email Address <span className="login-required">*</span>
            </label>
            <input
              id="email" type="email"
              className={`login-input ${errors.email ? 'input-error' : ''}`}
              placeholder="john@company.com"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="field-error" role="alert">{errors.email.message}</p>
            )}
          </div>

          <div className="login-form-group">
            <label htmlFor="password" className="login-label">
              Password <span className="login-required">*</span>
            </label>
            <PasswordInput
              id="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              className={errors.password ? 'input-error' : ''}
              {...register('password')}
            />
            {errors.password && (
              <p className="field-error" role="alert">{errors.password.message}</p>
            )}
          </div>

          <div className="login-row-options">
            <label className="login-checkbox-label">
              <input
                id="rememberMe" type="checkbox"
                className="login-checkbox-input"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="login-checkbox-custom" />
              <span className="login-checkbox-text">Remember me</span>
            </label>
            <span className="login-forgot">Forgot Password?</span>
          </div>

          <button
            id="login-submit-btn" type="submit"
            className={`login-btn ${isDisabled ? 'login-btn--disabled' : ''}`}
            disabled={isDisabled}
          >
            {isLoading
              ? <span className="btn-spinner" aria-label="Logging in" />
              : 'Login'
            }
          </button>
        </form>

        <div className="login-footer">
          <p className="login-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="register-link">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
