!macro customInit
  nsExec::ExecToLog 'taskkill /F /IM Later.exe'
  Pop $0
!macroend
