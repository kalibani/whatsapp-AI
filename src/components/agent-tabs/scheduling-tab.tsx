"use client";

import { useState } from "react";
import { Calendar, Clock, Globe, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Agent } from "@/types/agent";

interface SchedulingTabProps {
  agent: Agent;
  onUpdate: (agent: Agent) => void;
}

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

export default function SchedulingTab({ agent, onUpdate }: SchedulingTabProps) {
  const [isEditing, setIsEditing] = useState(false);

  const schedule = agent.availability_schedule;
  const isAlwaysActive = schedule?.always_active ?? false;

  const formatTime = (time: string) => {
    if (!time) return "--:--";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTimezoneDisplay = (timezone: string) => {
    try {
      const now = new Date();
      const offset = new Intl.DateTimeFormat("en", {
        timeZone: timezone,
        timeZoneName: "short",
      })
        .formatToParts(now)
        .find((part) => part.type === "timeZoneName")?.value;

      return `${timezone} (${offset})`;
    } catch {
      return timezone;
    }
  };

  return (
    <div className="space-y-6">
      {/* Availability Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Availability Overview
          </CardTitle>
          <CardDescription>
            Current availability settings for your agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {isAlwaysActive ? (
                <ToggleRight className="h-6 w-6 text-green-600" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-gray-400" />
              )}
              <div>
                <div className="font-medium">
                  {isAlwaysActive ? "Always Active" : "Scheduled Hours"}
                </div>
                <div className="text-sm text-gray-600">
                  {isAlwaysActive
                    ? "Agent responds 24/7"
                    : "Agent responds only during scheduled hours"}
                </div>
              </div>
            </div>
            <Badge variant={isAlwaysActive ? "default" : "secondary"}>
              {isAlwaysActive ? "Active" : "Scheduled"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Timezone Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Timezone Settings
          </CardTitle>
          <CardDescription>
            Timezone configuration for schedule calculation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Current Timezone
              </label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {schedule?.timezone
                  ? getTimezoneDisplay(schedule.timezone)
                  : "Not set"}
              </div>
            </div>
            <Button variant="outline" size="sm">
              Change Timezone
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      {!isAlwaysActive && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Schedule
                </CardTitle>
                <CardDescription>
                  Set active hours for each day of the week
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Save Changes" : "Edit Schedule"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DAYS.map(({ key, label }) => {
                const daySchedule =
                  schedule?.days?.[key as keyof typeof schedule.days];
                const isActive = daySchedule?.active ?? false;
                const openTime = daySchedule?.open_time ?? "09:00";
                const closeTime = daySchedule?.close_time ?? "17:00";

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-20">
                        <span className="font-medium">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <ToggleRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                        )}
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    {isActive && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono">
                          {formatTime(openTime)}
                        </span>
                        <span className="text-gray-400">-</span>
                        <span className="font-mono">
                          {formatTime(closeTime)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common scheduling configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Business Hours</div>
                <div className="text-sm text-gray-600">
                  Monday-Friday, 9AM-5PM
                </div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Extended Hours</div>
                <div className="text-sm text-gray-600">
                  Monday-Saturday, 8AM-8PM
                </div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">24/7 Service</div>
                <div className="text-sm text-gray-600">Always available</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Weekend Only</div>
                <div className="text-sm text-gray-600">
                  Saturday-Sunday, 10AM-6PM
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Summary</CardTitle>
          <CardDescription>
            Overview of current availability settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {isAlwaysActive ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Agent is available 24/7</span>
              </div>
            ) : (
              <>
                {DAYS.map(({ key, label }) => {
                  const daySchedule =
                    schedule?.days?.[key as keyof typeof schedule.days];
                  const isActive = daySchedule?.active ?? false;

                  if (!isActive) return null;

                  const openTime = daySchedule?.open_time ?? "09:00";
                  const closeTime = daySchedule?.close_time ?? "17:00";

                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>
                        {label}: {formatTime(openTime)} -{" "}
                        {formatTime(closeTime)}
                      </span>
                    </div>
                  );
                })}
              </>
            )}

            <div className="flex items-center gap-2 pt-2 border-t">
              <Globe className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                Timezone: {schedule?.timezone || "Not set"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
