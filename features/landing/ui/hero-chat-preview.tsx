const CHAT_MESSAGES = [
  {
    role: 'user' as const,
    text: "What tasks were assigned in today's product review?",
  },
  {
    role: 'ai' as const,
    text: '3 tasks were assigned: 1) API refactor — Alex, due Friday. 2) Design mockup — Maria, due next Monday. 3) QA sign-off — Tom, due today by 5 PM.',
  },
  {
    role: 'user' as const,
    text: 'Who raised concerns about the release timeline?',
  },
  {
    role: 'ai' as const,
    text: 'David raised timeline concerns at 14:23, suggesting the launch date may need 2 extra weeks for full QA validation.',
  },
];
const MAC_DOTS = ['#ff5f57', '#ffbd2e', '#28c840'];

/**
 * HeroChatPreview — mock AI chat card shown in the landing hero section.
 * @returns JSX element.
 */
export function HeroChatPreview() {
  return (
    <div
      data-reveal
      data-reveal-delay='300'
      style={{
        marginTop: '80px',
        display: 'inline-block',
        width: '100%',
        maxWidth: '720px',
      }}
    >
      <div
        className='tribes-float'
        style={{
          background: 'rgba(255,255,255,0.035)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '18px',
          padding: '28px',
          backdropFilter: 'blur(24px)',
          textAlign: 'left',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* macOS-style window dots */}
        <div style={{ display: 'flex', gap: '7px', marginBottom: '20px' }}>
          {MAC_DOTS.map((c) => {
            return (
              <div
                key={c}
                style={{
                  width: '11px',
                  height: '11px',
                  borderRadius: '50%',
                  background: c,
                }}
              />
            );
          })}
        </div>

        {/* Messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {CHAT_MESSAGES.map((msg, i) => {
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background:
                      msg.role === 'ai'
                        ? 'linear-gradient(135deg, #7c3aed, #06b6d4)'
                        : 'rgba(255,255,255,0.12)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {msg.role === 'ai' ? 'T' : '👤'}
                </div>
                <div
                  style={{
                    background:
                      msg.role === 'ai'
                        ? 'rgba(124,58,237,0.18)'
                        : 'rgba(255,255,255,0.07)',
                    padding: '11px 15px',
                    borderRadius: '12px',
                    fontSize: '13.5px',
                    color: 'rgba(255,255,255,0.88)',
                    maxWidth: '82%',
                    lineHeight: 1.55,
                    border:
                      msg.role === 'ai'
                        ? '1px solid rgba(124,58,237,0.25)'
                        : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
