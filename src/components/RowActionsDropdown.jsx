"use client";

import React from "react";
import { Dropdown } from "antd";
import Link from "@/components/Link";

const renderLabel = (item) => {
  const content = (
    <>
      {item.icon && <i className={`${item.icon} me-2`} />}
      {item.label}
    </>
  );

  return item.href ? <Link to={item.href}>{content}</Link> : content;
};

const buildMenuItems = (items = []) =>
  items.filter(Boolean).map((item, index) => {
    if (item.divider) {
      return { type: "divider", key: `divider-${index}` };
    }

    return {
      key: item.key || `action-${index}`,
      label: renderLabel(item),
      disabled: item.disabled,
      danger: item.danger,
      onClick: item.onClick ? () => item.onClick(item) : undefined,
    };
  });

/**
 * Row actions menu for table cells. Built on antd's Dropdown so the menu
 * portals to document.body and is never clipped by a scrollable table
 * ancestor (unlike react-bootstrap's Dropdown, which renders in place).
 */
const RowActionsDropdown = ({
  id,
  items,
  label = "Actions",
  variant = "outline-primary",
  size = "sm",
  placement = "bottomRight",
  disabled = false,
}) => (
  <Dropdown
    menu={{ items: buildMenuItems(items) }}
    trigger={["click"]}
    placement={placement}
    disabled={disabled}
  >
    <button
      type="button"
      id={id}
      className={`btn btn-${size} btn-${variant} dropdown-toggle`}
    >
      {label}
    </button>
  </Dropdown>
);

export default RowActionsDropdown;
