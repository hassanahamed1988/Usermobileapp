import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportServiceRecordToPDF = (record: any, language: string = 'en') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isBn = language === 'bn';

  // Title & Header
  doc.setFillColor(14, 165, 233); // Sky blue
  doc.rect(0, 0, 210, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FLEETPRO - SERVICE RECORD REPORT', 15, 16);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated Date: ${new Date().toLocaleDateString('en-GB')}`, 15, 33);

  // Box details
  let y = 42;
  const items = [
    ['Vehicle Number', record.vehicleNumber || '—'],
    ['Service Category', `${record.serviceType || 'General'} Service`],
    [
      record.serviceType === 'Oil' ? 'Oil Validity' : 'Service Cost',
      record.serviceType === 'Oil'
        ? `${(record.oilValidity || 0).toLocaleString()} KM`
        : `BDT ${record.serviceCost?.toLocaleString() || '0'}`
    ],
    ['Service Date', record.serviceDate || '—'],
    ['Current Kilometer', `${record.currentKilometer?.toLocaleString() || 0} KM`],
    ['Next Service Due', record.nextServiceKilometer ? `${record.nextServiceKilometer.toLocaleString()} KM` : '—'],
  ];

  if (record.serviceType === 'Oil') {
    if (record.oilType) items.push(['Oil Grade', record.oilType]);
    if (record.oilQuantity) items.push(['Oil Quantity', `${record.oilQuantity} L`]);
  }

  items.push(
    ['Workshop / Provider', record.workshopProvider || '—'],
    ['Recorded By', record.createdBy || 'System'],
    ['Notes / Description', record.descriptionNotes || 'None']
  );

  doc.setLineWidth(0.3);
  doc.setDrawColor(220, 220, 220);

  items.forEach(([label, value], idx) => {
    // Fill alternating row background
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 10, 'F');
    }
    doc.rect(15, y, 180, 10, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(String(label).toUpperCase(), 18, y + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(String(value), 105, y + 6.5);

    y += 10;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('FleetPro Management System • Confidential Service Report', 15, 285);

  doc.save(`Service_Record_${record.vehicleNumber}_${record.serviceDate}.pdf`);
};

export const exportServiceRecordToPNG = async (elementId: string, vehicleNumber: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#0f172a', // Dark theme background for sharp mobile screenshot look
      logging: false,
    });

    const link = document.createElement('a');
    link.download = `Service_Record_${vehicleNumber}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  } catch (error) {
    console.error('PNG Export failed:', error);
  }
};

export const exportVehicleToPDF = (vehicle: any, language: string = 'en') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Title & Header
  doc.setFillColor(14, 165, 233); // Sky blue
  doc.rect(0, 0, 210, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FLEETPRO - VEHICLE DETAILS REPORT', 15, 16);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated Date: ${new Date().toLocaleDateString('en-GB')}`, 15, 33);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  let y = 42;
  const items = [
    ['Vehicle Number', vehicle.vehicleNumber || '—'],
    ['Trailer Number', vehicle.trailerNumber || '—'],
    ['Vehicle Permit Expiry', formatDate(vehicle.vehiclePermitExpiry)],
    ['Trailer Permit Expiry', formatDate(vehicle.trailerPermitExpiry)],
    ['Assigned Date', formatDate(vehicle.vehicleAssignedDate)],
    ['Current Status', vehicle.status || 'Active'],
  ];

  doc.setLineWidth(0.3);
  doc.setDrawColor(220, 220, 220);

  items.forEach(([label, value], idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 12, 'F');
    }
    doc.rect(15, y, 180, 12, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(String(label).toUpperCase(), 18, y + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(String(value), 105, y + 7.5);

    y += 12;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('FleetPro Management System • Confidential Vehicle Document', 15, 285);

  doc.save(`Vehicle_Details_${vehicle.vehicleNumber}.pdf`);
};

export const exportVehicleToPNG = async (elementId: string, vehicleNumber: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#0f172a',
      logging: false,
    });

    const link = document.createElement('a');
    link.download = `Vehicle_Details_${vehicleNumber}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  } catch (error) {
    console.error('PNG Export failed:', error);
  }
};
