# WasmKit

WasmKit is a development environment to compile, deploy, test, run scrt contracts on different networks efficiently with an enhanced user friendly experience.

## Requirements

The minimum packages/requirements are as follows:
 
- Node `14+`
- Yarn `v1.22+` or NPM `v6.0+`

## Install wasmkit

### Installation from released version
To install wasmkit globally in your system you can use:
  - Using Yarn: `yarn global add @kubiklabs/wasmkit`
  - Using NPM: `npm install -g @kubiklabs/wasmkit`

## Usage

### Initialize a project

```bash
$ wasmkit init <project-name>
```

This will create a directory <project-name> inside current directory with boiler-plate code.

### Compile the project

Go to project directory:

```bash
$ cd <project-name>
```

Compile the project and generate `.wasm` files:

```bash
$ wasmkit compile
```

## Run tests

```bash
$ yarn run test
```

## Documentation

Check out detailed documentation [here](https://wasmkit.arufaresearch.com/).
