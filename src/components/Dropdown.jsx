import React from 'react';
import useDropdown from '@/hooks/useDropdown';

/**
 * Reusable Dropdown Component
 * @param {object} props - Component props
 * @param {React.ReactNode} props.trigger - The element that triggers the dropdown
 * @param {React.ReactNode} props.children - The dropdown content
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.position - Dropdown position ('left' | 'right')
 */
const Dropdown = ({ 
  trigger, 
  children, 
  className = '', 
  position = 'left' 
}) => {
  const { isOpen, toggle, dropdownRef } = useDropdown();

  return (
    <div className={`dropdown ${className}`} ref={dropdownRef}>
      <div onClick={toggle} className="dropdown-trigger">
        {trigger}
      </div>
      <div 
        className={`dropdown-menu ${position === 'right' ? 'dropdown-menu-right' : ''} ${isOpen ? 'show' : ''}`}
      >
        {children}
      </div>
    </div>
  );
};

export default Dropdown;
