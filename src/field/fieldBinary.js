const MAGIC = 'OCFLD001'
const HEADER_SIZE = 24
const EXPECTED_ENTRY_SIZE = 112

function readString(bytes, offset, length) {
  const view = bytes.subarray(offset, offset + length)
  const terminator = view.indexOf(0)
  return new TextDecoder().decode(terminator >= 0 ? view.subarray(0, terminator) : view)
}

function checkedNumber(value, label) {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`${label} exceeds safe integer range`)
  return Number(value)
}

export function decodeFieldFrame(arrayBuffer) {
  if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength < HEADER_SIZE) {
    throw new Error('Field frame is truncated')
  }
  const bytes = new Uint8Array(arrayBuffer)
  if (readString(bytes, 0, 8) !== MAGIC) throw new Error('Invalid field frame magic')
  const view = new DataView(arrayBuffer)
  const schema = view.getUint32(8, true)
  if (schema !== 1) throw new Error(`Unsupported field frame schema ${schema}`)
  const fieldCount = view.getUint32(12, true)
  const entrySize = view.getUint32(16, true)
  if (entrySize !== EXPECTED_ENTRY_SIZE) throw new Error(`Unsupported directory entry size ${entrySize}`)
  const directoryEnd = HEADER_SIZE + fieldCount * entrySize
  if (directoryEnd > arrayBuffer.byteLength) throw new Error('Field frame directory is truncated')

  const fields = []
  for (let index = 0; index < fieldCount; index += 1) {
    const entry = HEADER_SIZE + index * entrySize
    const group = readString(bytes, entry, 16)
    const name = readString(bytes, entry + 16, 32)
    const unit = readString(bytes, entry + 48, 16)
    const dtypeCode = view.getUint32(entry + 64, true)
    const shape = [
      view.getUint32(entry + 68, true),
      view.getUint32(entry + 72, true),
      view.getUint32(entry + 76, true),
    ]
    const byteOffset = checkedNumber(view.getBigUint64(entry + 80, true), 'field offset')
    const byteLength = checkedNumber(view.getBigUint64(entry + 88, true), 'field length')
    const maskIndex = view.getInt32(entry + 96, true)
    if (!group || !name || shape.some((size) => size === 0)) throw new Error('Invalid field directory entry')
    if (byteOffset < directoryEnd || byteOffset + byteLength > arrayBuffer.byteLength) {
      throw new Error(`Field ${group}:${name} data is truncated`)
    }
    const elementCount = shape[0] * shape[1] * shape[2]
    let values
    let dtype
    if (dtypeCode === 1) {
      if (byteOffset % 4 !== 0 || byteLength !== elementCount * 4) {
        throw new Error(`Field ${group}:${name} has invalid float32 storage`)
      }
      values = new Float32Array(arrayBuffer, byteOffset, elementCount)
      dtype = 'float32'
    } else if (dtypeCode === 2) {
      if (byteLength !== elementCount) throw new Error(`Field ${group}:${name} has invalid uint8 storage`)
      values = new Uint8Array(arrayBuffer, byteOffset, elementCount)
      dtype = 'uint8'
    } else {
      throw new Error(`Field ${group}:${name} has unsupported dtype ${dtypeCode}`)
    }
    fields.push({ id: `${group}:${name}`, group, name, unit, dtype, shape, values, maskIndex, mask: null })
  }

  for (const field of fields) {
    if (field.maskIndex < -1 || field.maskIndex >= fields.length) {
      throw new Error(`Field ${field.id} has an invalid mask index`)
    }
    if (field.maskIndex >= 0) field.mask = fields[field.maskIndex]
  }

  const groups = {}
  for (const field of fields) {
    groups[field.group] ??= {}
    if (groups[field.group][field.name]) throw new Error(`Duplicate field ${field.id}`)
    groups[field.group][field.name] = field
  }
  return { schema, fields, groups }
}

export function extractSlice(frame, fieldId, plane, sliceIndex) {
  const field = frame.fields.find((candidate) => candidate.id === fieldId)
  if (!field) throw new Error(`Unknown field ${fieldId}`)
  const [sizeX, sizeY, sizeZ] = field.shape
  let width
  let height
  let maximum
  if (plane === 'xy') [width, height, maximum] = [sizeX, sizeY, sizeZ]
  else if (plane === 'xz') [width, height, maximum] = [sizeX, sizeZ, sizeY]
  else if (plane === 'yz') [width, height, maximum] = [sizeY, sizeZ, sizeX]
  else throw new Error(`Unknown slice plane ${plane}`)
  if (!Number.isInteger(sliceIndex) || sliceIndex < 0 || sliceIndex >= maximum) {
    throw new Error(`Slice index ${sliceIndex} is outside ${plane}`)
  }
  const SliceArray = field.dtype === 'float32' ? Float32Array : Uint8Array
  const values = new SliceArray(width * height)
  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      let x
      let y
      let z
      if (plane === 'xy') [x, y, z] = [column, row, sliceIndex]
      else if (plane === 'xz') [x, y, z] = [column, sliceIndex, row]
      else [x, y, z] = [sliceIndex, column, row]
      values[column + width * row] = field.values[x + sizeX * (y + sizeY * z)]
    }
  }
  return { fieldId, plane, sliceIndex, width, height, values }
}
