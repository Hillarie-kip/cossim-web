"use client";
import React from 'react';
import { redirect } from 'next/navigation';

export default function SalesAgentOverview() {
  // Redirect to the main sales agent dashboard
  redirect('/sales/sales-agent-dashboard');
}
