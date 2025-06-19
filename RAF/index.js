/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const calendarGrid = document.getElementById('calendar-grid');
const monthYearDisplay = document.getElementById('month-year');
const prevMonthButton = document.getElementById('prev-month');
const nextMonthButton = document.getElementById('next-month');
const selectedDayDisplay = document.getElementById('selected-day-display');
const rideOptionsContainer = document.getElementById('ride-options-container');
const idaCheckbox = document.getElementById('ida-checkbox');
const vueltaCheckbox = document.getElementById('vuelta-checkbox');
const dailyCostDisplay = document.getElementById('daily-cost');
const totalCostDisplay = document.getElementById('total-cost');
const printPdfButton = document.getElementById('print-pdf-button');

const COST_PER_TRIP_LEG = 6000;
let currentDate = new Date();
let selectedDateISO = null; // Store date as YYYY-MM-DD string
let attendanceData = {}; // { "YYYY-MM-DD": { ida: boolean, vuelta: boolean } }

const DAY_NAMES_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function loadData() {
  const storedData = localStorage.getItem('facultyAttendanceData');
  if (storedData) {
    try {
      attendanceData = JSON.parse(storedData);
    } catch (error) {
      console.error("Error parsing attendance data from localStorage:", error);
      attendanceData = {};
    }
  }
}

function saveData() {
  localStorage.setItem('facultyAttendanceData', JSON.stringify(attendanceData));
}

function formatCurrency(amount) {
  return amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
}

function calculateDailyCost(dateISO) {
  const data = attendanceData[dateISO];
  if (!data) return 0;
  let cost = 0;
  if (data.ida) cost += COST_PER_TRIP_LEG;
  if (data.vuelta) cost += COST_PER_TRIP_LEG;
  return cost;
}

function updateTotalCost() {
  let total = 0;
  for (const dateISO in attendanceData) {
    total += calculateDailyCost(dateISO);
  }
  totalCostDisplay.textContent = formatCurrency(total);
}

function renderCalendar() {
  calendarGrid.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthYearDisplay.textContent = `${currentDate.toLocaleString('es-ES', { month: 'long' })} ${year}`;

  // Day headers
  DAY_NAMES_SHORT.forEach(dayName => {
    const dayHeaderEl = document.createElement('div');
    dayHeaderEl.className = 'font-semibold text-gray-600 p-2 text-sm print:text-xs print:p-1';
    dayHeaderEl.textContent = dayName;
    calendarGrid.appendChild(dayHeaderEl);
  });

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  // Empty cells before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    const emptyCell = document.createElement('div');
    calendarGrid.appendChild(emptyCell);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('button');
    dayCell.setAttribute('aria-label', `Seleccionar día ${day}`);
    dayCell.className = 'p-2 border border-gray-200 rounded hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 print:p-1 print:text-xs print:border-gray-400';
    dayCell.textContent = String(day);
    const dateISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dayCell.dataset.date = dateISO;

    if (attendanceData[dateISO]) {
      dayCell.classList.add('bg-indigo-500', 'text-white', 'font-semibold', 'print:bg-indigo-200', 'print:text-black');
      dayCell.classList.remove('hover:bg-indigo-100');
      dayCell.classList.add('hover:bg-indigo-600');
    }

    if (dateISO === selectedDateISO) {
      dayCell.classList.add('ring-2', 'ring-offset-1', 'ring-green-500', 'print:ring-1', 'print:ring-green-600');
      dayCell.classList.remove('bg-indigo-500', 'text-white');
      dayCell.classList.add('bg-green-200', 'text-green-800', 'print:bg-green-100', 'print:text-green-900');
    }

    const today = new Date();
    if (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate() &&
      dateISO !== selectedDateISO &&
      !attendanceData[dateISO]
    ) {
      dayCell.classList.add('bg-yellow-100', 'text-yellow-700', 'font-bold', 'print:bg-yellow-50', 'print:text-yellow-800');
    }

    dayCell.addEventListener('click', () => handleDayClick(dateISO));
    calendarGrid.appendChild(dayCell);
  }

  updateRideOptionsUI();
  updateTotalCost();
}

function handleDayClick(dateISO) {
  if (selectedDateISO === dateISO) {
    if (attendanceData[dateISO]) {
      delete attendanceData[dateISO];
      selectedDateISO = null;
    } else {
      attendanceData[dateISO] = { ida: true, vuelta: true };
      // selectedDateISO remains the same
    }
  } else {
    selectedDateISO = dateISO;
    if (!attendanceData[dateISO]) {
      attendanceData[dateISO] = { ida: true, vuelta: true };
    }
  }
  saveData();
  renderCalendar();
}

function updateRideOptionsUI() {
  if (selectedDateISO) {
    const dateObj = new Date(selectedDateISO + 'T00:00:00');
    selectedDayDisplay.textContent = `Día: ${dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    rideOptionsContainer.classList.remove('hidden');
    rideOptionsContainer.classList.remove('print:hidden');

    const dayData = attendanceData[selectedDateISO] || { ida: false, vuelta: false };
    idaCheckbox.checked = dayData.ida;
    vueltaCheckbox.checked = dayData.vuelta;

    const costForDay = calculateDailyCost(selectedDateISO);
    dailyCostDisplay.textContent = `Costo del día: ${formatCurrency(costForDay)}`;
  } else {
    selectedDayDisplay.textContent = 'Ningún día seleccionado';
    rideOptionsContainer.classList.add('hidden');
    rideOptionsContainer.classList.add('print:hidden');

    idaCheckbox.checked = false;
    vueltaCheckbox.checked = false;
    dailyCostDisplay.textContent = '';
  }
}

function handleRideCheckboxChange() {
  if (!selectedDateISO) return;

  if (!attendanceData[selectedDateISO]) {
    attendanceData[selectedDateISO] = { ida: false, vuelta: false };
  }

  attendanceData[selectedDateISO].ida = idaCheckbox.checked;
  attendanceData[selectedDateISO].vuelta = vueltaCheckbox.checked;

  saveData();
  updateTotalCost();
  updateRideOptionsUI();
  renderCalendar();
}

// Event listeners
prevMonthButton.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  selectedDateISO = null;
  renderCalendar();
});

nextMonthButton.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  selectedDateISO = null;
  renderCalendar();
});

idaCheckbox.addEventListener('change', handleRideCheckboxChange);
vueltaCheckbox.addEventListener('change', handleRideCheckboxChange);

printPdfButton.addEventListener('click', () => {
  window.print();
});

// Initial load
loadData();
renderCalendar();
