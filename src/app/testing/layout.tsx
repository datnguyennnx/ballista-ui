import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <SidebarProvider>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <main className="flex-1 overflow-auto">
              <div className="flex h-16 items-center gap-2 border-b px-4">
                <SidebarTrigger />
              </div>
              <div className="p-8 w-full">
                {children}
              </div>
            </main>
          </div>
        </SidebarProvider>
  );
}
