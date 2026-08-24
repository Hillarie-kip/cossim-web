"use client"

import { useState, useEffect } from 'react';
import Select from 'react-select';

const SSRSelect = ({
  instanceId,
  styles: customStyles = {},
  menuPortalTarget,
  menuPosition,
  ...props
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generate a stable instanceId if none provided
  const stableInstanceId = instanceId || `ssr-select-${JSON.stringify(props.placeholder || 'default').replace(/[^a-zA-Z0-9]/g, '')}`;

  if (!isClient) {
    // Return a placeholder that matches the select styling during SSR
    return (
      <div className={props.className || "select"}>
        <div className="css-b62m3t-container" style={{ 
          position: 'relative',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            alignItems: 'center',
            backgroundColor: 'hsl(0, 0%, 100%)',
            border: '1px solid hsl(0, 0%, 80%)',
            borderRadius: '4px',
            cursor: 'default',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            minHeight: '38px',
            outline: '0',
            position: 'relative',
            transition: 'all 100ms',
            boxSizing: 'border-box'
          }}>
            <div style={{
              alignItems: 'center',
              display: 'flex',
              flex: '1',
              flexWrap: 'wrap',
              padding: '2px 8px',
              position: 'relative',
              overflow: 'hidden',
              boxSizing: 'border-box'
            }}>
              <div style={{
                color: 'hsl(0, 0%, 20%)',
                marginLeft: '2px',
                marginRight: '2px',
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                boxSizing: 'border-box',
                fontSize: '14px',
                fontWeight: '400'
              }}>
                {props.placeholder || 'Select...'}
              </div>
            </div>
            <div style={{
              alignItems: 'center',
              alignSelf: 'stretch',
              display: 'flex',
              flexShrink: '0',
              boxSizing: 'border-box'
            }}>
              <span style={{
                backgroundColor: 'hsl(0, 0%, 80%)',
                display: 'block',
                height: '20px',
                marginBottom: '8px',
                marginTop: '8px',
                width: '1px',
                boxSizing: 'border-box'
              }}></span>
              <div style={{
                color: 'hsl(0, 0%, 80%)',
                display: 'flex',
                padding: '8px',
                transition: 'color 150ms',
                boxSizing: 'border-box'
              }}>
                <svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                  <path d="m4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const defaultStyles = {
    option: (provided, state) => ({
      ...provided,
      color: 'black',
      backgroundColor: state.isSelected ? '#e97b3a' : state.isFocused ? '#f8f9fa' : 'white',
      ':active': {
        backgroundColor: state.isSelected ? '#e97b3a' : '#f8f9fa',
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'black',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6c757d',
    }),
    input: (provided) => ({
      ...provided,
      color: 'black',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
  };

  return <Select
    instanceId={stableInstanceId} 
    menuPortalTarget={menuPortalTarget === undefined ? document.body : menuPortalTarget}
    menuPosition={menuPosition || "fixed"}
    styles={{
      ...defaultStyles,
      ...customStyles,
    }}
    {...props} 
  />;
};

export default SSRSelect;
