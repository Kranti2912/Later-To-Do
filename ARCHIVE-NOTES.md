# Archived source provenance

- Version: 1.0.10
- Original installer: Later-Setup-1.0.10.exe
- Original installer SHA-256: E3747C713153FB16F6B98DD3757F6C61DB1C973A353526BE84F66A9995D05AE3
- Embedded resources/app.asar SHA-256: C75FAB601E06CBD0621AB8BBCCFFAD23F3CCDE52ED3A07C39D35C517BEEE9720
- The files under src/ are extracted from that installer's embedded app archive. The embedded manifest reported version 1.0.10.
- Root build metadata, dependency lock, installer settings, and release automation use the shared v1.0.14 project build configuration, with the package version set to 1.0.10. A rebuilt installer may therefore differ from the original installer binary.
- The original installer binary is not stored in Git. The tagged release workflow builds a fresh installer from this source.
- No per-user tasks, cache, or other local app data were copied.
