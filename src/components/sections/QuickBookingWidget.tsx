"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function QuickBookingWidget() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState("90");
  const [courtType, setCourtType] = useState("");
  const [playerCount, setPlayerCount] = useState("");

  const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    if (duration) params.set("duration", duration);
    if (courtType) params.set("court_type", courtType);
    if (playerCount) params.set("players", playerCount);
    router.push(`/booking?${params.toString()}`);
  }

  return (
    <form className="quick-booking" onSubmit={onSubmit}>
      <div className="form-grid">
        <div>
          <label htmlFor="qb-date">Date</label>
          <input id="qb-date" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div>
          <label htmlFor="qb-time">Time</label>
          <input id="qb-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        <div>
          <label htmlFor="qb-duration">Duration</label>
          <select id="qb-duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option value="60">60 mins</option>
            <option value="90">90 mins</option>
            <option value="120">120 mins</option>
          </select>
        </div>

        <div>
          <label htmlFor="qb-court">Court Type</label>
          <input
            id="qb-court"
            placeholder="Any"
            value={courtType}
            onChange={(e) => setCourtType(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="qb-players">Player Count</label>
          <select id="qb-players" value={playerCount} onChange={(e) => setPlayerCount(e.target.value)}>
            <option value="">Any</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>

        <div className="full actions">
          <button className="btn btn-primary" type="submit">
            Search Availability
          </button>
        </div>
      </div>
    </form>
  );
}
