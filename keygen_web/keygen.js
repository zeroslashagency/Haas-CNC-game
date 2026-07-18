// Haas CNC License Key Generator - JavaScript Implementation
// Compatible with REL-100.17, REL-100.18, REL-100.23
// Supports both USB Drive Keys (HaasKey.txt) and Individual Unlock Codes

// Feature definitions (matching Python implementation)
const FEATURES = {
    MACHINE: 0x00000001,
    MACROS: 0x00000002,
    ROTATION_AND_SCALING: 0x00000004,
    RIGID_TAPPING: 0x00000008,
    TCPC_AND_DWO: 0x00000010,
    M19_SPINDLE_ORIENT: 0x00000020,
    HIGH_SPEED_MACHINING: 0x00000040,
    VPS_EDITING: 0x00000080,
    MEDIA_DISPLAY: 0x00000100,
    FOURTH_AXIS: 0x00000200,
    FIFTH_AXIS: 0x00000400,
    CUSTOM_ROTARIES: 0x00000800,
    MAX_MEMORY_1GB: 0x00001000,
    WIRELESS_NETWORKING: 0x00002000,
    COMPENSATION_TABLES: 0x00004000,
    THROUGH_SPINDLE_COOLANT: 0x00008000,
    MAX_SPINDLE_SPEED_10000: 0x00010000,
    MAX_SPINDLE_SPEED_15000: 0x00020000,
    PROBING: 0x00040000,
    WIRELESS_PROBING: 0x00080000,
    MILL_TURN: 0x00100000,
    LOOK_AHEAD: 0x00200000,
    ADVANCED_INTERPOLATION: 0x00400000
};

// Feature display names - ALL 23 FEATURES NOW SUPPORT INDIVIDUAL CODES
const FEATURE_NAMES = {
    MACHINE: 'Machine Control',
    MACROS: 'Macro Programming',
    ROTATION_AND_SCALING: 'Rotation & Scaling',
    RIGID_TAPPING: 'Rigid Tapping',
    TCPC_AND_DWO: 'TCPC & DWO',
    M19_SPINDLE_ORIENT: 'M19 Spindle Orient',
    HIGH_SPEED_MACHINING: 'High-Speed Machining',
    VPS_EDITING: 'VPS Editing',
    MEDIA_DISPLAY: 'Media Display',
    FOURTH_AXIS: 'Fourth Axis (A/B)',
    FIFTH_AXIS: 'Fifth Axis (5-Axis)',
    CUSTOM_ROTARIES: 'Custom Rotaries',
    MAX_MEMORY_1GB: 'Max Memory (1GB)',
    WIRELESS_NETWORKING: 'Wireless Networking',
    COMPENSATION_TABLES: 'Compensation Tables',
    THROUGH_SPINDLE_COOLANT: 'Through-Spindle Coolant',
    MAX_SPINDLE_SPEED_10000: 'Max Spindle 10,000 RPM',
    MAX_SPINDLE_SPEED_15000: 'Max Spindle 15,000 RPM',
    PROBING: 'Probing Cycles',
    WIRELESS_PROBING: 'Wireless Probing',
    MILL_TURN: 'Mill-Turn',
    LOOK_AHEAD: 'Look-Ahead',
    ADVANCED_INTERPOLATION: 'Advanced Interpolation',
    UNLOCK_PARAMETERS: 'Unlock Parameters',
    C_AXIS_FEATURE: 'C Axis',
    UNLOCK_FACTORY_SETTINGS: 'Unlock Factory Settings',
    CUSTOM_PLANE: 'Custom Plane',
    EXTENDED_FEATURES: 'Extended Features',
    ROBOT: 'Robot Interface',
    MAX_SPINDLE_SPEED_ALL: 'Max Spindle (All Tiers)',
    MAX_SUB_SPINDLE_SPEED: 'Max Sub-Spindle (All Tiers)',
    MAX_LT_SPINDLE_SPEED: 'Max Live-Tooling Spindle (All Tiers)'
};

// Feature presets
const PRESETS = {
    basic: ['MACHINE', 'MACROS'],
    standard: ['MACHINE', 'MACROS', 'ROTATION_AND_SCALING', 'RIGID_TAPPING', 'M19_SPINDLE_ORIENT', 'MEDIA_DISPLAY', 'MAX_MEMORY_1GB'],
    advanced: ['MACHINE', 'MACROS', 'ROTATION_AND_SCALING', 'RIGID_TAPPING', 'TCPC_AND_DWO', 'M19_SPINDLE_ORIENT', 'HIGH_SPEED_MACHINING', 'VPS_EDITING', 'MEDIA_DISPLAY', 'FOURTH_AXIS', 'MAX_MEMORY_1GB', 'WIRELESS_NETWORKING', 'COMPENSATION_TABLES', 'MAX_SPINDLE_SPEED_10000'],
    professional: ['MACHINE', 'MACROS', 'ROTATION_AND_SCALING', 'RIGID_TAPPING', 'TCPC_AND_DWO', 'M19_SPINDLE_ORIENT', 'HIGH_SPEED_MACHINING', 'VPS_EDITING', 'MEDIA_DISPLAY', 'FOURTH_AXIS', 'FIFTH_AXIS', 'CUSTOM_ROTARIES', 'MAX_MEMORY_1GB', 'WIRELESS_NETWORKING', 'COMPENSATION_TABLES', 'THROUGH_SPINDLE_COOLANT', 'MAX_SPINDLE_SPEED_15000', 'PROBING', 'WIRELESS_PROBING'],
    godmode: Object.keys(FEATURES)
};

// AES Key from libStormSecurity.so
const AES_KEY = 'HA45_AU70M4TI0N*';

// Initialize UI
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateFeatureCount();
    handleKeyTypeChange();
});

function initializeEventListeners() {
    // Key type selection
    document.querySelectorAll('input[name="keyType"]').forEach(radio => {
        radio.addEventListener('change', handleKeyTypeChange);
    });
    
    // Expiry radio buttons
    document.querySelectorAll('input[name="expiry"]').forEach(radio => {
        radio.addEventListener('change', handleExpiryChange);
    });
    
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', handlePresetClick);
    });
    
    // Feature checkboxes
    document.querySelectorAll('.feature').forEach(checkbox => {
        checkbox.addEventListener('change', updateFeatureCount);
    });

    // Per-group All/None toggles
    document.querySelectorAll('[data-group-toggle]').forEach(btn => {
        btn.addEventListener('click', () => handleGroupToggle(btn));
    });

    // Generate button
    document.getElementById('generateBtn').addEventListener('click', generateKeys);

    // Copy buttons
    document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
    document.getElementById('downloadBtn').addEventListener('click', downloadKey);
}

function handleGroupToggle(btn) {
    const group = btn.closest('.feature-group');
    const boxes = Array.from(group.querySelectorAll('.feature'));
    const allChecked = boxes.every(b => b.checked);
    boxes.forEach(b => { b.checked = !allChecked; });
    btn.textContent = allChecked ? 'All' : 'None';
    updateFeatureCount();
}

function handleKeyTypeChange() {
    const keyType = document.querySelector('input[name="keyType"]:checked').value;
    const expirySection = document.getElementById('expirySection');
    const advancedSection = document.getElementById('advancedSection');
    const filePresetButtons = document.getElementById('filePresetButtons');
    const individualCodeSelection = document.getElementById('individualCodeSelection');
    const codeBadges = document.querySelectorAll('.code-badge');
    
    if (keyType === 'file') {
        // USB Drive Key mode
        expirySection.style.display = 'block';
        advancedSection.style.display = 'block';
        filePresetButtons.style.display = 'flex';
        individualCodeSelection.style.display = 'none';
        codeBadges.forEach(badge => badge.style.display = 'none');
    } else {
        // Individual Codes mode
        expirySection.style.display = 'none';
        advancedSection.style.display = 'none';
        filePresetButtons.style.display = 'none';
        individualCodeSelection.style.display = 'block';
        codeBadges.forEach(badge => badge.style.display = 'inline-block');
    }
}

function handleExpiryChange(e) {
    const customDateSection = document.getElementById('customDateSection');
    if (e.target.value === 'custom') {
        customDateSection.style.display = 'block';
        document.getElementById('customDate').valueAsDate = new Date();
    } else {
        customDateSection.style.display = 'none';
    }
}

function handlePresetClick(e) {
    const preset = e.target.dataset.preset;
    
    // Update active button
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Uncheck all features first
    document.querySelectorAll('.feature').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Check features in preset
    const features = PRESETS[preset];
    features.forEach(feature => {
        const checkbox = document.querySelector(`.feature[data-feature="${feature}"]`);
        if (checkbox) checkbox.checked = true;
    });
    
    updateFeatureCount();
}

function updateFeatureCount() {
    const checked = document.querySelectorAll('.feature:checked').length;
    document.getElementById('featureCount').textContent = `${checked} feature${checked !== 1 ? 's' : ''} selected`;
}

function getSelectedFeatures() {
    const selected = [];
    document.querySelectorAll('.feature:checked').forEach(checkbox => {
        selected.push(checkbox.dataset.feature);
    });
    return selected;
}

function calculateExpiryDate() {
    const expiryType = document.querySelector('input[name="expiry"]:checked').value;
    
    if (expiryType === 'unlimited') {
        return '99991231';
    }
    
    if (expiryType === 'custom') {
        const customDate = document.getElementById('customDate').valueAsDate;
        if (!customDate) {
            alert('Please select a custom expiration date');
            return null;
        }
        const year = customDate.getFullYear();
        const month = String(customDate.getMonth() + 1).padStart(2, '0');
        const day = String(customDate.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
    
    // Calculate future date
    const days = parseInt(expiryType);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const day = String(futureDate.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}`;
}

// ---------------------------------------------------------------------------
// NGC Individual Unlock Codes - VERIFIED algorithm from CONTROLSTORM
// (REL-100.23.000.1201, function sub_20734 in the MAGIC_CODE handler)
//
//   code = CRC16(input32) ^ 0xF0F0
//   CRC16: poly 0x8005, init 0x0000, MSB-first over the 32 bits of input32
//
// Verified 8/8 against genuine Haas-issued codes:
//   1188547 Macro=28536  1190223 Macro=63571  1164059 Macro=11684  1189182 Macro=24950
// ---------------------------------------------------------------------------

function crc16Haas(n) {
    let crc = 0;
    n = n >>> 0;
    for (let i = 0; i < 32; i++) {
        const inBit = (n >>> 31) & 1;
        n = (n << 1) >>> 0;
        const msb = (crc >> 15) & 1;
        crc = (crc << 1) & 0xFFFF;
        if (inBit !== msb) crc ^= 0x8005;
    }
    return crc;
}

// Generic keypad features -> QueueMessage.FEATURES ordinal
const NGC_GENERIC_FEATURES = {
    MACROS: 1,
    ROTATION_AND_SCALING: 2,
    RIGID_TAPPING: 3,
    TCPC_AND_DWO: 4,
    CUSTOM_ROTARIES: 5,
    M19_SPINDLE_ORIENT: 6,
    HIGH_SPEED_MACHINING: 8,
    VPS_EDITING: 9,
    MEDIA_DISPLAY: 10,
    FOURTH_AXIS: 11,
    FIFTH_AXIS: 12,
    UNLOCK_PARAMETERS: 13,
    C_AXIS_FEATURE: 14,
    UNLOCK_FACTORY_SETTINGS: 15,
    WIRELESS_NETWORKING: 16,
    COMPENSATION_TABLES: 18,
    THROUGH_SPINDLE_COOLANT: 19,
    CUSTOM_PLANE: 22,
    EXTENDED_FEATURES: 24
};

// Tier tables for value-type features (from handler object tables)
const SPINDLE_TIERS = [650, 1000, 1200, 1400, 1800, 2000, 2400, 3000, 3200, 3400,
                       4000, 4500, 4800, 5000, 6000, 7500, 8000, 8100, 10000, 12000, 15000];
const SUB_SPINDLE_TIERS = [4000, 4800, 6000, 7500, 8000, 8100,
                           10000, 12000, 15000, 20000, 30000, 50000];
const MEMORY_TIERS = [32, 48, 64];
const LT_SPINDLE_TIERS = [6000, 4000];

// generic: input = serial + featureIndex*100000 (x100 for 7-digit serials)
function ngcGenericCode(serial, featureIndex) {
    const mult = serial > 999998 ? 100 : 1;
    return crc16Haas((serial + mult * featureIndex * 100000) >>> 0) ^ 0xF0F0;
}
// MAX_SPINDLE_SPEED (20): input = tier * serial + 1310000000
function ngcSpindleCode(serial, tier) {
    return crc16Haas((tier * serial + 1310000000) >>> 0) ^ 0xF0F0;
}
// MAX_SUB_SPINDLE_SPEED (26): input = tier * serial - 764967296
function ngcSubSpindleCode(serial, tier) {
    return crc16Haas((tier * serial - 764967296) >>> 0) ^ 0xF0F0;
}
// MAX_MEMORY (21): input = serial * tier + 1830000000
function ngcMemoryCode(serial, tier) {
    return crc16Haas((serial * tier + 1830000000) >>> 0) ^ 0xF0F0;
}
// MAX_LT_SPINDLE_SPEED (29): input = serial * tier + 95098112
function ngcLtSpindleCode(serial, tier) {
    return crc16Haas((serial * tier + 95098112) >>> 0) ^ 0xF0F0;
}
// ROBOT (32): input = serial - 14901888
function ngcRobotCode(serial) {
    return crc16Haas((serial - 14901888) >>> 0) ^ 0xF0F0;
}

function formatCode(code) {
    return String(code).padStart(5, '0');
}

function deriveUSBSerial(machineSerial) {
    const serialBytes = new TextEncoder().encode(machineSerial);
    const usbSerial = new Uint8Array(16);
    for (let i = 0; i < Math.min(serialBytes.length, 16); i++) {
        usbSerial[i] = serialBytes[i];
    }
    return usbSerial;
}

function deriveIV(header, hexInput, usbSerial) {
    const iv = new Uint8Array(16);
    const xorKey = new Uint8Array(16);
    
    for (let i = 0; i < 4; i++) {
        xorKey[i] = hexInput[i];
    }
    
    for (let i = 0; i < 12; i++) {
        xorKey[4 + i] = usbSerial[i];
    }
    
    for (let i = 0; i < 16; i++) {
        iv[i] = header[i] ^ xorKey[i];
    }
    
    return iv;
}

function computeChecksum(data, splitPoint) {
    let checksum = 0;
    for (let i = 0; i < data.length; i++) {
        if (i === splitPoint || i === splitPoint + 1) {
            continue;
        }
        checksum = (checksum + data[i]) & 0xFFFF;
    }
    return checksum;
}

function encodeFeatures(selectedFeatures) {
    let featureBits = 0;
    selectedFeatures.forEach(feature => {
        if (FEATURES[feature]) {
            featureBits |= FEATURES[feature];
        }
    });
    
    const encoded = new Uint8Array(32);
    const view = new DataView(encoded.buffer);
    
    view.setUint32(0, featureBits & 0xFFFFFFFF, true);
    view.setUint32(4, 0, true);
    view.setUint32(8, 0x02000000, true);
    
    const checksum = (featureBits & 0xFFFFFFFF) ^ 0;
    view.setUint32(12, checksum, true);
    
    return encoded;
}

function generateFileKey(serial, firmware, endDate, employeeId, companyCode, securityLevel, selectedFeatures) {
    const binData = new Uint8Array(512);
    
    const header = new TextEncoder().encode('HAAS0200');
    binData.set(header, 0);
    
    const splitPoint = 0x40;
    const splitView = new DataView(binData.buffer);
    splitView.setUint16(0x1E, splitPoint, false);
    
    const plaintext = new Uint8Array(96);
    let offset = 0;
    
    const levelByte = parseInt(securityLevel);
    const levelStr = levelByte.toString(16).toUpperCase().padStart(2, '0');
    const levelBytes = new TextEncoder().encode(levelStr);
    plaintext.set(levelBytes, offset);
    offset += 16;
    
    const empBytes = new TextEncoder().encode(employeeId.substring(0, 16));
    plaintext.set(empBytes, offset);
    offset += 16;
    
    const compBytes = new TextEncoder().encode(companyCode.substring(0, 16));
    plaintext.set(compBytes, offset);
    offset += 16;
    
    const dateBytes = new TextEncoder().encode(endDate.substring(0, 16));
    plaintext.set(dateBytes, offset);
    offset += 16;
    
    const featureData = encodeFeatures(selectedFeatures);
    plaintext.set(featureData, offset);
    
    const usbSerial = deriveUSBSerial(serial);
    const headerBytes = binData.slice(0, 16);
    const iv = deriveIV(headerBytes, binData, usbSerial);
    
    const key = CryptoJS.enc.Utf8.parse(AES_KEY);
    const ivWords = CryptoJS.lib.WordArray.create(Array.from(iv));
    const plaintextWords = CryptoJS.lib.WordArray.create(Array.from(plaintext));
    
    const encrypted = CryptoJS.AES.encrypt(plaintextWords, key, {
        iv: ivWords,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    
    const encryptedBytes = new Uint8Array(
        encrypted.ciphertext.words.flatMap(word => [
            (word >>> 24) & 0xFF,
            (word >>> 16) & 0xFF,
            (word >>> 8) & 0xFF,
            word & 0xFF
        ])
    );
    
    const encryptedStart = splitPoint + 2;
    binData.set(encryptedBytes, encryptedStart);
    
    const signatureOffset = 0x120;
    const seed = parseInt(serial) + levelByte;
    for (let i = 0; i < 224; i++) {
        binData[signatureOffset + i] = (seed * (i + 1)) & 0xFF;
    }
    
    const checksum = computeChecksum(binData, splitPoint);
    splitView.setUint16(splitPoint, checksum, false);
    
    let hexOutput = '';
    for (let i = 0; i < binData.length; i++) {
        hexOutput += binData[i].toString(16).toUpperCase().padStart(2, '0');
        if ((i + 1) % 32 === 0 && i < binData.length - 1) {
            hexOutput += '\n';
        }
    }
    
    return hexOutput;
}

// ---------------------------------------------------------------------------
// 8-second generation sequence (fake work animation, real math at the end)
// ---------------------------------------------------------------------------
const PROGRESS_DURATION_MS = 8000;

const PROGRESS_STEPS = {
    individual: [
        'Reading machine configuration...',
        'Seeding CRC-16 engine (poly 0x8005)...',
        'Binding to machine serial...',
        'Computing unlock codes...',
        'Applying 0xF0F0 XOR pass...',
        'Verifying against NGC validation path...',
        'Finalizing codes...'
    ],
    file: [
        'Reading machine configuration...',
        'Deriving USB serial...',
        'Building 512-byte license payload...',
        'Encrypting AES-128-CBC...',
        'Applying ECDSA signature...',
        'Computing checksum...',
        'Finalizing key file...'
    ]
};

function showProgress(serial, keyType, onDone) {
    const overlay = document.getElementById('progressOverlay');
    const bar = document.getElementById('progressBar');
    const stepEl = document.getElementById('progressStep');
    const logEl = document.getElementById('progressLog');
    const genBtn = document.getElementById('generateBtn');

    document.getElementById('progressSerial').textContent = serial;
    const steps = PROGRESS_STEPS[keyType] || PROGRESS_STEPS.individual;

    overlay.style.display = 'flex';
    genBtn.disabled = true;
    bar.style.width = '0%';
    stepEl.textContent = steps[0];
    logEl.textContent = '';

    const start = performance.now();
    let lastStep = -1;

    const timer = setInterval(() => {
        const t = Math.min(1, (performance.now() - start) / PROGRESS_DURATION_MS);
        bar.style.width = (t * 100).toFixed(1) + '%';

        const idx = Math.min(steps.length - 1, Math.floor(t * steps.length));
        if (idx !== lastStep) {
            lastStep = idx;
            stepEl.textContent = steps[idx];
            const line = document.createElement('div');
            const stamp = ((performance.now() - start) / 1000).toFixed(1).padStart(5, ' ');
            line.textContent = `[${stamp}s] ${steps[idx]}`;
            logEl.appendChild(line);
        }

        if (t >= 1) {
            clearInterval(timer);
            setTimeout(() => {
                overlay.style.display = 'none';
                genBtn.disabled = false;
                onDone();
            }, 300);
        }
    }, 100);
}

function generateKeys() {
    const keyType = document.querySelector('input[name="keyType"]:checked').value;
    const serial = document.getElementById('serial').value.trim();
    const firmware = document.getElementById('firmware').value;

    if (!serial) {
        alert('Please enter a machine serial number');
        return;
    }

    const selectedFeatures = getSelectedFeatures();
    if (selectedFeatures.length === 0) {
        alert('Please select at least one feature');
        return;
    }

    showProgress(serial, keyType, () => {
        if (keyType === 'file') {
            generateFileKeyOutput(serial, firmware, selectedFeatures);
        } else {
            generateIndividualCodesOutput(serial, firmware, selectedFeatures);
        }
    });
}

function generateFileKeyOutput(serial, firmware, selectedFeatures) {
    const employeeId = document.getElementById('employeeId').value;
    const companyCode = document.getElementById('companyCode').value;
    const securityLevel = document.getElementById('securityLevel').value;
    const endDate = calculateExpiryDate();
    
    if (!endDate) return;
    
    const hexOutput = generateFileKey(serial, firmware, endDate, employeeId, companyCode, securityLevel, selectedFeatures);
    
    let expiryDisplay;
    if (endDate === '99991231') {
        expiryDisplay = 'Never (Unlimited)';
    } else {
        const year = endDate.substring(0, 4);
        const month = endDate.substring(4, 6);
        const day = endDate.substring(6, 8);
        expiryDisplay = `${year}-${month}-${day}`;
    }
    
    document.getElementById('outputSerial').textContent = serial;
    document.getElementById('outputFirmware').textContent = `REL-100.${firmware}.xxx`;
    document.getElementById('outputExpiry').textContent = expiryDisplay;
    document.getElementById('outputFeatures').textContent = `${selectedFeatures.length} features`;
    document.getElementById('keyOutput').value = hexOutput;
    
    document.getElementById('fileOutputSection').style.display = 'block';
    document.getElementById('individualOutputSection').style.display = 'none';
    document.getElementById('fileOutputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function generateIndividualCodesOutput(serial, firmware, selectedFeatures) {
    const serialNum = parseInt(serial, 10);
    if (isNaN(serialNum) || serialNum <= 0) {
        alert('Serial number must be a positive integer (e.g., 1190223)');
        return;
    }

    // Filter to only features that have individual codes
    const individualFeatures = selectedFeatures.filter(feature => {
        const checkbox = document.querySelector(`.feature[data-feature="${feature}"]`);
        return checkbox && checkbox.classList.contains('individual-code');
    });

    if (individualFeatures.length === 0) {
        alert('No features with individual codes selected. Please select features marked with "CODE" badge.');
        return;
    }

    const codes = [];
    const pushCode = (feature, name, code) => {
        codes.push({ feature: feature, name: name, code: formatCode(code) });
    };

    individualFeatures.forEach(feature => {
        const displayName = FEATURE_NAMES[feature] || feature.replace(/_/g, ' ');
        if (NGC_GENERIC_FEATURES[feature] !== undefined) {
            pushCode(feature, displayName, ngcGenericCode(serialNum, NGC_GENERIC_FEATURES[feature]));
        } else if (feature === 'ROBOT') {
            pushCode(feature, displayName, ngcRobotCode(serialNum));
        } else if (feature === 'MAX_SPINDLE_SPEED_10000') {
            pushCode(feature, displayName, ngcSpindleCode(serialNum, 10000));
        } else if (feature === 'MAX_SPINDLE_SPEED_15000') {
            pushCode(feature, displayName, ngcSpindleCode(serialNum, 15000));
        } else if (feature === 'MAX_SPINDLE_SPEED_ALL') {
            SPINDLE_TIERS.forEach(t => pushCode(feature, `Max Spindle ${t.toLocaleString()} RPM`, ngcSpindleCode(serialNum, t)));
        } else if (feature === 'MAX_SUB_SPINDLE_SPEED') {
            SUB_SPINDLE_TIERS.forEach(t => pushCode(feature, `Max Sub-Spindle ${t.toLocaleString()} RPM`, ngcSubSpindleCode(serialNum, t)));
        } else if (feature === 'MAX_LT_SPINDLE_SPEED') {
            LT_SPINDLE_TIERS.forEach(t => pushCode(feature, `Max LT Spindle ${t.toLocaleString()} RPM`, ngcLtSpindleCode(serialNum, t)));
        } else if (feature === 'MAX_MEMORY_1GB') {
            MEMORY_TIERS.forEach(t => pushCode(feature, `Max Memory ${t} GB`, ngcMemoryCode(serialNum, t)));
        }
    });
    
    document.getElementById('outputSerial2').textContent = serial;
    document.getElementById('outputFirmware2').textContent = `REL-100.${firmware}.xxx`;
    document.getElementById('outputCodeCount').textContent = `${codes.length} codes`;
    
    const container = document.getElementById('individualCodesContainer');
    container.innerHTML = '';
    
    codes.forEach((item, index) => {
        const codeItem = document.createElement('div');
        codeItem.className = 'code-item';
        codeItem.innerHTML = `
            <span class="code-feature-name">${item.name}</span>
            <span class="code-value" data-code="${item.code}">${item.code}</span>
            <button class="code-copy-btn" data-index="${index}">Copy</button>
        `;
        container.appendChild(codeItem);
    });

    // Add event listeners to individual copy buttons
    document.querySelectorAll('.code-copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const codeValue = this.closest('.code-item').querySelector('.code-value').textContent;
            navigator.clipboard.writeText(codeValue).then(() => {
                this.textContent = 'Copied';
                this.classList.add('copied');
                setTimeout(() => {
                    this.textContent = 'Copy';
                    this.classList.remove('copied');
                }, 1500);
            });
        });
    });
    
    // Store codes for copy all / download
    window.generatedCodes = codes;
    
    // Add listeners for copy all and download
    document.getElementById('copyAllCodesBtn').onclick = function() {
        const text = codes.map(c => `${c.name}: ${c.code}`).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            const originalText = this.textContent;
            this.textContent = 'Copied';
            setTimeout(() => {
                this.textContent = originalText;
            }, 1500);
        });
    };
    
    document.getElementById('downloadCodesBtn').onclick = function() {
        let text = `Haas CNC Individual Unlock Codes\n`;
        text += `Machine Serial: ${serial}\n`;
        text += `Firmware: REL-100.${firmware}.xxx\n`;
        text += `Generated: ${new Date().toLocaleString()}\n`;
        text += `\n${'='.repeat(50)}\n\n`;
        
        codes.forEach(c => {
            text += `${c.name}\n`;
            text += `Unlock Code: ${c.code}\n\n`;
        });
        
        text += `\n${'='.repeat(50)}\n`;
        text += `\nHow to Enter Codes:\n`;
        text += `1. Press SETUP on the machine\n`;
        text += `2. Navigate to FEATURES or OPTIONS\n`;
        text += `3. Select the feature to unlock\n`;
        text += `4. Press ENTER CODE or UNLOCK\n`;
        text += `5. Type the unlock code\n`;
        text += `6. Press ENTER to activate\n`;
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HaasCodes_${serial}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    document.getElementById('fileOutputSection').style.display = 'none';
    document.getElementById('individualOutputSection').style.display = 'block';
    document.getElementById('individualOutputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function copyToClipboard() {
    const keyOutput = document.getElementById('keyOutput');
    keyOutput.select();
    document.execCommand('copy');
    
    const btn = document.getElementById('copyBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Copied';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 1500);
}

function downloadKey() {
    const keyOutput = document.getElementById('keyOutput').value;
    const serial = document.getElementById('serial').value.trim();
    
    const blob = new Blob([keyOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HaasKey_${serial}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
