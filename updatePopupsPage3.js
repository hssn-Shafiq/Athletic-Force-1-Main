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
if (!content.includes(`const [activeDiscounts, setActiveDiscounts] = useState<any[]>([])`)) {
    content = content.replace(
      `  const [showTemplateModal, setShowTemplateModal] = useState(false);`,
      `  const [showTemplateModal, setShowTemplateModal] = useState(false);\n  const [activeDiscounts, setActiveDiscounts] = useState<any[]>([]);`
    );
}

// 3. Fetch active discounts
if (!content.includes(`const { data } = await apiClient.get('/api/discounts');`)) {
    content = content.replace(
      `      const res = await fetchAdminPopups();\n      setPopups(res.popups);`,
      `      const res = await fetchAdminPopups();\n      setPopups(res.popups);\n      const { data } = await apiClient.get('/api/discounts');\n      if (data.ok) setActiveDiscounts(data.discounts.filter((d: any) => d.isActive));`
    );
}

// 4. Update the JSX for discountCode
const oldInput = `<input value={editingPopup.discountCode || ''} onChange={e => setEditingPopup({ ...editingPopup, discountCode: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400 uppercase" />`;

const newSelect = `<select value={editingPopup.discountCode || ''} onChange={e => setEditingPopup({ ...editingPopup, discountCode: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400 uppercase">
                              <option value="">-- None --</option>
                              {activeDiscounts.filter(d => !d.isAutomatic).map(d => {
                                let label = '';
                                if (d.type === 'percentage') label = d.value + '% Off';
                                else if (d.type === 'fixed_amount') label = '$' + d.value + ' Off';
                                else if (d.type === 'free_shipping') label = 'Free Shipping';
                                else if (d.type === 'bogo') label = 'BOGO';
                                else label = d.type;
                                return <option key={d._id} value={d.code}>{d.code} - {label}</option>
                              })}
                            </select>`;

content = content.replace(oldInput, newSelect);

fs.writeFileSync(file, content);
console.log('Done');
