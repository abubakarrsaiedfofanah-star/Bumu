import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import '../../../features/commissions/commissions.css';

const formatKes = (amount) => `KES ${Number(amount || 0).toLocaleString('en-KE')}`;

const commissionRate = (progress) => {
  const percent = Number(progress || 0);
  if (percent >= 85) return 0.03;
  if (percent >= 75) return 0.02;
  if (percent >= 65) return 0.01;
  return 0;
};

export default function Commissions({ theme, selectedAction = '', commissions = [], customers = [], onExportCsv }) {
  const paid = commissions.filter((item) => item.status === 'Paid').length;
  const pending = commissions.filter((item) => item.status === 'Pending').length;
  const cancelled = commissions.filter((item) => item.status === 'Cancelled').length;
  const totalEarned = commissions.reduce((sum, item) => sum + item.amount, 0);
  const ledgerByRider = commissions.reduce((acc, item) => {
    const key = String(item.rider || '').trim().toLowerCase();
    if (!key) return acc;
    if (!acc[key] || item.status === 'Paid') acc[key] = item;
    return acc;
  }, {});
  const estimatedRows = customers.map((customer) => {
    const paidAmount = Number(customer.paid || 0);
    const total = Number(customer.totalPrice || 0);
    const progress = total ? Math.round((paidAmount / total) * 100) : Number(customer.progress || 0);
    const rate = commissionRate(progress);
    const ledger = ledgerByRider[String(customer.name || '').trim().toLowerCase()];
    const financeStatus = ledger?.status || (rate > 0 ? 'Waiting Finance' : 'Not eligible yet');
    return {
      id: customer.id,
      rider: customer.name,
      cardId: customer.cardId,
      paidAmount,
      progress,
      rate,
      commission: Math.round(paidAmount * rate),
      status: ledger?.status === 'Paid' ? 'Paid by Finance' : rate > 0 ? 'Estimated / Waiting Finance' : 'Not eligible yet',
      financeStatus,
      financeAmount: Number(ledger?.amount || 0),
      paidByFinance: ledger?.status === 'Paid',
    };
  });
  const eligibleEstimates = estimatedRows.filter((item) => item.rate > 0);
  const totalEstimated = eligibleEstimates.reduce((sum, item) => sum + item.commission, 0);

  const styles = useMemo(() => createStyles(theme), [theme]);
  const show = (...actions) => !selectedAction || actions.includes(selectedAction);

  return (
    <ScrollView style={styles.container}>
      {show('Read totals') && <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, styles.primaryCard]}>
          <Text style={styles.summaryLabel}>Finance Ledger</Text>
          <Text style={styles.summaryValue}>KES {totalEarned.toLocaleString()}</Text>
        </View>
        <View style={[styles.summaryCard, styles.successCard]}>
          <Text style={styles.summaryLabel}>Estimated Commission</Text>
          <Text style={styles.summaryValue}>{formatKes(totalEstimated)}</Text>
        </View>
        <View style={[styles.summaryCard, styles.warningCard]}>
          <Text style={styles.summaryLabel}>Eligible Riders</Text>
          <Text style={styles.summaryValue}>{eligibleEstimates.length}</Text>
        </View>
        <View style={[styles.summaryCard, styles.dangerCard]}>
          <Text style={styles.summaryLabel}>Finance Records</Text>
          <Text style={styles.summaryValue}>{paid + pending + cancelled}</Text>
        </View>
      </View>}

      {show('Read totals', 'Review ledger', 'Export report') && <View style={styles.ruleBox}>
        <Text style={styles.tableTitle}>Commission Estimate Rules</Text>
        <Text style={styles.ruleText}>65% - 74% paid progress: 1% of rider paid amount</Text>
        <Text style={styles.ruleText}>75% - 84% paid progress: 2% of rider paid amount</Text>
        <Text style={styles.ruleText}>85% - 100% paid progress: 3% of rider paid amount</Text>
        <Text style={styles.ruleNote}>Agent portal estimate only. Finance confirms final payout.</Text>
      </View>}

      {show('Read totals', 'Review ledger', 'Export report') && <View style={styles.tableHeader}>
        <Text style={styles.tableTitle}>Commission Estimate Per Rider</Text>
        {show('Export report') && <TouchableOpacity
          style={styles.exportButton}
          onPress={() => onExportCsv('bumu-commission-estimates.csv', [
            ['Rider', 'Card ID', 'Paid Amount', 'Progress %', 'Rate %', 'Estimated Commission', 'Status'],
            ...estimatedRows.map((item) => [item.rider, item.cardId || '', item.paidAmount, item.progress, item.rate * 100, item.commission, item.financeStatus, item.status]),
          ])}
        >
          <Text style={styles.exportButtonText}>Export Estimate</Text>
        </TouchableOpacity>}
      </View>}

      {show('Read totals', 'Review ledger', 'Export report') && estimatedRows.map((item) => (
        <View key={`estimate-${item.id}`} style={styles.commissionRow}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowName}>{item.rider}</Text>
            <Text style={styles.rowMeta}>{item.progress}% paid | Paid amount {formatKes(item.paidAmount)}</Text>
            <Text style={styles.rowMeta}>Rate: {item.rate ? `${item.rate * 100}%` : '0% below threshold'} | {item.status}</Text>
            {item.paidByFinance && <Text style={styles.paidProofText}>Finance paid record: {formatKes(item.financeAmount)}</Text>}
          </View>
          <View style={styles.rowRight}>
            <View style={[styles.paidIcon, item.paidByFinance ? styles.paidIconOn : styles.paidIconOff]}>
              <Text style={[styles.paidIconText, !item.paidByFinance && styles.paidIconTextOff]}>{item.paidByFinance ? '✓' : '-'}</Text>
            </View>
            <Text style={styles.rowAmount}>{formatKes(item.commission)}</Text>
            <Text style={[styles.statusBadge, item.paidByFinance ? styles.statusPaid : item.rate > 0 ? styles.statusPending : styles.statusCancelled]}>{item.paidByFinance ? 'Paid' : item.rate > 0 ? 'Estimate' : 'No commission'}</Text>
          </View>
        </View>
      ))}

      {show('Review ledger', 'Filter by status mentally', 'Export report') && <View style={styles.tableHeader}>
        <Text style={styles.tableTitle}>Finance Commission Ledger</Text>
        {show('Export report') && <TouchableOpacity
          style={styles.exportButton}
          onPress={() => onExportCsv('bumu-commissions.csv', [['Rider', 'Type', 'Amount', 'Status', 'Date'], ...commissions.map((item) => [item.rider, item.type, `KES ${item.amount}`, item.status, item.date])])}
        >
          <Text style={styles.exportButtonText}>Export CSV</Text>
        </TouchableOpacity>}
      </View>}

      {show('Review ledger', 'Filter by status mentally', 'Export report') && commissions.map((item) => (
        <View key={item.id} style={styles.commissionRow}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowName}>{item.rider}</Text>
            <Text style={styles.rowMeta}>{item.type} • {item.date}</Text>
          </View>
          <View style={styles.rowRight}>
            <View style={[styles.paidIcon, item.status === 'Paid' ? styles.paidIconOn : styles.paidIconOff]}>
              <Text style={[styles.paidIconText, item.status !== 'Paid' && styles.paidIconTextOff]}>{item.status === 'Paid' ? '✓' : '-'}</Text>
            </View>
            <Text style={styles.rowAmount}>KES {item.amount.toLocaleString()}</Text>
            <Text style={[styles.statusBadge, item.status === 'Paid' ? styles.statusPaid : item.status === 'Pending' ? styles.statusPending : styles.statusCancelled]}>{item.status}</Text>
          </View>
        </View>
      ))}

      {show('Review ledger', 'Filter by status mentally', 'Export report') && !commissions.length && <Text style={styles.emptyText}>No commission records yet.</Text>}
    </ScrollView>
  );
}

const createStyles = (theme) => {
  const dark = theme === 'dark';
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
      paddingVertical: 16,
      paddingHorizontal: 0,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 14,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    summaryCard: {
      flexGrow: 1,
      flexBasis: 220,
      backgroundColor: dark ? '#092a75' : '#f5f8ff',
      borderRadius: 16,
      padding: 18,
      minHeight: 110,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 3,
    },
    summaryLabel: {
      fontSize: 13,
      color: dark ? '#aebbd0' : '#627083',
      marginBottom: 10,
      fontFamily: 'Georgia',
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '800',
      color: dark ? '#f3f6fb' : '#0b1730',
      fontFamily: 'Georgia',
    },
    primaryCard: {
      borderColor: '#dce3ea',
      borderWidth: 1,
    },
    successCard: {
      borderColor: '#2f7cff',
      borderWidth: 1,
    },
    warningCard: {
      borderColor: '#b86800',
      borderWidth: 1,
    },
    dangerCard: {
      borderColor: '#bd2a2a',
      borderWidth: 1,
    },
    tableHeader: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    tableTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: dark ? '#f3f6fb' : '#0b1730',
      fontFamily: 'Georgia',
    },
    ruleBox: {
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: dark ? '#11264b' : '#d8e3f7',
      backgroundColor: dark ? '#092a75' : '#f5f8ff',
      borderRadius: 14,
      padding: 16,
      gap: 6,
    },
    ruleText: {
      color: dark ? '#f3f6fb' : '#0b1730',
      fontSize: 13,
      fontFamily: 'Georgia',
      lineHeight: 19,
    },
    ruleNote: {
      color: '#0f5fff',
      fontSize: 12,
      fontWeight: '900',
      fontFamily: 'Georgia',
      marginTop: 4,
    },
    exportButton: {
      backgroundColor: '#0f5fff',
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    exportButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontFamily: 'Georgia',
      fontWeight: '700',
    },
    commissionRow: {
      backgroundColor: dark ? '#092a75' : '#f5f8ff',
      borderRadius: 18,
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 18,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: dark ? '#11264b' : '#e6eef3',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
      elevation: 3,
    },
    rowLeft: {
      flex: 1,
      minWidth: 210,
      marginRight: 14,
    },
    rowName: {
      fontSize: 15,
      fontWeight: '700',
      color: dark ? '#f3f6fb' : '#0b1730',
      fontFamily: 'Georgia',
      marginBottom: 4,
    },
    rowMeta: {
      fontSize: 12,
      color: dark ? '#aebbd0' : '#627083',
      fontFamily: 'Georgia',
    },
    rowRight: {
      alignItems: 'flex-end',
      minWidth: 110,
    },
    paidIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      borderWidth: 1,
    },
    paidIconOn: {
      backgroundColor: '#0f5fff',
      borderColor: '#0f5fff',
    },
    paidIconOff: {
      backgroundColor: dark ? '#111b24' : '#ffffff',
      borderColor: dark ? '#26364a' : '#d8e3f7',
    },
    paidIconText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '900',
      fontFamily: 'Georgia',
    },
    paidIconTextOff: {
      color: dark ? '#b8c3d7' : '#627083',
    },
    rowAmount: {
      fontSize: 15,
      fontWeight: '700',
      color: dark ? '#f3f6fb' : '#0b1730',
      fontFamily: 'Georgia',
      marginBottom: 8,
    },
    paidProofText: {
      color: '#0f5fff',
      fontSize: 12,
      fontWeight: '900',
      fontFamily: 'Georgia',
      marginTop: 4,
    },
    statusBadge: {
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 12,
      fontSize: 11,
      fontFamily: 'Georgia',
      color: '#ffffff',
      overflow: 'hidden',
    },
    statusPaid: {
      backgroundColor: '#2f7cff',
    },
    statusPending: {
      backgroundColor: '#b86800',
    },
    statusCancelled: {
      backgroundColor: '#bd2a2a',
    },
    emptyText: {
      marginTop: 24,
      textAlign: 'center',
      color: dark ? '#aebbd0' : '#627083',
      fontFamily: 'Georgia',
    },
  });
};
