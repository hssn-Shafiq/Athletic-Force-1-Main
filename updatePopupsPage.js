const fs = require('fs');
const file = 'd:/my-projects/Af1 Website/frontend/src/app/admin/popups/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Import apiClient
if (!content.includes(`import { apiClient } from '@/lib/api/client';`)) {
    content = content.replace(
      `import { PopupPreview } from '@/admin/components/PopupPreview';`,
      `import { PopupPreview } from '@/admin/components/PopupPreview';\nimport { apiClient } from '@/lib/api/client';`
    );
}

// 2. Add activeDiscounts state
content = content.replace(
  `  const [showTemplateModal, setShowTemplateModal] = useState(false);`,
  `  const [showTemplateModal, setShowTemplateModal] = useState(false);\n  const [activeDiscounts, setActiveDiscounts] = useState<any[]>([]);`
);

// 3. Fetch active discounts
content = content.replace(
  `      const res = await fetchAdminPopups();\n      setPopups(res.popups);`,
  `      const res = await fetchAdminPopups();\n      setPopups(res.popups);\n      const { data } = await apiClient.get('/api/discounts');\n      if (data.ok) setActiveDiscounts(data.discounts.filter((d: any) => d.isActive));`
);

// 4. Update the JSX for discountCode
content = content.replace(
  `                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Discount Code</label>\n                            <input value={editingPopup.discountCode || ''} onChange={e => setEditingPopup({ ...editingPopup, discountCode: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400 uppercase" />`,
  `                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Discount Code</label>\n                            <select value={editingPopup.discountCode || ''} onChange={e => setEditingPopup({ ...editingPopup, discountCode: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400 uppercase">\n                              <option value="">-- None --</option>\n                              {activeDiscounts.map(d => (\n                                <option key={d._id} value={d.code}>{d.code} - {d.type === 'percentage' ? d.value + '%' : '$' + d.value} Off</option>\n                              ))}\n                            </select>`
);

fs.writeFileSync(file, content);
console.log('Done');
