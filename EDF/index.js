// Declara XLSX como variable global (asumiendo que usás SheetJS)
var XLSX = window.XLSX;

var let_globalRawData = []; // Filas con datos
var let_globalHeaders = [];

var excelFileEl = document.getElementById('excelFile');
var columnSelectEl = document.getElementById('columnSelect');
var searchTermEl = document.getElementById('searchTerm');
var searchButtonEl = document.getElementById('searchButton');
var tableContainerEl = document.getElementById('tableContainer');
var messageAreaEl = document.getElementById('messageArea');
var copyButtonEl = document.getElementById('copyButton');
var searchSpinnerEl = document.getElementById('searchSpinner');

function showMessage(message, type) {
    type = type || 'info';
    messageAreaEl.textContent = message;
    messageAreaEl.className = 'alert alert-' + type + ' mt-3';
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

function handleFileUpload(event) {
    resetUIForNewFile();
    searchSpinnerEl.style.display = 'block';
    console.log("File upload initiated.");

    var target = event.target;
    if (!target.files || target.files.length === 0) {
        showMessage('No file selected.', 'warning');
        searchSpinnerEl.style.display = 'none';
        console.warn("No file selected by user.");
        return;
    }

    var file = target.files[0];
    console.log('File selected: ' + file.name + ', size: ' + file.size + ' bytes, type: ' + file.type);

    if (!file.name.match(/\.(xlsx|xls)$/i) && file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && file.type !== 'application/vnd.ms-excel') {
        showMessage('Invalid file type. Please upload an Excel file (.xlsx or .xls).', 'danger');
        excelFileEl.value = '';
        searchSpinnerEl.style.display = 'none';
        console.error("Invalid file type uploaded.");
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        var sizeWarning = 'Warning: Processing large files (';
        if (file.size > 100 * 1024 * 1024) sizeWarning += '>100MB';
        else if (file.size > 50 * 1024 * 1024) sizeWarning += '>50MB';
        else sizeWarning += '>20MB';
        sizeWarning += ') directly in the browser is highly demanding on memory and CPU. This can lead to slow performance, unresponsiveness, or browser crashes. Consider using smaller files.';
        showMessage(sizeWarning, 'warning');
        console.warn('File size is very large: ' + file.size + ' bytes.');
    }

    var reader = new FileReader();

    reader.onload = function(e) {
        console.log("File read into ArrayBuffer.");
        try {
            var data = e.target.result;
            if (!data) throw new Error("File data could not be read from FileReader result.");

            console.log("Attempting to parse Excel data with SheetJS...");
            var workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false });
            console.log("Workbook parsed. Sheet names:", workbook.SheetNames);

            var firstSheetName = workbook.SheetNames[0];
            if (!firstSheetName) throw new Error("No sheets found in the Excel file.");

            console.log('Processing first sheet: "' + firstSheetName + '"');
            var worksheet = workbook.Sheets[firstSheetName];
            var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
            console.log('Sheet converted to JSON. Rows:', jsonData.length);

            if (!jsonData || jsonData.length === 0) {
                let_globalHeaders = [];
                let_globalRawData = [];
                showMessage('The Excel sheet appears empty or could not be read.', 'warning');
                console.warn("No data after conversion.");
            } else {
                let_globalHeaders = jsonData[0].map(function(h) { return h == null ? '' : String(h); });
                let_globalRawData = jsonData.slice(1);
                console.log('Headers:', let_globalHeaders.join(', '), 'Rows:', let_globalRawData.length);

                populateColumnSelect(let_globalHeaders);
                showMessage('File "' + file.name + '" processed. ' + let_globalRawData.length + ' data rows found.', 'success');
                columnSelectEl.disabled = false;
                searchTermEl.disabled = false;
                searchButtonEl.disabled = false;
            }
        } catch (error) {
            console.error("Error processing Excel file with SheetJS:", error);
            var errorMessage = 'Error processing Excel file: ' + (error.message || error) + '.';
            if (file.size > 20 * 1024 * 1024) {
                errorMessage += ' Large files can exceed browser memory limits.';
            }
            showMessage(errorMessage, 'danger');
            let_globalHeaders = [];
            let_globalRawData = [];
        } finally {
            searchSpinnerEl.style.display = 'none';
            console.log("File processing finished (or failed).");
        }
    };

    reader.onerror = function() {
        showMessage('Error reading the file.', 'danger');
        console.error("FileReader error:", reader.error);
        searchSpinnerEl.style.display = 'none';
        let_globalHeaders = [];
        let_globalRawData = [];
    };

    reader.readAsArrayBuffer(file);
}

function populateColumnSelect(headers) {
    var placeholderText = "Select column(s)";
    var placeholderOption = Array.from(columnSelectEl.options).find(function(opt) { return opt.disabled; });

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

    Array.from(columnSelectEl.options).forEach(function(option) {
        if (!option.disabled) {
            columnSelectEl.removeChild(option);
        }
    });

    if (headers && headers.length > 0) {
        headers.forEach(function(header) {
            var option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            columnSelectEl.appendChild(option);
        });
        if (placeholderOption) placeholderOption.selected = true;
    } else {
        if (placeholderOption) {
            placeholderOption.textContent = 'No columns found in file';
            placeholderOption.selected = true;
        }
    }
}

function displayResultsTable(filteredData, headers) {
    clearResults();

    if (filteredData.length === 0) {
        return;
    }

    var table = document.createElement('table');
    table.className = 'table table-striped table-bordered table-hover table-sm';

    var thead = table.createTHead();
    var headerRow = thead.insertRow();
    headers.forEach(function(headerText) {
        var th = document.createElement('th');
        th.scope = 'col';
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    var tbody = table.createTBody();
    var headerIndices = headers.map(function(header) { return let_globalHeaders.indexOf(header); });

    filteredData.forEach(function(rowArray) {
        var row = tbody.insertRow();
        headerIndices.forEach(function(headerIndex) {
            var cell = row.insertCell();
            var value = headerIndex !== -1 ? rowArray[headerIndex] : null;
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
        showMessage('File was processed, but no data rows were found.', 'info');
    }

    var selectedColumnOptions = Array.from(columnSelectEl.options).filter(function(option) {
        return option.selected && !option.disabled;
    });
    var selectedColumns = selectedColumnOptions.map(function(option) { return option.value; });

    var searchTerm = searchTermEl.value.trim().toLowerCase();

    if (selectedColumns.length === 0) {
        showMessage('Please select at least one column to search.', 'warning');
        return;
    }

    searchSpinnerEl.style.display = 'block';
    console.log('Searching for "' + searchTerm + '" in columns: ' + selectedColumns.join(', '));

    setTimeout(function() {
        try {
            var selectedColumnIndices = selectedColumns.map(function(colName) {
                return let_globalHeaders.indexOf(colName);
            }).filter(function(index) { return index !== -1; });

            var filteredData = let_globalRawData.filter(function(rowArray) {
                return selectedColumnIndices.some(function(columnIndex) {
                    var cellValue = rowArray[columnIndex];
                    if (cellValue === null || cellValue === undefined) {
                        return false;
                    }
                    return String(cellValue).toLowerCase().includes(searchTerm);
                });
            });

            if (filteredData.length === 0) {
                showMessage('No matching records found.', 'info');
            } else {
                displayResultsTable(filteredData, let_globalHeaders);
                showMessage(filteredData.length + ' record(s) found.', 'success');
            }
            console.log('Search complete. Found ' + filteredData.length + ' records.');

        } catch (error) {
            console.error('Error during search:', error);
            showMessage('An error occurred during search: ' + (error.message || error), 'danger');
        } finally {
            searchSpinnerEl.style.display = 'none';
        }
    }, 50);
}

function copyTableToClipboard() {
    var table = tableContainerEl.querySelector('table');
    if (!table) {
        showMessage('No table data to copy.', 'warning');
        return;
    }

    var tsvData = '';

    var headers = [];
    table.querySelectorAll('thead th').forEach(function(th) {
        headers.push(th.innerText);
    });
    if (headers.length > 0) {
        tsvData += headers.join('\t') + '\n';
    }

    table.querySelectorAll('tbody tr').forEach(function(tr) {
        var rowData = [];
        tr.querySelectorAll('td').forEach(function(td) {
            var cellText = td.innerText;
            cellText = cellText.replace(/\n/g, ' ').replace(/\t/g, ' ');
            rowData.push(cellText);
        });
        tsvData += rowData.join('\t') + '\n';
    });

    navigator.clipboard.writeText(tsvData.trim()).then(function() {
        var originalButtonText = copyButtonEl.innerHTML;
        copyButtonEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg me-1" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/></svg>Copied!';
        copyButtonEl.classList.add('btn-success');
        copyButtonEl.classList.remove('btn-outline-secondary');
        setTimeout(function() {
            copyButtonEl.innerHTML = originalButtonText;
            copyButtonEl.classList.remove('btn-success');
            copyButtonEl.classList.add('btn-outline-secondary');
        }, 2000);
    }).catch(function(err) {
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
    searchTermEl.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    resetUIForNewFile();
    var placeholderOption = columnSelectEl.querySelector('option[disabled][value=""]');
    if (placeholderOption) {
        placeholderOption.textContent = "Upload and process file first";
    } else {
        var newPlaceholder = document.createElement('option');
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
