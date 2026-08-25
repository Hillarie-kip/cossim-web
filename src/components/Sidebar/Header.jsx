"use client"
import React, { useEffect, useState } from "react";
import Link from "@/components/Link";
import NextLink from "next/link";
import FeatherIcon from "feather-icons-react";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import SSRSelect from "@/components/SSRSelect";
import { all_routes } from "@/Router/all_routes";
import useLocation from "@/hooks/useLocation";
import useDropdown from "@/hooks/useDropdown";
import NavDropdown from 'react-bootstrap/NavDropdown';
import { userLogout } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { getAvailableDashboards as getAvailableDashboardsFromRoles, getDashboardPreference } from '@/utils/roleMapping';
import { getVendors } from "@/services/vendorService";
import { useGlobalFilters } from "@/contexts/GlobalFiltersContext";
import { setSelectedDC } from "@/services/dcService";
import styles from "./Header.module.css";
import { RoleType } from "@/constants/user-roles";

const globalFilterSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '36px',
    height: '36px',
    fontSize: '12px',
    borderColor: state.isFocused ? '#ff6200' : '#e4e7ec',
    boxShadow: state.isFocused ? '0 0 0 1px #ff6200' : 'none',
    '&:hover': { borderColor: '#ff6200' }
  }),
  valueContainer: (base) => ({ ...base, padding: '0 9px' }),
  indicatorsContainer: (base) => ({ ...base, height: '34px' }),
  dropdownIndicator: (base) => ({ ...base, padding: '6px' }),
  clearIndicator: (base) => ({ ...base, padding: '6px' }),
  menu: (base) => ({ ...base, fontSize: '12px', zIndex: 9999 })
};


const Header = () => {
  const route = all_routes;
  const [toggle, setToggle] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [distributionCenters, setDistributionCenters] = useState([]);
  const [loadingGlobalOptions, setLoadingGlobalOptions] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { filters, setFilter } = useGlobalFilters();

  const roleCodes = new Set((user?.AssignedRoles || []).map((role) => role.RoleTypeCode));
  const isUserAdmin = roleCodes.has(RoleType.ADMIN);
  const isVendorOnly = roleCodes.has(RoleType.VENDOR) && !isUserAdmin;
  const isDCUser = roleCodes.has(RoleType.DC_OPERATOR) || roleCodes.has(RoleType.PACKAGE_HANDLER);
  const assignedVendorCode = user?.AssignedVendor?.VendorCode
    || user?.AssignedVendor?.vendorCode
    || user?.VendorCode
    || user?.vendorCode
    || "";

  // Dashboard configuration
  const dashboards = [
    {
      id: 'admin',
      name: 'Admin Dashboard',
      route: '/admin/dashboard',
      icon: 'shield',
      roles: ['admin', 'administrator', 'finance', 'sales-manager']
    },
    {
      id: 'sales-manager',
      name: 'Sales Manager Dashboard',
      route: '/sales/sales-manager-dashboard',
      icon: 'users',
      roles: ['sales-manager']
    },
    {
      id: 'distribution-center-manager',
      name: 'DC Manager',
      route: '/dc/dc-overview',
      icon: 'package',
      roles: ['distribution-center-manager', 'dcm', 'dc-operator', 'package-handler']
    },
    {
      id: 'sales-agent',
      name: 'Sales Agent',
      route: '/sales/sales-agent-dashboard',
      icon: 'trending-up',
      roles: ['sales-agent', 'agent']
    },
    {
      id: 'vendor',
      name: 'Vendor',
      route: '/vendor/vendor-overview',
      icon: 'store',
      roles: ['vendor']
    },
    {
      id: 'rider',
      name: 'Rider',
      route: '/rider/rd-overview',
      icon: 'truck',
      roles: ['rider']
    }
  ];

  const getCurrentDashboard = () => {
    const currentPath = location?.pathname || "";
    const exactMatch = dashboards.find(dashboard =>
      currentPath.startsWith(dashboard.route) ||
      (dashboard.route === '/' && currentPath === '/')
    );
    if (exactMatch) return exactMatch;
    const firstSegment = '/' + (currentPath.split('/').filter(Boolean)[0] || '');
    return dashboards.find(dashboard => dashboard.route.startsWith(firstSegment + '/')) || dashboards[0];
  };

  // Filter available dashboards based on user role (if user role is available)
  const getAvailableDashboards = () => {
    // If no user role information is available, show all dashboards
    if (!user?.AssignedRoles || user.AssignedRoles.length === 0) {
      return dashboards;
    }

    // Use the existing role mapping utility for consistency
    const availableFromRoles = getAvailableDashboardsFromRoles(user.AssignedRoles);
    
    // Map the utility results to our dashboard format
    const availableRoutes = new Set(availableFromRoles.map(d => d.route));
    
    return dashboards.filter(dashboard => 
      availableRoutes.has(dashboard.route)
    );
  };

  const currentDashboard = getCurrentDashboard();
  const availableDashboards = getAvailableDashboards();
  const isAdminView = currentDashboard.id === 'admin' && (isUserAdmin || isDCUser || isVendorOnly);

  useEffect(() => {
    if (!isAdminView || isVendorOnly) return;
    const loadGlobalOptions = async () => {
      setLoadingGlobalOptions(true);
      const [vendorResult] = await Promise.allSettled([
        getVendors({ pageNo: 1, pageSize: 1000 }),
      ]);
      try {
        if (vendorResult.status === "fulfilled") {
          const vendorResponse = vendorResult.value;
          setVendors(Array.isArray(vendorResponse) ? vendorResponse : vendorResponse?.Data || []);
        } else {
          console.warn("Vendor options are temporarily unavailable:", vendorResult.reason?.message || vendorResult.reason);
        }
      } catch (error) {
        console.warn("Unable to prepare global filter options:", error?.message || error);
      } finally {
        setLoadingGlobalOptions(false);
      }
    };
    loadGlobalOptions();
  }, [isAdminView, isVendorOnly]);

  useEffect(() => {
    if (!isVendorOnly || !assignedVendorCode) return;
    if (filters.vendorCode !== assignedVendorCode) setFilter("vendorCode", assignedVendorCode);
    if (filters.dcCodes || filters.dcCode) setFilter("dcCodes", "");
  }, [isVendorOnly, assignedVendorCode, filters.vendorCode, filters.dcCode, filters.dcCodes]);

  useEffect(() => {
    const assignedDCs = Array.isArray(user?.AssignedDistributionCenter) ? user.AssignedDistributionCenter : [];
    setDistributionCenters(assignedDCs);
    if (isVendorOnly || !assignedDCs.length) {
      if (filters.dcCodes || filters.dcCode) setFilter("dcCodes", "");
      return;
    }
    const selectedCodes = String(filters.dcCodes || filters.dcCode || "").split(",").filter(Boolean);
    const assignedCodes = assignedDCs.map((dc) => dc.DCCode || dc.dcCode).filter(Boolean);
    if (selectedCodes.includes("__ALL__")) {
      if (filters.dcCodes !== "__ALL__") setFilter("dcCodes", "__ALL__");
      setSelectedDC(assignedCodes[0] || "");
      return;
    }
    if (selectedCodes[0]?.startsWith("__ALL_EXCEPT__:")) {
      const excluded = new Set(selectedCodes[0].slice("__ALL_EXCEPT__:".length).split("|").filter(Boolean));
      const included = assignedCodes.filter((code) => !excluded.has(code));
      setSelectedDC(included[0] || "");
      return;
    }
    const validCodes = selectedCodes.filter((code) => assignedCodes.includes(code));
    const defaultDCCode = assignedDCs[0].DCCode || assignedDCs[0].dcCode || "";
    const selectedDCCodes = (validCodes.length ? validCodes : [defaultDCCode]).filter(Boolean);
    const serializedCodes = selectedDCCodes.join(",");
    if (serializedCodes !== filters.dcCodes) setFilter("dcCodes", serializedCodes);
    if (selectedDCCodes[0]) setSelectedDC(selectedDCCodes[0]);
  }, [user?.AssignedDistributionCenter, filters.dcCode, filters.dcCodes, isVendorOnly]);

  const getLogoRoute = () => {
    try {
      // If user is on a specific dashboard, link to that dashboard for consistency
      if (currentDashboard && currentDashboard.route !== '/') {
        return currentDashboard.route;
      }

      // If user has roles, get their primary dashboard
      if (user?.AssignedRoles && user.AssignedRoles.length > 0) {
        const availableFromRoles = getAvailableDashboardsFromRoles(user.AssignedRoles);
        
        if (availableFromRoles.length === 1) {
          // Single dashboard available, use that
          return availableFromRoles[0].route;
        } else if (availableFromRoles.length > 1) {
          // Multiple dashboards, check for stored preference
          const storedPreference = getDashboardPreference();
          if (storedPreference && availableFromRoles.some(d => d.route === storedPreference)) {
            return storedPreference;
          }
          
          // No preference, use the first available dashboard
          return availableFromRoles[0].route;
        }
      }

      // Fallback to admin dashboard if no specific context
      return '/admin/dashboard';
    } catch (error) {
      console.error('Error determining logo route:', error);
      // Safe fallback
      return '/admin/dashboard';
    }
  };

  const logoRoute = getLogoRoute();

  // Get the appropriate role display based on current dashboard context
  const getCurrentRoleDisplay = () => {
    try {
      if (!user?.AssignedRoles || user.AssignedRoles.length === 0) {
        return "Test Role";
      }

      // If user has only one role, show that
      if (user.AssignedRoles.length === 1) {
        return user.AssignedRoles[0]?.RoleTypeName || "Test Role";
      }

      // If user has multiple roles, determine based on current dashboard
      if (currentDashboard && currentDashboard.id !== 'admin') {
        // Map dashboard to role type codes for accurate matching
        const dashboardToRoleMap = {
          'sales-agent': ['R-004'], // Sales Agent
          'distribution-center-manager': ['R-005', 'R-007'], // DC Operator, Package Handler
          'vendor': ['R-008'], // Vendor
          'rider': ['R-006'], // Rider
        };

        const expectedRoleCodes = dashboardToRoleMap[currentDashboard.id];
        if (expectedRoleCodes) {
          // Find the role that matches the current dashboard
          const matchingRole = user.AssignedRoles.find(role => 
            expectedRoleCodes.includes(role.RoleTypeCode)
          );
          if (matchingRole) {
            return matchingRole.RoleTypeName;
          }
        }
      }

      // For admin dashboard or no specific match, show the highest priority role
      // Priority: Admin > Finance > Sales Manager > others
      const rolePriority = ['R-001', 'R-002', 'R-003', 'R-005', 'R-004', 'R-008', 'R-006', 'R-007'];
      for (const roleCode of rolePriority) {
        const role = user.AssignedRoles.find(r => r.RoleTypeCode === roleCode);
        if (role) {
          return role.RoleTypeName;
        }
      }

      // Fallback to first role
      return user.AssignedRoles[0]?.RoleTypeName || "Test Role";
    } catch (error) {
      console.error('Error determining current role display:', error);
      return user?.AssignedRoles?.[0]?.RoleTypeName || "Test Role";
    }
  };

  const currentRoleDisplay = getCurrentRoleDisplay();

  const userDropdown = useDropdown();
  const mobileDropdown = useDropdown();

  // Close both dropdowns on any route change (covers NextLink navigation)
  useEffect(() => {
    userDropdown.close();
    mobileDropdown.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.pathname]);

  const isElementVisible = (element) => {
    return element.offsetWidth > 0 || element.offsetHeight > 0;
  };

  const slideDownSubmenu = () => {
    const subdropPlusUl = document.getElementsByClassName("subdrop");
    for (const subdrop of subdropPlusUl) {
      const submenu = subdrop.nextElementSibling;
      if (submenu && submenu.tagName.toLowerCase() === "ul") {
        submenu.style.display = "block";
      }
    }
  };

  const slideUpSubmenu = () => {
    const subdropPlusUl = document.getElementsByClassName("subdrop");
    for (const subdrop of subdropPlusUl) {
      const submenu = subdrop.nextElementSibling;
      if (submenu && submenu.tagName.toLowerCase() === "ul") {
        submenu.style.display = "none";
      }
    }
  };

  const handleLogout = async (event) => {
    try {
      event.preventDefault();
      await userLogout();
      window.location.href = "/signin";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const handleMouseover = (e) => {
      e.stopPropagation();

      const body = document.body;
      const toggleBtn = document.getElementById("toggle_btn");

      if (
        body.classList.contains("mini-sidebar") &&
        isElementVisible(toggleBtn)
      ) {
        const target = e.target.closest(".sidebar, .header-left");

        if (target) {
          body.classList.add("expand-menu");
          slideDownSubmenu();
        } else {
          body.classList.remove("expand-menu");
          slideUpSubmenu();
        }

        e.preventDefault();
      }
    };

    document.addEventListener("mouseover", handleMouseover);

    return () => {
      document.removeEventListener("mouseover", handleMouseover);
    };
  }, []); // Empty dependency array ensures that the effect runs only once on mount

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);
  const handlesidebar = () => {
    document.body.classList.toggle("mini-sidebar");
    setToggle((current) => !current);
  };
  const expandMenu = () => {
    document.body.classList.remove("expand-menu");
  };
  const expandMenuOpen = () => {
    document.body.classList.add("expand-menu");
  };
  const sidebarOverlay = () => {
    document?.querySelector(".main-wrapper")?.classList?.toggle("slide-nav");
    document?.querySelector(".sidebar-overlay")?.classList?.toggle("opened");
    document?.querySelector("html")?.classList?.toggle("menu-opened");
  };

  let pathname = location?.pathname || "";


  if (
    typeof window !== "undefined" &&
    window.location.pathname === "/"
  ) {
    return "";
  }

  const toggleFullscreen = (elem) => {
    elem = elem || document.documentElement;
    if (
      !document.fullscreenElement &&
      !document.mozFullScreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement
    ) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  const assignedHeaderDCCodes = distributionCenters.map((dc) => dc.DCCode || dc.dcCode).filter(Boolean);
  const rawDCFilter = String(filters.dcCodes || filters.dcCode || "");
  const excludedHeaderDCCodes = rawDCFilter.startsWith("__ALL_EXCEPT__:")
    ? new Set(rawDCFilter.slice("__ALL_EXCEPT__:".length).split("|").filter(Boolean))
    : null;
  const selectedHeaderDCCodes = excludedHeaderDCCodes
    ? assignedHeaderDCCodes.filter((code) => !excludedHeaderDCCodes.has(code))
    : rawDCFilter.split(",").filter(Boolean);

  return (
    <div className="header">
      {/* Logo */}
      <div
        className={`header-left ${toggle ? "" : "active"}`}
        onMouseLeave={expandMenu}
        onMouseOver={expandMenuOpen}
      >
        <Link to={logoRoute} className="logo logo-normal">
          <span className="logo-icon" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            <ImageWithBasePath
              src="assets/logo/logo.png"
              alt="Logo"
              width={40}
              height={40}
            />
          </span>
        </Link>
        <Link to={logoRoute} className="logo logo-white">
          <span className="logo-icon" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            <ImageWithBasePath
              src="assets/logo/logo.png"
              alt="Logo"
              width={40}
              height={40}
            />
          </span>
        </Link>
        <Link to={logoRoute} className="logo-small">
          <span className="logo-icon" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            <ImageWithBasePath
              src="assets/logo/logo.png"
              alt="Logo"
              width={40}
              height={40}
            />
          </span>
        </Link>
        <Link
          id="toggle_btn"
          to="#"
          style={{
            display: pathname.includes("tasks")
              ? "none"
              : pathname.includes("compose")
                ? "none"
                : "",
          }}
          onClick={handlesidebar}
        >
          <FeatherIcon icon="chevrons-left" className="feather-16" />
        </Link>
      </div>
      {/* /Logo */}
      <Link
        id="mobile_btn"
        className="mobile_btn"
        to="#"
        onClick={sidebarOverlay}
      >
        <span className="bar-icon">
          <span />
          <span />
          <span />
        </span>
      </Link>
      {/* Header Menu */}
      <ul className="nav user-menu">
        {isAdminView && (
          <li className={`nav-item d-none d-lg-flex ${styles.globalFilters}`}>
            <label className={styles.dateFilter} title="Start date">
              <FeatherIcon icon="calendar" />
              <input type="date" value={filters.startDate} max={filters.endDate} onChange={(event) => setFilter("startDate", event.target.value)} aria-label="Start date" />
            </label>
            <span className={styles.dateSeparator}>to</span>
            <label className={styles.dateFilter} title="End date">
              <input type="date" value={filters.endDate} min={filters.startDate} onChange={(event) => setFilter("endDate", event.target.value)} aria-label="End date" />
            </label>
            {!isVendorOnly && <SSRSelect
              instanceId="header-vendor-filter"
              className={styles.globalFilterSelect}
              aria-label="Vendor"
              options={vendors.map((vendor) => {
                const code = vendor.VendorCode || vendor.vendorCode;
                return { value: code, label: vendor.VendorName || vendor.vendorName || code };
              })}
              value={filters.vendorCode ? (() => {
                const vendor = vendors.find((item) => (item.VendorCode || item.vendorCode) === filters.vendorCode);
                return vendor ? { value: filters.vendorCode, label: vendor.VendorName || vendor.vendorName || filters.vendorCode } : null;
              })() : null}
              onChange={(selected) => setFilter("vendorCode", selected?.value || "")}
              placeholder="All vendors"
              isDisabled={loadingGlobalOptions}
              isLoading={loadingGlobalOptions}
              isClearable
              isSearchable
              noOptionsMessage={() => "No vendors found"}
              styles={globalFilterSelectStyles}
            />}
            {!isVendorOnly && <SSRSelect
              instanceId="header-dc-filter"
              className={`${styles.globalFilterSelect} ${styles.globalDCFilterSelect}`}
              aria-label="Distribution center"
              options={[
                { value: "__ALL__", label: "Select all sorting centres" },
                ...distributionCenters.map((dc) => {
                  const code = dc.DCCode || dc.dcCode;
                  return { value: code, label: dc.DCName || dc.dcName || code };
                }),
              ]}
              value={selectedHeaderDCCodes.map((code) => {
                if (code === "__ALL__") return { value: "__ALL__", label: "All distribution centres" };
                const dc = distributionCenters.find((item) => (item.DCCode || item.dcCode) === code);
                return { value: code, label: dc?.DCName || dc?.dcName || code };
              })}
              onChange={(selected) => {
                const selectedOptions = selected || [];
                const selectAll = selectedOptions.some((option) => option.value === "__ALL__");
                const selectedCodes = selectAll
                  ? ["__ALL__"]
                  : selectedOptions.map((option) => option.value).filter((value) => value !== "__ALL__");
                const assignedCodes = distributionCenters.map((dc) => dc.DCCode || dc.dcCode).filter(Boolean);
                const selectedSet = new Set(selectedCodes);
                const excludedCodes = assignedCodes.filter((code) => !selectedSet.has(code));
                const dcCodes = selectAll
                  ? "__ALL__"
                  : selectedCodes.length > assignedCodes.length / 2
                    ? `__ALL_EXCEPT__:${excludedCodes.join("|")}`
                    : selectedCodes.join(",");
                setFilter("dcCodes", dcCodes);
                if (selectAll) setSelectedDC(assignedCodes[0] || "");
                else if (selectedCodes[0]) setSelectedDC(selectedCodes[0]);
              }}
              placeholder={rawDCFilter === "__ALL__"
                ? "All distribution centres"
                : selectedHeaderDCCodes.length > 1
                ? `${selectedHeaderDCCodes.length} DCs selected`
                : "Select distribution centers"}
              controlShouldRenderValue={selectedHeaderDCCodes.length <= 1}
              isDisabled={loadingGlobalOptions}
              isLoading={loadingGlobalOptions}
              isMulti
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              isClearable
              isSearchable
              noOptionsMessage={() => "No distribution centers found"}
              styles={globalFilterSelectStyles}
            />}
          </li>
        )}
        {/* Search */}
        <li className="nav-item nav-searchinputs">
          
        </li>
        {/* /Search */}

        

        {/* /Flag */}
        <li className="nav-item nav-item-box">
          <Link
            to="#"
            id="btnFullscreen"
            onClick={() => toggleFullscreen()}
            className={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
          >
            {/* <i data-feather="maximize" /> */}
            <FeatherIcon icon="maximize" />
          </Link>
        </li>

        {/* /Notifications */}
        <li className="nav-item nav-item-box">
          <Link to="/general-settings">
            {/* <i data-feather="settings" /> */}
            <FeatherIcon icon="settings" />
          </Link>
        </li>

        {/* User Menu */}
        <li className="nav-item nav-item-box">
          <NavDropdown
            title={
              <span className="user-info">
                <span className="user-letter">
                  <ImageWithBasePath
                    src="assets/img/profiles/avator1.jpg"
                    alt="img"
                    className="img-fluid"
                  />
                </span>
                <span className="user-detail">
                  <span className="user-name">{`${user.FirstName || "Test"} ${user.LastName || "User"}`}</span>
                  <span className="user-role">{currentRoleDisplay}</span>
                </span>
              </span>
            }
            id="user-nav-dropdown"
            className="nav-item main-drop userset"
            show={userDropdown.isOpen}
            onToggle={userDropdown.toggle}
            ref={userDropdown.dropdownRef}
          >
            <div className="profilename" style={{ maxHeight: "calc(100vh - 80px)", overflowY: "auto" }}>
              <div className="profileset">
                <span className="user-img">
                  <ImageWithBasePath
                    src="assets/img/profiles/avator1.jpg"
                    alt="img"
                  />
                  <span className="status online" />
                </span>
                <div className="profilesets">
                  <h6>{`${user.FirstName || "Test"} ${user.LastName || "User"}`}</h6>
                  <h5>{currentRoleDisplay}</h5>
                </div>
              </div>
              <hr className="m-0" />
              <NavDropdown.Item as={Link} to={route.route} onClick={userDropdown.close}>
                <i className="me-2" data-feather="user" /> My Profile
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to={route.generalsettings} onClick={userDropdown.close}>
                <i className="me-2" data-feather="settings" />
                Settings
              </NavDropdown.Item>
              <hr className="m-0" />

              {/* Dashboard Switcher */}
              <div className={styles.dashboardSwitcher}>
                <h6 className={`dropdown-header ${styles.dropdownHeader}`}>
                  <i className="me-2" data-feather="layout" />
                  Switch Dashboard
                </h6>
                {availableDashboards.map((dashboard) => (
                  <NavDropdown.Item
                    key={dashboard.id}
                    as={Link}
                    to={dashboard.route}
                    onClick={userDropdown.close}
                    className={`${styles.dashboardItem} ${currentDashboard.id === dashboard.id ? styles.active : ''}`}
                  >
                    <i className={`me-2`} data-feather={dashboard.icon} />
                    {dashboard.name}
                    {currentDashboard.id === dashboard.id && (
                      <i className="ms-auto" data-feather="check" />
                    )}
                  </NavDropdown.Item>
                ))}
              </div>
              <hr className="m-0" />
              <NavDropdown.Item as={Link} className="logout pb-0" onClick={(e) => { userDropdown.close(); handleLogout(e); }}>
                <ImageWithBasePath
                  src="assets/img/icons/log-out.svg"
                  alt="img"
                  className="me-2"
                />
                Logout
              </NavDropdown.Item>
            </div>
          </NavDropdown>
          {/* User Menu */}
        </li>
      </ul>
      {/* /Header Menu */}

      {/* Mobile Menu */}
      <div className="dropdown mobile-user-menu" ref={mobileDropdown.dropdownRef}>
        {/* Trigger: orange initial avatar */}
        <button
          className={styles.mobileTriggerBtn}
          onClick={mobileDropdown.toggle}
          aria-expanded={mobileDropdown.isOpen}
          type="button"
        >
          {(user.FirstName?.[0] || "U").toUpperCase()}
        </button>

        <div className={styles.mobileDropdown} style={{ display: mobileDropdown.isOpen ? 'flex' : 'none' }}>

          {/* ── User info header (row layout: avatar left, info right) ── */}
          <div className={styles.mobileUserHeader}>
            <div className={styles.mobileAvatar}>
              {(user.FirstName?.[0] || "U").toUpperCase()}
            </div>
            <div className={styles.mobileUserInfo}>
              <div className={styles.mobileUserName}>
                {`${user.FirstName || "Test"} ${user.LastName || "User"}`}
              </div>
              {user.EmailAddress && (
                <div className={styles.mobileUserEmail}>{user.EmailAddress}</div>
              )}
            </div>
            <button
              className={styles.mobileCloseBtn}
              onClick={mobileDropdown.close}
              type="button"
              aria-label="Close menu"
            >
              <FeatherIcon icon="x" size={18} />
            </button>
          </div>

          {/* ── Scrollable content (everything below the pinned header) ── */}
          <div className={styles.mobileScrollContent}>

          {/* ── Profile & Settings ── */}
          <div className={styles.menuSection}>
            <NextLink href="/profile" className={styles.menuItem} onClick={mobileDropdown.close}>
              <span className={styles.menuIcon}><FeatherIcon icon="user" size={16} /></span>
              <span className={styles.menuItemBody}>
                <span className={styles.menuItemTitle}>My Profile</span>
                <span className={styles.menuItemSub}>View and manage your profile</span>
              </span>
            </NextLink>
            <NextLink href="/general-settings" className={styles.menuItem} onClick={mobileDropdown.close}>
              <span className={styles.menuIcon}><FeatherIcon icon="settings" size={16} /></span>
              <span className={styles.menuItemBody}>
                <span className={styles.menuItemTitle}>Settings</span>
                <span className={styles.menuItemSub}>Manage your preferences</span>
              </span>
            </NextLink>
          </div>

          {/* ── Switch Dashboard ── */}
          {availableDashboards.length > 1 && (
            <div className={styles.menuSection}>
              <div className={styles.sectionLabel}>Switch Dashboard</div>
              {availableDashboards.map((dashboard) => (
                <NextLink
                  key={dashboard.id}
                  href={dashboard.route}
                  onClick={mobileDropdown.close}
                  className={`${styles.switchItem} ${currentDashboard.id === dashboard.id ? styles.switchItemActive : ''}`}
                >
                  <span className={`${styles.switchIcon} ${currentDashboard.id === dashboard.id ? styles.switchIconActive : ''}`}>
                    <FeatherIcon icon={dashboard.icon} size={15} />
                  </span>
                  <span className={styles.switchItemText}>{dashboard.name}</span>
                  {currentDashboard.id === dashboard.id && (
                    <FeatherIcon icon="check" size={13} className={styles.switchCheck} />
                  )}
                </NextLink>
              ))}
            </div>
          )}

          {/* ── Logout ── */}
          <div className={styles.menuSection}>
            <button className={`${styles.menuItem} ${styles.menuItemLogout}`} onClick={(e) => { mobileDropdown.close(); handleLogout(e); }} type="button">
              <span className={`${styles.menuIcon} ${styles.menuIconLogout}`}>
                <FeatherIcon icon="log-out" size={16} />
              </span>
              <span className={styles.menuItemBody}>
                <span className={styles.menuItemTitle}>Logout</span>
                <span className={styles.menuItemSub}>Sign out of your account</span>
              </span>
            </button>
          </div>

          </div>{/* end mobileScrollContent */}
        </div>
      </div>
      {/* /Mobile Menu */}
    </div>
  );
};

export default Header;
