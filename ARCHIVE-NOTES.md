# Archived source provenance

- Version: 1.0.6
- Original installer: Later-Setup-1.0.6.exe
- Original installer SHA-256: 528D208AFA3DCE7E47F906A28C0DD92FEF5389A2A556910B19D6191780DEF2C0
- Embedded resources/app.asar SHA-256: 2BB7A2BA288ECE08710A082462B4ED4D0C7B425F860C6C6436EAB706DBBBEA35
- The files under src/ are extracted from that installer's embedded app archive. The embedded manifest reported version 1.0.6.
- Root build metadata, dependency lock, installer settings, and release automation use the shared v1.0.14 project build configuration, with the package version set to 1.0.6. A rebuilt installer may therefore differ from the original installer binary.
- The original installer binary is not stored in Git. The tagged release workflow builds a fresh installer from this source.
- No per-user tasks, cache, or other local app data were copied.
