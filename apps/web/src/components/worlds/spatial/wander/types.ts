/** Mutable per-frame state shared by reference across the Wander scene. */
export interface WanderProgress {
  /** Raw scroll fraction through the journey container, 0..1 */
  scroll: number
  /** Damped camera-spline parameter */
  camT: number
  /** How far the light route is lit, 0..1 */
  routeHead: number
  /** 0..1 — how settled the visitor is at the world stop */
  arrival: number
  portalHovered: boolean
  /** 0..1 progress of the portal entry flight */
  flyProgress: number
  flying: boolean
}
