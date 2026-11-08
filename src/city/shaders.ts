// Ciel, mer, sol et matériau des modèles cuits.
import * as THREE from 'three'

export const U = {
  time: { value: 0 },
  /** Fixe le ciel à la caméra en mode affiche : soleil et horizon restent composés derrière la maquette. */
  skyRot: { value: new THREE.Matrix3() },
  sun: { value: new THREE.Vector3(0.53, 0.06, -0.85).normalize() },
}

/** D'où vient la lumière du soleil. Volontairement pas le soleil visible : les façades vues restent éclairées. */
export const SUN_LIGHT = new THREE.Vector3(-0.66, 0.52, 0.54).normalize()

const NOISE = /* glsl */ `
  #define C(r,g,b) pow(vec3(r,g,b), vec3(2.2))
  float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
  float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*vn(p); p=p*2.03+vec2(17.1,9.2); a*=.5; } return s; }
`

const SKY = /* glsl */ `
  uniform vec3 uSun; uniform float uTime;
  vec3 cloudSea(vec3 d){
    vec2 uv=d.xz/(-d.y+.05);
    float a=fbm(uv*.42+vec2(uTime*.006,uTime*.002));
    float b=fbm(uv*1.15-vec2(uTime*.009,0.)+a*1.4);
    float m=smoothstep(.34,.72,a*.62+b*.5);
    vec3 c=mix(C(.40,.24,.56),C(.98,.60,.64),m);
    c=mix(c,C(1.,.84,.72),smoothstep(.62,.86,a*.5+b*.62)*.8);
    float s=max(dot(normalize(vec3(d.x,0.,d.z)),normalize(vec3(uSun.x,0.,uSun.z))),0.);
    c+=C(1.,.55,.32)*pow(s,10.)*.32;
    return mix(c,C(1.,.74,.56),exp(d.y*11.));
  }
  vec3 upperSky(vec3 d){
    float y=max(d.y,0.);
    vec3 c=mix(C(1.,.78,.52),C(1.,.56,.54),smoothstep(0.,.06,y));
    c=mix(c,C(.72,.42,.72),smoothstep(.05,.14,y));
    c=mix(c,C(.30,.28,.62),smoothstep(.12,.3,y));
    c=mix(c,C(.08,.10,.32),smoothstep(.3,.8,y));
    float s=max(dot(d,uSun),0.);
    c+=C(1.,.55,.32)*pow(s,7.)*.5;
    c+=C(1.,.78,.5)*pow(s,48.)*.75;

    // Cirrus qui accrochent la dernière lumière
    vec2 uv=d.xz/(y+.13);
    float st=fbm(uv*vec2(.55,1.9)+vec2(uTime*.004,0.));
    c=mix(c,C(1.,.64,.62),smoothstep(.5,.78,st)*smoothstep(.05,.18,y)*(1.-smoothstep(.4,.75,y))*.6);

    // Étoiles
    vec2 sg=d.xz/(abs(d.y)+.25)*190.;
    vec2 sp=floor(sg);
    c+=vec3(1.,.95,.9)*step(.9975,h21(sp))*smoothstep(.34,.72,y)*.9*smoothstep(.34,.1,length(fract(sg)-.5));

    // Banc de cumulus sur l'horizon
    float az=atan(d.x,-d.z);
    float top=.035+.125*pow(fbm(vec2(az*2.1,3.7)),1.6)*2.;
    float n=(fbm(vec2(az*11.,y*42.))-.5)*.05;
    float m=smoothstep(top+n+.006,top+n-.008,y);
    float k=clamp(y/max(top,.001),0.,1.);
    vec3 cc=mix(C(.52,.30,.60),C(1.,.68,.60),smoothstep(.15,.95,k+n*5.));
    cc+=C(1.,.55,.3)*pow(s,5.)*.55;
    c=mix(c,cc,m*.94);
    // Disque du soleil devant le banc : c'est le point focal du ciel
    c=mix(c,vec3(6.,3.9,1.9),smoothstep(.99925,.9996,s));
    return c;
  }
  vec3 skyColor(vec3 d){
    float k=smoothstep(-.012,.03,d.y);
    if(k>=1.) return upperSky(d);
    vec3 low=cloudSea(vec3(d.x,min(d.y,-.001),d.z));
    return k<=0. ? low : mix(low,upperSky(d),k);
  }
`

export const skyMaterial = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  fog: false,
  uniforms: { uSun: U.sun, uTime: U.time, uSkyRot: U.skyRot },
  vertexShader: /* glsl */ `
    varying vec3 vDir;
    uniform mat3 uSkyRot;
    void main(){
      vDir = uSkyRot * position;
      vec4 p = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.0);
      gl_Position = p.xyww;
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vDir;
    ${NOISE}
    ${SKY}
    void main(){
      gl_FragColor = vec4(skyColor(normalize(vDir)), 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
})

export const seaMaterial = new THREE.ShaderMaterial({
  uniforms: { uSun: U.sun, uTime: U.time },
  vertexShader: /* glsl */ `
    varying vec3 vW;
    void main(){
      vec4 w = modelMatrix * vec4(position, 1.0);
      vW = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vW;
    ${NOISE}
    ${SKY}
    float waves(vec2 p){
      return vn(p*1.1+vec2(uTime*.22,uTime*.09))*.6 + vn(p*2.7-vec2(uTime*.28,-uTime*.13))*.3 + vn(p*6.+vec2(uTime*.6,0.))*.1;
    }
    void main(){
      float t = vW.x + vW.z;
      float sd = vW.x - vW.z + 16. + 1.2*sin(t*.35+1.) + .6*sin(t*.9);
      vec3 V = normalize(vW - cameraPosition);
      float e = .06;
      vec2 p = vW.xz;
      float h0 = waves(p);
      vec3 N = normalize(vec3((h0-waves(p+vec2(e,0.)))/e*.05, 1., (h0-waves(p+vec2(0.,e)))/e*.05));
      vec3 R = reflect(V, N); R.y = abs(R.y);
      // Reflet aplati : vue d'en haut, la mer ne refléterait sinon que le zénith sombre
      vec3 Rf = normalize(vec3(R.x, R.y*.32, R.z));
      float depth = smoothstep(0., -13., sd);
      vec3 body = mix(C(.36,.86,.80), C(.13,.34,.62), depth);
      body = mix(body, C(.11,.13,.40), smoothstep(.5,1.,depth));
      float F = .05 + .95*pow(1.-max(dot(-V,N),0.),5.);
      vec3 col = mix(body, skyColor(Rf), clamp(.2+F*.55,0.,1.));
      col += vec3(2.2,1.5,.8)*pow(max(dot(Rf,uSun),0.),700.);
      float foamN = vn(vec2(t*1.6, uTime*.25));
      float foam = smoothstep(.34,.0,abs(sd - .55 - sin(uTime*.5+t*.3)*.18 - foamN*.3));
      col = mix(col, C(1.,.94,.92), foam*.85);
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
})

/** L'eau vue en coupe sur la tranche du socle. */
export const waterWallMaterial = new THREE.ShaderMaterial({
  uniforms: { uTime: U.time },
  vertexShader: /* glsl */ `
    varying vec3 vW;
    void main(){
      vec4 w = modelMatrix * vec4(position, 1.0);
      vW = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vW;
    uniform float uTime;
    ${NOISE}
    void main(){
      float d = clamp((-.18 - vW.y)/1.5,0.,1.);
      vec3 col = mix(C(.42,.86,.86), C(.09,.20,.52), pow(d,.75));
      float along = vW.x - vW.z;
      float caustic = pow(vn(vec2(along*1.3, vW.y*3.2 + uTime*.2)),3.)*.5;
      col += C(.6,.95,.95)*caustic*(1.-d);
      col = mix(col, C(.92,1.,.98), smoothstep(.05,0.,-.18-vW.y)*.7);
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
})

/**
 * Matériau des modèles cuits dans Blender : la texture contient déjà toute leur lumière.
 * Seule l'ombre portée en direct s'y ajoute, pour qu'un immeuble assombrisse son voisin.
 * Elle ne touche que les faces tournées vers le soleil : les autres sont déjà sombres dans la cuisson.
 */
export function makeBaked(map: THREE.Texture | null) {
  const material = new THREE.ShaderMaterial({
    lights: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, { uMap: { value: null }, uSunDir: { value: SUN_LIGHT.clone() } }]),
    vertexShader: /* glsl */ `
      #include <common>
      #include <shadowmap_pars_vertex>
      varying vec2 vMapUv;
      varying vec3 vWorldNormal;
      varying vec3 vTint;
      void main() {
        vMapUv = uv;
        #ifdef USE_INSTANCING_COLOR
          vTint = instanceColor;
        #else
          vTint = vec3(1.);
        #endif
        #include <beginnormal_vertex>
        #include <defaultnormal_vertex>
        vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
        #ifdef USE_INSTANCING
          vWorldNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);
        #endif
        #include <begin_vertex>
        #include <project_vertex>
        #include <worldpos_vertex>
        #include <shadowmap_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <packing>
      #include <bsdfs>
      #include <lights_pars_begin>
      #include <shadowmap_pars_fragment>
      #include <shadowmask_pars_fragment>
      uniform sampler2D uMap;
      uniform vec3 uSunDir;
      varying vec2 vMapUv;
      varying vec3 vWorldNormal;
      varying vec3 vTint;
      void main() {
        vec3 color = texture2D(uMap, vMapUv).rgb * vTint;
        float facing = smoothstep(0., .25, dot(normalize(vWorldNormal), uSunDir));
        color *= mix(1., mix(.5, 1., getShadowMask()), facing);
        gl_FragColor = vec4(color, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
  material.uniforms.uMap.value = map
  return material
}

/** Sol : asphalte, pointillés, passages piétons et halos des lampadaires, tout depuis la position dans le monde. */
export function makeGround() {
  const mat = new THREE.MeshStandardMaterial({ color: '#3c3858', roughness: 0.42, metalness: 0.1 })
  mat.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        vec3 gEm = vec3(0.);
        float gT = vWP.x + vWP.z;
        float gSd = vWP.x - vWP.z + 16. + 1.2*sin(gT*.35+1.) + .6*sin(gT*.9);
        float gIn = step(4.9, gSd);
        if (gSd < 4.9) {
          float grain = fract(sin(dot(floor(vWP.xz*26.),vec2(12.9,78.2)))*43758.5);
          vec3 sand = mix(vec3(.93,.74,.56), vec3(.97,.82,.66), grain*.5);
          sand = mix(vec3(.62,.46,.42), sand, smoothstep(.4,1.5,gSd));
          diffuseColor.rgb = sand;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.86,.78,.76), smoothstep(4.35,4.45,gSd));
        } else {
          float X = mod(vWP.x, 8.) - 4.;
          float Z = mod(vWP.z, 8.) - 4.;
          float ax = abs(X), az = abs(Z);
          bool hr = az < .75, vr = ax < .75;
          bool cross = hr && vr;
          float aa = fwidth(vWP.x) + fwidth(vWP.z);
          // Pointillés centraux, interrompus dans les carrefours
          float along = step(.5, fract(vWP.x * 1.1));
          float alongV = step(.5, fract(vWP.z * 1.1));
          float d = 0.;
          if (hr && !vr && ax > 1.3) d = smoothstep(.022 + aa, .022, az) * along;
          if (vr && !hr && az > 1.3) d = smoothstep(.022 + aa, .022, ax) * alongV;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.95, .78, .4), d * .85);
          // Passages piétons
          float zh = (hr && ax > .78 && ax < 1.15) ? smoothstep(.5,.45,abs(fract(vWP.z*5.)-.5)) : 0.;
          float zv = (vr && az > .78 && az < 1.15) ? smoothstep(.5,.45,abs(fract(vWP.x*5.)-.5)) : 0.;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.8,.78,.86), max(zh,zv) * .8);
          // Halos des lampadaires sur la route mouillée
          vec2 q1 = vec2(mod(vWP.x + 4., 8.) - 4., Z);
          vec2 q2 = vec2(X, mod(vWP.z + 4., 8.) - 4.);
          float pool = (hr ? exp(-dot(q1,q1) * 2.2) : 0.) + (vr ? exp(-dot(q2,q2) * 2.2) : 0.);
          gEm += vec3(1., .58, .3) * pool * .32 * gIn;
        }`,
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += gEm;')
  }
  return mat
}
