import React from 'react';
import { ImageResponse } from '@takumi-rs/image-response';
import { writeFileSync } from 'fs';

async function generatePreview() {
  const response = new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a2e',
        fontFamily: 'system-ui, sans-serif',
        padding: '50px',
        position: 'relative',
      }}
    >
      {/* DNA decoration - using text */}
      <div
        style={{
          position: 'absolute',
          right: '40px',
          top: '30px',
          fontSize: '200px',
          fontWeight: 900,
          opacity: 0.08,
          color: '#4fd1c5',
          letterSpacing: '-10px',
        }}
      >
        DNA
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#16213e',
          border: '4px solid #0f3460',
          borderRadius: '16px',
          padding: '35px 45px',
          boxShadow: '0 0 30px rgba(79, 209, 197, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              width: '70px',
              height: '70px',
              backgroundColor: '#4fd1c5',
              borderRadius: '14px',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              fontWeight: 900,
              color: '#1a1a2e',
            }}
          >
            AT
          </div>
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#4fd1c5',
              margin: 0,
              letterSpacing: '-1px',
            }}
          >
            Agent Taxonomy
          </h1>
        </div>
        <p
          style={{
            fontSize: '26px',
            fontWeight: 500,
            color: '#e2e8f0',
            margin: '15px 0 0 0',
          }}
        >
          An evolutionary framework for AI agent self-improvement
        </p>
      </div>

      {/* Feature Cards */}
      <div
        style={{
          display: 'flex',
          gap: '25px',
          marginTop: '35px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#16213e',
            border: '3px solid #0f3460',
            borderRadius: '12px',
            padding: '25px',
            flex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '50px',
              height: '50px',
              backgroundColor: '#0f3460',
              borderRadius: '10px',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              color: '#4fd1c5',
              marginBottom: '12px',
            }}
          >
            .md
          </div>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#4fd1c5' }}>GENOME.md</span>
          <span style={{ fontSize: '16px', color: '#a0aec0', marginTop: '8px' }}>Explicit inheritance</span>
        </div>
        
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#16213e',
            border: '3px solid #0f3460',
            borderRadius: '12px',
            padding: '25px',
            flex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '50px',
              height: '50px',
              backgroundColor: '#0f3460',
              borderRadius: '10px',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 800,
              color: '#4fd1c5',
              marginBottom: '12px',
            }}
          >
            L
          </div>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#4fd1c5' }}>Lamarckian</span>
          <span style={{ fontSize: '16px', color: '#a0aec0', marginTop: '8px' }}>Acquired traits inherited</span>
        </div>
        
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#16213e',
            border: '3px solid #0f3460',
            borderRadius: '12px',
            padding: '25px',
            flex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '50px',
              height: '50px',
              backgroundColor: '#0f3460',
              borderRadius: '10px',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              color: '#4fd1c5',
              marginBottom: '12px',
            }}
          >
            F(x)
          </div>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#4fd1c5' }}>Fitness Metrics</span>
          <span style={{ fontSize: '16px', color: '#a0aec0', marginTop: '8px' }}>Measurable evolution</span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
          paddingTop: '25px',
        }}
      >
        <span style={{ fontSize: '22px', color: '#718096' }}>
          github.com/suryast/agent-taxonomy
        </span>
        <div
          style={{
            display: 'flex',
            backgroundColor: '#4fd1c5',
            color: '#1a1a2e',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '18px',
          }}
        >
          agent-taxonomist.dev
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync('public/og-preview.png', buffer);
  console.log('Generated public/og-preview.png');
}

generatePreview();
