document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const liveCamera = document.getElementById('live-camera');
    const imageCanvas = document.getElementById('image-canvas');
    const canvasCtx = imageCanvas.getContext('2d');
    const uiHud = document.getElementById('ui-hud');
    const toggleModeButton = document.getElementById('toggle-mode-button');
    const imageUploadInput = document.getElementById('image-upload-input');
    const scanButton = document.getElementById('scan-button');
    const reportButton = document.getElementById('report-button');
    const scanMessage = document.getElementById('scan-message');
    const progressBarContainer = document.getElementById('scan-progress-bar');
    const progressBar = document.getElementById('progress');
    const arOverlay = document.getElementById('ar-overlay');
    const metalsList = document.getElementById('precious-metals-list');
    const gemstonesList = document.getElementById('gemstones-list');
    const meteoritesList = document.getElementById('meteorites-list');
    const structureInfo = document.getElementById('structure-info');
    const scanAudio = document.getElementById('scan-audio');
    const alertAudio = document.getElementById('alert-audio');
    const settingsIcon = document.getElementById('settings-icon');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const saveSettingsButton = document.getElementById('save-settings-button');
    const sensitivitySlider = document.getElementById('sensitivity-slider');
    const sensitivityValue = document.getElementById('sensitivity-value');
    const opacitySlider = document.getElementById('opacity-slider');
    const opacityValue = document.getElementById('opacity-value');

    // --- State ---
    let currentMode = 'camera'; // 'camera' or 'upload'
    let cameraStream = null;
    let isScanning = false;

    // --- Database ---
    const DB = {
        preciousMetals: ["ذهب", "فضة", "بلاتين", "روديوم", "إيريديوم", "نحاس"],
        gemstones: ["ألماس", "ياقوت", "زمرد", "زفير", "عقيق", "فيروز", "جمشت", "توباز", "أوبال", "لازورد"],
        meteorites: ["نيازك حديدية (Iron)", "نيازك صخرية (Chondrite)", "بالاسيت (Pallasite)", "مؤشر إيريديوم", "زجاج ليبي"]
    };

    // --- Initial Setup ---
    initializeCamera();
    setupEventListeners();
    
    // --- Audio Setup ---
    if(scanAudio) scanAudio.volume = 0.3;
    if(alertAudio) alertAudio.volume = 0.5;

    // --- Functions ---

    function setupEventListeners() {
        // Settings Modal
        settingsIcon.addEventListener('click', () => settingsModal.classList.remove('hidden'));
        closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
        saveSettingsButton.addEventListener('click', () => settingsModal.classList.add('hidden'));
        
        // Sliders
        sensitivitySlider.addEventListener('input', (e) => sensitivityValue.textContent = `${e.target.value}%`);
        opacitySlider.addEventListener('input', handleOpacityChange);

        // Main Buttons
        toggleModeButton.addEventListener('click', toggleMode);
        imageUploadInput.addEventListener('change', handleImageUpload);
        scanButton.addEventListener('click', startScan);
        reportButton.addEventListener('click', () => window.location.href = 'report.html');
    }

    async function initializeCamera() {
        try {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
            const constraints = { video: { facingMode: 'environment' } };
            cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            liveCamera.srcObject = cameraStream;
            currentMode = 'camera';
            updateUIVisibility();
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("لا يمكن الوصول إلى الكاميرا. سيتم التبديل إلى وضع رفع الصور.");
            switchToUploadMode(true);
        }
    }

    function toggleMode() {
        currentMode === 'camera' ? switchToUploadMode() : switchToCameraMode();
    }

    function switchToUploadMode(force = false) {
        if (cameraStream && !force) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
        currentMode = 'upload';
        updateUIVisibility();
        imageUploadInput.click();
    }

    function switchToCameraMode() {
        if (!cameraStream || !cameraStream.active) {
            initializeCamera();
        }
        currentMode = 'camera';
        updateUIVisibility();
    }

    function updateUIVisibility() {
        if (currentMode === 'camera') {
            liveCamera.style.display = 'block';
            imageCanvas.style.display = 'none';
            toggleModeButton.innerHTML = '<i class="fas fa-upload"></i>';
            toggleModeButton.title = 'التبديل إلى وضع رفع الصور';
            scanMessage.textContent = 'وجّه الكاميرا واضغط لبدء المسح';
        } else {
            liveCamera.style.display = 'none';
            imageCanvas.style.display = 'block';
            toggleModeButton.innerHTML = '<i class="fas fa-camera"></i>';
            toggleModeButton.title = 'التبديل إلى وضع الكاميرا الحية';
            scanMessage.textContent = 'ارفع صورة لبدء التحليل';
        }
    }

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = imageCanvas;
                    const ctx = canvasCtx;
                    // Set canvas dimensions to match image aspect ratio
                    const container = canvas.parentElement;
                    const containerRatio = container.clientWidth / container.clientHeight;
                    const imgRatio = img.width / img.height;

                    canvas.width = container.clientWidth;
                    canvas.height = container.clientHeight;

                    if (imgRatio > containerRatio) {
                        const h = canvas.width / imgRatio;
                        ctx.drawImage(img, 0, (canvas.height - h) / 2, canvas.width, h);
                    } else {
                        const w = canvas.height * imgRatio;
                        ctx.drawImage(img, (canvas.width - w) / 2, 0, w, canvas.height);
                    }
                    scanMessage.textContent = 'الصورة جاهزة للتحليل. اضغط لبدء المسح.';
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function handleOpacityChange(event) {
        const value = event.target.value;
        const alpha1 = (value / 100 * 0.7).toFixed(2);
        const alpha2 = (value / 100 * 0.8).toFixed(2);
        uiHud.style.background = `linear-gradient(180deg, rgba(0,0,0,${alpha1}) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,${alpha2}) 100%)`;
        opacityValue.textContent = `${value}%`;
    }

    function startScan() {
        if (isScanning) return;
        isScanning = true;
        scanButton.textContent = 'جاري المسح...';
        scanButton.classList.add('scanning');
        scanMessage.textContent = 'يتم تحليل البيانات...';
        progressBarContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        
        resetResults();
        scanAudio.play();

        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressBar.style.width = `${progress}%`;
            if (progress >= 100) {
                clearInterval(interval);
                finishScan();
            }
        }, 500);
    }

    function finishScan() {
        scanAudio.pause();
        scanAudio.currentTime = 0;
        alertAudio.play();

        scanButton.classList.add('hidden');
        reportButton.classList.remove('hidden');
        scanMessage.textContent = 'اكتمل المسح! التقرير الكامل جاهز للعرض.';
        
        populateResults();

        structureInfo.textContent = 'تجويف على عمق 4م';
        const target = document.createElement('div');
        target.className = 'ar-target';
        target.style.top = '55%';
        target.style.left = '40%';
        target.style.width = '150px';
        target.style.height = '100px';
        target.innerHTML = `<span>تجويف محتمل</span>  
العمق: 4م`;
        arOverlay.appendChild(target);

        isScanning = false;
    }

    function populateResults() {
        displayItems(metalsList, DB.preciousMetals, 3, '%');
        displayItems(gemstonesList, DB.gemstones, 4, ' قيراط/م³');
        displayItems(meteoritesList, DB.meteorites, 2, ' مؤشر');
    }

    function displayItems(listElement, database, count, unit) {
        const shuffled = [...database].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);
        listElement.innerHTML = ''; // Clear previous items
        selected.forEach(item => {
            const li = document.createElement('li');
            const value = (Math.random() * (unit === '%' ? 2 : 0.5)).toFixed(3);
            li.innerHTML = `<span>${item}</span><span class="value detected">${value}${unit}</span>`;
            listElement.appendChild(li);
        });
    }

    function resetResults() {
        metalsList.innerHTML = '';
        gemstonesList.innerHTML = '';
        meteoritesList.innerHTML = '';
        structureInfo.textContent = 'في انتظار المسح...';
        arOverlay.innerHTML = '';
        
        scanButton.classList.remove('hidden');
        reportButton.classList.add('hidden');
    }
});

// Camera activation
window.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('live-camera');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(stream => {
                video.srcObject = stream;
                video.play();
            })
            .catch(err => {
                alert('تعذر الوصول إلى الكاميرا: ' + err.message);
            });
    } else {
        alert('الكاميرا غير مدعومة في هذا المتصفح.');
    }
});

// Example: Button event listeners
document.getElementById('scan-button').onclick = function() {
    // Add your scan logic here
    alert('بدء المسح');
};
document.getElementById('toggle-mode-button').onclick = function() {
    // Toggle upload mode logic
    alert('تبديل الوضع');
};
document.getElementById('settings-icon').onclick = function() {
    document.getElementById('settings-modal').classList.remove('hidden');
};
document.getElementById('close-settings').onclick = function() {
    document.getElementById('settings-modal').classList.add('hidden');
};
<div id="settings-icon" class="icon-button"><i class="fas fa-cog"></i></div>