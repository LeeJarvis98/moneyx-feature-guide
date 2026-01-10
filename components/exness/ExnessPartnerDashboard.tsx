'use client';

import { useState } from 'react';
import { exnessApi } from '@/lib/exness/api';
import type {
  ExnessApiError,
  PartnerLink,
  AffiliationResponse,
  CryptoWalletInfo,
  SubPublisher,
  TrafficSource,
} from '@/types/exness';
import styles from './ExnessPartnerDashboard.module.css';

export default function ExnessPartnerDashboard() {
  const [activeTab, setActiveTab] = useState<'links' | 'affiliation' | 'wallet' | 'subpublishers' | 'traffic'>('links');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Links state
  const [partnerLinks, setPartnerLinks] = useState<PartnerLink[]>([]);
  const [defaultLink, setDefaultLink] = useState<PartnerLink | null>(null);

  // Affiliation check state
  const [affiliationEmail, setAffiliationEmail] = useState('');
  const [affiliationResult, setAffiliationResult] = useState<AffiliationResponse | null>(null);

  // Wallet state
  const [walletInfo, setWalletInfo] = useState<CryptoWalletInfo | null>(null);

  // Sub-publishers state
  const [subPublishers, setSubPublishers] = useState<SubPublisher[]>([]);

  // Traffic sources state
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);

  // Fetch partner links
  const fetchPartnerLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await exnessApi.getPartnerLinks();
      setPartnerLinks(response.data);
      const defaultLink = response.data.find(link => link.is_default) || null;
      setDefaultLink(defaultLink);
    } catch (err) {
      const error = err as ExnessApiError;
      setError(error.message || 'Failed to fetch partner links');
    } finally {
      setLoading(false);
    }
  };

  // Check client affiliation
  const checkAffiliation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAffiliationResult(null);
    try {
      const result = await exnessApi.checkAffiliation({ email: affiliationEmail });
      setAffiliationResult(result);
    } catch (err) {
      const error = err as ExnessApiError;
      setError(error.message || 'Failed to check affiliation');
    } finally {
      setLoading(false);
    }
  };

  // Fetch crypto wallet info
  const fetchWalletInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await exnessApi.getCryptoWalletInfo();
      setWalletInfo(info);
    } catch (err) {
      const error = err as ExnessApiError;
      setError(error.message || 'Failed to fetch wallet info');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sub-publishers
  const fetchSubPublishers = async () => {
    setLoading(true);
    setError(null);
    try {
      const publishers = await exnessApi.getSubPublishers();
      setSubPublishers(publishers);
    } catch (err) {
      const error = err as ExnessApiError;
      setError(error.message || 'Failed to fetch sub-publishers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch traffic sources
  const fetchTrafficSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const sources = await exnessApi.getTrafficSources();
      setTrafficSources(sources);
    } catch (err) {
      const error = err as ExnessApiError;
      setError(error.message || 'Failed to fetch traffic sources');
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await exnessApi.logout();
      window.location.reload();
    } catch (err) {
      console.error('Logout error:', err);
      window.location.reload();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Exness Partner Dashboard</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={` ${activeTab === 'links' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('links')}
        >
          Partner Links
        </button>
        <button
          className={` ${activeTab === 'affiliation' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('affiliation')}
        >
          Check Affiliation
        </button>
        <button
          className={` ${activeTab === 'wallet' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          Crypto Wallet
        </button>
        <button
          className={` ${activeTab === 'subpublishers' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('subpublishers')}
        >
          Sub-Publishers
        </button>
        <button
          className={` ${activeTab === 'traffic' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('traffic')}
        >
          Traffic Sources
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {/* Content Area */}
      <div className={styles.content}>
        {/* Partner Links Tab */}
        {activeTab === 'links' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Your Partner Links</h2>
              <button
                onClick={fetchPartnerLinks}
                disabled={loading}
                className={styles.fetchButton}
              >
                {loading ? 'Loading...' : 'Fetch Links'}
              </button>
            </div>

            {defaultLink && (
              <div className={styles.defaultLink}>
                <h3>Default Link</h3>
                <div className={styles.linkItem}>
                  <span className={styles.linkName}>{defaultLink.link_code}</span>
                  <span className={styles.linkUrl}>
                    Partner Account: {defaultLink.partner_account}
                  </span>
                  <span className={styles.linkDate}>
                    Schema: {defaultLink.reward_schema}
                  </span>
                </div>
              </div>
            )}

            {partnerLinks.length > 0 && (
              <div className={styles.linksList}>
                <h3>All Links ({partnerLinks.length})</h3>
                {partnerLinks.map((link, index) => (
                  <div key={index} className={styles.linkItem}>
                    <span className={styles.linkName}>
                      {link.link_code}
                      {link.is_default && ' (Default)'}
                      {link.is_blocked && ' (Blocked)'}
                      {link.is_custom && ' (Custom)'}
                    </span>
                    <span className={styles.linkUrl}>
                      Account: {link.partner_account}
                    </span>
                    <span className={styles.linkDate}>
                      Schema: {link.reward_schema}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Affiliation Check Tab */}
        {activeTab === 'affiliation' && (
          <div className={styles.section}>
            <h2>Check Client Affiliation</h2>
            <form onSubmit={checkAffiliation} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="affiliationEmail">Client Email</label>
                <input
                  type="email"
                  id="affiliationEmail"
                  value={affiliationEmail}
                  onChange={(e) => setAffiliationEmail(e.target.value)}
                  required
                  placeholder="client@example.com"
                  className={styles.input}
                  disabled={loading}
                />
              </div>
              <button type="submit" disabled={loading} className={styles.submitButton}>
                {loading ? 'Checking...' : 'Check Affiliation'}
              </button>
            </form>

            {affiliationResult && (
              <div className={` ${affiliationResult.is_affiliated ? styles.affiliated : styles.notAffiliated}`}>
                <h3>
                  {affiliationResult.is_affiliated ? 'Client is Affiliated' : 'Client is Not Affiliated'}
                </h3>
                {affiliationResult.client_id && (
                  <p>Client ID: {affiliationResult.client_id}</p>
                )}
                {affiliationResult.partner_id && (
                  <p>Partner ID: {affiliationResult.partner_id}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Crypto Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Crypto Wallet Information</h2>
              <button
                onClick={fetchWalletInfo}
                disabled={loading}
                className={styles.fetchButton}
              >
                {loading ? 'Loading...' : 'Fetch Wallet Info'}
              </button>
            </div>

            {walletInfo && (
              <div className={styles.walletInfo}>
                <div className={` ${walletInfo.available ? styles.available : styles.unavailable}`}>
                  {walletInfo.available ? 'Available' : 'Not Available'}
                </div>
                {walletInfo.currencies && walletInfo.currencies.length > 0 && (
                  <div>
                    <h3>Supported Currencies</h3>
                    <ul className={styles.currencyList}>
                      {walletInfo.currencies.map((currency) => (
                        <li key={currency}>{currency}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sub-Publishers Tab */}
        {activeTab === 'subpublishers' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Sub-Publishers</h2>
              <button
                onClick={fetchSubPublishers}
                disabled={loading}
                className={styles.fetchButton}
              >
                {loading ? 'Loading...' : 'Fetch Sub-Publishers'}
              </button>
            </div>

            {subPublishers.length > 0 && (
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subPublishers.map((publisher) => (
                      <tr key={publisher.id}>
                        <td>{publisher.name}</td>
                        <td>{publisher.email}</td>
                        <td>
                          <span className={` ${styles[publisher.status]}`}>
                            {publisher.status}
                          </span>
                        </td>
                        <td>{new Date(publisher.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Traffic Sources Tab */}
        {activeTab === 'traffic' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Traffic Sources</h2>
              <button
                onClick={fetchTrafficSources}
                disabled={loading}
                className={styles.fetchButton}
              >
                {loading ? 'Loading...' : 'Fetch Traffic Sources'}
              </button>
            </div>

            {trafficSources.length > 0 && (
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trafficSources.map((source) => (
                      <tr key={source.uid}>
                        <td>{source.name}</td>
                        <td>{source.type}</td>
                        <td>
                          <span className={` ${styles[source.status]}`}>
                            {source.status}
                          </span>
                        </td>
                        <td>{new Date(source.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
