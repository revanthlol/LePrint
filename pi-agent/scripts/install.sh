#!/bin/bash
# LePrint Pi Agent - Install/Update Orchestrator
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="${SCRIPT_DIR}/lib"

# Source all lib modules (order matters: common first, piagent before services)
source "${LIB_DIR}/common.sh"
source "${LIB_DIR}/node.sh"
source "${LIB_DIR}/cups.sh"
source "${LIB_DIR}/libreoffice.sh"
source "${LIB_DIR}/imagetools.sh"
source "${LIB_DIR}/piagent.sh"
source "${LIB_DIR}/services.sh"

main() {
    print_header
    check_root
    check_sudo
    detect_os
    show_system_info
    confirm_install
    cleanup_legacy_services
    update_system
    install_nodejs
    install_cups
    install_libreoffice
    install_image_tools
    setup_pi_agent
    create_systemd_service
    create_qr_service
    show_completion
}

trap 'echo -e "\n${RED}Error: Installation failed!${NC}\n"; exit 1' ERR

main "$@"
