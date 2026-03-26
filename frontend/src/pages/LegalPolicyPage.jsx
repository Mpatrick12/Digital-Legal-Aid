import { Link, useLocation } from 'react-router-dom'
import './LegalPolicyPage.css'

const CONTACT_EMAIL = 'support@digitallegalaid.rw'

function Clause({ title, children }) {
  return (
    <section className="policy-clause">
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  )
}

export default function LegalPolicyPage() {
  const { pathname } = useLocation()
  const isPrivacy = pathname === '/privacy'

  return (
    <div className="policy-page">
      <header className="policy-header">
        <div className="policy-container">
          <div className="policy-top-links">
            <Link to="/">← Home</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>

          <h1>{isPrivacy ? 'Privacy Policy' : 'Terms of Use (EULA)'}</h1>
          <p>
            This page explained how Digital Legal Aid Rwanda handled user data and usage conditions.
            It applied to all platform modules, including legal search, gazette browsing, and notary lookup.
          </p>

          <div className="policy-switcher">
            <Link to="/privacy" className={isPrivacy ? 'active' : ''}>Privacy Policy</Link>
            <Link to="/terms" className={!isPrivacy ? 'active' : ''}>Terms of Use</Link>
          </div>
        </div>
      </header>

      <main className="policy-container policy-content">
        <Clause title="1. Data Collection">
          We collected user-provided and usage-related information required to operate the platform,
          including name, email, district, and legal search queries. For authenticated users, account
          records were linked to these details to personalize and secure platform access.
        </Clause>

        <Clause title="2. Data Use">
          Collected data was used to improve legal search quality, monitor system analytics, and
          maintain account functionality. User data was not sold to third parties.
        </Clause>

        <Clause title="3. AI Disclaimer">
          AI responses on this platform provided legal information for educational and guidance
          purposes only. They did not constitute legal advice. Users should always consult a qualified
          lawyer or legal aid clinic for case-specific advice.
        </Clause>

        <Clause title="4. Anonymous Mode">
          Gender-based violence (GBV) related searches could be performed without login. In this mode,
          no IP address was logged by the application layer for GBV search interactions.
        </Clause>

        <Clause title="5. User Rights">
          Users could request deletion of their account and associated data. Deletion requests could be
          submitted through the contact channel below and were processed within a reasonable timeframe.
        </Clause>

        <Clause title="6. Third-Party Services">
          The platform used Groq API for AI text generation and MongoDB Atlas for secure cloud data
          storage. Use of these services was subject to their own security and compliance practices.
        </Clause>

        <Clause title="7. Contact">
          For privacy concerns, data deletion requests, or Terms-related complaints, users could contact:
          {` ${CONTACT_EMAIL}`}
        </Clause>

        <section className="policy-note">
          <h3>Effective Date</h3>
          <p>March 2026</p>
        </section>
      </main>
    </div>
  )
}
