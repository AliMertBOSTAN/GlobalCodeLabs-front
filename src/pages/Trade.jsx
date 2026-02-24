import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n';
import { showToast } from '../components/Toast';
import { getPrice, getBalance, previewBuy, previewSell, buyToken, sellToken } from '../services/blockchain';
import { ArrowDownUp, TrendingUp, Wallet, ArrowRight, Loader2, RefreshCw, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import './Trade.css';

export default function Trade() {
  const { t } = useI18n();
  const { walletAddress, refreshUser } = useAuth();
  const [tab, setTab] = useState('buy');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [price, setPrice] = useState(null);
  const [balance, setBalance] = useState({ try_balance: 0, token_balance: '0' });
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [priceRes, balRes] = await Promise.allSettled([
        getPrice(),
        getBalance()
      ]);
      if (priceRes.status === 'fulfilled') setPrice(priceRes.value.data.price ?? priceRes.value.data);
      if (balRes.status === 'fulfilled') setBalance(balRes.value.data);
    } catch {}
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Preview
  useEffect(() => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setPreviewData(null);
      return;
    }
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = tab === 'buy'
          ? await previewBuy(amount)
          : await previewSell(amount);
        setPreviewData(res.data);
      } catch {
        setPreviewData(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [amount, tab]);

  // Buy / Sell
  const handleBuy = async () => {
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);
    try {
      await buyToken(amount);
      showToast(t('trade.buySuccess'), 'success');
      setAmount('');
      setPreviewData(null);
      fetchData();
      refreshUser();
    } catch (err) {
      showToast(err.response?.data?.error || t('error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!txHash.trim()) return;
    setLoading(true);
    try {
      await sellToken(txHash);
      showToast(t('trade.sellSuccess'), 'success');
      setTxHash('');
      fetchData();
      refreshUser();
    } catch (err) {
      showToast(err.response?.data?.error || t('error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const setMaxAmount = () => {
    if (tab === 'buy') {
      if (price && balance.try_balance) {
        setAmount(String(Math.floor((balance.try_balance / price) * 100) / 100));
      }
    } else {
      setAmount(balance.token_balance || '0');
    }
  };

  return (
    <div className="trade-page">
      <div className="container">
        {/* Price & Balance Row */}
        <div className="trade-info-grid animate-fadeIn">
          <div className="info-card">
            <div className="info-icon price-icon"><TrendingUp size={20} /></div>
            <div>
              <div className="info-label">{t('trade.currentPrice')}</div>
              <div className="info-value">{price ?? '—'} <span className="info-unit">TRY</span></div>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon try-icon"><Wallet size={20} /></div>
            <div>
              <div className="info-label">{t('trade.tryBalance')}</div>
              <div className="info-value">{Number(balance.try_balance || 0).toLocaleString()} <span className="info-unit">TRY</span></div>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon token-icon"><ArrowDownUp size={20} /></div>
            <div>
              <div className="info-label">{t('trade.tokenBalance')}</div>
              <div className="info-value">{Number(balance.token_balance || 0).toLocaleString()} <span className="info-unit">MRT</span></div>
            </div>
          </div>
          <div className="info-card wallet-card">
            {walletAddress ? (
              <div className="wallet-status connected">
                <CheckCircle size={16} />
                <span className="wallet-addr">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              </div>
            ) : (
              <div className="wallet-status">
                <AlertCircle size={16} />
                <span>{t('trade.walletRequired')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Trade Card */}
        <div className="trade-card animate-fadeInUp delay-100">
          {/* Tabs */}
          <div className="trade-tabs">
            <button className={`trade-tab ${tab === 'buy' ? 'active buy' : ''}`} onClick={() => { setTab('buy'); setAmount(''); setPreviewData(null); }}>
              {t('trade.buy')} MRT
            </button>
            <button className={`trade-tab ${tab === 'sell' ? 'active sell' : ''}`} onClick={() => { setTab('sell'); setAmount(''); setPreviewData(null); }}>
              {t('trade.sell')} MRT
            </button>
          </div>

          <div className="trade-body">
            {tab === 'buy' ? (
              <>
                <div className="form-group">
                  <div className="form-label-row">
                    <label className="form-label">{t('trade.tokenAmount')}</label>
                    <button className="max-btn" onClick={setMaxAmount}>{t('trade.maxAmount')}</button>
                  </div>
                  <div className="trade-input-wrapper">
                    <input
                      type="number"
                      className="form-input trade-input"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="any"
                    />
                    <span className="trade-input-unit">MRT</span>
                  </div>
                </div>

                {/* Preview */}
                {previewLoading && <div className="preview-loading"><Loader2 size={16} className="animate-spin" /> {t('trade.preview')}...</div>}
                {previewData && !previewLoading && (
                  <div className="preview-card">
                    <div className="preview-row">
                      <span>{t('trade.youPay')}</span>
                      <span className="preview-value">{previewData.tryNeeded ?? previewData.try_amount ?? amount * price} TRY</span>
                    </div>
                    <div className="preview-row">
                      <span>{t('trade.youReceive')}</span>
                      <span className="preview-value highlight">{previewData.tokensOut ?? previewData.token_amount ?? amount} MRT</span>
                    </div>
                    <div className="preview-row">
                      <span>{t('trade.price')}</span>
                      <span className="preview-value">{price} TRY/MRT</span>
                    </div>
                  </div>
                )}

                <button className="btn btn-primary btn-full trade-submit" onClick={handleBuy} disabled={loading || !amount || !walletAddress}>
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  {t('trade.confirmBuy')}
                </button>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">{t('trade.txHash')}</label>
                  <div className="trade-input-wrapper">
                    <input
                      type="text"
                      className="form-input trade-input"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      placeholder="0x..."
                    />
                    <button className="input-copy-btn" onClick={() => navigator.clipboard.readText().then(setTxHash)}>
                      <Copy size={16} />
                    </button>
                  </div>
                  <p className="form-hint">{t('trade.enterTxHash')}</p>
                </div>

                <button className="btn btn-primary btn-full trade-submit sell" onClick={handleSell} disabled={loading || !txHash.trim() || !walletAddress}>
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  {t('trade.confirmSell')}
                </button>
              </>
            )}

            {!walletAddress && (
              <div className="trade-warning">
                <AlertCircle size={16} />
                {t('trade.walletRequired')}
              </div>
            )}
          </div>
        </div>

        {/* Refresh */}
        <div className="trade-refresh">
          <button className="btn btn-ghost btn-sm" onClick={fetchData}>
            <RefreshCw size={14} /> {t('loading').replace('...', '')}
          </button>
        </div>
      </div>
    </div>
  );
}
