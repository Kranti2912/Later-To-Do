# Archived source provenance

- Version: 1.0.9
- Original installer: Later-Setup-1.0.9.exe
- Original installer SHA-256: FB4D961AC0ACDDCC69AD5EE532361E08008CF51ACD6C1BE1F508489482CEB712
- Embedded resources/app.asar SHA-256: 1B6C6E66130B75EA78CAC506E901C02328952C86D1784EFB9E2A91EAAB46E0D0
- The files under src/ are extracted from that installer's embedded app archive. The embedded manifest reported version 1.0.9.
- Root build metadata, dependency lock, installer settings, and release automation use the shared v1.0.14 project build configuration, with the package version set to 1.0.9. A rebuilt installer may therefore differ from the original installer binary.
- The original installer binary is not stored in Git. The tagged release workflow builds a fresh installer from this source.
- No per-user tasks, cache, or other local app data were copied.
