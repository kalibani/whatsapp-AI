"use client";

import { Calendar, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Agent } from "@/types/agent";

interface SchedulingTabProps {
  formData: any;
  onFormDataChange: (field: string, value: any) => void;
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

// Common timezones for selection
const TIMEZONES = [
  "Asia/Jakarta",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Australia/Sydney",
  "UTC",
];

export default function SchedulingTab({
  formData,
  onFormDataChange,
}: SchedulingTabProps) {
  const schedule = formData.availability_schedule || {};
  const isAlwaysActive = schedule.always_active ?? true;

  // Helper functions for updating schedule
  const updateSchedule = (updates: any) => {
    const newSchedule = {
      ...schedule,
      ...updates,
    };
    onFormDataChange("availability_schedule", newSchedule);
  };

  const updateDaySchedule = (day: string, updates: any) => {
    const newDays = {
      ...schedule.days,
      [day]: {
        ...schedule.days?.[day],
        ...updates,
      },
    };
    updateSchedule({ days: newDays });
  };

  const handleAlwaysActiveChange = (checked: boolean) => {
    updateSchedule({ always_active: checked });
  };

  const handleTimezoneChange = (timezone: string) => {
    updateSchedule({ timezone });
  };

  const applyQuickSchedule = (preset: string) => {
    switch (preset) {
      case "business":
        updateSchedule({
          always_active: false,
          days: {
            monday: { active: true, open_time: "09:00", close_time: "17:00" },
            tuesday: { active: true, open_time: "09:00", close_time: "17:00" },
            wednesday: {
              active: true,
              open_time: "09:00",
              close_time: "17:00",
            },
            thursday: { active: true, open_time: "09:00", close_time: "17:00" },
            friday: { active: true, open_time: "09:00", close_time: "17:00" },
            saturday: {
              active: false,
              open_time: "09:00",
              close_time: "17:00",
            },
            sunday: { active: false, open_time: "09:00", close_time: "17:00" },
          },
        });
        break;
      case "extended":
        updateSchedule({
          always_active: false,
          days: {
            monday: { active: true, open_time: "08:00", close_time: "20:00" },
            tuesday: { active: true, open_time: "08:00", close_time: "20:00" },
            wednesday: {
              active: true,
              open_time: "08:00",
              close_time: "20:00",
            },
            thursday: { active: true, open_time: "08:00", close_time: "20:00" },
            friday: { active: true, open_time: "08:00", close_time: "20:00" },
            saturday: { active: true, open_time: "08:00", close_time: "20:00" },
            sunday: { active: false, open_time: "08:00", close_time: "20:00" },
          },
        });
        break;
      case "24x7":
        updateSchedule({ always_active: true });
        break;
      case "weekend":
        updateSchedule({
          always_active: false,
          days: {
            monday: { active: false, open_time: "10:00", close_time: "18:00" },
            tuesday: { active: false, open_time: "10:00", close_time: "18:00" },
            wednesday: {
              active: false,
              open_time: "10:00",
              close_time: "18:00",
            },
            thursday: {
              active: false,
              open_time: "10:00",
              close_time: "18:00",
            },
            friday: { active: false, open_time: "10:00", close_time: "18:00" },
            saturday: { active: true, open_time: "10:00", close_time: "18:00" },
            sunday: { active: true, open_time: "10:00", close_time: "18:00" },
          },
        });
        break;
    }
  };

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
            Availability Settings
          </CardTitle>
          <CardDescription>
            Configure when your agent is active and responding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">Always Active</div>
                  <div className="text-sm text-gray-600">
                    Agent responds 24/7 regardless of schedule
                  </div>
                </div>
              </div>
              <Switch
                checked={isAlwaysActive}
                onCheckedChange={handleAlwaysActiveChange}
              />
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={isAlwaysActive ? "default" : "secondary"}>
                {isAlwaysActive ? "24/7 Active" : "Scheduled Hours"}
              </Badge>
              <span className="text-sm text-gray-600">
                {isAlwaysActive
                  ? "Agent will respond at any time"
                  : "Agent will only respond during scheduled hours"}
              </span>
            </div>
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
            All scheduled times will be based on this timezone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Timezone
              </label>
              <Select
                value={schedule?.timezone || "Asia/Jakarta"}
                onValueChange={handleTimezoneChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {getTimezoneDisplay(tz)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-600">
              Current time in selected timezone:{" "}
              <span className="font-mono">
                {new Date().toLocaleTimeString("en-US", {
                  timeZone: schedule?.timezone || "Asia/Jakarta",
                  hour12: false,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      {!isAlwaysActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Schedule
            </CardTitle>
            <CardDescription>
              Set active hours for each day of the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DAYS.map(({ key, label }) => {
                const daySchedule =
                  schedule?.days?.[key as keyof typeof schedule.days];
                const isActive = daySchedule?.active ?? true;
                const openTime = daySchedule?.open_time ?? "09:00";
                const closeTime = daySchedule?.close_time ?? "17:00";

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-24">
                        <span className="font-medium">{label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={isActive}
                          onCheckedChange={(checked: boolean) =>
                            updateDaySchedule(key, { active: checked })
                          }
                        />
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    {isActive && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Open:</label>
                          <Input
                            type="time"
                            value={openTime}
                            onChange={(e) =>
                              updateDaySchedule(key, {
                                open_time: e.target.value,
                              })
                            }
                            className="w-auto"
                          />
                        </div>
                        <span className="text-gray-400">-</span>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">
                            Close:
                          </label>
                          <Input
                            type="time"
                            value={closeTime}
                            onChange={(e) =>
                              updateDaySchedule(key, {
                                close_time: e.target.value,
                              })
                            }
                            className="w-auto"
                          />
                        </div>
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
          <CardTitle>Quick Schedule Presets</CardTitle>
          <CardDescription>
            Apply common scheduling configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => applyQuickSchedule("business")}
            >
              <div className="text-left">
                <div className="font-medium">Business Hours</div>
                <div className="text-sm text-gray-600">
                  Monday-Friday, 9AM-5PM
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => applyQuickSchedule("extended")}
            >
              <div className="text-left">
                <div className="font-medium">Extended Hours</div>
                <div className="text-sm text-gray-600">
                  Monday-Saturday, 8AM-8PM
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => applyQuickSchedule("24x7")}
            >
              <div className="text-left">
                <div className="font-medium">24/7 Service</div>
                <div className="text-sm text-gray-600">Always available</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => applyQuickSchedule("weekend")}
            >
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
