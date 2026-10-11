/**
 * CHẤM CÔNG PRO - JAVASCRIPT APPLICATION LOGIC
 * Features: LocalStorage persistence (No SQL required), Calendar & Table views,
 * Precise time calculation, Overtime & Wage estimation, Bulk fill & Excel/JSON export.
 */

(() => {
    'use strict';

    // ==========================================
    // CONSTANTS & INITIAL STATE
    // ==========================================
    const STORAGE_KEY_DATA = 'cham_cong_pro_records_v1';
    const STORAGE_KEY_SETTINGS = 'cham_cong_pro_settings_v1';
    const STORAGE_KEY_THEME = 'cham_cong_pro_theme_v1';

    const DEFAULT_SETTINGS = {
        standardHours: 8,
        halfDayHours: 4,
        otThreshold: 8,
        monthlySalary: 7800000,
        standardDays: 26,
        otMultiplier: 1.5,
        allowance: 0,
        insurance: 0,
        unionFee: 0
    };

    // App State
    let state = {
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth(), // 0-11
        currentView: 'calendar', // 'calendar' | 'table' | 'stats'
        statusFilter: 'all',
        records: {},
        settings: { ...DEFAULT_SETTINGS },
        theme: 'theme-dark'
    };

    // Day of week labels in Vietnamese
    const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    const DOM = {
        periodText: document.getElementById('periodText'),
        btnPrevPeriod: document.getElementById('btnPrevPeriod'),
        btnNextPeriod: document.getElementById('btnNextPeriod'),
        btnToday: document.getElementById('btnToday'),
        btnThemeToggle: document.getElementById('btnThemeToggle'),
        btnSettings: document.getElementById('btnSettings'),
        btnCalcWageQuick: document.getElementById('btnCalcWageQuick'),
        btnAutoSaveToggle: document.getElementById('btnAutoSaveToggle'),
        autoSaveText: document.getElementById('autoSaveText'),
        viewButtons: document.querySelectorAll('.toggle-btn'),
        views: {
            calendar: document.getElementById('calendarView'),
            table: document.getElementById('tableView'),
            stats: document.getElementById('statsView')
        },
        calendarGrid: document.getElementById('calendarGrid'),
        timesheetTableBody: document.getElementById('timesheetTableBody'),
        filterStatus: document.getElementById('filterStatus'),
        
        // KPIs
        kpiWorkDays: document.getElementById('kpiWorkDays'),
        kpiStandardDays: document.getElementById('kpiStandardDays'),
        kpiTotalShiftsSub: document.getElementById('kpiTotalShiftsSub'),
        kpiShiftProgress: document.getElementById('kpiShiftProgress'),
        kpiTotalHours: document.getElementById('kpiTotalHours'),
        kpiAvgHours: document.getElementById('kpiAvgHours'),
        kpiTotalOT: document.getElementById('kpiTotalOT'),
        kpiOtDays: document.getElementById('kpiOtDays'),
        kpiTotalSalary: document.getElementById('kpiTotalSalary'),
        kpiSalarySub: document.getElementById('kpiSalarySub'),
        kpiNetSalary: document.getElementById('kpiNetSalary'),
        kpiNetSalarySub: document.getElementById('kpiNetSalarySub'),

        // Toolbar Buttons & Dropdown
        btnQuickCheckin: document.getElementById('btnQuickCheckin'),
        btnBulkFill: document.getElementById('btnBulkFill'),
        btnExportMenu: document.getElementById('btnExportMenu'),
        exportDropdown: document.getElementById('exportDropdown'),
        btnExportExcel: document.getElementById('btnExportExcel'),
        btnDirectExportExcel: document.getElementById('btnDirectExportExcel'),
        btnExportJSON: document.getElementById('btnExportJSON'),
        importJSONInput: document.getElementById('importJSONInput'),
        btnPrintTimesheet: document.getElementById('btnPrintTimesheet'),
        btnClearData: document.getElementById('btnClearData'),

        // Entry Modal
        entryModal: document.getElementById('entryModal'),
        entryForm: document.getElementById('entryForm'),
        btnCloseModal: document.getElementById('btnCloseModal'),
        btnCancelModal: document.getElementById('btnCancelModal'),
        btnDeleteEntry: document.getElementById('btnDeleteEntry'),
        modalDateTitle: document.getElementById('modalDateTitle'),
        modalDateSubtitle: document.getElementById('modalDateSubtitle'),
        entryDate: document.getElementById('entryDate'),
        chkSplitShift: document.getElementById('chkSplitShift'),
        singleShiftBox: document.getElementById('singleShiftBox'),
        splitShiftBox: document.getElementById('splitShiftBox'),
        timeIn: document.getElementById('timeIn'),
        timeOut: document.getElementById('timeOut'),
        timeIn1: document.getElementById('timeIn1'),
        timeOut1: document.getElementById('timeOut1'),
        timeIn2: document.getElementById('timeIn2'),
        timeOut2: document.getElementById('timeOut2'),
        chkLunchBreak: document.getElementById('chkLunchBreak'),
        chkAutoOut4h: document.getElementById('chkAutoOut4h'),
        chkAutoOut8h: document.getElementById('chkAutoOut8h'),
        autoOutBadge: document.getElementById('autoOutBadge'),
        autoOutHint: document.getElementById('autoOutHint'),
        dayStatus: document.getElementById('dayStatus'),
        workNote: document.getElementById('workNote'),
        previewTotalHours: document.getElementById('previewTotalHours'),
        previewOTHours: document.getElementById('previewOTHours'),
        previewWorkUnits: document.getElementById('previewWorkUnits'),
        presetChips: document.querySelectorAll('.chip[data-in]'),
        btnResetDay: document.getElementById('btnResetDay'),

        // Settings Modal
        settingsModal: document.getElementById('settingsModal'),
        settingsForm: document.getElementById('settingsForm'),
        btnCloseSettingsModal: document.getElementById('btnCloseSettingsModal'),
        btnCancelSettings: document.getElementById('btnCancelSettings'),
        cfgMonthlySalary: document.getElementById('cfgMonthlySalary'),
        cfgStandardDays: document.getElementById('cfgStandardDays'),
        lblDailyWageResult: document.getElementById('lblDailyWageResult'),
        lblHourlyWageResult: document.getElementById('lblHourlyWageResult'),
        lblWageFormulaDesc: document.getElementById('lblWageFormulaDesc'),
        cfgStandardHours: document.getElementById('cfgStandardHours'),
        cfgHalfDayHours: document.getElementById('cfgHalfDayHours'),
        cfgOtThreshold: document.getElementById('cfgOtThreshold'),
        cfgOtRateMultiplier: document.getElementById('cfgOtRateMultiplier'),
        cfgAllowance: document.getElementById('cfgAllowance'),
        cfgInsurance: document.getElementById('cfgInsurance'),
        cfgUnionFee: document.getElementById('cfgUnionFee'),

        // Bulk Fill Modal
        bulkFillModal: document.getElementById('bulkFillModal'),
        bulkFillForm: document.getElementById('bulkFillForm'),
        btnCloseBulkModal: document.getElementById('btnCloseBulkModal'),
        btnCancelBulk: document.getElementById('btnCancelBulk'),
        bulkShiftType: document.getElementById('bulkShiftType'),
        bulkSingleBox: document.getElementById('bulkSingleBox'),
        bulkSplitBox: document.getElementById('bulkSplitBox'),
        bulkIn: document.getElementById('bulkIn'),
        bulkOut: document.getElementById('bulkOut'),
        bulkAutoOut4h: document.getElementById('bulkAutoOut4h'),
        bulkAutoOut8h: document.getElementById('bulkAutoOut8h'),
        bulkAutoOutBadge: document.getElementById('bulkAutoOutBadge'),
        bulkIn1: document.getElementById('bulkIn1'),
        bulkOut1: document.getElementById('bulkOut1'),
        bulkIn2: document.getElementById('bulkIn2'),
        bulkOut2: document.getElementById('bulkOut2'),
        bulkLunchBreak: document.getElementById('bulkLunchBreak'),
        bulkOverwrite: document.getElementById('bulkOverwrite'),

        // Charts & Breakdown
        hoursChart: document.getElementById('hoursChart'),
        statusChart: document.getElementById('statusChart'),
        breakdownGrid: document.getElementById('breakdownGrid'),
        toastContainer: document.getElementById('toastContainer')
    };

    // ==========================================
    // INITIALIZATION & STORAGE
    // ==========================================
    function init() {
        loadSettings();
        loadTheme();
        loadRecords();
        setupEventListeners();
        renderAll();
        initAutoSave();
    }

    function loadRecords() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_DATA);
            let loaded = raw ? JSON.parse(raw) : null;

            // Nếu LocalStorage chưa có gì hoặc rỗng, tự nạp từ file data/database.js trong thư mục
            if ((!loaded || Object.keys(loaded).length === 0) && window.CHAM_CONG_DEFAULT_DATA && window.CHAM_CONG_DEFAULT_DATA.records) {
                loaded = { ...window.CHAM_CONG_DEFAULT_DATA.records };
            }

            state.records = loaded || {};

            // Tự động đồng bộ lại các ngày cắt ca theo công thức tổng 2 ca cộng lại
            let needsSave = false;
            Object.keys(state.records).forEach(k => {
                const r = state.records[k];
                if (r && r.isSplitShift) {
                    const m = calculateDayMetrics(r.timeIn, r.timeOut, r.status, false, true, r.timeIn2, r.timeOut2);
                    if (r.workUnits !== m.workUnits || r.totalHours !== m.totalHours || r.otHours !== m.otHours) {
                        r.workUnits = m.workUnits;
                        r.totalHours = m.totalHours;
                        r.otHours = m.otHours;
                        needsSave = true;
                    }
                }
            });
            if (needsSave) saveRecords();
        } catch (e) {
            console.error('Lỗi khi đọc dữ liệu:', e);
            state.records = {};
        }
    }

    function saveRecords() {
        try {
            localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(state.records));
            triggerAutoSaveDatabase();
        } catch (e) {
            console.error('Lỗi khi lưu dữ liệu LocalStorage:', e);
            showToast('Không thể lưu dữ liệu (Bộ nhớ đầy hoặc bị chặn)', 'error');
        }
    }

    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
            if (raw) {
                state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
            } else if (window.CHAM_CONG_DEFAULT_DATA && window.CHAM_CONG_DEFAULT_DATA.settings) {
                state.settings = { ...DEFAULT_SETTINGS, ...window.CHAM_CONG_DEFAULT_DATA.settings };
                saveSettings();
            }
        } catch (e) {
            state.settings = { ...DEFAULT_SETTINGS };
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(state.settings));
            triggerAutoSaveDatabase();
        } catch (e) {
            console.error(e);
        }
    }

    function loadTheme() {
        const saved = localStorage.getItem(STORAGE_KEY_THEME) || 'theme-dark';
        state.theme = saved;
        document.body.className = saved;
        updateThemeIcon();
    }

    function toggleTheme() {
        state.theme = state.theme === 'theme-dark' ? 'theme-light' : 'theme-dark';
        document.body.className = state.theme;
        localStorage.setItem(STORAGE_KEY_THEME, state.theme);
        updateThemeIcon();
        if (state.currentView === 'stats') {
            renderCharts();
        }
    }

    function updateThemeIcon() {
        if (!DOM.btnThemeToggle) return;
        DOM.btnThemeToggle.innerHTML = state.theme === 'theme-dark' 
            ? '<i class="fa-solid fa-sun"></i>' 
            : '<i class="fa-solid fa-moon"></i>';
    }

    // ==========================================
    // CALCULATION HELPERS
    // ==========================================
    function parseTimeToMinutes(timeStr) {
        if (!timeStr) return null;
        const [h, m] = timeStr.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return null;
        return h * 60 + m;
    }

    function addMinutesToTime(timeStr, minsToAdd) {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return timeStr;
        let totalMins = h * 60 + m + minsToAdd;
        if (totalMins < 0) totalMins = 0;
        const newH = Math.floor(totalMins / 60) % 24;
        const newM = totalMins % 60;
        return `${padZero(newH)}:${padZero(newM)}`;
    }

    function calculateDayMetrics(timeInStr, timeOutStr, status, hasLunchBreak = null, isSplit = false, timeIn2Str = '', timeOut2Str = '') {
        let totalMinutes = 0;
        let totalHours = 0;
        let otHours = 0;
        let workUnits = 0;

        if (status === 'leave_paid' || status === 'holiday') {
            return {
                totalHours: state.settings.standardHours,
                otHours: 0,
                workUnits: 1.0
            };
        } else if (status === 'leave_unpaid' || status === 'off') {
            return {
                totalHours: 0,
                otHours: 0,
                workUnits: 0
            };
        }

        const stdHours = parseFloat(state.settings.standardHours) || 8;
        const halfHours = parseFloat(state.settings.halfDayHours) || 4;
        const otThreshold = parseFloat(state.settings.otThreshold) || 8;

        if (isSplit) {
            // Chế độ cắt ca (Ca sáng + Ca chiều): Tính độc lập công từng ca rồi cộng lại
            const in1 = parseTimeToMinutes(timeInStr);
            const out1 = parseTimeToMinutes(timeOutStr);
            const in2 = parseTimeToMinutes(timeIn2Str);
            const out2 = parseTimeToMinutes(timeOut2Str);

            let diff1 = (in1 !== null && out1 !== null && out1 > in1) ? (out1 - in1) : 0;
            let diff2 = (in2 !== null && out2 !== null && out2 > in2) ? (out2 - in2) : 0;

            const hours1 = Number((diff1 / 60).toFixed(2));
            const hours2 = Number((diff2 / 60).toFixed(2));

            // Tính số công Ca 1
            let units1 = 0;
            if (hours1 >= stdHours) {
                units1 = 1.0;
            } else if (hours1 >= halfHours) {
                units1 = 0.5;
            } else if (hours1 > 0) {
                units1 = Number((hours1 / stdHours).toFixed(2));
            }

            // Tính số công Ca 2
            let units2 = 0;
            if (hours2 >= stdHours) {
                units2 = 1.0;
            } else if (hours2 >= halfHours) {
                units2 = 0.5;
            } else if (hours2 > 0) {
                units2 = Number((hours2 / stdHours).toFixed(2));
            }

            // Tổng 2 công của 2 ca cộng lại
            workUnits = Number((units1 + units2).toFixed(2));

            totalMinutes = diff1 + diff2;
            totalHours = Number((totalMinutes / 60).toFixed(2));

            if (totalHours > otThreshold) {
                otHours = Number((totalHours - otThreshold).toFixed(2));
            }

            return {
                totalHours,
                otHours,
                workUnits,
                units1,
                units2,
                hours1,
                hours2
            };
        } else {
            // Chế độ 1 ca liền mạch
            const inMins = parseTimeToMinutes(timeInStr);
            const outMins = parseTimeToMinutes(timeOutStr);

            if (inMins !== null && outMins !== null) {
                let diff = outMins - inMins;
                if (diff < 0) diff = 0;

                // Quy tắc: Chỉ trừ 30 phút giờ ăn khi người dùng chủ động tích chọn
                const shouldDeductLunch = (hasLunchBreak === true);

                let workMins = diff;
                if (shouldDeductLunch && diff >= 30) {
                    workMins = diff - 30;
                }

                totalMinutes = workMins;
                totalHours = Number((totalMinutes / 60).toFixed(2));

                if (totalHours > otThreshold) {
                    otHours = Number((totalHours - otThreshold).toFixed(2));
                }

                // Work unit (Số công):
                if (shouldDeductLunch) {
                    if (totalHours >= stdHours && diff >= 510) {
                        workUnits = 1.0;
                    } else if (totalHours >= halfHours) {
                        workUnits = 0.5;
                    } else if (totalHours > 0) {
                        workUnits = Number((totalHours / stdHours).toFixed(2));
                    }
                } else {
                    if (totalHours >= stdHours) {
                        workUnits = 1.0;
                    } else if (totalHours >= halfHours) {
                        workUnits = 0.5;
                    } else if (totalHours > 0) {
                        workUnits = Number((totalHours / stdHours).toFixed(2));
                    }
                }
            }
        }

        return {
            totalHours,
            otHours,
            workUnits
        };
    }

    function formatMoney(amount) {
        return new Intl.NumberFormat('vi-VN').format(Math.round(amount || 0));
    }

    function formatDateVN(dateStr) {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    }

    function getDateObj(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    function padZero(num) {
        return num < 10 ? '0' + num : num;
    }

    function getISODate(d) {
        return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
    }

    // ==========================================
    // RENDER FUNCTIONS
    // ==========================================
    function renderAll() {
        updatePeriodHeader();
        renderKPIs();

        if (state.currentView === 'calendar') {
            renderCalendar();
        } else if (state.currentView === 'table') {
            renderTable();
        } else if (state.currentView === 'stats') {
            renderCharts();
        }
    }

    function updatePeriodHeader() {
        DOM.periodText.textContent = `Tháng ${padZero(state.currentMonth + 1)} / ${state.currentYear}`;
    }

    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function getMonthRecords() {
        const result = [];
        const daysInMonth = getDaysInMonth(state.currentYear, state.currentMonth);

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${state.currentYear}-${padZero(state.currentMonth + 1)}-${padZero(day)}`;
            const rec = state.records[dateStr] || {
                date: dateStr,
                timeIn: '',
                timeOut: '',
                isSplitShift: false,
                timeIn2: '',
                timeOut2: '',
                hasLunchBreak: false,
                totalHours: 0,
                otHours: 0,
                workUnits: 0,
                status: 'missing',
                note: ''
            };
            result.push(rec);
        }
        return result;
    }

    function renderKPIs() {
        const monthRecords = getMonthRecords();
        let totalShifts = 0;
        let workDaysCount = 0;
        let totalHours = 0;
        let totalOT = 0;
        let otDaysCount = 0;

        monthRecords.forEach(r => {
            if (r.workUnits > 0 || r.totalHours > 0 || r.status === 'worked' || r.status === 'leave_paid' || r.status === 'holiday') {
                totalShifts += (r.workUnits || 0);
                if (r.totalHours > 0 || r.workUnits > 0) workDaysCount++;
            }
            totalHours += (r.totalHours || 0);
            if (r.otHours > 0) {
                totalOT += r.otHours;
                otDaysCount++;
            }
        });

        totalShifts = Number(totalShifts.toFixed(2));
        totalHours = Number(totalHours.toFixed(1));
        totalOT = Number(totalOT.toFixed(1));

        const avgHours = workDaysCount > 0 ? (totalHours / workDaysCount).toFixed(1) : 0;

        // Salary estimation based on monthly salary and standard work days
        const monthlySalary = parseFloat(state.settings.monthlySalary) || 0;
        const standardDays = parseFloat(state.settings.standardDays) || 26;
        const stdHours = parseFloat(state.settings.standardHours) || 8;
        const otMult = parseFloat(state.settings.otMultiplier) || 1.5;
        const allowance = parseFloat(state.settings.allowance) || 0;

        const dailyRate = standardDays > 0 ? Math.round(monthlySalary / standardDays) : 0;
        const hourlyRate = stdHours > 0 ? Math.round(dailyRate / stdHours) : 0;

        const insurance = parseFloat(state.settings.insurance) || 0;
        const unionFee = parseFloat(state.settings.unionFee) || 0;

        const baseSalary = totalShifts * dailyRate;
        const otSalary = totalOT * hourlyRate * otMult;
        const totalSalary = baseSalary + otSalary + allowance;
        const netSalary = Math.max(0, totalSalary - insurance - unionFee);

        // Render Values
        if (DOM.kpiWorkDays) DOM.kpiWorkDays.textContent = workDaysCount;
        if (DOM.kpiStandardDays) DOM.kpiStandardDays.textContent = `/ ${standardDays} ngày tính công`;
        if (DOM.kpiTotalShiftsSub) DOM.kpiTotalShiftsSub.textContent = `Tích lũy: ${totalShifts} công`;
        
        // Progress based on standard workdays
        const shiftPercent = Math.min(100, Math.round((totalShifts / standardDays) * 100));
        DOM.kpiShiftProgress.style.width = `${shiftPercent}%`;

        DOM.kpiTotalHours.textContent = totalHours;
        DOM.kpiAvgHours.textContent = `TB: ${avgHours}h/ngày`;

        DOM.kpiTotalOT.textContent = totalOT;
        DOM.kpiOtDays.textContent = `${otDaysCount} ngày OT`;

        DOM.kpiTotalSalary.textContent = formatMoney(totalSalary);
        DOM.kpiSalarySub.textContent = `${formatMoney(dailyRate)}đ/công (${formatMoney(monthlySalary)}đ/${standardDays}công)`;

        if (DOM.kpiNetSalary) {
            DOM.kpiNetSalary.textContent = formatMoney(netSalary);
        }
        if (DOM.kpiNetSalarySub) {
            let deductDetail = '';
            if (insurance > 0 || unionFee > 0) {
                deductDetail = `- ${formatMoney(insurance + unionFee)}đ (BH + Quỹ)`;
            } else {
                deductDetail = `= Tạm tính - BH - Quỹ`;
            }
            DOM.kpiNetSalarySub.textContent = deductDetail;
        }
    }

    // ==========================================
    // CALENDAR VIEW
    // ==========================================
    function renderCalendar() {
        DOM.calendarGrid.innerHTML = '';

        const year = state.currentYear;
        const month = state.currentMonth;
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon...
        
        // Convert to Monday-first (0 is Mon, 6 is Sun)
        const startOffset = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);
        const daysInMonth = getDaysInMonth(year, month);
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const todayStr = getISODate(new Date());

        // Previous Month Days (Padding)
        for (let i = startOffset - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            const cell = createCalendarCell({
                dayNumber: dayNum,
                isOtherMonth: true,
                dateStr: null
            });
            DOM.calendarGrid.appendChild(cell);
        }

        // Current Month Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${padZero(month + 1)}-${padZero(day)}`;
            const rec = state.records[dateStr];
            const isToday = (dateStr === todayStr);

            const cell = createCalendarCell({
                dayNumber: day,
                isOtherMonth: false,
                dateStr: dateStr,
                record: rec,
                isToday: isToday
            });
            DOM.calendarGrid.appendChild(cell);
        }

        // Next Month Days (Padding to fill row)
        const totalCells = startOffset + daysInMonth;
        const remainingCells = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= remainingCells; i++) {
            const cell = createCalendarCell({
                dayNumber: i,
                isOtherMonth: true,
                dateStr: null
            });
            DOM.calendarGrid.appendChild(cell);
        }
    }

    function createCalendarCell({ dayNumber, isOtherMonth, dateStr, record, isToday }) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';

        if (isOtherMonth) {
            cell.classList.add('other-month');
            cell.innerHTML = `<div class="cell-top"><span class="cell-date">${dayNumber}</span></div>`;
            return cell;
        }

        if (isToday) cell.classList.add('today');

        if (state.statusFilter !== 'all' && !isOtherMonth) {
            if (!matchesFilter(record)) {
                cell.classList.add('filter-dimmed');
            }
        }

        let badgeHtml = '';
        let middleHtml = '';
        let noteHtml = '';

        if (record && (record.timeIn || record.timeOut || record.status !== 'missing')) {
            if (record.status === 'leave_paid') {
                cell.classList.add('is-leave');
                badgeHtml = `<span class="cell-badge badge-leave">Nghỉ phép</span>`;
                middleHtml = `<div class="cell-times text-danger"><i class="fa-solid fa-umbrella-beach"></i> Nghỉ có lương</div>`;
            } else if (record.status === 'leave_unpaid') {
                cell.classList.add('is-off');
                badgeHtml = `<span class="cell-badge badge-leave">Nghỉ ko lương</span>`;
                middleHtml = `<div class="cell-times text-danger"><i class="fa-solid fa-ban"></i> Nghỉ không lương</div>`;
            } else if (record.status === 'holiday') {
                cell.classList.add('is-holiday');
                badgeHtml = `<span class="cell-badge badge-holiday">Nghỉ lễ / Tết</span>`;
                middleHtml = `<div class="cell-times text-danger"><i class="fa-solid fa-flag"></i> Nghỉ lễ</div>`;
            } else if (record.status === 'off') {
                cell.classList.add('is-off');
                badgeHtml = `<span class="cell-badge badge-leave">Nghỉ tuần</span>`;
                middleHtml = `<div class="cell-times text-danger"><i class="fa-solid fa-bed"></i> Ngày nghỉ</div>`;
            } else if (record.totalHours > 0 || record.timeIn) {
                cell.classList.add('has-data');
                
                const units = Number(record.workUnits || 0);
                if (units === 0.5 || (units > 0 && units < 1.0)) {
                    cell.classList.add('is-half-day');
                } else if (units >= 1.0) {
                    cell.classList.add('is-full-day');
                }
                
                if (record.otHours > 0) {
                    cell.classList.add('has-ot');
                    badgeHtml = `<span class="cell-badge badge-ot">+${record.otHours}h OT</span>`;
                } else if (units === 0.5) {
                    badgeHtml = `<span class="cell-badge badge-half">0.5 công</span>`;
                } else {
                    badgeHtml = `<span class="cell-badge badge-full">${record.workUnits || 1.0} công</span>`;
                }

                let timeDisplay = `${record.timeIn || '--:--'} - ${record.timeOut || '--:--'}`;
                let iconShift = 'fa-regular fa-clock';
                if (record.isSplitShift) {
                    timeDisplay = `${record.timeIn}-${record.timeOut}, ${record.timeIn2}-${record.timeOut2}`;
                    iconShift = 'fa-solid fa-code-fork text-primary';
                }

                middleHtml = `
                    <div class="cell-times">
                        <i class="${iconShift}"></i> ${timeDisplay}
                    </div>
                    <div class="cell-hours">${record.totalHours || 0} giờ</div>
                `;
            }

            if (record.note) {
                noteHtml = `<div class="cell-note" title="${escapeHtml(record.note)}"><i class="fa-regular fa-comment-dots"></i> ${escapeHtml(record.note)}</div>`;
            }
        }

        cell.innerHTML = `
            <div class="cell-top">
                <span class="cell-date">${dayNumber}</span>
                ${badgeHtml}
            </div>
            <div class="cell-middle">
                ${middleHtml}
            </div>
            ${noteHtml}
        `;

        cell.addEventListener('click', () => {
            openEntryModal(dateStr);
        });

        return cell;
    }

    // ==========================================
    // TABLE VIEW
    // ==========================================
    function renderTable() {
        DOM.timesheetTableBody.innerHTML = '';
        const monthRecords = getMonthRecords();
        const todayStr = getISODate(new Date());

        let displayedCount = 0;

        monthRecords.forEach(rec => {
            const dateObj = getDateObj(rec.date);
            const dayOfWeekIndex = dateObj.getDay();
            const dayName = DAY_NAMES[dayOfWeekIndex];
            const isWeekend = (dayOfWeekIndex === 0 || dayOfWeekIndex === 6);
            const isToday = (rec.date === todayStr);

            // Filter status
            if (!matchesFilter(rec)) return;

            displayedCount++;
            const tr = document.createElement('tr');
            if (isToday) tr.classList.add('row-today');
            if (isWeekend) tr.classList.add('row-weekend');
            if (rec.status === 'worked' || rec.totalHours > 0) {
                if (rec.workUnits === 0.5 || (rec.workUnits > 0 && rec.workUnits < 1.0)) {
                    tr.classList.add('row-half-day');
                } else if (rec.workUnits >= 1.0) {
                    tr.classList.add('row-full-day');
                }
            }

            let statusBadge = '<span class="table-badge badge-off">Chưa chấm</span>';
            if (rec.status === 'worked') {
                if (rec.isSplitShift) {
                    statusBadge = '<span class="table-badge badge-worked"><i class="fa-solid fa-code-fork"></i> Cắt ca (Sáng + Chiều)</span>';
                } else if (rec.otHours > 0) {
                    statusBadge = '<span class="table-badge badge-ot">Đi làm (Có OT)</span>';
                } else {
                    statusBadge = '<span class="table-badge badge-worked">Đi làm</span>';
                }
            } else if (rec.status === 'leave_paid') {
                statusBadge = '<span class="table-badge badge-leave-paid">Nghỉ phép (Có lương)</span>';
            } else if (rec.status === 'leave_unpaid') {
                statusBadge = '<span class="table-badge badge-leave-unpaid">Nghỉ không lương</span>';
            } else if (rec.status === 'holiday') {
                statusBadge = '<span class="table-badge badge-holiday">Nghỉ lễ / Tết</span>';
            } else if (rec.status === 'off') {
                statusBadge = '<span class="table-badge badge-off">Ngày nghỉ</span>';
            }

            let inCol = rec.timeIn ? `<i class="fa-solid fa-arrow-right-to-bracket text-success"></i> ${rec.timeIn}` : '<span class="text-muted">--:--</span>';
            let outCol = rec.timeOut ? `<i class="fa-solid fa-arrow-right-from-bracket text-danger"></i> ${rec.timeOut}` : '<span class="text-muted">--:--</span>';
            
            if (rec.isSplitShift) {
                inCol = `<div><span class="text-primary font-weight-bold">S:</span> ${rec.timeIn || '--:--'}</div><div><span class="text-warning font-weight-bold">C:</span> ${rec.timeIn2 || '--:--'}</div>`;
                outCol = `<div>${rec.timeOut || '--:--'}</div><div>${rec.timeOut2 || '--:--'}</div>`;
            }

            tr.innerHTML = `
                <td><strong>${formatDateVN(rec.date)}</strong></td>
                <td><span class="${isWeekend ? 'text-warning font-weight-bold' : ''}">${dayName}</span></td>
                <td>${inCol}</td>
                <td>${outCol}</td>
                <td><strong>${rec.totalHours ? rec.totalHours + 'h' : '-'}</strong></td>
                <td>${rec.otHours > 0 ? `<strong class="text-warning">+${rec.otHours}h</strong>` : '-'}</td>
                <td><strong class="text-primary">${rec.workUnits > 0 ? rec.workUnits : '-'}</strong></td>
                <td>${statusBadge}</td>
                <td class="cell-note-text">${escapeHtml(rec.note || '')}</td>
                <td style="text-align: center;">
                    <button class="btn-icon btn-sm" title="Chỉnh sửa" onclick="window.chamCongApp.openDate('${rec.date}')">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                </td>
            `;

            DOM.timesheetTableBody.appendChild(tr);
        });

        if (displayedCount === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="10" style="text-align: center; padding: 2rem; color: var(--text-muted);">Không tìm thấy bản ghi nào khớp với bộ lọc</td>`;
            DOM.timesheetTableBody.appendChild(tr);
        }
    }

    function matchesFilter(rec) {
        if (!rec) {
            return state.statusFilter === 'all' || state.statusFilter === 'missing';
        }
        if (state.statusFilter === 'all') return true;
        if (state.statusFilter === 'worked') {
            return (rec.status === 'worked' || (rec.totalHours && rec.totalHours > 0) || (rec.timeIn && rec.timeIn !== ''));
        }
        if (state.statusFilter === 'ot') return (rec.otHours && rec.otHours > 0);
        if (state.statusFilter === 'leave_paid') return (rec.status === 'leave_paid');
        if (state.statusFilter === 'leave_unpaid') return (rec.status === 'leave_unpaid');
        if (state.statusFilter === 'holiday') return (rec.status === 'holiday');
        if (state.statusFilter === 'missing') {
            return (!rec.timeIn && rec.status !== 'leave_paid' && rec.status !== 'leave_unpaid' && rec.status !== 'holiday' && rec.status !== 'worked' && (!rec.totalHours || rec.totalHours === 0));
        }
        return true;
    }

    // ==========================================
    // STATS & CHARTS VIEW (CANVAS ENGINE)
    // ==========================================
    function renderCharts() {
        const monthRecords = getMonthRecords();
        drawHoursChart(monthRecords);
        drawStatusChart(monthRecords);
        renderBreakdown(monthRecords);
    }

    function drawHoursChart(records) {
        const canvas = DOM.hoursChart;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 240 * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = 240;
        ctx.clearRect(0, 0, width, height);

        const padding = { top: 30, right: 20, bottom: 40, left: 40 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        // Max hours finding
        const maxVal = Math.max(12, ...records.map(r => r.totalHours || 0));

        // Draw Grid Lines & Y Axis
        ctx.strokeStyle = state.theme === 'theme-dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        ctx.fillStyle = state.theme === 'theme-dark' ? '#94a3b8' : '#64748b';
        ctx.font = '11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'right';

        const yTicks = 4;
        for (let i = 0; i <= yTicks; i++) {
            const val = (maxVal / yTicks) * i;
            const y = padding.top + chartH - (val / maxVal) * chartH;
            
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            ctx.fillText(`${Math.round(val)}h`, padding.left - 8, y + 4);
        }

        // Draw Bars
        const barWidth = Math.max(6, Math.min(22, (chartW / records.length) - 4));
        const gap = chartW / records.length;

        records.forEach((r, idx) => {
            const h = r.totalHours || 0;
            const barH = (h / maxVal) * chartH;
            const x = padding.left + (idx * gap) + (gap - barWidth) / 2;
            const y = padding.top + chartH - barH;

            // Bar Gradient
            const grad = ctx.createLinearGradient(0, y, 0, padding.top + chartH);
            if (r.otHours > 0) {
                grad.addColorStop(0, '#f59e0b');
                grad.addColorStop(1, '#d97706');
            } else if (h > 0) {
                grad.addColorStop(0, '#6366f1');
                grad.addColorStop(1, '#4338ca');
            } else {
                grad.addColorStop(0, 'rgba(100,116,139,0.2)');
                grad.addColorStop(1, 'rgba(100,116,139,0.1)');
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            if (barH > 4) {
                ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
            } else {
                ctx.rect(x, padding.top + chartH - 2, barWidth, 2);
            }
            ctx.fill();

            // X axis day labels
            const dayNum = idx + 1;
            if (records.length <= 15 || dayNum % 2 === 1 || dayNum === records.length) {
                ctx.fillStyle = state.theme === 'theme-dark' ? '#94a3b8' : '#64748b';
                ctx.font = '10px "Plus Jakarta Sans", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(dayNum, x + barWidth / 2, height - 12);
            }
        });
    }

    function drawStatusChart(records) {
        const canvas = DOM.statusChart;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 240 * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = 240;
        ctx.clearRect(0, 0, width, height);

        // Count status
        let workedCount = 0;
        let otCount = 0;
        let leaveCount = 0;
        let offCount = 0;
        let missingCount = 0;

        records.forEach(r => {
            if (r.otHours > 0) otCount++;
            else if (r.status === 'worked' || r.totalHours > 0) workedCount++;
            else if (r.status === 'leave_paid' || r.status === 'leave_unpaid' || r.status === 'holiday') leaveCount++;
            else if (r.status === 'off') offCount++;
            else missingCount++;
        });

        const total = records.length;
        const data = [
            { label: 'Đủ công', count: workedCount, color: '#10b981' },
            { label: 'Có tăng ca', count: otCount, color: '#f59e0b' },
            { label: 'Nghỉ / Phép', count: leaveCount, color: '#8b5cf6' },
            { label: 'Nghỉ tuần', count: offCount, color: '#64748b' },
            { label: 'Chưa điền', count: missingCount, color: '#334155' }
        ].filter(d => d.count > 0);

        const centerX = width / 3;
        const centerY = height / 2;
        const outerRadius = 75;
        const innerRadius = 45;

        let startAngle = -Math.PI / 2;

        data.forEach(item => {
            const sliceAngle = (item.count / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();
            startAngle += sliceAngle;
        });

        // Legend on the right side
        const legendX = width * 0.6;
        let legendY = 45;
        ctx.textAlign = 'left';

        data.forEach(item => {
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(legendX, legendY + 5, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = state.theme === 'theme-dark' ? '#f3f4f6' : '#0f172a';
            ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(`${item.label}: ${item.count} ngày`, legendX + 15, legendY + 9);

            legendY += 30;
        });
    }

    function renderBreakdown(records) {
        let fullDays = 0;
        let halfDays = 0;
        let totalHours = 0;
        let totalOT = 0;
        let totalShifts = 0;

        records.forEach(r => {
            totalHours += (r.totalHours || 0);
            totalOT += (r.otHours || 0);
            totalShifts += (r.workUnits || 0);
            if (r.workUnits >= 1.0) fullDays++;
            else if (r.workUnits === 0.5) halfDays++;
        });

        const monthlySalary = parseFloat(state.settings.monthlySalary) || 0;
        const standardDays = parseFloat(state.settings.standardDays) || 26;
        const stdHours = parseFloat(state.settings.standardHours) || 8;
        const otMult = parseFloat(state.settings.otMultiplier) || 1.5;
        const allowance = parseFloat(state.settings.allowance) || 0;
        const insurance = parseFloat(state.settings.insurance) || 0;
        const unionFee = parseFloat(state.settings.unionFee) || 0;

        const dailyRate = standardDays > 0 ? Math.round(monthlySalary / standardDays) : 0;
        const hourlyRate = stdHours > 0 ? Math.round(dailyRate / stdHours) : 0;

        const baseMoney = totalShifts * dailyRate;
        const otMoney = totalOT * hourlyRate * otMult;
        const grandTotal = baseMoney + otMoney + allowance;
        const netTotal = Math.max(0, grandTotal - insurance - unionFee);

        DOM.breakdownGrid.innerHTML = `
            <div class="breakdown-item">
                <span class="breakdown-title">Tổng số công tích lũy</span>
                <span class="breakdown-value text-primary">${totalShifts.toFixed(2)} công</span>
                <small class="form-hint">${fullDays} ngày trọn vẹn, ${halfDays} ngày nửa buổi</small>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-title">Lương theo ngày công</span>
                <span class="breakdown-value text-success">${formatMoney(baseMoney)} đ</span>
                <small class="form-hint">${totalShifts.toFixed(2)} công x ${formatMoney(dailyRate)} đ/công</small>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-title">Tiền tăng ca (OT)</span>
                <span class="breakdown-value text-warning">${formatMoney(otMoney)} đ</span>
                <small class="form-hint">${totalOT.toFixed(1)}h OT x ${formatMoney(hourlyRate)}đ/h x hệ số ${otMult}</small>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-title">Phụ cấp & Thưởng thêm</span>
                <span class="breakdown-value">${formatMoney(allowance)} đ</span>
                <small class="form-hint">Khoản cộng thêm</small>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-title">Tạm tính tổng thu nhập (Gross)</span>
                <span class="breakdown-value text-warning" style="font-size: 1.25rem;">${formatMoney(grandTotal)} đ</span>
                <small class="form-hint">Lương công + Tăng ca + Phụ cấp</small>
            </div>
            <div class="breakdown-item" style="border-color: rgba(239, 68, 68, 0.4);">
                <span class="breakdown-title">Các khoản trích trừ lương</span>
                <span class="breakdown-value text-danger">-${formatMoney(insurance + unionFee)} đ</span>
                <small class="form-hint">Bảo hiểm: -${formatMoney(insurance)}đ | Quỹ đoàn: -${formatMoney(unionFee)}đ</small>
            </div>
            <div class="breakdown-item" style="border-color: var(--success); grid-column: 1 / -1;">
                <span class="breakdown-title">TỔNG THU NHẬP THỰC NHẬN (THỰC LĨNH)</span>
                <span class="breakdown-value text-success" style="font-size: 1.55rem;">${formatMoney(netTotal)} đ</span>
                <small class="form-hint">= Tạm tính (${formatMoney(grandTotal)}đ) - Bảo hiểm (${formatMoney(insurance)}đ) - Quỹ đoàn (${formatMoney(unionFee)}đ)</small>
            </div>
        `;
    }

    // ==========================================
    // AUTO CALCULATE TIME OUT (4H / 8H)
    // ==========================================
    function updateAutoOutCalculation(source = 'toggle') {
        if (!DOM.chkAutoOut4h || !DOM.chkAutoOut8h || !DOM.timeIn || !DOM.timeOut) return;

        const is4h = DOM.chkAutoOut4h.checked;
        const is8h = DOM.chkAutoOut8h.checked;

        // Cập nhật class active cho nhãn nút tích
        const lbl4h = DOM.chkAutoOut4h.closest('.auto-calc-label');
        const lbl8h = DOM.chkAutoOut8h.closest('.auto-calc-label');
        if (lbl4h) lbl4h.classList.toggle('active', is4h);
        if (lbl8h) lbl8h.classList.toggle('active', is8h);

        if (!is4h && !is8h) {
            // Không tích: Chế độ tự ghi Giờ ra
            if (DOM.autoOutBadge) DOM.autoOutBadge.style.display = 'none';
            if (DOM.autoOutHint) {
                DOM.autoOutHint.innerHTML = '<i class="fa-solid fa-pen text-secondary"></i> <span>Chế độ tự ghi: Bạn có thể tự do chỉnh sửa Giờ ra.</span>';
            }
            return;
        }

        const inVal = DOM.timeIn.value;
        if (!inVal) return;

        let addMinutes = 0;
        let badgeHtml = '';

        if (is4h) {
            addMinutes = 4 * 60; // 4 tiếng = 240 phút
            badgeHtml = '<i class="fa-solid fa-bolt"></i> Tự động +4h';
            const outVal = addMinutesToTime(inVal, addMinutes);
            DOM.timeOut.value = outVal;
            if (DOM.autoOutHint) {
                DOM.autoOutHint.innerHTML = `<i class="fa-solid fa-circle-check text-info"></i> <span>Tự động: Giờ ra = ${inVal} + 4 tiếng (${outVal})</span>`;
            }
        } else if (is8h) {
            const hasLunch = DOM.chkLunchBreak ? DOM.chkLunchBreak.checked : false;
            addMinutes = hasLunch ? (8 * 60 + 30) : (8 * 60); // 510 phút nếu có 30p ăn trưa, 480 phút nếu không
            badgeHtml = hasLunch ? '<i class="fa-solid fa-bolt"></i> Tự động +8h30' : '<i class="fa-solid fa-bolt"></i> Tự động +8h';
            const outVal = addMinutesToTime(inVal, addMinutes);
            DOM.timeOut.value = outVal;
            if (DOM.autoOutHint) {
                DOM.autoOutHint.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> <span>Tự động: Giờ ra = ${inVal} + ${hasLunch ? '8.5' : '8'} tiếng (${outVal})</span>`;
            }
        }

        if (DOM.autoOutBadge) {
            DOM.autoOutBadge.innerHTML = badgeHtml;
            DOM.autoOutBadge.style.display = 'inline-flex';
        }

        updateLivePreview();
    }

    function initAutoOutForEntry(rec) {
        if (!DOM.chkAutoOut4h || !DOM.chkAutoOut8h) return;

        if (rec && rec.autoOutDuration === '4') {
            DOM.chkAutoOut4h.checked = true;
            DOM.chkAutoOut8h.checked = false;
        } else if (rec && rec.autoOutDuration === '8') {
            DOM.chkAutoOut4h.checked = false;
            DOM.chkAutoOut8h.checked = true;
        } else if (rec && rec.autoOutDuration === 'manual') {
            DOM.chkAutoOut4h.checked = false;
            DOM.chkAutoOut8h.checked = false;
        } else if (rec && rec.timeIn && rec.timeOut) {
            const inMins = parseTimeToMinutes(rec.timeIn);
            const outMins = parseTimeToMinutes(rec.timeOut);
            const diff = (inMins !== null && outMins !== null) ? (outMins - inMins) : 0;
            if (diff === 240) {
                DOM.chkAutoOut4h.checked = true;
                DOM.chkAutoOut8h.checked = false;
            } else if (diff === 480 || (rec.hasLunchBreak && diff === 510)) {
                DOM.chkAutoOut4h.checked = false;
                DOM.chkAutoOut8h.checked = true;
            } else {
                DOM.chkAutoOut4h.checked = false;
                DOM.chkAutoOut8h.checked = false;
            }
        } else {
            DOM.chkAutoOut4h.checked = false;
            DOM.chkAutoOut8h.checked = false;
        }

        updateAutoOutCalculation('init');
    }

    function updateBulkAutoOutCalculation() {
        if (!DOM.bulkAutoOut4h || !DOM.bulkAutoOut8h || !DOM.bulkIn || !DOM.bulkOut) return;

        const is4h = DOM.bulkAutoOut4h.checked;
        const is8h = DOM.bulkAutoOut8h.checked;

        const lbl4h = DOM.bulkAutoOut4h.closest('.auto-calc-label');
        const lbl8h = DOM.bulkAutoOut8h.closest('.auto-calc-label');
        if (lbl4h) lbl4h.classList.toggle('active', is4h);
        if (lbl8h) lbl8h.classList.toggle('active', is8h);

        if (!is4h && !is8h) {
            if (DOM.bulkAutoOutBadge) DOM.bulkAutoOutBadge.style.display = 'none';
            return;
        }

        const inVal = DOM.bulkIn.value;
        if (!inVal) return;

        let addMinutes = 0;
        let badgeHtml = '';

        if (is4h) {
            addMinutes = 4 * 60;
            badgeHtml = '<i class="fa-solid fa-bolt"></i> Tự động +4h';
        } else if (is8h) {
            const hasLunch = DOM.bulkLunchBreak ? DOM.bulkLunchBreak.checked : false;
            addMinutes = hasLunch ? (8 * 60 + 30) : (8 * 60);
            badgeHtml = hasLunch ? '<i class="fa-solid fa-bolt"></i> Tự động +8h30' : '<i class="fa-solid fa-bolt"></i> Tự động +8h';
        }

        DOM.bulkOut.value = addMinutesToTime(inVal, addMinutes);
        if (DOM.bulkAutoOutBadge) {
            DOM.bulkAutoOutBadge.innerHTML = badgeHtml;
            DOM.bulkAutoOutBadge.style.display = 'inline-flex';
        }
    }

    // ==========================================
    // MODAL DIALOGS & FORM HANDLING
    // ==========================================
    function openEntryModal(dateStr) {
        const dateObj = getDateObj(dateStr);
        const dayOfWeekIndex = dateObj.getDay();
        
        DOM.modalDateTitle.textContent = `Chấm Công Ngày: ${formatDateVN(dateStr)}`;
        DOM.modalDateSubtitle.textContent = `${DAY_NAMES[dayOfWeekIndex]}`;
        DOM.entryDate.value = dateStr;

        const rec = state.records[dateStr] || {
            timeIn: '08:00',
            timeOut: '17:00',
            isSplitShift: false,
            timeIn2: '13:00',
            timeOut2: '17:00',
            status: 'worked',
            hasLunchBreak: false,
            note: ''
        };

        const isSplit = !!rec.isSplitShift;
        if (DOM.chkSplitShift) DOM.chkSplitShift.checked = isSplit;

        if (DOM.singleShiftBox) DOM.singleShiftBox.style.display = isSplit ? 'none' : 'block';
        if (DOM.splitShiftBox) DOM.splitShiftBox.style.display = isSplit ? 'block' : 'none';

        if (isSplit) {
            if (DOM.timeIn1) DOM.timeIn1.value = rec.timeIn || '08:00';
            if (DOM.timeOut1) DOM.timeOut1.value = rec.timeOut || '12:00';
            if (DOM.timeIn2) DOM.timeIn2.value = rec.timeIn2 || '13:00';
            if (DOM.timeOut2) DOM.timeOut2.value = rec.timeOut2 || '17:00';
        } else {
            if (DOM.timeIn) DOM.timeIn.value = rec.timeIn || '08:00';
            if (DOM.timeOut) DOM.timeOut.value = rec.timeOut || '17:00';
            if (DOM.chkLunchBreak) {
                DOM.chkLunchBreak.checked = !!rec.hasLunchBreak;
            }
            // Khởi tạo trạng thái nút tích Tính tự động Giờ ra
            initAutoOutForEntry(rec);
        }

        DOM.dayStatus.value = rec.status === 'missing' ? 'worked' : rec.status;
        DOM.workNote.value = rec.note || '';

        updateLivePreview();
        DOM.entryModal.classList.add('show');
    }

    function closeEntryModal() {
        DOM.entryModal.classList.remove('show');
    }

    function updateLivePreview() {
        const isSplit = DOM.chkSplitShift ? DOM.chkSplitShift.checked : false;
        const statusVal = DOM.dayStatus ? DOM.dayStatus.value : 'worked';
        let metrics;

        if (isSplit) {
            const in1 = DOM.timeIn1 ? DOM.timeIn1.value : '08:00';
            const out1 = DOM.timeOut1 ? DOM.timeOut1.value : '12:00';
            const in2 = DOM.timeIn2 ? DOM.timeIn2.value : '13:00';
            const out2 = DOM.timeOut2 ? DOM.timeOut2.value : '17:00';
            metrics = calculateDayMetrics(in1, out1, statusVal, false, true, in2, out2);
        } else {
            const timeInVal = DOM.timeIn ? DOM.timeIn.value : '';
            const timeOutVal = DOM.timeOut ? DOM.timeOut.value : '';
            const hasLunchBreakVal = DOM.chkLunchBreak ? DOM.chkLunchBreak.checked : false;
            metrics = calculateDayMetrics(timeInVal, timeOutVal, statusVal, hasLunchBreakVal, false);
        }

        DOM.previewTotalHours.textContent = `${metrics.totalHours} giờ`;
        DOM.previewOTHours.textContent = `${metrics.otHours} giờ`;
        if (isSplit && metrics.units1 !== undefined && metrics.units2 !== undefined) {
            DOM.previewWorkUnits.innerHTML = `${metrics.workUnits} công <small style="font-size:0.82rem; font-weight:500; opacity:0.9;">(${metrics.units1}c + ${metrics.units2}c)</small>`;
        } else {
            DOM.previewWorkUnits.textContent = `${metrics.workUnits} công`;
        }
    }

    function handleSaveEntry(e) {
        e.preventDefault();
        const dateStr = DOM.entryDate.value;
        if (!dateStr) return;

        const isSplit = DOM.chkSplitShift ? DOM.chkSplitShift.checked : false;
        const statusVal = DOM.dayStatus.value;
        const noteVal = DOM.workNote.value.trim();

        let timeInVal = '';
        let timeOutVal = '';
        let timeIn2Val = '';
        let timeOut2Val = '';
        let hasLunchBreakVal = false;
        let autoOutVal = 'manual';
        let metrics;

        if (isSplit) {
            timeInVal = DOM.timeIn1 ? DOM.timeIn1.value : '08:00';
            timeOutVal = DOM.timeOut1 ? DOM.timeOut1.value : '12:00';
            timeIn2Val = DOM.timeIn2 ? DOM.timeIn2.value : '13:00';
            timeOut2Val = DOM.timeOut2 ? DOM.timeOut2.value : '17:00';
            autoOutVal = null;
            metrics = calculateDayMetrics(timeInVal, timeOutVal, statusVal, false, true, timeIn2Val, timeOut2Val);
        } else {
            timeInVal = DOM.timeIn.value;
            timeOutVal = DOM.timeOut.value;
            hasLunchBreakVal = DOM.chkLunchBreak ? DOM.chkLunchBreak.checked : false;
            if (DOM.chkAutoOut4h && DOM.chkAutoOut4h.checked) {
                autoOutVal = '4';
            } else if (DOM.chkAutoOut8h && DOM.chkAutoOut8h.checked) {
                autoOutVal = '8';
            } else {
                autoOutVal = 'manual';
            }
            metrics = calculateDayMetrics(timeInVal, timeOutVal, statusVal, hasLunchBreakVal, false);
        }

        state.records[dateStr] = {
            date: dateStr,
            timeIn: timeInVal,
            timeOut: timeOutVal,
            isSplitShift: isSplit,
            timeIn2: timeIn2Val,
            timeOut2: timeOut2Val,
            hasLunchBreak: hasLunchBreakVal,
            autoOutDuration: autoOutVal,
            totalHours: metrics.totalHours,
            otHours: metrics.otHours,
            workUnits: metrics.workUnits,
            status: statusVal,
            note: noteVal
        };

        saveRecords();
        closeEntryModal();
        renderAll();
        showToast(`Đã lưu chấm công ngày ${formatDateVN(dateStr)}`, 'success');
    }

    function handleDeleteEntry() {
        const dateStr = DOM.entryDate.value;
        if (!dateStr || !state.records[dateStr]) {
            closeEntryModal();
            return;
        }

        if (confirm(`Bạn có chắc muốn xóa dữ liệu chấm công ngày ${formatDateVN(dateStr)}?`)) {
            delete state.records[dateStr];
            saveRecords();
            closeEntryModal();
            renderAll();
            showToast(`Đã xóa dữ liệu ngày ${formatDateVN(dateStr)}`, 'info');
        }
    }

    // ==========================================
    // SETTINGS MODAL & WAGE CALCULATOR
    // ==========================================
    function updateWageCalculator() {
        const monthlySalary = parseFloat(DOM.cfgMonthlySalary?.value) || 0;
        const standardDays = parseFloat(DOM.cfgStandardDays?.value) || 1;
        const stdHours = parseFloat(DOM.cfgStandardHours?.value) || 8;

        const dailyRate = standardDays > 0 ? Math.round(monthlySalary / standardDays) : 0;
        const hourlyRate = stdHours > 0 ? Math.round(dailyRate / stdHours) : 0;

        if (DOM.lblDailyWageResult) {
            DOM.lblDailyWageResult.textContent = `${formatMoney(dailyRate)} đ / công`;
        }
        if (DOM.lblHourlyWageResult) {
            DOM.lblHourlyWageResult.textContent = `${formatMoney(hourlyRate)} đ / giờ`;
        }
        if (DOM.lblWageFormulaDesc) {
            DOM.lblWageFormulaDesc.textContent = `${formatMoney(monthlySalary)} đ ÷ ${standardDays} công = ${formatMoney(dailyRate)} đ/ngày`;
        }
    }

    function openSettingsModal() {
        if (DOM.cfgMonthlySalary) DOM.cfgMonthlySalary.value = state.settings.monthlySalary || 7800000;
        if (DOM.cfgStandardDays) DOM.cfgStandardDays.value = state.settings.standardDays || 26;
        if (DOM.cfgStandardHours) DOM.cfgStandardHours.value = state.settings.standardHours || 8;
        if (DOM.cfgHalfDayHours) DOM.cfgHalfDayHours.value = state.settings.halfDayHours || 4;
        if (DOM.cfgOtThreshold) DOM.cfgOtThreshold.value = state.settings.otThreshold || 8;
        if (DOM.cfgOtRateMultiplier) DOM.cfgOtRateMultiplier.value = state.settings.otMultiplier || 1.5;
        if (DOM.cfgAllowance) DOM.cfgAllowance.value = state.settings.allowance || 0;
        if (DOM.cfgInsurance) DOM.cfgInsurance.value = state.settings.insurance || 0;
        if (DOM.cfgUnionFee) DOM.cfgUnionFee.value = state.settings.unionFee || 0;

        updateWageCalculator();
        DOM.settingsModal.classList.add('show');
    }

    function closeSettingsModal() {
        DOM.settingsModal.classList.remove('show');
    }

    function handleSaveSettings(e) {
        e.preventDefault();
        state.settings.monthlySalary = parseFloat(DOM.cfgMonthlySalary?.value) || 0;
        state.settings.standardDays = parseFloat(DOM.cfgStandardDays?.value) || 26;
        state.settings.standardHours = parseFloat(DOM.cfgStandardHours?.value) || 8;
        state.settings.halfDayHours = parseFloat(DOM.cfgHalfDayHours?.value) || 4;
        state.settings.otThreshold = parseFloat(DOM.cfgOtThreshold?.value) || 8;
        state.settings.otMultiplier = parseFloat(DOM.cfgOtRateMultiplier?.value) || 1.5;
        state.settings.allowance = parseFloat(DOM.cfgAllowance?.value) || 0;
        state.settings.insurance = parseFloat(DOM.cfgInsurance?.value) || 0;
        state.settings.unionFee = parseFloat(DOM.cfgUnionFee?.value) || 0;

        // Recalculate existing records with new standard rules
        Object.keys(state.records).forEach(dateStr => {
            const r = state.records[dateStr];
            if (r.isSplitShift) {
                const metrics = calculateDayMetrics(r.timeIn, r.timeOut, r.status, false, true, r.timeIn2, r.timeOut2);
                r.totalHours = metrics.totalHours;
                r.otHours = metrics.otHours;
                r.workUnits = metrics.workUnits;
            } else if (r.timeIn && r.timeOut) {
                const metrics = calculateDayMetrics(r.timeIn, r.timeOut, r.status, r.hasLunchBreak, false);
                r.totalHours = metrics.totalHours;
                r.otHours = metrics.otHours;
                r.workUnits = metrics.workUnits;
            }
        });

        saveSettings();
        saveRecords();
        closeSettingsModal();
        renderAll();
        showToast('Đã lưu cài đặt tiền lương thành công!', 'success');
    }

    // ==========================================
    // BULK FILL (ĐIỀN NHANH HÀNG LOẠT)
    // ==========================================
    function openBulkModal() {
        if (DOM.bulkLunchBreak) DOM.bulkLunchBreak.checked = false;
        if (DOM.bulkShiftType) DOM.bulkShiftType.value = 'admin';
        if (DOM.bulkIn) DOM.bulkIn.value = '08:00';
        if (DOM.bulkOut) DOM.bulkOut.value = '17:00';
        if (DOM.bulkSingleBox) DOM.bulkSingleBox.style.display = 'block';
        if (DOM.bulkSplitBox) DOM.bulkSplitBox.style.display = 'none';
        if (DOM.bulkAutoOut4h) DOM.bulkAutoOut4h.checked = false;
        if (DOM.bulkAutoOut8h) DOM.bulkAutoOut8h.checked = false;
        updateBulkAutoOutCalculation();
        DOM.bulkFillModal.classList.add('show');
    }

    function closeBulkModal() {
        DOM.bulkFillModal.classList.remove('show');
    }

    function handleBulkFill(e) {
        e.preventDefault();
        const shiftType = DOM.bulkShiftType ? DOM.bulkShiftType.value : 'admin';
        const isSplit = (shiftType === 'split');
        const overwrite = DOM.bulkOverwrite.checked;

        let timeIn = '08:00', timeOut = '17:00', timeIn2 = '', timeOut2 = '', hasLunchBreak = false;

        if (isSplit) {
            timeIn = DOM.bulkIn1 ? DOM.bulkIn1.value : '08:00';
            timeOut = DOM.bulkOut1 ? DOM.bulkOut1.value : '12:00';
            timeIn2 = DOM.bulkIn2 ? DOM.bulkIn2.value : '13:00';
            timeOut2 = DOM.bulkOut2 ? DOM.bulkOut2.value : '17:00';
            hasLunchBreak = false;
        } else {
            timeIn = DOM.bulkIn ? DOM.bulkIn.value : '08:00';
            timeOut = DOM.bulkOut ? DOM.bulkOut.value : '17:00';
            hasLunchBreak = DOM.bulkLunchBreak ? DOM.bulkLunchBreak.checked : false;
        }

        const checkedBoxes = Array.from(DOM.bulkFillForm.querySelectorAll('input[name="bulkDay"]:checked'));
        const selectedDaysOfWeek = checkedBoxes.map(cb => parseInt(cb.value, 10));

        if (selectedDaysOfWeek.length === 0) {
            alert('Vui lòng chọn ít nhất 1 ngày trong tuần.');
            return;
        }

        const daysInMonth = getDaysInMonth(state.currentYear, state.currentMonth);
        let filledCount = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${state.currentYear}-${padZero(state.currentMonth + 1)}-${padZero(day)}`;
            const dateObj = new Date(state.currentYear, state.currentMonth, day);
            const dayOfWeek = dateObj.getDay();

            if (selectedDaysOfWeek.includes(dayOfWeek)) {
                if (!overwrite && state.records[dateStr] && state.records[dateStr].timeIn) {
                    continue; // Skip already recorded
                }

                const metrics = isSplit 
                    ? calculateDayMetrics(timeIn, timeOut, 'worked', false, true, timeIn2, timeOut2)
                    : calculateDayMetrics(timeIn, timeOut, 'worked', hasLunchBreak, false);

                state.records[dateStr] = {
                    date: dateStr,
                    timeIn: timeIn,
                    timeOut: timeOut,
                    isSplitShift: isSplit,
                    timeIn2: timeIn2,
                    timeOut2: timeOut2,
                    hasLunchBreak: hasLunchBreak,
                    totalHours: metrics.totalHours,
                    otHours: metrics.otHours,
                    workUnits: metrics.workUnits,
                    status: 'worked',
                    note: state.records[dateStr]?.note || ''
                };
                filledCount++;
            }
        }

        saveRecords();
        closeBulkModal();
        renderAll();
        showToast(`Đã tự động điền ${filledCount} ngày trong tháng!`, 'success');
    }

    // ==========================================
    // EXPORT & BACKUP (EXCEL CSV / JSON)
    // ==========================================
    function exportToExcelCSV() {
        const monthRecords = getMonthRecords();
        let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Vietnamese display
        csvContent += 'BẢNG CHẤM CÔNG VÀ TÍNH GIỜ LÀM VIỆC\r\n';
        csvContent += `Kỳ chấm công: Tháng ${state.currentMonth + 1}/${state.currentYear}\r\n\r\n`;
        csvContent += 'Ngày,Thứ,Ca làm việc,Giờ vào,Giờ ra,Tổng giờ làm,Tăng ca (OT),Số công,Trạng thái,Ghi chú\r\n';

        monthRecords.forEach(r => {
            const dateObj = getDateObj(r.date);
            const dayName = DAY_NAMES[dateObj.getDay()];
            let statusText = 'Chưa chấm';
            if (r.status === 'worked') statusText = r.isSplitShift ? 'Cắt ca (Sáng+Chiều)' : (r.otHours > 0 ? 'Đi làm (OT)' : 'Đi làm');
            else if (r.status === 'leave_paid') statusText = 'Nghỉ phép có lương';
            else if (r.status === 'leave_unpaid') statusText = 'Nghỉ không lương';
            else if (r.status === 'holiday') statusText = 'Nghỉ lễ/Tết';
            else if (r.status === 'off') statusText = 'Nghỉ tuần';

            const cleanNote = (r.note || '').replace(/"/g, '""');
            let shiftName = r.isSplitShift ? 'Cắt ca 2 buổi' : 'Ca liền';
            let inText = r.isSplitShift ? `S:${r.timeIn || ''} | C:${r.timeIn2 || ''}` : (r.timeIn || '');
            let outText = r.isSplitShift ? `S:${r.timeOut || ''} | C:${r.timeOut2 || ''}` : (r.timeOut || '');

            csvContent += `"${formatDateVN(r.date)}","${dayName}","${shiftName}","${inText}","${outText}","${r.totalHours || 0}","${r.otHours || 0}","${r.workUnits || 0}","${statusText}","${cleanNote}"\r\n`;
        });

        // Summary footer
        let totalShifts = 0, totalHours = 0, totalOT = 0;
        monthRecords.forEach(r => {
            totalShifts += (r.workUnits || 0);
            totalHours += (r.totalHours || 0);
            totalOT += (r.otHours || 0);
        });

        csvContent += `\r\n"TỔNG CỘNG","","","","","${totalHours.toFixed(2)}","${totalOT.toFixed(2)}","${totalShifts.toFixed(2)}","",""\r\n`;

        // Financial Breakdown Summary in Excel
        const monthlySalary = parseFloat(state.settings.monthlySalary) || 0;
        const standardDays = parseFloat(state.settings.standardDays) || 26;
        const stdHours = parseFloat(state.settings.standardHours) || 8;
        const otMult = parseFloat(state.settings.otMultiplier) || 1.5;
        const allowance = parseFloat(state.settings.allowance) || 0;
        const insurance = parseFloat(state.settings.insurance) || 0;
        const unionFee = parseFloat(state.settings.unionFee) || 0;

        const dailyRate = standardDays > 0 ? Math.round(monthlySalary / standardDays) : 0;
        const hourlyRate = stdHours > 0 ? Math.round(dailyRate / stdHours) : 0;

        const baseMoney = totalShifts * dailyRate;
        const otMoney = totalOT * hourlyRate * otMult;
        const grossSalary = baseMoney + otMoney + allowance;
        const netSalary = Math.max(0, grossSalary - insurance - unionFee);

        csvContent += `\r\n\r\n`;
        csvContent += `"BẢNG TỔNG HỢP & QUYẾT TOÁN THU NHẬP (VNĐ)",""\r\n`;
        csvContent += `"Mức lương tháng quy định:","${monthlySalary}"\r\n`;
        csvContent += `"Số ngày công chuẩn trong tháng:","${standardDays} công"\r\n`;
        csvContent += `"Đơn giá 1 ngày công:","${dailyRate}"\r\n`;
        csvContent += `"Đơn giá 1 giờ làm:","${hourlyRate}"\r\n`;
        csvContent += `"Tổng số công thực tế tích lũy:","${totalShifts.toFixed(2)} công"\r\n`;
        csvContent += `"Thành tiền lương theo ngày công:","${baseMoney}"\r\n`;
        csvContent += `"Tổng giờ tăng ca (OT):","${totalOT.toFixed(1)} giờ (Hệ số ${otMult})"\r\n`;
        csvContent += `"Thành tiền tăng ca (OT):","${otMoney}"\r\n`;
        csvContent += `"Phụ cấp & Thưởng thêm:","${allowance}"\r\n`;
        csvContent += `"TẠM TÍNH TỔNG THU NHẬP (GROSS):","${grossSalary}"\r\n`;
        csvContent += `"Trừ tiền đóng bảo hiểm (BHXH, BHYT):","-${insurance}"\r\n`;
        csvContent += `"Trừ tiền đóng quỹ đoàn:","-${unionFee}"\r\n`;
        csvContent += `"TỔNG THU NHẬP THỰC NHẬN (NET):","${netSalary}"\r\n`;

        downloadFile(csvContent, `Bang_Cham_Cong_Thang_${state.currentMonth + 1}_${state.currentYear}.csv`, 'text/csv;charset=utf-8;');
        showToast('Đã xuất file Excel (CSV) thành công!', 'success');
    }

    function exportToJSON() {
        const dataToSave = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            settings: state.settings,
            records: state.records
        };
        const jsonStr = JSON.stringify(dataToSave, null, 2);
        downloadFile(jsonStr, `Cham_Cong_Backup_${getISODate(new Date())}.json`, 'application/json');
        showToast('Đã xuất file sao lưu dữ liệu JSON!', 'success');
    }

    function importFromJSON(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (parsed && typeof parsed.records === 'object') {
                    if (confirm('Bạn có chắc muốn khôi phục dữ liệu từ file này? Dữ liệu hiện tại sẽ được đồng bộ gộp.')) {
                        state.records = { ...state.records, ...parsed.records };
                        if (parsed.settings) {
                            state.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
                            saveSettings();
                        }
                        saveRecords();
                        renderAll();
                        showToast('Khôi phục dữ liệu thành công!', 'success');
                    }
                } else {
                    showToast('File JSON không đúng định dạng dữ liệu Chấm Công Pro', 'error');
                }
            } catch (err) {
                showToast('Lỗi khi đọc file JSON', 'error');
            }
        };
        reader.readAsText(file);
    }

    // ==========================================
    // SEAMLESS AUTO-SAVE TO DATABASE.JS (IndexedDB + File System Access)
    // ==========================================
    let autoSaveFileHandle = null;

    async function getHandleFromDB() {
        return new Promise((resolve) => {
            try {
                const req = indexedDB.open('ChamCongAutoSaveDB', 1);
                req.onupgradeneeded = () => req.result.createObjectStore('handles');
                req.onsuccess = () => {
                    const db = req.result;
                    const tx = db.transaction('handles', 'readonly');
                    const store = tx.objectStore('handles');
                    const getReq = store.get('databaseJsHandle');
                    getReq.onsuccess = () => resolve(getReq.result || null);
                    getReq.onerror = () => resolve(null);
                };
                req.onerror = () => resolve(null);
            } catch {
                resolve(null);
            }
        });
    }

    async function saveHandleToDB(handle) {
        try {
            const req = indexedDB.open('ChamCongAutoSaveDB', 1);
            req.onupgradeneeded = () => req.result.createObjectStore('handles');
            req.onsuccess = () => {
                const db = req.result;
                const tx = db.transaction('handles', 'readwrite');
                tx.objectStore('handles').put(handle, 'databaseJsHandle');
            };
        } catch (e) {
            console.warn(e);
        }
    }

    async function initAutoSave() {
        try {
            autoSaveFileHandle = await getHandleFromDB();
            if (autoSaveFileHandle) {
                updateAutoSaveUI(true);
            } else {
                updateAutoSaveUI(false);
            }
        } catch (e) {
            updateAutoSaveUI(false);
        }
    }

    function updateAutoSaveUI(isActive) {
        if (!DOM.autoSaveText || !DOM.btnAutoSaveToggle) return;
        if (isActive) {
            DOM.btnAutoSaveToggle.classList.remove('syncing');
            DOM.btnAutoSaveToggle.title = 'Đang tự động lưu ngầm vào data/database.js mỗi khi bạn chấm công (Nhấp để đổi file)';
            DOM.autoSaveText.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Tự lưu database.js: BẬT';
        } else {
            DOM.btnAutoSaveToggle.title = 'Nhấp để kích hoạt tự động ghi đè file database.js trong thư mục mỗi khi chấm công';
            DOM.autoSaveText.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu database.js';
        }
    }

    async function triggerAutoSaveDatabase() {
        const dataObj = {
            version: "1.0",
            lastUpdated: new Date().toISOString(),
            settings: state.settings,
            records: state.records
        };

        // Cập nhật bộ nhớ runtime
        window.CHAM_CONG_DEFAULT_DATA = dataObj;

        // 1. Thử gửi API lưu tự động vào file nếu đang chạy qua server cục bộ
        try {
            const resp = await fetch('/api/save-database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataObj)
            });
            if (resp.ok) {
                if (DOM.btnAutoSaveToggle) {
                    DOM.btnAutoSaveToggle.classList.add('syncing');
                    setTimeout(() => DOM.btnAutoSaveToggle.classList.remove('syncing'), 600);
                }
                updateAutoSaveUI(true);
                return true;
            }
        } catch {
            // Chạy file trực tiếp không qua server, tiếp tục kiểm tra File System Access API
        }

        // 2. Nếu đã có file handle, tự động ghi ngầm không làm phiền người dùng
        if (autoSaveFileHandle) {
            try {
                const fileContent = `/**
 * File dữ liệu lưu trữ cố định trong thư mục dự án (tinhcong/data/database.js).
 * Tự động cập nhật tức thì mỗi khi bạn chấm công!
 */
window.CHAM_CONG_DEFAULT_DATA = ${JSON.stringify(dataObj, null, 2)};
`;
                const writable = await autoSaveFileHandle.createWritable();
                await writable.write(fileContent);
                await writable.close();
                if (DOM.btnAutoSaveToggle) {
                    DOM.btnAutoSaveToggle.classList.add('syncing');
                    setTimeout(() => DOM.btnAutoSaveToggle.classList.remove('syncing'), 600);
                }
                updateAutoSaveUI(true);
                return true;
            } catch (err) {
                console.warn('Auto-save silent write failed:', err);
            }
        }
        return false;
    }

    async function saveToDatabaseFile(isExplicitConnect = true) {
        const dataObj = {
            version: "1.0",
            lastUpdated: new Date().toISOString(),
            settings: state.settings,
            records: state.records
        };

        const fileContent = `/**
 * File dữ liệu lưu trữ cố định trong thư mục dự án (tinhcong/data/database.js).
 * Tự động cập nhật tức thì mỗi khi bạn chấm công!
 */
window.CHAM_CONG_DEFAULT_DATA = ${JSON.stringify(dataObj, null, 2)};
`;

        // Modern File System Access API
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'database.js',
                    types: [{
                        description: 'JavaScript Database File',
                        accept: { 'application/javascript': ['.js'] }
                    }]
                });

                const writable = await handle.createWritable();
                await writable.write(fileContent);
                await writable.close();

                // Lưu handle để tự động lưu ngầm các lần sau
                autoSaveFileHandle = handle;
                await saveHandleToDB(handle);
                updateAutoSaveUI(true);

                showToast('Đã lưu & Kích hoạt Tự Động Lưu vào database.js!', 'success');
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.warn('File picker cancelled:', err);
            }
        }

        // Fallback tải file
        downloadFile(fileContent, 'database.js', 'application/javascript;charset=utf-8;');
        showToast('Đã tải file database.js! Hãy lưu/thay thế vào thư mục data/ của dự án.', 'info');
    }

    function reloadFromDatabaseFile() {
        if (window.CHAM_CONG_DEFAULT_DATA && (window.CHAM_CONG_DEFAULT_DATA.records || window.CHAM_CONG_DEFAULT_DATA.settings)) {
            if (confirm('Bạn có muốn nạp lại dữ liệu từ file data/database.js trong thư mục?')) {
                if (window.CHAM_CONG_DEFAULT_DATA.records) {
                    state.records = { ...state.records, ...window.CHAM_CONG_DEFAULT_DATA.records };
                    saveRecords();
                }
                if (window.CHAM_CONG_DEFAULT_DATA.settings) {
                    state.settings = { ...DEFAULT_SETTINGS, ...window.CHAM_CONG_DEFAULT_DATA.settings };
                    saveSettings();
                }
                renderAll();
                showToast('Đã nạp và đồng bộ dữ liệu từ file data/database.js!', 'success');
            }
        } else {
            showToast('Chưa tìm thấy dữ liệu trong file data/database.js', 'warning');
        }
    }

    function downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function clearMonthData() {
        const daysInMonth = getDaysInMonth(state.currentYear, state.currentMonth);
        if (confirm(`Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu chấm công của Tháng ${state.currentMonth + 1}/${state.currentYear}?`)) {
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${state.currentYear}-${padZero(state.currentMonth + 1)}-${padZero(day)}`;
                delete state.records[dateStr];
            }
            saveRecords();
            renderAll();
            showToast(`Đã xóa dữ liệu Tháng ${state.currentMonth + 1}/${state.currentYear}`, 'info');
        }
    }

    // ==========================================
    // EVENT LISTENERS & WIRING
    // ==========================================
    function setupEventListeners() {
        // Period navigation
        DOM.btnPrevPeriod.addEventListener('click', () => {
            if (state.currentMonth === 0) {
                state.currentMonth = 11;
                state.currentYear--;
            } else {
                state.currentMonth--;
            }
            renderAll();
        });

        DOM.btnNextPeriod.addEventListener('click', () => {
            if (state.currentMonth === 11) {
                state.currentMonth = 0;
                state.currentYear++;
            } else {
                state.currentMonth++;
            }
            renderAll();
        });

        DOM.btnToday.addEventListener('click', () => {
            const now = new Date();
            state.currentYear = now.getFullYear();
            state.currentMonth = now.getMonth();
            renderAll();
        });

        // View toggle
        DOM.viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetView = btn.dataset.view;
                DOM.viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                Object.keys(DOM.views).forEach(key => {
                    DOM.views[key].classList.remove('active');
                });
                DOM.views[targetView].classList.add('active');
                state.currentView = targetView;

                if (targetView === 'stats') {
                    renderCharts();
                } else if (targetView === 'table') {
                    renderTable();
                } else {
                    renderCalendar();
                }
            });
        });

        // Theme toggle
        DOM.btnThemeToggle.addEventListener('click', toggleTheme);

        // Filter status
        DOM.filterStatus.addEventListener('change', (e) => {
            state.statusFilter = e.target.value;
            renderCalendar();
            renderTable();
        });

        // Quick check-in today
        DOM.btnQuickCheckin.addEventListener('click', () => {
            const todayStr = getISODate(new Date());
            openEntryModal(todayStr);
        });

        // Bulk Fill
        DOM.btnBulkFill.addEventListener('click', openBulkModal);
        DOM.btnCloseBulkModal.addEventListener('click', closeBulkModal);
        DOM.btnCancelBulk.addEventListener('click', closeBulkModal);
        DOM.bulkFillForm.addEventListener('submit', handleBulkFill);

        if (DOM.bulkShiftType) {
            DOM.bulkShiftType.addEventListener('change', () => {
                const val = DOM.bulkShiftType.value;
                if (val === 'split') {
                    if (DOM.bulkSingleBox) DOM.bulkSingleBox.style.display = 'none';
                    if (DOM.bulkSplitBox) DOM.bulkSplitBox.style.display = 'block';
                } else {
                    if (DOM.bulkSingleBox) DOM.bulkSingleBox.style.display = 'block';
                    if (DOM.bulkSplitBox) DOM.bulkSplitBox.style.display = 'none';

                    if (val === 'single_lunch') {
                        if (DOM.bulkIn) DOM.bulkIn.value = '08:00';
                        if (DOM.bulkOut) DOM.bulkOut.value = '16:30';
                        if (DOM.bulkLunchBreak) DOM.bulkLunchBreak.checked = true;
                        if (DOM.bulkAutoOut4h) DOM.bulkAutoOut4h.checked = false;
                        if (DOM.bulkAutoOut8h) DOM.bulkAutoOut8h.checked = true;
                    } else if (val === 'morning') {
                        if (DOM.bulkIn) DOM.bulkIn.value = '08:00';
                        if (DOM.bulkOut) DOM.bulkOut.value = '12:00';
                        if (DOM.bulkLunchBreak) DOM.bulkLunchBreak.checked = false;
                        if (DOM.bulkAutoOut4h) DOM.bulkAutoOut4h.checked = true;
                        if (DOM.bulkAutoOut8h) DOM.bulkAutoOut8h.checked = false;
                    } else if (val === 'afternoon') {
                        if (DOM.bulkIn) DOM.bulkIn.value = '13:00';
                        if (DOM.bulkOut) DOM.bulkOut.value = '17:00';
                        if (DOM.bulkLunchBreak) DOM.bulkLunchBreak.checked = false;
                        if (DOM.bulkAutoOut4h) DOM.bulkAutoOut4h.checked = true;
                        if (DOM.bulkAutoOut8h) DOM.bulkAutoOut8h.checked = false;
                    } else if (val === 'admin') {
                        if (DOM.bulkIn) DOM.bulkIn.value = '08:00';
                        if (DOM.bulkOut) DOM.bulkOut.value = '17:00';
                        if (DOM.bulkLunchBreak) DOM.bulkLunchBreak.checked = false;
                        if (DOM.bulkAutoOut4h) DOM.bulkAutoOut4h.checked = false;
                        if (DOM.bulkAutoOut8h) DOM.bulkAutoOut8h.checked = false;
                    }
                    updateBulkAutoOutCalculation();
                }
            });
        }

        // Tự động tính Giờ ra trong Bulk Fill Modal
        if (DOM.bulkAutoOut4h) {
            DOM.bulkAutoOut4h.addEventListener('change', () => {
                if (DOM.bulkAutoOut4h.checked && DOM.bulkAutoOut8h) {
                    DOM.bulkAutoOut8h.checked = false;
                }
                updateBulkAutoOutCalculation();
            });
        }

        if (DOM.bulkAutoOut8h) {
            DOM.bulkAutoOut8h.addEventListener('change', () => {
                if (DOM.bulkAutoOut8h.checked && DOM.bulkAutoOut4h) {
                    DOM.bulkAutoOut4h.checked = false;
                }
                updateBulkAutoOutCalculation();
            });
        }

        ['input', 'change'].forEach(evt => {
            if (DOM.bulkIn) {
                DOM.bulkIn.addEventListener(evt, () => {
                    if (DOM.bulkAutoOut4h && DOM.bulkAutoOut8h && (DOM.bulkAutoOut4h.checked || DOM.bulkAutoOut8h.checked)) {
                        updateBulkAutoOutCalculation();
                    }
                });
            }
        });

        if (DOM.bulkOut) {
            DOM.bulkOut.addEventListener('input', () => {
                if (DOM.bulkAutoOut4h) DOM.bulkAutoOut4h.checked = false;
                if (DOM.bulkAutoOut8h) DOM.bulkAutoOut8h.checked = false;
                updateBulkAutoOutCalculation();
            });
        }

        // Settings Modal & Wage Calculator
        DOM.btnSettings.addEventListener('click', openSettingsModal);
        if (DOM.btnCalcWageQuick) {
            DOM.btnCalcWageQuick.addEventListener('click', openSettingsModal);
        }
        DOM.btnCloseSettingsModal.addEventListener('click', closeSettingsModal);
        DOM.btnCancelSettings.addEventListener('click', closeSettingsModal);
        DOM.settingsForm.addEventListener('submit', handleSaveSettings);

        // Wage live inputs
        if (DOM.cfgMonthlySalary) DOM.cfgMonthlySalary.addEventListener('input', updateWageCalculator);
        if (DOM.cfgStandardDays) DOM.cfgStandardDays.addEventListener('input', updateWageCalculator);
        if (DOM.cfgStandardHours) DOM.cfgStandardHours.addEventListener('input', updateWageCalculator);

        // Entry Modal
        DOM.btnCloseModal.addEventListener('click', closeEntryModal);
        DOM.btnCancelModal.addEventListener('click', closeEntryModal);
        DOM.entryForm.addEventListener('submit', handleSaveEntry);
        DOM.btnDeleteEntry.addEventListener('click', handleDeleteEntry);

        // Split shift toggle in Entry Modal
        if (DOM.chkSplitShift) {
            DOM.chkSplitShift.addEventListener('change', () => {
                const isSplit = DOM.chkSplitShift.checked;
                if (DOM.singleShiftBox) DOM.singleShiftBox.style.display = isSplit ? 'none' : 'block';
                if (DOM.splitShiftBox) DOM.splitShiftBox.style.display = isSplit ? 'block' : 'none';
                updateLivePreview();
            });
        }

        // Nút tích Tính tự động giờ ra 4 tiếng / 8 tiếng trong Entry Modal
        if (DOM.chkAutoOut4h) {
            DOM.chkAutoOut4h.addEventListener('change', () => {
                if (DOM.chkAutoOut4h.checked && DOM.chkAutoOut8h) {
                    DOM.chkAutoOut8h.checked = false;
                }
                updateAutoOutCalculation('toggle');
            });
        }

        if (DOM.chkAutoOut8h) {
            DOM.chkAutoOut8h.addEventListener('change', () => {
                if (DOM.chkAutoOut8h.checked && DOM.chkAutoOut4h) {
                    DOM.chkAutoOut4h.checked = false;
                }
                updateAutoOutCalculation('toggle');
            });
        }

        // Tự động tính lại Giờ ra khi đổi Giờ vào nếu đang tích 4h hoặc 8h
        ['input', 'change'].forEach(evt => {
            if (DOM.timeIn) {
                DOM.timeIn.addEventListener(evt, () => {
                    if (DOM.chkAutoOut4h && DOM.chkAutoOut8h && (DOM.chkAutoOut4h.checked || DOM.chkAutoOut8h.checked)) {
                        updateAutoOutCalculation('timeIn');
                    }
                });
            }
        });

        // Nếu người dùng tự tay sửa Giờ ra: tự động bỏ tích để chuyển sang chế độ tự ghi
        if (DOM.timeOut) {
            DOM.timeOut.addEventListener('input', () => {
                if ((DOM.chkAutoOut4h && DOM.chkAutoOut4h.checked) || (DOM.chkAutoOut8h && DOM.chkAutoOut8h.checked)) {
                    if (DOM.chkAutoOut4h) DOM.chkAutoOut4h.checked = false;
                    if (DOM.chkAutoOut8h) DOM.chkAutoOut8h.checked = false;
                    updateAutoOutCalculation('manual');
                }
            });
        }

        // Live calculation triggers
        ['input', 'change'].forEach(evt => {
            if (DOM.timeIn) DOM.timeIn.addEventListener(evt, updateLivePreview);
            if (DOM.timeOut) DOM.timeOut.addEventListener(evt, updateLivePreview);
            if (DOM.timeIn1) DOM.timeIn1.addEventListener(evt, updateLivePreview);
            if (DOM.timeOut1) DOM.timeOut1.addEventListener(evt, updateLivePreview);
            if (DOM.timeIn2) DOM.timeIn2.addEventListener(evt, updateLivePreview);
            if (DOM.timeOut2) DOM.timeOut2.addEventListener(evt, updateLivePreview);
            if (DOM.dayStatus) DOM.dayStatus.addEventListener(evt, updateLivePreview);
        });

        // Lunch break checkbox in Entry Modal
        if (DOM.chkLunchBreak) {
            DOM.chkLunchBreak.addEventListener('change', () => {
                if (DOM.chkAutoOut8h && DOM.chkAutoOut8h.checked) {
                    updateAutoOutCalculation('lunchBreak');
                    showToast(DOM.chkLunchBreak.checked ? 'Đã cộng 30 phút ăn trưa (8.5 tiếng)' : 'Đã bỏ 30 phút ăn trưa (8.0 tiếng)', 'info');
                } else if (DOM.timeOut && DOM.timeOut.value) {
                    if (DOM.chkLunchBreak.checked) {
                        DOM.timeOut.value = addMinutesToTime(DOM.timeOut.value, 30);
                        showToast('Đã cộng 30 phút ăn trưa vào Giờ ra (Đủ 8h30p = 1 công)', 'info');
                    } else {
                        DOM.timeOut.value = addMinutesToTime(DOM.timeOut.value, -30);
                        showToast('Đã bỏ 30 phút ăn trưa khỏi Giờ ra', 'info');
                    }
                    updateLivePreview();
                }
            });
        }

        // Lunch break checkbox in Bulk Fill Modal
        if (DOM.bulkLunchBreak) {
            DOM.bulkLunchBreak.addEventListener('change', () => {
                if (DOM.bulkAutoOut8h && DOM.bulkAutoOut8h.checked) {
                    updateBulkAutoOutCalculation();
                } else if (DOM.bulkOut && DOM.bulkOut.value) {
                    if (DOM.bulkLunchBreak.checked) {
                        DOM.bulkOut.value = addMinutesToTime(DOM.bulkOut.value, 30);
                    } else {
                        DOM.bulkOut.value = addMinutesToTime(DOM.bulkOut.value, -30);
                    }
                }
            });
        }

        // Preset Chips
        DOM.presetChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const isSplit = (chip.dataset.split === 'true');
                if (DOM.chkSplitShift) DOM.chkSplitShift.checked = isSplit;
                if (DOM.singleShiftBox) DOM.singleShiftBox.style.display = isSplit ? 'none' : 'block';
                if (DOM.splitShiftBox) DOM.splitShiftBox.style.display = isSplit ? 'block' : 'none';

                if (isSplit) {
                    if (DOM.timeIn1) DOM.timeIn1.value = chip.dataset.in || '08:00';
                    if (DOM.timeOut1) DOM.timeOut1.value = chip.dataset.out || '12:00';
                    if (DOM.timeIn2) DOM.timeIn2.value = chip.dataset.in2 || '13:00';
                    if (DOM.timeOut2) DOM.timeOut2.value = chip.dataset.out2 || '17:00';
                } else {
                    if (DOM.timeIn) DOM.timeIn.value = chip.dataset.in;
                    if (DOM.timeOut) DOM.timeOut.value = chip.dataset.out;
                    if (DOM.chkLunchBreak) DOM.chkLunchBreak.checked = (chip.dataset.lunch === 'true');
                    initAutoOutForEntry({
                        timeIn: chip.dataset.in,
                        timeOut: chip.dataset.out,
                        hasLunchBreak: (chip.dataset.lunch === 'true')
                    });
                }

                if (DOM.dayStatus) DOM.dayStatus.value = 'worked';
                updateLivePreview();
            });
        });

        if (DOM.btnResetDay) {
            DOM.btnResetDay.addEventListener('click', () => {
                if (DOM.chkSplitShift) DOM.chkSplitShift.checked = false;
                if (DOM.singleShiftBox) DOM.singleShiftBox.style.display = 'block';
                if (DOM.splitShiftBox) DOM.splitShiftBox.style.display = 'none';
                if (DOM.timeIn) DOM.timeIn.value = '';
                if (DOM.timeOut) DOM.timeOut.value = '';
                if (DOM.timeIn1) DOM.timeIn1.value = '08:00';
                if (DOM.timeOut1) DOM.timeOut1.value = '12:00';
                if (DOM.timeIn2) DOM.timeIn2.value = '13:00';
                if (DOM.timeOut2) DOM.timeOut2.value = '17:00';
                if (DOM.chkLunchBreak) DOM.chkLunchBreak.checked = false;
                initAutoOutForEntry({
                    timeIn: '',
                    timeOut: '',
                    hasLunchBreak: false,
                    autoOutDuration: 'manual'
                });
                if (DOM.dayStatus) DOM.dayStatus.value = 'off';
                updateLivePreview();
            });
        }

        // Dropdown toggle
        DOM.btnExportMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            DOM.exportDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            DOM.exportDropdown.classList.remove('show');
        });

        // Auto-Save & Export Actions
        if (DOM.btnAutoSaveToggle) {
            DOM.btnAutoSaveToggle.addEventListener('click', (e) => {
                e.preventDefault();
                saveToDatabaseFile();
            });
        }

        if (DOM.btnDirectExportExcel) {
            DOM.btnDirectExportExcel.addEventListener('click', (e) => {
                e.preventDefault();
                exportToExcelCSV();
            });
        }

        DOM.btnExportJSON.addEventListener('click', (e) => {
            e.preventDefault();
            exportToJSON();
        });

        DOM.importJSONInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                importFromJSON(e.target.files[0]);
                e.target.value = '';
            }
        });

        DOM.btnPrintTimesheet.addEventListener('click', (e) => {
            e.preventDefault();
            window.print();
        });

        DOM.btnClearData.addEventListener('click', (e) => {
            e.preventDefault();
            clearMonthData();
        });

        // Window resize re-renders charts if active
        window.addEventListener('resize', () => {
            if (state.currentView === 'stats') {
                renderCharts();
            }
        });
    }

    // ==========================================
    // TOAST NOTIFICATIONS & UTILITIES
    // ==========================================
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        let icon = '<i class="fa-solid fa-circle-info text-info"></i>';
        if (type === 'success') icon = '<i class="fa-solid fa-circle-check text-success"></i>';
        if (type === 'error') icon = '<i class="fa-solid fa-triangle-exclamation text-danger"></i>';

        toast.innerHTML = `${icon} <span>${escapeHtml(message)}</span>`;
        DOM.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Expose global entry point for inline table clicks
    window.chamCongApp = {
        openDate: openEntryModal
    };

    // Run on DOM ready
    document.addEventListener('DOMContentLoaded', init);
})();
