# Change Log

All notable changes to the "oci-vscode-toolkit" extension pack will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.0]

- Initial release

## 1.0.1 - 2023-06-22

### Added

- Added new notification banner when Resource Manager plugin is loaded.

### Changed

- Changed display name and descriptions for OCI Core extension, Data Science, Functions and Resource Manager plugins.

- Changed progress notification message when uploading stack changes to the RMS service in Resource Manager plugin.

- Improved tooltip on stack selection in tree view in Resource Manager plugin.

### Fixed
- Enable view title menus in plugins only when tree view is loaded.

## 1.0.2 - 2023-07-06

### Added

- Added cannonical names for newly supported OCI regions.

- Display error notification dialogue when user doesn't have enough permissions while loading the OCI Core extension, Data Science, Functions and Resource Manager plugins.

### Removed

- Async constructor library.

### Fixed

- Switch profile action in the tree view for switching between multiple OCI profiles.

- Translations for strings for OCI Core extension, Data Science, Functions and Resource Manager plugins.

- Change region action within the plugin to display current user selected region.