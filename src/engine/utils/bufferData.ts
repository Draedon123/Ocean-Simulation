function bufferData(
  device: GPUDevice,
  label: string,
  usage: GPUBufferUsageFlags,
  dataOrByteLength: BufferSource | SharedArrayBuffer | number
): GPUBuffer {
  const buffer = device.createBuffer({
    label,
    usage,
    size:
      typeof dataOrByteLength === "number"
        ? dataOrByteLength
        : dataOrByteLength.byteLength,
  });

  if (!(typeof dataOrByteLength === "number")) {
    device.queue.writeBuffer(buffer, 0, dataOrByteLength);
  }

  return buffer;
}

export { bufferData };
