"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import FeatherIcon from "feather-icons-react";
import styles from "./MobileTaskNavigation.module.css";

const TASK_ITEMS = [
  { task: "deliver", label: "Deliver", icon: "truck" },
  { task: "receive", label: "Receive", icon: "download" },
  { task: "dispatch", label: "Dispatch", icon: "send" },
  { task: "reverse-orders", label: "Reverse", icon: "rotate-ccw" },
];

const MobileTaskNavigation = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTask = searchParams.get("task") || "deliver";

  const openMoreNavigation = () => {
    document.querySelector(".main-wrapper")?.classList.add("slide-nav");
    document.querySelector(".sidebar-overlay")?.classList.add("opened");
  };

  return (
    <nav className={styles.navigation} aria-label="Task management navigation">
      {TASK_ITEMS.map((item) => {
        const active = pathname === "/admin/packages" && currentTask === item.task;
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set("task", item.task);
        nextParams.set("taskModule", item.task === "reverse-orders" ? "reverse" : "forward");
        return (
          <NextLink
            key={item.task}
            href={`/admin/packages?${nextParams.toString()}`}
            className={`${styles.item} ${active ? styles.active : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <FeatherIcon icon={item.icon} size={20} />
            <span>{item.label}</span>
          </NextLink>
        );
      })}
      <button type="button" className={styles.item} onClick={openMoreNavigation} aria-label="Open more navigation">
        <FeatherIcon icon="more-horizontal" size={20} />
        <span>More</span>
      </button>
    </nav>
  );
};

export default MobileTaskNavigation;
