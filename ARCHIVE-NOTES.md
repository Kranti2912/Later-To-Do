# Archived source provenance

- Version: 1.0.11
- Original installer: Later-Setup-1.0.11.exe
- Original installer SHA-256: 9C21B12CE577CCCD4F3D2E8A3E39E7D876E2E0FFE2DB58C1182B3FBC2D5A04E3
- Embedded resources/app.asar SHA-256: 5C4C0F2D149706245CA49CE532354A262D66A9C6824AA44AA0641C9A85CB35B2
- The files under src/ are extracted from that installer's embedded app archive. The embedded manifest reported version 1.0.11.
- Root build metadata, dependency lock, installer settings, and release automation use the shared v1.0.14 project build configuration, with the package version set to 1.0.11. A rebuilt installer may therefore differ from the original installer binary.
- The original installer binary is not stored in Git. The tagged release workflow builds a fresh installer from this source.
- No per-user tasks, cache, or other local app data were copied.
