/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Declare XLSX to inform TypeScript that it's a global variable from the SheetJS script
declare var XLSX: any;

// RowObject is still useful for type clarity in some contexts, but let_globalRawData will be any[][]
interface RowObject {
  [key: string]: string | number | boolean | Date | null;
}

let let_globalRawData: any[][] = []; // Stores rows as arrays of values
let let_globalHeaders: string[] = [];

const excelFileEl = document.getElementById('excelFile') as HTMLInputElement;
const columnSelectEl = document.getElementById('columnSelect') as HTMLSelectElement;
const searchTermEl = document.getElementById('searchTerm') as HTMLInputElement;
const searchButtonEl = document.getElementById('searchButton') as HTMLButtonElement;
const tableContainerEl = document.getElementById('tableContainer') as HTMLDivElement;
const messageAreaEl = document.getElementById('messageArea') as HTMLDivElement;
const copyButtonEl = document.getElementById('copyButton') as HTMLButtonElement;
const searchSpinnerEl = document.getElementById('searchSpinner') as HTMLDivElement;


function showMessage(message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') {
    messageAreaEl.textContent = message;
    messageAreaEl.className = `alert alert-${type} mt-3`; // Ensure consistent margin
    messageAreaEl.style.display = 'block';
}

function clearMessage() {
    messageAreaEl.style.display = 'none';
    messageAreaEl.textContent = '';
}

function clearResults() {
    tableContainerEl.innerHTML = '';
    copyButtonEl.style.display = 'none';
}

function resetUIForNewFile() {
    clearMessage();
    clearResults();
    columnSelectEl.innerHTML = '<option selected disabled value="">Upload and process file first</option>';
    columnSelectEl.disabled = true;
    searchTermEl.value = '';
    searchTermEl.disabled = true;
    searchButtonEl.disabled = true;
    let_globalRawData = [];
    let_globalHeaders = [];
}

function handleFileUpload(event: Event) {
    resetUIForNewFile();
    searchSpinnerEl.style.display = 'block';
    console.log("File upload initiated.");

    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) {
        showMessage('No file selected.', 'warning');
        searchSpinnerEl.style.display = 'none';
        console.warn("No file selected by user.");
        return;
    }

    const file = target.files[0];
    console.log(`File selected: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    if (!file.name.match(/\.(xlsx|xls)$/i) && file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && file.type !== 'application/vnd.ms-excel') {
        showMessage('Invalid file type. Please upload an Excel file (.xlsx or .xls).', 'danger');
        excelFileEl.value = ''; // Reset file input
        searchSpinnerEl.style.display = 'none';
        console.error("Invalid file type uploaded.");
        return;
    }
    
    // Stricter warning for very large files
    if (file.size > 20 * 1024 * 1024) { // Warning for files larger than 20MB
        let sizeWarning = 'Warning: Processing large files (';
        if (file.size > 100 * 1024 * 1024) sizeWarning += '>100MB';
        else if (file.size > 50 * 1024 * 1024) sizeWarning += '>50MB';
        else sizeWarning += '>20MB';
        sizeWarning += ') directly in the browser is highly demanding on memory and CPU. This can lead to slow performance, unresponsiveness, or browser crashes, regardless of your computer\'s overall power. Consider using smaller, pre-filtered files if possible.';
        showMessage(sizeWarning, 'warning');
        console.warn(`File size is very large: ${file.size} bytes. This might cause severe issues.`);
    }


    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
        console.log("File read into ArrayBuffer.");
        try {
            const data = e.target?.result;
            if (!data) {
                throw new Error("File data could not be read from FileReader result.");
            }
            console.log("Attempting to parse Excel data with SheetJS...");
            // cellDates: true attempts to parse dates, raw: false (default) tries to format values
            const workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false });
            console.log("Workbook parsed. Sheet names:", workbook.SheetNames);

            const firstSheetName = workbook.SheetNames[0];
            if (!firstSheetName) {
                throw new Error("No sheets found in the Excel file.");
            }
            console.log(`Processing first sheet: "${firstSheetName}"`);
            const worksheet = workbook.Sheets[firstSheetName];
            
            // This is the most memory-intensive part for large files.
            // {header: 1} produces an array of arrays.
            const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }); // Use defval: null for empty cells
            console.log(`Sheet converted to JSON (array of arrays). Number of raw rows (including header): ${jsonData?.length}`);


            if (!jsonData || jsonData.length === 0) {
                let_globalHeaders = [];
                let_globalRawData = [];
                const emptySheetMsg = 'The Excel sheet appears to be empty or could not be fully read. For very large files, this might indicate that the browser ran out of memory or encountered issues during processing, resulting in no data being extracted.';
                showMessage(emptySheetMsg, 'warning');
                console.warn("jsonData is empty or null after sheet_to_json. This is unexpected for a large file with data.");
            } else {
                let_globalHeaders = (jsonData[0] as any[]).map(header => String(header === null || header === undefined ? "" : header)); // First row as headers, ensure string
                let_globalRawData = jsonData.slice(1); // The rest are data rows (arrays)
                 console.log(`Headers extracted: ${let_globalHeaders.join(', ')}. Number of data rows: ${let_globalRawData.length}`);
                
                // No longer mapping to RowObject[] here to save memory. let_globalRawData is now any[][].
                console.log(`Stored ${let_globalRawData.length} data rows as arrays.`);

                populateColumnSelect(let_globalHeaders);
                showMessage(`File "${file.name}" processed. ${let_globalRawData.length} data rows found. ${let_globalRawData.length === 0 && file.size > 1024*1024 ? 'If this count is zero for a large file, it might indicate a memory/processing issue.' : ''}`, 'success');
                columnSelectEl.disabled = false;
                searchTermEl.disabled = false;
                searchButtonEl.disabled = false;
            }
        } catch (error) {
            console.error("Error processing Excel file with SheetJS:", error);
            let errorMessage = `Error processing Excel file: ${error instanceof Error ? error.message : String(error)}.`;
            if (file.size > 20 * 1024 * 1024) { 
                errorMessage += " For very large files, this is often due to browser memory limitations exceeding what a single tab can handle. Consider using a smaller file or a dedicated desktop application for such large datasets.";
            }
            showMessage(errorMessage, 'danger');
            let_globalHeaders = [];
            let_globalRawData = [];
        } finally {
            searchSpinnerEl.style.display = 'none';
            console.log("File processing finished (or failed).");
        }
    };

    reader.onerror = () => {
        const fileReaderErrorMsg = 'Error reading the file using FileReader. This could be due to browser restrictions or issues with the file itself.';
        showMessage(fileReaderErrorMsg, 'danger');
        console.error("FileReader error occurred.", reader.error);
        searchSpinnerEl.style.display = 'none';
         let_globalHeaders = [];
         let_globalRawData = [];
    };

    reader.readAsArrayBuffer(file);
}

function populateColumnSelect(headers: string[]) {
    const placeholderText = "Select column(s)";
    let placeholderOption = Array.from(columnSelectEl.options).find(opt => opt.disabled);

    if (!placeholderOption) {
        placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        placeholderOption.textContent = placeholderText;
        placeholderOption.disabled = true;
        placeholderOption.selected = true; 
        columnSelectEl.prepend(placeholderOption);
    } else {
        placeholderOption.textContent = placeholderText;
        placeholderOption.selected = true;
    }
    
    Array.from(columnSelectEl.options).forEach(option => {
        if (!option.disabled) {
            columnSelectEl.removeChild(option);
        }
    });

    if (headers && headers.length > 0) {
        headers.forEach(header => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            columnSelectEl.appendChild(option);
        });
        if(placeholderOption) placeholderOption.selected = true;
    } else {
         if(placeholderOption) {
            placeholderOption.textContent = 'No columns found in file';
            placeholderOption.selected = true;
         }
    }
}

function displayResultsTable(filteredData: any[][], headers: string[]) {
    clearResults();

    if (filteredData.length === 0) {
        return;
    }

    const table = document.createElement('table');
    table.className = 'table table-striped table-bordered table-hover table-sm';

    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    const headerIndices = headers.map(header => let_globalHeaders.indexOf(header));

    filteredData.forEach(rowArray => {
        const row = tbody.insertRow();
        headerIndices.forEach(headerIndex => { // Iterate based on the original header order
            const cell = row.insertCell();
            const value = headerIndex !== -1 ? rowArray[headerIndex] : null; // Get value by index from let_globalRawData
            cell.textContent = (value === null || value === undefined) ? '' : String(value);
        });
    });

    tableContainerEl.appendChild(table);
    copyButtonEl.style.display = 'inline-block';
}

function handleSearch() {
    clearResults();
    clearMessage();
    
    if (let_globalRawData.length === 0 && let_globalHeaders.length === 0) {
        showMessage('Please upload and process an Excel file first.', 'warning');
        return;
    }
    if (let_globalRawData.length === 0 && let_globalHeaders.length > 0) {
        showMessage('File was processed, but no data rows were found. Try searching an empty term to show all (zero) rows or re-upload.', 'info');
    }

    const selectedColumnOptions = Array.from(columnSelectEl.options)
                                     .filter(option => option.selected && !option.disabled);
    const selectedColumns = selectedColumnOptions.map(option => option.value);
    
    const searchTerm = searchTermEl.value.trim().toLowerCase();

    if (selectedColumns.length === 0) {
        showMessage('Please select at least one column to search.', 'warning');
        return;
    }

    searchSpinnerEl.style.display = 'block';
    console.log(`Searching for "${searchTerm}" in columns: ${selectedColumns.join(', ')}`);

    setTimeout(() => { 
        try {
            // Get indices of selected columns from let_globalHeaders
            const selectedColumnIndices = selectedColumns.map(colName => let_globalHeaders.indexOf(colName)).filter(index => index !== -1);

            const filteredData = let_globalRawData.filter(rowArray => { // rowArray is any[]
                return selectedColumnIndices.some(columnIndex => {
                    const cellValue = rowArray[columnIndex];
                    if (cellValue === null || cellValue === undefined) {
                        return false;
                    }
                    return String(cellValue).toLowerCase().includes(searchTerm);
                });
            });

            if (filteredData.length === 0) {
                showMessage('No matching records found.', 'info');
            } else {
                // Pass let_globalHeaders to displayResultsTable for correct column order
                displayResultsTable(filteredData, let_globalHeaders);
                showMessage(`${filteredData.length} record(s) found.`, 'success');
            }
             console.log(`Search complete. Found ${filteredData.length} records.`);

        } catch(error) {
            console.error("Error during search:", error);
            showMessage(`An error occurred during search: ${error instanceof Error ? error.message : String(error)}`, 'danger');
        } finally {
            searchSpinnerEl.style.display = 'none';
        }
    }, 50); 
}

function copyTableToClipboard() {
    const table = tableContainerEl.querySelector('table');
    if (!table) {
        showMessage('No table data to copy.', 'warning');
        return;
    }

    let tsvData = '';
    
    const headers: string[] = [];
    table.querySelectorAll('thead th').forEach(th => headers.push((th as HTMLElement).innerText));
    if (headers.length > 0) {
        tsvData += headers.join('\t') + '\n';
    }

    table.querySelectorAll('tbody tr').forEach(tr => {
        const rowData: string[] = [];
        tr.querySelectorAll('td').forEach(td => {
            let cellText = (td as HTMLElement).innerText;
            cellText = cellText.replace(/\n/g, ' ').replace(/\t/g, ' ');
            rowData.push(cellText);
        });
        tsvData += rowData.join('\t') + '\n';
    });

    navigator.clipboard.writeText(tsvData.trim())
        .then(() => {
            const originalButtonText = copyButtonEl.innerHTML;
            copyButtonEl.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg me-1" viewBox="0 0 16 16">
                  <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                </svg>
                Copied!`;
            copyButtonEl.classList.add('btn-success');
            copyButtonEl.classList.remove('btn-outline-secondary');
            setTimeout(() => {
                copyButtonEl.innerHTML = `
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard me-1" viewBox="0 0 16 16">
                   <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                   <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                 </svg>
                 Copy Table`;
                copyButtonEl.classList.remove('btn-success');
                copyButtonEl.classList.add('btn-outline-secondary');
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy table: ', err);
            showMessage('Failed to copy table. Your browser might not support this feature or permissions are denied.', 'danger');
        });
}


// Event Listeners
if (excelFileEl) {
    excelFileEl.addEventListener('change', handleFileUpload);
}
if (searchButtonEl) {
    searchButtonEl.addEventListener('click', handleSearch);
}
if (copyButtonEl) {
    copyButtonEl.addEventListener('click', copyTableToClipboard);
}
if (searchTermEl) {
    searchTermEl.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
}

// Initial UI state check
document.addEventListener('DOMContentLoaded', () => {
    resetUIForNewFile(); 
    const placeholderOption = columnSelectEl.querySelector('option[disabled][value=""]');
    if (placeholderOption) {
        placeholderOption.textContent = "Upload and process file first";
    } else { 
        const newPlaceholder = document.createElement('option');
        newPlaceholder.value = "";
        newPlaceholder.textContent = "Upload and process file first";
        newPlaceholder.disabled = true;
        newPlaceholder.selected = true;
        columnSelectEl.innerHTML = ''; 
        columnSelectEl.appendChild(newPlaceholder);
    }
    columnSelectEl.disabled = true;
    console.log("Application initialized. UI reset.");
});