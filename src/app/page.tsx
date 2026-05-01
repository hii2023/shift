"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, Users, Settings } from "lucide-react";
import SchedulerView from "@/components/SchedulerView";
import StaffView from "@/components/StaffView";
import SettingsView from "@/components/SettingsView";
import LiveClock from "@/components/LiveClock";
import SyncStatus from "@/components/SyncStatus";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <CalendarDays className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-gray-900 leading-tight">Kitchen Scheduler</h1>
          <p className="text-xs text-gray-500 hidden sm:block">Cloud Kitchen Shift Management</p>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
          <SyncStatus />
          <LiveClock />
        </div>
      </header>
      <main className="px-3 sm:px-6 py-4 sm:py-6">
        <Tabs defaultValue="scheduler">
          <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto">
            <TabsTrigger value="scheduler" className="flex-1 sm:flex-none gap-1.5">
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Scheduler</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex-1 sm:flex-none gap-1.5">
              <Users className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Staff</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 sm:flex-none gap-1.5">
              <Settings className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="scheduler"><SchedulerView /></TabsContent>
          <TabsContent value="staff"><StaffView /></TabsContent>
          <TabsContent value="settings"><SettingsView /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
