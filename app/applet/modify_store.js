const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf-8');
content = content.replace('const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);', 
`const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [downloads, setDownloads] = useState<DownloadedFile[]>(() => { try { const saved = localStorage.getItem('downloads'); return saved ? JSON.parse(saved) : []; } catch (e) { return []; } });
  const addDownload = useCallback((download: DownloadedFile) => { setDownloads(prev => { const updated = [download, ...prev.filter(d => d.id !== download.id)]; safeLocalStorageSetItem('downloads', JSON.stringify(updated)); return updated; }); }, []);`);
content = content.replace('value={{', 'value={{\n    downloads,\n    addDownload,');
fs.writeFileSync('src/store.tsx', content);
console.log('Modified store.tsx');
