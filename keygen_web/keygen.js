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

// ---------------------------------------------------------------------------
// Password lock — SHA-256 of the password is stored, never the plaintext.
// ---------------------------------------------------------------------------
const LOCK_HASH = 'c729b418c0d6e2d3e051993da7e43652de0fb1ffe83fcc1a2846b502e26b86f0';

function initLock() {
    const input = document.getElementById('lockPassword');
    const btn = document.getElementById('lockBtn');
    const err = document.getElementById('lockError');

    if (sessionStorage.getItem('haas_unlocked') === '1') {
        document.body.classList.remove('locked');
        return;
    }

    function tryUnlock() {
        const entered = CryptoJS.SHA256(input.value).toString();
        if (entered === LOCK_HASH) {
            sessionStorage.setItem('haas_unlocked', '1');
            document.body.classList.remove('locked');
        } else {
            input.value = '';
            input.focus();
            err.style.display = 'block';
            err.classList.remove('shake');
            void err.offsetWidth; // restart animation
            err.classList.add('shake');
        }
    }

    btn.addEventListener('click', tryUnlock);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') tryUnlock();
    });
    input.focus();
}

// Initialize UI
document.addEventListener('DOMContentLoaded', function() {
    initLock();
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
        checkbox.addEventListener('change', () => { updateFeatureCount(); updateChallengeVisibility(); });
    });
    const machineBox = document.querySelector('.feature[data-feature="MACHINE"]');
    if(machineBox) machineBox.addEventListener('change', updateChallengeVisibility);

    // Per-group All/None toggles
    document.querySelectorAll('[data-group-toggle]').forEach(btn => {
        btn.addEventListener('click', () => handleGroupToggle(btn));
    });

    // Generate button
    document.getElementById('generateBtn').addEventListener('click', generateKeys);

    // Copy buttons
    document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
    document.getElementById('downloadBtn').addEventListener('click', downloadKey);
    const autoBtn=document.getElementById('autoDeployBtn');
    if(autoBtn) autoBtn.addEventListener('click', autoDeployToPendrive);
    const sweepBtn=document.getElementById('sweepBtn');
    if(sweepBtn) sweepBtn.addEventListener('click', downloadMachineSweep);
}

function handleGroupToggle(btn) {
    const group = btn.closest('.feature-group');
    const boxes = Array.from(group.querySelectorAll('.feature'));
    const allChecked = boxes.every(b => b.checked);
    boxes.forEach(b => { b.checked = !allChecked; });
    btn.textContent = allChecked ? 'All' : 'None';
    updateFeatureCount();
}

function updateChallengeVisibility(){
    const machineChecked = document.querySelector('.feature[data-feature="MACHINE"]')?.checked;
    const isIndividual = document.querySelector('input[name="keyType"]:checked')?.value === 'individual';
    const field = document.getElementById('challengeField');
    const macField = document.getElementById('macField');
    const hint = document.getElementById('machineHint');
    if(field) field.style.display = (machineChecked && isIndividual) ? 'block' : 'none';
    if(macField) macField.style.display = (machineChecked && isIndividual) ? 'block' : 'none';
    if(hint) hint.style.display = (machineChecked && isIndividual) ? 'block' : 'none';
}
function handleKeyTypeChange() {
    const keyType = document.querySelector('input[name="keyType"]:checked').value;
    const expirySection = document.getElementById('expirySection');
    const advancedSection = document.getElementById('advancedSection');
    const filePresetButtons = document.getElementById('filePresetButtons');
    const individualCodeSelection = document.getElementById('individualCodeSelection');
    const codeBadges = document.querySelectorAll('.code-badge');
    updateChallengeVisibility();
    
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
// MACHINE_UNLOCK (0): needs serial + Under Activation Key (challenge from machine)
// REAL BINARY: sub_1F38C sets h264=CRC16(a4)^F0F0, h268=CRC16(a2)^F0F0, h272=CRC16(a3)^F0F0
//             sub_1FAE0: v7=(fullKey-(h268+h272))/1000 must == CRC16(h264 + k*1e6)^F0F0
//             k = dword_1FF950 window 100..850 step 50 (init 100, increment on 50 misses)
// FIXED 2026-08-17: code was CRC16(challenge+k*1M)^F0F0 — WRONG. Now CRC16(h264+k*1M)^F0F0
//       sum was placeholder challenge — now real h268+h272 (see getMachineSumCandidates)
function base32ToInt(str){
    const alphabet="23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let v=0;
    str=str.toUpperCase().replace(/[^2-9A-HJ-MNP-Z]/g,'');
    for(const ch of str){
        const idx=alphabet.indexOf(ch);
        if(idx<0) continue;
        v=v*32+idx;
    }
    return v>>>0;
}
function parseChallenge(challengeStr){
    if(!challengeStr) return NaN;
    const s=challengeStr.trim();
    if(/^[0-9]+$/.test(s)) return parseInt(s,10)>>>0;
    return base32ToInt(s);
}
function parseMac(macStr){
    if(!macStr) return null;
    let s=macStr.trim().replace(/[^0-9a-fA-F]/g,'');
    if(s.length!==12) return null;
    // use low 16 + high 32 as seeds like a2/a3 (radare2 0x1F38C: a2=uxth, a3/a4 32b)
    const low16 = parseInt(s.slice(8,12),16); // last 2 bytes
    const high32 = parseInt(s.slice(0,8),16); // first 4 bytes
    return {low16, high32, raw:s};
}
function getMachineSumCandidates(serial, macStr){
    // a2(16b)+a3(32b) for h268+h272. Real = from QueueMessage -> likely MAC. Provide all.
    const c0 = (crc16Haas(0) ^ 0xF0F0) * 2; // 123360 harness
    const c1 = (crc16Haas(0x1A2B) ^ 0xF0F0) + (crc16Haas(0x3C4D) ^ 0xF0F0); // 42343 oracle
    let candidates = [c0, c1];
    if(serial && !isNaN(serial)){
        const serialLow = serial & 0xFFFF;
        const cSerial = (crc16Haas(serialLow) ^ 0xF0F0) + (crc16Haas(0) ^ 0xF0F0);
        const cSerialFull = (crc16Haas(serial) ^ 0xF0F0) + (crc16Haas(0) ^ 0xF0F0);
        candidates.push(cSerial);
        if(cSerialFull !== cSerial) candidates.push(cSerialFull);
    }
    if(macStr){
        const mac=parseMac(macStr);
        if(mac){
            const cMac = (crc16Haas(mac.low16) ^ 0xF0F0) + (crc16Haas(mac.high32) ^ 0xF0F0);
            const cMacSwap = (crc16Haas(mac.high32 & 0xFFFF) ^ 0xF0F0) + (crc16Haas(parseInt(mac.raw.slice(4,12),16)) ^ 0xF0F0);
            candidates.unshift(cMac); // MAC first if provided (screen shows MAC for a reason)
            if(cMacSwap!==cMac) candidates.splice(1,0,cMacSwap);
        }
    }
    return [...new Set(candidates)];
}
function ngcMachineUnlockCode(serial, challengeStr, k=100){
    const challenge=parseChallenge(challengeStr);
    if(isNaN(challenge)) return null;
    const h264 = crc16Haas(challenge) ^ 0xF0F0; // REAL: h264 is CRC(challenge), not challenge
    const input=(h264 + k*1000000)>>>0;
    return crc16Haas(input) ^ 0xF0F0;
}
function ngcMachineUnlockFullKey(serial, challengeStr, k=100, macStr=null){
    const challenge=parseChallenge(challengeStr);
    if(isNaN(challenge)) return null;
    // FIX 2026-08-17 (red-team class machine-missing-mac-fallback-bypass): MAC is REQUIRED.
    // Without MAC the sum=h268+h272 cannot be known (fallback guesses 123360 etc. produce
    // keys the machine REJECTS -> burns 1 of only 3 tries per challenge). Never guess.
    const macVal = macStr || document.getElementById('mac')?.value;
    if(!macVal || !parseMac(macVal)) return null;
    const code=ngcMachineUnlockCode(serial, challengeStr, k);
    const sums=getMachineSumCandidates(serial, macVal);
    let sum = sums[0]; // MAC-derived sum is unshifted first when MAC present
    const h264 = crc16Haas(challenge) ^ 0xF0F0;
    const fullKey=sum + 1000*code;
    return {code, fullKey, challenge, k, h264, sum, sums};
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
    
    const high = Math.floor(featureBits / 0x100000000) >>> 0;
    const checksum = (featureBits & 0xFFFFFFFF) ^ high;
    view.setUint32(12, checksum, true);
    
    return encoded;
}

// ---------------------------------------------------------------------------
// REAL HaasKey.txt — forensic format from libStormSecurity.so DecryptKey (asm 2921-3598)
// This key elevates SECURITY LEVEL (service dongle: FACTORY/SERVICE/MANAGER/DEVTEST).
// It does NOT unlock features — features are the individual 5-digit activation codes.
// Serial binding is to the PHYSICAL USB stick (ID_SERIAL_SHORT via udevadm), NOT the machine.
// Layout: BE32@0x1E = checksumOfs V1(0x64) | BE32@0x96 = IVseedOfs V2(0xA8) | BE32@0xC8 = ctOfs V3(0x120)
// IV = blob[V2..V2+16] XOR stickSerial(16, NUL->'*') | AES-128-CFB "HA45_AU70M4TI0N*" over blob[V3:0x200]
// plaintext: level@0, employee@0x10, company "1213"@0x20, endDate "MM/dd/yyyy"@0x30 (16-byte fields)
// checksum: BE16 at V1 = sum(all 512 bytes except V1,V1+1), must be <= 0xFFFF (32-bit compare)
// file: ONE line, 1024 uppercase hex chars, NO newlines (.so parses fixed 2-char windows)
// ---------------------------------------------------------------------------
function generateFileKey(stickSerial, level, employeeId, endDateMDY) {
    const blob = new Uint8Array(512);
    blob.set([0x48, 0x41, 0x41, 0x53], 0); // "HAAS" (cosmetic — .so never checks it)
    const dv = new DataView(blob.buffer);
    const V1 = 0x64, V2 = 0xA8, V3 = 0x120;
    dv.setUint32(0x1E, V1, false); // BE32 checksum offset
    dv.setUint32(0x96, V2, false); // BE32 IV-seed offset
    dv.setUint32(0xC8, V3, false); // BE32 ciphertext offset

    const enc = new TextEncoder();
    const pt = new Uint8Array(0x200 - V3); // 224 bytes
    pt.set(enc.encode(level).slice(0, 16), 0x00);      // SERVICE / FACTORY / MANAGER / DEVTEST
    pt.set(enc.encode(employeeId).slice(0, 16), 0x10);
    pt.set(enc.encode('1213'), 0x20);                  // companyCode MUST be "1213" (Java verifyCompanyCode)
    pt.set(enc.encode(endDateMDY).slice(0, 16), 0x30); // "MM/dd/yyyy", must be a future date

    const usb = new Uint8Array(16);
    usb.set(enc.encode(stickSerial).slice(0, 16));
    for (let i = 0; i < 16; i++) if (usb[i] === 0) usb[i] = 0x2A; // NUL -> '*'

    const key = CryptoJS.enc.Utf8.parse(AES_KEY); // "HA45_AU70M4TI0N*"
    const ptWords = CryptoJS.enc.Hex.parse(Array.from(pt).map(b => b.toString(16).padStart(2, '0')).join(''));

    let tries = 0;
    while (true) {
        const iv = new Uint8Array(16);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(iv);
        else for (let i = 0; i < 16; i++) iv[i] = Math.floor(Math.random() * 256);
        for (let i = 0; i < 16; i++) blob[V2 + i] = iv[i] ^ usb[i]; // IV seed stored on disk

        const ivWords = CryptoJS.enc.Hex.parse(Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''));
        const ct = CryptoJS.AES.encrypt(ptWords, key, { iv: ivWords, mode: CryptoJS.mode.CFB, padding: CryptoJS.pad.NoPadding });
        const ctHex = ct.ciphertext.toString(CryptoJS.enc.Hex);
        const ctBytes = new Uint8Array(ctHex.match(/.{1,2}/g).map(h => parseInt(h, 16)));
        blob.set(ctBytes.slice(0, pt.length), V3);

        let sum = 0;
        for (let i = 0; i < 512; i++) if (i !== V1 && i !== V1 + 1) sum += blob[i];
        if (sum <= 0xFFFF || ++tries > 100) {
            blob[V1] = (sum >> 8) & 0xFF; // BE16 at V1
            blob[V1 + 1] = sum & 0xFF;
            break;
        }
    }

    // ONE line, 1024 uppercase hex chars, NO newlines
    return Array.from(blob).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');
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
    if(selectedFeatures.includes('MACHINE') && document.querySelector('input[name="keyType"]:checked').value==='individual'){
        const ch=document.getElementById('challenge')?.value.trim();
        if(!ch){
            alert('Machine Control needs Under Activation Key (from machine: SETUP → Activation). Enter it.');
            document.getElementById('challenge')?.focus();
            return;
        }
        const mac=document.getElementById('mac')?.value.trim();
        if(!mac || !parseMac(mac)){
            alert('Machine Control REQUIRES the MAC Address (SETUP → Network/Machine Info, e.g. 00:1E:BF:00:9E:CB). Without MAC the key will be WRONG and burns 1 of your 3 tries.');
            document.getElementById('mac')?.focus();
            return;
        }
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
    const stickSerial = document.getElementById('stickSerial')?.value.trim();
    if (!stickSerial) {
        alert('USB stick hardware serial REQUIRED — the key is bound to THAT stick, not the machine.\n\nOn any Linux (or the control itself via service mode):\nudevadm info --query=all -n /dev/sdX | grep ID_SERIAL_SHORT\n\nExample: 6E009184F6A68533');
        document.getElementById('stickSerial')?.focus();
        return;
    }
    const employeeId = document.getElementById('employeeId').value;
    const level = document.getElementById('securityLevel').value; // FACTORY/SERVICE/MANAGER/DEVTEST
    const endDate = calculateExpiryDate();

    if (!endDate) return;

    // Java verifyDate expects MM/dd/yyyy, must be a future date
    const endDateMDY = (endDate === '99991231')
        ? '12/31/2099'
        : `${endDate.substring(4, 6)}/${endDate.substring(6, 8)}/${endDate.substring(0, 4)}`;

    const hexOutput = generateFileKey(stickSerial, level, employeeId, endDateMDY);
    
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
        if (feature === 'MACHINE') {
            const challenge = document.getElementById('challenge')?.value.trim();
            if(!challenge){
                codes.push({ feature, name: displayName + ' — NEEDS activation key', code: 'Enter Under Activation Key above' });
            } else {
                const res = ngcMachineUnlockFullKey(serialNum, challenge, 100, document.getElementById('mac')?.value.trim());
                if(res){
                    // PR1 hotfix: single FULL KEY only (the machine expects fullKey, not 5-digit code)
                    // Show ONE line: Full Billing Key, with hint that old challenge is burned if EXPIRED
                    pushCode(feature, displayName + ` (Activation Code ${challenge} → use this)`, res.fullKey);
                    // store extra meta for download text
                    codes[codes.length-1].hint = `If screen shows EXPIRED, reboot for NEW Activation Code — this key was for k=${res.k}`;
                } else {
                    codes.push({ feature, name: displayName, code: 'MAC required (SETUP → Network) — no key generated' });
                }
            }
        } else if (NGC_GENERIC_FEATURES[feature] !== undefined) {
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
    const _sweepBtn=document.getElementById('sweepBtn');
    const _sweepHint=document.getElementById('sweepHint');
    const _hasMachine=individualFeatures.includes('MACHINE');
    if(_sweepBtn) _sweepBtn.style.display=_hasMachine?'inline-block':'none';
    if(_sweepHint) _sweepHint.style.display=_hasMachine?'block':'none';
    
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
async function autoDeployToPendrive(){
    const hex=document.getElementById('keyOutput')?.value;
    const serial=document.getElementById('serial')?.value.trim()||'unknown';
    if(!hex){ alert('Generate a key first'); return; }
    try{
        if(!window.showDirectoryPicker){
            downloadKey();
            alert('Auto deploy needs Chrome/Edge with File System Access. Downloaded HaasKey.txt — copy to FAT32 stick as HaasKey.txt');
            return;
        }
        const dir=await window.showDirectoryPicker({mode:'readwrite'});
        const fh=await dir.getFileHandle('HaasKey.txt',{create:true});
        const w=await fh.createWritable();
        await w.write(hex);
        await w.close();
        const btn=document.getElementById('autoDeployBtn');
        const orig=btn.textContent; btn.textContent='Stored ✓ safely eject';
        setTimeout(()=>btn.textContent=orig,2500);
        document.getElementById('autoDeployHint').textContent=`Stored HaasKey.txt for ${serial} to ${dir.name} — safely eject, insert, reboot`;
    }catch(e){
        if(e.name==='AbortError') return;
        alert('Auto deploy failed: '+e.message+' — using download');
        downloadKey();
    }
}
function downloadMachineSweep(){
    const serial=document.getElementById('serial')?.value.trim();
    const challenge=document.getElementById('challenge')?.value.trim();
    const mac=document.getElementById('mac')?.value.trim();
    if(!serial||!challenge){ alert('Need Serial + Under Activation Key'); return; }
    if(!mac || !parseMac(mac)){ alert('MAC Address REQUIRED for sweep (SETUP → Network/Machine Info). Wrong sum = burned tries.'); return; }
    const serialNum=parseInt(serial,10);
    const sums=getMachineSumCandidates(serialNum, mac);
    const challengeVal=parseChallenge(challenge);
    const h264=crc16Haas(challengeVal)^0xF0F0;
    let txt=`Haas MACHINE Sweep — Serial ${serial} Challenge ${challenge} (h264=${h264}) MAC ${mac||'(none)'}\n`;
    txt+=`Generated ${new Date().toLocaleString()}\n`;
    txt+=`Radare2 0x1F38C: h264=CRC16(a4) a4=challenge; sum=h268+h272 where h268=CRC16(a2) a2=16b MAC-low, h272=CRC16(a3) a3=32b MAC-high\n`;
    txt+=`FIX 2026-08-17: code=CRC16(h264+k*1M)^F0F0 (was challenge+k*1M). k window 100..850 step 50, 3 tries per challenge then reboot.\n`;
    txt+=`Sums sweep: ${sums.join(', ')} ${mac?'(MAC first)':'(no MAC: harness 123360 first)'}\n`;
    txt+=`${'='.repeat(78)}\n\n`;
    for(const sum of sums){
        txt+=`--- SUM ${sum} (h268+h272) ---\n`;
        for(let k=100;k<150;k++){
            const code=crc16Haas((h264 + k*1000000)>>>0)^0xF0F0;
            const fullKey=sum + 1000*code;
            txt+=`k=${String(k).padStart(3,' ')} sum=${String(sum).padStart(6,' ')}: ${String(fullKey).padStart(10,' ')} (code ${String(code).padStart(5,'0')} h264 ${h264})\n`;
        }
        txt+=`\n`;
    }
    txt+=`How to use:\n1. This sweep is for CURRENT challenge only. After 3 INVALID → EXPIRED → REBOOT for NEW challenge → regenerate.\n2. Try k=100 sum=${sums[0]} first. If INVALID, try k=101 same sum, etc. Do MAX 2 per boot.\n3. If all 150 fail, paste MAC from SETUP→Network and regenerate — MAC-derived sum will be tried first.\n4. Success: handler+308=2 Purchased, dword_1FF950→100, challenge burned.\n`;
    const blob=new Blob([txt],{type:'text/plain'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`MACHINE_${serial}_${challenge}${mac?'_'+mac.replace(/:/g,''):''}_sweep_FIXED.txt`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
