import { useEffect, useMemo, useRef, useState } from "react";
import AsyncSelect from "react-select/async";

// Add global styles for react-select portal
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('react-select-portal-styles');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'react-select-portal-styles';
    style.textContent = `
      .react-select-portal {
        z-index: 9999 !important;
      }
      .react-select__menu {
        z-index: 9999 !important;
      }
      .react-select__menu-portal {
        z-index: 9999 !important;
      }
    `;
    document.head.appendChild(style);
  }
}

const userToOption = (user) => ({
  value: user.UserCode,
  label: `${user.FirstName} ${user.LastName} - ${user.EmailAddress || user.PhoneNumber || user.UserCode}`,
});

const AssignUserModal = ({
  show,
  onClose,
  onSubmit,
  isLoading,
  dcCode,
  users = [], // Preloaded starter list, shown before the admin searches
  onSearchUsers, // (term) => Promise<{ Data: User[] }> — server-side search as the admin types
}) => {
  const [form, setForm] = useState({
    userCode: null, // Changed to null for react-select
  });
  const [formErrors, setFormErrors] = useState({});
  const searchTimeoutRef = useRef(null);

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      // Reset form
      setForm({
        userCode: null,
      });
      setFormErrors({});
    }
  }, [show]);

  useEffect(() => () => clearTimeout(searchTimeoutRef.current), []);

  // Starter options shown before the admin types a search term
  const defaultOptions = useMemo(() => users.map(userToOption), [users]);

  // Debounced server-side search so we don't fetch the whole user table at once
  const loadOptions = (inputValue, callback) => {
    clearTimeout(searchTimeoutRef.current);

    if (!onSearchUsers) {
      const term = inputValue.toLowerCase();
      callback(
        defaultOptions.filter((option) => option.label.toLowerCase().includes(term))
      );
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await onSearchUsers(inputValue);
        callback((response?.Data || []).map(userToOption));
      } catch (error) {
        callback([]);
      }
    }, 350);
  };

  // Custom styles for react-select to match the theme
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: formErrors.userCode ? '#dc3545' : provided.borderColor,
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(255, 193, 7, 0.25)' : provided.boxShadow,
      '&:hover': {
        borderColor: state.isFocused ? '#ffc107' : provided.borderColor,
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#ffc107' : state.isFocused ? '#ffe5d0' : provided.backgroundColor,
      color: state.isSelected ? '#000' : provided.color,
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

  const validateForm = () => {
    const errors = {};

    if (!form.userCode) {
      errors.userCode = "User selection is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (selectedOption) => {
    setForm((prev) => ({
      ...prev,
      userCode: selectedOption,
    }));

    // Clear error when user selects an option
    if (formErrors.userCode) {
      setFormErrors((prev) => ({
        ...prev,
        userCode: "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const payload = {
        dcCode: dcCode,
        userCode: form.userCode?.value, // Extract value from react-select option
      };
      onSubmit(payload);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal show"
      style={{ display: "block", background: "rgba(0,0,0,0.3)", zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div
          className="modal-content"
          style={{ background: "#ffe5d0", borderRadius: 12, position: "relative", zIndex: 1051 }}
        >
          <div className="modal-header">
            <h5 className="modal-title">Assign User to Distribution Center</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={isLoading}
            ></button>
          </div>
          <div className="modal-body">
            <p style={{ color: "#a85b2a" }}>
              Select a user to assign to this distribution center.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3" style={{ position: 'relative', zIndex: 1052 }}>
                <label className="form-label">Select User *</label>
                <div style={{ position: 'relative', zIndex: 1053 }}>
                  <AsyncSelect
                    name="userCode"
                    value={form.userCode}
                    onChange={handleChange}
                    defaultOptions={defaultOptions}
                    loadOptions={loadOptions}
                    cacheOptions
                    styles={customStyles}
                    placeholder="Search by name, email or phone..."
                    isDisabled={isLoading}
                    isClearable
                    isSearchable
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    theme={(theme) => ({
                      ...theme,
                      colors: {
                        ...theme.colors,
                        primary: '#ffc107',
                        primary25: '#ffe5d0',
                        primary50: '#ffe5d0',
                      },
                    })}
                  />
                </div>
                {formErrors.userCode && (
                  <div className="invalid-feedback d-block">{formErrors.userCode}</div>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Assigning..." : "Assign User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignUserModal;
