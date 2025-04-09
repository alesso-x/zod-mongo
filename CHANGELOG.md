# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note:** Until version 1.0.0, this project follows semantic versioning loosely, focusing on feature completeness and stability rather than strict adherence to breaking changes in minor versions.

## [0.1.3] - 2025-04-08

### Changed

- Add peer dependencies section to README, specifying required packages 'zod' and 'mongodb' for installation.
- Refactor timestamp assignment in ZodMongoRepository to use variables for createdAt and updatedAt, improving code readability.

## [0.1.2] - 2025-04-08

### Added

- Add 'distinct' method to ZodMongoRepository for retrieving unique field values and update README to document this new functionality.
- Add 'countDocuments' method to count matching documents and updated 'exists' method to utilize it.
- Publish scripts for major, minor, and patch versioning

## [0.1.1] - 2025-04-08

### Changed

- Add detailed documentation for error classes, database connection, and repository methods in zod-mongo library. Enhance error handling and provide clear descriptions for each method's parameters and return types.
- Refactor zod-mongo library to improve database connection handling and schema definitions. Update README with new ObjectId schema and connection setup. Rename ZodMongoDatabaseConnection class for clarity and ensure consistent usage across files.
- Replaced `prepublishOnly` script with `prepare` script
- Streamlined build process

## [0.1.0] - 2025-04-08

### Added

- Initial release of zod-mongo, a TypeScript library for MongoDB with Zod validation
- Core repository class with CRUD operations
- Support for document validation using Zod schemas
- Automatic timestamp management (createdAt, updatedAt)
- Type-safe MongoDB operations with strict typing
- Comprehensive error handling with custom error types
- Support for common MongoDB operations:
  - insertOne/insertMany
  - findOne/findMany
  - updateOne/updateMany
  - deleteOne/deleteMany
  - findOneAndUpdate
  - exists
- Basic package configuration
- TypeScript and Jest setup
- MongoDB and Zod peer dependencies
- Build and test scripts
