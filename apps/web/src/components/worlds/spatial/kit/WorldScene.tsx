import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
  SMAA,
  Vignette,
} from '@react-three/postprocessing'
import * as THREE from 'three'

import { Atmosphere } from './Atmosphere'
import { Base } from './Base'
import { arrivalAt, routeHeadAt, sampleCamera } from './camera'
import { WorldSceneContext } from './context'
import { quantise } from './contour'
import { Dressing } from './Dressing'
import { Land } from './Land'
import { DAY_LIGHT, DUSK_LIGHT, FLIGHT_SECONDS, SUN_DIRECTION } from './light'
import { LightRoute } from './LightRoute'
import { Sky } from './Sky'

import type { WorldPalette } from './palette'
import type { Quality, WorldForm, WorldProgress } from './types'

/**
 * The WebGL layer, shared by every world.
 *
 * Canvas, light, the rig that turns scroll into camera movement, and the
 * finishing pass. Everything a world contributes arrives as a `WorldForm` —
 * this file never knows which world it is drawing.
 */

function CameraRig({
  form,
  progress,
  quality,
  onEntered,
}: {
  form: WorldForm
  progress: WorldProgress
  quality: Quality
  onEntered: () => void
}) {
  const { camera, pointer } = useThree()
  const positionTarget = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])
  const currentLook = useRef(new THREE.Vector3(0, 2, 0))
  const enteredRef = useRef(false)
  const flyStartedAt = useRef<number | null>(null)

  const destination = useMemo(
    () =>
      new THREE.Vector3(
        form.destination.x,
        quantise(form.height(form.destination.x, form.destination.z), form.board.contourStep) + 1.6,
        form.destination.z
      ),
    [form]
  )

  useFrame((state, delta) => {
    /* Clamped so a long stall — a tab returning to the foreground, a slow
       first frame — damps smoothly instead of snapping. Kept generous enough
       that a device running at 10fps still tracks the scroll. */
    const step = Math.min(delta, 0.1)
    const keys = quality === 'full' ? form.camera.desktop : form.camera.mobile

    /* damp the scroll value itself, so a flicked wheel becomes a glide */
    progress.camT += (progress.scroll - progress.camT) * (1 - Math.exp(-step * 3.4))
    progress.arrival = arrivalAt(progress.camT)
    progress.routeHead = routeHeadAt(progress.camT)

    sampleCamera(keys, progress.camT, positionTarget, lookTarget)

    /* a very small pointer parallax on desktop — presence, not orbiting */
    if (quality === 'full') {
      positionTarget.x += pointer.x * 0.5
      positionTarget.y += pointer.y * 0.32
    }

    /* Entering the collection: the camera closes on the destination.
       Timed off the clock rather than accumulated frame deltas — those are
       clamped, so on a slow renderer the flight would stretch to many
       seconds and leave the visitor waiting on a click they already made. */
    if (progress.flying) {
      const now = state.clock.getElapsedTime()
      const startedAt = (flyStartedAt.current ??= now)
      progress.flyProgress = Math.min((now - startedAt) / FLIGHT_SECONDS, 1)
      const eased = 1 - Math.pow(1 - progress.flyProgress, 3)
      const approach = camera.position.clone().sub(destination).normalize().multiplyScalar(4.2)
      positionTarget.lerpVectors(positionTarget, destination.clone().add(approach), eased)
      lookTarget.lerpVectors(lookTarget, destination, eased)

      if (progress.flyProgress >= 1 && !enteredRef.current) {
        enteredRef.current = true
        onEntered()
      }
    }

    const damp = 1 - Math.exp(-step * (progress.flying ? 2.6 : 4.0))
    camera.position.lerp(positionTarget, damp)
    currentLook.current.lerp(lookTarget, damp)
    camera.lookAt(currentLook.current)

    /* what the lens is focused on: whatever the camera is aimed at */
    progress.focusDistance = camera.position.distanceTo(currentLook.current)
  })

  return null
}

function SceneLight({
  palette,
  quality,
  dusk,
}: {
  palette: WorldPalette
  quality: Quality
  dusk: number
}) {
  const keyRef = useRef<THREE.DirectionalLight>(null)
  const fillRef = useRef<THREE.HemisphereLight>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const sunPosition = useMemo(() => SUN_DIRECTION.clone().multiplyScalar(70), [])
  const moonlight = useMemo(() => new THREE.Color('#b9c9dd'), [])
  const daylight = useMemo(() => palette.sunLight.clone(), [palette])
  const level = useRef(0)

  /* The sky and the base read `dusk` in their own shaders; the model is lit
     by these, so it has to be dimmed here or the board stays in full sun
     under a dusk sky. */
  useFrame((_, delta) => {
    level.current += (dusk - level.current) * Math.min(delta * 2.5, 1)
    const t = level.current

    if (keyRef.current) {
      keyRef.current.intensity = THREE.MathUtils.lerp(DAY_LIGHT.key, DUSK_LIGHT.key, t)
      keyRef.current.color.copy(daylight).lerp(moonlight, t)
    }
    if (fillRef.current) {
      fillRef.current.intensity = THREE.MathUtils.lerp(DAY_LIGHT.fill, DUSK_LIGHT.fill, t)
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(DAY_LIGHT.ambient, DUSK_LIGHT.ambient, t)
    }
  })

  return (
    <>
      {/* A model photographed on a table is lit by one big soft source and a
          lot of bounce. */}
      <hemisphereLight
        ref={fillRef}
        args={[palette.skyFill, palette.groundFill, DAY_LIGHT.fill]}
        position={[0, 40, 0]}
      />
      <ambientLight ref={ambientRef} intensity={DAY_LIGHT.ambient} />
      <directionalLight
        ref={keyRef}
        position={sunPosition}
        intensity={DAY_LIGHT.key}
        color={palette.sunLight}
        castShadow={quality === 'full'}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={38}
        shadow-camera-bottom={-38}
        shadow-camera-near={8}
        shadow-camera-far={150}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
        shadow-radius={4}
      />
    </>
  )
}

function SceneFog({ palette, dusk }: { palette: WorldPalette; dusk: number }) {
  const { scene } = useThree()
  const fog = useMemo(() => new THREE.Fog(palette.haze.clone(), 95, 290), [palette])
  const day = useMemo(() => palette.haze.clone(), [palette])
  const night = useMemo(() => palette.haze.clone().multiplyScalar(0.34), [palette])
  const level = useRef(0)

  useEffect(() => {
    scene.fog = fog
    return () => {
      scene.fog = null
    }
  }, [fog, scene])

  useFrame((_, delta) => {
    level.current += (dusk - level.current) * Math.min(delta * 2.5, 1)
    fog.color.copy(day).lerp(night, level.current)
  })

  return null
}

/**
 * The finishing pass.
 *
 * Depth of field does the most work: a real lens focused this close cannot
 * hold a whole landscape sharp, so throwing the near and far ground out of
 * focus is the strongest cue that the eye is looking at something small.
 * Focus rides the camera's own aim. Bloom sits on a high threshold, so only
 * the light thread and any lit structure lift while the model stays matte.
 */
function Finishing({ progress, quality }: { progress: WorldProgress; quality: Quality }) {
  const dofRef = useRef<{
    circleOfConfusionMaterial: { worldFocusDistance: number; worldFocusRange: number }
  }>(null)

  useFrame(() => {
    const material = dofRef.current?.circleOfConfusionMaterial
    if (material) {
      material.worldFocusDistance = progress.focusDistance
      /* the closer the camera settles, the shallower the depth of field —
         which is how a macro lens behaves */
      material.worldFocusRange = THREE.MathUtils.lerp(
        30,
        14,
        THREE.MathUtils.clamp(progress.arrival, 0, 1)
      )
    }
  })

  if (quality !== 'full') {
    /* The lite tier skips depth of field: it is the most expensive effect
       here and the least legible on a small screen. */
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.84}
          luminanceSmoothing={0.2}
          mipmapBlur
          radius={0.62}
        />
        <Vignette offset={0.32} darkness={0.28} />
        <SMAA />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <DepthOfField
        ref={dofRef}
        bokehScale={1.2}
        worldFocusDistance={40}
        worldFocusRange={26}
        /* the bokeh pass runs at half resolution: at this blur radius it is
           indistinguishable, and it is the most expensive pass here */
        resolutionScale={0.5}
      />
      <Bloom
        intensity={0.42}
        luminanceThreshold={0.84}
        luminanceSmoothing={0.2}
        mipmapBlur
        radius={0.66}
      />
      <Vignette offset={0.3} darkness={0.32} />
      <Noise premultiply opacity={0.026} />
      <SMAA />
    </EffectComposer>
  )
}

/** If the canvas ever throws, the DOM presentation underneath is complete. */
class CanvasErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function WorldScene({
  form,
  palette,
  heroPhotoId,
  progress,
  quality,
  dusk,
  active,
  hovered,
  onDestinationHover,
  onDestinationSelect,
  onEntered,
  onReady,
  onFailed,
}: {
  form: WorldForm
  palette: WorldPalette
  heroPhotoId: string | null
  progress: WorldProgress
  quality: Quality
  dusk: number
  active: boolean
  hovered: boolean
  onDestinationHover: (hovered: boolean) => void
  onDestinationSelect: () => void
  onEntered: () => void
  onReady: () => void
  onFailed: () => void
}) {
  const { Destination, Scenery } = form
  const sceneContext = useMemo(() => ({ palette, heroPhotoId }), [palette, heroPhotoId])

  return (
    <CanvasErrorBoundary onError={onFailed}>
      <Canvas
        aria-hidden="true"
        frameloop={active ? 'always' : 'never'}
        shadows={quality === 'full' ? 'soft' : false}
        dpr={quality === 'full' ? [1, 1.5] : [1, 1.4]}
        camera={{
          /* A long lens. Compression is what makes a built thing read as a
             model rather than as a place. */
          fov: quality === 'full' ? 24 : 34,
          near: 0.5,
          far: 700,
          position: form.camera.desktop[0].position,
        }}
        gl={{
          /* SMAA in the composer replaces MSAA */
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.86,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(palette.skyHorizon)
          onReady()
        }}
      >
        <WorldSceneContext.Provider value={sceneContext}>
          <Suspense fallback={null}>
            <SceneFog palette={palette} dusk={dusk} />
            <SceneLight palette={palette} quality={quality} dusk={dusk} />
            <CameraRig form={form} progress={progress} quality={quality} onEntered={onEntered} />

            <Sky palette={palette} dusk={dusk} />
            <Base form={form} palette={palette} quality={quality} dusk={dusk} />
            <Land form={form} palette={palette} quality={quality} dusk={dusk} />
            <Dressing form={form} palette={palette} quality={quality} />
            {Scenery ? <Scenery quality={quality} /> : null}
            <LightRoute form={form} palette={palette} progress={progress} quality={quality} />
            {/* the structure stands on its terrace; it is authored at the
              origin and placed here, so a form never repeats the maths */}
            <group
              position={[
                form.destination.x,
                quantise(
                  form.height(form.destination.x, form.destination.z),
                  form.board.contourStep
                ),
                form.destination.z,
              ]}
            >
              <Destination
                arrival={progress.arrival}
                hovered={hovered}
                onHover={onDestinationHover}
                onSelect={onDestinationSelect}
              />
            </group>
            <Atmosphere palette={palette} quality={quality} dusk={dusk} />

            <Finishing progress={progress} quality={quality} />
          </Suspense>
        </WorldSceneContext.Provider>
      </Canvas>
    </CanvasErrorBoundary>
  )
}
