
# Terraform bridge for Terraforge

This package is used to build Terraform bridge packages that can be used with @terraforge/core.

It works in 3 steps:

1. It provides a build script that generates the typescript typings for your Terraform bridge package.

2. It provides a proxy api that can we used to interact with Terraform resources.

3. It will install the Terraform provider that you specify in your bridge package.

### Terraform Plugin installation location

The default installation location is `~/.terraforge/plugins`.

## Usage Guide

### Step 1. Create a package.json
Create a package.json for the bridge package you want to create.
In the `package.json` file, you will need to specify the provider details that your package is for.
Example: 
```json
{
	"name": "@terraforge/aws",
	"version": "1.0.0",
	"provider": { // These are the terraform provider details that your package is for.
		"org": "hashicorp",
		"type": "aws",
		"version": "1.0.0"
	},
	"type": "module",
	"files": [
		"dist"
	],
	"module": "./dist/index.js",
	"types": "./dist/index.d.ts",
	"exports": {
		".": {
			"import": "./dist/index.js",
			"types": "./dist/index.d.ts"
		}
	},
	"scripts": {
		"build": "bun ../terraform/cli/build-package",
		"prepublishOnly": "bun run build"
	},
	"peerDependencies": {
		"@terraforge/terraform": "workspace:*",
		"@terraforge/core": "workspace:*"
	}
}
```

### Step 2. Publish your package
You can now publish your package to npm or any other package registry.
The prepublish script will build the package files inside the `dist` directory before publishing.

### Step 3. There is no step 3
Sit back and relax, your package is now published and ready to be used.
