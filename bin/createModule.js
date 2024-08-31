#! /usr/bin/env bun

import fs from 'fs'
import path from 'path'
import { replaceInFileSync } from 'replace-in-file'

/**
 * Module Creation Script
 *
 * This script creates a new module in the specified folder (or 'vanilla' by default).
 * It creates necessary files from templates and updates them with the new module name.
 * The script also adds an export for the new module in the folder's index.js file.
 *
 * Usage: bun run create-module <module-name> [folder] [-f]
 *
 * @example
 * bun run create-module myNewModule vanilla -f
 */
const vanillaPath = path.join(process.cwd(), 'lib', 'vanilla')
const validFolders = fs
	.readdirSync(vanillaPath)
	.filter(folder => fs.statSync(path.join(vanillaPath, folder)).isDirectory())
	.sort((a, b) => a.localeCompare(b))

const arg = process.argv[2]?.split('/') || []
const force = process.argv[3] === '-f'
const name = arg.pop()
const folder = arg.pop()

const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1)

const isValidFolder = folder => validFolders.includes(folder)

const printValidFolders = () => {
	console.log('Please use one of the following folders:')
	validFolders.forEach(folder => console.log(`- ${folder}`))
}

try {
	if (!name) {
		throw new Error('Please provide a module name.')
	}

	if (!folder || !isValidFolder(folder)) {
		console.error('\x1b[31m%s\x1b[0m', 'Invalid or no folder specified.')
		printValidFolders()
		process.exit(1)
	}

	const vanillaIndex = `lib/vanilla/index.js`
	const module = `lib/vanilla/${folder}/${name}`

	if (fs.existsSync(module) && !force) {
		throw new Error(`Module "${name}" already exists! Use -f to override, this will replace any custom code!`)
	}

	fs.existsSync(module) || fs.mkdirSync(module, { recursive: true })

	fs.copyFileSync('bin/template/bench.js', `${module}/bench.js`)
	fs.copyFileSync('bin/template/index.js', `${module}/index.js`)
	fs.copyFileSync('bin/template/test.js', `${module}/test.js`)

	replaceInFileSync({ files: `${module}/*.js`, from: /yourModuleName/g, to: name })
	replaceInFileSync({
		files: `${module}/index.js`,
		from: /@memberof (.*)/g,
		to: `@memberof Vanilla.${capitalize(folder)}`
	})

	let vanillaIndexContent = ''
	try {
		vanillaIndexContent = fs.readFileSync(vanillaIndex, 'utf8')
	} catch (err) {
		err
		console.warn(`Warning: Could not read ${vanillaIndex}. A new file will be created.`)
	}

	if (!vanillaIndexContent.includes(`${folder}/${name}`)) {
		const newExport = `\nexport { default as ${name} } from './${folder}/${name}/index.js'`
		fs.appendFileSync(vanillaIndex, newExport)
	}

	console.log('\x1b[1m%s\x1b[0m', `"${name}" module created in "${module}"!`)
	console.log('\x1b[1m%s\x1b[0m', `Export added to ${vanillaIndex}`)
} catch (err) {
	console.error('\x1b[31m%s\x1b[0m', err.message)
	process.exit(1)
}
