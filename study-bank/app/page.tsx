"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { title } from "@/components/primitives";
import type { Worklog, WorklogEntry } from "@/lib/types";
import { REDEMPTION_MULTIPLIER } from "@/lib/types";

export default function Home() {
  const [worklog, setWorklog] = useState<Worklog | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Timer states - using timestamps instead of seconds counter
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Redeem modal states
  const [redeemHours, setRedeemHours] = useState("");
  const [redeemDescription, setRedeemDescription] = useState("");

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedTimerState = localStorage.getItem("timerState");
    if (savedTimerState) {
      try {
        const { startTime: savedStartTime, pausedTime: savedPausedTime, isRunning: savedIsRunning, description: savedDescription } = JSON.parse(savedTimerState);
        if (savedStartTime) setStartTime(savedStartTime);
        if (savedPausedTime) setPausedTime(savedPausedTime);
        if (savedIsRunning) setIsRunning(savedIsRunning);
        if (savedDescription) setDescription(savedDescription);
      } catch (e) {
        console.error("Failed to load timer state:", e);
      }
    }
    fetchWorklog();
  }, []);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "timerState",
      JSON.stringify({ startTime, pausedTime, isRunning, description })
    );
  }, [startTime, pausedTime, isRunning, description]);

  // Update current time every 100ms when running
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(Date.now());
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const fetchWorklog = async () => {
    try {
      const response = await fetch("/api/worklog");
      const data = await response.json();
      setWorklog(data);
    } catch (error) {
      console.error("Failed to fetch worklog:", error);
    }
  };

  // Calculate elapsed seconds based on timestamps
  const getElapsedSeconds = () => {
    if (!startTime) return pausedTime;
    if (!isRunning) return pausedTime;
    return pausedTime + Math.floor((currentTime - startTime) / 1000);
  };

  const seconds = getElapsedSeconds();

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStartPause = () => {
    if (isRunning) {
      // Pausing - save the elapsed time
      setPausedTime(getElapsedSeconds());
      setStartTime(null);
      setIsRunning(false);
    } else {
      // Starting/Resuming - set new start time
      setStartTime(Date.now());
      setIsRunning(true);
    }
  };

  const handleEnd = async () => {
    if (seconds === 0) {
      alert("No time logged");
      return;
    }

    setLoading(true);
    const hours = seconds / 3600;

    try {
      const response = await fetch("/api/worklog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "log_hours",
          hours: parseFloat(hours.toFixed(2)),
          description: description || "Timer session",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWorklog(data);
        // Reset timer
        setStartTime(null);
        setPausedTime(0);
        setIsRunning(false);
        setDescription("");
        localStorage.removeItem("timerState");
      } else {
        alert("Failed to log hours");
      }
    } catch (error) {
      console.error("Failed to log hours:", error);
      alert("Failed to log hours");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStartTime(null);
    setPausedTime(0);
    setIsRunning(false);
    localStorage.removeItem("timerState");
  };

  const handleBankAll = async () => {
    if (!worklog || (worklog.unbankedHours || 0) === 0) {
      alert("No hours to bank");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/worklog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "bank_all",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWorklog(data);
      } else {
        alert("Failed to bank hours");
      }
    } catch (error) {
      console.error("Failed to bank hours:", error);
      alert("Failed to bank hours");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemHours || parseFloat(redeemHours) <= 0) {
      alert("Please enter valid hours");
      return;
    }

    const hoursToSpend = parseFloat(redeemHours); // Hours to spend from balance
    const availableHours = worklog ? worklog.totalHoursBanked - worklog.totalHoursRedeemed : 0;
    const hoursYouGet = hoursToSpend * REDEMPTION_MULTIPLIER; // Hours you actually get

    if (hoursToSpend > availableHours) {
      alert(`You only have ${availableHours.toFixed(2)} banked hours available.`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/worklog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "redeem_hours",
          hours: hoursToSpend, // Store the hours spent from balance
          description: redeemDescription || `Redeemed ${hoursYouGet.toFixed(2)}h (spent: ${hoursToSpend}h)`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWorklog(data);
        setRedeemHours("");
        setRedeemDescription("");
      } else {
        alert("Failed to redeem hours");
      }
    } catch (error) {
      console.error("Failed to redeem hours:", error);
      alert("Failed to redeem hours");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionLabel = (action: WorklogEntry["action"]) => {
    switch (action) {
      case "log_hours":
        return "Logged";
      case "bank_hours":
        return "Banked";
      case "redeem_hours":
        return "Redeemed";
    }
  };

  const getActionColor = (action: WorklogEntry["action"]) => {
    switch (action) {
      case "log_hours":
        return "success";
      case "bank_hours":
        return "primary";
      case "redeem_hours":
        return "warning";
    }
  };

  const availableHours = worklog ? worklog.totalHoursBanked - worklog.totalHoursRedeemed : 0;
  const totalWorked = worklog ? worklog.totalHoursLogged : 0;

  // Stats calculations
  const thisWeekHours = worklog?.activities
    .filter((a) => {
      const activityDate = new Date(a.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return activityDate >= weekAgo && a.action === 'log_hours';
    })
    .reduce((sum, a) => sum + a.details.hours, 0) || 0;

  const averageSessionLength = worklog?.activities
    .filter(a => a.action === 'log_hours')
    .reduce((sum, a, _, arr) => sum + a.details.hours / arr.length, 0) || 0;

  // Calculate daily average
  const dailyAverage = (() => {
    if (!worklog || worklog.activities.length === 0) return 0;
    
    const loggedActivities = worklog.activities.filter(a => a.action === 'log_hours');
    if (loggedActivities.length === 0) return 0;
    
    const timestamps = loggedActivities.map(a => new Date(a.timestamp).getTime());
    const earliestDate = new Date(Math.min(...timestamps));
    const now = new Date();
    
    const daysSinceStart = Math.max(1, Math.ceil((now.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    return worklog.totalHoursLogged / daysSinceStart;
  })();

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-8 md:py-10 px-4">
      <div className="w-full max-w-6xl">
        {/* Header with balance */}
        <div className="flex justify-between items-center mb-6">
          <span className={title({ color: "violet" })}>Work Log Tracker</span>
          <Card className="bg-gradient-to-r from-violet-500 to-purple-500">
            <CardBody className="py-3 px-6">
              <p className="text-xs text-white/80">Available Hours</p>
              <p className="text-3xl font-bold text-white">
                {availableHours.toFixed(2)}h
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Main Stats Grid */}
        {worklog && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardBody className="text-center py-4">
                <p className="text-xs text-default-500 mb-1">Unbanked</p>
                <p className="text-2xl font-bold text-default-700">
                  {(worklog.unbankedHours || 0).toFixed(2)}h
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center py-4">
                <p className="text-xs text-default-500 mb-1">Total Logged</p>
                <p className="text-2xl font-bold text-success">
                  {worklog.totalHoursLogged.toFixed(2)}h
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center py-4">
                <p className="text-xs text-default-500 mb-1">Total Banked</p>
                <p className="text-2xl font-bold text-primary">
                  {worklog.totalHoursBanked.toFixed(2)}h
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center py-4">
                <p className="text-xs text-default-500 mb-1">Total Redeemed</p>
                <p className="text-2xl font-bold text-warning">
                  {worklog.totalHoursRedeemed.toFixed(2)}h
                </p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Additional Stats */}
        {worklog && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardBody>
                <p className="text-sm text-default-500 mb-2">Daily Average</p>
                <p className="text-xl font-semibold">{dailyAverage.toFixed(2)}h/day</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-default-500 mb-2">This Week</p>
                <p className="text-xl font-semibold">{thisWeekHours.toFixed(1)}h logged</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-default-500 mb-2">Avg Session</p>
                <p className="text-xl font-semibold">{averageSessionLength.toFixed(1)}h</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-default-500 mb-2">Total Sessions</p>
                <p className="text-xl font-semibold">
                  {worklog.activities.filter(a => a.action === 'log_hours').length}
                </p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Banking Progress */}
        {worklog && totalWorked > 0 && (
          <Card className="mb-6">
            <CardBody>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">Banking Progress</p>
                <p className="text-xs text-default-500">
                  {worklog.totalHoursBanked.toFixed(1)}h / {totalWorked.toFixed(1)}h
                </p>
              </div>
              <Progress
                value={(worklog.totalHoursBanked / totalWorked) * 100}
                color="primary"
                className="mb-2"
              />
              <p className="text-xs text-default-500">
                {((worklog.totalHoursBanked / totalWorked) * 100).toFixed(1)}% of logged hours banked
              </p>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timer Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center w-full">
                <h3 className="text-xl font-semibold">Timer</h3>
                {isRunning && (
                  <Chip color="success" variant="dot" size="sm">
                    Running
                  </Chip>
                )}
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4">
              <div className="text-center">
                <div className="text-6xl font-mono font-bold mb-4">
                  {formatTime(seconds)}
                </div>
                <div className="text-sm text-default-500 mb-4">
                  {(seconds / 3600).toFixed(2)} hours
                </div>
              </div>
              
              <Input
                label="Description (optional)"
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isRunning}
              />

              <div className="flex gap-2">
                <Button
                  color={isRunning ? "warning" : "success"}
                  onPress={handleStartPause}
                  className="flex-1"
                  size="lg"
                >
                  {isRunning ? "Pause" : seconds > 0 ? "Resume" : "Start"}
                </Button>
                {seconds > 0 && (
                  <>
                    <Button
                      color="primary"
                      onPress={handleEnd}
                      isLoading={loading}
                      className="flex-1"
                      size="lg"
                    >
                      End & Log
                    </Button>
                    <Button
                      color="danger"
                      variant="flat"
                      onPress={handleReset}
                      disabled={isRunning}
                      size="lg"
                    >
                      Reset
                    </Button>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Bank & Redeem Card */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Bank & Redeem</h3>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4">
              {/* Bank Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">Unbanked Hours</p>
                  <Chip color="success" variant="flat">
                    {(worklog?.unbankedHours || 0).toFixed(2)}h
                  </Chip>
                </div>
                <Button
                  color="primary"
                  onPress={handleBankAll}
                  isLoading={loading}
                  isDisabled={!worklog || (worklog.unbankedHours || 0) === 0}
                  className="w-full"
                  size="lg"
                >
                  Bank All Hours
                </Button>
              </div>

              <Divider />

              {/* Redeem Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-medium">Available Balance</p>
                  <Chip color="primary" variant="flat">
                    {availableHours.toFixed(2)}h
                  </Chip>
                </div>
                <div className="bg-default-100 rounded-lg p-3 mb-3">
                  <p className="text-xs text-default-600 mb-1">
                    Redemption Rate: {REDEMPTION_MULTIPLIER}x
                  </p>
                  <p className="text-xs text-default-500">
                    For every 10 banked hours you spend, you get {(10 * REDEMPTION_MULTIPLIER).toFixed(1)} redeemed hours
                  </p>
                </div>
                <Input
                  type="number"
                  label="Banked Hours to Spend"
                  placeholder="0.00"
                  value={redeemHours}
                  onChange={(e) => setRedeemHours(e.target.value)}
                  step="0.5"
                  min="0"
                  max={availableHours}
                  className="mb-3"
                  description={redeemHours ? `You'll get: ${(parseFloat(redeemHours) * REDEMPTION_MULTIPLIER).toFixed(2)} redeemed hours` : ""}
                />
                <Input
                  label="Reason (optional)"
                  placeholder="What are you using these hours for?"
                  value={redeemDescription}
                  onChange={(e) => setRedeemDescription(e.target.value)}
                  className="mb-3"
                />
                <Button
                  color="warning"
                  onPress={handleRedeem}
                  isLoading={loading}
                  isDisabled={availableHours === 0}
                  className="w-full"
                  size="lg"
                >
                  Redeem Hours
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Recent Activities */}
        {worklog && worklog.activities.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <h3 className="text-xl font-semibold">Recent Activities</h3>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="space-y-2">
                {worklog.activities
                  .slice()
                  .reverse()
                  .slice(0, 15)
                  .map((activity, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 rounded-lg bg-default-50 hover:bg-default-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Chip
                          color={getActionColor(activity.action)}
                          size="sm"
                          variant="flat"
                        >
                          {getActionLabel(activity.action)}
                        </Chip>
                        <div>
                          <p className="text-sm font-medium">
                            {activity.details.hours.toFixed(2)} hours
                          </p>
                          {activity.details.description && (
                            <p className="text-xs text-default-500">
                              {activity.details.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-default-400">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </section>
  );
}
