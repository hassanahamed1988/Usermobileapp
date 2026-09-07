import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FileOpener } from '@capacitor-community/file-opener';
import type { jsPDF } from 'jspdf';

export const downloadPdf = async (doc: jsPDF, fileName: string, showFeedback: (msg: string, type?: 'success'|'error'|'warning'|'info') => void, language: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const pdfBase64 = doc.output("datauristring").split(",")[1];
      // Use Directory.Cache which does not require any storage permissions on Android/iOS
      const tempResult = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Cache,
      });

      showFeedback(
        language === "bn"
          ? `ডাউনলোড সফল হয়েছে!`
          : `Download Successful!`,
        "success"
      );

      try {
        await FileOpener.open({
          filePath: tempResult.uri,
          contentType: "application/pdf",
          openWithDefault: false,
        });
      } catch (openErr) {
        try {
          await Share.share({
            title: fileName,
            url: tempResult.uri,
            dialogTitle: language === 'bn' ? 'Google Drive-এ সেভ করুন বা শেয়ার করুন' : 'Save to Google Drive or Share'
          });
        } catch (shareErr) {
          console.error("Share error:", shareErr);
        }
      }
    } catch (err: any) {
      console.error("Native cache file save error:", err);
      // Fallback to Documents if Cache fails (will ask for permission if needed)
      try {
        const pdfBase64 = doc.output("datauristring").split(",")[1];
        const result = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents,
        });

        showFeedback(
          language === "bn"
            ? `ডাউনলোড সফল হয়েছে! ডকুমেন্টস ফোল্ডারে সেভ করা হয়েছে।`
            : `Download Successful! Saved to Documents.`,
          "success"
        );

        try {
          await FileOpener.open({
            filePath: result.uri,
            contentType: "application/pdf",
            openWithDefault: false,
          });
        } catch (openErr2) {
          try {
            await Share.share({
              title: fileName,
              url: result.uri,
              dialogTitle: language === 'bn' ? 'Google Drive-এ সেভ করুন বা শেয়ার করুন' : 'Save to Google Drive or Share'
            });
          } catch (shareErr2) {
            console.error("Share fallback error:", shareErr2);
          }
        }
      } catch (docErr) {
        console.error("Documents fallback error:", docErr);
        showFeedback(language === 'bn' ? 'ডাউনলোড ব্যর্থ হয়েছে। স্টোরেজ পারমিশন চেক করুন।' : 'Download failed. Please check storage permissions.', 'error');
      }
    }
  } else {
    doc.save(fileName);
    showFeedback(
      language === "bn"
        ? `ডাউনলোড সফল হয়েছে!`
        : `Download Successful!`,
      "success"
    );
  }
};
