import { Payment, Trip, MonthlyFile } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';

export class PaymentManager {
  static generateTransactionId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `TXN-${timestamp}-${random}`;
  }

  static calculateSummary(payments: Payment[] = [], month: number | 'ALL', year: number | 'ALL') {
    const listPayments = Array.isArray(payments) ? payments : [];
    const filtered = listPayments.filter(p => {
      const monthMatch = month === 'ALL' ? true : Number(p.month) === Number(month);
      const yearMatch = year === 'ALL' ? true : Number(p.year) === Number(year);
      return monthMatch && yearMatch && p.category !== 'User Renew';
    });
    
    const totalIncome = filtered
      .filter(p => p.type === 'INCOME' && p.status === 'RECEIVED')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
    const pendingIncome = filtered
      .filter(p => p.type === 'INCOME' && p.status === 'PENDING')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
    const totalDeduction = filtered
      .filter(p => p.type === 'DEDUCTION')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
    const categoryBreakdown = filtered.reduce((acc, p) => {
      if (p.status === 'RECEIVED' || p.type === 'DEDUCTION') {
        const cat = p.category || 'OTHERS';
        if (!acc[cat]) acc[cat] = 0;
        acc[cat] += (Number(p.amount) || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    const net = totalIncome - totalDeduction;

    return {
      totalIncome: isNaN(totalIncome) ? 0 : totalIncome,
      pendingIncome: isNaN(pendingIncome) ? 0 : pendingIncome,
      totalDeduction: isNaN(totalDeduction) ? 0 : totalDeduction,
      netAmount: isNaN(net) ? 0 : net,
      categoryBreakdown,
      transactions: filtered
    };
  }

  static getPendingDues(trips: Trip[] = [], monthlyFiles: MonthlyFile[] = [], payments: Payment[] = [], categoryFilter?: string) {
    const listTrips = Array.isArray(trips) ? trips : [];
    const listFiles = Array.isArray(monthlyFiles) ? monthlyFiles : [];
    const listPayments = Array.isArray(payments) ? payments : [];
    const pendingByFile: any[] = [];

    // Calculate total advance diesel received
    const totalAdvanceDiesel = listPayments
      .filter(p => 
        (p.category || '').toLowerCase() === 'advance' && 
        p.details?.advanceType === 'TAKEN' && 
        p.status === 'RECEIVED' && 
        (
          (p.details?.advanceReason || '').toLowerCase().includes('diesel') || 
          (p.details?.advanceReason || '').toLowerCase().includes('ডিজেল') ||
          (p.details?.serviceName || '').toLowerCase().includes('diesel') ||
          (p.details?.serviceName || '').toLowerCase().includes('ডিজেল')
        )
      )
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    let remainingAdvanceDiesel = totalAdvanceDiesel;

    // Sort files chronologically to apply advance to oldest dues first
    const sortedFiles = [...listFiles].sort((a, b) => a.year - b.year || a.month - b.month);

    // 1. Process Trip-based Dues (grouped by Monthly File)
    sortedFiles.forEach(file => {
      const fileTrips = listTrips.filter(t => t.fileId === file.id);
      const pendingCategories: any[] = [];

      const addCategoryItems = (category: string, subkeysConfig: { key: string, paidField: string, label: string }[]) => {
        if (categoryFilter && categoryFilter.toUpperCase() !== category.toUpperCase()) return;

        const items: any[] = [];

        fileTrips.forEach(t => {
          if (category.toUpperCase() === 'TRIP DIESEL' && t.category === 'EXTRA_FUEL') return;
          if (category.toUpperCase() === 'EXTRA FUEL' && t.category !== 'EXTRA_FUEL') return;

          subkeysConfig.forEach(sub => {
            const isGenReason = t.extraDieselReason?.toLowerCase() === 'generator diesel';
            let totalVal = 0;
            let directPaid = 0;

            if (sub.key === 'generatorDiesel') {
              totalVal = (t.generatorDiesel as number) || 0;
              directPaid = (t.generatorDieselPaid as number) || 0;
            } else if (sub.key === 'extraDiesel') {
              totalVal = (t.extraDiesel as number) || 0;
              directPaid = (t.extraDieselPaid as number) || 0;
            } else if (sub.key === 'dieselPrice') {
              totalVal = (t.dieselPrice as number) || 0;
              directPaid = (t.dieselPaid as number) || 0;
            } else {
              totalVal = (t[sub.key as keyof Trip] as number) || 0;
              directPaid = (t[sub.paidField as keyof Trip] as number) || 0;
            }

            if (totalVal <= 0) return;

            // Calculate paid amount
            const paymentsPaid = listPayments
              .filter(p => (p.category || '').toUpperCase() === category.toUpperCase() && p.status === 'RECEIVED' && p.type !== 'DEDUCTION')
              .reduce((sum, p) => {
                if (!p.details?.pendingItems) return sum;
                const exactVal = p.details.pendingItems[`${t.id}-${sub.key}`];
                if (exactVal !== undefined) return sum + exactVal;
                
                // Fallback for old style entries
                const legacyVal = p.details.pendingItems[t.id];
                if (legacyVal !== undefined && sub.key === 'dieselPrice') {
                  return sum + legacyVal;
                }
                return sum;
              }, 0);

            const paidVal = Math.max(directPaid, paymentsPaid);
            let pendingVal = Math.max(0, totalVal - paidVal);
            let adjustedPaidVal = paidVal;

            // Advance Diesel is no longer deducted from individual specific trips as per user request.
            // It will be consolidated and deducted only from the total/summary level.

            const isTripDieselCategory = category.toLowerCase() === 'trip diesel';
            if (pendingVal > 0 || (isTripDieselCategory && pendingVal < 0)) {
              const labelName = (sub.key === 'extraDiesel' && t.extraDieselReason) ? t.extraDieselReason : sub.label;
              const isExtraFuelType = category.toUpperCase() === 'EXTRA FUEL' || t.category === 'EXTRA_FUEL';
              const label = isExtraFuelType 
                ? labelName 
                : `${labelName} - Trip: ${t.containerNumber || 'N/A'} - ${t.invoiceNumber || 'N/A'}`;
              items.push({
                id: `${t.id}-${sub.key}`,
                label: label,
                total: totalVal,
                paid: adjustedPaidVal,
                pending: pendingVal,
                amount: pendingVal,
                date: t.loadingDate,
                type: 'TRIP_DUE',
                details: {
                  containerNumber: t.containerNumber,
                  invoiceNumber: t.invoiceNumber,
                  companyName: t.companyName,
                  vehicleNumber: t.vehicleNumber,
                  deliveryPlace: (t as any).deliveryPlace || '',
                  loadingPlace: (t as any).loadingPlace || '',
                  subType: sub.key
                }
              });
            }
          });
        });

        if (items.length > 0) {
          const catPending = items.reduce((sum, i) => sum + (Number(i.pending) || 0), 0);
          pendingCategories.push({
            name: category,
            totalPending: isNaN(catPending) ? 0 : catPending,
            items
          });
        }
      };

      // Define configurations for each category
      addCategoryItems('Trip Diesel', [
        { key: 'dieselPrice', paidField: 'dieselPaid', label: 'Trip Diesel' },
        { key: 'generatorDiesel', paidField: 'generatorDieselPaid', label: 'Generator Diesel' },
        { key: 'friday', paidField: 'fridayPaid', label: 'Friday' }
      ]);

      const addAggregatedCategoryItems = (category: string, subkeysConfig: { key: string, paidField: string, label: string }[]) => {
        if (categoryFilter && categoryFilter.toUpperCase() !== category.toUpperCase()) return;

        const items: any[] = [];
        subkeysConfig.forEach(sub => {
          const companyMap: { [companyName: string]: { total: number, directPaid: number } } = {};
          
          fileTrips.forEach(t => {
            let totalVal = (t[sub.key as keyof Trip] as number) || 0;
            if (totalVal <= 0) return;
            let directPaid = (t[sub.paidField as keyof Trip] as number) || 0;

            const compName = (t.companyName && t.companyName !== 'N/A') ? t.companyName : 'Unknown Company';
            if (!companyMap[compName]) {
              companyMap[compName] = { total: 0, directPaid: 0 };
            }
            companyMap[compName].total += totalVal;
            companyMap[compName].directPaid += directPaid;
          });

          Object.keys(companyMap).forEach(compName => {
            const aggId = `AGG-${sub.key}-${file.id}-${compName.replace(/\s+/g, '_')}`;
            const totalVal = companyMap[compName].total;
            const directPaid = companyMap[compName].directPaid;

            const paymentsPaid = listPayments
              .filter(p => (p.category || '').toUpperCase() === category.toUpperCase() && p.status === 'RECEIVED')
              .reduce((sum, p) => {
                if (!p.details?.pendingItems) return sum;
                const exactVal = p.details.pendingItems[aggId];
                if (exactVal !== undefined) return sum + exactVal;
                
                let legacySum = 0;
                fileTrips.filter(t => (t.companyName === compName || (!t.companyName && compName === 'Unknown Company'))).forEach(t => {
                   const legVal = p.details.pendingItems[`${t.id}-${sub.key}`];
                   if (legVal !== undefined) legacySum += legVal;
                });
                return sum + legacySum;
              }, 0);

            const paidVal = Math.max(directPaid, paymentsPaid);
            const pendingVal = Math.max(0, totalVal - paidVal);

            if (pendingVal > 0) {
              const monthName = new Date(0, file.month - 1).toLocaleString('default', { month: 'long' });
              
              const tripsForCompany = fileTrips.filter(t => (t.companyName === compName || (!t.companyName && compName === 'Unknown Company')) && ((t[sub.key as keyof Trip] as number) || 0) > 0);
              const containerNumbers = Array.from(new Set(tripsForCompany.map(t => t.containerNumber).filter(Boolean))).join(', ');
              
              items.push({
                id: aggId,
                label: `${compName}`,
                total: totalVal,
                paid: paidVal,
                pending: pendingVal,
                amount: pendingVal,
                date: tripsForCompany[0]?.loadingDate || new Date().toISOString(),
                type: 'TRIP_DUE',
                details: {
                  companyName: compName,
                  subType: sub.key,
                  tripMonthAndYear: `${monthName} ${file.year}`,
                  containerNumber: containerNumbers || 'N/A'
                }
              });
            }
          });
        });

        if (items.length > 0) {
          const catPending = items.reduce((sum, i) => sum + (Number(i.pending) || 0), 0);
          pendingCategories.push({
            name: category,
            totalPending: isNaN(catPending) ? 0 : catPending,
            items
          });
        }
      };

      addCategoryItems('Commission', [
        { key: 'commission', paidField: 'commissionPaid', label: 'Commission' }
      ]);

      addCategoryItems('Bonus', [
        { key: 'bonus', paidField: 'bonusPaid', label: 'Bonus' }
      ]);

      addCategoryItems('Overtime', [
        { key: 'overtime', paidField: 'overtimePaid', label: 'Overtime' }
      ]);

      addCategoryItems('Extra Fuel', [
        { key: 'extraDiesel', paidField: 'extraDieselPaid', label: 'Extra Fuel' }
      ]);

      if (pendingCategories.length > 0) {
        pendingByFile.push({
          fileId: file.id,
          month: file.month,
          year: file.year,
          totalPending: pendingCategories.reduce((sum, c) => sum + c.totalPending, 0),
          categories: pendingCategories
        });
      }
    });

    // Excess advance diesel adjustment card has been completely removed as per user request to not create any cards/items inside specific category sections.

    // 2. Process Direct PENDING Payments (not linked to trips)
    const directPending = listPayments.filter(p => 
      p.status === 'PENDING' && 
      p.type === 'INCOME' &&
      (!p.details?.pendingItems || Object.keys(p.details.pendingItems).length === 0) &&
      (!categoryFilter || (p.category || '').toUpperCase() === categoryFilter.toUpperCase())
    );

    directPending.forEach(p => {
      let fileGroup = pendingByFile.find(f => Number(f.month) === Number(p.month) && Number(f.year) === Number(p.year));
      if (!fileGroup) {
        fileGroup = {
          fileId: `DIRECT-${p.month}-${p.year}`,
          month: p.month,
          year: p.year,
          totalPending: 0,
          categories: []
        };
        pendingByFile.push(fileGroup);
      }

      let catGroup = fileGroup.categories.find((c: any) => (c.name || '').toUpperCase() === (p.category || '').toUpperCase());
      if (!catGroup) {
        catGroup = {
          name: p.category,
          totalPending: 0,
          items: []
        };
        fileGroup.categories.push(catGroup);
      }

      const pAmount = Number(p.amount) || 0;
      catGroup.items.push({
        id: p.id,
        label: p.details?.serviceName || `Pending ${p.category}`,
        total: pAmount,
        paid: 0,
        pending: pAmount,
        amount: pAmount,
        date: p.date,
        type: 'DIRECT_PENDING',
        details: p.details
      });
      catGroup.totalPending += pAmount;
      fileGroup.totalPending += pAmount;
    });

    return pendingByFile.sort((a, b) => b.year - a.year || b.month - a.month);
  }

  static async exportToCSV(payments: Payment[]) {
    const headers = ['Transaction ID', 'Date', 'Time', 'Type', 'Category', 'Amount', 'Method'];
    const rows = payments.map(p => [
      p.transactionId,
      p.date,
      p.time,
      p.type,
      p.category,
      p.amount,
      p.method
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const fileName = `statement_${new Date().toISOString().split('T')[0]}.csv`;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: csvContent,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });

        alert(`Download Successful!\nFile saved to your phone's Documents folder.`);

        await FileOpener.open({
          filePath: result.uri,
          contentType: 'text/csv',
          openWithDefault: false,
        });
      } catch (err) {
        console.error("Native file save error:", err);
        try {
          const tempResult = await Filesystem.writeFile({
            path: fileName,
            data: csvContent,
            directory: Directory.Cache,
            encoding: Encoding.UTF8
          });
          
          await FileOpener.open({
            filePath: tempResult.uri,
            contentType: 'text/csv',
            openWithDefault: false,
          });
        } catch (shareErr) {
          console.error("Share fallback error:", shareErr);
          alert('Download failed. Please check storage permissions.');
        }
      }
    } else {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
