# Archived source provenance

- Version: 1.0.7
- Original installer: Later-Setup-1.0.7.exe
- Original installer SHA-256: 259B980D73A77D1758EFE68784B818C5EA144D6EB898B7AEA19E57BD532F2A66
- Embedded resources/app.asar SHA-256: 151CB7CA7C0654EDD7DDFA568FA15CC54C1489279B7D7EBE66F9172BB15D486E
- The files under src/ are extracted from that installer's embedded app archive. The embedded manifest reported version 1.0.7.
- Root build metadata, dependency lock, installer settings, and release automation use the shared v1.0.14 project build configuration, with the package version set to 1.0.7. A rebuilt installer may therefore differ from the original installer binary.
- The original installer binary is not stored in Git. The tagged release workflow builds a fresh installer from this source.
- No per-user tasks, cache, or other local app data were copied.
