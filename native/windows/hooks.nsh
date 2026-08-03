!macro KillFleetProcesses
  DetailPrint "Stopping streamfog MCP processes..."
  ExecWait 'taskkill /F /IM streamfog-mcp-backend.exe /T' $0
  ExecWait 'taskkill /F /IM streamfog-mcp-native.exe /T' $0
  !if "${INSTALLMODE}" == "currentUser"
    nsis_tauri_utils::KillProcessCurrentUser "streamfog-mcp-backend.exe"
    Pop $0
    nsis_tauri_utils::KillProcessCurrentUser "streamfog-mcp-native.exe"
    Pop $0
  !else
    nsis_tauri_utils::KillProcess "streamfog-mcp-backend.exe"
    Pop $0
    nsis_tauri_utils::KillProcess "streamfog-mcp-native.exe"
    Pop $0
  !endif
  Sleep 2000
!macroend

!macro NSIS_HOOK_PREINSTALL
  !insertmacro KillFleetProcesses
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  !insertmacro KillFleetProcesses
!macroend
