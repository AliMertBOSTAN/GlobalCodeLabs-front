import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../i18n';
import { showToast } from '../components/Toast';
import { adminSetPrice, adminMint, adminKycRegister, adminKycToggle, adminDepositTry, adminGetUsers, adminGetTransactions, adminGetStats } from '../services/blockchain';
import { Settings, DollarSign, Coins, UserCheck, ToggleLeft, ToggleRight, PiggyBank, Users, BarChart3, ChevronLeft, ChevronRight, Loader2, Shield } from 'lucide-react';
import './Admin.css';

export default function Admin() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [loading, setLoading] = useState({});

  // Form states
  const [newPrice, setNewPrice] = useState('');
  const [mintAddr, setMintAddr] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [kycAddr, setKycAddr] = useState('');
  const [kycEnabled, setKycEnabled] = useState(false);
  const [depositUser, setDepositUser] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminGetStats();
      setStats(res.data);
    } catch {}
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminGetUsers(usersPage);
      setUsers(res.data.users || res.data.data || []);
      setUsersTotalPages(res.data.totalPages || res.data.pages || 1);
    } catch {}
  }, [usersPage]);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await adminGetTransactions(txPage);
      setTransactions(res.data.transactions || res.data.data || []);
      setTxTotalPages(res.data.totalPages || res.data.pages || 1);
    } catch {}
  }, [txPage]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'transactions') fetchTransactions();
  }, [activeTab, fetchUsers, fetchTransactions]);

  const handleAction = async (key, fn) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      await fn();
    } catch (err) {
      showToast(err.response?.data?.error || t('error'), 'error');
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const tabs = [
    { key: 'stats', label: t('admin.stats'), icon: <BarChart3 size={16} /> },
    { key: 'actions', label: t('admin.title'), icon: <Settings size={16} /> },
    { key: 'users', label: t('admin.users'), icon: <Users size={16} /> },
    { key: 'transactions', label: t('admin.transactions'), icon: <BarChart3 size={16} /> },
  ];

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header animate-fadeIn">
          <Shield size={24} />
          <h1 className="page-title">{t('admin.title')}</h1>
        </div>

        {/* Tabs */}
        <div className="admin-tabs animate-fadeIn delay-100">
          {tabs.map(tab => (
            <button key={tab.key} className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="admin-content animate-fadeInUp delay-200">
          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="admin-stats-grid">
              {[
                { label: t('admin.totalUsers'), value: stats?.totalUsers ?? '—', icon: <Users size={22} />, cls: 'blue' },
                { label: t('admin.totalTx'), value: stats?.totalTransactions ?? '—', icon: <BarChart3 size={22} />, cls: 'purple' },
                { label: t('trade.currentPrice'), value: stats?.currentPrice ? `${stats.currentPrice} TRY` : '—', icon: <DollarSign size={22} />, cls: 'green' },
                { label: t('admin.adminBalance'), value: stats?.adminTokenBalance ?? '—', icon: <Coins size={22} />, cls: 'orange' },
              ].map((s, i) => (
                <div key={i} className={`admin-stat-card stat-${s.cls}`}>
                  <div className="admin-stat-icon">{s.icon}</div>
                  <div className="admin-stat-value">{s.value}</div>
                  <div className="admin-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <div className="admin-actions-grid">
              {/* Set Price */}
              <div className="action-card">
                <h3 className="action-title"><DollarSign size={18} /> {t('admin.setPrice')}</h3>
                <div className="action-body">
                  <input type="number" className="form-input" placeholder={t('admin.newPrice')} value={newPrice} onChange={e => setNewPrice(e.target.value)} />
                  <button className="btn btn-primary" disabled={loading.price || !newPrice}
                    onClick={() => handleAction('price', async () => {
                      await adminSetPrice(newPrice);
                      showToast(t('admin.priceUpdated'), 'success');
                      setNewPrice('');
                      fetchStats();
                    })}>
                    {loading.price ? <Loader2 size={16} className="animate-spin" /> : null}
                    {t('confirm')}
                  </button>
                </div>
              </div>

              {/* Mint */}
              <div className="action-card">
                <h3 className="action-title"><Coins size={18} /> {t('admin.mint')}</h3>
                <div className="action-body">
                  <input type="text" className="form-input" placeholder={t('admin.mintAddress')} value={mintAddr} onChange={e => setMintAddr(e.target.value)} />
                  <input type="number" className="form-input" placeholder={t('admin.mintAmount')} value={mintAmount} onChange={e => setMintAmount(e.target.value)} />
                  <button className="btn btn-primary" disabled={loading.mint || !mintAddr || !mintAmount}
                    onClick={() => handleAction('mint', async () => {
                      await adminMint(mintAddr, mintAmount);
                      showToast(t('admin.mintSuccess'), 'success');
                      setMintAddr(''); setMintAmount('');
                    })}>
                    {loading.mint ? <Loader2 size={16} className="animate-spin" /> : null}
                    {t('confirm')}
                  </button>
                </div>
              </div>

              {/* KYC Register */}
              <div className="action-card">
                <h3 className="action-title"><UserCheck size={18} /> {t('admin.kycRegister')}</h3>
                <div className="action-body">
                  <input type="text" className="form-input" placeholder={t('admin.kycAddress')} value={kycAddr} onChange={e => setKycAddr(e.target.value)} />
                  <button className="btn btn-primary" disabled={loading.kyc || !kycAddr}
                    onClick={() => handleAction('kyc', async () => {
                      await adminKycRegister(kycAddr);
                      showToast(t('admin.kycSuccess'), 'success');
                      setKycAddr('');
                    })}>
                    {loading.kyc ? <Loader2 size={16} className="animate-spin" /> : null}
                    {t('confirm')}
                  </button>
                </div>
              </div>

              {/* KYC Toggle */}
              <div className="action-card">
                <h3 className="action-title">{kycEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />} {t('admin.kycToggle')}</h3>
                <div className="action-body row">
                  <span className="toggle-label">{kycEnabled ? t('admin.kycEnabled') : t('admin.kycDisabled')}</span>
                  <button className={`toggle-btn ${kycEnabled ? 'active' : ''}`}
                    onClick={() => handleAction('kycToggle', async () => {
                      const next = !kycEnabled;
                      await adminKycToggle(next);
                      setKycEnabled(next);
                      showToast(t('success'), 'success');
                    })}>
                    <div className="toggle-thumb" />
                  </button>
                </div>
              </div>

              {/* Deposit TRY */}
              <div className="action-card">
                <h3 className="action-title"><PiggyBank size={18} /> {t('admin.depositTry')}</h3>
                <div className="action-body">
                  <input type="text" className="form-input" placeholder={t('admin.depositUsername')} value={depositUser} onChange={e => setDepositUser(e.target.value)} />
                  <input type="number" className="form-input" placeholder={t('admin.depositAmount')} value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                  <button className="btn btn-primary" disabled={loading.deposit || !depositUser || !depositAmount}
                    onClick={() => handleAction('deposit', async () => {
                      await adminDepositTry(depositUser, depositAmount);
                      showToast(t('admin.depositSuccess'), 'success');
                      setDepositUser(''); setDepositAmount('');
                    })}>
                    {loading.deposit ? <Loader2 size={16} className="animate-spin" /> : null}
                    {t('confirm')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="admin-table-section">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>{t('auth.username')}</th>
                      <th>{t('wallet.address')}</th>
                      <th>{t('trade.tryBalance')}</th>
                      <th>Admin</th>
                      <th>{t('dashboard.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td className="td-bold">{u.username}</td>
                        <td className="td-mono">{u.wallet_address ? `${u.wallet_address.slice(0, 8)}...` : '—'}</td>
                        <td>{Number(u.try_balance || 0).toLocaleString()} TRY</td>
                        <td>{u.is_admin ? '✓' : '—'}</td>
                        <td className="td-date">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {usersTotalPages > 1 && (
                <div className="pagination">
                  <button className="page-btn" onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1}><ChevronLeft size={16} /></button>
                  <span className="page-info">{usersPage} / {usersTotalPages}</span>
                  <button className="page-btn" onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))} disabled={usersPage === usersTotalPages}><ChevronRight size={16} /></button>
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="admin-table-section">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User ID</th>
                      <th>{t('dashboard.type')}</th>
                      <th>{t('dashboard.amount')}</th>
                      <th>TRY</th>
                      <th>{t('dashboard.status')}</th>
                      <th>{t('dashboard.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id}>
                        <td>{tx.id}</td>
                        <td>{tx.user_id}</td>
                        <td><span className={`type-badge ${tx.type}`}>{tx.type === 'buy' ? t('trade.buy') : t('trade.sell')}</span></td>
                        <td className="td-mono">{tx.token_amount} MRT</td>
                        <td className="td-mono">{Number(tx.try_amount).toLocaleString()}</td>
                        <td><span className={`badge badge-${tx.status === 'completed' ? 'success' : tx.status === 'failed' ? 'danger' : 'warning'}`}>{tx.status}</span></td>
                        <td className="td-date">{new Date(tx.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {txTotalPages > 1 && (
                <div className="pagination">
                  <button className="page-btn" onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}><ChevronLeft size={16} /></button>
                  <span className="page-info">{txPage} / {txTotalPages}</span>
                  <button className="page-btn" onClick={() => setTxPage(p => Math.min(txTotalPages, p + 1))} disabled={txPage === txTotalPages}><ChevronRight size={16} /></button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
