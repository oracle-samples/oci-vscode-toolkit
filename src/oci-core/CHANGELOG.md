# Change Log

All notable changes to the "oci-core" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.0]

- Initial release

## 1.0.1 - 2023-06-22

### Changed

- Changed display name and description of the plugin.

### Fixed

- Enable view title menus only when tree view is loaded.

## 1.0.2 - 2023-07-06

### Added

- Added cannonical names for newly supported OCI regions.

- Display error notification dialogue when user doesn't have enough permissions while loading the OCI Core extension plugin.

### Removed

- Async constructor library.

### Fixed

- Switch profile action in the tree view for switching between multiple OCI profiles.

- Translations for strings for OCI Core extension plugin.

- Change region action within the plugin to display current user selected region.

## 1.0.3 - 2023-08-23

### Added
- Included essential policy requirements in the ReadMe file.

- Appended policy link for accessing error message in cases with insufficient plugin access permissions.

### Removed
- Simplified core plugin by removing explicit TypeScript SDK dependency.

- Refined activation events by excluding the use of *.

### Fixed
- Incorporated updated modal dialogue for simplified OCI-CLI installation process.

- Enhanced ReadMe to ensure proper rendering of images.

- Implemented auto expansion up to the profile node level.