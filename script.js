// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- Constants and Global Variables ---
    const googleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSH8BKMxMzdrskmVU2Ce4cr1vEH9RSxDhuppGKKPFR_ZlVMcsgf_jSX3EJGWukqODXzAW_noA6_eopA/pub?output=csv';
    
    // --- UI Element Selection ---
    const resultForm = document.getElementById('resultForm');
    const seatNumberInput = document.getElementById('seatNumber');
    const alertMessage = document.getElementById('alertMessage');
    const resultDisplay = document.getElementById('resultDisplay');
    const searchContainer = document.getElementById('searchContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const buttonText = document.getElementById('buttonText');
    const themeSwitcher = document.getElementById('themeSwitcher');
    
    // --- Initial Setup ---
    loadingSpinner.style.display = 'none';

    // --- Theme Management ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    };

    themeSwitcher.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);


    // --- Event Listeners ---
    resultForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const seatNumber = seatNumberInput.value.trim();
        alertMessage.innerHTML = '';

        if (!seatNumber) {
            displayAlert('الرجاء إدخال رقم الجلوس.', 'warning');
            return;
        }
        
        toggleLoading(true);

        const proxyUrl = 'https://corsproxy.io/?';
        const fullUrl = `${proxyUrl}${encodeURIComponent(googleSheetUrl)}`;

        try {
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error(`فشل الاتصال بالخادم`);
            
            const csvText = await response.text();
            if (!csvText || csvText.trim() === '') throw new Error("تم استلام بيانات فارغة من المصدر.");

            const studentData = findStudentBySeatNumber(csvText, seatNumber);

            if (studentData) {
                displayResult(studentData);
            } else {
                displayAlert(`رقم الجلوس "<strong>${seatNumber}</strong>" غير موجود أو غير صحيح.`, 'danger');
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            displayAlert(`حدث خطأ فني: <strong>${error.message}</strong>`, 'danger');
        } finally {
            toggleLoading(false);
        }
    });

    // --- Core Functions ---
    function findStudentBySeatNumber(csvText, seatNumber) {
        const rows = csvText.split(/\r?\n/).map(row => row.split(','));
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row && row.length > 0 && row[0].trim() === seatNumber) {
                return {
                    seat: row[0].trim(), name: row[1] ? row[1].trim() : 'لا يوجد اسم', school: row[2] ? row[2].trim() : 'لا توجد مدرسة',
                    arabic: parseFloat(row[3]) || 0, english: parseFloat(row[4]) || 0, social: parseFloat(row[5]) || 0,
                    algebra: parseFloat(row[6]) || 0, geometry: parseFloat(row[7]) || 0, science: parseFloat(row[8]) || 0,
                    subTotal: parseFloat(row[9]) || 0, computer: parseFloat(row[10]) || 0, religion: parseFloat(row[11]) || 0, art: parseFloat(row[12]) || 0,
                };
            }
        }
        return null;
    }

    function displayResult(data) {
        searchContainer.classList.add('d-none');
        
        const resultHTML = `
            <div class="student-data-section">
                 <div class="info-row">
                    <span><i class="bi bi-person-fill text-primary me-2"></i>الاسم</span>
                    <strong class="text-success">${data.name}</strong>
                </div>
                <div class="info-row">
                    <span><i class="bi bi-geo-alt-fill text-primary me-2"></i>رقم الجلوس</span>
                    <strong class="text-danger">${data.seat}</strong>
                </div>
                <div class="info-row">
                    <span><i class="bi bi-building-fill text-primary me-2"></i>المدرسة</span>
                    <strong class="text-dark">${data.school}</strong>
                </div>

                <div class="table-responsive">
                    <table class="table table-bordered table-striped mt-3 grades-table text-center">
                        <thead class="table-light">
                            <tr><th>المادة</th><th>الدرجة</th></tr>
                        </thead>
                        <tbody>
                            <tr><td class="subject-name">اللغة العربية</td><td>${data.arabic}</td></tr>
                            <tr><td class="subject-name">اللغة الإنجليزية</td><td>${data.english}</td></tr>
                            <tr><td class="subject-name">الدراسات الاجتماعية</td><td>${data.social}</td></tr>
                            <tr><td class="subject-name">الجبر</td><td>${data.algebra}</td></tr>
                            <tr><td class="subject-name">الهندسة</td><td>${data.geometry}</td></tr>
                            <tr><td class="subject-name">العلوم</td><td>${data.science}</td></tr>
                            <tr class="non-additive-subject"><td class="subject-name">الحاسب الآلي</td><td>${data.computer}</td></tr>
                            <tr class="non-additive-subject"><td class="subject-name">التربية الدينية</td><td>${data.religion}</td></tr>
                            <tr class="non-additive-subject"><td class="subject-name">التربية الفنية</td><td>${data.art}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="total-score-row">
                <span class="label">المجموع</span>
                <div class="fraction">
                    <span class="fraction-numerator">${data.subTotal}</span>
                    <span class="fraction-denominator">280</span>
                </div>
            </div>
            
            <div class="d-grid mt-4">
                <button onclick="window.location.reload()" class="btn btn-secondary btn-lg"><i class="bi bi-arrow-repeat me-2"></i>البحث عن رقم جلوس آخر</button>
            </div>
        `;

        resultDisplay.innerHTML = resultHTML;
        resultDisplay.classList.remove('d-none');
        resultDisplay.classList.add('fade-in');
    }

    function displayAlert(message, type = 'info') {
        alertMessage.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
    }

    function toggleLoading(isLoading) {
        if (isLoading) {
            loadingSpinner.style.display = 'inline-block';
            buttonText.style.display = 'none';
            resultForm.querySelector('button').disabled = true;
        } else {
            loadingSpinner.style.display = 'none';
            buttonText.style.display = 'inline-block';
            resultForm.querySelector('button').disabled = false;
        }
    }
});
