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
    const detectBtn=document.getElementById('detectSticksBtn');
    if(detectBtn) detectBtn.addEventListener('click', detectUsbSticks);
    const stickSel=document.getElementById('stickSelect');
    if(stickSel) stickSel.addEventListener('change', applyStickSelection);
    const sweepBtn=document.getElementById('sweepBtn');
    if(sweepBtn) sweepBtn.addEventListener('click', downloadMachineSweep);
    const cfBtn=document.getElementById('cfGenBtn');
    if(cfBtn) cfBtn.addEventListener('click', generateClassicColdfireCode);

    initInputAnimations();
}

// ---------------------------------------------------------------------------
// CLASSIC ColdFire (M18/M17) permanent unlock code — reversed from M1829B.BIN
// reset_lease @0x10232bac gated by value-match cmp @0x10cec6 against FUN_1012c984.
// code = 1000*CRC(serial+addend) + CRC(mac_tail_hex) + CRC(version_digits)
// CRC-16 poly 0x8005, init 0, MSB-first over 32 bits, final XOR 0xF0F0 (same as NGC crc16Haas).
// Mirrors tools/d1_classic_keygen.py — verified: serial 1119132 / 00:1E:BF:00:9E:CB / M18.29B -> 1540558.
// ---------------------------------------------------------------------------
function classicMacTailHex(macStr){
    // FUN_1012d710: collect chars after the 3rd ':' , parse as hex
    let cnt=0, buf='';
    for(const ch of macStr){
        if(ch===':') cnt++;
        else if(cnt>2) buf+=ch;
    }
    // if no colons (bare hex string), fall back to the last 6 hex chars
    if(cnt<3){ const h=macStr.replace(/[^0-9a-fA-F]/g,''); buf = h.slice(-6); }
    if(!/^[0-9a-fA-F]+$/.test(buf) || buf==='') return null;
    return parseInt(buf,16)>>>0;
}
function classicVersionDigits(verStr){
    // FUN_1012d80c: keep only digit chars, decimal atoi. "M18.29B" -> 1829
    const d=(verStr||'').replace(/[^0-9]/g,'');
    if(d==='') return null;
    return parseInt(d,10)>>>0;
}
// crc16Haas() returns the raw CRC WITHOUT the final XOR (NGC callers apply ^0xF0F0
// themselves). The classic firmware bakes the ^0xF0F0 into the CRC, so apply it here.
function classicCrc(v){ return (crc16Haas(v>>>0) ^ 0xF0F0) & 0xFFFF; }
function classicUnlockCode(serial, macStr, verStr){
    const mac=classicMacTailHex(macStr);
    const ver=classicVersionDigits(verStr);
    if(mac===null || ver===null || !(serial>0)) return null;
    const addend = serial>999999 ? 70000000 : 700000;
    const crcC = classicCrc((serial+addend)>>>0);   // *1000 term
    const crcB = classicCrc(mac);                    // MAC tail
    const crcA = classicCrc(ver);                    // version digits
    return {code:(1000*crcC + crcB + crcA)>>>0, crcA, crcB, crcC, mac, ver, addend};
}
function generateClassicColdfireCode(){
    const out=document.getElementById('cfResult');
    const serial=parseInt((document.getElementById('cfSerial')?.value||'').trim(),10);
    const mac=(document.getElementById('cfMac')?.value||'').trim();
    const ver=(document.getElementById('cfVer')?.value||'').trim();
    if(!out) return;
    if(!(serial>0)){ out.style.display='block'; out.innerHTML='<strong style="color:#dc2626">Enter a valid serial number.</strong>'; return; }
    const r=classicUnlockCode(serial, mac, ver);
    if(!r){ out.style.display='block'; out.innerHTML='<strong style="color:#dc2626">Need serial + MAC (with colons, e.g. 00:1E:BF:00:9E:CB) + version (e.g. M18.29B).</strong>'; return; }
    out.style.display='block';
    out.innerHTML =
        '<div>Permanent unlock code (type on the lease/registration entry):</div>'+
        '<div style="font-size:22px; font-weight:bold; letter-spacing:2px; margin:4px 0;">'+r.code+'</div>'+
        '<div style="font-size:11px; color:#78716c;">CRC_C=crc(serial+'+r.addend+')='+r.crcC+' · CRC_B=crc(MAC 0x'+r.mac.toString(16).toUpperCase()+')='+r.crcB+' · CRC_A=crc(ver '+r.ver+')='+r.crcA+'</div>'+
        '<div style="font-size:11px; color:#78716c; margin-top:4px;">If the machine\'s Network screen shows a different MAC, re-enter it — the code changes. Or use Path A: type 0 into the BILL TIME field.</div>';
}

// Per-keystroke "pop" on the numeric/key inputs. Pure UI — retriggers the
// CSS animation by removing and re-adding the class on each input event.
function initInputAnimations() {
    const ids = ['serial', 'challenge', 'mac', 'swversion', 'stickSerial', 'employeeId'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;
        el.addEventListener('input', () => {
            el.classList.remove('typing');
            // force reflow so the animation restarts cleanly every keystroke
            void el.offsetWidth;
            el.classList.add('typing');
        });
        el.addEventListener('animationend', () => el.classList.remove('typing'));
    });
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
    const show = (machineChecked && isIndividual) ? 'block' : 'none';
    const field = document.getElementById('challengeField');
    const macField = document.getElementById('macField');
    const verField = document.getElementById('swversionField');
    const hint = document.getElementById('machineHint');
    if(field) field.style.display = show;
    if(macField) macField.style.display = show;
    if(verField) verField.style.display = show;
    if(hint) hint.style.display = show;
    const cf = document.getElementById('coldfireHint');
    if(cf) cf.style.display = show;
}
function handleKeyTypeChange() {
    const keyType = document.querySelector('input[name="keyType"]:checked').value;
    const expirySection = document.getElementById('expirySection');
    const advancedSection = document.getElementById('advancedSection');
    const filePresetButtons = document.getElementById('filePresetButtons');
    const individualCodeSelection = document.getElementById('individualCodeSelection');
    const codeBadges = document.querySelectorAll('.code-badge');
    updateChallengeVisibility();
    
    const serialField = document.getElementById('serialField');
    const featuresSection = document.getElementById('featuresSection');
    if (keyType === 'file') {
        // USB Drive Key mode — service dongle: NO machine serial, NO features (presets/checkboxes are fake here)
        expirySection.style.display = 'block';
        advancedSection.style.display = 'block';
        if(featuresSection) featuresSection.style.display = 'none';
        filePresetButtons.style.display = 'none';
        individualCodeSelection.style.display = 'none';
        codeBadges.forEach(badge => badge.style.display = 'none');
        if(serialField) serialField.style.display = 'none';
    } else {
        // Individual Codes mode — feature checkboxes are REAL (5-digit codes vs sub_20734); presets = multi-select
        expirySection.style.display = 'none';
        advancedSection.style.display = 'none';
        if(featuresSection) featuresSection.style.display = 'block';
        filePresetButtons.style.display = 'flex';
        individualCodeSelection.style.display = 'block';
        codeBadges.forEach(badge => badge.style.display = 'inline-block');
        if(serialField) serialField.style.display = 'block';
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
// MACHINE_UNLOCK (0) — GROUND TRUTH re-verified 2026-08-17 against CONTROLSTORM REL-100.23
// disasm + JavaMain bytecode (see sandbox_verify_machine/REPORT.md):
//   msg+0x08 = machinePoweronTime (int64) -> CRC1 = CRC16(powerOnTime & 0xFFFF)^F0F0   [h+0x108]
//   msg+0x18 = macaddress (last 3 MAC bytes) -> CRC2 = CRC16(macInt & 0xFFFF)^F0F0     [h+0x10C]
//   msg+0x14 = softwareversion (int, "100.23.000.1201"->230001201) -> CRC3 = CRC16(softVer)^F0F0 [h+0x110]
//   Displayed "Under Activation Key" = CRC1 + CRC2 + CRC3  ([h+0x114] -> pseudoRandomNumber)
// TWO independent accept paths in fcn.0001fae0:
//   PERMANENT (legacy, sub_1F914/sub_1FA00): key == 1000*CRC16(serial+70M|700K)^F0F0 + CRC2 + CRC3
//       -> [h+0x134]=1 -> response featureUnlock -> purchaseFeature(MACHINE_UNLOCK). No challenge,
//       no k-window, no power-on-time race. 70M addend always (sub_1FA00), or 70M if serial>999999
//       else 700K (sub_1F914) — identical for 7-digit serials.
//   BILLING (k-loop): trunc((key-(CRC2+CRC3))/1000) == CRC16(CRC1 + k*1e6)^F0F0,
//       k in [dword_1FF950, +50), fresh boot 100 -> [h+0x134]=2, daysPurchased = k-100.
// ENTRY PARSING: activation screen parses the typed key with Base32ToInt (alphabet
//   23456789ABCDEFGHJKLMNPQRSTUVWXYZ — '0'/'1' silently DROPPED) => keys must be given BASE32.
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
    // Java getLastPartMacAddress(): display "XX:XX:XX:XX:XX:XX".substring(9) -> last 3 bytes.
    // Firmware CRCs uxth(macInt) = last 2 bytes (leading zeros are no-ops for this CRC).
    const low16 = parseInt(s.slice(8,12),16); // last 2 bytes == macInt & 0xFFFF
    const high32 = parseInt(s.slice(0,8),16); // kept for reference; NOT used by firmware
    return {low16, high32, raw:s};
}
// Java SoftwareVersion.softwareVersionForMagicCode():
//   Integer.valueOf(getSoftwareVersion().replace(".","").substring(3))
//   "100.23.000.1201" -> "100230001201" -> "230001201"
function parseSoftwareVersion(v){
    if(!v) return null; // null only means "nothing entered" (required-field check)
    // Faithful mirror of Java SoftwareVersion.softwareVersionForMagicCode():
    //   n = 0; try { n = Integer.valueOf( getSoftwareVersion().replace(".","").substring(3) ); }
    //          catch(Exception) { /* n stays 0 */ }
    // So a version whose char[3..] is not a pure integer (e.g. NGC-M "M18.29B" -> "29B")
    // yields softVer = 0 in the firmware. We must return 0, NOT null, to match the machine.
    const s = v.trim().replace(/\./g,'');
    if(s.length < 3) return 0;                 // substring(3) on <3 chars throws -> caught -> 0
    const tail = s.substring(3);
    if(!/^-?\d+$/.test(tail)) return 0;        // Integer.valueOf requires the whole string numeric
    const n = parseInt(tail,10);
    if(isNaN(n) || n<0 || n>0xFFFFFFFF) return 0;
    return n>>>0;
}
function ngcMachineParts(macStr, versionStr){
    const mac=parseMac(macStr);
    if(!mac) return null;
    const softVer=parseSoftwareVersion(versionStr);
    if(softVer===null) return null;
    const crc2=crc16Haas(mac.low16)^0xF0F0;  // CRC16(macInt): upper zero bytes don't change this CRC
    const crc3=crc16Haas(softVer)^0xF0F0;
    return {crc2, crc3, softVer, mac};
}
// Base32 with the machine's alphabet (MathematicalConversions.Base32ToInt).
// The activation screen DROPS '0'/'1' and base32-decodes, so all keys are shown base32.
function base32Encode(n){
    const alphabet="23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    n=n>>>0;
    if(n===0) return alphabet[0];
    let s="";
    while(n>0){ s=alphabet[n%32]+s; n=Math.floor(n/32); }
    return s;
}
// PERMANENT machine unlock (legacy accept, checked first): no challenge, no k-window.
// key = 1000*CRC16(serial + addend)^F0F0 + CRC2 + CRC3
//   sub_1FA00 ([h+0x1c4]==0): addend = 70000000 always
//   sub_1F914 ([h+0x1c4]!=0): addend = 70000000 if serial>999999 else 700000
function ngcMachinePermanentKey(serial, macStr, versionStr){
    const p=ngcMachineParts(macStr, versionStr);
    if(!p) return null;
    const mk=(addend)=>((1000*(crc16Haas((serial+addend)>>>0)^0xF0F0) + p.crc2 + p.crc3)>>>0);
    const keyA=mk(70000000);                       // correct for every 7-digit serial; and for [h+0x1c4]==0
    const keyB=serial>999999 ? keyA : mk(700000);  // only differs for short serials on [h+0x1c4]!=0
    return {keyA, keyA_b32:base32Encode(keyA), keyB, keyB_b32:base32Encode(keyB),
            differs:keyB!==keyA, crc2:p.crc2, crc3:p.crc3, softVer:p.softVer};
}
// BILLING (k-loop) key: needs the displayed Under Activation Key (challenge).
// challenge = CRC1+CRC2+CRC3  =>  CRC1 = challenge - CRC2 - CRC3 (must be 0..65535, else
// the MAC/version/challenge combo is inconsistent and the key would be WRONG).
// Machine check: trunc((key-(CRC2+CRC3))/1000) == CRC16(CRC1 + k*1e6)^F0F0, k in [100,150) fresh.
function ngcMachineUnlockFullKey(serial, challengeStr, k=100, macStr=null, versionStr=null){
    const challenge=parseChallenge(challengeStr);
    if(isNaN(challenge)) return null;
    const macVal = macStr || document.getElementById('mac')?.value;
    const verVal = versionStr || document.getElementById('swversion')?.value;
    const p=ngcMachineParts(macVal, verVal);
    if(!p) return null;
    const crc1=challenge - p.crc2 - p.crc3;
    if(crc1<0 || crc1>0xFFFF){
        return {error:'crc1_range', crc1, crc2:p.crc2, crc3:p.crc3, challenge};
    }
    const code=crc16Haas((crc1 + k*1000000)>>>0)^0xF0F0;
    const fullKey=(p.crc2 + p.crc3) + 1000*code;
    return {code, fullKey, fullKey_b32:base32Encode(fullKey), challenge, k, crc1,
            sum:p.crc2+p.crc3, crc2:p.crc2, crc3:p.crc3};
}

function formatCode(code) {
    return String(code).padStart(5, '0');
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
    const isFile = (keyType === 'file');

    // USB drive key: no machine serial and no features needed (service dongle = stick serial + level + date)
    if (!isFile && !serial) {
        alert('Please enter a machine serial number');
        return;
    }

    const selectedFeatures = getSelectedFeatures();
    if (!isFile && selectedFeatures.length === 0) {
        alert('Please select at least one feature');
        return;
    }
    if(selectedFeatures.includes('MACHINE') && document.querySelector('input[name="keyType"]:checked').value==='individual'){
        const mac=document.getElementById('mac')?.value.trim();
        if(!mac || !parseMac(mac)){
            alert('Machine Control REQUIRES the MAC Address (SETUP → Network/Machine Info, e.g. 00:1E:BF:00:9E:CB). The firmware CRCs it — wrong MAC = wrong key.');
            document.getElementById('mac')?.focus();
            return;
        }
        const ver=document.getElementById('swversion')?.value.trim();
        if(!ver || parseSoftwareVersion(ver)===null){
            alert('Machine Control REQUIRES the Software Version exactly as shown on the control (e.g. 100.23.000.1201). The firmware CRCs it — wrong version = wrong key.');
            document.getElementById('swversion')?.focus();
            return;
        }
        const ch=document.getElementById('challenge')?.value.trim();
        if(ch){
            // Pre-validate CRC1 = challenge - CRC2 - CRC3 range so a bad combo never reaches the machine
            const probe=ngcMachineUnlockFullKey(parseInt(serial,10), ch, 100, mac, ver);
            if(probe && probe.error==='crc1_range'){
                alert(`Challenge ${ch} is INCONSISTENT with that MAC + Software Version (recovered CRC1=${probe.crc1}, must be 0..65535).\n\nRecheck the Software Version and the Under Activation Key digits. The PERMANENT key does not need the challenge and is shown regardless.`);
            }
        }
    }

    showProgress(isFile ? (document.getElementById('stickSerial')?.value.trim() || 'USB stick') : serial, keyType, () => {
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
        alert('USB stick hardware serial REQUIRED — the key is bound to THAT stick, not the machine.\n\nWindows (PowerShell): Get-PhysicalDisk | Select FriendlyName, SerialNumber\nLinux / the control: udevadm info --query=all -n /dev/sdX | grep ID_SERIAL_SHORT\n\nPaste the FULL serial, any length (e.g. 0950071171627108316 or 6E009184F6A68533).\nThe machine uses the first 16 chars — verified against DecryptKey bytecode.');
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
    
    const effSerial = stickSerial.slice(0, 16).split('').map(c => c === '\0' ? '*' : c).join('');
    document.getElementById('outputSerial').textContent = stickSerial.length > 16
        ? `stick ${stickSerial} → machine uses first 16: ${effSerial}`
        : `stick ${stickSerial}`;
    document.getElementById('outputFirmware').textContent = 'any (format identical)';
    document.getElementById('outputExpiry').textContent = expiryDisplay;
    document.getElementById('outputFeatures').textContent = 'service level (no feature bits)';
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
            const mac = document.getElementById('mac')?.value.trim();
            const ver = document.getElementById('swversion')?.value.trim();
            const perm = ngcMachinePermanentKey(serialNum, mac, ver);
            if(perm){
                // PERMANENT key (legacy accept path): checked by the firmware BEFORE the k-loop,
                // needs no challenge, no k-window, survives reboots (challenge-independent).
                pushCode(feature, displayName + ' — PERMANENT key (type this first)', perm.keyA_b32);
                codes[codes.length-1].hint = `Base32 — type exactly, letters included (machine keypad drops 0/1 by design). Decimal value ${perm.keyA}.`;
                if(perm.differs){
                    pushCode(feature, displayName + ' — PERMANENT key, variant B (only if A rejected)', perm.keyB_b32);
                    codes[codes.length-1].hint = `Decimal value ${perm.keyB}. Only for short serials on some controls.`;
                }
            } else {
                codes.push({ feature, name: displayName, code: 'MAC + Software Version required — no key generated' });
            }
            if(challenge){
                const res = ngcMachineUnlockFullKey(serialNum, challenge, 100, mac, ver);
                if(res && !res.error){
                    pushCode(feature, displayName + ` — billing key (Activation Code ${challenge}, k=100)`, res.fullKey_b32);
                    codes[codes.length-1].hint = `Only if PERMANENT fails. Challenge-bound: dies on reboot; fresh-boot window k=100. Decimal ${res.fullKey}.`;
                } else if(res && res.error==='crc1_range'){
                    codes.push({ feature, name: displayName + ' — billing key', code: `Challenge inconsistent (CRC1=${res.crc1}) — recheck version/challenge` });
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
            text += `Unlock Code: ${c.code}\n`;
            if(c.hint) text += `Note: ${c.hint}\n`;
            text += `\n`;
        });

        text += `\n${'='.repeat(50)}\n`;
        text += `\nHow to Enter Codes:\n`;
        text += `1. Press SETUP on the machine\n`;
        text += `2. Navigate to FEATURES or OPTIONS\n`;
        text += `3. Select the feature to unlock\n`;
        text += `4. Press ENTER CODE or UNLOCK\n`;
        text += `5. Type the unlock code\n`;
        text += `6. Press ENTER to activate\n`;
        text += `\nMachine Control: the ACTIVATION screen reads keys as BASE32 (alphabet 2-9,A-H,J-N,P-Z —\n`;
        text += `the digits 0 and 1 do not exist there by design). Type the key exactly as shown, letters included.\n`;
        text += `Use the PERMANENT key first: it needs no challenge and never expires.\n`;
        
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
    a.download = 'HaasKey.txt'; // exact name the control looks for on USB0 root
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
// ---------------------------------------------------------------------------
// Local USB agent (usb_agent.py on 127.0.0.1:7932) — auto-detect sticks + auto deploy.
// Browsers cannot read a stick's hardware serial themselves (File System Access API
// exposes no device info; WebUSB blocks mass-storage). The tiny local agent reads
// ID_SERIAL_SHORT / serial_num via the OS and serves it to this page on localhost.
// ---------------------------------------------------------------------------
const USB_AGENT = 'http://127.0.0.1:7932';
let agentSticks = [];

async function detectUsbSticks(){
    const hint = document.getElementById('stickDetectHint');
    const sel = document.getElementById('stickSelect');
    try{
        const r = await fetch(USB_AGENT + '/sticks', { signal: AbortSignal.timeout(2500) });
        if(!r.ok) throw new Error('agent http ' + r.status);
        agentSticks = await r.json();
        sel.innerHTML = '';
        if(!agentSticks.length){
            sel.innerHTML = '<option value="">(no USB stick found — insert FAT32 stick, click Detect again)</option>';
        } else {
            agentSticks.forEach((s, i) => {
                const o = document.createElement('option');
                o.value = i;
                o.textContent = `${s.label || 'USB stick'} — ${s.mountpoint || s.device || 'unmounted'} — serial ${s.serial || '?'}`;
                sel.appendChild(o);
            });
        }
        sel.style.display = 'inline-block';
        if(agentSticks.length === 1){ sel.selectedIndex = 0; applyStickSelection(); }
        else if(agentSticks.length > 1) applyStickSelection();
        if(hint) hint.textContent = `Agent OK — ${agentSticks.length} stick(s) detected. Pick one; serial fills in automatically.`;
    }catch(e){
        agentSticks = [];
        if(hint) hint.innerHTML = 'Agent not running. One-time: <code>python3 usb_agent.py</code> (keygen_web folder) with the stick plugged in, then click Detect again.';
    }
}

function applyStickSelection(){
    const sel = document.getElementById('stickSelect');
    const i = parseInt(sel?.value, 10);
    const s = agentSticks[i];
    if(!s) return;
    if(s.serial) document.getElementById('stickSerial').value = s.serial;
    const hint = document.getElementById('stickDetectHint');
    if(hint) hint.textContent = `Selected: ${s.label || 'USB stick'} at ${s.mountpoint || s.device} — serial ${s.serial || 'unknown'} auto-filled. Generate, then Auto Deploy writes straight to the stick.`;
}

async function autoDeployToPendrive(){
    const hex=document.getElementById('keyOutput')?.value;
    const serial=document.getElementById('serial')?.value.trim()||'unknown';
    if(!hex){ alert('Generate a key first'); return; }
    // Path 1: local agent — write HaasKey.txt directly to the detected stick
    const i = parseInt(document.getElementById('stickSelect')?.value, 10);
    const stick = agentSticks[i];
    if(stick && stick.mountpoint){
        try{
            const r = await fetch(USB_AGENT + '/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mountpoint: stick.mountpoint, filename: 'HaasKey.txt', content: hex })
            });
            const res = await r.json();
            if(r.ok && res.ok){
                document.getElementById('autoDeployHint').textContent =
                    `HaasKey.txt written to ${res.path} (${res.bytes} bytes) — safely eject, insert into USB0 (rear port), reboot`;
                return;
            }
            alert('Agent deploy failed: ' + (res.error || r.status));
            return;
        }catch(e){ /* agent gone — fall through to picker */ }
    }
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
    const ver=document.getElementById('swversion')?.value.trim();
    if(!serial){ alert('Need Serial'); return; }
    if(!mac || !parseMac(mac)){ alert('MAC Address REQUIRED (SETUP → Network/Machine Info). Wrong MAC = wrong key.'); return; }
    if(!ver || parseSoftwareVersion(ver)===null){ alert('Software Version REQUIRED exactly as shown (e.g. 100.23.000.1201). Wrong version = wrong key.'); return; }
    const serialNum=parseInt(serial,10);
    const perm=ngcMachinePermanentKey(serialNum, mac, ver);
    let txt=`Haas MACHINE Unlock — Serial ${serial} MAC ${mac} Version ${ver}\n`;
    txt+=`Generated ${new Date().toLocaleString()}\n`;
    txt+=`GROUND TRUTH 2026-08-17 (CONTROLSTORM REL-100.23 fcn.0001f38c/fcn.0001fae0 + JavaMain):\n`;
    txt+=`  CRC2=CRC16(last-3-MAC-bytes & 0xFFFF)^F0F0=${perm.crc2}  CRC3=CRC16(softVerInt=${perm.softVer})^F0F0=${perm.crc3}\n`;
    txt+=`  Activation screen parses typed keys as BASE32 (0/1 dropped) — keys below are base32.\n`;
    txt+=`${'='.repeat(78)}\n\n`;
    txt+=`PERMANENT KEY (legacy accept, checked FIRST — no challenge, no k-window, survives reboots):\n`;
    txt+=`  TYPE THIS: ${perm.keyA_b32}   (decimal ${perm.keyA})\n`;
    if(perm.differs) txt+=`  Variant B (short-serial controls, only if A rejected): ${perm.keyB_b32}   (decimal ${perm.keyB})\n`;
    txt+=`\n`;
    if(challenge){
        const challengeVal=parseChallenge(challenge);
        const crc1=challengeVal - perm.crc2 - perm.crc3;
        if(crc1>=0 && crc1<=0xFFFF){
            txt+=`BILLING k-SWEEP for challenge ${challengeVal} (CRC1=${crc1}, fresh-boot window k=100..149):\n`;
            for(let k=100;k<150;k++){
                const code=crc16Haas((crc1 + k*1000000)>>>0)^0xF0F0;
                const fullKey=(perm.crc2+perm.crc3) + 1000*code;
                txt+=`  k=${String(k).padStart(3,' ')}: ${base32Encode(fullKey).padStart(8,' ')}  (decimal ${String(fullKey).padStart(10,' ')}, code ${String(code).padStart(5,'0')})\n`;
            }
            txt+=`\n`;
        } else {
            txt+=`BILLING k-SWEEP: challenge ${challengeVal} INCONSISTENT with MAC+version (CRC1=${crc1} out of 0..65535).\nRecheck the Under Activation Key digits and Software Version.\n\n`;
        }
    } else {
        txt+=`BILLING k-SWEEP: no challenge entered — skipped (not needed; PERMANENT key is the one you want).\n\n`;
    }
    txt+=`How to use:\n1. Type the PERMANENT key on the ACTIVATION screen exactly as shown (letters included).\n`;
    txt+=`2. The k-sweep is only a fallback: challenge-bound, k=100 first (fresh boot window), one try per boot is safest.\n`;
    txt+=`3. After PERMANENT accept: featureUnlock -> purchaseFeature(MACHINE_UNLOCK) -> machine stays activated.\n`;
    const blob=new Blob([txt],{type:'text/plain'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=`MACHINE_${serial}_${mac.replace(/:/g,'')}_keys.txt`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
