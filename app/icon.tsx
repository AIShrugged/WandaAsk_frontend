import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };

export const contentType = 'image/png';

/**
 * App icon — simplified robot face, matches the PixelRobot mascot palette.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1840',
          borderRadius: '7px',
        }}
      >
        {/* Antenna dot */}
        <div
          style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: '#c4b5fd',
            marginBottom: '2px',
          }}
        />

        {/* Eyes */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#7c3aed',
            }}
          />
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#0891b2',
            }}
          />
        </div>

        {/* Mouth */}
        <div
          style={{
            width: '10px',
            height: '2px',
            borderRadius: '2px',
            background: '#a78bfa',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
