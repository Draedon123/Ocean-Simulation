/// <reference types="vite/client" />

type Renderable = {
  render: (
    renderPass: GPURenderPassEncoder,
    camera: import("@rendering/Camera").Camera
  ) => void;
};

type WaveSpectrum = "phillips" | "JONSWAP";
