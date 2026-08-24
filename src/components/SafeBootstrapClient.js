    "use client"; 
    import { useEffect } from 'react';

    function SafeBootstrapClient() {
      useEffect(() => {
        let bootstrap;

        const initBootstrap = () => {
          try {
            if (typeof window !== 'undefined') {
              // Import Bootstrap
              bootstrap = require('bootstrap/dist/js/bootstrap.bundle.min.js');
              
              // Store bootstrap globally
              window.bootstrap = bootstrap;

              // Add error handling for Bootstrap's internal methods
              const addSafetyCheck = (Constructor, method) => {
                const originalMethod = Constructor.prototype[method];
                Constructor.prototype[method] = function(...args) {
                  try {
                    // Check if element exists and has classList before proceeding
                    if (this._element && this._element.classList) {
                      return originalMethod.apply(this, args);
                    } else {
                      console.warn(`Bootstrap ${Constructor.name}: Element not found or invalid for ${method}`);
                      return;
                    }
                  } catch (error) {
                    console.warn(`Bootstrap ${Constructor.name} ${method} error:`, error);
                    return;
                  }
                };
              };

              // Add safety checks to common Bootstrap methods
              if (bootstrap.Modal) {
                addSafetyCheck(bootstrap.Modal, 'toggle');
                addSafetyCheck(bootstrap.Modal, 'show');
                addSafetyCheck(bootstrap.Modal, 'hide');
                addSafetyCheck(bootstrap.Modal, '_isShown');
              }

              if (bootstrap.Dropdown) {
                addSafetyCheck(bootstrap.Dropdown, 'toggle');
                addSafetyCheck(bootstrap.Dropdown, 'show');
                addSafetyCheck(bootstrap.Dropdown, 'hide');
              }

              if (bootstrap.Collapse) {
                addSafetyCheck(bootstrap.Collapse, 'toggle');
                addSafetyCheck(bootstrap.Collapse, 'show');
                addSafetyCheck(bootstrap.Collapse, 'hide');
              }

              if (bootstrap.Offcanvas) {
                addSafetyCheck(bootstrap.Offcanvas, 'toggle');
                addSafetyCheck(bootstrap.Offcanvas, 'show');
                addSafetyCheck(bootstrap.Offcanvas, 'hide');
              }

              // Initialize components with proper delay and error handling
              setTimeout(() => {
                initializeBootstrapComponents();
              }, 200);

              // Re-initialize when new content is added (for dynamic content)
              const observer = new MutationObserver((mutations) => {
                let shouldReinit = false;
                mutations.forEach((mutation) => {
                  if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                      if (node.nodeType === 1) { // Element node
                        const hasBootstrapElements = node.querySelector && (
                          node.querySelector('[data-bs-toggle]') ||
                          node.hasAttribute && node.hasAttribute('data-bs-toggle')
                        );
                        if (hasBootstrapElements) {
                          shouldReinit = true;
                        }
                      }
                    });
                  }
                });
                
                if (shouldReinit) {
                  setTimeout(initializeBootstrapComponents, 100);
                }
              });

              observer.observe(document.body, {
                childList: true,
                subtree: true
              });

              // Store observer for cleanup
              window.bootstrapObserver = observer;
            }
          } catch (error) {
            console.error('Error initializing Bootstrap:', error);
          }
        };

        const initializeBootstrapComponents = () => {
          if (!bootstrap) return;

          // Initialize dropdowns safely
          document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(element => {
            try {
              if (element && element.classList && !bootstrap.Dropdown.getInstance(element)) {
                new bootstrap.Dropdown(element);
              }
            } catch (error) {
              console.warn('Error initializing dropdown:', error);
            }
          });

          // Initialize modals safely
          document.querySelectorAll('[data-bs-toggle="modal"]').forEach(trigger => {
            try {
              const target = trigger.getAttribute('data-bs-target') || trigger.getAttribute('href');
              if (target) {
                const modalElement = document.querySelector(target);
                if (modalElement && modalElement.classList && !bootstrap.Modal.getInstance(modalElement)) {
                  new bootstrap.Modal(modalElement);
                }
              }
            } catch (error) {
              console.warn('Error initializing modal:', error);
            }
          });

          // Initialize other Bootstrap components
          ['collapse', 'offcanvas', 'popover', 'tooltip'].forEach(component => {
            const selector = `[data-bs-toggle="${component}"]`;
            document.querySelectorAll(selector).forEach(element => {
              try {
                const Component = bootstrap[component.charAt(0).toUpperCase() + component.slice(1)];
                if (Component && element && element.classList && !Component.getInstance(element)) {
                  new Component(element);
                }
              } catch (error) {
                console.warn(`Error initializing ${component}:`, error);
              }
            });
          });
        };

        // Initialize with proper timing
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initBootstrap);
        } else {
          setTimeout(initBootstrap, 100);
        }

        return () => {
          document.removeEventListener('DOMContentLoaded', initBootstrap);
          if (window.bootstrapObserver) {
            window.bootstrapObserver.disconnect();
            delete window.bootstrapObserver;
          }
        };
      }, []);
      
      return null;
    }

    export default SafeBootstrapClient;
