# Archived source provenance

- Version: 1.0.12
- Original installer: Later-Setup-1.0.12.exe
- Original installer SHA-256: CFB1087C221412DEDD8D2F9A89CC7B5475D4153278C37A8B1050255F1167EF8C
- Embedded resources/app.asar SHA-256: FFF6B5D47D021F42033E9A38499F16DD8599393502A21636DA08F734E2E4C80A
- The files under src/ are extracted from that installer's embedded app archive. The embedded manifest reported version 1.0.12.
- Root build metadata, dependency lock, installer settings, and release automation use the shared v1.0.14 project build configuration, with the package version set to 1.0.12. A rebuilt installer may therefore differ from the original installer binary.
- The original installer binary is not stored in Git. The tagged release workflow builds a fresh installer from this source.
- No per-user tasks, cache, or other local app data were copied.
