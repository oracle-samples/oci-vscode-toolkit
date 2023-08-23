# Oracle Cloud Infrastructure (OCI) Core Extension

OCI Core extension is the backbone of the OCI Toolkit extension pack. It provides common functionality shared among the OCI service extensions, including Functions, Resource Manager, and Data Science such as integrated Sign-in, Profile Management, Region selection, Logging, Error notifications, and more.

## Key Features
- **Sign-in**: Seamlessly connect to OCI by signing into an existing OCI account or creating a new account.
- **Profile Wizard**: Profile Wizard where user can select any profile from the configuration file. It will reset client connections as per the new profile.
- **Region selection Wizard**: The user can switch to different subscribed OCI regions from this wizard.

  ![](./media/images/readme/switch-region.gif) 

- **Logging & Metrics**: Shows info & error logs about the actions performed by users via service plugins.

## Note
 This extension needs to be installed for any other service extension to work. It can be downloaded from VS Code marketplace.

## Contributing

This project welcomes contributions from the community. Before submitting a pull request, please [review our contribution guide](../../CONTRIBUTING.md)

## Security

Please consult the [security guide](../../SECURITY.md) for our responsible security vulnerability disclosure process

## License

Copyright © 2022, 2023, Oracle and/or its affiliates.This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.

See LICENSE for more details.