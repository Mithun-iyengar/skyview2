import React from 'react'

export default function FormInput({ id, label, type='text', value, onChange, placeholder, error, autoFocus=false, floating=true, ...inputProps }){
  if (!floating) {
    return (
      <div className={`mb-3 auth-input auth-input-standard ${error ? 'has-error' : ''}`}>
        <label htmlFor={id} className="form-label">{label}</label>
        <input
          id={id}
          className="form-control shadow-sm auth-control"
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder || label}
          autoFocus={autoFocus}
          {...inputProps}
        />
        {error && <div className="invalid-feedback d-block">{error}</div>}
      </div>
    )
  }

  return (
    <div className={`form-floating mb-3 auth-input ${error ? 'has-error' : ''}`}>
      <input
        id={id}
        className={`form-control shadow-sm auth-control`}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder || label}
        autoFocus={autoFocus}
        {...inputProps}
      />
      <label htmlFor={id}>{label}</label>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  )
}
