import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { PLAYMAKER } from './config';
import type { PlaymakerProfile } from './profiles';

// Las dos imágenes para compartir de un perfil, generadas solas (A6):
//   1200×627  og:image — LinkedIn, X, WhatsApp, Facebook al pegar el enlace
//   1080×1350 vertical — para subir a LinkedIn o Instagram como imagen
// Mismo contenido en ambas: retrato con marco, nombre, cargo y el sello
// pequeño del patrocinador. Las fuentes (Anton e Inter, OFL) viajan con el
// código en lib/playmaker/fonts/ — next.config.ts las incluye en la función.

const GREEN = '#9aea39';
const INK = '#0a0a0a';

async function fonts() {
  const dir = join(process.cwd(), 'lib/playmaker/fonts');
  const [anton, inter, interBold] = await Promise.all([
    readFile(join(dir, 'Anton-Regular.ttf')),
    readFile(join(dir, 'Inter-Regular.ttf')),
    readFile(join(dir, 'Inter-Bold.ttf')),
  ]);
  return [
    { name: 'Anton', data: anton, weight: 400 as const, style: 'normal' as const },
    { name: 'Inter', data: inter, weight: 400 as const, style: 'normal' as const },
    { name: 'Inter', data: interBold, weight: 700 as const, style: 'normal' as const },
  ];
}

/** A /public path as a data URI (Satori can't read relative URLs), or null. */
async function publicImage(path: string | null | undefined): Promise<string | null> {
  if (!path || !path.startsWith('/')) return null;
  try {
    const buf = await readFile(join(process.cwd(), 'public', path));
    const ext = path.split('.').pop()?.toLowerCase();
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('');
}

export async function playmakerShareImage(p: PlaymakerProfile, format: 'og' | 'vertical') {
  const [portrait, frame, sponsorLogo, fontList] = await Promise.all([
    publicImage(p.portrait),
    publicImage(PLAYMAKER.frame),
    publicImage(PLAYMAKER.sponsor.logo),
    fonts(),
  ]);
  const vertical = format === 'vertical';
  const size = vertical ? { width: 1080, height: 1350 } : { width: 1200, height: 627 };
  // Portrait box, always 4:5.
  const pw = vertical ? 640 : 420;
  const ph = Math.round((pw * 5) / 4);

  // Provisional frame until the delivered overlay exists: two green rules, the
  // CSS `double` of the page (Satori has no `double` border style).
  const ruled = (child: React.ReactNode) =>
    frame ? (
      child
    ) : (
      <div style={{ display: 'flex', border: `3px solid ${GREEN}`, padding: 5 }}>
        <div style={{ display: 'flex', border: `3px solid ${GREEN}` }}>{child}</div>
      </div>
    );

  const portraitBox = ruled(
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: pw,
        height: ph,
        background: '#1c1c1c',
      }}
    >
      {portrait ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={portrait} width={pw} height={ph} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
      ) : (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Anton',
            fontSize: pw / 3,
            color: GREEN,
          }}
        >
          {initials(p.name)}
        </div>
      )}
      {frame && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={frame} width={pw} height={ph} style={{ position: 'absolute', inset: 0 }} alt="" />
      )}
    </div>,
  );

  const seal = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,.7)', fontFamily: 'Inter', fontSize: 18 }}>
      <span>{PLAYMAKER.sponsor.label}</span>
      {sponsorLogo ? (
        // Monochrome: white silhouette of whatever file is delivered.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sponsorLogo} height={20} style={{ filter: 'grayscale(1) brightness(10)' }} alt="" />
      ) : (
        <span style={{ fontWeight: 700, letterSpacing: 4, color: '#fff' }}>{PLAYMAKER.sponsor.name.toUpperCase()}</span>
      )}
    </div>
  );

  const text = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: vertical ? 14 : 12, maxWidth: vertical ? 940 : 640 }}>
      <div style={{ display: 'flex', fontFamily: 'Anton', fontSize: vertical ? 40 : 34, color: GREEN, letterSpacing: 2 }}>
        {PLAYMAKER.name.toUpperCase()}
      </div>
      <div style={{ display: 'flex', fontFamily: 'Anton', fontSize: vertical ? 92 : 76, lineHeight: 1, color: '#fff' }}>
        {p.name}
      </div>
      <div style={{ display: 'flex', fontFamily: 'Inter', fontSize: vertical ? 32 : 28, lineHeight: 1.3, color: 'rgba(255,255,255,.88)' }}>
        {`${p.role} · ${p.organization}`}
      </div>
    </div>
  );

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      {seal}
      <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 20, color: '#fff' }}>playbook.la</span>
    </div>
  );

  return new ImageResponse(
    vertical ? (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', background: INK, padding: '60px 70px 50px', gap: 40 }}>
        {portraitBox}
        <div style={{ display: 'flex', width: '100%', flex: 1 }}>{text}</div>
        {footer}
      </div>
    ) : (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: INK, padding: '50px 60px', gap: 56, alignItems: 'center' }}>
        <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>{portraitBox}</div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', flex: 1, padding: '10px 0' }}>
          {text}
          {footer}
        </div>
      </div>
    ),
    { ...size, fonts: fontList },
  );
}
