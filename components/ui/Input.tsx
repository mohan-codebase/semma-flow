import React, { useId, forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, required, className = '', style, type = 'text', id, ...props }, ref) => {
    const uid = useId();
    const inputId = id || `input-${uid}`;
    const errorId = `input-error-${uid}`;

    const [focused, setFocused] = React.useState(false);

    const borderColor = error
      ? 'var(--danger)'
      : focused
      ? 'var(--border-active)'
      : 'var(--border-subtle)';

    const boxShadow = error
      ? focused
        ? '0 0 0 3px rgba(244, 63, 94, 0.15)'
        : 'none'
      : focused
      ? '0 0 0 3px var(--accent-glow)'
      : 'none';

    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              userSelect: 'none',
            }}
          >
            {label}
            {required && (
              <span style={{ color: 'var(--danger)', marginLeft: '3px' }} aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {icon && (
            <span
              style={{
                position: 'absolute',
                left: '12px',
                color: focused ? 'var(--accent-primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                transition: 'color 0.15s ease',
                zIndex: 1,
              }}
            >
              {icon}
            </span>
          )}

          <input
            {...props}
            id={inputId}
            ref={ref}
            type={type}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            style={{
              width: '100%',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: `1px solid ${borderColor}`,
              borderRadius: '10px',
              padding: icon ? '10px 14px 10px 40px' : '10px 14px',
              fontSize: '14px',
              outline: 'none',
              boxShadow,
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              opacity: props.disabled ? 0.5 : 1,
              cursor: props.disabled ? 'not-allowed' : undefined,
            }}
          />
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            style={{
              margin: 0,
              fontSize: '12px',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
