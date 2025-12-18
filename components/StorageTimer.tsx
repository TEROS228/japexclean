import React from 'react';
import { StorageInfo } from '../hooks/useStorage';

interface StorageTimerProps {
  storageInfo: StorageInfo;
  onPayFees?: () => void;
  isPayingFees?: boolean;
}

export default function StorageTimer({ storageInfo, onPayFees, isPayingFees }: StorageTimerProps) {
  if (!storageInfo) return null;

  // Определяем цвет и иконку в зависимости от статуса
  const getStatusColor = () => {
    switch (storageInfo.status) {
      case 'free':
        return storageInfo.freeDaysRemaining <= 5 ? 'orange' : 'green';
      case 'paid':
        return 'orange';
      case 'expired':
        return 'red';
    }
  };

  const getStatusIcon = () => {
    switch (storageInfo.status) {
      case 'free':
        return '🆓';
      case 'paid':
        return '💰';
      case 'expired':
        return '❌';
    }
  };

  const statusColor = getStatusColor();
  const statusIcon = getStatusIcon();

  if (storageInfo.isExpired) {
    return (
      <div style={{
        padding: '12px',
        backgroundColor: '#fee',
        borderLeft: '4px solid #f44',
        borderRadius: '4px',
        marginTop: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#c00' }}>
          ❌ Storage Expired
        </div>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#666' }}>
          This package has gone 10 days without storage payment and has been marked for disposal.
        </p>
      </div>
    );
  }

  if (storageInfo.status === 'free') {
    return (
      <div style={{
        padding: '12px',
        backgroundColor: storageInfo.freeDaysRemaining <= 5 ? '#fff3cd' : '#d4edda',
        borderLeft: `4px solid ${statusColor}`,
        borderRadius: '4px',
        marginTop: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#333' }}>
          {statusIcon} Free Storage
        </div>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#666' }}>
          <strong>{storageInfo.freeDaysRemaining} days</strong> of free storage remaining
        </p>
        {storageInfo.freeDaysRemaining <= 5 && (
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#856404' }}>
            ⚠️ After free storage ends, ¥30/day will be charged. Pay within 10 days to avoid disposal.
          </p>
        )}
      </div>
    );
  }

  if (storageInfo.status === 'paid') {
    // Если все оплачено
    if (storageInfo.unpaidDays === 0) {
      return (
        <div style={{
          padding: '12px',
          backgroundColor: '#d4edda',
          borderLeft: '4px solid green',
          borderRadius: '4px',
          marginTop: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#155724' }}>
            ✅ Paid Storage - All Fees Paid
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#666' }}>
            Storage continues at ¥30/day. Pay regularly to avoid disposal.
          </p>
        </div>
      );
    }

    // Если есть неоплаченные дни
    return (
      <div style={{
        padding: '12px',
        backgroundColor: '#fff3cd',
        borderLeft: '4px solid orange',
        borderRadius: '4px',
        marginTop: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#856404' }}>
          💰 Paid Storage Period
        </div>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#666' }}>
          <strong>{storageInfo.unpaidDays} unpaid days</strong> accumulated
        </p>
        <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
          <strong>{storageInfo.daysUntilDisposal} days</strong> remaining before disposal
        </p>
        <div style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#fff',
          borderRadius: '4px',
          border: '1px solid #ffc107'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Storage Fees</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#333' }}>
                ¥{storageInfo.currentFee.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                {storageInfo.unpaidDays} days × ¥30/day
              </div>
            </div>
            {onPayFees && (
              <button
                onClick={onPayFees}
                disabled={isPayingFees}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isPayingFees ? '#ccc' : '#ffc107',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 600,
                  cursor: isPayingFees ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {isPayingFees ? 'Processing...' : 'Pay Now'}
              </button>
            )}
          </div>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#856404' }}>
          ⚠️ Payment required before requesting shipping
        </p>
      </div>
    );
  }

  return null;
}
