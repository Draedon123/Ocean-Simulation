function callCompute(
  bindGroup: GPUBindGroup,
  pipeline: GPUComputePipeline,
  workgroupSize: [number, number, number],
  device: GPUDevice
): void {
  const commandEncoder = device.createCommandEncoder();
  const computePass = commandEncoder.beginComputePass();

  computePass.setBindGroup(0, bindGroup);
  computePass.setPipeline(pipeline);
  computePass.dispatchWorkgroups(...workgroupSize);
  computePass.end();

  device.queue.submit([commandEncoder.finish()]);
}

export { callCompute };
