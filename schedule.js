// Simplified Schedule Calendar
document.addEventListener("DOMContentLoaded", function () {
  const currentDate = new Date();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  let classes = [];
  let currentWeekStart = null;

  // Load classes from JSON
  fetch("schedule.json")
    .then((response) => response.json())
    .then((data) => {
      classes = data;
      console.log("Loaded classes:", classes);
      renderCalendar();
      renderWeekView();
    })
    .catch((error) => {
      console.error("Error loading classes:", error);
      document.getElementById("calendar").innerHTML =
        '<p style="text-align: center; padding: 2rem;">Error loading schedule</p>';
    });

  function getMonday(d) {
    d = new Date(d);
    var day = d.getDay(),
      diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  }

  function renderCalendar() {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Update month display
    document.getElementById(
      "currentMonth"
    ).textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";

    // Add day headers
    dayNames.forEach((day) => {
      const header = document.createElement("div");
      header.className = "calendar-header";
      header.textContent = day;
      calendar.appendChild(header);
    });

    // Get calendar data
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

    // Add empty cells for previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement("div");
      emptyDay.className = "calendar-day other-month";
      calendar.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "calendar-day";

      const dayNumber = document.createElement("div");
      dayNumber.className = "day-number";
      dayNumber.textContent = day;
      dayElement.appendChild(dayNumber);

      // Check if this day is in the past
      const dayDate = new Date(currentYear, currentMonth, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dayDate < today) {
        dayElement.classList.add("past");
      }

      // Add classes for this day
      const dayOfWeek = getDayName(dayDate);
      const classesForDay = getClassesForDay(dayOfWeek, dayDate);

      classesForDay.forEach((classInfo) => {
        const classElement = document.createElement("div");
        classElement.className = "class-item";
        classElement.innerHTML = `
                    <div class="class-time">${formatTime(
                      classInfo.startTime
                    )}</div>
                    <div class="class-title">${classInfo.title}</div>
                    <div class="class-instructor">${
                      classInfo.instructorName
                    }</div>
                `;
        dayElement.appendChild(classElement);
      });

      calendar.appendChild(dayElement);
    }
  }

  function renderWeekView() {
    // Get current week start (Monday)
    if (!currentWeekStart) {
      currentWeekStart = getMonday(new Date());
    }
    const weekStart = currentWeekStart;

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    document.getElementById("currentWeek").textContent = `${formatDate(
      weekStart
    )} - ${formatDate(weekEnd)}`;

    const weekClasses = document.getElementById("weekClasses");
    weekClasses.innerHTML = "";

    // Get classes for the current week
    const weekClassesData = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(weekStart);
      console.log("Check date: ", currentDay);
      currentDay.setDate(currentDay.getDate() + i);

      const dayOfWeek = getDayName(currentDay);
      const classesForDay = getClassesForDay(dayOfWeek, currentDay);

      classesForDay.forEach((classInfo) => {
        weekClassesData.push({
          ...classInfo,
          date: new Date(currentDay),
          dayName: dayOfWeek,
        });
      });
    }

    weekClassesData.forEach((classInfo) => {
      const classCard = document.createElement("div");
      classCard.className = "week-class-card";

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (classInfo.date < today) {
        classCard.classList.add("past");
      }

      classCard.innerHTML = `
                <div class="week-class-day">${classInfo.dayName}, ${formatDate(
        classInfo.date
      )}</div>
                <div class="week-class-time">${formatTime(
                  classInfo.startTime
                )} - ${formatTime(classInfo.endTime)}</div>
                <div class="week-class-title">${classInfo.title}</div>
                <div class="week-class-instructor">with ${
                  classInfo.instructorName
                }</div>
                <div class="week-class-description">${
                  classInfo.description
                }</div>
                <div class="week-class-details">
                    <div class="week-class-price">$${classInfo.price}</div>
                    <div class="week-class-age">${
                      classInfo.minimumAgeLimit
                    }</div>
                </div>
            `;

      weekClasses.appendChild(classCard);
    });

    if (weekClassesData.length === 0) {
      weekClasses.innerHTML =
        '<p style="text-align: center; color: #666; padding: 2rem;">No classes scheduled for this week.</p>';
    }
  }

  function compareDates(date1, date2) {
    // Compare two dates without time
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    if (d1.getTime() === d2.getTime()) {
      return true;
    }
    return false;
  }

  function isProduction() {
    // Check if the current environment is production
    return /empowerment-studio/i.test(window.location.hostname);
  }

  function shouldShowClass(classInfo, dayOfWeek, date) {
    if (classInfo.test && isProduction()) {
      // If the class is marked as test and we're in production then don't show it
      return false;
    }
    if (classInfo && classInfo.classDate) {
      //classDate = new Date(classInfo.classDate);
      if (compareDates(classInfo.classDate + "T00:00:00", date)) {
        return true;
      }
    }

    if (classInfo.dayOfWeek === dayOfWeek) {
      // Only show classes that have started
      if (classInfo.startDate) {
        const startDate = new Date(classInfo.startDate);
        startDate.setHours(0, 0, 0, 0);

        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate >= startDate) {
          if (classInfo.endDate) {
            const endDate = new Date(classInfo.endDate);
            endDate.setHours(0, 0, 0, 0);
            if (checkDate > endDate) {
              return false;
            }
          }
          return true;
        }
      }
    }
    return false;
  }

  function getClassesForDay(dayOfWeek, date) {
    const classesForDay = [];

    classes.forEach((classInfo) => {
      // Check if the class matches the day of the week and
      if (shouldShowClass(classInfo, dayOfWeek, date) === true) {
        classesForDay.push(classInfo);
      }
    });

    return classesForDay;
  }

  function getDayName(date) {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return dayNames[date.getDay()];
  }

  function formatTime(timeString) {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  // Navigation event listeners
  document.getElementById("prevMonth")?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById("nextMonth")?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  // Week navigation event listeners
  document.getElementById("prevWeek")?.addEventListener("click", () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderWeekView();
  });

  document.getElementById("nextWeek")?.addEventListener("click", () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderWeekView();
  });
});
