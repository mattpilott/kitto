/**
 * @module to_base64
 * @group Vanilla
 * @version 1.0.0
 * @remarks Converts a file to base64
 *
 * @param file - The file to convert to base64
 * @returns The base64 string
 */

export function to_base64(file: Blob): Promise<FileReader['result']> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()

		reader.readAsDataURL(file)
		reader.onload = () => resolve(reader.result)
		reader.onerror = error => reject(error)
	})
}
