import React, { useState, forwardRef } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './PasswordInput.css';

const rules = [
  { label: 'At least 8 characters',  test: (v) => v.length >= 8 },
  { label: 'One uppercase letter',    test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter',    test: (v) => /[a-z]/.test(v) },
  { label: 'One number',              test: (v) => /[0-9]/.test(v) },
  { label: 'One special character',   test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const PasswordInput = forwardRef(function PasswordInput(
  {
    id,
    name,
    value,          // NO default — undefined means uncontrolled (register() usage)
    onChange,
    onBlur,
    placeholder,
    className,
    autoComplete,
    disabled,
    required,
    showStrength = false,
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);

  // Strength checklist only makes sense when we have a live controlled value.
  // When value is undefined (register() uncontrolled mode), showStrength is
  // always false on Login anyway, so this guard is a safety net.
  const controlledValue = typeof value === 'string' ? value : '';
  const showChecklist = showStrength && controlledValue.length > 0;

  // Build value prop:
  //   - If value was explicitly passed (Controller mode) → controlled input
  //   - If value is undefined (register() mode)         → uncontrolled, RHF reads via ref
  const valueProps = value !== undefined ? { value } : {};

  return (
    <div className="password-input-wrapper">
      {/* Input + eye toggle row */}
      <div className="password-input-row">
        <input
          ref={ref}
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          {...valueProps}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`password-input ${className || ''}`}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
        />
        <button
          type="button"
          className="password-toggle-btn"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      {/* Live strength checklist — only when showStrength=true and value is a non-empty string */}
      {showChecklist && (
        <ul className="password-strength-list">
          {rules.map((rule) => {
            const passed = rule.test(controlledValue);
            return (
              <li
                key={rule.label}
                className={`strength-item ${passed ? 'strength-pass' : 'strength-fail'}`}
              >
                <span className="strength-icon">{passed ? '✓' : '✗'}</span>
                {rule.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

export default PasswordInput;
