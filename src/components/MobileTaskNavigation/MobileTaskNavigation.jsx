"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import FeatherIcon from "feather-icons-react";
import styles from "./MobileTaskNavigation.module.css";

const TASK_ITEMS = [
  { task: "deliver", countKey: "deliver", label: "Deliver", icon: "truck" },
  { task: "confirmed", countKey: "confirmed", label: "Confirmed", icon: "check-circle" },
  { task: "receive", countKey: "receive", label: "Receive", icon: "download" },
  { task: "dispatch", countKey: "dispatch", label: "Dispatch", icon: "send" },
  { task: "reverse-orders", countKey: "reversed", label: "Reverse", icon: "rotate-ccw" },
];

const emptyCounts = { deliver: 0, confirmed: 0, receive: 0, dispatch: 0, reversed: 0 };

const readStoredCounts = () => {
  if (typeof window === "undefined") return emptyCounts;
  try { return { ...emptyCounts, ...JSON.parse(window.localStorage.getItem("cossim-task-navigation-counts") || "{}") }; }
  catch { return emptyCounts; }
};

const MobileTaskNavigation = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTask = searchParams.get("task") || "deliver";
  const [taskCounts, setTaskCounts] = useState(emptyCounts);

  useEffect(() => {
    const updateCounts = (event) => setTaskCounts((current) => ({ ...current, ...(event.detail || {}) }));
    window.addEventListener("cossim:task-counts-updated", updateCounts);
    setTaskCounts(readStoredCounts());
    return () => window.removeEventListener("cossim:task-counts-updated", updateCounts);
  }, []);

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
            <span className={styles.badge} aria-label={`${taskCounts[item.countKey] || 0} available orders`}>
              {Number(taskCounts[item.countKey] || 0) > 999 ? "999+" : Number(taskCounts[item.countKey] || 0)}
            </span>
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
