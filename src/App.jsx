import React from 'react';
import FileUpload from './components/FileUpload';
import DashboardHeader from './components/DashboardHeader';
import MetricGrid from './components/MetricGrid';
import TimeCapsule from './components/TimeCapsule';
import UniverseAwards from './components/UniverseAwards';
import Personalities from './components/Personalities';
import LongestMessage from './components/LongestMessage';
import Compatibility from './components/Compatibility';
import ChartSection from './components/ChartSection';
import Milestones from './components/Milestones';
import SideNav from './components/SideNav';
import FirstMessage from './components/FirstMessage';
import ChatHeatmap from './components/ChatHeatmap';
import Clouds from './components/Clouds';
import ResponseTime from './components/ResponseTime';
import MediaDiet from './components/MediaDiet';
import SilentTreatment from './components/SilentTreatment';
import TexterTypology from './components/TexterTypology';
import { exportToPdf } from './utils/exporter';
import { parseChat } from './utils/chatParser';
import { analyzeChat } from './utils/chatAnalyzer';
import { Sparkles, MessageCircle, Heart, ShieldCheck, Download } from 'lucide-react';

export default function App() {
  const [chatData, setChatData] = React.useState(null);

  const handleDataParsed = (rawText, fileName = 'chat.txt') => {
    try {
      const parsed = parseChat(rawText);
      if (!parsed.messages || parsed.messages.length === 0) {
        alert("We couldn't detect any valid chat messages. Please check the text file format.");
        return;
      }
      const analyzed = analyzeChat(parsed.messages, parsed.participants);
      if (!analyzed) {
        alert("Failed to analyze the chat statistics. Ensure the file contains personal dialogue.");
        return;
      }
      setChatData(analyzed);
    } catch (err) {
      console.error(err);
      alert("An error occurred while analyzing the chat data. Please ensure it's a valid WhatsApp log export.");
    }
  };

  const handleReset = () => setChatData(null);

  const [isCensored, setIsCensored] = React.useState(false);

  const displayData = React.useMemo(() => {
    if (!chatData || !isCensored) return chatData;
    const [name1, name2] = chatData.chatters;
    
    const deepCensor = (obj) => {
      if (typeof obj === 'string') {
        if (obj === name1) return "User 1";
        if (obj === name2) return "User 2";
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(deepCensor);
      }
      if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
          let newKey = key;
          if (key === name1) newKey = "User 1";
          else if (key === name2) newKey = "User 2";
          newObj[newKey] = deepCensor(obj[key]);
        }
        return newObj;
      }
      return obj;
    };
    return deepCensor(chatData);
  }, [chatData, isCensored]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Ambient background glows */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '15%', left: '5%',
          width: '40vw', height: '40vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,180,216,0.07) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '5%',
          width: '35vw', height: '35vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,78,100,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
      </div>

      {!chatData ? (
        /* ── LANDING / FILE UPLOAD SCREEN ── */
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh',
          padding: '40px 24px',
          position: 'relative', zIndex: 1,
        }} className="anim-fade-up">

          {/* Hero badges (Open Source + Version) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 32,
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {/* Open Source Pill */}
            <a 
              href="https://github.com/gtxPrime/whats-wrap"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--bg-overlay)',
                border: '1px solid var(--card-border)',
                borderRadius: 999,
                padding: '4px 12px',
                textDecoration: 'none',
                color: 'var(--on-surface-dim)',
                fontSize: '0.7rem', fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--on-surface-mute)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              Open Source
            </a>

            {/* Premium Sparkle tag */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--primary-glow)',
              border: '1px solid rgba(0, 180, 216, 0.2)',
              borderRadius: 999,
              padding: '6px 16px',
            }}>
              <Sparkles size={14} color="var(--primary)" />
              <span style={{
                fontSize: '0.7rem', fontWeight: 700,
                color: 'var(--primary)',
                textTransform: 'uppercase', letterSpacing: '0.12em',
                fontFamily: 'var(--font-heading)',
              }}>
                WhatsWrap 2026
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            fontWeight: 900,
            textAlign: 'center',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 20,
            maxWidth: 700,
          }}>
            Unwrap Your{' '}
            <span className="gradient-text grad-aurora-text">
              WhatsApp Story
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            color: 'var(--on-surface-dim)',
            fontSize: '1rem',
            maxWidth: 520,
            textAlign: 'center',
            lineHeight: 1.7,
            marginBottom: 48,
          }}>
            Transform your exported chats into a jaw-dropping annual recap,
            streaks, awards, personalities, compatibility scores &amp; beautiful charts.
            100% private, runs in your browser.
          </p>

          {/* Feature pills */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 10,
            justifyContent: 'center', marginBottom: 48,
          }}>
            {['Chat Streaks', 'Universe Awards', 'Personality Report', 'Compatibility Score', 'Interactive Charts', 'Time Capsules'].map(f => (
              <div key={f} style={{
                display: 'inline-flex', alignItems: 'center',
                gap: 6, padding: '5px 12px',
                background: 'var(--bg-overlay)',
                border: '1px solid var(--card-border)',
                borderRadius: 999,
                fontSize: '0.75rem', fontWeight: 500,
                color: 'var(--on-surface-dim)',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>

          {/* Upload */}
          <div style={{ width: '100%', maxWidth: 560 }}>
            <FileUpload onDataParsed={handleDataParsed} />
          </div>

          {/* Privacy notice */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 32, color: 'var(--on-surface-mute)',
            fontSize: '0.75rem', maxWidth: 440, textAlign: 'center',
          }}>
            <ShieldCheck size={15} color="var(--tertiary)" style={{ flexShrink: 0 }} />
            <span>
              <strong style={{ color: 'var(--on-surface-dim)' }}>100% Client-Side.</strong>{' '}
              Your chats never leave your device. Nothing is uploaded or stored.
            </span>
          </div>
        </div>
      ) : (
        /* ── DASHBOARD SCREEN ── */
        <div className="app-shell">
          <SideNav
            onReset={handleReset}
            chatters={displayData.chatters}
            streak={displayData.maxStreak}
          />

          <main className="app-main" style={{ position: 'relative', zIndex: 1 }}>
            <DashboardHeader
              chatters={displayData.chatters}
              onReset={handleReset}
              isCensored={isCensored}
              setIsCensored={setIsCensored}
            />

            {/* All sections rendered one below each other */}
            <div id="dashboard-root" style={{ padding: '0 32px 64px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>

              <section id="overview" className="dashboard-section" style={{ paddingTop: 16 }}>
                <MetricGrid data={displayData} />
              </section>

              <div style={{ height: 56 }} />

              <section id="heatmap" className="dashboard-section">
                <ChatHeatmap data={displayData} />
              </section>

              <div style={{ height: 56 }} />

              <section id="clouds" className="dashboard-section">
                <Clouds data={displayData} />
              </section>

              <div style={{ height: 56 }} />

              <section id="first-message" className="dashboard-section">
                <FirstMessage data={displayData} />
              </section>

              <div style={{ height: 56 }} />

              <section id="capsule" className="dashboard-section">
                <TimeCapsule capsules={displayData.monthlyCapsules} />
              </section>

              <div style={{ height: 56 }} />

              <section id="awards" className="dashboard-section">
                <UniverseAwards awards={displayData.awards} />
              </section>

              <div style={{ height: 56 }} />

              <section id="response" className="dashboard-section">
                <ResponseTime data={displayData} />
              </section>

              <div style={{ height: 56 }} />

              <section id="silent" className="dashboard-section">
                <SilentTreatment data={displayData} />
              </section>

              <div style={{ height: 56 }} />

              <section id="media-diet" className="dashboard-section">
                <MediaDiet data={displayData} />
              </section>

              <div style={{ height: 56 }} />

              <section id="typology" className="dashboard-section">
                <TexterTypology data={displayData} />
              </section>

              <div style={{ height: 56 }} />

              <section id="personalities" className="dashboard-section">
                <Personalities personalities={displayData.personalities} />
              </section>

              <div style={{ height: 56 }} />

              <section id="longest" className="dashboard-section">
                <LongestMessage data={displayData} />
              </section>

              <div style={{ height: 56 }} />

              <section id="compatibility" className="dashboard-section">
                <Compatibility compatibility={displayData.compatibility} chatters={displayData.chatters} />
              </section>

              <div style={{ height: 56 }} />

              <section id="milestones" className="dashboard-section">
                <Milestones milestones={displayData.milestones} />
                <div style={{ marginTop: 32 }}>
                  <ChartSection data={displayData} />
                </div>
              </section>

              {/* End of report action */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 48, marginBottom: 16 }}>
                <button
                  onClick={() => exportToPdf('dashboard-root')}
                  className="export-btn"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px',
                    borderRadius: 12,
                    background: 'var(--grad-primary)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(167,139,250,0.3)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(167,139,250,0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(167,139,250,0.3)';
                  }}
                >
                  <Download size={16} />
                  <span>Download Full Report (PDF)</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <footer style={{
              borderTop: '1px solid var(--card-border)',
              padding: '20px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: '0.72rem',
              color: 'var(--on-surface-mute)',
              fontWeight: 500,
              letterSpacing: '0.05em',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Heart size={11} color="#f87171" fill="#f87171" />
                <span>Built with blood, sweat, and caffeine by <a href="https://github.com/gtxPrime" target="_blank" rel="noreferrer" style={{color: 'var(--primary)', textDecoration: 'none'}}>gtxPrime</a></span>
              </div>
              <div>100% Private Client-Side Application</div>
            </footer>
          </main>
        </div>
      )}
    </div>
  );
}
