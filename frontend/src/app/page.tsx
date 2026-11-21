"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import ExecutiveOverview from "@/components/dashboard/ExecutiveOverview";
import CRMModule from "@/components/crm/CRMModule";
import SiteSurveysModule from "@/components/surveys/SiteSurveysModule";
import PackagesBOMModule from "@/components/packages/PackagesBOMModule";
import QuotationsModule from "@/components/quotations/QuotationsModule";
import OrdersModule from "@/components/orders/OrdersModule";
import InventoryModule from "@/components/inventory/InventoryModule";
import SerialQRModule from "@/components/serials/SerialQRModule";
import DispatchModule from "@/components/dispatch/DispatchModule";
import TechniciansModule from "@/components/technicians/TechniciansModule";
import InstallationsModule from "@/components/installations/InstallationsModule";
import WarrantyModule from "@/components/warranties/WarrantyModule";
import ServiceDeskModule from "@/components/service/ServiceDeskModule";
import SubsidyModule from "@/components/subsidies/SubsidyModule";
import FinanceModule from "@/components/finance/FinanceModule";
import BIAnalyticsModule from "@/components/analytics/BIAnalyticsModule";
import CustomerPortalModule from "@/components/portal/CustomerPortalModule";
import PublicEnquiryModule from "@/components/public/PublicEnquiryModule";
import { api } from "@/lib/api";

export default function Home() {
  const [currentTab, setCurrentTab] = useState("overview");
  const [currentRole, setCurrentRole] = useState("DIRECTOR");

  // On mount, initialize auth session with Director role
  useEffect(() => {
    const initAuth = async () => {
      try {
        await api.switchRole(currentRole);
      } catch (err) {
        console.error("Auth init:", err);
      }
    };
    initAuth();
  }, []);

  const handleRoleChange = (newRole: string) => {
    setCurrentRole(newRole);
    // Auto-navigate to relevant tab based on persona
    if (newRole === "CUSTOMER") {
      setCurrentTab("portal");
    } else if (newRole === "WAREHOUSE_MANAGER") {
      setCurrentTab("inventory");
    } else if (newRole === "FIELD_TECHNICIAN" || newRole === "INSTALLATION_MANAGER") {
      setCurrentTab("installations");
    } else if (newRole === "SURVEY_TECHNICIAN") {
      setCurrentTab("surveys");
    } else if (newRole === "SALES_EXECUTIVE") {
      setCurrentTab("crm");
    } else if (newRole === "FINANCE_EXECUTIVE") {
      setCurrentTab("finance");
    } else if (newRole === "SUPPORT_EXECUTIVE") {
      setCurrentTab("service");
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "NEW_LEAD":
        setCurrentTab("crm");
        break;
      case "SCAN_QR":
        setCurrentTab("serials");
        break;
      case "DISPATCH":
        setCurrentTab("dispatch");
        break;
      case "RECORD_PAYMENT":
        setCurrentTab("orders");
        break;
      default:
        break;
    }
  };

  const renderCurrentModule = () => {
    switch (currentTab) {
      case "overview":
        return <ExecutiveOverview onNavigateTab={setCurrentTab} />;
      case "crm":
        return <CRMModule onScheduleSurvey={() => setCurrentTab("surveys")} />;
      case "surveys":
        return <SiteSurveysModule onGenerateQuotation={() => setCurrentTab("quotations")} />;
      case "packages":
        return <PackagesBOMModule />;
      case "quotations":
        return <QuotationsModule onViewOrder={() => setCurrentTab("orders")} />;
      case "orders":
        return (
          <OrdersModule
            onDispatchOrder={() => setCurrentTab("dispatch")}
            onRecordPayment={() => setCurrentTab("orders")}
          />
        );
      case "inventory":
        return <InventoryModule />;
      case "serials":
        return <SerialQRModule />;
      case "dispatch":
        return <DispatchModule />;
      case "technicians":
        return <TechniciansModule />;
      case "installations":
        return <InstallationsModule />;
      case "warranties":
        return <WarrantyModule />;
      case "service":
        return <ServiceDeskModule />;
      case "subsidies":
        return <SubsidyModule />;
      case "finance":
        return <FinanceModule />;
      case "analytics":
        return <BIAnalyticsModule />;
      case "portal":
        return <CustomerPortalModule />;
      case "public-enquiry":
        return <PublicEnquiryModule />;
      default:
        return <ExecutiveOverview onNavigateTab={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Navbar with Role Switcher & Live Notifications */}
        <Navbar
          currentRole={currentRole}
          onRoleChange={handleRoleChange}
          onQuickAction={handleQuickAction}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          {renderCurrentModule()}
        </main>
      </div>
    </div>
  );
}
