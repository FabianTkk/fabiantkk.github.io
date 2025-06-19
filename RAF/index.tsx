/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const calendarGrid = document.getElementById('calendar-grid') as HTMLElement;
const monthYearDisplay = document.getElementById('month-year') as HTMLElement;
const prevMonthButton = document.getElementById('prev-month') as HTMLButtonElement;
const nextMonthButton = document.getElementById('next-month') as HTMLButtonElement;
const selectedDayDisplay = document.getElementById('selected-day-display') as HTMLElement;
const rideOptionsContainer = document.getElementById('ride-options-container') as HTMLElement;
const idaCheckbox = document.getElementById('ida-checkbox') as HTMLInputElement;
const vueltaCheckbox = document.getElementById('vuelta-checkbox') as HTMLInputElement;
const dailyCostDisplay = document.getElementById('daily-cost') as HTMLElement;
const totalCostDisplay = document.getElementById('total-cost') as HTMLElement;
const printPdfButton = document.getElementById('print-pdf-button') as HTMLButtonElement;


const COST_PER_TRIP_LEG = 6000;
let currentDate = new Date();
let selectedDateISO: string | null = null; // Store date as YYYY-MM-DD string
let attendanceData: Record<string, { ida: boolean, vuelta: boolean }> = {}; // { "YYYY-MM-DD": { ida: boolean, vuelta: boolean } }

const DAY_NAMES_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function loadData() {
  const storedData = localStorage.getItem('facultyAttendanceData');
  if (storedData) {
    try {
      attendanceData = JSON.parse(storedData);
    } catch (error) {
      console.error("Error parsing attendance data from localStorage:", error);
      attendanceData = {}; // Reset to empty if parsing fails
    }
  }
}

function saveData() {
  localStorage.setItem('facultyAttendanceData', JSON.stringify(attendanceData));
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
}

function calculateDailyCost(dateISO: string) {
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
  calendarGrid.innerHTML = ''; // Clear previous grid

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  monthYearDisplay.textContent = `${currentDate.toLocaleString('es-ES', { month: 'long' })} ${year}`;

  // Add day headers
  DAY_NAMES_SHORT.forEach(dayName => {
    const dayHeaderEl = document.createElement('div');
    dayHeaderEl.className = 'font-semibold text-gray-600 p-2 text-sm print:text-xs print:p-1';
    dayHeaderEl.textContent = dayName;
    calendarGrid.appendChild(dayHeaderEl);
  });

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, ...

  // Add empty cells for days before the 1st of the month
  for (let i = 0; i < startDayOfWeek; i++) {
    const emptyCell = document.createElement('div');
    calendarGrid.appendChild(emptyCell);
  }

  // Add day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('button');
    dayCell.setAttribute('aria-label', `Seleccionar día ${day}`);
    dayCell.className = 'p-2 border border-gray-200 rounded hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 print:p-1 print:text-xs print:border-gray-400';
    dayCell.textContent = String(day); // Ensure day is a string
    const dateISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dayCell.dataset.date = dateISO;

    if (attendanceData[dateISO]) {
      dayCell.classList.add('bg-indigo-500', 'text-white', 'font-semibold', 'print:bg-indigo-200', 'print:text-black');
      dayCell.classList.remove('hover:bg-indigo-100');
      dayCell.classList.add('hover:bg-indigo-600');
    }

    if (dateISO === selectedDateISO) {
      dayCell.classList.add('ring-2', 'ring-offset-1', 'ring-green-500', 'print:ring-1', 'print:ring-green-600');
      // If selected, ensure its base style isn't overridden by just being "attended" if it happens to be
      dayCell.classList.remove('bg-indigo-500', 'text-white');
      dayCell.classList.add('bg-green-200', 'text-green-800', 'print:bg-green-100', 'print:text-green-900');
    }

    const today = new Date();
    if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate() && dateISO !== selectedDateISO && !attendanceData[dateISO]) {
      dayCell.classList.add('bg-yellow-100', 'text-yellow-700', 'font-bold', 'print:bg-yellow-50', 'print:text-yellow-800');
    }


    dayCell.addEventListener('click', () => handleDayClick(dateISO));
    calendarGrid.appendChild(dayCell);
  }
  updateRideOptionsUI(); // Ensure UI is consistent after re-render
  updateTotalCost(); // Recalculate total cost
}

function handleDayClick(dateISO: string) {
  if (selectedDateISO === dateISO) { // Clicked on the *already selected* day
    if (attendanceData[dateISO]) { // If it's marked as attended
      delete attendanceData[dateISO]; // Unmark it
      selectedDateISO = null; // Deselect for editing
    } else {
      // If it was selected but not in attendanceData (e.g. after being deleted or unmarking both checkboxes previously removed it)
      // Re-add it with defaults.
      attendanceData[dateISO] = { ida: true, vuelta: true };
      // selectedDateISO remains dateISO
    }
  } else { // Clicked on a *new* or *different* day
    selectedDateISO = dateISO;
    if (!attendanceData[dateISO]) {
      // If this newly selected day is not already in attendanceData, add it with defaults.
      attendanceData[dateISO] = { ida: true, vuelta: true };
    }
    // If it was already in attendanceData, its existing state will be loaded by updateRideOptionsUI.
  }
  saveData();
  renderCalendar(); // Re-render to show selection, attendance status, and trigger updateRideOptionsUI
}


function updateRideOptionsUI() {
  if (selectedDateISO) {
    const dateObj = new Date(selectedDateISO + 'T00:00:00'); // Ensure correct date parsing for local time
    selectedDayDisplay.textContent = `Día: ${dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    rideOptionsContainer.classList.remove('hidden');
    rideOptionsContainer.classList.remove('print:hidden'); // Ensure it's shown for print if a day is selected


    const dayData = attendanceData[selectedDateISO] || { ida: false, vuelta: false }; // Default to false if somehow not set
    idaCheckbox.checked = dayData.ida;
    vueltaCheckbox.checked = dayData.vuelta;

    const costForDay = calculateDailyCost(selectedDateISO);
    dailyCostDisplay.textContent = `Costo del día: ${formatCurrency(costForDay)}`;
  } else {
    selectedDayDisplay.textContent = 'Ningún día seleccionado';
    rideOptionsContainer.classList.add('hidden');
    rideOptionsContainer.classList.add('print:hidden'); // Ensure it's hidden for print if no day is selected

    idaCheckbox.checked = false;
    vueltaCheckbox.checked = false;
    dailyCostDisplay.textContent = '';
  }
}


function handleRideCheckboxChange() {
  if (!selectedDateISO) return;

  // If day wasn't in attendanceData (e.g., selected, then default rides were immediately unchecked before any other interaction)
  // ensure it's added now that a ride option is explicitly interacted with.
  if (!attendanceData[selectedDateISO]) {
    attendanceData[selectedDateISO] = { ida: false, vuelta: false };
  }

  attendanceData[selectedDateISO].ida = idaCheckbox.checked;
  attendanceData[selectedDateISO].vuelta = vueltaCheckbox.checked;

  // If both checkboxes are unchecked, the day remains "attended" but with 0 cost for rides.
  // To remove attendance entirely, the user clicks the day on the calendar again.

  saveData();
  updateTotalCost();
  updateRideOptionsUI(); // To update daily cost display
  renderCalendar(); // To update day's appearance if it became (un)attended (e.g. if style depends on cost too)
}

// Event Listeners
prevMonthButton.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  selectedDateISO = null; // Deselect day when changing month
  renderCalendar();
});

nextMonthButton.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  selectedDateISO = null; // Deselect day when changing month
  renderCalendar();
});

idaCheckbox.addEventListener('change', handleRideCheckboxChange);
vueltaCheckbox.addEventListener('change', handleRideCheckboxChange);

printPdfButton.addEventListener('click', () => {
  window.print();
});

// Initial Load
loadData();
renderCalendar();
// updateTotalCost(); // Called by renderCalendar
// updateRideOptionsUI(); // Called by renderCalendar
