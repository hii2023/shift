"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, Users, Settings } from "lucide-react";
import SchedulerView from "@/components/SchedulerView";
import StaffView from "@/components/StaffView";
import SettingsView from "@/components/SettingsView";
import LiveClock from "@/components/LiveClock";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kitchen Scheduler</h1>
          <p className="text-xs text-gray-500">Cloud Kitchen Shift Management</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <LiveClock />
        </div>
      </header>
      <main className="px-6 py-6">
        <Tabs defaultValue="scheduler">
          <TabsList className="mb-6">
            <TabsTrigger value="scheduler" className="gap-2">
              <CalendarDays className="w-4 h-4" /> Scheduler
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-2">
              <Users className="w-4 h-4" /> Staff
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" /> Kitchen Settings
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

