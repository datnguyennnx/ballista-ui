import { ReactNode, useState } from "react";

interface PageLayoutProps {
  title: string;
  description: string;
  actionArea?: ReactNode;
  summaryArea?: ReactNode;
  mainContent: ReactNode;
  sidebarContent: ReactNode;
  mobileTabs?: {
    icon?: ReactNode;
    label: string;
    value: string;
    content: ReactNode;
  }[];
}

export function PageLayout({
  title,
  description,
  actionArea,
  summaryArea,
  mainContent,
  sidebarContent,
  mobileTabs,
}: PageLayoutProps) {
  const [activeTab, setActiveTab] = useState(mobileTabs?.[0]?.value || "");

  // Render active mobile tab content
  const renderActiveMobileTabContent = () => {
    if (!mobileTabs) return null;
    const activeTabContent = mobileTabs.find((tab) => tab.value === activeTab);
    return activeTabContent?.content;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page header with actions */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>

        {actionArea}
      </div>

      {/* Summary area (optional) - typically metric cards */}
      {summaryArea}

      {/* Main content - Desktop layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Main content area - Takes 2/3 of the screen width on md+ screens */}
        <div className="md:col-span-2">{mainContent}</div>

        {/* Sidebar content - Takes 1/3 of the screen width on md+ screens */}
        <div className="space-y-6">{sidebarContent}</div>
      </div>

      {/* Mobile view with tabs for better space usage */}
      {mobileTabs && (
        <div className="md:hidden">
          <div
            className="bg-muted mb-4 grid grid-cols-3 overflow-hidden rounded-md p-1"
            style={{ gridTemplateColumns: `repeat(${mobileTabs.length}, 1fr)` }}
          >
            {mobileTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center justify-center gap-1 rounded-sm py-1.5 text-sm font-medium ${
                  activeTab === tab.value
                    ? "bg-background shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-2">{renderActiveMobileTabContent()}</div>
        </div>
      )}
    </div>
  );
}
