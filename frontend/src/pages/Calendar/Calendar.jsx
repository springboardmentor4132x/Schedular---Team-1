import { useEffect, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import "./Calendar.css";

function Calendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/posts?status=scheduled")
      .then((res) => {
        const calendarEvents = res.data.map((post) => ({
          title: post.title,
          date: post.scheduled_time,
        }));

        setEvents(calendarEvents);
      });
  }, []);

  return (
    <div className="calendar-page">
      <h2>Scheduled Posts Calendar</h2>

      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
      />
    </div>
  );
}

export default Calendar;