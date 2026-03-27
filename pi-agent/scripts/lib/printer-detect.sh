#!/bin/bash
# LePrint Pi Agent - Printer Detection & Capability Profile
# Sourced by scripts/install.sh — do not run directly
# common.sh and cups.sh are already sourced before this file

# Capability vars carried between detect_and_configure_printer() and write_printer_capabilities()
_CAP_BRAND=""
_CAP_CONNECTION=""
_CAP_DRIVER=""
_CAP_DRIVERLESS=""
_CAP_ADV_STATUS=""
_CAP_SCANNER=""

# ─── Internal: multi-signal Epson detection ───────────────────────────────────

_detect_epson_signals() {
    EPSON_DETECTED=false
    CONNECTION_TYPE="unknown"

    # Signal 1 — USB vendor ID (Epson = 04b8)
    if command -v lsusb &> /dev/null; then
        print_info "Checking USB devices..."
        if lsusb 2>/dev/null | grep -qi "04b8"; then
            print_success "Epson device found via USB vendor ID (04b8)"
            EPSON_DETECTED=true
            CONNECTION_TYPE="usb"
        else
            print_info "No Epson USB device found via lsusb"
        fi
    else
        print_info "lsusb not available — skipping USB vendor check"
    fi

    # Signal 2 — CUPS device discovery
    if command -v lpinfo &> /dev/null; then
        print_info "Checking CUPS device list..."
        local lpinfo_out
        lpinfo_out="$(lpinfo -v 2>/dev/null || true)"
        if echo "$lpinfo_out" | grep -qi "epson"; then
            print_success "Epson device found via CUPS lpinfo"
            EPSON_DETECTED=true
            # Determine connection type from URI if not already set to usb
            if [ "$CONNECTION_TYPE" != "usb" ]; then
                if echo "$lpinfo_out" | grep -qi "usb://"; then
                    CONNECTION_TYPE="usb"
                elif echo "$lpinfo_out" | grep -qiE "ipp://|ipps://|socket://|dnssd://"; then
                    CONNECTION_TYPE="network"
                fi
            fi
        else
            print_info "No Epson device found via CUPS lpinfo"
        fi
    else
        print_info "lpinfo not available — skipping CUPS device check"
    fi

    # Signal 3 — Existing CUPS queue
    if command -v lpstat &> /dev/null; then
        print_info "Checking existing CUPS print queues..."
        if lpstat -p -l 2>/dev/null | grep -qi "epson"; then
            print_success "Epson printer found in existing CUPS queue"
            EPSON_DETECTED=true
        else
            print_info "No Epson queue found in CUPS"
        fi
    else
        print_info "lpstat not available — skipping queue check"
    fi
}

# ─── Internal: driver selection ───────────────────────────────────────────────

_select_epson_driver() {
    SELECTED_DRIVER="generic"

    _pkg_available() {
        local pkg="$1"
        case "$PKG_MANAGER" in
            apt)    apt-cache show "$pkg" 2>/dev/null | grep -q "^Package:" ;;
            pacman) pacman -Si "$pkg" 2>/dev/null | grep -q "^Name" ;;
            dnf)    dnf info "$pkg" 2>/dev/null | grep -q "^Name" ;;
            yum)    yum info "$pkg" 2>/dev/null | grep -q "^Name" ;;
            *)      return 1 ;;
        esac
    }

    print_info "Checking available Epson driver packages..."

    if _pkg_available "epson-inkjet-printer-escpr2"; then
        SELECTED_DRIVER="escpr2"
        print_info "Best available driver: escpr2"
        return
    fi

    if _pkg_available "epson-inkjet-printer-escpr"; then
        SELECTED_DRIVER="escpr"
        print_info "Best available driver: escpr"
        return
    fi

    # Check driverless/IPP Everywhere support
    if command -v lpinfo &> /dev/null; then
        if lpinfo -v 2>/dev/null | grep -qi "driverless\|ipp"; then
            SELECTED_DRIVER="everywhere"
            print_info "Best available driver: IPP Everywhere (driverless)"
            return
        fi
    fi

    print_info "No Epson-specific driver found — using generic"
}

# ─── Public: run detection, prompt, driver install ────────────────────────────

detect_and_configure_printer() {
    print_section "Printer Detection"

    _detect_epson_signals

    echo ""

    # ── User confirmation ──
    local user_confirmed_epson=false

    if [ "$EPSON_DETECTED" = "true" ]; then
        print_success "Epson printer detected automatically"
        echo ""
        read -p "Confirm this is an Epson printer? (Y/n): " -r epson_reply
        epson_reply="${epson_reply:-Y}"
        if [[ "$epson_reply" =~ ^[Yy]$ ]]; then
            user_confirmed_epson=true
        fi
    else
        print_info "No Epson printer detected automatically"
        echo ""
        read -p "Is this an Epson printer? (y/N): " -r epson_reply
        epson_reply="${epson_reply:-N}"
        if [[ "$epson_reply" =~ ^[Yy]$ ]]; then
            user_confirmed_epson=true
        fi
    fi

    # ── Cross-check logic ──
    USE_EPSON_PATH=false
    if [ "$user_confirmed_epson" = "true" ] && [ "$EPSON_DETECTED" = "true" ]; then
        USE_EPSON_PATH=true
    elif [ "$user_confirmed_epson" = "true" ] && [ "$EPSON_DETECTED" = "false" ]; then
        print_warning "Auto-detection did not find an Epson device. Proceeding with Epson setup as requested."
        USE_EPSON_PATH=true
    elif [ "$user_confirmed_epson" = "false" ] && [ "$EPSON_DETECTED" = "true" ]; then
        print_info "Using generic setup as requested."
    fi
    # user_confirmed_epson=false + EPSON_DETECTED=false: generic path (no message needed)

    # ── Driver selection & install ──
    DRIVER_INSTALLED=false

    if [ "$USE_EPSON_PATH" = "true" ]; then
        _select_epson_driver

        if [ "$SELECTED_DRIVER" = "escpr2" ] || [ "$SELECTED_DRIVER" = "escpr" ]; then
            print_step "Installing Epson driver package: epson-inkjet-printer-${SELECTED_DRIVER}..."
            if $INSTALL_CMD "epson-inkjet-printer-${SELECTED_DRIVER}"; then
                print_success "Epson driver installed"
                DRIVER_INSTALLED=true
            else
                print_warning "Epson driver installation failed — falling back to generic"
                SELECTED_DRIVER="generic"
                DRIVER_INSTALLED=false
            fi
        fi
    else
        SELECTED_DRIVER="generic"
    fi

    # ── Capability flags ──
    ADVANCED_STATUS=false
    if [ "$DRIVER_INSTALLED" = "true" ]; then
        ADVANCED_STATUS=true
    fi

    DRIVERLESS=false
    if command -v lpinfo &> /dev/null; then
        if lpinfo -v 2>/dev/null | grep -qi "driverless\|ipp"; then
            DRIVERLESS=true
        fi
    fi

    SCANNER=false
    if command -v ippfind &> /dev/null; then
        if ippfind _uscan._tcp 2>/dev/null | grep -q .; then
            SCANNER=true
        fi
    elif command -v avahi-browse &> /dev/null; then
        if avahi-browse -t -r _uscan._tcp 2>/dev/null | grep -q .; then
            SCANNER=true
        fi
    fi

    # ── Stash into carry-over variables ──
    if [ "$USE_EPSON_PATH" = "true" ]; then
        _CAP_BRAND="epson"
    else
        _CAP_BRAND="generic"
    fi
    _CAP_CONNECTION="$CONNECTION_TYPE"
    _CAP_DRIVER="$SELECTED_DRIVER"
    _CAP_DRIVERLESS="$DRIVERLESS"
    _CAP_ADV_STATUS="$ADVANCED_STATUS"
    _CAP_SCANNER="$SCANNER"

    print_success "Printer detection complete (brand: ${_CAP_BRAND}, driver: ${_CAP_DRIVER})"
}

# ─── Public: write JSON (called AFTER setup_pi_agent when PI_AGENT_DIR is set) ─

write_printer_capabilities() {
    if [ -z "$PI_AGENT_DIR" ]; then
        print_warning "PI_AGENT_DIR not set — skipping capability file write"
        return 0
    fi

    local cap_file="${PI_AGENT_DIR}/printer-capabilities.json"
    local timestamp
    timestamp="$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"

    cat > "$cap_file" << EOF
{
  "brand": "${_CAP_BRAND:-generic}",
  "connectionType": "${_CAP_CONNECTION:-unknown}",
  "driver": "${_CAP_DRIVER:-generic}",
  "driverlessAvailable": ${_CAP_DRIVERLESS:-false},
  "advancedStatusAvailable": ${_CAP_ADV_STATUS:-false},
  "scannerAvailable": ${_CAP_SCANNER:-false},
  "inkMonitoring": false,
  "detectedAt": "${timestamp}"
}
EOF

    print_success "Printer capabilities saved to ${cap_file}"
}
