import {
  PLANET_FRAGMENT_SHADER,
  PLANET_VERTEX_SHADER,
  clampHorizon,
  samplePlanetUv,
} from './planet-math'

/**
 * A tiny WebGL1 renderer for one pocket world.
 *
 * WebGL1 on purpose: it is everywhere, the shader needs nothing newer, and
 * the texture is redrawn to power-of-two dimensions so mipmaps (and therefore
 * a clean, alias-free planet) work on every device.
 */

export interface PlanetFrame {
  /** 0 = the flat photograph, 1 = the closed planet. */
  t: number
  /** Planet centre in CSS px, origin top-left of the canvas. */
  centerX: number
  centerY: number
  /** Planet radius in CSS px. */
  radius: number
  horizon: number
  spin: number
  /** Cover-crop focal point for the flat photo, 0..1 from top-left. */
  focusX?: number
  focusY?: number
  glow?: string
  glowStrength?: number
}

const MAX_TEXTURE_EDGE = 2048

function nextPowerOfTwo(value: number) {
  return 2 ** Math.ceil(Math.log2(Math.max(1, value)))
}

function parseHex(hex: string | undefined): [number, number, number] {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex ?? '')
  if (!match) {
    return [0.94, 0.92, 0.87]
  }
  const value = Number.parseInt(match[1], 16)
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) {
    throw new Error('Could not create shader')
  }
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Planet shader failed to compile: ${log ?? 'unknown error'}`)
  }
  return shader
}

/** Redraws an image onto a power-of-two canvas, capped at 2048px a side. */
function toPowerOfTwo(image: HTMLImageElement | ImageBitmap) {
  const width = Math.min(MAX_TEXTURE_EDGE, nextPowerOfTwo(image.width))
  const height = Math.min(MAX_TEXTURE_EDGE, nextPowerOfTwo(image.height))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('2D canvas unavailable')
  }
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)
  return canvas
}

type UniformName =
  | 'uImage'
  | 'uResolution'
  | 'uAspect'
  | 'uFocus'
  | 'uT'
  | 'uCenter'
  | 'uRadius'
  | 'uHorizon'
  | 'uSpin'
  | 'uGlow'
  | 'uGlowStrength'

export class PlanetRenderer {
  readonly canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private program: WebGLProgram
  private texture: WebGLTexture | null = null
  private aspect = 1
  private uniforms: Record<UniformName, WebGLUniformLocation | null>
  private lost = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: 'low-power',
    })

    if (!gl) {
      throw new Error('WebGL unavailable')
    }

    this.gl = gl
    const program = gl.createProgram()
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, PLANET_VERTEX_SHADER))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, PLANET_FRAGMENT_SHADER))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Planet program failed to link: ${gl.getProgramInfoLog(program) ?? ''}`)
    }
    this.program = program
    gl.useProgram(program)

    /* one triangle that covers the viewport */
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'aPosition')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const names: UniformName[] = [
      'uImage',
      'uResolution',
      'uAspect',
      'uFocus',
      'uT',
      'uCenter',
      'uRadius',
      'uHorizon',
      'uSpin',
      'uGlow',
      'uGlowStrength',
    ]
    this.uniforms = Object.fromEntries(
      names.map((name) => [name, gl.getUniformLocation(program, name)])
    ) as Record<UniformName, WebGLUniformLocation | null>

    gl.clearColor(0, 0, 0, 0)

    canvas.addEventListener('webglcontextlost', this.handleLost)
  }

  private handleLost = (event: Event) => {
    event.preventDefault()
    this.lost = true
  }

  get isLost() {
    return this.lost || this.gl.isContextLost()
  }

  setImage(image: HTMLImageElement | ImageBitmap) {
    const gl = this.gl
    this.aspect = image.width / image.height
    const source = toPowerOfTwo(image)

    if (this.texture) {
      gl.deleteTexture(this.texture)
    }
    this.texture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    /* u is mirror-folded in the shader; clamping avoids bleeding at the fold */
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }

  get hasImage() {
    return this.texture !== null
  }

  /** Matches the drawing buffer to the canvas's CSS size × DPR. Returns the scale. */
  resize(cssWidth: number, cssHeight: number, maxDpr = 2) {
    const dpr = Math.min(maxDpr, window.devicePixelRatio || 1)
    const width = Math.max(1, Math.round(cssWidth * dpr))
    const height = Math.max(1, Math.round(cssHeight * dpr))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }
    return dpr
  }

  render(frame: PlanetFrame) {
    if (!this.texture || this.isLost) {
      return
    }
    const gl = this.gl
    const { width, height } = this.canvas
    const cssWidth = this.canvas.clientWidth || width
    const scale = width / cssWidth
    const u = this.uniforms

    gl.viewport(0, 0, width, height)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(this.program)
    gl.uniform1i(u.uImage, 0)
    gl.uniform2f(u.uResolution, width, height)
    gl.uniform1f(u.uAspect, this.aspect)
    gl.uniform2f(u.uFocus, frame.focusX ?? 0.5, 1 - (frame.focusY ?? 0.5))
    gl.uniform1f(u.uT, frame.t)
    gl.uniform2f(u.uCenter, frame.centerX * scale, height - frame.centerY * scale)
    gl.uniform1f(u.uRadius, frame.radius * scale)
    gl.uniform1f(u.uHorizon, clampHorizon(frame.horizon))
    gl.uniform1f(u.uSpin, frame.spin)
    const [r, g, b] = parseHex(frame.glow)
    gl.uniform3f(u.uGlow, r, g, b)
    gl.uniform1f(u.uGlowStrength, frame.glowStrength ?? 0.8)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  dispose() {
    this.canvas.removeEventListener('webglcontextlost', this.handleLost)
    const gl = this.gl
    if (this.texture) {
      gl.deleteTexture(this.texture)
      this.texture = null
    }
    gl.deleteProgram(this.program)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

export function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------------ */
/* Still planets (the orrery, the chapter rail): rendered once, then reused.  */
/* ------------------------------------------------------------------------ */

let sharedRenderer: PlanetRenderer | null | undefined

function getSharedRenderer() {
  if (sharedRenderer === undefined) {
    try {
      sharedRenderer = new PlanetRenderer(document.createElement('canvas'))
    } catch {
      sharedRenderer = null
    }
  }
  if (sharedRenderer?.isLost) {
    sharedRenderer = null
  }
  return sharedRenderer
}

/** CPU twin of the shader's closed state, for browsers without WebGL. */
function drawPlanetOnCpu(
  target: HTMLCanvasElement,
  image: HTMLImageElement,
  horizon: number,
  radiusRatio: number
) {
  const size = target.width
  const sourceCanvas = document.createElement('canvas')
  const sw = Math.min(image.width, 720)
  const sh = Math.round((sw / image.width) * image.height)
  sourceCanvas.width = sw
  sourceCanvas.height = sh
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })
  const targetContext = target.getContext('2d')
  if (!sourceContext || !targetContext) {
    return false
  }
  sourceContext.drawImage(image, 0, 0, sw, sh)
  const source = sourceContext.getImageData(0, 0, sw, sh).data
  const output = targetContext.createImageData(size, size)
  const radius = (size / 2) * radiusRatio
  const centre = size / 2

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const uv = samplePlanetUv((x + 0.5 - centre) / radius, (centre - y - 0.5) / radius, {
        horizon,
      })
      if (!uv) {
        continue
      }
      const sx = Math.min(sw - 1, Math.max(0, Math.round(uv.u * (sw - 1))))
      const sy = Math.min(sh - 1, Math.max(0, Math.round((1 - uv.v) * (sh - 1))))
      const from = (sy * sw + sx) * 4
      const to = (y * size + x) * 4
      output.data[to] = source[from]
      output.data[to + 1] = source[from + 1]
      output.data[to + 2] = source[from + 2]
      output.data[to + 3] = 255
    }
  }
  targetContext.putImageData(output, 0, 0)
  return true
}

/**
 * Paints the closed planet for `image` into a 2D `target` canvas sized
 * `cssSize` square. The planet fills `radiusRatio` of the half-width, leaving
 * the rest for its atmosphere.
 */
export function paintStillPlanet(
  target: HTMLCanvasElement,
  image: HTMLImageElement,
  options: { cssSize: number; horizon: number; glow?: string; radiusRatio?: number }
) {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const size = Math.max(1, Math.round(options.cssSize * dpr))
  const radiusRatio = options.radiusRatio ?? 0.8
  target.width = size
  target.height = size

  const renderer = getSharedRenderer()
  const context = target.getContext('2d')

  if (renderer && context) {
    renderer.canvas.width = size
    renderer.canvas.height = size
    /* clientWidth is 0 for a detached canvas, so render() treats sizes as device px */
    renderer.setImage(image)
    renderer.render({
      t: 1,
      centerX: size / 2,
      centerY: size / 2,
      radius: (size / 2) * radiusRatio,
      horizon: options.horizon,
      spin: 0,
      glow: options.glow,
      glowStrength: 0.9,
    })
    context.clearRect(0, 0, size, size)
    context.drawImage(renderer.canvas, 0, 0)
    return true
  }

  return drawPlanetOnCpu(target, image, options.horizon, radiusRatio)
}

const imageCache = new Map<string, Promise<HTMLImageElement>>()

/** Loads (once) a CORS-clean image suitable for texture upload. */
export function loadPlanetImage(src: string) {
  let pending = imageCache.get(src)
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.decoding = 'async'
      image.onload = () => {
        image
          .decode()
          .catch(() => undefined)
          .then(() => resolve(image))
      }
      image.onerror = () => {
        imageCache.delete(src)
        reject(new Error(`Could not load ${src}`))
      }
      image.src = src
    })
    imageCache.set(src, pending)
  }
  return pending
}
