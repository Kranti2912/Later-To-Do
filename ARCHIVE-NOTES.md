# Archived source provenance

- Version: 1.0.8
- Original installer: Later-Setup-1.0.8.exe
- Original installer SHA-256: 579C76EAB4FC6E04A556F13C77D4F2D172723F9CB9CA29AFA571A54327E536A4
- Embedded resources/app.asar SHA-256: 5B2AF0D4146DA53ADC04FA97012B5972DA44456CED3E3478071DAF2FBF28094C
- The files under src/ are extracted from that installer's embedded app archive. The embedded manifest reported version 1.0.8.
- Root build metadata, dependency lock, installer settings, and release automation use the shared v1.0.14 project build configuration, with the package version set to 1.0.8. A rebuilt installer may therefore differ from the original installer binary.
- The original installer binary is not stored in Git. The tagged release workflow builds a fresh installer from this source.
- No per-user tasks, cache, or other local app data were copied.
