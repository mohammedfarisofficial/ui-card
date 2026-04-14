import * as THREE from 'three'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, Lightformer } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import { useControls, button, Leva } from 'leva'

extend({ MeshLineGeometry, MeshLineMaterial })
useGLTF.preload('https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/5huRVDzcoDwnbgrKUo1Lzs/53b6dd7d6b4ffcdbd338fa60265949e1/tag.glb')

// ─── Band texture ─────────────────────────────────────────────────────────────
function useBandTexture(ready, config) {
  return useMemo(() => {
    const W = 512, H = 128
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = config.bandColor || '#e01414'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = config.bandTextColor || '#ffffff'
    ctx.letterSpacing = '-2px'
    ctx.font = `bold ${config.bandFontSize || 44}px sans-serif`
    ctx.textBaseline = 'middle'
    const label = `  ${config.bandText || 'upreels'}  `
    const tw = ctx.measureText(label).width
    let x = 0
    while (x < W * 2) { ctx.fillText(label, x, H / 2); x += tw }
    const texture = new THREE.CanvasTexture(canvas)
    texture.flipY = false
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.needsUpdate = true
    return texture
  }, [ready, config])
}

// ─── Card texture ─────────────────────────────────────────────────────────────
function useCardTexture(ready, config) {
  return useMemo(() => {
    const W = 1024, H = 1450
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, W, H)

    const { headerH, bannerH, padL, nameSize, urlSize, bannerTextSize, bannerOffset, badgeSize, badgeX, badgeY } = config

    // White header
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, headerH)

    // Name
    ctx.textAlign = 'left'
    ctx.letterSpacing = '-2px'
    ctx.fillStyle = '#000000'
    ctx.font = `bold ${nameSize}px sans-serif`
    ctx.fillText(config.name || 'Adwaith bv', padL, 160)

    // URL
    ctx.fillStyle = '#666666'
    ctx.font = `${urlSize}px sans-serif`
    const urlPre = 'https://upreels.in/profile/'
    ctx.fillText(urlPre, padL, 200)
    const preW = ctx.measureText(urlPre).width
    ctx.fillStyle = config.accentColor || '#e01414'
    ctx.fillText(config.slug || 'adwaith-bv', padL + preW, 200)

    // Avatar placeholder
    const avSize = 220, avX = W - avSize - 50, avY = 45, avR = 36
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(avX + avR, avY); ctx.lineTo(avX + avSize - avR, avY)
    ctx.quadraticCurveTo(avX + avSize, avY, avX + avSize, avY + avR)
    ctx.lineTo(avX + avSize, avY + avSize - avR)
    ctx.quadraticCurveTo(avX + avSize, avY + avSize, avX + avSize - avR, avY + avSize)
    ctx.lineTo(avX + avR, avY + avSize)
    ctx.quadraticCurveTo(avX, avY + avSize, avX, avY + avSize - avR)
    ctx.lineTo(avX, avY + avR)
    ctx.quadraticCurveTo(avX, avY, avX + avR, avY)
    ctx.closePath(); ctx.clip()
    const gr = ctx.createLinearGradient(avX, avY, avX + avSize, avY + avSize)
    gr.addColorStop(0, '#8899cc'); gr.addColorStop(1, '#445588')
    ctx.fillStyle = gr; ctx.fillRect(avX, avY, avSize, avSize)
    ctx.restore()

    // Red banner
    ctx.fillStyle = config.accentColor || '#e01414'
    ctx.fillRect(0, headerH, W, bannerH)
    ctx.fillStyle = '#ffffff'
    const creatorFontSize = bannerTextSize || 184
    ctx.font = `600 ${creatorFontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.letterSpacing = `${-0.03 * creatorFontSize}px`
    ctx.fillText(config.bannerTitle || 'CREATOR', W / 2 + (padL - 20), headerH + bannerH / 2 + bannerOffset)
    ctx.letterSpacing = '-2px'
    ctx.textAlign = 'left'

    // Blue art section
    const artH = H - headerH - bannerH, ay = headerH + bannerH
    const skyG = ctx.createLinearGradient(0, ay, 0, H)
    skyG.addColorStop(0, '#5c70e2'); skyG.addColorStop(0.6, '#3a4fc1'); skyG.addColorStop(1, '#2e3fa8')
    ctx.fillStyle = skyG; ctx.fillRect(0, ay, W, artH)
    const burst = ctx.createRadialGradient(W / 2, ay, 0, W / 2, ay, W * 0.62)
    burst.addColorStop(0, 'rgba(200,215,255,0.82)'); burst.addColorStop(0.65, 'rgba(92,112,226,0.12)'); burst.addColorStop(1, 'rgba(58,79,193,0)')
    ctx.fillStyle = burst; ctx.fillRect(0, ay, W, artH)

    const sx = W / 400, sy = artH / 480
    const px = (x) => x * sx, py = (y) => ay + y * sy

    if (config.showArt) {
      ctx.fillStyle = '#ddd5c2'
      ctx.beginPath(); ctx.moveTo(px(-5), py(0)); ctx.lineTo(px(148), py(0)); ctx.quadraticCurveTo(px(88), py(30), px(62), py(85)); ctx.quadraticCurveTo(px(38), py(138), px(50), py(195)); ctx.quadraticCurveTo(px(62), py(248), px(28), py(310)); ctx.quadraticCurveTo(px(0), py(358), px(-5), py(420)); ctx.lineTo(px(-5), py(480)); ctx.closePath(); ctx.fill()
      ctx.beginPath(); ctx.moveTo(px(405), py(0)); ctx.lineTo(px(252), py(0)); ctx.quadraticCurveTo(px(310), py(30), px(336), py(85)); ctx.quadraticCurveTo(px(360), py(138), px(348), py(195)); ctx.quadraticCurveTo(px(336), py(248), px(370), py(312)); ctx.quadraticCurveTo(px(398), py(360), px(405), py(425)); ctx.lineTo(px(405), py(480)); ctx.closePath(); ctx.fill()
      ctx.beginPath(); ctx.moveTo(px(152), py(78)); ctx.quadraticCurveTo(px(130), py(82), px(112), py(105)); ctx.quadraticCurveTo(px(88), py(140), px(95), py(192)); ctx.quadraticCurveTo(px(102), py(245), px(72), py(300)); ctx.quadraticCurveTo(px(42), py(352), px(20), py(420)); ctx.lineTo(px(-5), py(480)); ctx.lineTo(px(140), py(480)); ctx.quadraticCurveTo(px(128), py(415), px(132), py(360)); ctx.quadraticCurveTo(px(138), py(300), px(162), py(256)); ctx.quadraticCurveTo(px(184), py(214), px(178), py(168)); ctx.quadraticCurveTo(px(172), py(124), px(164), py(90)); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.fill()
      ctx.beginPath(); ctx.moveTo(px(248), py(78)); ctx.quadraticCurveTo(px(268), py(82), px(285), py(106)); ctx.quadraticCurveTo(px(310), py(140), px(303), py(192)); ctx.quadraticCurveTo(px(296), py(246), px(326), py(302)); ctx.quadraticCurveTo(px(356), py(356), px(378), py(425)); ctx.lineTo(px(405), py(480)); ctx.lineTo(px(258), py(480)); ctx.quadraticCurveTo(px(270), py(415), px(266), py(360)); ctx.quadraticCurveTo(px(260), py(300), px(237), py(256)); ctx.quadraticCurveTo(px(215), py(214), px(220), py(168)); ctx.quadraticCurveTo(px(226), py(124), px(235), py(90)); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.fill()
    }

    if (config.showOrbs) {
      const orbs = [{ cx: 200, cy: 455, r: 6.5 }, { cx: 200, cy: 400, r: 5.5 }, { cx: 200, cy: 350, r: 4.5 }, { cx: 200, cy: 306, r: 3.8 }, { cx: 200, cy: 268, r: 3.2 }, { cx: 200, cy: 236, r: 2.5 }, { cx: 200, cy: 208, r: 2.0 }]
      orbs.forEach(({ cx, cy, r }, i) => {
        const op = 0.72 - i * 0.08
        const glow = ctx.createRadialGradient(px(cx), py(cy), 0, px(cx), py(cy), r * sx * 5)
        glow.addColorStop(0, `rgba(170,255,204,${op * 0.35})`); glow.addColorStop(1, 'rgba(68,204,136,0)')
        ctx.beginPath(); ctx.arc(px(cx), py(cy), r * sx * 5, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill()
        ctx.beginPath(); ctx.arc(px(cx), py(cy), r * sx, 0, Math.PI * 2); ctx.fillStyle = `rgba(216,255,236,${op})`; ctx.fill()
      })
    }

    const botG = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, W * 0.6)
    botG.addColorStop(0, 'rgba(119,255,170,0.28)'); botG.addColorStop(1, 'rgba(58,79,193,0)')
    ctx.fillStyle = botG; ctx.fillRect(0, ay + artH * 0.55, W, artH * 0.45)

    // Badge pill
    const bx = px(badgeX), by = py(badgeY), bw = px(badgeSize), bh = py(40) - py(0), br = 16 * sx
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(bx + br, by); ctx.lineTo(bx + bw - br, by); ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + bh)
    ctx.lineTo(bx + bw, by + bh); ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh)
    ctx.lineTo(bx + br, by + bh); ctx.quadraticCurveTo(bx, by + bh, bx, by + bh)
    ctx.lineTo(bx, by); ctx.quadraticCurveTo(bx, by, bx + br, by)
    ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill()
    ctx.restore()
    ctx.fillStyle = config.accentColor || '#e01414'
    ctx.letterSpacing = '-2px'
    ctx.font = `bold ${Math.round(24 * sx)}px sans-serif`
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.fillText('upreels.in', bx + 16 * sx, by + bh * 0.52)

    const texture = new THREE.CanvasTexture(canvas)
    texture.flipY = false; texture.needsUpdate = true
    return texture
  }, [ready, config])
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => { document.fonts.ready.then(() => setFontsReady(true)) }, [])

  const download = () => {
    const link = document.createElement('a')
    link.setAttribute('download', 'upreels-card.png')
    const canvas = document.querySelector('canvas')
    if (canvas) {
      link.setAttribute('href', canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
      link.click()
    }
  }

  const cardConfig = useControls('Card Design', {
    name: 'Adwaith bv', slug: 'adwaith-bv',
    accentColor: { value: '#e01414' },
    headerH: { value: 310, min: 200, max: 500 },
    bannerH: { value: 200, min: 100, max: 400 },
    padL: { value: 20, min: 0, max: 100 },
    nameSize: { value: 40, min: 20, max: 120 },
    urlSize: { value: 32, min: 10, max: 60 },
    bannerTitle: 'CREATOR',
    bannerTextSize: { value: 184, min: 40, max: 250 },
    bannerOffset: { value: 8, min: -50, max: 50 },
    badgeSize: { value: 150, min: 80, max: 300 },
    badgeX: { value: 30, min: 0, max: 200 },
    badgeY: { value: 430, min: 300, max: 480 },
    showArt: true, showOrbs: true,
  }, { collapsed: true })

  const materialConfig = useControls('Materials', {
    metalness: { value: 0.5, min: 0, max: 1 },
    roughness: { value: 0.3, min: 0, max: 1 },
    clearcoat: { value: 1, min: 0, max: 1 },
    clearcoatRoughness: { value: 0.15, min: 0, max: 1 },
  }, { collapsed: true })

  const physicsConfig = useControls('Physics', {
    minSpeed: { value: 10, min: 0, max: 50 },
    maxSpeed: { value: 50, min: 10, max: 200 },
    gravity: { value: -40, min: -100, max: 0 },
  }, { collapsed: true })

  const bandConfig = useControls('Band', {
    bandText: 'upreels',
    bandFontSize: { value: 44, min: 10, max: 100 },
    bandColor: { value: '#e01414' },
    bandTextColor: { value: '#ffffff' },
  }, { collapsed: true })

  const sceneConfig = useControls('Scene', {
    bg: { value: '#1a1a1a' },
    envBlur: { value: 0.75, min: 0, max: 1 },
    Download: button(download),
  }, { collapsed: true })

  return (
    <div style={{ width: '100%', height: '100%', background: sceneConfig.bg, touchAction: 'none' }}>
      <Leva collapsed />
      <Canvas gl={{ preserveDrawingBuffer: true }} camera={{ position: [0, 0, 13], fov: 25 }}>
        <ambientLight intensity={Math.PI} />
        <Physics interpolate gravity={[0, physicsConfig.gravity, 0]} timeStep={1 / 60}>
          <Band
            fontsReady={fontsReady}
            cardConfig={cardConfig}
            materialConfig={materialConfig}
            physicsConfig={physicsConfig}
            bandConfig={bandConfig}
          />
        </Physics>
        <Environment background blur={sceneConfig.envBlur}>
          <color attach="background" args={[sceneConfig.bg]} />
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  )
}

// ─── Band ─────────────────────────────────────────────────────────────────────
// CLIP_ANCHOR: local-space position on the card where the band attaches.
// This must match the spherical joint anchor [0, CLIP_ANCHOR_Y, 0].
const CLIP_ANCHOR_Y = 1.45

function Band({ fontsReady, cardConfig, materialConfig, physicsConfig, bandConfig }) {
  const { minSpeed, maxSpeed } = physicsConfig
  const band = useRef(), fixed = useRef(), j1 = useRef(), j2 = useRef(), j3 = useRef(), card = useRef()
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3()

  // Reusable objects — never allocate inside useFrame
  const _localAnchor = new THREE.Vector3(0, CLIP_ANCHOR_Y, 0)
  const _worldAnchor = new THREE.Vector3()
  const _quat = new THREE.Quaternion()

  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 2, linearDamping: 2 }
  const { nodes, materials } = useGLTF('https://assets.vercel.com/image/upload/contentful/image/e5382hct74si/5huRVDzcoDwnbgrKUo1Lzs/53b6dd7d6b4ffcdbd338fa60265949e1/tag.glb')
  const texture = useBandTexture(fontsReady, bandConfig)
  const cardTexture = useCardTexture(fontsReady, cardConfig)
  const { width, height } = useThree((state) => state.size)
  const [curve] = useState(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()
  ]))
  const [dragged, drag] = useState(false)
  const [hovered, hover] = useState(false)

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, card, [[0, 0, 0], [0, CLIP_ANCHOR_Y, 0]])

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab'
      return () => void (document.body.style.cursor = 'auto')
    }
  }, [hovered, dragged])

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
        ;[card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z })
    }

    if (fixed.current) {
      // Lerp j1/j2 to reduce jitter
      ;[j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation())
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())))
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)))
      })

      // ── KEY FIX ──────────────────────────────────────────────────────────
      // Compute the clip's world position from the card's physics transform.
      // This is always in sync with the card rotation — no lag, no z-fight.
      const cardPos = card.current.translation()
      const cardRot = card.current.rotation() // {x,y,z,w}
      _quat.set(cardRot.x, cardRot.y, cardRot.z, cardRot.w)
      _worldAnchor.copy(_localAnchor).applyQuaternion(_quat)
      curve.points[0].set(
        cardPos.x + _worldAnchor.x,
        cardPos.y + _worldAnchor.y,
        cardPos.z + _worldAnchor.z
      )
      // ─────────────────────────────────────────────────────────────────────

      curve.points[1].copy(j2.current.lerped)
      curve.points[2].copy(j1.current.lerped)
      curve.points[3].copy(fixed.current.translation())
      band.current.geometry.setPoints(curve.getPoints(32))

      // Keep card facing forward
      ang.copy(card.current.angvel())
      rot.copy(card.current.rotation())
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })
    }
  })

  curve.curveType = 'chordal'

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={(e) => (
              e.target.setPointerCapture(e.pointerId),
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            )}
          >
            {/* Card — renders behind band */}
            <mesh geometry={nodes.card.geometry} renderOrder={2}>
              <meshPhysicalMaterial
                map={cardTexture}
                map-anisotropy={16}
                clearcoat={materialConfig.clearcoat}
                clearcoatRoughness={materialConfig.clearcoatRoughness}
                roughness={materialConfig.roughness}
                metalness={materialConfig.metalness}
                depthTest={false}
              />
            </mesh>
            {/* Clip + clamp — render on top of band */}
            <mesh geometry={nodes.clip.geometry} renderOrder={3}>
              <meshStandardMaterial {...materials.metal} roughness={0.3} depthTest={false} />
            </mesh>
            <mesh geometry={nodes.clamp.geometry} renderOrder={3}>
              <meshStandardMaterial {...materials.metal} depthTest={false} />
            </mesh>
          </group>
        </RigidBody>
      </group>

      {/* Band — renderOrder between card and clip */}
      <mesh ref={band} renderOrder={1}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={[width, height]}
          useMap
          map={texture}
          repeat={[-3, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  )
}