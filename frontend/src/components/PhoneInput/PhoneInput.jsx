import React from 'react';
import ReactPhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './PhoneInput.css';

const PhoneInput = ({ value, onChange, placeholder, className }) => {
  return (
    <div className={`phone-input-wrapper ${className || ''}`}>
      <ReactPhoneInput
        international
        defaultCountry="IN"
        value={value}
        onChange={onChange}
        placeholder={placeholder || 'Enter phone number'}
        className="phone-input-field"
      />
    </div>
  );
};

export default PhoneInput;
