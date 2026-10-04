# Archived source provenance

- Version: 1.0.5
- Original installer: Later-Setup-1.0.5.exe
- Original installer SHA-256: 1B33DAEFE82F059E85A1A5B577D6CD331D7BC2B72E3DBDE2B1D242CB6CDB016C
- Embedded resources/app.asar SHA-256: 789EFE5643CED0BDEE5E9F4CAE2E94072AC6BD92D4A32C29762D0A18E5FB82E5
- The files under src/ are extracted from that installer's embedded app archive. The embedded manifest reported version 1.0.5.
- Root build metadata, dependency lock, installer settings, and release automation use the shared v1.0.14 project build configuration, with the package version set to 1.0.5. A rebuilt installer may therefore differ from the original installer binary.
- The original installer binary is not stored in Git. The tagged release workflow builds a fresh installer from this source.
- No per-user tasks, cache, or other local app data were copied.
